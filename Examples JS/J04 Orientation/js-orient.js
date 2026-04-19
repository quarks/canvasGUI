let gui, btn, bx, by;

async function setup() {
    canvas = document.getElementById('sketch');
    [width, height] = [canvas.width, canvas.height];
    // Must get the context (2d or WEBGL2) before creating the GUI
    ctx = canvas.getContext('2d');

    // Get resources 
    crab = await loadImage("./assets/crab.png");
    // Create the GUI controller for this canvas
    gui = createGUI('my gui', 'sketch');
    ABOUT(gui, "Orientating a canvasGUI control");
    populateGUI(gui);
    raf = window.requestAnimationFrame(draw);
}

function draw() {
    ctx.fillStyle = 'rgb(255 240 210)';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgb(0 0 0 /20%)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width, by);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx, height);
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.font = cssFont$('monospace', 14, 'normal');
    ctx.fillText(`[${bx}, ${by}]`, bx, by - 10);
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
    // The button we want to orient to configure
    const btn = gui.button('btn', 30, 120, 280, 80)
        .text("Ahhh... crab legs\nlegs for dinner!!")
        .scheme('green')
        .textSize(20)
        .icon(crab)
        .corners(8, 8, 18, 18);
    [bx, by] = [btn.x, btn.y];

    // Sketch title
    gui.label('desc', 30, 40, width - 60, 42)
        .text('Control Orientation')
        .corners(5)
        .textAlign('center')
        .textSize(24)
    // Orientation selection options
    gui.option('north', width - 130, 240, 100, 25)
        .text('North', 'center')
        .group('orient')
        .setAction(function () { orient('north') });
    gui.option('south', width - 130, 280, 100, 25)
        .text('South', 'center')
        .group('orient')
        .setAction(function () { orient('south') });
    gui.option('east', width - 130, 320, 100, 25)
        .text('East', 'center')
        .group('orient').select()
        .setAction(function () { orient('east') });
    gui.option('west', width - 130, 360, 100, 25)
        .text('West', 'center')
        .group('orient')
        .setAction(function () { orient('west') });
}

// Apply any changes
function orient(dir) {
    gui.$('btn').orient(dir)
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




