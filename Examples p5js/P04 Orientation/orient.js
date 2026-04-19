let gui, btn, bx, by;

async function setup() {
    let p5canvas = createCanvas(480, 440);
    p5canvas.parent('sketch');

    cursor(CROSS);
    crab = await loadImage("assets/crab.png");
    // Create the GUI controller for this canvas
    gui = createGUI('gui 1', p5canvas);


    ABOUT(gui, 'Orientating a canvasGUI control.')
    populateGUI(gui);
}

function draw() {
    push();
    background(255, 240, 210);
    stroke(0, 48);
    strokeWeight(1.5);
    line(bx, by, width, by);
    line(bx, by, bx, height);
    fill(0);
    noStroke();
    textSize(14);
    textFont('monospace')
    text(`[${bx}, ${by}]`, bx, by - 10);
    pop();
    gui.draw();
    // Delete or comment out the next line to hide the pick buffer.
    gui.showBuffer();
}


function populateGUI(gui) {
    gui.textSize(16);
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
        .textAlign(CENTER)
        .textSize(24)
    // Orientation selection options
    gui.option('north', width - 130, 240, 100, 25)
        .text('North', CENTER)
        .group('orient')
        .setAction(function () { orient('north') });
    gui.option('south', width - 130, 280, 100, 25)
        .text('South', CENTER)
        .group('orient')
        .setAction(function () { orient('south') });
    gui.option('east', width - 130, 320, 100, 25)
        .text('East', CENTER)
        .group('orient').select()
        .setAction(function () { orient('east') });
    gui.option('west', width - 130, 360, 100, 25)
        .text('West', CENTER)
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
