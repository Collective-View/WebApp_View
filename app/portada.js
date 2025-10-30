// app/portada.js (Pantalla Principal Post-Login)
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LogoImage from '../assets/logo.png';
import { auth } from '../firebaseConfig';

export default function MainScreen() {
    
    const handleSignOut = async () => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro de que quieres cerrar tu sesión?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Cerrar", 
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            // El _layout.js redirigirá automáticamente a /index (Login)
                        } catch (error) {
                            Alert.alert("Error", "No se pudo cerrar la sesión.");
                        }
                    } 
                }
            ]
        );
    };

    const startAppOnTouch = () => {
        router.push('/camera'); 
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={startAppOnTouch} 
                    activeOpacity={0.7}
                >
                    <Image source={LogoImage} style={styles.logo} resizeMode="contain" />
                </TouchableOpacity>
                
                <Text style={styles.title}>Collective view</Text>
            </View>

            <View style={styles.instructionContainer}>
                <Text style={styles.subtitle}>
                    Toca el logotipo para iniciar la inspección.
                </Text>
                
                <TouchableOpacity 
                    onPress={handleSignOut} 
                    style={styles.exitButton}
                >
                    <Text style={styles.exitButtonText}>Cerrar Sesión</Text>
                </TouchableOpacity>
                
            </View>
        </View>
    );
}

// Estilos de la portada (los que ya tenías)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20, justifyContent: 'space-around', alignItems: 'center' },
    header: { alignItems: 'center' },
    logo: { width: 350, height: 350, marginBottom: 20 },
    title: { fontSize: 34, fontWeight: 'bold', color: '#333', textAlign: 'center' },
    instructionContainer: { width: '100%', alignItems: 'center', paddingHorizontal: 30 },
    subtitle: { fontSize: 18, color: '#3a3a3bff', fontWeight: '600', textAlign: 'center' },
    exitButton: { width: '80%', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30, backgroundColor: '#dc3545' },
    exitButtonText: { fontSize: 16, color: '#fff', fontWeight: '600' },
});