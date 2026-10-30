# Gesture Video Player Pro

App web escolar con reproductor multimedia controlado por gestos usando cámara, cursor virtual y diseño responsivo.

## Características principales

- 5 videos en lista de reproducción
- Pantalla adaptada para móvil, tablet y escritorio
- Controles por gestos con detección de manos
- Dibujo de la mano en la pantalla
- Cursor tipo mouse con el dedo índice
- Clic simulado con pinza
- Control del video por palmada, puño, señal V, swipe y movimiento de mano
- Ajuste de volumen y avance/retroceso con gestos
- Compatible con GitHub Pages

## Gestos implementados

- Palma abierta -> reproducir / pausar
- Puño -> siguiente video
- Señal V -> video anterior
- Deslizar a la derecha -> retroceder 10 segundos
- Deslizar a la izquierda -> adelantar 10 segundos
- Mano arriba -> subir volumen
- Mano abajo -> bajar volumen
- Pinza -> clic del cursor virtual
- Dedo índice -> cursor del mouse

## Requisitos

- Navegador moderno con soporte para cámara
- Permiso de acceso a la cámara y micrófono no requerido porque solo se usa video
- HTTPS o GitHub Pages para acceso seguro a la cámara

## Despliegue en GitHub Pages

1. Sube todos los archivos a un repositorio público o privado.
2. Ve a Settings > Pages.
3. Selecciona la rama principal y la carpeta raíz.
4. Guarda los cambios.
5. La app quedará disponible en una URL de GitHub Pages.

## Archivos importantes

- `index.html`
- `style.css`
- `app.js`

## Nota

La detección por gestos depende de la calidad de la cámara, la iluminación del entorno y el hardware del dispositivo. En la mayoría de equipos modernos funciona bien para un proyecto escolar.

