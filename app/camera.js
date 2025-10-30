import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import { DeviceMotion } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator // Añadido para el estado de carga
    ,

    Alert,
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// --- IMPORTACIONES DE FIREBASE ---
import { addDoc, collection } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../firebaseConfig.js'; // Asegúrate que la ruta sea correcta
// ----------------------------------

// --- CÁLCULOS DE DIMENSIONES Y REGIÓN DE INTERÉS (ROI) ---
const { width: initialScreenWidth, height: initialScreenHeight } = Dimensions.get('window'); 
const FRAME_WIDTH_PERCENT = 0.50; 
const FRAME_HEIGHT_PERCENT = 0.20; 

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
    const { width: currentScreenWidth, height: currentScreenHeight } = dimensions; 
    const [orientation, setOrientation] = useState(INITIAL_ORIENTATION); 

    const [pitch, setPitch] = useState(0); 
    const [roll, setRoll] = useState(0);   
    const [isLeveled, setIsLeveled] = useState(false);
    const [isTilted, setIsTilted] = useState(false);
    const [hasVibrated, setHasVibrated] = useState(false);
    const [isQrDetected, setIsQrDetected] = useState(false); 
    const [isUploading, setIsUploading] = useState(false); // Estado de carga de Firebase

    const [pitchDeviation, setPitchDeviation] = useState(0); 
    const animatedRoll = useRef(new Animated.Value(0)).current; 
    const animatedOpacity = useRef(new Animated.Value(1)).current; 
    const animatedPitch = useRef(new Animated.Value(0)).current; 
    const animatedPitchOpacity = useRef(new Animated.Value(1)).current;

// ----------------------------------------------------------------------
// 0. FUNCIONES DE LÓGICA Y NAVEGACIÓN
// ----------------------------------------------------------------------
    const goToMainScreen = () => { router.back(); };
    
    const resetCameraView = () => {
        setPhotoUri(null); setMetadata(null); setIsQrDetected(false); 
        setIsUploading(false); setIsCameraActive(true);
    };

    // Recalcular ROI cuando cambian las dimensiones
    const roiConfigRef = useRef({ xStart: 0, xEnd: 0, yStart: 0, yEnd: 0 });
    useEffect(() => {
        const frameW = currentScreenWidth * FRAME_WIDTH_PERCENT;
        const frameH = currentScreenHeight * FRAME_HEIGHT_PERCENT;
        roiConfigRef.current = {
            xStart: (currentScreenWidth / 2) - (frameW / 2),
            xEnd: (currentScreenWidth / 2) + (frameW / 2),
            yStart: (currentScreenHeight / 2) - (frameH / 2),
            yEnd: (currentScreenHeight / 2) + (frameH / 2),
        };
    }, [currentScreenWidth, currentScreenHeight]);

    const handleBarcodeScanned = ({ bounds }) => {
        if (!isCameraActive) return; 

        const { xStart, xEnd, yStart, yEnd } = roiConfigRef.current;
        
        const centerX = bounds.origin.x + (bounds.size.width / 2);
        const centerY = bounds.origin.y + (bounds.size.height / 2);

        const isInsideROI = 
            centerX >= xStart && centerX <= xEnd &&
            centerY >= yStart && centerY <= yEnd;
        
        setIsQrDetected(isInsideROI);
    };

