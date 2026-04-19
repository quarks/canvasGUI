let gui, examples = [], example;

async function setup() {
    let p5canvas = createCanvas(700, 480);
    p5canvas.parent('sketch');
    cursor(CROSS);
    // Get resources
    santaoff = await loadImage('./assets/santa.png');
    tjoff = await loadImage('./assets/tjoff.jpg');
    tjover = await loadImage('./assets/tjover.jpg');
    tjmask = await loadImage('./assets/tjmask.png');
    coinsoff = await loadImage('./assets/coinsoff.png');
    coinsover = await loadImage('./assets/coinsover.png');

    tjtxt = await loadStrings('./assets/tj.txt');
    coinstxt = await loadStrings('./assets/coins.txt');
    santatxt = await loadStrings('./assets/santa.txt');

    ghost = await loadImage('./assets/ghost0.png');
    // Create the GUI controller for this canvas
    gui = createGUI('my gui', p5canvas);

    ABOUT(gui, "Image Buttons");
    populateGUI(gui);
}

function populateGUI(gui) {
    gui.scheme('red').textSize(14); // default = 'blue'
    examples = createButtonExamples(gui);
    createExamplePicker(gui);
    createConfigCtrls(gui);
    // Now make the first image button example
    changeExample(0);
}

function createConfigCtrls(gui) {
    let grid = gui.grid(410, 240, 280, 240)
        .size(6, 8);
    gui.label('lblChangeSize', ...grid.cell(0, 0, 6, 1), 'Button Size');
    gui.label('lblWidth', ...grid.cell(0, 1, 2, 1), 'Width');
    gui.slider('sdrWidth', ...grid.cell(2, 1, 4, 1))
        .opaque()
        .ticks(2, 5)
        .limits(0.5, 1.5)
        .value(1)
        .setAction(info => {
            example.sx = info.value;
            if (gui.$('cbxAspect').isSelected()) {
                gui.$('sdrHeight').value(info.value);
                example.sy = info.value;
            }
            changeSize();
        });
    gui.label('lblHeight', ...grid.cell(0, 2, 2, 1), 'Height')
    gui.slider('sdrHeight', ...grid.cell(2, 2, 4, 1))
        .opaque()
        .ticks(2, 5)
        .limits(0.5, 1.5)
        .value(1)
        .setAction(info => {
            example.sy = info.value;
            if (gui.$('cbxAspect').isSelected()) {
                gui.$('sdrWidth').value(info.value);
                example.sx = info.value;
            }
            changeSize();
        });
    gui.checkbox('cbxAspect', ...grid.cell(0, 3, 3, 1), 'Default Aspect')
        .iconAlign(RIGHT)
        .select()
        .setAction(info => {
            const [sdrW, sdrH] = [gui.$('sdrWidth'), gui.$('sdrHeight')];
            const sel = info.source.isSelected();
            example.aspect = sel;
            if (sel) {
                let v = (sdrW.value() + sdrH.value()) / 2;
                sdrW.value(v);
                sdrH.value(v);
                example.sx = example.sy = v;
                changeSize();
            }
        });
    gui.checkbox('cbxOpaque', ...grid.cell(3, 3, 3, 1), 'Opaque')
        .iconAlign(RIGHT)
        .setAction(info => {
            example.opaque = info.source.isSelected();
            changeOpacity();
        });
    gui.button('btnReset', ...grid.cell(0, 4, 6, 1), "RESTORE DEFAULTS")
        .setAction(info => {
            const [sdrW, sdrH] = [gui.$('sdrWidth'), gui.$('sdrHeight')];
            gui.$('cbxAspect').select();
            sdrW.value(1);
            sdrH.value(1);
            example.sx = example.sy = 1;
            example.aspect = true;
            example.opaque = false;
            changeOpacity();
            changeSize();
        });

}


function createExamplePicker(gui) {
    let grid = gui.grid(10, height - 52, width - 20, 26).size(3, 1);
    let n = 0, facetxt = ['Tom and Jerry', 'Gold Doubloons', 'Santa Claus'];
    facetxt.forEach(ft => {
        let id = `ex${n}`
        gui.button(id, ...grid.cell(n, 0, 1, 1), ft)
            .scheme('orange')
            .setAction(() => changeExample(Number(id.substring(2))));
        n++;
    });
}

function createButtonExamples(gui) {
    const exs = [];
    const font = 'calibri';
    let id = 'tj';
    let btn = gui.image(id, 10, 40, [tjoff, tjover], tjmask);
    let pstr = gui.poster(`${id} poster`, 400, 0, 280, 200)
        .fonts(font, true)
        .transparent()
        .text(tjtxt)
        .parent(btn);
    exs.push({
        btn: btn, w: btn.w, h: btn.h, sx: 1, sy: 1,
        aspect: true, opaque: false
    });

    id = 'coins';
    btn = gui.image(id, 10, 40, [coinsoff, coinsover])
        .transparent();
    pstr = gui.poster(`${id} poster`, 400, 0, 280, 200)
        .fonts(font, true)
        .transparent()
        .text(coinstxt)
        .parent(btn);
    exs.push({
        btn: btn, w: btn.w, h: btn.h, sx: 1, sy: 1,
        aspect: true, opaque: false
    });

    id = 'santa';
    btn = gui.image(id, 10, 40, santaoff)
        .transparent();
    pstr = gui.poster(`${id} poster`, 400, 0, 280, 200)
        .fonts(font, true)
        .transparent()
        .text(santatxt)
        .parent(btn);
    exs.push({
        btn: btn, w: btn.w, h: btn.h, sx: 1, sy: 1,
        aspect: true, opaque: false
    });
    return exs;
}


function changeExample(idx) {
    examples.forEach(ex => ex.btn.hide(true));
    example = examples[idx];
    const { btn, w, h, sx, sy, aspect, opaque } = example;
    btn.show(true);
    gui.$('sdrWidth').value(sx);
    gui.$('sdrHeight').value(sy);
    if (aspect)
        gui.$('cbxAspect').select();
    else
        gui.$('cbxAspect').deselect();
    if (opaque)
        gui.$('cbxOpaque').select();
    else
        gui.$('cbxOpaque').deselect();
}


function changeSize() {
    const { btn, w, h, sx, sy, aspect, opaque } = example;
    btn.resize(w * sx, h * sy);
}


function changeOpacity() {
    if (example.opaque)
        example.btn.opaque()
    else
        example.btn.transparent();
}

function draw() {
    background(232);
    gui.draw();
    // Delete or comment out the next line to hide the pick buffer.
    gui.showBuffer();
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
