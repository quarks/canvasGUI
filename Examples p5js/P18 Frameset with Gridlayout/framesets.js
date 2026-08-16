/**
 * Demonstrates the use of framesets and grid layouts group controls and 
 * create visual borders to organise them by functionality.
 * 
 * Also shows how to use the 'format' method to set multiple control 
 * attributes in a single instruction.
 * 
 * The frameset can be added to both side panels and floating panels as
 * shown in this sketch. 
 */

function setup() {
    const p5canvas = createCanvas(640, 480);
    cursor(CROSS);

    // Converter frameset initial display location
    placedAt = 'window';

    // Create the GUI controller for this canvas
    gui = createGUI('my gui', p5canvas);

    ABOUT(gui, "Controls with borders");
    populateGUI(gui);
}

function populateGUI(g) {
    // The frameset for the metric-imperial converter.
    fstConvert = createConvertFrameSet(g).moveTo(400, 70);

    // The frameset with user options to select parent control for fstConvert
    fstOptions = createOptionsFrameset(g);

    // Create an empty side pane
    const fmt = { textSize: 16, textStyle: BOLD };
    pane = g.pane('pane-west', 'west', 240, 'Side Pane')
        .format(fmt);

    // Create an empty floating panel
    panel = g.panel('float-panel', 70, 100, 240, 230);
    g.label('fp name', 4, 4, panel.w - 8, 20, 'Floating Panel')
        .format(fmt).parent(panel);

    // Display position on sketch background
    g.label('sketch-window', 420, 44, 180, 20, `Sketch Window`)
        .format(fmt);
}

function createOptionsFrameset(g) {
    const fset = g.frameset('fs options', width - 170, height - 194)
        .opaque();
    const fmt = {
        scheme: 'blue', textSize: 14, textStyle: BOLD,
        textAlign: [CENTER, CENTER], parent: fset, group: 'placement'
    };
    const gd = g.grid(0, 0, 160, 160);
    gd.size(1, 5).insets(2, 4);

    g.label('options label', ...gd.cell(0, 0, 1, 2), 'LENGTH\nCONVERTER\nPLACEMENT')
        .format(fmt);

    g.option('window', ...gd.cell(0, 2, 1, 1), 'Sketch Window')
        .format(fmt)
        .select()
        .setAction(info => {
            if (info.source.id != placedAt) {
                pane.close();
                placedAt = 'window';
                fstConvert.leaveParent().moveTo(400, 70);
            }
        });

    g.option('panel', ...gd.cell(0, 3, 1, 1), 'Floating Panel')
        .format(fmt)
        .setAction(info => {
            if (info.source.id != placedAt) {
                pane.close();
                placedAt = info.source.id;
                fstConvert.parent(panel).moveTo(10, 36);
            }
        });

    g.option('pane', ...gd.cell(0, 4, 1, 1), 'Side Pane')
        .format(fmt)
        .setAction(info => {
            if (info.source.id != placedAt) {
                pane.open();
                placedAt = info.source.id;
                fstConvert.parent(pane).moveTo(10, 80)
            }
        });
    // Add display frames
    fset.addFrames(gd.frame(0, 0, 1, 2, 1));
    fset.addFrames(gd.frame(0, 3, 2, 1, 1));
    fset.addFrames(gd.frame(0, 0, 1, 5, 2.5));
    return fset;
}

function createConvertFrameSet(g) {
    // Create the frameset for the length converter
    const fset = g.frameset(`fs cmvt`, 0, 0).scheme('orange');

    // The grid will be used to position the controls relative to the frameset so
    // the x and y are both zero (first two parameters)
    const gd = g.grid(0, 0, 220, 180);
    gd.size([100, 55, 65], [24, 20, 20, 20, 30])
        .insets(4, 3);

    // Now create the controls
    const fmt = {
        scheme: 'orange', opaque: undefined, parent: fset,
        textSize: 14, textStyle: NORMAL
    };
    g.label(`cnvt title`, ...gd.C(0, 0, 3, 1), 'LENGTH CONVERTER')
        .format(fmt, { textSize: 18, textStyle: BOLD });

    g.label(`cnvt metric`, ...gd.C(0, 1, 1, 1), 'METRIC').format(fmt);
    g.label(`cnvt imperial`, ...gd.C(1, 1, 2, 1), 'IMPERIAL').format(fmt);

    g.label(`cnvt metres`, ...gd.C(0, 2, 1, 1), 'Metres').format(fmt);
    g.label(`cnvt feet`, ...gd.C(1, 2, 1, 1), 'Feet').format(fmt);
    g.label(`cnvt inches`, ...gd.C(2, 2, 1, 1), 'Inches').format(fmt);

    // Adjust the format object
    fmt['textFont'] = 'monospace';
    fmt['textSize'] = 16;

    g.label(`metres`, ...gd.C(0, 3, 1, 1), '0').format(fmt);
    g.label(`feet`, ...gd.C(1, 3, 1, 1), '0').format(fmt);
    g.label(`inches`, ...gd.C(2, 3, 1, 1), '0').format(fmt);

    g.slider('sdr height', ...gd.C(0, 4, 3, 1))
        .format(fmt, { value: 0, limits: [0, 10], ticks: [10, 2] })
        .setAction(info => {
            g.$('metres').text(nfs(info.value, 0, 3));
            g.$('feet').text(`${floor(info.value * 40 / 12)}`);
            g.$('inches').text(`${floor(info.value * 40) % 12}`);
        });

    // Now add the frames
    fset.addFrames(gd.frame(0, 0, 3, 1, 1.5));
    fset.addFrames(gd.frame(0, 1, 1, 3, 1));
    fset.addFrames(gd.frame(1, 1, 2, 3, 1));
    fset.addFrames(gd.frame(0, 0, 5, 5, 2.5));
    fset.opaque();

    return fset;
}

function draw() {
    background(180, 220, 255);
    push();
    noStroke();
    fill(0, 10);
    rect(400, 70, 220, 180);
    gui.draw();
    // Delete or comment out the next line to hide the pick buffer.
    // gui.showBuffer();
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
