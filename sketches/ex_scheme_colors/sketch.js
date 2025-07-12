
function setup() {
    let p5canvas = createCanvas(640, 360);
    p5canvas.parent('paper');

    blue = new BlueScheme();
    green = new GreenScheme();
    red = new RedScheme();
    cyan = new CyanScheme();
    yellow = new YellowScheme();
    purple = new PurpleScheme();
    orange = new OrangeScheme();
    light = new LightScheme();
    dark = new DarkScheme();
    colors = [blue, green, red, cyan, yellow, purple, orange, light, dark];
    greys = [light, dark];
}

function draw() {
    push();
    background(255);
    stroke(0, 112); strokeWeight(1);
    for (let p = 10; p < 3 * height; p += 20) line(0, p, p, 0);
    showColors();
    showGreys();
    showTints();
    showLightTints();
    pop();
    noLoop();
}

function showColors() {
    push();
    translate(30, 30);
    stroke(0); strokeWeight(1);
    colors.forEach(scheme => {
        for (let n = 0; n <= 9; n++) {
            fill(scheme[`C_${n}`]);
            rect(0, n * 30, 40, 30);
        }
        translate(40, 0);
    });
    pop();
    push();
    translate(10, 50);
    textSize(20);
    fill(0);
    for (let n = 0; n <= 9; n++) {
        text(n, 0, 30 * n);
    }
    pop();
}

function showGreys() {
    push();
    stroke(0); strokeWeight(1);
    translate(430, 30);
    greys.forEach(scheme => {
        for (let n = 0; n <= 9; n++) {
            fill(scheme[`G_${n}`]);
            rect(0, n * 30, 40, 30);
        }
        translate(40, 0);
    });
    pop();
    push();
    translate(400, 50);
    textSize(20);
    fill(0);
    for (let n = 0; n <= 9; n++) {
        text(n, 0, 30 * n);
        text(n, 120, 30 * n);
    }
    pop();
}

function showTints() {
    push();
    stroke(0); strokeWeight(1);
    translate(550, 30);
    for (let i = 0; i <= 8; i++) {
        fill(blue['T_' + i]);
        rect(0, i * 30, 40, 30);
    }
    pop();
}

function showLightTints() {
    push();

    translate(590, 30);
    noStroke(); fill(0, 0, 0, 128);
    rect(0, 0, 40, 270)
    stroke(0); strokeWeight(1);
    for (let i = 0; i <= 8; i++) {
        fill(dark['T_' + i]);
        // console.log(dark['T_' + i])
        rect(0, i * 30, 40, 30);
    }
    pop();
}