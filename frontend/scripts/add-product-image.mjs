import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

// Upload to old project storage (new project has no storage bucket set up)
const storageApp = initializeApp({
  apiKey: "AIzaSyDqaPyYEv7PE34Njb1w8VFXdeU8UulCXmw",
  authDomain: "transcend-application-bot.firebaseapp.com",
  projectId: "transcend-application-bot",
  storageBucket: "transcend-application-bot.firebasestorage.app",
}, 'storage-app');

// Write product update to new project Firestore
const dbApp = initializeApp({
  apiKey: "AIzaSyCHpiRhztvb7TE9o-4RRy5Q6Lv_XO78dbs",
  authDomain: "void-esports-website.firebaseapp.com",
  projectId: "void-esports-website",
  storageBucket: "void-esports-website.firebasestorage.app",
}, 'db-app');

const storageAuth = getAuth(storageApp);
const dbAuth = getAuth(dbApp);
const storage = getStorage(storageApp);
const db = getFirestore(dbApp);

const PRODUCT_ID = process.argv[2] || 'QjCrfcioyK4nz1HliwDk';
const IMAGE_PATH = process.argv[3] || '/Users/bbasket74/Desktop/VOID2.jpg';
const FIELD = process.argv[4] || 'image';

console.log('Signing in to storage project...');
const storageCred = await signInWithEmailAndPassword(storageAuth, 'voidgamingclips2023@gmail.com', 'voidadmin123');
console.log('Storage auth:', storageCred.user.email);

console.log('Signing in to DB project...');
const dbCred = await signInWithEmailAndPassword(dbAuth, 'upload-bot@voidesports.gg', 'UploadBot2024!');
console.log('DB auth:', dbCred.user.email);

const imageBytes = readFileSync(IMAGE_PATH);
const ext = IMAGE_PATH.split('.').pop();
const fileName = `products/${PRODUCT_ID}-${Date.now()}.${ext}`;
const storageRef = ref(storage, fileName);

console.log('Uploading', IMAGE_PATH, '→', fileName);
await uploadBytes(storageRef, imageBytes, { contentType: `image/${ext}` });
const downloadURL = await getDownloadURL(storageRef);
console.log('URL:', downloadURL);

console.log('Updating product', PRODUCT_ID, 'field:', FIELD);
await updateDoc(doc(db, 'products', PRODUCT_ID), { [FIELD]: downloadURL });
console.log('Done!');

process.exit(0);
