let gui, poster;

async function setup() {
    let p5canvas = createCanvas(480, 640);
    p5canvas.parent('sketch');
    cursor(HAND);

    const wildwest = await loadFont('./assets/WILDWEST.TTF');
    const wtd = await (loadStrings('./assets/wanted.txt'));
    const btk = await (loadImage('./assets/billythekid.png'));

    // Create the GUI controller for this canvas
    gui = createGUI('gui', p5canvas);

    // The poster to configure
    poster = gui.poster('box1', 30, 30, 420, 580)
        .opaque()
        .text(wtd)
        .corners(10)
        .fonts([wildwest])
        .colors(['rgb(240 220 190)', "sienna", "black"])
        .background(3)
        .icon(btk, 130, 150);

    ABOUT(gui, 'Poster Control Example');
}


function draw() {
    push();
    background(240, 240, 240);
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