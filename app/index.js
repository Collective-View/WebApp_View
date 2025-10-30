// app/index.js 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LogoImage from '../assets/logo.png'; // Ajusta la ruta si es necesario
import { auth } from '../firebaseConfig';

// Definición de las vistas posibles
const VIEW_MODE = {
    PORTADA: 0,
    LOGIN: 1,
    REGISTER: 2
};

export default function LoginScreen() {
    const [viewMode, setViewMode] = useState(VIEW_MODE.PORTADA);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleStartPress = () => {
        setViewMode(VIEW_MODE.LOGIN);
    };

    const handleAuthentication = async (mode) => {
        setIsLoading(true);
        try {
            if (mode === VIEW_MODE.REGISTER) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else { // Login
                await signInWithEmailAndPassword(auth, email, password);
            }
            // Navegación automática por _layout.js
        } catch (error) {
            let errorMessage = "Ocurrió un error. Intente de nuevo.";
            if (error.code) {
                errorMessage = error.code.replace('auth/', '').replace(/-/g, ' ');
            }
            Alert.alert("Error de Autenticación", errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const renderForm = () => {
        const isRegistering = viewMode === VIEW_MODE.REGISTER;
        const buttonText = isRegistering ? 'Registrar y Entrar' : 'Iniciar Sesión';
        const titleText = isRegistering ? 'Crear Nueva Cuenta' : 'Acceder al Sistema';

        return (
            <View style={styles.formContainer}>
                <Text style={styles.formTitle}>{titleText}</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="Correo Electrónico"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Contraseña (mín. 6 chars)"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!isLoading}
                />

                <TouchableOpacity 
                    style={styles.button}
                    onPress={() => handleAuthentication(viewMode)}
                    disabled={isLoading}
                >
                    {isLoading 
                        ? <ActivityIndicator color="#fff" /> 
                        : <Text style={styles.buttonText}>{buttonText}</Text>
                    }
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.switchButton}
                    onPress={() => setViewMode(isRegistering ? VIEW_MODE.LOGIN : VIEW_MODE.REGISTER)}
                    disabled={isLoading}
                >
                    <Text style={styles.switchButtonText}>
                        {isRegistering ? 'Ir a Iniciar Sesión' : '¿No tienes cuenta? Regístrate'}
                    </Text>
                </TouchableOpacity>

                 <TouchableOpacity 
                    style={styles.backToPortaButton}
                    onPress={() => setViewMode(VIEW_MODE.PORTADA)}
                    disabled={isLoading}
                >
                    <Text style={styles.switchButtonText}>← Volver a Portada</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {viewMode === VIEW_MODE.PORTADA ? (
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={handleStartPress} 
                        activeOpacity={0.7}
                    >
                        <Image source={LogoImage} style={styles.logo} resizeMode="contain" />
                    </TouchableOpacity>
                    
                    <Text style={styles.title}>Collective View</Text>
                    <Text style={styles.subtitlePortada}>Toca el logotipo para Iniciar Sesión o Registrarte.</Text>
                </View>
            ) : (
                renderForm()
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#2c3e50', justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: { alignItems: 'center' },
    logo: { width: 200, height: 200, marginBottom: 20, borderRadius: 100, backgroundColor: '#34495e' },
    title: { fontSize: 34, fontWeight: 'bold', color: '#ecf0f1', textAlign: 'center', marginBottom: 10 },
    subtitlePortada: { fontSize: 18, color: '#95a5a6', textAlign: 'center' },
    formContainer: { width: '80%', alignItems: 'center' },
    formTitle: { fontSize: 24, fontWeight: 'bold', color: '#3498db', marginBottom: 30 },
    input: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
    button: { width: '100%', height: 50, backgroundColor: '#3498db', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    switchButton: { marginTop: 20 },
    switchButtonText: { color: '#ecf0f1', fontSize: 16 },
    backToPortaButton: { marginTop: 40 },
});