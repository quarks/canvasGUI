
function setup() {
    let p5canvas = createCanvas(800, 500);
    p5canvas.parent('paper');
    gui = GUI.get(p5canvas);
    // This next instruction MUST be used to initialise the GUI controller
    gui.scheme('blue').textSize(30);
    createGUI();
}

function createGUI() {
    let ctrl = gui.button('btn1', 20, 40, 150, 46).text('Button');
    ctrl.scheme('blue');
    ctrl = gui.label('lbl1', 20, 100, 150, 46).text('Label');
    ctrl.scheme('cyan');
    ctrl = gui.checkbox('cbx1', 20, 160, 150, 46).text('Check');
    ctrl.select().scheme('green')
    ctrl = gui.option('opt1', 20, 220, 150, 46).text('Option');
    ctrl.select().scheme('purple');
    ctrl = gui.textfield('txf1', 20, 280, 150, 46).text('Text field');
    ctrl.scheme('red')
    ctrl = gui.slider('sdr1', 420, 40, 200, 46).limits(0, 100).value(70).ticks(5, 2, true);
    ctrl.scheme('yellow')
    ctrl = gui.ranger('rng1', 420, 100, 200, 46).limits(0, 100).range(30, 80).ticks(10, 0, true);
    ctrl.scheme('purple')
}
function draw() {
    push();
    background(0);
    noStroke();
    fill(255);
    rect(width / 2, 0, width / 2, height);
    pop();
    gui.draw();
}