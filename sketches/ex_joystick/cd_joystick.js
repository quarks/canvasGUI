const X = 30, Y = 30, W = 470, H = 340;
let gui, speed = 0, angle = 0, pos;

function setup() {
    let p5canvas = createCanvas(640, 400);
    p5canvas.parent('paper');
    cursor(CROSS);
    pos = createVector(225, 200);
    gui = GUI.get(p5canvas);
    gui.joystick('js0', width - 116, height - 140, 90, 90).opaque()
        .setAction((info) => {
            speed = info.mag * 100 / 1000; // max 100 pixels a second
            angle = info.angle;
        });
}

function draw() {
    push();
    pos.x = (pos.x + speed * deltaTime * cos(angle) + W) % W;
    pos.y = (pos.y + speed * deltaTime * sin(angle) + H) % H;
    background(24, 128, 24);
    translate(X, Y);
    fill(200, 200, 255); stroke(0); strokeWeight(5);
    rect(0, 0, W, H);
    push();
    translate(pos.x, pos.y);
    rotate(angle);
    fill(255, 255, 90); stroke(0); strokeWeight(2);
    triangle(-16, -11, -16, 11, 18, 0);
    pop();
    pop();
    gui.draw();
}


