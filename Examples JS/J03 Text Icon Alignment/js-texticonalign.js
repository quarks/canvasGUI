let gui, rhyme, textAligns = [], iconAligns = [];
let text_align_h, text_align_v
let icon_align_h, icon_align_v;

let txt = [
    "Three blind mice, three blind mice",
    "See how they run!",
    "They all run after the farmer's wife",
    "And she cut off their tails with a carving knife,",
    "Did you ever see such a thing in your life",
    "As three blind mice!"
];


async function setup() {
    canvas = document.getElementById('sketch');
    [width, height] = [canvas.width, canvas.height];
    // Must get the context (2d or WEBGL2) before creating the GUI
    ctx = canvas.getContext('2d');

    // Get resources 
    img = await loadImage("./assets/threeblindmice.png");
    // Create the GUI controller for this canvas
    gui = createGUI('my gui', 'sketch');
    ABOUT(gui, "Demo: Text and icon alignment");
    populateGUI(gui);
    raf = window.requestAnimationFrame(draw);
}

function draw() {
    ctx.fillStyle = 'rgb(180 200 200)';
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
    gui.scheme('yellow')
        .textSize(12);
    // Label showing 'Three Blind Mice'
    rhyme = gui.label('verse', 10, 40, 620, 240)
        .scheme('yellow')
        .textSize(20)
        .icon(img, 'right', 'top')
        .text(txt, 'left', 'center')
        .textStyle('italic')
        .corners([8, 8, 8, 8]);
    // TEXT ALIGNMENT OPTIONS
    // Horizontal
    gui.label('ta_lbl', 10, 338, 300, 26)
        .textSize(16)
        .text('Text Alignment')
        .scheme('orange');
    let ctrl = gui.option('tleft', 10, 370, 140, 26)
        .text('LEFT', 'left')
        .group('th_align')
        .select()
        .setAction(() => { text_align_h = 'left'; textAlignment() });
    textAligns.push(ctrl);
    ctrl = gui.option('tcenter', 10, 400, 140, 26)
        .text('CENTER', 'center')
        .group('th_align')
        .setAction(() => { text_align_h = 'center'; textAlignment() });
    textAligns.push(ctrl);
    ctrl = gui.option('tright', 10, 430, 140, 26)
        .text('RIGHT', 'center')
        .group('th_align')
        .setAction(() => { text_align_h = 'right'; textAlignment() });
    textAligns.push(ctrl);
    // Vertical
    ctrl = gui.option('ttop', 170, 370, 140, 26)
        .text('TOP', 'top')
        .group('tv_align')
        .setAction(() => { text_align_v = 'top'; textAlignment() });
    textAligns.push(ctrl);
    ctrl = gui.option('tmiddle', 170, 400, 140, 26)
        .text('CENTER', 'center')
        .group('tv_align')
        .select()
        .setAction(() => { text_align_v = 'center'; textAlignment() });
    textAligns.push(ctrl);
    ctrl = gui.option('tbottom', 170, 430, 140, 26)
        .text('BOTTOM', 'bottom')
        .group('tv_align')
        .setAction(() => { text_align_v = 'bottom'; textAlignment() });
    textAligns.push(ctrl);

    // ICON ALIGNMENT OPTIONS
    // Horizontal
    gui.label('ia_lbl', 330, 338, 300, 26)
        .textSize(16)
        .text('Icon Alignment')
        .scheme('orange');
    ctrl = gui.option('ileft', 330, 370, 140, 26)
        .text('LEFT', 'left')
        .group('ih_align')
        .setAction(() => { icon_align_h = 'left'; iconAlignment() });
    iconAligns.push(ctrl);
    ctrl = gui.option('icenter', 330, 400, 140, 26)
        .text('CENTER', 'center')
        .group('ih_align')
        .disable()
        .setAction(() => { icon_align_h = 'center'; iconAlignment() });
    iconAligns.push(ctrl);
    ctrl = gui.option('iright', 330, 430, 140, 26)
        .text('RIGHT', 'right')
        .group('ih_align')
        .select()
        .setAction(() => { icon_align_h = 'right'; iconAlignment() });
    iconAligns.push(ctrl);
    // Vertical
    ctrl = gui.option('itop', 490, 370, 140, 26)
        .text('TOP', 'top')
        .group('iv_align')
        .select()
        .setAction(() => { icon_align_v = 'top'; iconAlignment() });
    iconAligns.push(ctrl);
    ctrl = gui.option('imiddle', 490, 400, 140, 26)
        .text('CENTER', 'center')
        .group('iv_align')
        .setAction(() => { icon_align_v = 'center'; iconAlignment() });
    iconAligns.push(ctrl);
    ctrl = gui.option('ibottom', 490, 430, 140, 26)
        .text('BOTTOM', 'bottom')
        .group('iv_align')
        .setAction(() => { icon_align_v = 'bottom'; iconAlignment() });
    iconAligns.push(ctrl);
    // TEXT / NO TEXT
    gui.checkbox('notext', 10, 300, 300, 26)
        .scheme('red')
        .textSize(16)
        .text('No text', 'center')
        .setAction((info) => {
            CLOG(info.selected)
            if (info.selected) {
                rhyme.noText();
                textAligns.forEach(ctrl => ctrl.disable());
                gui.$('icenter').enable();
            }
            else {
                rhyme.text(txt);
                textAligns.forEach(ctrl => ctrl.enable());
                gui.$('icenter').disable();
            }
        });
    // ICON / NO ICON
    gui.checkbox('noicon', 330, 300, 300, 26)
        .scheme('red')
        .textSize(16)
        .text('No icon', 'center')
        .setAction((info) => {
            if (info.selected) {
                rhyme.noIcon();
                iconAligns.forEach(ctrl => ctrl.disable());
            }
            else {
                rhyme.icon(img);
                iconAligns.forEach(ctrl => ctrl.enable());
                if (!gui.$('notext}'))
                    gui.$('icenter').disable();

            }
        });
}

function textAlignment() {
    rhyme.textAlign(text_align_h, text_align_v);
}

function iconAlignment() {
    rhyme.iconAlign(icon_align_h, icon_align_v);
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
