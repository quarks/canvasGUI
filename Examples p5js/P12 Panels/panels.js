
let gui;
let bx, by, dx, dy, size, speed;

async function setup() {
    const p5canvas = createCanvas(550, 360);
    p5canvas.parent('sketch');
    cursor(CROSS);

    gui = createGUI('gui 1', p5canvas);

    ABOUT(gui, 'Draggable panels')
    populateGUI(gui);
    initBall();
}

function draw() {
    background(240);
    moveBall(deltaTime / 1000);
    fill('red');
    noStroke();
    ellipse(bx, by, size * 2, size * 2);
    gui.draw();
    // Delete or comment out the next line to hide the pick buffer.
    // gui.showBuffer();
}

function initBall() {
    bx = width / 2;
    by = height / 2;
    let ang = random([17, 63, 117, 163, 227, 249, 297, 339]);
    ang = radians(ang);
    dx = cos(ang);
    dy = sin(ang);
    speed = random(200, 300);
    gui.$('sdrSpeed').value(speed);
    size = random(15, 20);
    gui.$('sdrSize').value(size);
}

function moveBall(time) {
    if (bx - size <= 0)
        dx = abs(dx);
    else if (bx + size >= width)
        dx = -abs(dx);
    if (by - size <= 24)
        dy = abs(dy);
    else if (by + size >= height - 24)
        dy = -abs(dy);
    bx += dx * speed * time;
    by += dy * speed * time;
}

function populateGUI(gui) {
    gui.textSize(14)
        .corners(4);
    // SPEED pane
    gui.panel('speed', 30, 80, 340, 36)
        .draggable(true, true)
        .opaque(200)
        .corners(10);
    gui.label('lblSpeed', 10, 6, 70, 24)
        .text('SPEED')
        .textStyle(BOLD)
        .parent('speed');
    gui.slider('sdrSpeed', 80, 6, 260, 24)
        .scheme('dark')
        .limits(100, 500)
        .weight(12)
        .setAction(info => speed = info.source.value())
        .parent('speed')
        .value(speed);
    // SIZE pane
    gui.panel('size', 30, 140, 340, 36)
        .scheme('orange')
        .draggable(true, true)
        .opaque(200)
        .corners(10);
    gui.label('lblSize', 10, 6, 70, 24)
        .scheme('orange')
        .text('SIZE')
        .textStyle(BOLD)
        .parent('size')
    gui.slider('sdrSize', 80, 6, 260, 24)
        .scheme('dark')
        .limits(5, 30)
        .weight(12)
        .setAction(info => size = info.source.value())
        .parent('size')
        .value(size);
}

function ABOUT(gui, title) {
    gui.label('about 1', 0, 0, width, 24)
        .scheme('light').corners(0).textSize(16)
        .text(title, 'center', 'center').shrink(0, 24);
    const dpr = Number.isInteger(devicePixelRatio)
        ? devicePixelRatio : Math.round(devicePixelRatio * 100) / 100;
    const mode = (gui.mode === 'JS') ? 'XXX' : VERSION;
    const vstr = `p5js: ${mode}   ##   canvasGUI: ${GUI.VERSION}   `
        + `##   Context: '${gui.contextType}'   ##   DPR: ${dpr}`;
    gui.label('about 2', 0, height - 24, width, 24)
        .scheme('light').corners(0).textSize(13)
        .text(vstr, 'center', 'center');
}