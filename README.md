# Gesture Video Player

Una aplicación web escolar con:

- Reproductor de video con 5 clips
- Controles por gestos usando la cámara del dispositivo
- Detección de manos con dibujo del esqueleto en pantalla
- Cursor tipo mouse virtual con la punta del dedo índice
- Simulación de clic con pinza
- Adaptación responsive para escritorio, tablet y móvil
- Funcionamiento sin backend, ideal para GitHub Pages

## Cómo usar

1. Abre la página en un navegador moderno.
2. Permite el acceso a la cámara cuando el navegador lo pida.
3. Mueve la mano frente a la cámara.
4. Usa los gestos para controlar el video.

## Gestos incluidos

- Palma abierta: reproducir o pausar
- Puño: siguiente video
- Señal V: anterior video
- Deslizar a la izquierda: adelantar 10 segundos
- Deslizar a la derecha: retroceder 10 segundos
- Mano hacia arriba: subir volumen
- Mano hacia abajo: bajar volumen
- Pinza: simular clic sobre controles o elementos visibles
- Dedo índice: cursor tipo mouse en pantalla

## Despliegue en GitHub Pages

1. Sube estos archivos a tu repositorio.
2. En GitHub, ve a Settings > Pages.
3. Selecciona la rama principal y la carpeta raíz `/`.
4. Guarda y espera a que se publique.

## Notas

- La cámara requiere permisos del navegador y HTTPS; GitHub Pages usa HTTPS, por lo que funciona correctamente.
- En algunos equipos, la precisión del gesto puede variar según la iluminación y la calidad de la cámara.
- El contenido es responsivo y ajusta su diseño a distintos tamaños de pantalla.

## Archivos principales

- `index.html`
- `style.css`
- `app.js`



