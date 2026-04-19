let gui, img;
let viewer;

async function setup() {
    img = await loadImage('./assets/magic.jpg');
    let p5canvas = createCanvas(560, 600);
    p5canvas.parent('sketch');
    is3d = p5canvas.GL;
    console.log(`Version ${VERSION}   using ${is3d ? 'WEBGL' : 'P2D'}`);
    cursor(CROSS);
    // Create the GUI controller for this canvas
    gui = createGUI('viewer gui', p5canvas);

    ABOUT(gui, "Picture viewer with scaler");
    populateGUI(gui);
}

function draw() {
    background(160, 0, 0);
    gui.draw();
    gui.showBuffer('pickbuffer');
}

function populateGUI(gui) {
    gui.viewer('picture', 24, 40, 512, 512)
        .frame(8)
        //.transparent()
        .layers(img)
        // .scaler(0.75, 0.175, 2)
        .scaler(0.75, 0.52, 2)

        .setAction(info => {
            let { cX, cY, scale } = info;
            // console.log(`${cX}  ${cY}  ${scale}  ${viewer._scaler.value()} `)
        })
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

