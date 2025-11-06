// app/camera.js

/**
 * @fileoverview Cámara principal
 * Incluye: Permisos condicionales web, Lógica de Sensores.
 */

import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { DeviceMotion } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import SargassumQuestion from './SargassumQuestion';

// --- CONSTANTES Y UTILS ---
const FRAME_SIZE_PX = 150; 
const getDimensions = () => Dimensions.get('window');
// -------------------------------------------------------------------
// === Componente principal ===
// -------------------------------------------------------------------

export default function CameraScreen() {
    
    // === Estabilidad web: Permisos y estados básicos ===
    const isWeb = Platform.OS === 'web';
    const [cameraPermission, requestCameraPermission] = 
        isWeb 
        ? [{ granted: true, status: 'granted' }, () => {}] 
        : useCameraPermissions();

    const [locationStatus, setLocationStatus] = useState(null); 
    const [isCameraReady, setIsCameraReady] = useState(false); 

    const cameraRef = useRef(null);
    const [photoUri, setPhotoUri] = useState(null); 
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [metadata, setMetadata] = useState(null); 
    const [dimensions] = useState(getDimensions());
    const [cameraKey, setCameraKey] = useState(0);
    
    // Sensores y control
    const [pitch, setPitch] = useState(0); 
    const [roll, setRoll] = useState(0);   
    const [isLeveled, setIsLeveled] = useState(false); 
    const [isTilted, setIsTilted] = useState(false); 
    const [isQrDetected, setIsQrDetected] = useState(false); 

    // Animaciones
    const animatedRoll = useRef(new Animated.Value(0)).current; 
    const animatedOpacity = useRef(new Animated.Value(1)).current; 
    const animatedPitch = useRef(new Animated.Value(0)).current; 
    const animatedPitchOpacity = useRef(new Animated.Value(1)).current;

// ----------------------------------------------------------------------
// === 0. Funciones de flujo y QR ===
// ----------------------------------------------------------------------
    const goToMainScreen = () => { router.back(); };
    
    const resetCameraView = () => {
        setPhotoUri(null); 
        setIsCameraActive(true); 
        setMetadata(null);

        setPitch(0); 
        setRoll(0);
        setIsLeveled(false); 
        setIsTilted(false);

        setCameraKey(prevKey => prevKey + 1); 

    };

    const handleBarcodeScanned = ({ bounds }) => {
        const { width: currentScreenWidth, height: currentScreenHeight } = dimensions; 
        if (!bounds || !isCameraActive) return;
        const xCenter = currentScreenWidth / 2;
        const yCenter = currentScreenHeight / 2;
        const xStart = xCenter - FRAME_SIZE_PX / 2; 
        const xEnd = xCenter + FRAME_SIZE_PX / 2;
        const yStart = yCenter - FRAME_SIZE_PX / 2; 
        const yEnd = yCenter + FRAME_SIZE_PX / 2;
        
        const qrCenter = { x: bounds.origin.x + bounds.size.width / 2, y: bounds.origin.y + bounds.size.height / 2 };
        const isWithinRoi = (qrCenter.x >= xStart && qrCenter.x <= xEnd && qrCenter.y >= yStart && qrCenter.y <= yEnd);
        setIsQrDetected(isWithinRoi);
    };


// ----------------------------------------------------------------------
// === 1. Permisos y ubicación ===
// ----------------------------------------------------------------------
    
    useEffect(() => {
        if (!cameraPermission?.granted) requestCameraPermission();
    
        if (Platform.OS !== 'web') {
            (async () => {
                let { status } = await Location.requestForegroundPermissionsAsync();
                setLocationStatus(status);
            })();
        } else {
            setLocationStatus('granted'); 
        }
    }, [cameraPermission]);
    
// ----------------------------------------------------------------------
// === 2. Sensor de inclinación y nivelación ===
// ----------------------------------------------------------------------
    
    const processSensorData = (beta, gamma) => {
        beta = beta || 0; gamma = gamma || 0;
        const useNativeDriver = Platform.OS !== 'web';
        const currentOrientation = Math.abs(gamma) > 45 ? 'LANDSCAPE' : 'PORTRAIT';
        let correctedPitch = beta; let correctedRoll = gamma; 
        if (currentOrientation === 'LANDSCAPE') { correctedRoll = -beta; correctedPitch = -gamma; }
        setPitch(correctedPitch); setRoll(correctedRoll);

        const uiRollThreshold = 4; const pitchMin = 60; const pitchMax = 70; const targetPitch = 65;
        const leveled = Math.abs(correctedRoll) <= uiRollThreshold;
        const tilted = Math.abs(correctedPitch) >= pitchMin && Math.abs(correctedPitch) <= pitchMax;
        
        const currentPitchDeviation = correctedPitch - targetPitch;

        Animated.spring(animatedRoll, { toValue: correctedRoll, useNativeDriver, speed: 5, bounciness: 0, }).start();
        Animated.timing(animatedOpacity, { toValue: 1, duration: 100, useNativeDriver: Platform.OS !== 'web' }).start(); 
        Animated.spring(animatedPitch, { toValue: currentPitchDeviation, useNativeDriver, speed: 10, bounciness: 0, }).start();
        if (tilted) { Animated.timing(animatedPitchOpacity, { toValue: 0, duration: 300, useNativeDriver }).start(); } 
        else { Animated.timing(animatedPitchOpacity, { toValue: 1, duration: 100, useNativeDriver }).start(); }
        
        setIsLeveled(leveled); setIsTilted(tilted);
        
        if (!leveled || !tilted) { setHasVibrated(false); }
        
        if (useNativeDriver && leveled && tilted && !hasVibrated) { 
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); 
            setHasVibrated(true); 
        }
    };
    
    useEffect(() => {
        if (!isCameraActive) return; 

        if (Platform.OS !== 'web') {
            DeviceMotion.setUpdateInterval(200);
            const sub = DeviceMotion.addListener((data) => {
                if (!data || !data.rotation) return;
                let { beta, gamma } = data.rotation;
                beta = (beta * 180) / Math.PI;
                gamma = (gamma * 180) / Math.PI;
                processSensorData(beta, gamma);
            });
            return () => sub.remove();
        } else {
            const handleWebOrientation = (event) => { 
                if (event.beta !== null && event.gamma !== null) {
                    processSensorData(event.beta, event.gamma); 
                }
            };
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission().then(permissionState => {
                    if (permissionState === 'granted') { window.addEventListener('deviceorientation', handleWebOrientation); }
                }).catch(() => { window.addEventListener('deviceorientation', handleWebOrientation); });
            } else { window.addEventListener('deviceorientation', handleWebOrientation); }
            
            return () => window.removeEventListener('deviceorientation', handleWebOrientation);
        }
    }, [isCameraActive, animatedOpacity]);

