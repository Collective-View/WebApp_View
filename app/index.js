// app/index.js 

/**
 * @fileoverview Pantalla de bienvenida de la aplicación.
 * Muestra el logotipo y espera la acción del usuario para iniciar el flujo principal.
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

export default function InitialScreen() {
    
    // Al presionar el logo, navegamos al dashboard limpio.
    const handleStartPress = () => {
        router.replace('/portada'); 
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={handleStartPress} 
                    activeOpacity={0.7}
                >
                    <Image 
                        source={LogoImage} 
                        style={styles.logo} 
                        resizeMode="contain" 
                    />
                </TouchableOpacity>
                
                <Text style={styles.title}>Collective View</Text>
                <Text style={styles.subtitlePortada}>Toca el logotipo para iniciar.</Text>
            </View>
        </View>
    );
}


// ---------------------------------------------------
// === Estilos === 
//---------------------------------------------------

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#ffffffff', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20 
    },
    header: { alignItems: 'center' },
    logo: { 
        width: 300, 
        height: 300, 
        marginBottom: 20, 
        borderRadius: 125, 
        backgroundColor: '#fffdfdff' 
    },
    title: { 
        fontSize: 35, 
        fontWeight: 'bold', 
        color: '#0a0a0aff', 
        textAlign: 'center', 
        marginBottom: 10 
    },
    subtitlePortada: { 
        fontSize: 18, 
        color: '#95a5a6', 
        textAlign: 'center' 
    },

});