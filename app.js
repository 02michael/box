const SIZE  = 120;
const RATIO = 0.44;

const LID_DURATION   = 0.40;
const LID_SWEEP      = 270;
const WALL_DELAY     = 0.38;
const WALL_DURATION  = 0.30;
const FADE_IN_START  = 1.5;
const FADE_IN_RATE   = 2;
const FADE_OUT_START = 0.7;
const FADE_OUT_RATE  = 1.1;

const cam = document.getElementById('cam');
const slider = document.getElementById('speed');
const reverseBtn = document.getElementById('reverse');

let speed = 0.0004;
let direction = 1;
let phase = 0;
let lastTime = 0;

function createElement(className) {
  const el = document.createElement('div');
  if (className) el.className = className;
  return el;
}

function createFace() {
  const face = createElement('face');
  face.style.width = `${SIZE}px`;
  face.style.height = `${SIZE}px`;
  return face;
}

function createBox(index) {
  const box = createElement('box');

  const floor = createFace();
  floor.style.left = `${-SIZE / 2}px`;
  floor.style.top = `${-SIZE / 2}px`;
  floor.style.transform = 'rotateX(90deg)';
  box.appendChild(floor);

  function createWall(hingeTf, hasChild) {
    const hinge = createElement('hinge');
    hinge.style.transform = hingeTf;
    const wall = createFace();
    wall.style.left = `${-SIZE / 2}px`;
    wall.style.top = `${-SIZE}px`;
    wall.style.transformOrigin = 'center bottom';
    if (hasChild) wall.style.transformStyle = 'preserve-3d';
    hinge.appendChild(wall);
    box.appendChild(hinge);
    return wall;
  }

  const half = SIZE / 2;
  const front = createWall(`translateZ(${half}px)`);
  const back  = createWall(`translateZ(${-half}px) rotateY(180deg)`, true);
  const left  = createWall(`translateX(${-half}px) rotateY(-90deg)`);
  const right = createWall(`translateX(${half}px) rotateY(90deg)`);

  const lid = createFace();
  lid.style.left = '0';
  lid.style.top = `${-SIZE}px`;
  lid.style.transformOrigin = 'center bottom';
  back.appendChild(lid);

  return { el: box, index, floor, lid, walls: [front, back, left, right] };
}

const boxes = [];
for (let i = -2; i <= 3; i++) {
  const box = createBox(i);
  cam.appendChild(box.el);
  boxes.push(box);
}

function clamp(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function lidEase(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return (1 - Math.cos(t * Math.PI)) / 2;
}

function styleFace(face, alpha) {
  face.style.background = `rgba(255,255,255,${0.96 * alpha})`;
  face.style.border = `0.5px solid rgba(0,0,0,${0.3 * alpha})`;
}

slider.addEventListener('input', function () {
  speed = this.value * 0.0001;
});

reverseBtn.addEventListener('click', function () {
  direction *= -1;
});

function animate(now) {
  requestAnimationFrame(animate);
  phase += (now - lastTime) * speed * direction;
  lastTime = now;

  const t = ((phase % 1) + 1) % 1;

  for (let k = 0; k < boxes.length; k++) {
    const box = boxes[k];
    const depth = box.index - t;
    const scale = Math.pow(RATIO, depth);
    box.el.style.transform = `scale3d(${scale},${scale},${scale})`;

    const progress = clamp(-depth);

    const lidProgress = clamp(progress / LID_DURATION);
    const lidAngle = 90 - LID_SWEEP * lidEase(lidProgress);
    box.lid.style.transform = `rotateX(${lidAngle}deg)`;

    const wallProgress = clamp((progress - WALL_DELAY) / WALL_DURATION);
    const wallAngle = -90 * wallProgress * wallProgress;
    for (let j = 0; j < 4; j++) {
      box.walls[j].style.transform = `rotateX(${wallAngle}deg)`;
    }

    let alpha = 1;
    if (depth > FADE_IN_START) alpha = Math.max(0, 1 - (depth - FADE_IN_START) * FADE_IN_RATE);
    if (depth < -FADE_OUT_START) alpha = Math.max(0, 1 - (-depth - FADE_OUT_START) * FADE_OUT_RATE);

    styleFace(box.floor, alpha);
    styleFace(box.lid, alpha);
    for (let j = 0; j < 4; j++) styleFace(box.walls[j], alpha);
  }
}

requestAnimationFrame(animate);