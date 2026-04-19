let gui, avatar;
let bx, by, dx, dy, size, speed;
let cdts = '<pc60 b ft3 fs36 gf4>canvasGUI v3<pc:120 t ft0 fs16 gf4>'
    + 'created by<pc10:120 fs24>Peter Lager';

async function setup() {
    const p5canvas = createCanvas(480, 370);
    p5canvas.parent('sketch');
    cursor(CROSS);
    // Get resources 
    avatar = await loadImage("./assets/qavatar128.png");
    // Create the GUI controller for this canvas
    gui = createGUI('my gui', p5canvas);
    populateGUI(gui);
    initBall();

    // setTimeout(() => gui.listBuffers(), 2000);
}

function keyTyped() {
    switch (key) {
        case '1':
            resizeCanvas(480, 370);
            break;
        case '2':
            resizeCanvas(640, 370);
            break;
        case '3':
            resizeCanvas(480, 460);
            break;
        case '4':
            resizeCanvas(400, 300);
            break;
    }
}

function draw() {
    background(64, 190, 230);
    moveBall(deltaTime / 1000);
    fill('blue');
    noStroke();
    ellipse(bx, by, size * 2, size * 2);
    gui.draw();
    // Delete or comment out the next line to hide the pick buffer.
    gui.showBuffer();
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
    if (by - size <= 0)
        dy = abs(dy);
    else if (by + size >= height)
        dy = -abs(dy);
    bx += dx * speed * time;
    by += dy * speed * time;
}

function populateGUI(gui) {
    // Change some gui default values
    gui.scheme('green').textSize(14);
    // Create side panes
    ABOUT(gui, 'Demo: Simple side panes', 24);
    createCreditsPane(gui);
    createSizePane(gui);
    createSpeedPane(gui);
}

function createSizePane(gui) {
    gui.pane('size', 'east', 100, 'Ball size');
    gui.label('lblSize', 10, 40, 70, 20)
        .text('SIZE')
        .parent('size')
    gui.slider('sdrSize', 15, 70, 260, 50)
        .orient('north')
        .limits(5, 30)
        .weight(16)
        .setAction(info => size = info.source.value())
        .parent('size')
        .value(size);
}

function createSpeedPane(gui) {
    gui.pane('speed', 'east', 100, 'Speed');
    gui.label('lblSpeed', 10, 40, 70, 20)
        .text('SPEED')
        .parent('speed')
    gui.slider('sdrSpeed', 15, 70, 260, 50)
        .orient('north')
        .limits(100, 500)
        .weight(16)
        .setAction(info => speed = info.source.value())
        .parent('speed')
        .value(speed);

}
function createCreditsPane(gui) {
    gui.pane('credits', 'west', 300)
        .text('Credits');
    gui.poster('cdts', 0, 0, 300, height)
        .transparent()
        .corners(0)
        .colors(['white', 'yellow'])
        .text(cdts)
        .icon(avatar, 20, 120)
        .parent('credits');
}

function ABOUT(gui, title) {
    gui.label('about 1', 0, 0, width, 24)
        .scheme('light').corners(0).textSize(16)
        .text(title, 'center', 'center')
        .shrink(0, 24);
    const dpr = Number.isInteger(devicePixelRatio)
        ? devicePixelRatio : Math.round(devicePixelRatio * 100) / 100;
    const mode = (gui.mode === 'JS') ? 'XXX' : VERSION;
    const vstr = `p5js: ${mode}   ##   canvasGUI: ${GUI.VERSION}   `
        + `##   Context: '${gui.contextType}'   ##   DPR: ${dpr}`;
    gui.label('about 2', 0, height - 24, width, 24)
        .scheme('light')
        .corners(0)
        .textSize(13)
        .text(vstr, 'center', 'center');
}
