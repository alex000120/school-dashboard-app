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
  detectionStatus: document.getElementById('gestureDetectionStatus'),
  detectionDot: document.getElementById('detectionState'),
  fpsLabel: document.getElementById('fpsLabel'),
  cameraToggle: document.getElementById('cameraToggle'),
  muteBtn: document.getElementById('muteBtn'),
  helpBtn: document.getElementById('helpBtn')
};

const handCtx = elements.handCanvas.getContext('2d');

let currentIndex = 1;
let cameraActive = false;
let cameraStream = null;
let hands = null;
let rafLoopId = null;
let lastGestureAt = 0;
let lastCenter = null;
let pinchHeld = false;

function setGestureText(label) {
  elements.gestureBadge.textContent = label;
}

function setDetectionState(active, text) {
  elements.detectionStatus.textContent = text;
  elements.detectionDot.classList.toggle('active', active);
  elements.detectionDot.classList.toggle('offline', !active);
}

function updateFpsLabel() {
  const fps = 5 + Math.floor(Math.random() * 8);
  const ms = 90 + Math.floor(Math.random() * 55);
  elements.fpsLabel.textContent = `FPS ${fps} • ${ms}ms`;
}

function buildPlaylist() {
  const playlist = document.createElement('div');
  playlist.className = 'playlist';
  videos.forEach((video, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'playlist-item';
    if (index === currentIndex) item.classList.add('is-active');
    item.innerHTML = `
      <img src="${video.thumb}" alt="${video.title}" class="playlist-item-thumb" />
      <span class="playlist-item-copy">
        <span class="playlist-item-title">${index + 1}. ${video.title}</span>
        <span class="playlist-item-meta">${index + 1}/5</span>
      </span>
    `;
    item.addEventListener('click', () => loadVideo(index));
    playlist.appendChild(item);
  });
  document.getElementById('playlist');
}

function loadVideo(index) {
  currentIndex = index;
  elements.video.src = videos[index].url;
  elements.video.load();
  setGestureText(index === 0 ? 'Muestra ambas manos' : 'Gesto activo');
}

function togglePlayback() {
  if (elements.video.paused) {
    elements.video.play().catch(() => {});
    setGestureText('Reproduciendo');
  } else {
    elements.video.pause();
    setGestureText('Pausado');
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
}

function triggerGesture(type) {
  const now = performance.now();
  if (now - lastGestureAt < 700) return;
  lastGestureAt = now;

  switch (type) {
    case 'palm':
      setGestureText('Palma abierta');
      togglePlayback();
      break;
    case 'fist':
      setGestureText('Puño');
      nextVideo();
      break;
    case 'vSign':
      setGestureText('Señal V');
      prevVideo();
      break;
    case 'swipeRight':
      setGestureText('Deslizar derecha');
      seekVideo(-10);
      break;
    case 'swipeLeft':
      setGestureText('Deslizar izquierda');
      seekVideo(10);
      break;
    case 'handUp':
      setGestureText('Mano arriba');
      setVolume(elements.video.volume + 0.08);
      break;
    case 'handDown':
      setGestureText('Mano abajo');
      setVolume(elements.video.volume - 0.08);
      break;
    case 'pinch':
      setGestureText('Pinza');
      const x = Number(elements.pointer.style.left.replace('px', '')) || 0;
      const y = Number(elements.pointer.style.top.replace('px', '')) || 0;
      const rect = elements.stage.getBoundingClientRect();
      simulatePointerClick(rect.left + x, rect.top + y);
      break;
    default:
      setGestureText(type);
  }
}

function simulatePointerClick(x, y) {
  const target = document.elementFromPoint(x, y) || elements.stage;
  const mouseMove = new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y, buttons: 0 });
  const mouseDown = new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y, button: 0, buttons: 1 });
  const mouseUp = new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y, button: 0, buttons: 0 });
  const click = new MouseEvent('click', { bubbles: true, clientX: x, clientY: y, button: 0, buttons: 0 });

  target.dispatchEvent(mouseMove);
  target.dispatchEvent(mouseDown);
  target.dispatchEvent(mouseUp);
  target.dispatchEvent(click);
}

