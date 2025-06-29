let gui, js, bdrs = [];
// let js, cx = 110, cy = 180;

function setup() {
    let p5canvas = createCanvas(260, 400);
    p5canvas.parent('paper');
    cursor(CROSS);
    gui = GUI.get(p5canvas);
    gui.scheme('blue').textSize(15)
    createJoysticks();
    createOutput();
}

function draw() {
    push();
    background(255, 220, 200);
    fill(240, 240, 255); noStroke();
    rect(0, 200, 260, height - 200);
    pop();
    stroke(0); strokeWeight(1); noFill();
    bdrs.forEach(b => rect(...b));
    gui.draw();
}

function createOutput() {
    let grid = gui.grid(10, 210, 240, 175);
    grid.cols([60, 40]).rows(7);
    gui.label('lbl0', ...grid.cell(0, 0, 1, 1)).opaque().text('X');
    gui.label('lblX', ...grid.cell(1, 0, 1, 1)).transparent().text('0');
    bdrs.push(grid.border(0, 0, 2, 1));
    gui.label('lbl1', ...grid.cell(0, 1, 1, 1)).opaque().text('Y');
    gui.label('lblY', ...grid.cell(1, 1, 1, 1)).transparent().text('0');
    bdrs.push(grid.border(0, 1, 2, 1));
    gui.label('lbl2', ...grid.cell(0, 2, 1, 1)).opaque().text('XY');
    gui.label('lblXY', ...grid.cell(1, 2, 1, 1)).transparent().text('-1');
    bdrs.push(grid.border(0, 2, 2, 1));
    gui.label('lbl3', ...grid.cell(0, 3, 1, 1)).opaque().text('Magnitude');
    gui.label('lblMag', ...grid.cell(1, 3, 1, 1)).transparent().text(0);
    bdrs.push(grid.border(0, 3, 2, 1));
    gui.label('lbl4', ...grid.cell(0, 4, 1, 1)).opaque().text('Angle');
    gui.label('lblAng', ...grid.cell(1, 4, 1, 1)).transparent().text(0);
    bdrs.push(grid.border(0, 4, 2, 1));
    gui.label('lbl5', ...grid.cell(0, 5, 1, 1)).opaque().text('In Dead Zone?');
    gui.label('lblDead', ...grid.cell(1, 5, 1, 1)).transparent().text('TRUE');
    bdrs.push(grid.border(0, 5, 2, 1));
    gui.label('lbl6', ...grid.cell(0, 6, 1, 1)).opaque().text('Final value?');
    gui.label('lblFinal', ...grid.cell(1, 6, 1, 1)).transparent().text('TRUE');
    bdrs.push(grid.border(0, 6, 2, 1));
}

function createJoysticks() {
    js = gui.joystick('js0', 50, 20, 160, 160).scheme('orange')
        .setAction((info) => {
            gui.$('lblX').text(info.X);
            gui.$('lblY').text(info.Y);
            gui.$('lblXY').text(info.XY);
            gui.$('lblMag').text(nfs(info.mag, 1, 4));
            gui.$('lblAng').text(nfs(info.angle, 1, 4));
            gui.$('lblDead').text(info.dead ? 'TRUE' : 'FALSE');
            gui.$('lblFinal').text(info.final ? 'TRUE' : 'FALSE');
        });
}
