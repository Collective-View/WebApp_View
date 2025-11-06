// app/DownloadAction.js

/**
 * @fileoverview Acción final de descarga
 * Implementa: Descarga simple y segura, inyectando metadatos en el nombre del archivo.
 */

import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Función para generar un ID aleatorio corto para evitar duplicados
const generateShortId = () => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
};

// Descarga simple que usa la etiqueta <a> de HTML
const downloadWeb = (uri, filename) => {
    if (Platform.OS !== 'web') return;
    const a = window.document.createElement('a'); 
    a.href = uri; 
    a.download = filename;
    window.document.body.appendChild(a); 
    a.click();
    window.document.body.removeChild(a);
};

// Componente auxiliar de WebImage (Renderizado estable)
const WebImage = ({ photoUri, style }) => { 
    if (Platform.OS !== 'web') return null;
    // ... (Código de WebImage sin cambios)
    return (
        <View style={style}>
            <img 
                src={photoUri} 
                alt="Previsualización de foto capturada"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: style.borderRadius || 10 }}
            />
        </View>
    );
};


// -------------------------------------------------------------------

export default function DownloadAction({ 
    photoUri, 
    metadata, 
    resetCameraView, 
    sargassumAnswer,
    isQrDetected 
}) {
    const [isSaving, setIsSaving] = useState(false); 

    const handleDownloadAttempt = async () => {
        if (!sargassumAnswer) return;
        
        const confirm = window.confirm("¿Deseas guardar la fotografía? Los datos de inspección se incrustarán en el nombre del archivo.");
        if (!confirm) return;
        
        setIsSaving(true);
        
        // --- 1. PREPARACIÓN DE DATOS ---
        const lat = metadata.location.latitude;
        const lon = metadata.location.longitude;
        
        // Formatear coordenadas (6 decimales) y datos
        const latFormatted = (typeof lat === 'number') ? lat.toFixed(6) : 'ND';
        const lonFormatted = (typeof lon === 'number') ? lon.toFixed(6) : 'ND';
        const qrStatus = isQrDetected ? 'SI' : 'NO';
        
        // Formatear timestamp a AAAA-MM-DD-HHMMSS
        const date = metadata.timestamp ? new Date(metadata.timestamp) : new Date();
        const timestampFormatted = date.toISOString().replace(/T/, '_').replace(/:/g, '').split('.')[0];
        
        // Generar ID único
        const randomId = generateShortId();
        
        // --- 2. CONSTRUCCIÓN DEL NOMBRE DE ARCHIVO ---
        const filename = `Sargazo_${sargassumAnswer}__Lat_${latFormatted}__Lon_${lonFormatted}__QR_${qrStatus}__Time_${timestampFormatted}__ID_${randomId}.jpg`;

        try {
            // --- 3. DESCARGA SIMPLE Y SEGURA ---
            downloadWeb(photoUri, filename); 
            
            Alert.alert(
                '¡Descarga exitosa!', 
                `Se descargó la foto con el nombre:\n${filename}`
            );
        } catch (error) {
            console.error("Fallo crítico de descarga:", error);
            Alert.alert('Error', 'Fallo al iniciar la descarga de la imagen.');
        } finally {
            setIsSaving(false);
            resetCameraView(); 
        }
    };
    
    // --------------------------------------------
    // === Guardar la fotografía
    // ------------------------------------------
    return (
        <View style={styles.previewContainer}>
            {/* ... (Resto del JSX) */}

            <View style={styles.finalActionButtonBox}>
                <Text style={styles.metadataTextTitle}>Respuesta registrada: **{sargassumAnswer}**</Text>
                <Text style={styles.metadataTextTitle}>Guardar datos en el nombre del archivo</Text>
                
                <View style={styles.finalActionButtonsGrid}>
                    <TouchableOpacity 
                        style={[styles.finalActionButton, {backgroundColor: '#387346ff'}]} 
                        onPress={handleDownloadAttempt}
                        disabled={isSaving}>
                        <Text style={styles.sargassumButtonText}>Guardar Foto</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.finalActionButton, {backgroundColor: '#752e35ff'}]} 
                        onPress={resetCameraView}
                        disabled={isSaving}>
                        <Text style={styles.sargassumButtonText}>Eliminar</Text>
                    </TouchableOpacity>
                </View>
            </View>
            
        </View>
    );
}


// ----------------------------------
// === Estilos === 
// ----------------------------------
const styles = StyleSheet.create({
    previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', }, 
    preview: { width: '90%', height: '40%', borderRadius: 10, resizeMode: 'contain', backgroundColor: 'transparent' }, 
    sargassumQuestionBox: { backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 15, borderRadius: 8, width: '90%', marginTop: 20, },
    sargassumButtonsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 15, },
    sargassumButton: { width: '48%', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10, },
    sargassumButtonText: { color: '#635c5cff', fontSize: 16, fontWeight: 'bold', },
    discardButton: { backgroundColor: '#7c474cff', padding: 15, borderRadius: 8, width: '90%', alignItems: 'center', marginTop: 10 },
    metadataTextTitle: { color: '#635c5cff', fontWeight: 'bold', fontSize: 18, marginBottom: 5, textAlign: 'center', },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 99, },
    loadingText: { color: '#635c5cff', marginTop: 10, fontSize: 16, },
    finalActionButtonBox: { 
        backgroundColor: 'rgba(0, 0, 0, 0.6)', 
        padding: 20, 
        borderRadius: 8, 
        width: '90%', 
        marginTop: 20, 
        alignItems: 'center',
    },
    finalActionButtonsGrid: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        width: '100%', 
        marginTop: 15, 
    },
    finalActionButton: { 
        width: '48%', 
        paddingVertical: 15, 
        borderRadius: 8, 
        alignItems: 'center', 
    },
    coordinatesOverlay: {
        position: 'absolute',
        bottom: '50%', 
        left: '5%', 
        padding: 5,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        borderRadius: 4,
        zIndex: 100,
    },
    overlayText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});