// firebaseConfig.js

/**
 * @fileoverview Configuración base de Firebase para la aplicación.
 * * NOTA IMPORTANTE:
 * La aplicación ahora funciona en "Modo Local" (guardado de fotos en el dispositivo).

 */


import { initializeApp } from 'firebase/app';

// Claves y dominios
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUÍ",
  authDomain: "TU_AUTH_DOMAIN_AQUÍ",
  projectId: "TU_PROJEC_ID_AQUÍ",
  storageBucket: "TU_STORAGE_BUCKET_AQUÍ",
  messagingSenderId: "TU_MESSAGING_SENDER_ID_AQUÍ",
  appId: "TU_APP_ID_AQUÍ",
  measurementId: "TU_MEASUREMENT_ID_AQUÍ"
};

/**
 * @constant {object} app
 * La instancia central de la aplicación de Firebase. Solo se usa para el hosting.
 */
export const app = initializeApp(firebaseConfig);

