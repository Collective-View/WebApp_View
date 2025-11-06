// app/SargassumQuestion.js

/**
 * @fileoverview Lógica de preguntas
 * Se encarga de: Flujo de preguntas, Renderizado Estable de Imagen y transición a Descarga.
 */

import { useState } from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Importa el siguiente componente de descarga
import DownloadAction from './DownloadAction';

// --- Componente Auxiliar para Web (Renderizado Estable) ---
const WebImage = ({ photoUri, style }) => { 
    if (Platform.OS !== 'web') return null;
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

export default function SargassumQuestion({ 
    photoUri, 
    metadata, 
    resetCameraView, 
    isQrDetected 
}) {
    const [sargassumAnswer, setSargassumAnswer] = useState(null);

    if (sargassumAnswer) {
        return (
            <DownloadAction
                photoUri={photoUri}
                metadata={metadata}
                resetCameraView={resetCameraView}
                sargassumAnswer={sargassumAnswer}
            />
        );
    }
    // ------------------------------
    // === Pregunta inicial ====
    //-------------------------------
    return (
        <View style={styles.previewContainer}>
            {Platform.OS === 'web' ? (
                <WebImage photoUri={photoUri} style={styles.preview} />
            ) : (
                <Image source={{ uri: photoUri }} style={styles.preview} />
            )}
            
            {metadata && (
                <View style={styles.coordinatesOverlay}>
                    <Text style={styles.overlayText}>{metadata.timestamp ? new Date(metadata.timestamp).toLocaleTimeString() : 'N/A'}</Text>
                </View>
            )}

            <View style={styles.sargassumQuestionBox}>
                <Text style={styles.metadataTextTitle}>¿Cuánto sargazo hay?</Text>
                <View style={styles.sargassumButtonsGrid}>
                    {['Nada', 'Poco', 'Mas o menos', 'Mucho'].map((answer, index) => (
                        <TouchableOpacity 
                            key={index}
                            style={[styles.sargassumButton, {backgroundColor: ['#5cb85c', '#f0ad4e', '#d9534f', '#8B0000'][index]}]} 
                            onPress={() => setSargassumAnswer(answer)}> {/* <-- SetState directo para fluidez */}
                            <Text style={styles.sargassumButtonText}>{answer === 'Mas o menos' ? 'M/M' : answer}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity style={styles.discardButton} onPress={resetCameraView}>
                <Text style={{color: '#fff', textAlign: 'center'}}>Descartar foto</Text>
            </TouchableOpacity>
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
    sargassumButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', },
    discardButton: { backgroundColor: '#7c474cff', padding: 15, borderRadius: 8, width: '90%', alignItems: 'center', marginTop: 10 },
    metadataTextTitle: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginBottom: 5, textAlign: 'center', },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 99, },
    loadingText: { color: '#fff', marginTop: 10, fontSize: 16, },
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