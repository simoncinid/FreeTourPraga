"use client";

import Image from "next/image";
import { useState } from "react";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadAdminImage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw Error("Usa immagini JPEG, PNG o WebP");
  }
  if (file.size > MAX_BYTES) {
    throw Error("Immagine troppo grande: massimo 5 MB");
  }
  const response = await fetch("/api/platform/admin/media", {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "Caricamento non riuscito");
  return data.url as string;
}

function previewable(url: string) {
  return /^\/(?!\/)|^https:\/\//.test(url);
}

export function ImageSourceField({
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  alt,
  onAltChange,
  onNotice,
  onUploading,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  required?: boolean;
  alt?: string;
  onAltChange?: (alt: string) => void;
  onNotice?: (message: string) => void;
  onUploading?: (uploading: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const locked = disabled || busy;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    onUploading?.(true);
    onNotice?.("Caricamento foto…");
    try {
      const url = await uploadAdminImage(file);
      onChange(url);
      onNotice?.("Foto caricata. Salva o pubblica per usarla.");
    } catch (error) {
      onNotice?.(
        error instanceof Error ? error.message : "Caricamento non riuscito",
      );
    } finally {
      setBusy(false);
      onUploading?.(false);
    }
  }

  return (
    <div className="grid gap-3">
      <span className="text-sm font-medium">{label}</span>
      {previewable(value) && (
        <Image
          src={value}
          alt={alt || `Anteprima ${label}`}
          width={960}
          height={540}
          unoptimized
          className="max-h-56 w-full rounded-lg object-cover"
        />
      )}
      <label className="grid gap-2 text-sm">
        URL {label}
        <input
          className="text-input"
          value={value}
          required={required}
          maxLength={1000}
          disabled={locked}
          placeholder="https://… oppure /api/media/…"
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm">
        Oppure carica dal computer (JPEG, PNG o WebP; massimo 5 MB)
        <input
          type="file"
          accept={ACCEPT}
          disabled={locked}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void onFile(file);
          }}
        />
      </label>
      {onAltChange && (
        <label className="grid gap-2 text-sm">
          Descrizione immagine (testo alternativo)
          <input
            className="text-input"
            value={alt ?? ""}
            maxLength={250}
            disabled={locked}
            onChange={(event) => onAltChange(event.target.value)}
          />
        </label>
      )}
    </div>
  );
}
