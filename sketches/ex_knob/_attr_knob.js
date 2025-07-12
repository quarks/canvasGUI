
let gui, knob, bdrs = [];
let low = 50, high = 300;
let mode = 'a', ta = 270, track = 20, gap = 90, sens = 0.005;
let mt = "TO ROTATE: Drag in a circluar motion round the knob center"

function setup() {
    let p5canvas = createCanvas(640, 400);
    p5canvas.parent('sketch');
    cursor(CROSS);
    gui = GUI.get(p5canvas);
    gui.scheme('orange');
    createKnob();
    createGUI();
}

function draw() {
    push();
    background(210);
    pop();
    stroke(0); strokeWeight(2); noFill();
    bdrs.forEach(b => rect(...b));
    gui.draw();
}

function createGUI() {
    gui.textSize(15);
    // Modes
    let gx = 520, gy = 80;
    let grid = gui.grid(gx, gy, 80, 120);
    grid.size(1, 4);
    gui.label('l0', ...grid.cell(0, 0, 1, 1)).text('MODE');
    gui.option('optX', ...grid.cell(0, 1, 1, 1)).group('mode').textAlign(CENTER).text('x')
        .setAction(info => {
            mode = 'x'; knob.mode(mode);
            mt = "TO ROTATE: Drag horizontally (x axis)";
            gui.$('lblMode').text(mt);
        });
    gui.option('optY', ...grid.cell(0, 2, 1, 1)).group('mode').textAlign(CENTER).text('y')
        .setAction(info => {
            mode = 'y'; knob.mode(mode);
            mt = "TO ROTATE: Drag vertically (y axis)";
            gui.$('lblMode').text(mt);
        });
    gui.option('optA', ...grid.cell(0, 3, 1, 1)).group('mode').textAlign(CENTER).text('a').select()
        .setAction(info => {
            mode = 'a'; knob.mode(mode);
            mt = "TO ROTATE: Drag in a circluar motion round the knob center";
            gui.$('lblMode').text(mt);
        });
    bdrs.push(grid.border(0, 0, 1, 4));

    // Other configurations
    gx = 40, gy = 270;
    grid = gui.grid(gx, gy, 560, 120);
    grid.rows(4).cols([0.21, 0.14, 0.65]);
    gui.label('l1', ...grid.cell(0, 0, 1, 1)).text('TURN ANGLE');
    gui.label('lblTA', ...grid.cell(1, 0, 1, 1)).text(ta);
    gui.slider('sdrTA', ...grid.cell(2, 0, 1, 1)).opaque().ticks(10, 2).limits(60, 360).value(ta)
        .setAction(info => {
            let ta = Math.round(info.value);
            gui.$('lblTA').text(ta);
            knob.turnAngle(ta);
        });
    gui.label('l2', ...grid.cell(0, 1, 1, 1)).text('TRACK');
    gui.label('lblTRACK', ...grid.cell(1, 1, 1, 1)).text(track);
    gui.slider('sdrTRACK', ...grid.cell(2, 1, 1, 1)).opaque().limits(6, knob.w() / 2).value(track)
        .setAction(info => {
            let tw = Math.round(info.value);
            gui.$('lblTRACK').text(tw);
            knob.track(tw);
        });
    gui.label('l3', ...grid.cell(0, 2, 1, 1)).text('SENSITIVITY');
    gui.label('lblSENS', ...grid.cell(1, 2, 1, 1)).text(sens);
    gui.slider('sdrSENS', ...grid.cell(2, 2, 1, 1)).opaque().ticks(9, 0, true).limits(0.0025, 0.025).value(sens)
        .setAction(info => {
            gui.$('lblSENS').text(nfs(info.value, 1, 4));
            knob.sensitivity(info.value);
        });
    gui.label('l4', ...grid.cell(0, 3, 1, 1)).text('GAP');
    gui.label('lblGAP', ...grid.cell(1, 3, 1, 1)).text(gap);
    gui.slider('sdrGAP', ...grid.cell(2, 3, 1, 1)).opaque().ticks(4, 3, true).limits(0, 360).value(gap)
        .setAction(info => {
            let gap = Math.round(info.value);
            gui.$('lblGAP').text(gap);
            knob.gap(gap);
        });
    bdrs.push(grid.border(0, 0, 3, 4));
    gui.label('lblMode', gx + 30, gy - 36, 500, 25).scheme('yellow').textSize(16)
        .corners([10, 10, 10, 10]).text(mt);
    grid = gui.grid(gx, 80, 120, 120).size(1, 4);
    gui.label('o1', ...grid.cell(0, 0, 1, 1)).text('KNOB')
    gui.label('o2', ...grid.cell(0, 1, 1, 1)).textAlign(LEFT).text(`Low:    ${low}`);
    gui.label('o3', ...grid.cell(0, 2, 1, 1)).textAlign(LEFT).text(`High:   ${high}`);
    gui.label('o4', ...grid.cell(0, 3, 1, 1)).textAlign(LEFT).text(`Value:   ${nfs(knob.value(), 1, 1)}`);
    bdrs.push(grid.border(0, 0, 1, 4));
}

function createKnob() {
    knob = gui.knob('js0', 240, 60, 160, 160).scheme('blue').ticks(5, 2)
        .turnAngle(ta).track(track).sensitivity(sens).gap(gap).mode(mode).limits(low, high)
        .setAction((info) => {
            gui.$('o4').text(`Value:   ${nfs(knob.value(), 1, 1)}`);
        });
}
