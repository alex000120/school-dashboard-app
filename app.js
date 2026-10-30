const videos = [
  {
    title: 'Bosque en movimiento',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    thumb: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=80'
  },
  {
    title: 'Nubes y horizonte',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumb: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=300&q=80'
  },
  {
    title: 'Catálogo de ejemplo',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumb: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=300&q=80'
  },
  {
    title: 'Paisaje nocturno',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumb: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=300&q=80'
  },
  {
    title: 'Aventura urbana',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumb: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=300&q=80'
  }
];

const videoPlayer = document.getElementById('videoPlayer');
const playlist = document.getElementById('playlist');
const gestureBadge = document.getElementById('gestureBadge');
const pointer = document.getElementById('pointer');
const cameraToggle = document.getElementById('cameraToggle');
const handCanvas = document.getElementById('handCanvas');
const handCtx = handCanvas.getContext('2d');

let currentIndex = 0;
let cameraActive = false;
let isLoaded = false;
let lastGestureAction = 0;
let lastCenter = null;
let lastFrameTime = 0;

function setGestureText(label) {
  gestureBadge.textContent = `Gesto: ${label}`;
}

function buildPlaylist() {
  videos.forEach((video, index) => {
    const button = document.createElement('button');
    button.className = 'playlist-item';
    if (index === currentIndex) button.classList.add('is-active');
    button.innerHTML = `
      <img class="playlist-item-thumb" src="${video.thumb}" alt="${video.title}" />
      <span class="playlist-item-copy">
        <span class="playlist-item-title">${index + 1}. ${video.title}</span>
        <span class="playlist-item-meta">${index + 1}/5</span>
      </span>
    `;
    button.addEventListener('click', () => loadVideo(index));
    playlist.appendChild(button);
  });
}

function updatePlaylistState() {
  [...playlist.children].forEach((item, index) => {
    item.classList.toggle('is-active', index === currentIndex);
  });
}

function loadVideo(index) {
  currentIndex = index;
  videoPlayer.src = videos[index].url;
  videoPlayer.load();
  updatePlaylistState();
  setGestureText('video cargado');
}

function togglePlayback() {
  if (videoPlayer.paused) {
    videoPlayer.play();
    setGestureText('reproducir');
  } else {
    videoPlayer.pause();
    setGestureText('pausar');
  }
}

function nextVideo() {
  const nextIndex = (currentIndex + 1) % videos.length;
  loadVideo(nextIndex);
  setTimeout(() => videoPlayer.play(), 100);
}

function prevVideo() {
  const prevIndex = (currentIndex - 1 + videos.length) % videos.length;
  loadVideo(prevIndex);
  setTimeout(() => videoPlayer.play(), 100);
}

function setVolume(delta) {
  const nextVolume = Math.min(1, Math.max(0, videoPlayer.volume + delta));
  videoPlayer.volume = nextVolume;
  setGestureText(`volumen ${nextVolume.toFixed(2)}`);
}

function seekVideo(offset) {
  const nextTime = Math.min(videoPlayer.duration || 0, Math.max(0, videoPlayer.currentTime + offset));
  videoPlayer.currentTime = nextTime;
  setGestureText(`salto ${offset > 0 ? '+' : ''}${offset}s`);
}

function simulateClickAtPointer(x, y) {
  const target = document.elementFromPoint(x, y);
  if (!target) return;

  const mouseMove = new MouseEvent('mousemove', {
    bubbles: true,
    clientX: x,
    clientY: y,
    buttons: 0
  });

  const mouseDown = new MouseEvent('mousedown', {
    bubbles: true,
    clientX: x,
    clientY: y,
    button: 0,
    buttons: 1
  });

  const mouseUp = new MouseEvent('mouseup', {
    bubbles: true,
    clientX: x,
    clientY: y,
    button: 0,
    buttons: 0
  });

  const click = new MouseEvent('click', {
    bubbles: true,
    clientX: x,
    clientY: y,
    button: 0,
    buttons: 0
  });

  target.dispatchEvent(mouseMove);
  target.dispatchEvent(mouseDown);
  target.dispatchEvent(mouseUp);
  target.dispatchEvent(click);
  setGestureText('clic simulado');
}

