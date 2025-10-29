// app/_layout.js
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      {/* Oculta el encabezado en la Pantalla Principal (la portada) */}
      <Stack.Screen name="index" options={{ headerShown: false, title: "Inicio" }} /> 
      
      {/* Muestra el encabezado en la pantalla de la cámara para que aparezca el botón de "Atrás" */}
      <Stack.Screen name="camera" options={{ title: 'Vista de Inspección' }} /> 
    </Stack>
  );
}