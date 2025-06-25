let p5canvas;
let gui, bdrs = [];


function setup() {
    p5canvas = createCanvas(640, 500);
    p5canvas.parent('paper');
    createGUI();


}

function draw() {
    push();
    background(230);

    pop();
    noFill(); stroke(0); strokeWeight(1);
    bdrs.forEach(b => rect(...b));
    gui.draw();
}

function createGUI() {
    let ctls = [
        [0, 0, 2, 1],
        [1, 1, 1, 2],
    ]
    gui = GUI.get(p5canvas);
    gui.scheme('blue').textSize(12);
    let nc = [100, 150, 125, 90];
    let nr = 4;
    let grid = gui.grid(20, 20, 600, 120)
        .size(nc, nr);

    for (let r = 0; r < grid.nbrRows; r++)
        for (let c = 0; c < grid.nbrCols; c++)
            bdrs.push(grid.border(c, r, 1, 1));

    ctls.forEach(l => {
        let s = `${l[0]}-${l[1]}-${l[2]}-${l[3]}`
        gui.label(`lbl${s}`, ...grid.cell(...l)).text(s);
    })
    console.log(`Grid size  ${grid.nbrCols}  columns    ${grid.nbrRows} rows`);

}