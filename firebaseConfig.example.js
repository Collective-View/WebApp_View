// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUÍ",
  authDomain: "TU_AUTH_DOMAIN_AQUÍ",
  projectId: "TU_PROJEC_ID_AQUÍ",
  storageBucket: "TU_STORAGE_BUCKET_AQUÍ",
  messagingSenderId: "TU_MESSAGING_SENDER_ID_AQUÍ",
  appId: "TU_APP_ID_AQUÍ",
  measurementId: "TU_MEASUREMENT_ID_AQUÍ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Servicios que usaremos en la aplicación
// 1.- Auth: Autenticación de usuarios
export const auth = getAuth(app);
// 2.- Firestore: Base de datos para los metadatos 
export const db = getFirestore(app);
// 3.- Storage: ALmacenamiento de las imagenes
export const storage = getStorage(app);