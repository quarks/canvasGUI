const X = 10, Y = 10, W = 450, H = 300;
let gui;
let speed = 0, angle = 0, s = 20, pos = { x: W / 2, y: H / 2 };
let holes, exitHole = -1;

function setup() {
    let p5canvas = createCanvas(640, 400);
    p5canvas.parent('sketch');
    cursor(CROSS);
    makeHoles(7);
    createGUI(p5canvas);
}

function createGUI(p5canvas) {
    gui = GUI.get(p5canvas);
    gui.joystick('js0', X + W + 10, Y + H - 120, 120, 120).scheme('blue')
        .setAction((info) => {
            angle = info.angle;
            speed = info.final ? 0 : info.mag * 100 / 1000;
        });
    gui.label('title', X, Y + H + 20, W, 40).corners([10, 10, 10, 10]).scheme('dark')
        .textSize(26).text('Space Travel using Wormholes')
}


function makeHoles(n) {
    holes = [];
    let cx = 0.5 * W, cy = 0.5 * H, rx = 0.5 * W - s, ry = 0.5 * H - s;
    let da = 2 * PI / n, sa = random(0, PI);
    for (let i = 0; i < n; i++) {
        let a = sa + i * da;
        px = cx + rx * cos(a) * random(0.4, 1);
        py = cy + ry * sin(a) * random(0.4, 1);
        holes.push({ x: px, y: py });
    }
}



function draw() {
    background(24, 160, 160);
    push();
    translate(X, Y);
    updateShip(deltaTime);
    drawSpace();
    drawHoles();
    drawShip();
    pop();
    gui.draw();
}

function drawSpace() {
    push();
    fill(0); stroke(192); strokeWeight(5);
    rect(0, 0, W, H);
    pop();
}

function drawHoles() {
    push();
    stroke(140, 160, 0); strokeWeight(3); fill(60);
    holes.forEach(h => ellipse(h.x, h.y, s, s));
    pop();
}

function drawShip() {
    push();
    translate(pos.x, pos.y); rotate(angle);
    fill(220, 64, 64); noStroke();
    triangle(-s * 0.5, -s * 0.3, -s * 0.5, s * 0.3, s * 0.5, 0);
    pop();
}

function updateShip(dt) {
    pos.x = (pos.x + speed * dt * cos(angle) + W) % W;
    pos.y = (pos.y + speed * dt * sin(angle) + H) % H;
    for (let i = 0, n = holes.length; i < n; i++) {
        if (exitHole != i) { // Ignore the hole last exited
            let dx = pos.x - holes[i].x, dy = pos.y - holes[i].y;
            let d = sqrt(dx * dx + dy * dy), to;
            if (d < s / 2) {
                do { exitHole = floor(random(0, n)); } while (exitHole == i);
                pos.x = holes[exitHole].x; pos.y = holes[exitHole].y;
                break;
            }
        }
    }
}