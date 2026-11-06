let delay = 1500;

let spin15, spin4;
let scheme = 'red';
let sValue = 1984, fValue = 2026, speed = 2;
let divider, info;

async function setup() {
    let p5canvas = createCanvas(640, 600);
    gui = createGUI('spin gui', p5canvas);
    cursor(CROSS);
    info = await loadStrings('info.txt');

    divider = getDivider();
    populateGUI(gui);
    ABOUT(gui, 'Spinners Demonstrator');
}

function populateGUI(gui) {
    createSpinners(gui);
    schemeSelectors(gui, 380, 300, scheme);
    spinnerControls(gui, 10, 400, 'blue');
    gui.$('tmr15').start(20000, 100, 100);
}

function draw() {
    background(200, 240, 240);
    image(divider, 0, 250);
    gui.draw();
    // Delete or comment out the next line to hide the pick buffer.
    // gui.showBuffer();
}

function getDivider(c0 = 'gold', c1 = 'black') {
    const pg = createGraphics(width, 24);
    const sh2 = pg.height / 2;
    pg.background(c0);
    pg.noStroke();
    pg.fill(c1);
    let count = floor(width / 30);
    let step = width / count;
    for (let i = 0; i < count; i++) {
        let y = (i % 2) * sh2;
        pg.rect(i * step, y, step, sh2);
    }
    return pg;
}
