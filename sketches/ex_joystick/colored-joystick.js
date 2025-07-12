let gui, bdrs = [];
let js, mode, cx = 110, cy = 180;

function setup() {
    let p5canvas = createCanvas(640, 400);
    p5canvas.parent('paper');
    cursor(CROSS);
    gui = GUI.get(p5canvas);
    gui.scheme('blue').textSize(15);
    mode = 'X8';

    createJoysticks();
    createOutput();
}

function draw() {
    push();
    background(230);
    fill(255); noStroke();
    rect(0, 225, 260, height - 200);
    pop();
    stroke(0); strokeWeight(1); noFill();
    bdrs.forEach(b => rect(...b));
    gui.draw();
}

function createOutput() {
    let grid = gui.grid(10, 237, 240, 150);
    grid.cols([60, 40]).rows(6);
    gui.label('lbl0', ...grid.cell(0, 0, 1, 1)).opaque().text('Mode');
    gui.label('lblMode', ...grid.cell(1, 0, 1, 1)).transparent().text(js.mode());
    bdrs.push(grid.border(0, 0, 2, 1));
    gui.label('lbl1', ...grid.cell(0, 1, 1, 1)).opaque().text('Magnitude');
    gui.label('lblMag', ...grid.cell(1, 1, 1, 1)).transparent().text(0);
    bdrs.push(grid.border(0, 1, 2, 1));
    gui.label('lbl2', ...grid.cell(0, 2, 1, 1)).opaque().text('Angle');
    gui.label('lblAng', ...grid.cell(1, 2, 1, 1)).transparent().text(0);
    bdrs.push(grid.border(0, 2, 2, 1));
    gui.label('lbl3', ...grid.cell(0, 3, 1, 1)).opaque().text('Direction');
    gui.label('lblDir', ...grid.cell(1, 3, 1, 1)).transparent().text(-1);
    bdrs.push(grid.border(0, 3, 2, 1));
    gui.label('lbl4', ...grid.cell(0, 4, 1, 1)).opaque().text('In Dead Zone?');
    gui.label('lblDead', ...grid.cell(1, 4, 1, 1)).transparent().text('TRUE');
    bdrs.push(grid.border(0, 4, 2, 1));
    gui.label('lbl5', ...grid.cell(0, 5, 1, 1)).opaque().text('Final value?');
    gui.label('lblFinal', ...grid.cell(1, 5, 1, 1)).transparent().text('TRUE');
    bdrs.push(grid.border(0, 5, 2, 1));
}

function createJoysticks() {
    let jsize = 120, grid = gui.grid(280, 10, jsize * 3, jsize * 4);
    grid.cols([100, 20, 100, 20, 100, 20])
        .rows([100, 20, 100, 20, 100, 20, 100, 20]);
    gui.joystick('js1', ...grid.cell(0, 0, 1, 1)).scheme('dark').opaque().mode(mode);
    gui.joystick('js2', ...grid.cell(2, 0, 1, 1)).scheme('light').opaque().mode(mode);
    gui.joystick('js3', ...grid.cell(4, 0, 1, 1)).scheme('blue').opaque().mode(mode);
    gui.joystick('js4', ...grid.cell(0, 2, 1, 1)).scheme('green').opaque().mode(mode);
    gui.joystick('js5', ...grid.cell(2, 2, 1, 1)).scheme('red').opaque().mode(mode);
    gui.joystick('js6', ...grid.cell(4, 2, 1, 1)).scheme('cyan').opaque().mode(mode);
    gui.joystick('js7', ...grid.cell(0, 4, 1, 1)).scheme('yellow').opaque().mode(mode);
    gui.joystick('js8', ...grid.cell(2, 4, 1, 1)).scheme('purple').opaque().mode(mode);
    gui.joystick('js9', ...grid.cell(4, 4, 1, 1)).scheme('orange').opaque().mode(mode);

    js = gui.joystick('js0', 46, 46, 160, 160).mode(mode)
        .setAction((info) => {
            gui.$('lblMag').text(nfs(info.mag, 1, 4));
            gui.$('lblAng').text(nfs(info.angle, 1, 4));
            gui.$('lblDir').text(info.dir);
            gui.$('lblDead').text(info.dead ? 'TRUE' : 'FALSE');
            gui.$('lblFinal').text(info.final ? 'TRUE' : 'FALSE');
        });
}
