import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const app = initializeApp({
  apiKey: "AIzaSyDqaPyYEv7PE34Njb1w8VFXdeU8UulCXmw",
  authDomain: "transcend-application-bot.firebaseapp.com",
  projectId: "transcend-application-bot",
  storageBucket: "transcend-application-bot.firebasestorage.app",
});
const auth = getAuth(app);
const cred = await signInWithEmailAndPassword(auth, 'voidgamingclips2023@gmail.com', 'voidadmin123');
const idToken = await cred.user.getIdToken();
console.log('Got ID token, length:', idToken.length);

for (const b of ['transcend-application-bot.firebasestorage.app', 'transcend-application-bot.appspot.com']) {
  const url = `https://firebasestorage.googleapis.com/v0/b/${b}/o?maxResults=1`;
  const res = await fetch(url, { headers: { Authorization: `Firebase ${idToken}` } });
  console.log(b, '->', res.status, (await res.text()).slice(0, 200));
}
process.exit(0);