function fullscreenToggle() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function attachControls() {
  document.querySelectorAll('[data-action]').forEach((button) => {
    const action = button.getAttribute('data-action');
    button.addEventListener('click', () => {
      if (action === 'playPause') togglePlayback();
      if (action === 'next') nextVideo();
      if (action === 'prev') prevVideo();
      if (action === 'fullscreen') fullscreenToggle();
    });
  });

  cameraToggle.addEventListener('click', () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  });
}

function startCamera() {
  const constraints = {
    video: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  };

  navigator.mediaDevices.getUserMedia(constraints)
    .then((stream) => {
      const camera = new Camera(document.createElement('video'), {
        onFrame: async () => {
          if (isLoaded && hands) {
            await hands.send({ image: camera.video });
          }
        },
        width: 640,
        height: 480
      });

      window.__gestureCamera = camera;
      camera.video.srcObject = stream;
      camera.video.muted = true;
      camera.video.play();
      cameraActive = true;
      cameraToggle.textContent = 'Detener cámara';
      setGestureText('cámara activa');
      setupHands();
    })
    .catch((error) => {
      console.error('No se pudo acceder a la cámara:', error);
      setGestureText('permiso de cámara requerido');
    });
}

function stopCamera() {
  if (window.__gestureCamera) {
    const tracks = window.__gestureCamera.video.srcObject?.getTracks?.() || [];
    tracks.forEach((track) => track.stop());
    window.__gestureCamera.video.srcObject = null;
  }
  cameraActive = false;
  cameraToggle.textContent = 'Activar cámara';
  setGestureText('cámara detenida');
  pointer.style.opacity = '0';
  handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);
}

function setupCanvas() {
  const parentBox = videoPlayer.parentElement.getBoundingClientRect();
  handCanvas.width = parentBox.width * window.devicePixelRatio;
  handCanvas.height = parentBox.height * window.devicePixelRatio;
  handCtx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
}

window.addEventListener('resize', setupCanvas);

let hands;

function setupHands() {
  const options = {
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  };

  hands = new Hands(options);
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.6
  });

  hands.onResults(onHandResults);
  isLoaded = true;
}

function onHandResults(results) {
  const width = handCanvas.width / window.devicePixelRatio;
  const height = handCanvas.height / window.devicePixelRatio;

  handCtx.clearRect(0, 0, width, height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    drawHand(landmarks);
    processGesture(landmarks, width, height);
  } else {
    pointer.style.opacity = '0';
    setGestureText('sin mano');
  }
}

function drawHand(landmarks) {
  handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);
  const width = handCanvas.width / window.devicePixelRatio;
  const height = handCanvas.height / window.devicePixelRatio;

  handCtx.fillStyle = 'rgba(56, 189, 248, 0.14)';
  handCtx.strokeStyle = '#38bdf8';
  handCtx.lineWidth = 3;
  handCtx.lineJoin = 'round';
  handCtx.lineCap = 'round';

  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20],
    [0, 17]
  ];

  connections.forEach(([fromIndex, toIndex]) => {
    const from = landmarks[fromIndex];
    const to = landmarks[toIndex];
    const startX = from.x * width;
    const startY = from.y * height;
    const endX = to.x * width;
    const endY = to.y * height;
    handCtx.beginPath();
    handCtx.moveTo(startX, startY);
    handCtx.lineTo(endX, endY);
    handCtx.stroke();
  });

  landmarks.forEach((landmark) => {
    const x = landmark.x * width;
    const y = landmark.y * height;
    handCtx.beginPath();
    handCtx.arc(x, y, 4, 0, Math.PI * 2);
    handCtx.fillStyle = '#f8fafc';
    handCtx.fill();
  });
}

