# Sistema de Monitoreo de Lluvia CVC

Aplicación web interactiva para registrar eventos de precipitación por zona y comparar los valores obtenidos con el estándar de lluvia de Cali de **14 mm**.

El sistema permite ingresar la dirección de la zona, horario de inicio y finalización de la lluvia, precipitación registrada, usuario responsable y fotografía del lugar. También calcula la duración del evento, aplica el ajuste horario del **5,3 %** cuando corresponde y muestra los resultados en una gráfica dinámica.

## Características

- Login con credenciales de acceso.
- Registro de precipitación por zona.
- Cálculo automático de duración y precipitación.
- Comparación con el estándar de Cali de 14 mm.
- Ajuste horario del 5,3 % entre las 15:00 y 18:00.
- Validación para evitar registros duplicados.
- Visualización de registros y gráfica de barras.
- Captura y vista previa de fotografías.
- Almacenamiento temporal en memoria.
- Diseño responsive para computador y dispositivos móviles.

## Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript
- FileReader API para imágenes

## Credenciales de prueba

```text
Usuario: CVC
Contraseña: Lluvias
Clave de seguridad: CLIMA
Importante
La aplicación funciona sin base de datos. Los registros y fotografías se almacenan únicamente en memoria, por lo que se eliminan al recargar o cerrar la página.
Este proyecto tiene fines académicos y demostrativos. La autenticación utiliza credenciales definidas en el código JavaScript y no debe considerarse un sistema de seguridad para producción.

▣  Plan · GPT-5.6 Luna · 19.1s
