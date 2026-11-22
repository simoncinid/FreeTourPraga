// Checks configuration only. Does not send email or initiate payments.
import { scryptSync, timingSafeEqual } from 'node:crypto';
try { process.loadEnvFile('.env.production.local'); } catch(e) { if(e.code!=='ENOENT') throw e; }
const env = process.env, checks = [];
const add = (name, pass) => checks.push({ name, pass: Boolean(pass) });
const present = name => typeof env[name] === 'string' && env[name].trim().length > 0;
const strong = name => present(name) && env[name].length >= 32 && !/change.me|placeholder|your.secret/i.test(env[name]);
const url = name => { try { return new URL(env[name]); } catch { return null; } };
const origin = url('NEXT_PUBLIC_SITE_URL'), db = url('DATABASE_URL');
add('Dominio HTTPS (Railway o dominio personalizzato)', origin?.protocol === 'https:' && !/localhost|\.example$/i.test(origin.hostname));
if (process.argv.includes('--seo-launch')) {
 add('Dominio SEO definitivo esatto', origin?.origin === 'https://it.freetourpraga.com' && origin.pathname === '/');
 add('Indicizzazione di produzione esplicitamente attiva', env.SITE_PREVIEW === 'false');
}
add('PostgreSQL su rete privata Railway oppure con TLS', db && ['postgresql:', 'postgres:'].includes(db.protocol) && db.username && (db.hostname.endsWith('.railway.internal') || ['require', 'verify-ca', 'verify-full'].includes(db.searchParams.get('sslmode'))));
add('Storage PostgreSQL', env.PLATFORM_STORAGE === 'postgres');
add('SESSION_SECRET robusto', strong('SESSION_SECRET'));
add('CRON_SECRET robusto', strong('CRON_SECRET'));
add('Chiave link prenotazione', !present('BOOKING_LINK_SECRET') || strong('BOOKING_LINK_SECRET'));
let users = []; try { users = JSON.parse(env.STAFF_USERS || '[]'); } catch {}
add('Account amministratore con password distinta dallo sviluppo', Array.isArray(users) && users.some(u => u.role === 'admin') && users.every(u => {
 if (!['admin','operator'].includes(u.role) || !/^.+@.+\..+$/.test(u.email) || /\.local$|@example\./.test(u.email) || !/^([a-f0-9]{32}):([a-f0-9]{128})$/.test(u.passwordHash || '')) return false;
 const [salt,key] = u.passwordHash.split(':');
 return !timingSafeEqual(scryptSync('PragaLocale!2026', salt, 64), Buffer.from(key,'hex'));
}));
add('SMTP e mittente configurati', present('SMTP_HOST') && present('SMTP_FROM') && present('ADMIN_EMAIL'));
if (env.SITE_PREVIEW === 'true') {
 console.log('Anteprima: indicizzazione disabilitata. Pagamenti online non attivi.');
}
for (const c of checks) console.log(`${c.pass ? 'OK' : 'DA CONFIGURARE'}: ${c.name}`);
console.log('Backup giornaliero: verificare il servizio Railway backup, il suo ultimo esito e la prova di ripristino.');
console.log('Worker: verificare servizio attivo e CRON_SECRET uguale a web. Immagini CMS persistite in PostgreSQL.');
console.log('Perimetro: contanti e bonifico configurabili per tour; affiliazioni e commissioni. Stripe, Twilio, OTA e campagne Ads non sono requisiti di questo controllo.');
console.log('Le configurazioni presenti non sostituiscono il collaudo reale di SMTP e backup. Le chiavi Stripe non abilitano il checkout online nella versione corrente.');
if (checks.some(c => !c.pass)) process.exitCode = 1;
