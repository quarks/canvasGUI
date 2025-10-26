let gui, _icon;

function preload() {
    _icon = loadImage("./images/crab.png");
}

function setup() {
    let p5canvas = createCanvas(380, 350); p5canvas.parent('sketch_b');
    cursor(CROSS);
    // Create the GUI controller for this canvas
    gui = GUI.get(p5canvas);
    gui.textSize(14);
    // The label to configure
    gui.button('crab', 50, 40, 280, 80).text("Ahhh... crab legs\nlegs for dinner!!")
        .textSize(20).icon(_icon).corners([30, 22, 12, 6]);
    // Text alignment options
    gui.label('pickone', 240, 136, 100, 40).text('Control\nOrientation').textSize(15).transparent();

    gui.option('north', 250, 180, 80, 20).text('North', CENTER).group('torient')
        .setAction(function () { orient('north') });
    gui.option('south', 250, 204, 80, 20).text('South', CENTER).group('torient')
        .setAction(function () { orient('south') });
    gui.option('east', 250, 228, 80, 20).text('East', CENTER).group('torient').select()
        .setAction(function () { orient('east') });
    gui.option('west', 250, 252, 80, 20).text('West', CENTER).group('torient')
        .setAction(function () { orient('west') });
}

// Apply any changes
function orient(dir) {
    gui.$('crab').orient(dir)
}

function draw() {
    push();
    background(220, 230, 255);
    stroke(0, 0, 128); strokeWeight(2);
    line(0, 40, width, 40);
    line(50, 0, 50, height);
    fill(0); noStroke();
    textSize(14);
    text('[50, 40]', 56, 32)
    pop();
    gui.draw();
}