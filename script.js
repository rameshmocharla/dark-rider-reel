
const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

const W = 720;
const H = 1280;
const DURATION = 20;
const FPS = 30;

let animationId = null;
let recorder = null;
let chunks = [];
let recording = false;

const status = document.getElementById("status");
const previewBtn = document.getElementById("previewBtn");
const exportBtn = document.getElementById("exportBtn");

function background(t) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#080b12");
  bg.addColorStop(0.55, "#17191d");
  bg.addColorStop(1, "#020202");

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Red cinematic light
  const glow = ctx.createRadialGradient(
    360, 590, 10, 360, 590, 500
  );
  glow.addColorStop(0, "rgba(150,0,0,.3)");
  glow.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Road
  ctx.fillStyle = "#08090b";
  ctx.fillRect(0, 850, W, 430);

  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 970);
  ctx.lineTo(W, 970);
  ctx.stroke();

  // Road reflections
  for (let i = 0; i < 14; i++) {
    const x = (i * 83 + t * 45) % W;
    ctx.fillStyle = "rgba(160,0,0,.12)";
    ctx.fillRect(x, 900 + i * 18, 35, 3);
  }
}

function rain(t) {
  for (let i = 0; i < 115; i++) {
    const x = (i * 97 + t * 180) % W;
    const y = (i * 139 + t * 470) % H;

    ctx.strokeStyle = "rgba(190,210,225,.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 12, y + 38);
    ctx.stroke();
  }
}

function wheel(x, y) {
  ctx.save();
  ctx.translate(x, y);

  ctx.strokeStyle = "#050505";
  ctx.lineWidth = 24;
  ctx.beginPath();
  ctx.arc(0, 0, 100, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#888";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 83, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#777";
  ctx.lineWidth = 3;

  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 82, Math.sin(a) * 82);
    ctx.stroke();
  }

  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function motorcycle(t) {
  ctx.save();

  const zoom = 1 + Math.sin(t * .7) * .025;
  ctx.translate(360, 750);
  ctx.scale(zoom, zoom);
  ctx.translate(-360, -750);

  // Wheels
  wheel(180, 800);
  wheel(550, 800);

  // Frame
  ctx.strokeStyle = "#a00000";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(180, 800);
  ctx.lineTo(300, 640);
  ctx.lineTo(460, 800);
  ctx.lineTo(550, 800);
  ctx.lineTo(410, 640);
  ctx.stroke();

  // Front fork
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(480, 570);
  ctx.lineTo(550, 800);
  ctx.stroke();

  // Engine
  ctx.fillStyle = "#242424";
  ctx.beginPath();
  ctx.roundRect(285, 680, 170, 125, 24);
  ctx.fill();

  ctx.strokeStyle = "#666";
  ctx.lineWidth = 5;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(310 + i * 30, 700);
    ctx.lineTo(310 + i * 30, 780);
    ctx.stroke();
  }

  // Fuel tank
  const tank = ctx.createLinearGradient(280, 500, 440, 650);
  tank.addColorStop(0, "#ff2727");
  tank.addColorStop(0.5, "#720000");
  tank.addColorStop(1, "#150000");

  ctx.fillStyle = tank;
  ctx.beginPath();
  ctx.moveTo(260, 580);
  ctx.quadraticCurveTo(280, 490, 390, 510);
  ctx.quadraticCurveTo(465, 530, 450, 610);
  ctx.lineTo(400, 670);
  ctx.lineTo(300, 660);
  ctx.closePath();
  ctx.fill();

  // Seat
  ctx.fillStyle = "#080808";
  ctx.beginPath();
  ctx.moveTo(220, 570);
  ctx.quadraticCurveTo(330, 520, 410, 555);
  ctx.lineTo(390, 590);
  ctx.lineTo(230, 600);
  ctx.fill();

  // Handle
  ctx.strokeStyle = "#aaa";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(450, 550);
  ctx.lineTo(510, 500);
  ctx.lineTo(570, 515);
  ctx.stroke();

  // Headlight
  ctx.fillStyle = "#fff4cc";
  ctx.shadowColor = "#ff3030";
  ctx.shadowBlur = 40;
  ctx.beginPath();
  ctx.arc(485, 570, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Tail light
  ctx.fillStyle = "#ff1515";
  ctx.shadowColor = "red";
  ctx.shadowBlur = 25;
  ctx.fillRect(205, 560, 28, 12);
  ctx.shadowBlur = 0;

  // Exhaust
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 17;
  ctx.beginPath();
  ctx.moveTo(290, 750);
  ctx.lineTo(210, 790);
  ctx.stroke();

  ctx.restore();
}

