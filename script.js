
const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

const W = 720;
const H = 1280;
const FPS = 30;
const TOTAL = 20;

const clips = [
  "videos/clip01.mp4",
  "videos/clip02.mp4",
  "videos/clip03.mp4"
];

const messages = [
  ["DARK RIDER", "THE NIGHT BELONGS TO ME"],
  ["FEAR NOTHING", "RIDE YOUR OWN WAY"],
  ["LEGENDS DON'T FOLLOW", "THEY RULE."]
];

const previewBtn = document.getElementById("previewBtn");
const exportBtn = document.getElementById("exportBtn");
const status = document.getElementById("status");

let videos = [];
let raf = null;
let busy = false;

function createVideos() {
  videos = clips.map(src => {
    const v = document.createElement("video");
    v.src = src;
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    return v;
  });

  return Promise.all(
    videos.map(v => new Promise((resolve, reject) => {
      v.onloadedmetadata = resolve;
      v.onerror = () => reject(new Error("Could not load " + v.src));
    }))
  );
}

function drawCover(video) {
  if (!video.videoWidth) return;

  const scale = Math.max(
    W / video.videoWidth,
    H / video.videoHeight
  );

  const sw = W / scale;
  const sh = H / scale;

  const sx = (video.videoWidth - sw) / 2;
  const sy = (video.videoHeight - sh) / 2;

  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, W, H);
}

function drawEffects(t, scene) {
  // Dark cinematic grading
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.fillRect(0, 0, W, H);

  // Red cinematic light
  const glow = ctx.createRadialGradient(
    W / 2, H / 2, 50,
    W / 2, H / 2, 700
  );

  glow.addColorStop(0, "rgba(100,0,0,0)");
  glow.addColorStop(1, "rgba(0,0,0,0.65)");

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Film-style top and bottom bars
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, 100);
  ctx.fillRect(0, H - 100, W, 100);

  // Text animation
  const fadeIn = Math.min(1, (t % 6.67) / 0.7);
  const fadeOut = Math.min(1, (6.67 - (t % 6.67)) / 0.5);
  const alpha = Math.max(0, Math.min(fadeIn, fadeOut));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";

  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 25;

  ctx.fillStyle = "#fff";
  ctx.font = "900 48px Arial";

  ctx.fillText(messages[scene][0], 360, 290);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ff3333";
  ctx.font = "bold 18px Arial";

  ctx.fillText(messages[scene][1], 360, 335);

  ctx.restore();

  // Small signature
  ctx.textAlign = "center";
  ctx.font = "bold 18px Arial";
  ctx.fillStyle = "#ddd";
  ctx.fillText("DARK RIDER", 360, 1190);
}

function drawFrame(elapsed) {
  const segment = TOTAL / 3;
  const scene = Math.min(2, Math.floor(elapsed / segment));
  const localTime = elapsed - scene * segment;

  const video = videos[scene];

  if (!video) return;

  if (video.readyState >= 2) {
    drawCover(video);
  } else {
    ctx.fillStyle = "#080808";
    ctx.fillRect(0, 0, W, H);
  }

  // Slight cinematic zoom
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  drawEffects(elapsed, scene);
  ctx.restore();

  // Black transition at scene boundaries
  const transition = 0.35;
  const position = elapsed % segment;

  let fade = 0;

  if (scene > 0 && position < transition) {
    fade = 1 - position / transition;
  } else if (position > segment - transition) {
    fade = (position - (segment - transition)) / transition;
  }

  if (fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fade})`;
    ctx.fillRect(0, 0, W, H);
  }
}

async function playClips() {
  const segment = TOTAL / 3;

  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];

    videos.forEach(other => {
      if (other !== v) other.pause();
    });

    v.currentTime = 0;
    await v.play();

    const start = performance.now();

    while (performance.now() - start < segment * 1000) {
      if (!busy) break;

      const elapsed = i * segment +
        (performance.now() - start) / 1000;

      drawFrame(elapsed);

      await new Promise(requestAnimationFrame);
    }

    v.pause();

    if (!busy) break;
  }
}

async function preview() {
  try {
    busy = true;
    status.textContent = "PLAYING REAL FOOTAGE...";

    await createVideos();
    await playClips();

    busy = false;
    status.textContent = "PREVIEW COMPLETE";
  } catch (error) {
    busy = false;
    status.textContent = "VIDEO ERROR: CHECK CLIP PATHS";
    console.error(error);
  }
}

async function exportVideo() {
  if (busy) return;

  try {
    busy = true;
    exportBtn.disabled = true;
    status.textContent = "PREPARING VIDEO...";

    await createVideos();

    const stream = canvas.captureStream(FPS);

    const mime = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm"
    ].find(type => MediaRecorder.isTypeSupported(type));

    if (!mime) throw new Error("WebM not supported");

    const recorder = new MediaRecorder(stream, {
      mimeType: mime
    });

    const chunks = [];

    recorder.ondataavailable = e => {
      if (e.data.size) chunks.push(e.data);
    };

    const finished = new Promise(resolve => {
      recorder.onstop = resolve;
    });

    recorder.start();

    const segment = TOTAL / 3;

    for (let i = 0; i < 3; i++) {
      const v = videos[i];

      videos.forEach(other => {
        if (other !== v) other.pause();
      });

      v.currentTime = 0;
      await v.play();

      const start = performance.now();

      while (performance.now() - start < segment * 1000) {
        const elapsed = i * segment +
          (performance.now() - start) / 1000;

        drawFrame(elapsed);

        status.textContent =
          "RENDERING " +
          Math.floor(elapsed / TOTAL * 100) + "%";

        await new Promise(requestAnimationFrame);
      }

      v.pause();
    }

    recorder.stop();
    await finished;

    const blob = new Blob(chunks, { type: mime });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "DARK-RIDER-REEL.webm";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 60000);

    stream.getTracks().forEach(track => track.stop());

    status.textContent = "VIDEO EXPORTED SUCCESSFULLY!";
  } catch (error) {
    console.error(error);
    status.textContent = "ERROR: " + error.message;
  } finally {
    busy = false;
    exportBtn.disabled = false;
  }
}

previewBtn.addEventListener("click", preview);
exportBtn.addEventListener("click", exportVideo);

createVideos()
  .then(() => {
    drawFrame(0);
    status.textContent = "3 REAL CLIPS LOADED";
  })
  .catch(error => {
    status.textContent = "CHECK VIDEO FILE PATHS";
    console.error(error);
  });
      0
