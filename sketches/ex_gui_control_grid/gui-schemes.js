let p5canvas;
let gui, bdrs = [];
let img;

function preload() {
    img = loadImage('handy.jpg');
}
function setup() {
    p5canvas = createCanvas(680, 1000);
    p5canvas.parent('paper');
    makeGUI();
}

function draw() {
    push();
    background(230);
    noStroke(); fill(0); rect(0, 0, 340, 200)
    pop();
    noFill(); stroke(0); strokeWeight(1);
    bdrs.forEach(b => rect(...b));
    gui.draw();
}

function makeGUI() {
    gui = GUI.get(p5canvas);
    gui.textSize(14)
    let grid = gui.grid(0, 0, 320, 180).size(4, 6);
    let uis = [
        [10, 10, 'dark'],
        [340, 10, 'light'],
        [10, 210, 'blue'],
        [340, 210, 'green'],
        [10, 410, 'red'],
        [340, 410, 'cyan'],
        [10, 610, 'yellow'],
        [340, 610, 'purple'],
        [10, 810, 'orange'],
    ];

    uis.forEach(ui => {
        grid.xy(ui[0], ui[1]);
        makeSchemeGUI(ui[2], grid);
    });
}

function makeSchemeGUI(cs, grid) {
    let n = 0;
    gui.label(`${cs}${n++}`, ...grid.cell(0, 0, 4, 1)).scheme(cs)
        .text(`Color scheme '${cs}'`);
    gui.slider(`${cs}${n++}`, ...grid.cell(0, 1, 2, 1)).scheme(cs)
        .limits(0, 100).value(50).ticks(5, 2).opaque();
    gui.ranger(`${cs}${n++}`, ...grid.cell(2, 1, 2, 1)).scheme(cs)
        .limits(0, 100).range(20, 60).ticks(5, 2);
    gui.textfield(`${cs}${n++}`, ...grid.cell(0, 2, 4, 1)).scheme(cs)
        .text("Peter Lager").validation(validateText);
    gui.label(`${cs}${n++}`, ...grid.cell(0, 3, 1, 1)).scheme(cs)
        .text(`Quark`).transparent();
    gui.option(`${cs}${n++}`, ...grid.cell(0, 4, 1, 1)).scheme(cs)
        .text(`Opt 1`).group(`${cs}options`);
    gui.option(`${cs}${n++}`, ...grid.cell(0, 5, 1, 1)).scheme(cs)
        .text(`Opt 2`).group(`${cs}options`).transparent().select();
    gui.button(`${cs}${n++}`, ...grid.cell(1, 3, 1, 1)).scheme(cs)
        .text(`Click me`).tooltip('My button tip');
    gui.checkbox(`${cs}${n++}`, ...grid.cell(1, 4, 1, 1)).scheme(cs)
        .text(`Switch`);
    gui.viewer(`${cs}${n++}`, ...grid.cell(2, 3, 2, 3)).scheme(cs, true)
        .layers(img);
    bdrs.push(grid.border(0, 0, grid.nbrCols, grid.nbrRows));
}

function validateText(str) {
    return [str.length > 8];
}