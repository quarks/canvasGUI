let r = 200, g = 180, b = 20

function preload() {
    cSwatch = loadImage('data/c_swatch.png');
    cPresets = loadImage('data/c_presets.png');
    cMixer = loadImage('data/c_mixer.png');
}

function setup() {
    let p5canvas = createCanvas(600, 500, WEBGL);
    p5canvas.parent('paper');
    gui = GUI.get(p5canvas);
    // This next instruction MUST be used to initialise the GUI controller
    gui.scheme('blue').textSize(12);

    createColorSchemePane();
    createColorPresets();
    createColorMixer();

    gui.checkbox('cbx1', 0, 0, 120, 60).text('Hide\nTabs', LEFT).textSize(9).shrink()
        .setAction(function (ei) {
            if (ei.selected) gui.hideAll(); else gui.showAll()
        })
        .tooltip('Hide / show tabs', 2000)
        .scheme('green');
}

function draw() {
    push();
    background(230);

    stroke(0);
    fill(r, g, b);
    strokeWeight(0.5);
    rotateY(frameCount * 0.005);

    for (let j = 0; j < 5; j++) {
        push();
        for (let i = 0; i < 80; i++) {
            translate(
                sin(frameCount * 0.0005 + j) * 80,
                sin(frameCount * 0.0005 + j) * 80,
                i * 0.1
            );
            rotateZ(frameCount * 0.001);
            push();
            sphere(8, 6, 4);
            pop();
        }
        pop();
    }
    pop();
    gui.draw();
}

function createColorMixer() {
    let pane = gui.pane('mixer', 'south', 80).text('RGB Color Mixer').icon(cMixer);
    sdrR = gui.slider('sdrR', 20, 4, 160, 20).limits(0, 255).value(r).parent(pane)
        .setAction(function (ei) { r = round(ei.value) });
    gui.label('lblR', 30, 26, 140, 14).text('Red').parent(pane);
    sdrG = gui.slider('sdrG', 220, 4, 160, 20).limits(0, 255).value(g).parent(pane)
        .setAction(function (ei) { g = round(ei.value) });
    gui.label('lblG', 230, 26, 140, 14).text('Green').parent(pane);
    sdrB = gui.slider('sdrB', 420, 4, 160, 20).limits(0, 255).value(b).parent(pane)
        .setAction(function (ei) { b = round(ei.value) });
    gui.label('lblB', 430, 26, 140, 14).text('Blue').parent(pane);

}

function createColorPresets() {
    let pane = gui.pane('presets', 'south', 110).text('Color Presets').icon(cPresets)
    gui.button('ps1', 100, 4, 120, 20).text('Burnt Sienna').parent(pane)
        .icon(getColorIcon(12, 12, 218, 95, 28))
        .setAction(function () {
            sdrR.value(r = 218); sdrG.value(g = 95); sdrB.value(b = 28)
        });

    gui.button('ps2', 250, 4, 120, 20).text('Blue Mustang').parent(pane)
        .icon(getColorIcon(12, 12, 56, 135, 157))
        .setAction(function () {
            sdrR.value(r = 56); sdrG.value(g = 135); sdrB.value(b = 157)
        });

    gui.button('ps3', 400, 4, 120, 20).text('Natural').parent(pane)
        .icon(getColorIcon(12, 12, 218, 191, 151))
        .setAction(function () {
            sdrR.value(r = 218); sdrG.value(g = 191); sdrB.value(b = 151)
        });

    gui.button('ps4', 100, 40, 120, 20).text('Harvest Gold').parent(pane)
        .icon(getColorIcon(12, 12, 252, 185, 77))
        .setAction(function () {
            sdrR.value(r = 252); sdrG.value(g = 185); sdrB.value(b = 77)
        });

    gui.button('ps5', 250, 40, 120, 20).text('Teak').parent(pane)
        .icon(getColorIcon(12, 12, 170, 108, 24))
        .setAction(function () {
            sdrR.value(r = 170); sdrG.value(g = 108); sdrB.value(b = 24)
        });

    gui.button('ps6', 400, 40, 120, 20).text('Avacado').parent(pane)
        .icon(getColorIcon(12, 12, 135, 155, 66))
        .setAction(function () {
            sdrR.value(r = 135); sdrG.value(g = 155); sdrB.value(b = 66)
        });
}

function createColorSchemePane() {
    let pane = gui.pane('colScheme', 'east', 120).text('GUI Color Scheme').icon(cSwatch);
    gui.option('red', 10, 180, 70, 20).text('Red').group('scheme').parent(pane)
        .setAction(csAction);
    gui.option('green', 10, 210, 70, 20).text('Green').group('scheme').parent(pane)
        .setAction(csAction);
    gui.option('blue', 10, 240, 70, 20).text('Blue').group('scheme').parent(pane)
        .setAction(csAction).select();
    gui.option('yellow', 10, 270, 70, 20).text('Yellow').group('scheme').parent(pane)
        .setAction(csAction);
    gui.option('purple', 10, 300, 70, 20).text('Purple').group('scheme').parent(pane)
        .setAction(csAction);
    gui.option('cyan', 10, 330, 70, 20).text('Cyan').group('scheme').parent(pane)
        .setAction(csAction);
    gui.option('orange', 10, 360, 70, 20).text('Orange').group('scheme').parent(pane)
        .setAction(csAction);
    gui.label('cslabel', 10, 130, 70, 20).text('Select GUI\ncolor scheme')
        .textSize(14).parent(pane);
}

function csAction(ei) {
    gui.scheme(ei.source.name());
}

function getColorIcon(w, h, r, g, b) {
    let img = createImage(w, h);
    img.loadPixels();
    for (let i = 0; i < img.pixels.length; i += 4) {
        img.pixels[i] = r;
        img.pixels[i + 1] = g;
        img.pixels[i + 2] = b;
        img.pixels[i + 3] = 255;
    }
    img.updatePixels();
    return img;
}


function keyTyped() {
    if (key === 'c') {
        console.clear();
    }
    if (key === '-') {
        console.log('-----------------------------------------------------------------');
    }
}
