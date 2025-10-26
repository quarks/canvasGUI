let mode;
let p5canvas;

function setup() {
    p5canvas = createCanvas(480, 360);
    console.clear();
    p5canvas.parent('sketch');
    changeMode(SPLASH);
}

function draw() {
    background(200);
    push();
    mode?.display();
    pop();
    mode?.gui?.draw();
}

function mouseClicked(event) {
    doEvent(mode, 'mouseClicked', event);
}

function keyTyped(event) {
    doEvent(mode, 'keyTyped', event);
}
