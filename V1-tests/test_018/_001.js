let gui;
let pupilX = 0;
let r = 255, g = 200, b = 200;
let x0 = 100, x1 = 300;

let py0 = 20, py1 = 100, py2 = 300;

function setup() {
    let p5canvas = createCanvas(600, 480);
    p5canvas.parent('sketch');
    // console.log(p5canvas.canvas.getBoundingClientRect());
    cursor(CROSS);
    // Create the GUI controller for this canvas
    gui = GUI.get(p5canvas).textSize(16);
    gui.label('lblx', 40 + width / 2, py0, 240, 30).scheme('green').textSize(20);
    gui.label('lbly', 40 + width / 2, py0 + 40, 240, 30).scheme('green').textSize(20);
    gui.button('btn1', 50, py0, 160, 32).text('CLICK ME').scheme('blue')
        .tooltip('Clicker')
        .setAction((info) => {
            r = round(random(128, 255));
            g = round(random(128, 255));
            b = round(random(128, 255));
        });
    gui.slider('eyes', 50, py1 + 120, width - 100, 30).scheme('red')
        .tooltip('Eyes')
        .opaque() // make the control background opaque
        .ticks(2, 10) // Make major and minor ticks
        .limits(-0.5, 0.5) // Set the min and max permitted value 
        .setAction((info) => {
            pupilX = info.value;
        }
        );
    gui.ranger('range', 50, py2 + 50, 300, 40)
        .tooltip('Range')
        .limits(60, 340) // Set the min and max permitted values
        .range(x0, x1) // Set initial thumb positions
        .scheme('purple')
        .setAction((info) => {
            x0 = info.low;
            x1 = info.high;
        });
}

function draw() {
    push();
    background(200, 220, 220);
    // Button
    push();
    fill(r, g, b);
    stroke(0);
    rect(width / 2 - 60, py0 + 2, 50, 30);
    pop();

    // Slider
    push();
    translate(0, py1);
    stroke(0); strokeWeight(2);
    for (let i = 0; i < 2; i++) {
        let ex = (0.4 + 0.2 * i) * width;
        fill(255);
        ellipse(ex, 60, 60, 40);
        fill(0);
        ellipse(ex + pupilX * 40, 60, 20, 20)
    }
    fill(200, 40, 60); strokeWeight(1);
    triangle(width / 2, 70, width / 2 - 20, 100, width / 2 + 20, 100);
    pop();

    // Ranger
    push();
    translate(0, py2);
    stroke(0, 140, 0); strokeWeight(2);
    line(x0, 0, x0, 160);
    line(x1, 0, x1, 160);
    noStroke();
    fill('rgba(255,40,40, 0.5)');
    ellipse(x0, 120, 40, 40);
    fill('rgba(40,40,255, 0.5)');
    ellipse(x1, 120, 40, 40);
    pop();

    pop();
    gui.draw();

}

function mouseMoved() {
    gui.$('lblx').text('' + round(mouseX));
    gui.$('lbly').text('' + round(mouseY));
}