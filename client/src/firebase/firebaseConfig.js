import { initializeApp, getApps, getApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBmy7QCRSeEPI3iyZUnzrxQnuy19Qai-DI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'fcm-notification7.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'fcm-notification7',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'fcm-notification7.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '616810098926',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:616810098926:web:f21f573767cdbd93c0c3ff',
};

export const isFirebaseConfigured = () => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
};

export const app = getApps().length > 0 
  ? getApp() 
  : isFirebaseConfigured() 
    ? initializeApp(firebaseConfig) 
    : null;
