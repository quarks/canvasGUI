let gui, img;

function preload() {
    img = loadImage('./images/magic.jpg');
}

function setup() {
    let p5canvas = createCanvas(550, 550);
    p5canvas.parent('sketch')
    gui = GUI.get(p5canvas);

    gui.viewer('picture', 0, 0, width, height).scaler(0.75, 0.625, 2).layers(img)
}

function draw() {
    push();
    background(190);

    pop();
    gui.draw();
}