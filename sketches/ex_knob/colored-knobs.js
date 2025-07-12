let gui, bdrs = [];
let kb, cx = 110, cy = 180;

function setup() {
    let p5canvas = createCanvas(640, 400);
    p5canvas.parent('paper');
    cursor(CROSS);
    gui = GUI.get(p5canvas);
    gui.scheme('blue').textSize(15);
    // createMainKnob();
    createKnobs();
    // createOutput();

}


function createMainKnob() {
    gui.knob('knb0', 60, 60, 160, 160)
        .turnAngle(320)
        .track(15)
        .ticks(5, 2, true)
        .limits(100, 200)
        .gap(30)
        .value(120)
        .mode('x')
        // .orient('north')
        .setAction((info) => {
            console.log(`Knob ${info.source.name()}  Value: ${info.value}     Final: ${info.final}`)
        });

    gui.knob('knb1', 240, 60, 160, 160)
        .turnAngle(330)
        .track(0)
        .gap(325)
        .mode('y')
        .setAction((info) => {
            // console.log(`Knob ${info.source.name()}  Value: ${info.value}     Final: ${info.final}`)
        });
    gui.knob('knb2', 420, 60, 160, 160)
        .turnAngle(360)
        .limits(150, 250)
        .value(175)
        .track(20)
        .mode('a')
        .gap(330)
        // .orient('north')
        .setAction((info) => {
            console.log(`Knob ${info.source.name()}  Value: ${info.value}     Final: ${info.final}`)
        });




    gui.slider('sdr', 20, 300, 600, 20)
        .limits(100, 200)
        .value(121)
        .ticks(5, 5, true);
}

function draw() {
    push();
    background(230);
    pop();
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

function createKnobs() {
    let jsize = 120, grid = gui.grid(280, 10, jsize * 3, jsize * 4);
    grid.cols([100, 20, 100, 20, 100, 20])
        .rows([100, 20, 100, 20, 100, 20, 100, 20]);
    gui.knob('knob1', ...grid.cell(0, 0, 1, 1)).scheme('dark').opaque()
        .limits(0, 100).value(50).track(20).ticks(10, 2, true).turnAngle(300)
    gui.knob('knob2', ...grid.cell(2, 0, 1, 1)).scheme('light').opaque()
        .limits(0, 100).value(50).track(20).ticks(10, 2, true).turnAngle(300)
    gui.knob('knob3', ...grid.cell(4, 0, 1, 1)).scheme('blue').opaque()
        .limits(0, 100).value(50).track(20).ticks(10, 2, true).turnAngle(300)
    gui.knob('knob4', ...grid.cell(0, 2, 1, 1)).scheme('green').opaque()
        .limits(0, 100).value(50).track(20).ticks(10, 2, true).turnAngle(300)
    gui.knob('knob5', ...grid.cell(2, 2, 1, 1)).scheme('red').opaque()
        .limits(0, 100).value(50).track(20).ticks(10, 2, true).turnAngle(300)
    gui.knob('knob6', ...grid.cell(4, 2, 1, 1)).scheme('cyan').opaque()
        .limits(0, 100).value(50).track(20).ticks(10, 2, true).turnAngle(300)
    gui.knob('knob7', ...grid.cell(0, 4, 1, 1)).scheme('yellow').opaque()
        .limits(0, 100).value(50).track(20).ticks(10, 2, true).turnAngle(300)
    gui.knob('knob8', ...grid.cell(2, 4, 1, 1)).scheme('purple').opaque()
        .limits(0, 100).value(50).track(20).ticks(10, 2, true).turnAngle(300)
    gui.knob('knob9', ...grid.cell(4, 4, 1, 1)).scheme('orange').opaque()
        .limits(0, 100).value(50).track(20).ticks(10, 2, true).turnAngle(300)
    kb = gui.knob('js0', 40, 20, 160, 160)
        .limits(0, 100).value(50).track(20).ticks(10, 2, true).turnAngle(300)
        .setAction((info) => {
            // gui.$('lblX').text(info.X);
            // gui.$('lblY').text(info.Y);
            // gui.$('lblXY').text(info.XY);
            // gui.$('lblMag').text(nfs(info.mag, 1, 4));
            // gui.$('lblAng').text(nfs(info.angle, 1, 4));
            // gui.$('lblDead').text(info.dead ? 'TRUE' : 'FALSE');
            // gui.$('lblFinal').text(info.final ? 'TRUE' : 'FALSE');
        });
}
