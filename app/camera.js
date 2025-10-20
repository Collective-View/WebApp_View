import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library'; 
import { DeviceMotion } from 'expo-sensors';
import { useRef, useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Alert, Dimensions, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

// Función para obtener las dimensiones actuales
const getDimensions = () => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
};

// Estado inicial de la orientación forzada
const INITIAL_ORIENTATION = Dimensions.get('window').width < Dimensions.get('window').height ? 'PORTRAIT' : 'LANDSCAPE';

export default function CameraScreen() {
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

    const cameraRef = useRef(null);
    const [photoUri, setPhotoUri] = useState(null);
    const [isCameraActive, setIsCameraActive] = useState(true);

    const [dimensions, setDimensions] = useState(getDimensions());
    const { width: screenWidth, height: screenHeight } = dimensions;

    const [orientation, setOrientation] = useState(INITIAL_ORIENTATION); 

    const [pitch, setPitch] = useState(0);
    const [roll, setRoll] = useState(0);
    const [isLeveled, setIsLeveled] = useState(false);
    const [isTilted, setIsTilted] = useState(false);
    const [hasVibrated, setHasVibrated] = useState(false);

    const animatedRoll = useRef(new Animated.Value(0)).current;
    const animatedOpacity = useRef(new Animated.Value(1)).current;

    // -------------------------------
    // 1. ACTUALIZACIÓN DE DIMENSIONES Y PERMISOS
    // -------------------------------
    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setDimensions(window);
        });
        
        (async () => {
            if (!cameraPermission?.granted) await requestCameraPermission();
            if (!mediaPermission?.granted) await requestMediaPermission();
        })();

        return () => subscription.remove();
    }, [cameraPermission, mediaPermission]);

    // -------------------------------
    // 2. SENSOR DE INCLINACIÓN Y ORIENTACIÓN
    // -------------------------------
    useEffect(() => {
        const sub = DeviceMotion.addListener((data) => {
            if (!data || !data.rotation) return;

            let { beta, gamma } = data.rotation;
            beta = (beta * 180) / Math.PI;
            gamma = (gamma * 180) / Math.PI;

            // Transición de Orientación Basada en Gamma
            const absGamma = Math.abs(gamma);
            if (orientation === 'PORTRAIT' && absGamma > 75) {
                setOrientation('LANDSCAPE');
            } else if (orientation === 'LANDSCAPE' && absGamma < 15) {
                setOrientation('PORTRAIT');
            }
            
            let correctedPitch, correctedRoll;

            if (orientation === 'PORTRAIT') {
                correctedPitch = beta;
                correctedRoll = gamma;
            } else {
                // LANDSCAPE: Ejes intercambiados e invertidos para coherencia
                correctedRoll = -beta; 
                correctedPitch = -gamma; 
            }

            setPitch(correctedPitch);
            setRoll(correctedRoll);

            // 1. Animación de Traslación (Movimiento de la línea)
            Animated.spring(animatedRoll, {
                toValue: correctedRoll,
                useNativeDriver: true,
                speed: 20,
                bounciness: 0,
            }).start();
            
            // 2. Lógica de Validaciones (Pitch: 65-75, Roll: ±3)
            const leveled = Math.abs(correctedRoll) <= 3;
            const tilted = Math.abs(correctedPitch) >= 65 && Math.abs(correctedPitch) <= 75;

            setIsLeveled(leveled);
            setIsTilted(tilted);
            
            // 3. Animación de Opacidad (Desvanecimiento de la línea)
            if (leveled) {
                Animated.timing(animatedOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            } else {
                Animated.timing(animatedOpacity, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }).start();
            }

            // 4. Feedback Haptico
            if (leveled && tilted && !hasVibrated) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setHasVibrated(true);
            }
            if (!leveled || !tilted) setHasVibrated(false);
        });

        DeviceMotion.setUpdateInterval(200);
        return () => sub.remove();
    }, [hasVibrated, orientation]);

    // -------------------------------
    // 3. CAPTURAR FOTO (sin cambios)
    // -------------------------------
    const takePhoto = async () => {
        if (!cameraRef.current) return;
        if (!isLeveled) return Alert.alert('⚠️ No nivelado', 'Mantén el teléfono nivelado (±3°).');
        if (!isTilted) return Alert.alert('📐 Inclinación', 'Inclina entre 65° y 75°.');

        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
            setPhotoUri(photo.uri);
            setIsCameraActive(false);
            await MediaLibrary.saveToLibraryAsync(photo.uri);
            Alert.alert('✅ Foto guardada', 'Se ha guardado en la galería.');
        } catch (error) {
            Alert.alert('❌ Error', 'No se pudo tomar la foto.');
        }
    };

    const retakePhoto = () => {
        setPhotoUri(null);
        setIsCameraActive(true);
    };

    // -------------------------------
    // 4. VISTA PREVIA
    // -------------------------------
    if (photoUri) {
        return (
            <View style={styles.previewContainer}>
                <Image source={{ uri: photoUri }} style={styles.preview} />
                <TouchableOpacity style={styles.captureButton} onPress={retakePhoto} />
            </View>
        );
    }

    // -------------------------------
    // 5. VISTA DE CÁMARA (Animación de la Línea Corregida)
    // -------------------------------
    
    // Definimos el rango de movimiento horizontal (80% del ancho de la pantalla)
    const maxTranslation = screenWidth * 0.4; 
    
    // El roll de 90° a 90° se mapea al movimiento de la línea de -40% a +40% de la pantalla.
    const linePosition = animatedRoll.interpolate({
        inputRange: [-90, 90],
        outputRange: [-maxTranslation, maxTranslation],
        extrapolate: 'clamp', 
    });
    
    // Rotación visual de la línea (para que sea vertical en horizontal)
    const lineRotation = orientation === 'LANDSCAPE' ? [{ rotate: '90deg' }] : [];

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFill}
                ref={cameraRef}
                facing="back"
                active={isCameraActive}
                ratio={orientation === 'LANDSCAPE' ? '9:16' : '16:9'} 
            />

            {/* Contenedor central para la línea de nivelación (CORRECCIÓN) */}
            <View style={styles.levelLineContainer}>
                <Animated.View
                    style={[
                        styles.levelLine,
                        {
                            height: 2, 
                            opacity: animatedOpacity, 
                            
                            // La traslación es en X (movimiento horizontal en la pantalla)
                            transform: [
                                { translateX: linePosition }, 
                                ...lineRotation, 
                            ],
                            
                            width: '80%', 
                            backgroundColor: isLeveled && isTilted ? '#0f0' : '#f00',
                        },
                    ]}
                />
            </View>

            {/* Cuadro guía (Fijo) */}
            <View style={styles.frame} />

            {/* Botón captura (Fijo) */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.captureButton, { backgroundColor: isLeveled && isTilted ? '#0f0' : '#fff' }]}
                    onPress={takePhoto}
                />
            </View>
        </View>
    );
}

// -------------------------------
// ESTILOS (Añadimos levelLineContainer y simplificamos levelLine)
// -------------------------------
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    frame: {
        position: 'absolute',
        top: '40%', 
        left: '25%', 
        width: '50%',
        height: '20%',
        borderWidth: 2,
        borderColor: '#00FF00',
        borderRadius: 10,
        opacity: 0.5,
        zIndex: 1, 
    },
    // **NUEVO CONTENEDOR:** Centra la línea de forma absoluta y simple
    levelLineContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center', // Centra verticalmente
        alignItems: 'center',    // Centra horizontalmente
        zIndex: 2,
    },
    // Línea de Nivel: Ahora solo recibe la animación y el estilo visual
    levelLine: {
        borderRadius: 3,
        // Eliminamos position: 'absolute' y alignSelf: 'center' para que translateX funcione
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 40, 
        alignSelf: 'center', 
        zIndex: 3, 
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: '#ccc',
        opacity: 0.9,
    },
    previewContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    preview: {
        width: '90%',
        height: '70%',
        borderRadius: 10,
        marginBottom: 20,
    },
});