// app/index.js (Pantalla Principal)
import { router } from 'expo-router';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// Expo Application es útil para simular el cierre de la app en un entorno real

// Ajusta la ruta a tu logo. Asume que 'assets' está al lado de 'app'.
import LogoImage from '../assets/logo.png';

export default function MainScreen() {
  
  // FUNCIÓN PARA INICIAR LA CÁMARA (Toque en el logo)
  const startAppOnTouch = () => {
    // Usamos 'push' para añadir la cámara a la pila, permitiendo el regreso con router.back()
    router.push('/camera'); 
  };

  // FUNCIÓN PARA SALIR DE LA APLICACIÓN
  const handleExitApp = () => {
      Alert.alert(
        "Cerrar Aplicación",
        "¿Estás seguro de que quieres salir? Esto cerrará la aplicación.",
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          { 
            text: "Salir", 
            onPress: () => {
                // Si la app fuera compilada (no Expo Go), usaríamos:
                // Application.exit(); 
                
                // Por ahora, simulamos el cierre de sesión/salida
                Alert.alert("Simulación de Salida", "Has simulado el cierre de la aplicación.");

                // Si tuvieras Firebase, aquí iría: firebase.auth().signOut()
            } 
          }
        ]
      );
  };

  return (
    <View style={styles.container}>
      
      {/* Área del Logotipo y Título (Botón de Inicio) */}
      <View style={styles.header}>
        <TouchableOpacity 
            onPress={startAppOnTouch} // <--- INICIA LA CÁMARA
            activeOpacity={0.7}
        >
          <Image source={LogoImage} style={styles.logo} resizeMode="contain" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Collective view</Text>
      </View>

      {/* Instrucción y Botón de Salida */}
      <View style={styles.instructionContainer}>
        <Text style={styles.subtitle}>
            Toca el logotipo para iniciar.
        </Text>
        
        {/* BOTÓN DE SALIDA */}
        <TouchableOpacity 
            onPress={handleExitApp} 
            style={styles.exitButton}
        >
            <Text style={styles.exitButtonText}>Cerrar Sesión / Salir</Text>
        </TouchableOpacity>
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'space-around', 
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
  },
  logo: {
    width: 350, 
    height: 350,
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  instructionContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  subtitle: {
    fontSize: 18,
    color: '#3a3a3bff',
    fontWeight: '600',
    textAlign: 'center',
  },
  exitButton: {
    width: '80%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    backgroundColor: '#dc3545', // Rojo para la salida
  },
  exitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});