// ----------------------------------------------------------------------
// 1. GESTIÓN DE PERMISOS (Corregido)
// ----------------------------------------------------------------------
    useEffect(() => {
        const dimensionsSubscription = Dimensions.addEventListener('change', ({ window }) => {
            setDimensions(window);
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
            if (!data || !data.rotation) return;

            let { beta, gamma } = data.rotation;
            beta = (beta * 180) / Math.PI;
            gamma = (gamma * 180) / Math.PI;

            const absGamma = Math.abs(gamma);
            if (orientation === 'PORTRAIT' && absGamma > 75) { setOrientation('LANDSCAPE'); } 
            else if (orientation === 'LANDSCAPE' && absGamma < 15) { setOrientation('PORTRAIT'); }
            
            let correctedPitch, correctedRoll;
            if (orientation === 'PORTRAIT') { correctedPitch = beta; correctedRoll = gamma; } 
            else { correctedRoll = -beta; correctedPitch = -gamma; }

            setPitch(correctedPitch);
            setRoll(correctedRoll);

            Animated.spring(animatedRoll, { toValue: correctedRoll, useNativeDriver: true, speed: 5, bounciness: 0, }).start();
            
            const leveled = Math.abs(correctedRoll) <= 3;
            const tilted = Math.abs(correctedPitch) >= 65 && Math.abs(correctedPitch) <= 75;

            const currentPitchDeviation = correctedPitch - 70;
            setPitchDeviation(currentPitchDeviation); 

            Animated.spring(animatedPitch, { toValue: currentPitchDeviation, useNativeDriver: true, speed: 10, bounciness: 0, }).start();
            
            if (tilted) { Animated.timing(animatedPitchOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(); } 
            else { Animated.timing(animatedPitchOpacity, { toValue: 1, duration: 100, useNativeDriver: true }).start(); }

            setIsLeveled(leveled);
            setIsTilted(tilted);
            
            if (!leveled || !tilted) { setHasVibrated(false); if (isQrDetected) { setIsQrDetected(false); }}
            if (leveled) { Animated.timing(animatedOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(); } 
            else { Animated.timing(animatedOpacity, { toValue: 1, duration: 100, useNativeDriver: true }).start(); }

            if (leveled && tilted && !hasVibrated) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setHasVibrated(true); }
        });

        DeviceMotion.setUpdateInterval(200);
        return () => sub.remove();
    }, [hasVibrated, orientation, isQrDetected]); 

// ----------------------------------------------------------------------
// 3. FUNCIÓN CLAVE: GUARDAR EN FIREBASE (Firestore y Storage)
// ----------------------------------------------------------------------
    const handleSaveAndUpload = async (sargassumAnswer) => {
        if (!photoUri || !metadata) return;

        const user = auth.currentUser;
        if (!user) {
            Alert.alert("Error de Sesión", "Debe iniciar sesión para subir datos.");
            return;
        }

        setIsUploading(true); 
        const userId = user.uid;
        const filename = `${new Date().getTime()}_${userId}.jpg`;

        try {
            // 1. SUBIR IMAGEN A FIREBASE STORAGE
            const response = await fetch(photoUri);
            const blob = await response.blob();
            const storageRef = ref(storage, `inspecciones/${userId}/${filename}`);
            
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);

            // 2. PREPARAR Y GUARDAR METADATOS EN FIRESTORE
            const dataToSave = {
                userId: userId,
                userEmail: user.email,
                sargazoDetectado: sargassumAnswer,
                imageUrl: downloadURL,
                focalLength: metadata.focalLength,
                latitude: metadata.location.latitude,
                longitude: metadata.location.longitude,
                timestamp: metadata.timestamp,
                qrScanned: "Sí", // Se asume que el QR fue escaneado, ya que el botón estaba activo.
            };

            await addDoc(collection(db, "inspecciones"), dataToSave);
            
            Alert.alert('Éxito', 'Inspección guardada y subida a la nube.');
            resetCameraView();

        } catch (error) {
            console.error("Error al guardar en Firebase:", error);
            Alert.alert('Error de Subida', `No se pudieron guardar los datos: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };
    
// ----------------------------------------------------------------------
// 4. CAPTURAR FOTO (Llama a la vista de Pregunta)
// ----------------------------------------------------------------------
    const takePhoto = async () => {
        if (!cameraRef.current) return;
        
        const isReadyToCapture = isLeveled && isTilted && isQrDetected;

        if (!isReadyToCapture) {
            if (!isLeveled) return Alert.alert('Captura Fallida', 'El teléfono debe estar nivelado (Roll ≈ 0°).');
            if (!isTilted) return Alert.alert('Captura Fallida', 'El teléfono debe estar inclinado (Pitch 65°-75°).');
            if (!isQrDetected) return Alert.alert('Captura Fallida', 'El código QR debe estar visible dentro del cuadro de referencia.');
            return; 
        }
        
        let tempMetadata = { 
            location: { latitude: 'No disponible', longitude: 'No disponible' }, 
            focalLength: 'No disponible',
            timestamp: new Date().toISOString()
        };

        try {
            if (locationStatus === 'granted') {
                const locationData = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeout: 5000 });
                tempMetadata.location = {
                    latitude: locationData.coords.latitude,
                    longitude: locationData.coords.longitude,
                };
            } 

            const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true, exif: true, });
            
            if (photo.exif && photo.exif.FocalLength) {
                tempMetadata.focalLength = photo.exif.FocalLength.toFixed(2);
            }
            
            setPhotoUri(photo.uri);
            setIsCameraActive(false);
            setMetadata(tempMetadata);

        } catch (error) {
            console.error("Error en takePhoto:", error);
            Alert.alert('Error', 'No se pudo tomar la foto.');
        }
    };

// ----------------------------------------------------------------------
// 5. VISTAS Y RENDERIZADO
// ----------------------------------------------------------------------
    
    // VISTA PREVIA (MODIFICADA PARA LA PREGUNTA DE SARGAZO)
    if (photoUri) {
        // ... (Renderizado de la vista previa con los botones de sargazo)
        const isReadyToCapture = isLeveled && isTilted && isQrDetected;
        return (
            <View style={styles.previewContainer}>
                {isUploading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>Guardando en la nube...</Text>
                    </View>
                )}

                <Image source={{ uri: photoUri }} style={styles.preview} />
                
                {/* PREGUNTA DE SARGAZO */}
                <View style={styles.sargassumQuestionBox}>
                    <Text style={styles.metadataTextTitle}>¿Cuánto sargazo hay?</Text>
                    
                    {/* Cuadrícula 2x2 para las 4 opciones */}
                    <View style={styles.sargassumButtonsGrid}>
                        <TouchableOpacity style={[styles.sargassumButton, {backgroundColor: '#5cb85c'}]} onPress={() => handleSaveAndUpload('Nada')} disabled={isUploading}>
                           <Text style={styles.sargassumButtonText}>Nada</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={[styles.sargassumButton, {backgroundColor: '#f0ad4e'}]} onPress={() => handleSaveAndUpload('Poco')} disabled={isUploading}>
                           <Text style={styles.sargassumButtonText}>Poco</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.sargassumButton, {backgroundColor: '#d9534f'}]} onPress={() => handleSaveAndUpload('Mas o menos')} disabled={isUploading}>
                           <Text style={styles.sargassumButtonText}>M/M</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={[styles.sargassumButton, {backgroundColor: '#8B0000'}]} onPress={() => handleSaveAndUpload('Mucho')} disabled={isUploading}>
                           <Text style={styles.sargassumButtonText}>Mucho</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                {/* Botón Descartar */}
                <TouchableOpacity style={styles.discardButton} onPress={resetCameraView} disabled={isUploading}>
                   <Text style={{color: '#fff', textAlign: 'center'}}>Descartar Foto</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    // VISTA DE PERMISOS
    if (!cameraPermission?.granted || !mediaPermission?.granted || locationStatus !== 'granted') {
        return (
            <View style={styles.container}>
                <Text style={styles.textCenter}>
                    Se requieren permisos de cámara, almacenamiento y ubicación para usar la app.
                </Text>
            </View>
        );
    }

// ----------------------------------------------------------------------
// 6. VISTA DE CÁMARA (RENDERIZADO PRINCIPAL)
// ----------------------------------------------------------------------
    
    const lineRotationDeg = animatedRoll.interpolate({ inputRange: [-90, 90], outputRange: ['-90deg', '90deg'], extrapolate: 'clamp', });
    const baseRotation = orientation === 'LANDSCAPE' ? '90deg' : '0deg'; 
    const PITCH_TRANSLATION_MAX_X = currentScreenWidth * 0.4; 
    const pitchTranslationX = animatedPitch.interpolate({ inputRange: [-90, 90], outputRange: [-PITCH_TRANSLATION_MAX_X, PITCH_TRANSLATION_MAX_X], extrapolate: 'clamp', });
    const isReadyToCapture = isLeveled && isTilted && isQrDetected;
    const pitchRotationStyle = orientation === 'LANDSCAPE' ? { transform: [{ rotate: '90deg' }] } : {};

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFill}
                ref={cameraRef}
                facing="back"
                active={isCameraActive}
                ratio={'16:9'} 
                onBarcodeScanned={isCameraActive ? handleBarcodeScanned : undefined} 
                barcodeScannerSettings={{ barcodeTypes: ["qr"], }}
            />

            {/* BOTÓN DE REGRESO */}
            <TouchableOpacity onPress={goToMainScreen} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>

            {/* INDICADOR DE PITCH */}
            <View style={[styles.pitchIndicatorContainer, pitchRotationStyle]}>
                <Animated.View style={[styles.pitchMarkerFixed, { opacity: animatedPitchOpacity, backgroundColor: isTilted ? '#00FF00' : '#FF8C00', transform: [{ translateX: pitchTranslationX }] } ]} >
                    <Text style={styles.pitchTextSimple}>
                         {pitchDeviation < -5 ? '▼ Inclinar más' : (pitchDeviation > 5 ? '▲ Inclinar menos' : '70° OK')}
                    </Text>
                </Animated.View>
            </View>

            {/* Cuadro guía */}
            <View style={styles.frameContainer}> 
                <View style={[styles.frameBase, { width: orientation === 'LANDSCAPE' ? `${FRAME_HEIGHT_PERCENT * 100}%` : `${FRAME_WIDTH_PERCENT * 100}%`, height: orientation === 'LANDSCAPE' ? `${FRAME_WIDTH_PERCENT * 100}%` : `${FRAME_HEIGHT_PERCENT * 100}%`, borderColor: isQrDetected ? '#00FFFF' : '#00FF00', opacity: isQrDetected ? 1.0 : 0.7 } ]} />
            </View>

            {/* Línea de nivelación (ROLL) */}
            <View style={styles.levelLineContainer}>
                <Animated.View
                    style={[styles.levelLine, { height: 2, opacity: animatedOpacity, transform: [ { rotate: lineRotationDeg }, { rotate: baseRotation } ], width: '80%', backgroundColor: isReadyToCapture ? '#0f0' : (isLeveled && isTilted ? '#FF8C00' : '#f00'), }]}
                />
            </View>

            {/* Botón de captura */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.captureButton, { backgroundColor: isReadyToCapture ? '#0f0' : '#fff', opacity: cameraRef.current ? 0.9 : 0.4 }]}
                    onPress={takePhoto}
                    disabled={!isReadyToCapture} 
                />
            </View>
        </View>
    );
}

// -------------------------------
// ESTILOS (Sin cambios en valores)
// -------------------------------
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    textCenter: { color: '#fff', textAlign: 'center', fontSize: 18, marginTop: 50 },
    backButton: {
        position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 5,
    },
    backButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    frameContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    frameBase: {
        borderWidth: 2, borderRadius: 10, opacity: 0.7,
    },
    levelLineContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    levelLine: { borderRadius: 3,},
    buttonContainer: { position: 'absolute', bottom: 40, alignSelf: 'center', zIndex: 3 },
    captureButton: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#ccc', opacity: 0.9 },
    
    pitchIndicatorContainer: {
        position: 'absolute', top: 10, left: 0, right: 0, height: 50, justifyContent: 'center', alignItems: 'center', paddingTop: 10, zIndex: 4,
    },
    pitchMarkerFixed: {
        alignItems: 'center', justifyContent: 'center', paddingVertical: 5, paddingHorizontal: 15, borderRadius: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    pitchTextSimple: {
        color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'center',
    },
    
    // Estilos de Preview y Sargazo
    previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', },
    preview: { width: '90%', height: '40%', borderRadius: 10, marginBottom: 15, },
    sargassumQuestionBox: { backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 15, borderRadius: 8, width: '90%', marginBottom: 15, },
    sargassumButtonsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 15, },
    sargassumButton: { width: '48%', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10, },
    sargassumButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', },
    discardButton: { backgroundColor: '#dc3545', padding: 15, borderRadius: 8, width: '90%', alignItems: 'center', },
    metadataTextTitle: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginBottom: 5, textAlign: 'center', },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 99, },
    loadingText: { color: '#fff', marginTop: 10, fontSize: 16, },
});