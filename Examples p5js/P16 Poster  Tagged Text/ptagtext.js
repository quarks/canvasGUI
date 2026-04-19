let gui, poster;

async function setup() {
    let p5canvas = createCanvas(480, 300);
    p5canvas.parent('sketch');
    cursor(HAND);

    const txt = await (loadStrings('./assets/quadratic.txt'));

    // Create the GUI controller for this canvas
    gui = createGUI('gui', p5canvas);

    // The poster to configure
    poster = gui.poster('box1', 60, 30, 360, 240)
        .scheme('yellow')
        .opaque(128)
        .text(txt)
        .corners(10)

    ABOUT(gui, 'Tagged Text with Character Entities');
}


function draw() {
    push();
    background(255);
    gui.draw();
    // gui.showBuffer('pickbuffer');
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
        .scheme('light').corners(0).textSize(13)
        .text(vstr, 'center', 'center');
}