# Collective View: plataforma móvil para monitoreo ambiental colaborativo

**Collective View** es una aplicación web de captura fotográfica especializada diseñada para la **recolección de datos de sargazo en tiempo real** desde cualquier dispositivo móvil. 
El sistema ha sido diseñado para tener estabilidad en el navegador y precisión geométrica, lo que lo convierte en un insumo perfecto para el análisis cientifico, por este motivo, hemos migrado a una arquitectura modular y estable para garantizar la funcionalidad en **cualquier navegador**, priorizando la persistencia de datos.

---

## El desafío y el propósito

La presencia y acumulación de sargazo es un problema ambiental y económico creciente. La clave para su gestión es la **cuantificación precisa y el monitoreo constante**. 

**Collective View** aborda este desafío:

1.  **Estandarización de Datos:** Garantiza que cada fotografía capturada esté inclinada a **$70^\circ$** y perfectamente nivelada. Esta uniformidad es crucial para eliminar sesgos y optimizar la precisión en el procesamiento posterior.
2.  **Preparación para Análisis Avanzado:** Las tomas estandarizadas, junto con la futura inclusión de objetos de referencia (no implementados en este *MVP* pero previstos), son el insumo perfecto para:
    * **Fotogrametría:** Reconstrucción 3D y cálculo de volúmenes de sargazo.
    * **Visión por Computadora (CV):** Detección, clasificación.

---

## Características detalladas de la aplicación

El *Mínimo Producto Viable* (MVP) de **Collective View** está construido sobre **Expo/React Native** y alojado en **Firebase Hosting**. Se centra en asegurar la **precisión geométrica** de cada captura.

### Control de ángulo y nivelación (Geometría de captura)

| Característica | Detalle Técnico | Beneficio para el Análisis |
| :--- | :--- | :--- |
| **Ángulo de Inclinación (Pitch)** | Se exige un rango estricto de **$65^\circ$ a $75^\circ$** (óptimo $70^\circ$) mediante el sensor **`DeviceMotion`**. | Asegura que la cámara capture la misma porción de la escena, fundamental para la fotogrametría. |
| **Nivelación Lateral (Roll)** | Se requiere una nivelación de **$\pm 3^\circ$** para estabilizar la toma. | Evita distorsiones angulares, mejorando la calidad de los datos de entrada para Visión por Computadora (CV). |
| **Guía Visual Dinámica** | Una **línea de nivelación animada y sutil** refleja el desnivel en tiempo real (eje X de la pantalla) y se desvanece al alcanzar el objetivo. | Proporciona *feedback* intuitivo al usuario sin saturar la interfaz. |
| **Feedback Háptico** | Notificación táctil instantánea (`Haptics`) cuando se cumplen las dos condiciones (ángulo + nivelación). | Ofrece confirmación inmediata de la toma óptima. |

### Flujo de datos

Para garantizar la descarga en todos los navegadores móviles, el sistema almacena los metadatos de la inspección directamente en el 
nombre del archivo.

Los datos de la inspección se codifican en el nombe, separados por el doble guion bajo(__):
$`Sargazo_[Nivel]__Lat_[Latitud]__Lon_[Longitud]__QR_[Estado]__Time_[Timestamp]__ID_[Único].jpg`$

|Dato codificado | Fuente de la información | Utilidad |
| :--- | :--- | :--- |
| **Sargazo** | Respuesta del usuario (poco, mucho, etc.). | Clasificación visual del nivel de sargazo. |
| **Lat/lon** | Coordenadas GPS de la captura. | Ubicación precisa para el modelada de dispersión. |
| **Time** | Marca de tiempo de la captura. | Registro de toma de datos.
| **ID** | Identificador único. | Previene datos duplicados. |


### Componentes y tecnologías clave

* **`expo-camera`:** Gestión de la cámara y captura de la imagen.
* **`expo-sensors` (`DeviceMotion`):** Obtención de datos del acelerómetro/giroscopio para el control de la geometría.
* **`Animated` API de React Native:** Implementación de la animación fluida y el desvanecimiento de la línea de nivelación.

---

## Guía de puesta en marcha

Para clonar y ejecutar el proyecto localmente, asegúrate de estar en el directorio raíz de la aplicación:

### 1. Instalación de Dependencias

bash
`npm install`

### 2. Ejecutar la aplicación 
`npx expo start`

### 3. Estructura de desarrollo
El corazón de la aplicación que contiene la lógica de cámara, sensores, animaciones y estilos reside en el siguiente archivo `app/camera.js` Componente principal que maneja la vista de la cámara, las peticiones de permisos, la lógica de los sensores de inclinación (`DeviceMotion`) y toda la lógica de la interfaz de nivelación (línea animada y botón de disparo).

**Collective View: Ciencia ciudadana y monitoreo de sargazo**

Collective View es un proyecto de ciencia ciudadana que aprovecha la tecnología móvil para crear una red de monitoreo de sargazo a gran escala, transformando la contribución individual en datos valiosos para la investigación ambiental.
