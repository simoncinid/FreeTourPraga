import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { database, localMode } from "./store";

export class StaffError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function constantEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

export type StaffAccount = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordEnc: string | null;
  paused: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StaffPublic = {
  id: string;
  email: string;
  name: string;
  paused: boolean;
  createdAt: string;
  updatedAt: string;
  password: string | null;
  passwordVisible: boolean;
  isSelf: boolean;
};

type EnvStaff = {
  email: string;
  passwordHash: string;
  role?: string;
};

function sessionSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production")
      throw new StaffError(
        503,
        "Configurare SESSION_SECRET (almeno 32 caratteri)",
      );
    return "local-only-secret-please-configure-production";
  }
  return s;
}

function encKey() {
  return createHash("sha256").update(`staff-pass:${sessionSecret()}`).digest();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function sealPassword(password: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encKey(), iv);
  const enc = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function openPassword(sealed: string | null | undefined) {
  if (!sealed) return null;
  try {
    const [ivB64, tagB64, dataB64] = sealed.split(".");
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encKey(),
      Buffer.from(ivB64, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export function verifyStaffPassword(password: string, encoded: string) {
  try {
    const [salt, key] = encoded.split(":");
    return constantEqual(
      scryptSync(password, salt, 64).toString("hex"),
      key,
    );
  } catch {
    return false;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function staffFile() {
  const data = process.env.PLATFORM_DATA_FILE;
  if (data) return resolve(dirname(data), "staff-users.json");
  return resolve(".data/staff-users.json");
}

function envStaff(): EnvStaff[] {
  try {
    const users = JSON.parse(process.env.STAFF_USERS || "[]") as EnvStaff[];
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function fromEnv(users: EnvStaff[]): StaffAccount[] {
  const now = new Date().toISOString();
  return users
    .filter(
      (u) =>
        typeof u?.email === "string" &&
        typeof u?.passwordHash === "string" &&
        /^([a-f0-9]{32}):([a-f0-9]{128})$/.test(u.passwordHash),
    )
    .map((u) => ({
      id: randomUUID(),
      email: normalizeEmail(u.email),
      name: normalizeEmail(u.email).split("@")[0] || "Staff",
      passwordHash: u.passwordHash,
      passwordEnc: null,
      paused: false,
      createdAt: now,
      updatedAt: now,
    }));
}

async function readLocal(): Promise<StaffAccount[]> {
  try {
    const raw = await readFile(staffFile(), "utf8");
    const parsed = JSON.parse(raw) as StaffAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocal(users: StaffAccount[]) {
  const file = staffFile();
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(users, null, 2), { mode: 0o600 });
  await rename(tmp, file);
}

async function readDb(): Promise<StaffAccount[]> {
  const rows = await database().adminUser.findMany({
    orderBy: { createdAt: "asc" },
  });
  return rows
    .filter((r) => r.passwordHash.length > 0)
    .map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      passwordHash: r.passwordHash,
      passwordEnc: r.passwordEnc,
      paused: r.paused,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
}

async function ensureSeeded(): Promise<StaffAccount[]> {
  if (localMode()) {
    let users = await readLocal();
    if (!users.length) {
      users = fromEnv(envStaff());
      if (users.length) await writeLocal(users);
    }
    return users;
  }
  let users = await readDb();
  if (!users.length) {
    const db = database();
    await db.adminUser.deleteMany({ where: { passwordHash: "" } });
    const seed = fromEnv(envStaff());
    if (seed.length) {
      for (const u of seed) {
        await db.adminUser.upsert({
          where: { email: u.email },
          create: {
            id: u.id,
            email: u.email,
            name: u.name,
            role: "admin",
            passwordHash: u.passwordHash,
            passwordEnc: u.passwordEnc,
            paused: false,
            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt),
          },
          update: {
            name: u.name,
            role: "admin",
            passwordHash: u.passwordHash,
            passwordEnc: u.passwordEnc,
            paused: false,
            updatedAt: new Date(u.updatedAt),
          },
        });
      }
      users = await readDb();
    }
  }
  return users;
}

export async function listStaffAccounts(): Promise<StaffAccount[]> {
  return ensureSeeded();
}

export async function findStaffByEmail(email: string) {
  const users = await ensureSeeded();
  return (
    users.find((u) => u.email === normalizeEmail(email)) ?? null
  );
}

export async function findStaffById(id: string) {
  const users = await ensureSeeded();
  return users.find((u) => u.id === id) ?? null;
}

async function saveAll(users: StaffAccount[]) {
  if (localMode()) {
    await writeLocal(users);
    return;
  }
  const db = database();
  const existing = await db.adminUser.findMany({ select: { id: true } });
  const keep = new Set(users.map((u) => u.id));
  const remove = existing.filter((r) => !keep.has(r.id)).map((r) => r.id);
  await db.$transaction([
    ...users.map((u) =>
      db.adminUser.upsert({
        where: { id: u.id },
        create: {
          id: u.id,
          email: u.email,
          name: u.name,
          role: "admin",
          passwordHash: u.passwordHash,
          passwordEnc: u.passwordEnc,
          paused: u.paused,
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt),
        },
        update: {
          email: u.email,
          name: u.name,
          role: "admin",
          passwordHash: u.passwordHash,
          passwordEnc: u.passwordEnc,
          paused: u.paused,
          updatedAt: new Date(u.updatedAt),
        },
      }),
    ),
    ...(remove.length
      ? [db.adminUser.deleteMany({ where: { id: { in: remove } } })]
      : []),
  ]);
}

export function validatePassword(password: string) {
  if (typeof password !== "string" || password.length < 8)
    throw new StaffError(400, "La password deve avere almeno 8 caratteri");
  if (password.length > 200)
    throw new StaffError(400, "Password troppo lunga");
}

export async function createStaffAccount(input: {
  email: string;
  password: string;
  name?: string;
}) {
  validatePassword(input.password);
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new StaffError(400, "Email non valida");
  const users = await ensureSeeded();
  if (users.some((u) => u.email === email))
    throw new StaffError(409, "Esiste già un account con questa email");
  const now = new Date().toISOString();
  const account: StaffAccount = {
    id: randomUUID(),
    email,
    name: (input.name || email.split("@")[0] || "Staff").trim().slice(0, 80),
    passwordHash: hashPassword(input.password),
    passwordEnc: sealPassword(input.password),
    paused: false,
    createdAt: now,
    updatedAt: now,
  };
  users.push(account);
  await saveAll(users);
  return account;
}

export async function setStaffPaused(id: string, paused: boolean, actorEmail: string) {
  const users = await ensureSeeded();
  const target = users.find((u) => u.id === id);
  if (!target) throw new StaffError(404, "Account non trovato");
  if (target.email === normalizeEmail(actorEmail) && paused)
    throw new StaffError(400, "Non puoi mettere in pausa il tuo account");
  if (paused) {
    const active = users.filter((u) => !u.paused && u.id !== id);
    if (!active.length)
      throw new StaffError(400, "Deve restare almeno un account attivo");
  }
  target.paused = paused;
  target.updatedAt = new Date().toISOString();
  await saveAll(users);
  return target;
}

export async function setStaffPassword(
  id: string,
  password: string,
  actorEmail: string,
) {
  validatePassword(password);
  const users = await ensureSeeded();
  const target = users.find((u) => u.id === id);
  if (!target) throw new StaffError(404, "Account non trovato");
  // Solo la propria password: i peer creano account nuovi, non resettano gli altri.
  if (target.email !== normalizeEmail(actorEmail))
    throw new StaffError(403, "Puoi modificare solo la tua password");
  target.passwordHash = hashPassword(password);
  target.passwordEnc = sealPassword(password);
  target.updatedAt = new Date().toISOString();
  await saveAll(users);
  return target;
}

export function toPublicStaff(
  users: StaffAccount[],
  viewerEmail: string,
): StaffPublic[] {
  const self = normalizeEmail(viewerEmail);
  return users.map((u) => {
    const isSelf = u.email === self;
    const password = isSelf ? openPassword(u.passwordEnc) : null;
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      paused: u.paused,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      password,
      passwordVisible: Boolean(password),
      isSelf,
    };
  });
}
