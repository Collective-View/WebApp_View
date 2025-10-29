import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import { DeviceMotion } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// --- CÁLCULOS DE DIMENSIONES Y REGIÓN DE INTERÉS (ROI) ---
// Usamos getDimensions() ahora para asegurar que se actualicen
const { width: initialScreenWidth, height: initialScreenHeight } = Dimensions.get('window'); 

const FRAME_WIDTH_PERCENT = 0.50; 
const FRAME_HEIGHT_PERCENT = 0.20; 

// Nota: Las coordenadas ROI se recalculan dentro del componente si las dimensiones cambian
//       Aunque para este uso, las iniciales pueden ser suficientes.
let roiConfig = {
    xStart: (initialScreenWidth / 2) - (initialScreenWidth * FRAME_WIDTH_PERCENT / 2),
    xEnd: (initialScreenWidth / 2) + (initialScreenWidth * FRAME_WIDTH_PERCENT / 2),
    yStart: (initialScreenHeight / 2) - (initialScreenHeight * FRAME_HEIGHT_PERCENT / 2),
    yEnd: (initialScreenHeight / 2) + (initialScreenHeight * FRAME_HEIGHT_PERCENT / 2),
};
// -------------------------------------------------------------

const getDimensions = () => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
};

const INITIAL_ORIENTATION = initialScreenWidth < initialScreenHeight ? 'PORTRAIT' : 'LANDSCAPE';

export default function CameraScreen() {
    // Permisos y Estados
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
    const [locationStatus, setLocationStatus] = useState(null); 

    const cameraRef = useRef(null);
    const [photoUri, setPhotoUri] = useState(null);
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [metadata, setMetadata] = useState(null); 
    const [dimensions, setDimensions] = useState(getDimensions());
    const { width: currentScreenWidth, height: currentScreenHeight } = dimensions; // Dimensiones reactivas
    const [orientation, setOrientation] = useState(INITIAL_ORIENTATION); 

    const [pitch, setPitch] = useState(0); 
    const [roll, setRoll] = useState(0);   
    const [isLeveled, setIsLeveled] = useState(false);
    const [isTilted, setIsTilted] = useState(false);
    const [hasVibrated, setHasVibrated] = useState(false);
    const [isQrDetected, setIsQrDetected] = useState(false); 

    const [pitchDeviation, setPitchDeviation] = useState(0); 
    const animatedRoll = useRef(new Animated.Value(0)).current; 
    const animatedOpacity = useRef(new Animated.Value(1)).current; 
    const animatedPitch = useRef(new Animated.Value(0)).current; 
    const animatedPitchOpacity = useRef(new Animated.Value(1)).current;

// ----------------------------------------------------------------------
// 0. FUNCIONES DE NAVEGACIÓN Y LÓGICA DE EVENTOS 
// ----------------------------------------------------------------------
    const goToMainScreen = () => {
        router.back(); 
    };

    // Recalcular ROI cuando cambian las dimensiones
    useEffect(() => {
        const frameW = currentScreenWidth * FRAME_WIDTH_PERCENT;
        const frameH = currentScreenHeight * FRAME_HEIGHT_PERCENT;
        roiConfig = {
            xStart: (currentScreenWidth / 2) - (frameW / 2),
            xEnd: (currentScreenWidth / 2) + (frameW / 2),
            yStart: (currentScreenHeight / 2) - (frameH / 2),
            yEnd: (currentScreenHeight / 2) + (frameH / 2),
        };
    }, [currentScreenWidth, currentScreenHeight]);

    const handleBarcodeScanned = ({ type, data, bounds }) => {
        if (!isCameraActive) return; 

        // Usamos las coordenadas ROI recalculadas
        const { xStart, xEnd, yStart, yEnd } = roiConfig;
        
        const centerX = bounds.origin.x + (bounds.size.width / 2);
        const centerY = bounds.origin.y + (bounds.size.height / 2);

        const isInsideROI = 
            centerX >= xStart && centerX <= xEnd &&
            centerY >= yStart && centerY <= yEnd;
        
        setIsQrDetected(isInsideROI);
    };

    const takePhoto = async () => {
        if (!cameraRef.current) return;
        const isReadyToCapture = isLeveled && isTilted && isQrDetected;
        if (!isReadyToCapture) { /* ... validaciones ... */ return; }
        
        let tempMetadata = { location: 'No disponible', focalLength: 'No disponible' };

        try {
            if (locationStatus === 'granted') { /* ... obtener GPS ... */ } 
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true, exif: true, });
            if (photo.exif) { /* ... procesar EXIF ... */ }
            
            let finalUri = photo.uri;
            if (mediaPermission?.granted) { /* ... guardar en galería ... */ } 
            
            setPhotoUri(finalUri); 
            setIsCameraActive(false);
            setMetadata(tempMetadata);
        } catch (error) { /* ... manejo de errores ... */ }
    };

    const retakePhoto = () => {
        setPhotoUri(null);
        setMetadata(null); 
        setIsQrDetected(false); 
        setIsCameraActive(true);
    };
