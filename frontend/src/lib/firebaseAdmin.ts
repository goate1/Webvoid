import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore | null = null;

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT env var not configured');
  }

  return admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount)),
    projectId: 'void-esports-website',
  });
}

export function getAdminDb(): admin.firestore.Firestore {
  if (!adminDb) {
    const app = getAdminApp();
    adminDb = admin.firestore(app);
  }
  return adminDb;
}
