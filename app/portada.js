// app/portada.js 

/**
 * @fileoverview Componente Dashboard simple post-inicio.
 * Sirve como un menú simple para navegar a la cámara. 
 */

import { router } from 'expo-router';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import LogoImage from '../assets/logo.png';

/**
 * @function DashboardScreen
 * @description Muestra el menú principal con las únicas opciones disponibles.
 * @returns {JSX.Element} La interfaz de usuario del menú.
 */
export default function DashboardScreen() {
    
    // Ya no se requiere estado ni roles.
    
    /**
     * @function startCamera
     * @description Navega a la ruta de la cámara para iniciar una nueva inspección.
     */
    const startCamera = () => { router.push('/camera'); };
    

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image source={LogoImage} style={styles.logo} resizeMode="contain" />
                <Text style={styles.title}>Collective View</Text>
                
                <Text style={styles.welcomeText}>
                    Modo Local: <Text style={{fontWeight: 'bold'}}>Investigación</Text>
                </Text>
            </View>

            <View style={styles.actionContainer}>
                
                {/* Botón principal: Investigación (Cámara) */}
                <TouchableOpacity 
                    onPress={startCamera} 
                    style={[styles.button, styles.primaryButton]}
                >
                    <Text style={styles.primaryButtonText}>Investigar</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}
// ---------------------------------------------------
// === Estilos === 
//---------------------------------------------------
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20, justifyContent: 'space-around', alignItems: 'center' },
    header: { alignItems: 'center', marginTop: 40, },
    logo: { width: 250, height: 250, marginBottom: 20 },
    title: { fontSize: 34, fontWeight: 'bold', color: '#333', textAlign: 'center' },
    welcomeText: { fontSize: 16, color: '#6c757d', marginTop: 10, },
    actionContainer: { width: '90%', alignItems: 'center', paddingHorizontal: 10, marginBottom: 40, },
    button: { width: '100%', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 15, },
    primaryButton: { backgroundColor: '#435161ff', },
    primaryButtonText: { fontSize: 16, color: '#fff', fontWeight: '600' },
    
});