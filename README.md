# View: plataforma móvil para monitoreo ambiental colaborativo

**View** es una aplicación de captura fotográfica especializada diseñada para la **recolección de datos de sargazo en tiempo real** desde cualquier dispositivo móvil. Este proyecto busca estandarizar la entrada de datos visuales, creando un *dataset* robusto y consistente, ideal para el análisis científico y la automatización mediante tecnologías avanzadas.

---

## El desafío y el propósito

La presencia y acumulación de sargazo es un problema ambiental y económico creciente. La clave para su gestión es la **cuantificación precisa y el monitoreo constante**.

**View** aborda este desafío:

1.  **Estandarización de Datos:** Garantiza que cada fotografía capturada esté inclinada a **$70^\circ$** y perfectamente nivelada. Esta uniformidad es crucial para eliminar sesgos y optimizar la precisión en el procesamiento posterior.
2.  **Preparación para Análisis Avanzado:** Las tomas estandarizadas, junto con la futura inclusión de objetos de referencia (no implementados en este *MVP* pero previstos), son el insumo perfecto para:
    * **Fotogrametría:** Reconstrucción 3D y cálculo de volúmenes de sargazo.
    * **Visión por Computadora (CV):** Detección, clasificación y seguimiento automatizado de la biomasa.

---

## Características detalladas de la aplicación

El *Mínimo Producto Viable* (MVP) de **View** está construido sobre **Expo/React Native** y se centra en asegurar la **precisión geométrica** de cada captura.

### Control de ángulo y nivelación (Geometría de captura)

| Característica | Detalle Técnico | Beneficio para el Análisis |
| :--- | :--- | :--- |
| **Ángulo de Inclinación (Pitch)** | Se exige un rango estricto de **$65^\circ$ a $75^\circ$** (óptimo $70^\circ$) mediante el sensor **`DeviceMotion`**. | Asegura que la cámara capture la misma porción de la escena, fundamental para la fotogrametría. |
| **Nivelación Lateral (Roll)** | Se requiere una nivelación de **$\pm 3^\circ$** para estabilizar la toma. | Evita distorsiones angulares, mejorando la calidad de los datos de entrada para Visión por Computadora (CV). |
| **Guía Visual Dinámica** | Una **línea de nivelación animada y sutil** refleja el desnivel en tiempo real (eje X de la pantalla) y se desvanece al alcanzar el objetivo. | Proporciona *feedback* intuitivo al usuario sin saturar la interfaz. |
| **Feedback Háptico** | Notificación táctil instantánea (`Haptics`) cuando se cumplen las dos condiciones (ángulo + nivelación). | Ofrece confirmación inmediata de la toma óptima. |

### Manejo de orientación

* **Adaptabilidad `PORTRAIT`/`LANDSCAPE`:** La lógica del sensor y la interfaz (guías y botón) se ajustan automáticamente al rotar el dispositivo.
* **Transición de Ejes:** El *roll* y el *pitch* se recalculan usando la corrección de ejes (Beta y Gamma) para garantizar que la nivelación y la inclinación funcionen de forma coherente, independientemente de la orientación del teléfono.

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

Collective View: Ciencia Ciudadana y Monitoreo de Sargazo

Collective View es un proyecto de ciencia ciudadana que aprovecha la tecnología móvil para crear una red de monitoreo de sargazo a gran escala, transformando la contribución individual en datos valiosos para la investigación ambiental.