// ----------------------------------------------------------------------
// === 3. Capturar foto === 
// ----------------------------------------------------------------------
   const takePhoto = async () => {
        if (!cameraRef.current) { Alert.alert('Error', 'Cámara no inicializada.'); return; }
        let tempMetadata = { location: { latitude: 'No disponible', longitude: 'No disponible' }, focalLength: 'No disponible', timestamp: new Date().toISOString() };

        try {
            if (locationStatus === 'granted') { 
                let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeout: 5000 });
                tempMetadata.location = { latitude: location.coords.latitude, longitude: location.coords.longitude, };
            } 
                       
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: true, exif: true, base64: false }); 

            if (photo.exif && photo.exif.FocalLength) { tempMetadata.focalLength = photo.exif.FocalLength.toString(); }
            
            if (photo.uri) {
                setPhotoUri(photo.uri); 
                setIsCameraActive(false); 
                setMetadata(tempMetadata);
            } else {
                Alert.alert('Error', 'No se pudo obtener la URI de la foto.');
            }

        } catch (error) {
            console.error("Fallo al disparar la cámara:", error);
            Alert.alert('Error', 'No se pudo tomar la foto.');
        }
    };
// ----------------------------------------------------------------------
// === 4. Renderizado ===
// ----------------------------------------------------------------------
    
    if (cameraPermission === null || locationStatus === null || !cameraPermission?.granted) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#435161ff" />
                <Text style={styles.permissionText}>Solicitando permisos...</Text>
                
                {!cameraPermission?.granted && (
                    <TouchableOpacity onPress={requestCameraPermission} style={styles.requestButton}>
                         <Text style={styles.requestButtonText}>Reintentar permiso de cámara</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }
    
   
    if (photoUri) {
        return (
            <SargassumQuestion
                photoUri={photoUri} 
                metadata={metadata}
                resetCameraView={resetCameraView}
                isQrDetected={isQrDetected}
            />
        );
    }

    // -----------------------------------------------
    // === Vista de cámara activa ===
    //------------------------------------------------ 
    const currentScreenWidth = Dimensions.get('window').width; 
    const lineRotationDeg = animatedRoll.interpolate({ inputRange: [-90, 90], outputRange: ['-90deg', '90deg'], extrapolate: 'clamp', });
    const PITCH_TRANSLATION_MAX_X = currentScreenWidth * 0.4; 
    const pitchTranslationX = animatedPitch.interpolate({ inputRange: [-90, 90], outputRange: [-PITCH_TRANSLATION_MAX_X, PITCH_TRANSLATION_MAX_X], extrapolate: 'clamp', });
    
    const isReadyToCapture = cameraPermission?.granted; 
    
    return (
        <View style={styles.container} key={cameraKey}>
            <CameraView 
                style={StyleSheet.absoluteFill}
                facing="back"
                ref={cameraRef}
                onBarcodeScanned={isCameraActive ? handleBarcodeScanned : undefined}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onCameraReady={() => setIsCameraReady(true)}
            />

            <TouchableOpacity onPress={goToMainScreen} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>

            <View style={styles.pitchIndicatorContainer}>
                <Animated.View style={[{ transform: [{ translateX: pitchTranslationX }], opacity: animatedPitchOpacity }, styles.pitchMarkerFixed, { backgroundColor: isTilted ? '#007bff' : 'rgba(255, 255, 255, 0.2)' }]}>
                    <Text style={styles.pitchTextSimple}>{isTilted ? '¡Ángulo correcto!' : 'Ajustar ángulo'}</Text>
                </Animated.View>
            </View>

            <View style={styles.frameContainer}>
                <View style={[styles.frameBase, { borderColor: isQrDetected ? '#0f0' : 'rgba(255, 255, 255, 0.4)', width: FRAME_SIZE_PX, height: FRAME_SIZE_PX }]} />
            </View>

            <View style={styles.levelLineContainer}>
                <Animated.View
                    style={[
                        styles.levelLine, 
                        { 
                            opacity: animatedOpacity, 
                            transform: [ { rotate: lineRotationDeg } ],
                            width: '80%', 
                            backgroundColor: isLeveled ? '#0f0' : '#f00' 
                        }
                    ]}
                />
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={takePhoto} disabled={!isReadyToCapture || !isTilted || !isLeveled} style={[styles.captureButton, { borderColor: (isReadyToCapture && isTilted && isLeveled) ? '#0f0' : 'gray' }]}/>
            </View>
        </View>
    );
}


// ----------------------------------
// === Estilos === 
// ----------------------------------
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    backButton: { position: 'absolute', top: 40, left: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 5, },
    backButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    permissionText: { color: 'white', fontSize: 18, textAlign: 'center', marginVertical: 10 },
    requestButton: { backgroundColor: '#495e75ff', padding: 15, borderRadius: 8, marginVertical: 10 },
    requestButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    pitchIndicatorContainer: { position: 'absolute', top: 50, width: '100%', alignItems: 'center', zIndex: 10, },
    pitchMarkerFixed: { position: 'absolute', width: 150, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', },
    pitchTextSimple: { color: 'white', fontWeight: 'bold', fontSize: 14, textAlign: 'center', },
    levelLineContainer: { position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', top: 0, left: 0, zIndex: 5, },
    levelLine: { position: 'absolute', height: 6, backgroundColor: 'red', },
    frameContainer: { position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', zIndex: 5, },
    frameBase: { borderWidth: 5, borderRadius: 10, },
    buttonContainer: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center', zIndex: 10, },
    captureButton: { width: 70, height: 70, borderRadius: 35, borderWidth: 5, borderColor: 'gray', backgroundColor: 'rgba(255, 255, 255, 0.5)' },
});