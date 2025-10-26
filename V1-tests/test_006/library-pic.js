
function preload() {
    bug = loadImage('data/bug6.png');
}

function setup() {
    let p5canvas = createCanvas(400, 118)
    p5canvas.parent('paper')
    gui = GUI.get(p5canvas);
    // This next instruction MUST be used to initialise the GUI controller
    gui.scheme('blue').textSize(10.5)
    console.log(width, height);
    gui.checkbox("cbxP2D", 4, height / 2 + 8, height / 2 - 10, 16).text("P2D", LEFT).orient('north').select();
    gui.checkbox("cbxWEBGL", 4, 2, height / 2 - 10, 16).text("WEBGL", LEFT).orient('north').select();

    gui.checkbox("cbxGlobal", 60, height - 20, 100, 16).text("Global Mode", LEFT).select();
    gui.checkbox("cbxInstance", 180, height - 20, 100, 16).text("Instance Mode", LEFT).select();

    let clrs = ['red', 'green', 'blue', 'yellow', 'purple', 'cyan', 'orange'];
    for (let i = 0; i < clrs.length - 4; i++) {
        gui.option('clr' + i, width - 150, i * 22 + 6, 56, 13).text(clrs[i]).textSize(11)
    }
    gui.$('clr2').select();
    gui.label('lblCS', width - 24, 14, height - 50, 22).text("Quark", LEFT).orient('south').textSize(16).transparent();
    gui.button("btn1", 308, height - 48, 62, 40).text(['Click', 'Me']).textSize(14).icon(bug, RIGHT)
    gui.slider('sdr1', 50, 4, 200, 22).value(0.41).ticks(3, 10)
    gui.ranger('rgr1', 24, height - 50, 290, 30).range(0.38, 0.77).ticks(10, 5, true)
}

function draw() {
    push();
    background(240);


    pop();
    gui.draw();
}