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

const elements = {
  stage: document.getElementById('playerStage'),
  video: document.getElementById('videoPlayer'),
  cameraVideo: document.getElementById('cameraVideo'),
  cameraPreview: document.getElementById('cameraPreview'),
  handCanvas: document.getElementById('handCanvas'),
  pointer: document.getElementById('pointer'),
  gestureBadge: document.getElementById('gestureBadge'),
  handStatus: document.getElementById('handStatus'),
  cameraToggle: document.getElementById('cameraToggle'),
  fullscreenBtn: document.getElementById('fullscreenBtn'),
  playlist: document.getElementById('playlist'),
  progressBar: document.getElementById('progressBar'),
  currentTime: document.getElementById('currentTime'),
  totalTime: document.getElementById('totalTime'),
  volumeBar: document.getElementById('volumeBar'),
  detectionStatus: document.getElementById('gestureDetectionStatus'),
  detectionDot: document.getElementById('detectionState')
};

const handCtx = elements.handCanvas.getContext('2d');

let currentIndex = 0;
let cameraActive = false;
let hands = null;
let lastGestureAt = 0;
let lastCenter = null;
let pinchHeld = false;
let rafLoopId = null;
let cameraStream = null;

function setDetectionStatus(text, active) {
  elements.detectionStatus.textContent = text;
  elements.detectionDot.classList.toggle('active', !!active);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function setGestureText(label) {
  elements.gestureBadge.textContent = `Gesto: ${label}`;
}

function setHandStatus(label) {
  elements.handStatus.textContent = label;
}

function updatePlaylistState() {
  [...elements.playlist.children].forEach((item, index) => {
    item.classList.toggle('is-active', index === currentIndex);
  });
}

function buildPlaylist() {
  videos.forEach((video, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'playlist-item';
    if (index === currentIndex) button.classList.add('is-active');

    button.innerHTML = `
      <img class="playlist-item-thumb" src="${video.thumb}" alt="${video.title}" />
      <span class="playlist-item-copy">
        <span class="playlist-item-title">${index + 1}. ${video.title}</span>
        <span class="playlist-item-meta">${index + 1}/5</span>
      </span>
    `;

    button.addEventListener('click', () => {
      loadVideo(index);
      setGestureText('lista activada');
    });

    elements.playlist.appendChild(button);
  });
}

function loadVideo(index) {
  currentIndex = index;
  elements.video.src = videos[index].url;
  elements.video.load();
  updatePlaylistState();
}

function togglePlayback() {
  if (elements.video.paused) {
    elements.video.play().catch(() => {});
    setGestureText('reproduciendo');
  } else {
    elements.video.pause();
    setGestureText('pausado');
  }
}

function nextVideo() {
  const nextIndex = (currentIndex + 1) % videos.length;
  loadVideo(nextIndex);
  elements.video.play().catch(() => {});
}

function prevVideo() {
  const prevIndex = (currentIndex - 1 + videos.length) % videos.length;
  loadVideo(prevIndex);
  elements.video.play().catch(() => {});
}

function seekVideo(offset) {
  const nextTime = Math.min(elements.video.duration || 0, Math.max(0, elements.video.currentTime + offset));
  elements.video.currentTime = nextTime;
}

function setVolume(value) {
  const clamped = Math.min(1, Math.max(0, value));
  elements.video.volume = clamped;
  elements.volumeBar.value = String(clamped);
  setGestureText(`volumen ${clamped.toFixed(2)}`);
}

function updateTimeline() {
  const duration = elements.video.duration || 0;
  const current = elements.video.currentTime || 0;
  const percent = duration ? (current / duration) * 100 : 0;

  elements.progressBar.value = String(percent);
  elements.currentTime.textContent = formatTime(current);
  elements.totalTime.textContent = formatTime(duration);
}

function simulatePointerClick(x, y) {
  const target = document.elementFromPoint(x, y) || elements.stage;
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

function triggerGesture(type) {
  const now = performance.now();
  if (now - lastGestureAt < 700) return;
  lastGestureAt = now;

  switch (type) {
    case 'palm':
      setGestureText('palma abierta');
      togglePlayback();
      break;
    case 'fist':
      setGestureText('puño');
      nextVideo();
      break;
    case 'vSign':
      setGestureText('señal V');
      prevVideo();
      break;
    case 'swipeRight':
      setGestureText('deslizar derecha');
      seekVideo(-10);
      break;
    case 'swipeLeft':
      setGestureText('deslizar izquierda');
      seekVideo(10);
      break;
    case 'handUp':
      setGestureText('mano arriba');
      setVolume(elements.video.volume + 0.08);
      break;
    case 'handDown':
      setGestureText('mano abajo');
      setVolume(elements.video.volume - 0.08);
      break;
    case 'pinch': {
      setGestureText('pinza');
      const x = Number(elements.pointer.style.left.replace('px', '')) || 0;
      const y = Number(elements.pointer.style.top.replace('px', '')) || 0;
      const rect = elements.stage.getBoundingClientRect();
      simulatePointerClick(rect.left + x, rect.top + y);
      break;
    }
    case 'cursor':
      setGestureText('cursor');
      break;
    default:
      setGestureText(type);
  }
}

function averagePoint(points) {
  const sum = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 }
  );
  return {
    x: sum.x / points.length,
    y: sum.y / points.length
  };
}

