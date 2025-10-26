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
    gui.label('lblx', 40, py0, 240, 30).scheme('green').textSize(20);
    gui.label('lbly', 40 + width / 2, py0, 240, 30).scheme('green').textSize(20);

    gui.ranger('rgr_e', 120, py1, width - 240, 30).scheme('red')
        .opaque() // make the control background opaque
        .ticks(2, 10, true) // Make major and minor ticks
        .limits(-0.5, 0.5) // Set the min and max permitted value 
        .range(-0.2, 0.3)
        .setAction((info) => { });
    gui.ranger('rgr_s', 60, py1, height - 200, 30).scheme('blue')
        .orient('south')
        .opaque() // make the control background opaque
        .ticks(2, 10) // Make major and minor ticks
        .limits(-0.5, 0.5) // Set the min and max permitted value 
        .range(-0.2, 0.3)
        .setAction((info) => { });
    gui.ranger('rgr_n', 520, py1, height - 200, 30).scheme('green')
        .orient('north')
        .opaque() // make the control background opaque
        .ticks(2, 10) // Make major and minor ticks
        .limits(-0.5, 0.5) // Set the min and max permitted value 
        .range(-0.2, 0.3)
        .setAction((info) => { });
    gui.ranger('rgr_w', 120, py1 + 280, width - 240, 30).scheme('purple')
        .orient('west')
        .opaque() // make the control background opaque
        .ticks(2, 10) // Make major and minor ticks
        .limits(-0.5, 0.5) // Set the min and max permitted value 
        .range(-0.2, 0.3)
        .setAction((info) => { });
}

function draw() {
    push();
    background(200, 220, 220);

    pop();
    gui.draw();

}

function mouseMoved() {
    gui.$('lblx').text('' + round(mouseX));
    gui.$('lbly').text('' + round(mouseY));
}