// app/_layout.js 

/**
 * @fileoverview Configuración de la estructura de navegación global (Stack) para la app.
 * Este archivo define la jerarquia de la aplicación web utilizando Expo Router.
 * Nota: Por el momento esta aplicación utiliza a Firebase para el alojamiento (Hosting), vendran actualizaciones donde 
 * tendra logica de autenticación. 
 * 
 */

import { Stack } from "expo-router";

/**
 * @function RootLayout
 * @description Define el contenedor de navegación de pila (Stack Navigator) de la aplicación.
 * @returns {JSX.Element} El contenedor de navegación.
 */
export default function RootLayout() {

  return (
    <Stack>
      {/* index.js (Pantalla de bienvenida con el logo) */}
      <Stack.Screen name="index" options={{ headerShown: false }} /> 
      
      {/* portada.js (Menú/Dashboard simplificado) */}
      <Stack.Screen name="portada" options={{ headerShown: false }} />
      
      {/* camera.js (Funcionalidad principal: Toma de fotos con metadatos EXIF) */}
      <Stack.Screen name="camera" options={{ headerShown: false}} /> 
    </Stack>
  );
}