/**
 * migrate-data.mjs
 *
 * Copies all Firestore data from the old Firebase project
 * (transcend-application-bot) to the new one (void-esports-website).
 *
 * Usage:
 *   node scripts/migrate-data.mjs <newEmail> <newPassword>
 *
 * Example:
 *   node scripts/migrate-data.mjs admin@voidesports.org mypassword
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// ── Old project config ────────────────────────────────────────────────────────
const OLD_CONFIG = {
  apiKey: "AIzaSyDqaPyYEv7PE34Njb1w8VFXdeU8UulCXmw",
  authDomain: "transcend-application-bot.firebaseapp.com",
  projectId: "transcend-application-bot",
  storageBucket: "transcend-application-bot.firebasestorage.app",
  messagingSenderId: "748353091728",
  appId: "1:748353091728:web:af973e8bec34c81f2e8015"
};

// ── New project config ────────────────────────────────────────────────────────
const NEW_CONFIG = {
  apiKey: "AIzaSyCHpiRhztvb7TE9o-4RRy5Q6Lv_XO78dbs",
  authDomain: "void-esports-website.firebaseapp.com",
  projectId: "void-esports-website",
  storageBucket: "void-esports-website.firebasestorage.app",
  messagingSenderId: "862107622581",
  appId: "1:862107622581:web:bbcb31f17fd539bd5d32fc"
};

// ── Collections to copy ───────────────────────────────────────────────────────
const COLLECTIONS = [
  'products',
  'teams',
  'newsArticles',
  'orders',
  'events',
  'matches',
  'reviews',
  'contactMessages',
  'support-tickets',
];

// ── Init both apps ────────────────────────────────────────────────────────────
const oldApp = initializeApp(OLD_CONFIG, 'old');
const newApp = initializeApp(NEW_CONFIG, 'new');

const oldDb   = getFirestore(oldApp);
const newDb   = getFirestore(newApp);
const oldAuth = getAuth(oldApp);
const newAuth = getAuth(newApp);

async function main() {
  console.log('\n── VOID Esports Data Migration ───────────────────────────\n');

  const [,, newEmail, newPassword] = process.argv;

  if (!newEmail || !newPassword) {
    console.error('Usage: node scripts/migrate-data.mjs <newEmail> <newPassword>');
    console.error('  newEmail/newPassword = the admin account you created in the new Firebase project');
    process.exit(1);
  }

  // Sign into old project
  process.stdout.write('Signing into old project… ');
  try {
    await signInWithEmailAndPassword(oldAuth, 'voidgamingclips2023@gmail.com', 'voidadmin123');
    console.log('OK');
  } catch (err) {
    // Old project might have open rules — try continuing without auth
    console.log(`skipped (${err.code})`);
  }

  // Sign into new project
  process.stdout.write('Signing into new project… ');
  try {
    await signInWithEmailAndPassword(newAuth, newEmail, newPassword);
    console.log('OK\n');
  } catch (err) {
    console.error(`\nFailed: ${err.message}`);
    console.error('Make sure you created an admin user in the new Firebase project under Authentication → Users.');
    process.exit(1);
  }

  const results = { copied: 0, skipped: 0, errors: [] };

  for (const col of COLLECTIONS) {
    process.stdout.write(`Copying /${col}… `);
    let snap;
    try {
      snap = await getDocs(collection(oldDb, col));
    } catch (err) {
      console.log(`✗ read failed (${err.message})`);
      results.errors.push(`${col}: ${err.message}`);
      continue;
    }

    if (snap.empty) {
      console.log('empty, skipped');
      results.skipped++;
      continue;
    }

    let count = 0;
    for (const docSnap of snap.docs) {
      try {
        await setDoc(doc(newDb, col, docSnap.id), docSnap.data());
        count++;
      } catch (err) {
        results.errors.push(`${col}/${docSnap.id}: ${err.message}`);
      }
    }
    console.log(`✓ ${count} doc(s)`);
    results.copied += count;
  }

  console.log('\n── Summary ───────────────────────────────────────────────');
  console.log(`  Copied : ${results.copied} document(s)`);
  console.log(`  Skipped: ${results.skipped} empty collection(s)`);
  console.log(`  Errors : ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(e => console.log(`  • ${e}`));
  } else {
    console.log('\nAll data copied successfully.\n');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('\nFatal:', err);
  process.exit(1);
});
