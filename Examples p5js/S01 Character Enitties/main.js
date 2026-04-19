let gui, entlist;
const sections = [];
let bdrs0 = [], bdrs1 = [];

async function setup() {
    let p5canvas = createCanvas(720, 560);
    p5canvas.parent('sketch');
    cursor(CROSS);
    // Get resources 
    entlist = await loadStrings('./assets/entities.txt');

    // Create the GUI controller for this canvas
    gui = createGUI('my gui', p5canvas);
    ABOUT(gui, "HTML Character Entities in canvasGUI");
    populateGUI(gui);
    changeSection(0);
}

function changeSection(s) {
    sections.forEach(s => s.hide(true));
    sections[s].show(true);
}

function populateGUI(gui) {
    // Change some gui default values
    gui.scheme('red').textSize(20)
    // Now make the entity tables
    makeEnityTables(entlist);
    const grid = gui.grid(20, height - 60, width - 40, 30)
        .size(4, 1).insets(4, 2);
    gui.button('S0', ...grid.cell(0, 0, 1, 1), 'ISO-8859-1')
        .textSize(16)
        .setAction(() => changeSection(0));
    gui.button('S1', ...grid.cell(1, 0, 1, 1), 'Math')
        .textSize(16)
        .setAction(() => changeSection(1));
    gui.button('S2', ...grid.cell(2, 0, 1, 1), 'Greek')
        .textSize(16)
        .setAction(() => changeSection(2));
    gui.button('S3', ...grid.cell(3, 0, 1, 1), 'Miscellaneous')
        .textSize(16)
        .setAction(() => changeSection(3));
}

function makeEnityTables(elist) {
    const gx = 10, gy = 40;
    let grid = gui.grid(gx, gy, width - 2 * gx, 448)
        .cols([80, 20, 80, 20, 80, 20, 80, 20])
        .rows(14)
        .insets(1, 1);
    const [nc, nr] = [grid.nbrCols, grid.nbrRows];
    // Borders
    for (let c = 0; c < nc; c++)
        for (let r = 1; r < nr; r++)
            bdrs0.push(grid.border(c, r, 1, 1));
    bdrs1.push(grid.border(0, 0, nc, 1));
    bdrs1.push(grid.border(0, 1, 2, nr));
    bdrs1.push(grid.border(2, 1, 2, nr));
    bdrs1.push(grid.border(4, 1, 2, nr));
    bdrs1.push(grid.border(6, 1, 2, nr));
    let pinNbr = 0, idNbr = 0, cell = 0, s;
    elist.forEach(e => {
        e = e.trim();
        if (e.startsWith('##')) {
            s = gui.pin(`Pin${pinNbr}`, 0, 0);
            sections.push(s);
            gui.label(`Title${pinNbr}`, ...grid.cell(0, 0, nc, 1))
                .text(e.substring(3).trim())
                .textStyle(BOLD)
                .textSize(20)
                .corners(0)
                .parent(s);
            cell = 0;
            pinNbr++;
        }
        else if (e.length > 0) {
            let key = `&${e.split(/\s*,\s*/)[0]};`;
            let cn = cell % 4, rn = 1 + floor(cell / 4);
            gui.label(`Key${idNbr}`, ...grid.cell(2 * cn, rn, 1, 1), key)
                .textFont('Courier New')
                .transparent()
                .parent(s);
            gui.label(`Ent${idNbr}`, ...grid.cell(2 * cn + 1, rn, 1, 1))
                .text(CHAR_ENTITIES.get(key))
                .transparent()
                .parent(s);
            idNbr++;
            cell++;
        }
    });
}

function draw() {
    background(237);
    noFill(); stroke(0, 48); strokeWeight(0.8);
    bdrs0.forEach(b => rect(b[0], b[1], b[2], b[3]));
    stroke(0); strokeWeight(1.5);
    bdrs1.forEach(b => rect(b[0], b[1], b[2], b[3]));
    gui.draw();
    // Delete or comment out the next line to hide the pick buffer.
    gui.showBuffer();
}

function ABOUT(gui, title) {
    gui.label('about 1', 0, 0, width, 24)
        .scheme('light').corners(0).textSize(16)
        .text(title, 'center', 'center')
        .shrink(0, 24);
    const dpr = Number.isInteger(devicePixelRatio)
        ? devicePixelRatio : Math.round(devicePixelRatio * 100) / 100;
    const mode = (gui.mode === 'JS') ? 'XXX' : VERSION;
    const vstr = `p5js: ${mode}   ##   canvasGUI: ${GUI.VERSION}   `
        + `##   Context: '${gui.contextType}'   ##   DPR: ${dpr}`;
    gui.label('about 2', 0, height - 24, width, 24)
        .scheme('light').corners(0).textSize(13)
        .text(vstr, 'center', 'center');
}
