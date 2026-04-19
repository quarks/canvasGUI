let gui, crab;
let width, height;
let canvas, ctx, raf;

async function setup() {
    canvas = document.getElementById('sketch');
    [width, height] = [canvas.width, canvas.height];
    // Must get the context (2d or WEBGL2) before creating the GUI
    ctx = canvas.getContext('2d');

    // Get resources 
    crab = await loadImage("./assets/crab.png");
    // Create the GUI controller for this canvas
    gui = createGUI('my gui', 'sketch');
    ABOUT(gui, "Demo: Button with text and icon");
    populateGUI(gui);
    raf = window.requestAnimationFrame(draw);
}

function draw() {
    ctx.fillStyle = 'cornflowerblue';
    ctx.fillRect(0, 0, width, height);
    gui.draw();
    // Delete or comment out the next line to hide the pick buffer.
    gui.showBuffer();
    raf = window.requestAnimationFrame(draw);
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        const msg = `Could not load image at ${url}`;
        image.onerror = () => reject(new Error(msg));
        image.src = url;
    });
}

function populateGUI(gui) {
    // Change some gui default values
    gui.scheme('green') // default = 'blue'
        .textSize(20)   // default 12
    // Now make the control(s)
    gui.button('btnCrab', 90, 50, 300, 60)
        .text("Ahhh... crab legs\nlegs for dinner!!")
        .icon(crab)
        .tooltip('Click to eat them')
        .tipTextSize(14)    // default = 10
        .corners(10)
        .setAction(() => {
            const time = Math.floor(MILLIS() / 100) / 10;
            gui.$('lblCrab').text(`Legs eaten after ${time}s`);
        });
    gui.label('lblCrab', 90, 120, 300, 40)
        .scheme('yellow')
        .textSize(20)
        .corners(20)
        .text('Ready to eat?');
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