function euclidean(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isFingerExtended(landmarks, tipIndex, pipIndex) {
  return landmarks[tipIndex].y < landmarks[pipIndex].y;
}

function countExtendedFingers(landmarks) {
  let count = 0;
  if (isFingerExtended(landmarks, 8, 6)) count += 1;
  if (isFingerExtended(landmarks, 12, 10)) count += 1;
  if (isFingerExtended(landmarks, 16, 14)) count += 1;
  if (isFingerExtended(landmarks, 20, 18)) count += 1;
  return count;
}

function averagePoint(points) {
  const sum = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
  return {
    x: sum.x / points.length,
    y: sum.y / points.length
  };
}

function processGesture(landmarks, width, height) {
  const indexTip = landmarks[8];
  const thumbTip = landmarks[4];
  const middleTip = landmarks[12];
  const wrist = landmarks[0];
  const center = averagePoint([landmarks[0], landmarks[5], landmarks[9], landmarks[13], landmarks[17]]);

  const indexX = indexTip.x * width;
  const indexY = indexTip.y * height;
  pointer.style.left = `${indexX}px`;
  pointer.style.top = `${indexY}px`;
  pointer.style.opacity = '1';

  const pinchDistance = euclidean(thumbTip, indexTip);
  const middleExtended = isFingerExtended(landmarks, 12, 10);
  const indexExtended = isFingerExtended(landmarks, 8, 6);
  const ringExtended = isFingerExtended(landmarks, 16, 14);
  const pinkyExtended = isFingerExtended(landmarks, 20, 18);
  const totalExtended = countExtendedFingers(landmarks);
  const handOpen = totalExtended >= 3;
  const fist = totalExtended === 0 && pinchDistance < 0.08;
  const vSign = indexExtended && middleExtended && !ringExtended && !pinkyExtended;
  const pinch = pinchDistance < 0.06;

  if (lastCenter) {
    const dx = center.x - lastCenter.x;
    const dy = center.y - lastCenter.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX > 0.12 && absX > absY * 1.3) {
      const actionName = dx > 0 ? 'swipeDerecha' : 'swipeIzquierda';
      triggerGesture(actionName, Date.now());
      lastCenter = center;
      return;
    }

    if (absY > 0.12 && absY > absX * 1.3) {
      const actionName = dy < 0 ? 'manoArriba' : 'manoAbajo';
      triggerGesture(actionName, Date.now());
      lastCenter = center;
      return;
    }
  }

  if (pinch) {
    triggerGesture('pinza', Date.now());
    lastCenter = center;
    return;
  }

  if (fist) {
    triggerGesture('puño', Date.now());
    lastCenter = center;
    return;
  }

  if (vSign) {
    triggerGesture('vSign', Date.now());
    lastCenter = center;
    return;
  }

  if (handOpen) {
    triggerGesture('palma', Date.now());
    lastCenter = center;
    return;
  }

  if (indexExtended) {
    setGestureText('cursor');
    pointer.style.opacity = '1';
  }

  lastCenter = center;
}

function triggerGesture(type, now) {
  const coolDown = 700;
  if (now - lastGestureAction < coolDown) return;

  lastGestureAction = now;

  switch (type) {
    case 'palma':
      setGestureText('palma abierta');
      togglePlayback();
      break;
    case 'puño':
      setGestureText('puño');
      nextVideo();
      break;
    case 'vSign':
      setGestureText('señal V');
      prevVideo();
      break;
    case 'swipeDerecha':
      setGestureText('deslizar derecha');
      seekVideo(-10);
      break;
    case 'swipeIzquierda':
      setGestureText('deslizar izquierda');
      seekVideo(10);
      break;
    case 'manoArriba':
      setGestureText('mano arriba');
      setVolume(0.1);
      break;
    case 'manoAbajo':
      setGestureText('mano abajo');
      setVolume(-0.1);
      break;
    case 'pinza':
      setGestureText('pinza');
      const x = Number(pointer.style.left.replace('px', '')) || 0;
      const y = Number(pointer.style.top.replace('px', '')) || 0;
      simulateClickAtPointer(x, y);
      break;
    case 'cursor':
      setGestureText('cursor');
      break;
    default:
      setGestureText(type);
  }
}

function initializeApp() {
  attachControls();
  buildPlaylist();
  loadVideo(0);
  setupCanvas();
  setGestureText('apunta con la mano');
}

window.addEventListener('DOMContentLoaded', initializeApp);