function text(t) {
  ctx.textAlign = "center";

  let heading = "";
  let subtitle = "";

  if (t < 3) {
    heading = "DARK RIDER";
    subtitle = "THE NIGHT BELONGS TO ME";
  } else if (t < 7) {
    heading = "FEAR NOTHING";
    subtitle = "RIDE YOUR OWN WAY";
  } else if (t < 12) {
    heading = "NO LIMITS";
    subtitle = "NO RULES. JUST RIDE.";
  } else if (t < 17) {
    heading = "BORN TO RULE";
    subtitle = "NOT MADE TO FOLLOW";
  } else {
    heading = "LEGENDS DON'T FOLLOW";
    subtitle = "THEY RULE.";
  }

  const fade = Math.min(
    1,
    (t % 3) / .5,
    (3 - (t % 3)) / .5
  );

  ctx.globalAlpha = Math.max(.4, fade);

  ctx.font = "bold 49px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 18;
  ctx.fillText(heading, 360, 280);

  ctx.shadowBlur = 0;
  ctx.font = "bold 17px Arial";
  ctx.fillStyle = "#ff3333";
  ctx.fillText(subtitle, 360, 325);

  ctx.globalAlpha = 1;
}

function render(t) {
  background(t);
  motorcycle(t);
  rain(t);
  text(t);

  // Cinematic frame border
  ctx.strokeStyle = "rgba(255,255,255,.2)";
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, W - 36, H - 36);

  // Watermark
  ctx.font = "bold 18px Arial";
  ctx.fillStyle = "#777";
  ctx.textAlign = "center";
  ctx.fillText("DARK RIDER • ROYAL EDITION", 360, 1200);
}

function stopPreview() {
  if (animationId) cancelAnimationFrame(animationId);
  animationId = null;
}

function preview() {
  stopPreview();

  const start = performance.now();

  function frame(now) {
    const t = Math.min((now - start) / 1000, DURATION);
    render(t);

    if (t < DURATION) {
      animationId = requestAnimationFrame(frame);
    } else {
      animationId = null;
      status.textContent = "PREVIEW COMPLETE";
    }
  }

  status.textContent = "PLAYING CINEMATIC REEL...";
  animationId = requestAnimationFrame(frame);
}

function exportVideo() {
  if (recording) return;

  if (!canvas.captureStream ||
      typeof MediaRecorder === "undefined") {
    status.textContent = "VIDEO EXPORT NOT SUPPORTED";
    return;
  }

  stopPreview();

  const stream = canvas.captureStream(FPS);
  const mime = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm"
  ].find(type => MediaRecorder.isTypeSupported(type));

  if (!mime) {
    status.textContent = "WEBM EXPORT NOT SUPPORTED";
    return;
  }

  chunks = [];

  try {
    recorder = new MediaRecorder(stream, {
      mimeType: mime
    });
  } catch (error) {
    status.textContent = "EXPORT ERROR";
    return;
  }

  recorder.ondataavailable = event => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "DARK-RIDER-REEL.webm";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 60000);

    stream.getTracks().forEach(track => track.stop());
    recording = false;
    exportBtn.disabled = false;
    exportBtn.textContent = "⬇ EXPORT VIDEO";
    status.textContent = "VIDEO EXPORTED";
  };

  recorder.onerror = () => {
    status.textContent = "RECORDING FAILED";
    recording = false;
    exportBtn.disabled = false;
  };

  recording = true;
  exportBtn.disabled = true;
  exportBtn.textContent = "RENDERING...";
  status.textContent = "RENDERING 20 SECOND VIDEO...";

  const start = performance.now();

  recorder.start();

  function frame(now) {
    const t = Math.min((now - start) / 1000, DURATION);
    render(t);

    status.textContent =
      "RENDERING " + Math.floor(t / DURATION * 100) + "%";

    if (t < DURATION && recording) {
      animationId = requestAnimationFrame(frame);
    } else if (recording) {
      stopPreview();
      recorder.stop();
    }
  }

  animationId = requestAnimationFrame(frame);
}

previewBtn.addEventListener("click", preview);
exportBtn.addEventListener("click", exportVideo);

render(0);