function averagePoint(points) {
  const sum = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function euclidean(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isFingerExtended(landmarks, tipIndex, pipIndex) {
  return landmarks[tipIndex].y < landmarks[pipIndex].y;
}

function countExtendedFingers(landmarks) {
  const checks = [
    { tip: 8, pip: 6 },
    { tip: 12, pip: 10 },
    { tip: 16, pip: 14 },
    { tip: 20, pip: 18 }
  ];
  return checks.filter(({ tip, pip }) => isFingerExtended(landmarks, tip, pip)).length;
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
  handCtx.fillStyle = '#dff7ff';
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
    handCtx.beginPath();
    handCtx.moveTo(from.x * width, from.y * height);
    handCtx.lineTo(to.x * width, to.y * height);
    handCtx.stroke();
  });

  landmarks.forEach((landmark) => {
    handCtx.beginPath();
    handCtx.arc(landmark.x * width, landmark.y * height, 3.5, 0, Math.PI * 2);
    handCtx.fill();
  });
}

function processGesture(landmarks, width, height) {
  const indexTip = landmarks[8];
  const thumbTip = landmarks[4];
  const center = averagePoint([landmarks[0], landmarks[5], landmarks[9], landmarks[13], landmarks[17]]);
  const pinchDistance = euclidean(thumbTip, indexTip);

  elements.pointer.style.left = `${indexTip.x * width}px`;
  elements.pointer.style.top = `${indexTip.y * height}px`;
  elements.pointer.style.opacity = '1';

  const extendedFingers = countExtendedFingers(landmarks);
  const isOpenPalm = extendedFingers >= 3;
  const isFist = extendedFingers === 0;
  const isVSign = isFingerExtended(landmarks, 8, 6) && isFingerExtended(landmarks, 12, 10) && !isFingerExtended(landmarks, 16, 14) && !isFingerExtended(landmarks, 20, 18);
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

  if (!isPinch) pinchHeld = false;
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

  setGestureText('Cursor');
  setDetectionState(true, 'Mano detectada');
  lastCenter = center;
}

function onHandResults(results) {
  const rect = elements.stage.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  handCtx.clearRect(0, 0, width, height);

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    elements.pointer.style.opacity = '0';
    setDetectionState(false, 'Sin mano detectada');
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
    setTimeout(setupHands, 200);
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
  if (!cameraActive || !hands) return;
  try {
    if (elements.cameraVideo.readyState >= 2) {
      await hands.send({ image: elements.cameraVideo });
    }
  } catch (error) {
    console.warn('Webcam frame error:', error);
  }
  rafLoopId = requestAnimationFrame(cameraLoop);
}

function bindCameraStreams(stream) {
  elements.cameraVideo.srcObject = stream;
  elements.cameraPreview.srcObject = stream;
  elements.cameraVideo.style.display = 'block';
  elements.cameraPreview.muted = true;
  elements.cameraVideo.muted = true;
}

function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setDetectionState(false, 'Sin soporte');
    return;
  }

  navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false
  })
    .then((stream) => {
      cameraStream = stream;
      bindCameraStreams(stream);
      return Promise.all([elements.cameraVideo.play(), elements.cameraPreview.play()]);
    })
    .then(() => {
      cameraActive = true;
      elements.cameraToggle.textContent = '◉';
      setDetectionState(false, 'Cámara lista');
      setupHands();
      cameraLoop();
    })
    .catch((error) => {
      console.error('Error camera', error);
      cameraActive = false;
      setDetectionState(false, 'Permiso requerido');
    });
}

function stopCamera() {
  cameraActive = false;
  if (rafLoopId) {
    cancelAnimationFrame(rafLoopId);
    rafLoopId = null;
  }
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  elements.cameraVideo.srcObject = null;
  elements.cameraPreview.srcObject = null;
  elements.cameraVideo.style.display = 'none';
  elements.pointer.style.opacity = '0';
  handCtx.clearRect(0, 0, elements.handCanvas.width, elements.handCanvas.height);
  setDetectionState(false, 'Cámara apagada');
}

function toggleCamera() {
  if (cameraActive) stopCamera();
  else startCamera();
}

function toggleMute() {
  elements.video.muted = !elements.video.muted;
  elements.muteBtn.textContent = elements.video.muted ? '🔇' : '🔊';
  setGestureText(elements.video.muted ? 'Silenciado' : 'Audio activo');
}

function initializeApp() {
  loadVideo(currentIndex);
  setupCanvas();
  setDetectionState(false, 'Cámara apagada');
  setGestureText('Muestra ambas manos');
  elements.video.volume = 0.8;
  elements.cameraToggle.addEventListener('click', toggleCamera);
  elements.muteBtn.addEventListener('click', toggleMute);
  elements.helpBtn.addEventListener('click', () => setGestureText('Ayuda activa'));
  window.addEventListener('resize', setupCanvas);
  setInterval(updateFpsLabel, 900);
}

window.addEventListener('DOMContentLoaded', initializeApp);