function euclidean(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isFingerExtended(landmarks, tipIndex, pipIndex) {
  return landmarks[tipIndex].y < landmarks[pipIndex].y;
}

function countExtendedFingers(landmarks) {
  const tips = [
    { tip: 8, pip: 6 },
    { tip: 12, pip: 10 },
    { tip: 16, pip: 14 },
    { tip: 20, pip: 18 }
  ];

  return tips.filter(({ tip, pip }) => isFingerExtended(landmarks, tip, pip)).length;
}

function setupCanvas() {
  const rect = elements.stage.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  elements.handCanvas.width = rect.width * dpr;
  elements.handCanvas.height = rect.height * dpr;
  handCtx.setTransform(1, 0, 0, 1, 0, 0);
  handCtx.scale(dpr, dpr);
}

function drawHand(landmarks, width, height) {
  handCtx.clearRect(0, 0, width, height);

  handCtx.strokeStyle = '#38bdf8';
  handCtx.fillStyle = '#e2f3ff';
  handCtx.lineWidth = 2.5;
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
    handCtx.arc(x, y, 3.8, 0, Math.PI * 2);
    handCtx.fill();
  });
}

function processGesture(landmarks, width, height) {
  const indexTip = landmarks[8];
  const thumbTip = landmarks[4];
  const center = averagePoint([landmarks[0], landmarks[5], landmarks[9], landmarks[13], landmarks[17]]);
  const pinchDistance = euclidean(thumbTip, indexTip);

  const pointerX = indexTip.x * width;
  const pointerY = indexTip.y * height;

  elements.pointer.style.left = `${pointerX}px`;
  elements.pointer.style.top = `${pointerY}px`;
  elements.pointer.style.opacity = '1';

  const extendedFingers = countExtendedFingers(landmarks);
  const isOpenPalm = extendedFingers >= 3;
  const isFist = extendedFingers === 0;
  const isVSign = isFingerExtended(landmarks, 8, 6)
    && isFingerExtended(landmarks, 12, 10)
    && !isFingerExtended(landmarks, 16, 14)
    && !isFingerExtended(landmarks, 20, 18);
  const isPinch = pinchDistance < 0.07;

  if (lastCenter) {
    const dx = center.x - lastCenter.x;
    const dy = center.y - lastCenter.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX > 0.12 && absX > absY * 1.2) {
      triggerGesture(dx > 0 ? 'swipeRight' : 'swipeLeft');
      lastCenter = center;
      return;
    }

    if (absY > 0.12 && absY > absX * 1.2) {
      triggerGesture(dy < 0 ? 'handUp' : 'handDown');
      lastCenter = center;
      return;
    }
  }

  if (isPinch && !pinchHeld) {
    pinchHeld = true;
    triggerGesture('pinch');
    lastCenter = center;
    return;
  }

  if (!isPinch) {
    pinchHeld = false;
  }

  if (isFist) {
    triggerGesture('fist');
    lastCenter = center;
    return;
  }

  if (isVSign) {
    triggerGesture('vSign');
    lastCenter = center;
    return;
  }

  if (isOpenPalm) {
    triggerGesture('palm');
    lastCenter = center;
    return;
  }

  setGestureText('cursor');
  setHandStatus('Cursor activo');
  setDetectionStatus('Mano detectada: cursor activo', true);
  lastCenter = center;
}

function onHandResults(results) {
  const rect = elements.stage.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  handCtx.clearRect(0, 0, width, height);

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    elements.pointer.style.opacity = '0';
    setGestureText('esperando');
    setHandStatus(cameraActive ? 'Sin mano detectada' : 'Cámara desactivada');
    setDetectionStatus('Sin mano detectada', false);
    return;
  }

  const landmarks = results.multiHandLandmarks[0];
  drawHand(landmarks, width, height);
  processGesture(landmarks, width, height);
}

