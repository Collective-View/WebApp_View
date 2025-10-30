// app/_layout.js
import { Stack, router, useSegments } from "expo-router";
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth } from '../firebaseConfig';

// Hook para verificar y proteger las rutas
function useProtectedRoute(user) {
  const segments = useSegments();
  // El segmento [0] es la raíz. La ruta de autenticación es 'index'
  const isAuthRoute = segments[0] === 'index'; 

  useEffect(() => {
    // Si el usuario NO existe Y NO estamos en la página de login, redirigir a login
    if (!user && !isAuthRoute) {
      router.replace("/"); // Redirige a app/index.js (Login)
    } 
    // Si el usuario SÍ existe Y está en la página de login, redirigir a Portada
    else if (user && isAuthRoute) {
      router.replace("/portada"); // Redirige a app/portada.js
    }
  }, [user, segments]);
}

export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Escucha el estado de autenticación de Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsLoading(false); // La aplicación está lista una vez que se verifica el usuario
    });
    return () => unsub();
  }, []);

  // Ejecuta la lógica de protección de ruta
  useProtectedRoute(user);

  if (isLoading) {
    // Muestra una pantalla de carga mientras se verifica el token de Firebase
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2c3e50' }}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <Stack>
      {/* 1. Pantalla de Login (app/index.js) */}
      <Stack.Screen 
          name="index" 
          options={{ headerShown: false }} 
      /> 
      
      {/* 2. Pantalla de Portada/Menú (app/portada.js) */}
      <Stack.Screen 
          name="portada" 
          options={{ headerShown: false }} 
      />

      {/* 3. Pantalla de la Cámara (app/camera.js) */}
      <Stack.Screen 
          name="camera" 
          options={{ 
              title: 'Vista de Inspección',
          }} 
      /> 
    </Stack>
  );
}