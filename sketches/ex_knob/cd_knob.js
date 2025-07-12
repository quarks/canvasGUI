let gui, bdr, h = 120, s = 80, b = 55;

function setup() {
    let p5canvas = createCanvas(640, 310);
    p5canvas.parent('sketch');
    gui = GUI.get(p5canvas);
    createGUI();
}

function draw() {
    push();
    colorMode(HSB, 360, 100, 100);
    background(h, s, b);
    colorMode(RGB, 255); noStroke(); fill(96);
    rect(...bdr);
    pop();
    gui.draw();
}

function createGUI() {
    gui.scheme('blue').textSize(16);
    let grid = gui.grid(70, 50, 500, 210);
    grid.insets(6, 3).size([30, 5, 30, 5, 30], [30, 30, 150]);
    // Hue knob
    gui.label('lbl0', ...grid.cell(0, 0, 1, 1)).scheme('blue').text('HUE');
    gui.label('lblHue', ...grid.cell(0, 1, 1, 1)).scheme('blue').text(h);
    gui.knob('knbHue', ...grid.cell(0, 2, 1, 1));
    gui.$('knbHue').scheme('blue').transparent().track(16).mode('a')
        .limits(0, 360).value(h).ticks(8, 3)
        .setAction(info => {
            h = round(info.value % 360); gui.$('lblHue').text(nfs(h, 0, 0));
        })
    // Saturtation knob
    gui.label('lbl1', ...grid.cell(2, 0, 1, 1)).scheme('green').text('SATURATION');
    gui.label('lblSat', ...grid.cell(2, 1, 1, 1)).scheme('green').text(s);
    gui.knob('knbSat', ...grid.cell(2, 2, 1, 1));
    gui.$('knbSat').scheme('green').transparent().track(16).mode('a')
        .turnAngle(300).limits(0, 100).value(s).ticks(10, 2)
        .setAction(info => {
            s = info.value; gui.$('lblSat').text(nfs(s, 1, 1));
        })
    // Brightness knob
    gui.label('lbl2', ...grid.cell(4, 0, 1, 1)).scheme('green').text('BRIGHTNESS');
    gui.label('lblBri', ...grid.cell(4, 1, 1, 1)).scheme('green').text(b);
    gui.knob('knbBri', ...grid.cell(4, 2, 1, 1));
    gui.$('knbBri').scheme('green').transparent().track(16).mode('a')
        .turnAngle(300).limits(0, 100).value(b).ticks(10, 2)
        .setAction(info => {
            b = info.value; gui.$('lblBri').text(nfs(b, 1, 1));
        })
    // Grid border
    bdr = grid.border(0, 0, grid.nbrCols, grid.nbrRows);
}