function setupHands() {
  if (hands) return;

  const HandsCtor = window.Hands || window.MediapipeHands;
  if (!HandsCtor) {
    setTimeout(() => setupHands(), 250);
    return;
  }

  hands = new HandsCtor({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.6
  });

  hands.onResults(onHandResults);
}

async function cameraLoop() {
  if (!cameraActive || !hands || !elements.cameraVideo) return;

  if (elements.cameraVideo.readyState >= 2) {
    try {
      await hands.send({ image: elements.cameraVideo });
    } catch (error) {
      console.warn('Error processing webcam frame:', error);
    }
  }

  rafLoopId = requestAnimationFrame(cameraLoop);
}

function bindCameraStreams(stream) {
  elements.cameraVideo.srcObject = stream;
  elements.cameraPreview.srcObject = stream;
  elements.cameraVideo.style.display = 'block';
  elements.cameraVideo.muted = true;
  elements.cameraPreview.muted = true;
}

function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setGestureText('sin soporte');
    setHandStatus('La cámara no está disponible');
    setDetectionStatus('Navegador sin soporte', false);
    return;
  }

  navigator.mediaDevices
    .getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    })
    .then((stream) => {
      cameraStream = stream;
      bindCameraStreams(stream);
      return Promise.all([
        elements.cameraVideo.play(),
        elements.cameraPreview.play()
      ]);
    })
    .then(() => {
      cameraActive = true;
      elements.cameraToggle.textContent = 'Detener cámara';
      setHandStatus('Cámara activa');
      setGestureText('cámara lista');
      setDetectionStatus('Cámara activa, esperando mano...', false);
      setupHands();
      cameraLoop();
    })
    .catch((error) => {
      console.error('No se pudo acceder a la cámara:', error);
      cameraActive = false;
      setGestureText('permiso requerido');
      setHandStatus('No se pudo acceder a la cámara');
      setDetectionStatus('Permiso de cámara requerido', false);
    });
}

function stopCamera() {
  cameraActive = false;
  elements.cameraToggle.textContent = 'Activar cámara';
  setHandStatus('Cámara desactivada');
  setDetectionStatus('Cámara desactivada', false);

  if (rafLoopId) {
    cancelAnimationFrame(rafLoopId);
    rafLoopId = null;
  }

  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }

  if (elements.cameraVideo) {
    elements.cameraVideo.srcObject = null;
    elements.cameraVideo.style.display = 'none';
  }

  if (elements.cameraPreview) {
    elements.cameraPreview.srcObject = null;
  }

  elements.pointer.style.opacity = '0';
  handCtx.clearRect(0, 0, elements.handCanvas.width, elements.handCanvas.height);
}

function toggleCamera() {
  if (cameraActive) {
    stopCamera();
  } else {
    startCamera();
  }
}

function toggleMute() {
  elements.video.muted = !elements.video.muted;
  setGestureText(elements.video.muted ? 'silenciado' : 'audio activado');
}

function bindControls() {
  document.querySelectorAll('[data-action]').forEach((button) => {
    const action = button.getAttribute('data-action');
    button.addEventListener('click', () => {
      if (action === 'playPause') togglePlayback();
      if (action === 'next') nextVideo();
      if (action === 'prev') prevVideo();
      if (action === 'mute') toggleMute();
    });
  });

  elements.cameraToggle.addEventListener('click', toggleCamera);
  elements.fullscreenBtn.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  });

  elements.volumeBar.addEventListener('input', (event) => {
    const value = Number(event.target.value);
    elements.video.volume = value;
    setGestureText(`volumen ${value.toFixed(2)}`);
  });

  elements.progressBar.addEventListener('input', (event) => {
    const percent = Number(event.target.value);
    const duration = elements.video.duration || 0;
    elements.video.currentTime = (percent / 100) * duration;
    updateTimeline();
  });

  elements.video.addEventListener('timeupdate', updateTimeline);
  elements.video.addEventListener('loadedmetadata', updateTimeline);
  elements.video.addEventListener('play', () => setGestureText('reproduciendo'));
  elements.video.addEventListener('pause', () => setGestureText('pausado'));
}

function initializeApp() {
  bindControls();
  buildPlaylist();
  loadVideo(0);
  setupCanvas();
  updateTimeline();
  setGestureText('esperando');
  setHandStatus('Cámara desactivada');
  setDetectionStatus('Esperando cámara...', false);
  elements.video.volume = 0.8;
}

window.addEventListener('resize', setupCanvas);
window.addEventListener('DOMContentLoaded', initializeApp);
