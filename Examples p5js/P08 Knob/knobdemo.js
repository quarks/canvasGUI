
let gui, knob, bdrs = [];
let low = 50, high = 300;
let turnmode = 'a', ta = 270, track = 20, gap = 90, sens = 0.005;
const mt = [
    "TO ROTATE: Drag horizontally (x axis)",
    "TO ROTATE: Drag vertically (y axis)",
    "TO ROTATE: Drag in a circluar motion round the knob center"
];


function setup() {
    const p5canvas = createCanvas(600, 480);
    cursor(CROSS);
    is3d = p5canvas.GL;
    console.log(`Version ${VERSION}   using ${is3d ? 'WEBGL' : 'P2D'}`);
    // Create the GUI controller for this canvas
    gui = createGUI('knob gui', p5canvas);

    ABOUT(gui, "Knobs : turn modes");
    populateGuiKnob(gui);
    populateGuiData(gui);
}

function draw() {
    rectMode(CORNER);
    push();
    background(210, 160, 210);
    stroke(0); strokeWeight(2); noFill();
    bdrs.forEach(b => rect(...b));
    pop();
    gui.draw();
    // Delete or comment out the next line to hide the pick buffer.
    gui.showBuffer();
}

function populateGuiData(gui) {
    gui.corners(6)
        .scheme('orange')
        .textSize(15);
    // TURN MODES
    let gx = 500, gy = 100;
    let grid = gui.grid(gx, gy, 80, 120);
    grid.size(1, 4);
    gui.label('l0', ...grid.cell(0, 0, 1, 1)).text('MODE');
    gui.option('optX', ...grid.cell(0, 1, 1, 1)).group('grpMode').text('x', CENTER)
        .setAction(info => {
            turnmode = 'x'; knob.mode(turnmode); gui.$('lblMode').text(mt[0]);
        });
    gui.option('optY', ...grid.cell(0, 2, 1, 1))
        .group('grpMode')
        .text('y', CENTER)
        .setAction(info => {
            turnmode = 'y'; knob.mode(turnmode);
            gui.$('lblMode').text(mt[1]);
        });
    gui.option('optA', ...grid.cell(0, 3, 1, 1))
        .group('grpMode')
        .text('a', CENTER)
        .select()
        .setAction(info => {
            turnmode = 'a'; knob.mode(turnmode);
            gui.$('lblMode').text(mt[2]);
        });
    bdrs.push(grid.border(0, 0, 1, 4));
    // KNOB CONFIGURATIONS
    gx = 20, gy = 320;
    grid = gui.grid(gx, gy, 560, 120);
    grid.rows(4).cols([0.21, 0.14, 0.65]);
    gui.label('l1', ...grid.cell(0, 0, 1, 1)).text('TURN ANGLE');
    gui.label('lblTA', ...grid.cell(1, 0, 1, 1)).text(ta);
    gui.slider('sdrTA', ...grid.cell(2, 0, 1, 1))
        .opaque()
        .ticks(10, 2)
        .limits(60, 360)
        .value(ta)
        .setAction(info => {
            let ta = Math.round(info.value);
            gui.$('lblTA').text(ta);
            knob.turnAngle(ta);
        });
    gui.label('l2', ...grid.cell(0, 1, 1, 1)).text('TRACK');
    gui.label('lblTRACK', ...grid.cell(1, 1, 1, 1)).text(track);
    gui.slider('sdrTRACK', ...grid.cell(2, 1, 1, 1))
        .opaque()
        .limits(6, knob.w / 2)
        .value(track)
        .setAction(info => {
            let tw = Math.round(info.value);
            gui.$('lblTRACK').text(tw);
            knob.track(tw);
        });
    gui.label('l3', ...grid.cell(0, 2, 1, 1)).text('SENSITIVITY');
    gui.label('lblSENS', ...grid.cell(1, 2, 1, 1)).text(sens);
    gui.slider('sdrSENS', ...grid.cell(2, 2, 1, 1))
        .opaque().ticks(9, 0, true)
        .limits(0.0025, 0.025)
        .value(sens)
        .setAction(info => {
            gui.$('lblSENS').text(nfs(info.value, 1, 4));
            knob.sensitivity(info.value);
        });
    gui.label('l4', ...grid.cell(0, 3, 1, 1)).text('GAP');
    gui.label('lblGAP', ...grid.cell(1, 3, 1, 1)).text(gap);
    gui.slider('sdrGAP', ...grid.cell(2, 3, 1, 1))
        .opaque().ticks(4, 3, true)
        .limits(0, 360)
        .value(gap)
        .setAction(info => {
            let gap = Math.round(info.value);
            gui.$('lblGAP').text(gap);
            knob.gap(gap);
        });
    bdrs.push(grid.border(0, 0, 3, 4));
    // KNOB TURN INSTRUCTIONS
    gui.label('lblMode', gx + 30, gy - 36, 500, 25)
        .scheme('yellow')
        .textSize(16)
        .text(mt[2]);
    // KNOB ATTRIBUTES
    grid = gui.grid(gx, 100, 120, 120).size(1, 4);
    gui.label('o1', ...grid.cell(0, 0, 1, 1)).text('KNOB')
    gui.label('o2', ...grid.cell(0, 1, 1, 1)).text(`Low:       ${low}`, LEFT);
    gui.label('o3', ...grid.cell(0, 2, 1, 1)).text(`High:      ${high}`, LEFT);
    gui.label('o4', ...grid.cell(0, 3, 1, 1)).text(`Value:   ${nfs(knob.value(), 1, 1)}`, LEFT);
    bdrs.push(grid.border(0, 0, 1, 4));
}

function populateGuiKnob(gui) {
    knob = gui.knob('kb0', 190, 40, 220, 220)
        .scheme('green')
        .transparent()
        .ticks(5, 2)
        .turnAngle(ta)
        .track(track)
        .sensitivity(sens)
        .gap(gap)
        .mode(turnmode)
        .limits(low, high)
        .tooltip('Turn baby turn')
        .setAction((info) => {
            gui.$('o4').text(`Value:   ${nfs(knob.value(), 1, 1)}`);
        });
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
        .scheme('light')
        .corners(0)
        .textSize(13)
        .text(vstr, 'center', 'center');
}
