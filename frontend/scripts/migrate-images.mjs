/**
 * migrate-images.mjs
 *
 * Downloads external images from Firestore documents and re-hosts them
 * on Firebase Storage, then updates the Firestore docs with the new URLs.
 *
 * Usage:
 *   node scripts/migrate-images.mjs
 *
 * You will be prompted for your admin email + password.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { createInterface } from 'readline';
import { createHash } from 'crypto';

// ── Firebase configs ──────────────────────────────────────────────────────────
const OLD_CONFIG = {
  apiKey: "AIzaSyDqaPyYEv7PE34Njb1w8VFXdeU8UulCXmw",
  authDomain: "transcend-application-bot.firebaseapp.com",
  projectId: "transcend-application-bot",
  storageBucket: "transcend-application-bot.firebasestorage.app",
  messagingSenderId: "748353091728",
  appId: "1:748353091728:web:af973e8bec34c81f2e8015"
};

const NEW_CONFIG = {
  apiKey: "AIzaSyCHpiRhztvb7TE9o-4RRy5Q6Lv_XO78dbs",
  authDomain: "void-esports-website.firebaseapp.com",
  projectId: "void-esports-website",
  storageBucket: "void-esports-website.firebasestorage.app",
  messagingSenderId: "862107622581",
  appId: "1:862107622581:web:bbcb31f17fd539bd5d32fc"
};

// ── Cloudinary config ─────────────────────────────────────────────────────────
const CLOUDINARY_CLOUD  = 'dsikk1qkx';
const CLOUDINARY_KEY    = '751721791856847';
const CLOUDINARY_SECRET = 'mb7VuSoSf3Dj0au73vx9i14oUE0';

// Read from old project, write Cloudinary URLs into new project
const oldApp = initializeApp(OLD_CONFIG, 'old');
const newApp = initializeApp(NEW_CONFIG, 'new');
const oldDb  = getFirestore(oldApp);
const newDb  = getFirestore(newApp);
const oldAuth = getAuth(oldApp);
const newAuth = getAuth(newApp);

// ── Helpers ───────────────────────────────────────────────────────────────────
function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

function isExternalUrl(url) {
  return typeof url === 'string' && url.startsWith('http');
}

function isAlreadyOnStorage(url) {
  return typeof url === 'string' && (
    url.includes('firebasestorage.googleapis.com') ||
    url.includes('res.cloudinary.com')
  );
}

async function fetchImageBuffer(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const mime = res.headers.get('content-type') ?? 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, mime };
}

function mimeToExt(mime) {
  if (mime.includes('png'))  return 'png';
  if (mime.includes('gif'))  return 'gif';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('svg'))  return 'svg';
  return 'jpg';
}

async function uploadToCloudinary(buffer, mime, folder, publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, public_id: publicId, timestamp };
  const sigStr = Object.keys(params).sort()
    .map(k => `${k}=${params[k]}`).join('&') + CLOUDINARY_SECRET;
  const signature = createHash('sha1').update(sigStr).digest('hex');

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mime }));
  form.append('api_key', CLOUDINARY_KEY);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder', folder);
  form.append('public_id', publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: 'POST', body: form, signal: AbortSignal.timeout(30_000) }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cloudinary upload HTTP ${res.status}: ${text.slice(0, 120)}`);
  }
  const json = await res.json();
  return json.secure_url;
}

// ── Firestore REST patch ──────────────────────────────────────────────────────
function toFirestoreValue(val) {
  if (typeof val === 'string')  return { stringValue: val };
  if (typeof val === 'number')  return { integerValue: String(val) };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (val === null)             return { nullValue: null };
  if (Array.isArray(val))       return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object')  return { mapValue: { fields: Object.fromEntries(Object.entries(val).map(([k,v]) => [k, toFirestoreValue(v)])) } };
  return { nullValue: null };
}

// Full document set (no updateMask = replaces entire document, treated as create/update)
async function firestoreSet(projectId, col, docId, docData, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${col}/${docId}`;
  const body = { fields: Object.fromEntries(Object.entries(docData).map(([k, v]) => [k, toFirestoreValue(v)])) };
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Firestore set HTTP ${res.status}: ${text.slice(0, 120)}`);
  }
}

// ── Per-collection migration configs ─────────────────────────────────────────
// Each entry: { collectionName, imageFields[] }
// imageFields can be top-level strings or 'players[].image' for nested arrays
const COLLECTIONS = [
  { name: 'products', fields: ['image'], folder: 'products' },
  { name: 'news',     fields: ['image', 'thumbnail'], folder: 'news' },
  { name: 'teams',    fields: ['image'], folder: 'teams', nestedArray: { field: 'players', imageField: 'image', folder: 'players' } },
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n── VOID Esports Image Migration ──────────────────────────\n');

  const [,, argEmail, argPassword] = process.argv;
  const email    = argEmail    ?? await prompt('Admin email: ');
  const password = argPassword ?? await prompt('Admin password: ');

  process.stdout.write('Signing into old project… ');
  try {
    await signInWithEmailAndPassword(oldAuth, 'voidgamingclips2023@gmail.com', 'voidadmin123');
    console.log('OK');
  } catch {
    console.log('skipped (open rules)');
  }

  process.stdout.write('Signing into new project… ');
  let newIdToken;
  try {
    const cred = await signInWithEmailAndPassword(newAuth, email, password);
    newIdToken = await cred.user.getIdToken(true);
    console.log('OK\n');
  } catch (err) {
    console.error(`\nAuth failed: ${err.message}`);
    process.exit(1);
  }

  const results = { migrated: 0, skipped: 0, failed: [] };

  for (const cfg of COLLECTIONS) {
    console.log(`\nScanning /${cfg.name}…`);
    const snap = await getDocs(collection(oldDb, cfg.name));

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const updates = {};

      // ── Top-level image fields ──────────────────────────────────────────
      for (const field of cfg.fields) {
        const url = data[field];
        if (!url || isAlreadyOnStorage(url) || !isExternalUrl(url)) continue;

        process.stdout.write(`  [${cfg.name}/${docSnap.id}] ${field}: fetching… `);
        try {
          const { buffer, mime } = await fetchImageBuffer(url);
          const publicId = `${docSnap.id}_${field}`;
          const newUrl = await uploadToCloudinary(buffer, mime, cfg.folder, publicId);
          updates[field] = newUrl;
          results.migrated++;
          console.log(`✓`);
        } catch (err) {
          console.log(`✗ (${err.message})`);
          results.failed.push({ collection: cfg.name, id: docSnap.id, field, url, reason: err.message });
        }
      }

      // ── Nested players array ────────────────────────────────────────────
      if (cfg.nestedArray && Array.isArray(data[cfg.nestedArray.field])) {
        const { field: arrayField, imageField, folder } = cfg.nestedArray;
        const updatedPlayers = [...data[arrayField]];
        let arrayChanged = false;

        for (let i = 0; i < updatedPlayers.length; i++) {
          const player = updatedPlayers[i];
          const url = player[imageField];
          if (!url || isAlreadyOnStorage(url) || !isExternalUrl(url)) continue;

          const playerName = (player.name ?? `player_${i}`).replace(/\s+/g, '_');
          process.stdout.write(`  [${cfg.name}/${docSnap.id}] player[${playerName}].${imageField}: fetching… `);
          try {
            const { buffer, mime } = await fetchImageBuffer(url);
            const newUrl = await uploadToCloudinary(buffer, mime, folder, `${docSnap.id}_${playerName}`);
            updatedPlayers[i] = { ...player, [imageField]: newUrl };
            arrayChanged = true;
            results.migrated++;
            console.log(`✓`);
          } catch (err) {
            console.log(`✗ (${err.message})`);
            results.failed.push({ collection: cfg.name, id: docSnap.id, field: `${arrayField}[${playerName}].${imageField}`, url, reason: err.message });
          }
        }

        if (arrayChanged) {
          updates[arrayField] = updatedPlayers;
        }
      }

      // ── Write full doc (set, not patch) to avoid update-rule issues ────
      if (Object.keys(updates).length > 0) {
        const fullDoc = { ...docSnap.data(), ...updates };
        await firestoreSet('void-esports-website', cfg.name, docSnap.id, fullDoc, newIdToken);
      } else {
        results.skipped++;
      }
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n── Summary ───────────────────────────────────────────────');
  console.log(`  Migrated : ${results.migrated} image(s)`);
  console.log(`  Skipped  : ${results.skipped} doc(s) (already on Storage or no external images)`);
  console.log(`  Failed   : ${results.failed.length} image(s)\n`);

  if (results.failed.length > 0) {
    console.log('Images that could NOT be fetched (likely expired links — need manual re-upload):');
    for (const f of results.failed) {
      console.log(`  • ${f.collection}/${f.id} [${f.field}] — ${f.reason}`);
      console.log(`    URL: ${f.url}`);
    }
    console.log('\nFor those, go to the admin panel and upload a replacement image directly.\n');
  } else {
    console.log('All external images successfully migrated to Cloudinary.\n');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
