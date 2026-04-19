/*
Demonstration of using canvasGUI with WEBGL (3D)

The 3d animation for this sketch was taken from one of Processing's examples
so I can not take credit for that. :-) I simply use it to show that canvasGUI
works on a 3D sketch.
*/

// Initial values for RGB Color Mixer sliders
let red = 200, green = 180, blue = 20;

async function setup() {
    let p5canvas = createCanvas(640, 480, WEBGL);
    cSwatch = await loadImage("./assets/c_swatch.png");
    cPresets = await loadImage("./assets/c_presets.png");
    cMixer = await loadImage("./assets/c_mixer.png");


    // The next instruction is used to create the GUI controller.
    gui = createGUI("gui over 3d", p5canvas);
    populateGUI(gui);
}

function populateGUI(gui) {
    gui.scheme("blue").textSize(16);
    ABOUT(gui, 'Demo: canvasGUI with WEGL (3d)', 50)
    createColorSchemePane(gui);
    createColorMixer(gui);
    createColorPresets(gui);
    gui.checkbox("cbx1", 0, 0, 100, 20)
        .text("Hide Tabs", LEFT)
        .textSize(14)
        .tooltip("Hide / show pane tabs", 2000)
        .setAction(function (ei) {
            if (ei.selected)
                gui.hidePanes();
            else
                gui.showPanes();
        });
}

function draw() {
    background(240);
    stroke(0, 192);
    strokeWeight(2);
    fill(0, 0);
    sphere(760, 24, 24);
    stroke(0);
    fill(red, green, blue);
    strokeWeight(0.5);
    rotateY(frameCount * 0.005);

    for (let j = 0; j < 5; j++) {
        push();
        for (let i = 0; i < 80; i++) {
            translate(
                Math.sin(frameCount * 0.0005 + j) * 80,
                Math.sin(frameCount * 0.0005 + j) * 80,
                i * 0.1
            );
            rotateZ(frameCount * 0.001);
            sphere(8, 6, 4);
        }
        pop();
    }

    gui.draw();
};

function ABOUT(gui, title, depth = 24) {
    // TITLE PANE
    gui.pane('title-pane', 'north', depth, 'Sketch name')
        .scheme('dark');
    gui.label('sketch name', 0, depth - 24, width, 24, title)
        .scheme('light').corners(0).textSize(16).shrink(0, 24)
        .parent('title-pane');
    // CANVAS ATTRIBUTES PANE
    gui.pane('ca-pane', 'south', depth, 'Canvas attributes')
        .scheme('dark');
    const dpr = Number.isInteger(devicePixelRatio)
        ? devicePixelRatio : Math.round(devicePixelRatio * 100) / 100;
    const mode = (gui.mode === 'JS') ? 'XXX' : VERSION;
    const attrs = `p5js: ${mode}   ##   canvasGUI: ${GUI.VERSION}   `
        + `##   Context: '${gui.contextType}'   ##   DPR: ${dpr}`;
    gui.label('attributes', 0, 0, width, 24)
        .scheme('light').corners(0).textSize(13).text(attrs).shrink(0, 24)
        .parent('ca-pane');
}