// ----------------------------------------------------------------------
// 1. GESTIÓN DE PERMISOS (Sin cambios)
// ----------------------------------------------------------------------
    useEffect(() => {
        const dimensionsSubscription = Dimensions.addEventListener('change', ({ window }) => {
            setDimensions(window); // Actualiza dimensiones reactivas
        });
        
        (async () => {
            if (!cameraPermission?.granted) await requestCameraPermission();
            if (!mediaPermission?.granted) await requestMediaPermission(); 
        })();

        (async () => {
            let { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') {
                const permissionResponse = await Location.requestForegroundPermissionsAsync();
                status = permissionResponse.status;
            }
            setLocationStatus(status);
        })();

        return () => dimensionsSubscription.remove();
    }, [cameraPermission, mediaPermission]); 

// ----------------------------------------------------------------------
// 2. SENSOR DE INCLINACIÓN Y ANIMACIÓN (Sin cambios)
// ----------------------------------------------------------------------
    useEffect(() => {
        const sub = DeviceMotion.addListener((data) => {
            // ... (Lógica de Pitch, Roll, Animaciones y Haptics sin cambios)
            if (!data || !data.rotation) return;

            let { beta, gamma } = data.rotation;
            beta = (beta * 180) / Math.PI;
            gamma = (gamma * 180) / Math.PI;

            // Determinar orientación basada en gamma (roll vertical)
            const currentOrientation = Math.abs(gamma) > 45 ? 'LANDSCAPE' : 'PORTRAIT';
            if (currentOrientation !== orientation) {
                setOrientation(currentOrientation);
            }
            
            let correctedPitch, correctedRoll;
            if (orientation === 'PORTRAIT') {
                correctedPitch = beta;
                correctedRoll = gamma;
            } else {
                correctedRoll = -beta; 
                correctedPitch = -gamma; 
            }

            setPitch(correctedPitch);
            setRoll(correctedRoll);

            Animated.spring(animatedRoll, { toValue: correctedRoll, useNativeDriver: true, speed: 5, bounciness: 0, }).start();
            
            const leveled = Math.abs(correctedRoll) <= 3;
            const tilted = Math.abs(correctedPitch) >= 65 && Math.abs(correctedPitch) <= 75;

            const currentPitchDeviation = correctedPitch - 70;
            setPitchDeviation(currentPitchDeviation); 

            Animated.spring(animatedPitch, { toValue: currentPitchDeviation, useNativeDriver: true, speed: 10, bounciness: 0, }).start();
            
            if (tilted) {
                Animated.timing(animatedPitchOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
            } else {
                Animated.timing(animatedPitchOpacity, { toValue: 1, duration: 100, useNativeDriver: true }).start();
            }

            setIsLeveled(leveled);
            setIsTilted(tilted);
            
            if (!leveled || !tilted) {
                setHasVibrated(false);
                if (isQrDetected) { 
                    setIsQrDetected(false); 
                }
            }

            if (leveled) {
                Animated.timing(animatedOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
            } else {
                Animated.timing(animatedOpacity, { toValue: 1, duration: 100, useNativeDriver: true }).start();
            }

            if (leveled && tilted && !hasVibrated) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setHasVibrated(true);
            }
        });

        DeviceMotion.setUpdateInterval(200);
        return () => sub.remove();
    }, [hasVibrated, orientation, isQrDetected]); 

// ----------------------------------------------------------------------
// 3. VISTAS Y RENDERIZADO
// ----------------------------------------------------------------------
    
    // VISTA PREVIA
    if (photoUri) {
        // ... (Return Preview View)
    }
    
    // VISTA DE PERMISOS
    if (!cameraPermission?.granted || !mediaPermission?.granted || locationStatus !== 'granted') {
        // ... (Return Permissions View)
    }

// ----------------------------------------------------------------------
// 4. VISTA DE CÁMARA (Lógica de las 3 condiciones y Layout Adaptable)
// ----------------------------------------------------------------------
    
    const lineRotationDeg = animatedRoll.interpolate({
        inputRange: [-90, 90],
        outputRange: ['-90deg', '90deg'],
        extrapolate: 'clamp', 
    });

    const baseRotation = orientation === 'LANDSCAPE' ? '90deg' : '0deg'; 
    
    // Movimiento Horizontal del Indicador de Pitch (usando screenWidth reactivo)
    const PITCH_TRANSLATION_MAX_X = currentScreenWidth * 0.4; 
    const pitchTranslationX = animatedPitch.interpolate({
        inputRange: [-90, 90], 
        outputRange: [-PITCH_TRANSLATION_MAX_X, PITCH_TRANSLATION_MAX_X], 
        extrapolate: 'clamp',
    });

    const isReadyToCapture = isLeveled && isTilted && isQrDetected;

    // --- ESTILOS DINÁMICOS PARA PITCH INDICATOR ---
    const getPitchContainerStyle = () => {
        if (orientation === 'LANDSCAPE') {
            // Se mueve al lateral derecho y rota
            return {
                top: 0, bottom: 0, right: 10, left: undefined, 
                width: 60, height: '100%', 
                justifyContent: 'center', alignItems: 'center',
                transform: [{ rotate: '90deg' }], 
            };
        } else {
            // Se queda en la parte superior (PORTRAIT)
            return {
                top: 10, left: 0, right: 0, height: 50, 
                justifyContent: 'center', alignItems: 'center', 
                paddingTop: 10, 
            };
        }
    };
    // -------------------------------------------

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFill}
                ref={cameraRef}
                facing="back"
                active={isCameraActive}
                ratio={'16:9'} 
                
                onBarcodeScanned={isCameraActive ? handleBarcodeScanned : undefined} 
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"], 
                }}
            />

            {/* BOTÓN DE REGRESO */}
            <TouchableOpacity onPress={goToMainScreen} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>

            {/* --- INDICADOR DE PITCH (Posición y Rotación Dinámicas) --- */}
            <View style={[
                styles.pitchIndicatorBaseContainer, // Estilo base
                getPitchContainerStyle() // Estilos dinámicos
            ]}>
                <Animated.View 
                    style={[
                        styles.pitchMarkerFixed, 
                        {
                            opacity: animatedPitchOpacity, 
                            backgroundColor: isTilted ? '#00FF00' : '#FF8C00', 
                            // El movimiento es translateX porque el contenedor ya está rotado en LANDSCAPE
                            transform: [{ translateX: pitchTranslationX }] 
                        }
                    ]} 
                >
                    <Text style={styles.pitchTextSimple}>
                         {pitchDeviation < -5 ? '▲ Arriba' : (pitchDeviation > 5 ?  '▼ Abajo'  : 'OK')}
                    </Text>
                </Animated.View>
            </View>
            {/* ------------------------------------------- */}

            {/* Cuadro guía (Tamaño dinámico) */}
            <View style={styles.frameContainer}> 
                <View style={[
                    styles.frameBase, // Estilo base
                    { 
                        // Tamaño dinámico según orientación
                        width: orientation === 'LANDSCAPE' ? `${FRAME_HEIGHT_PERCENT * 100}%` : `${FRAME_WIDTH_PERCENT * 100}%`,
                        height: orientation === 'LANDSCAPE' ? `${FRAME_WIDTH_PERCENT * 100}%` : `${FRAME_HEIGHT_PERCENT * 100}%`,
                        borderColor: isQrDetected ? '#00FFFF' : '#00FF00', 
                        opacity: isQrDetected ? 1.0 : 0.7 
                    }
                ]} />
            </View>

            {/* Línea de nivelación (ROLL) */}
            <View style={styles.levelLineContainer}>
                <Animated.View
                    style={[
                        styles.levelLine,
                        {
                            height: 2, 
                            opacity: animatedOpacity, 
                            transform: [
                                { rotate: lineRotationDeg }, 
                                { rotate: baseRotation }
                            ],
                            width: '80%', 
                            backgroundColor: isReadyToCapture ? '#0f0' : (isLeveled && isTilted ? '#FF8C00' : '#f00'), 
                        },
                    ]}
                />
            </View>

            {/* Botón de captura */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[
                        styles.captureButton, 
                        { 
                            backgroundColor: isReadyToCapture ? '#0f0' : '#fff',
                            opacity: cameraRef.current ? 0.9 : 0.4 
                        }
                    ]}
                    onPress={takePhoto}
                    disabled={!isReadyToCapture} 
                />
            </View>
        </View>
    );
}

// -------------------------------
// ESTILOS
// -------------------------------
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    textCenter: { color: '#fff', textAlign: 'center', fontSize: 18, marginTop: 50 },
    backButton: {
        position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 5,
    },
    backButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    frameContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    // ESTILO BASE DEL CUADRO GUÍA
    frameBase: {
        borderWidth: 2, borderRadius: 10, opacity: 0.7,
    },
    levelLineContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    levelLine: { borderRadius: 3,},
    buttonContainer: { position: 'absolute', bottom: 40, alignSelf: 'center', zIndex: 3 },
    captureButton: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#ccc', opacity: 0.9 },
    
    // ESTILO BASE PARA PITCH INDICATOR CONTAINER
    pitchIndicatorBaseContainer: {
        position: 'absolute',
        zIndex: 4,
    },
    pitchMarkerFixed: {
        alignItems: 'center', justifyContent: 'center', paddingVertical: 5, paddingHorizontal: 15, borderRadius: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Fondo para visibilidad
    },
    pitchTextSimple: {
        color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'center',
    },
    
    // Estilos de Preview...
});