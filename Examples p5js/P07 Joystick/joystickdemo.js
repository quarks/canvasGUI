let gui, bdrs = [];

function setup() {
    const p5canvas = createCanvas(640, 500);
    cursor(CROSS);
    is3d = p5canvas.GL;
    console.log(`Version ${VERSION}   using ${is3d ? 'WEBGL' : 'P2D'}`);
    // Create the GUI controller for this canvas
    gui = createGUI('joystick gui', p5canvas);
    gui.textSize(15)
        .corners(6);

    ABOUT(gui, "Joysticks : modes and attributes");
    populateGuiJoysticks(gui);
    populateGuiData(gui);
}

function draw() {
    push();
    background(230);
    fill(220); noStroke();
    rect(0, 0, 240, height);
    pop();
    stroke(0); strokeWeight(1); noFill();
    bdrs.forEach(b => rect(...b));
    gui.draw();
    // Delete or comment out the next line to hide the pick buffer.
    gui.showBuffer();
}

function populateGuiData(gui) {
    let r = 0;
    let grid = gui.grid(10, 250, 220, 216);
    grid.cols([60, 40]).rows(8);
    gui.label('lbl0', ...grid.cell(0, r, 1, 3))
        .opaque()
        .text('Mode');
    gui.option('mode x0', ...grid.cell(1, r, 1, 1))
        .scheme('light')
        .text('X0')
        .group('mode')
        .iconAlign(RIGHT)
        .setAction(() => setMode('X0'));
    gui.option('mode x4', ...grid.cell(1, r + 1, 1, 1))
        .scheme('light')
        .text('X4')
        .group('mode')
        .iconAlign(RIGHT)
        .setAction(() => setMode('X4'));
    gui.option('mode x8', ...grid.cell(1, r + 2, 1, 1))
        .scheme('light')
        .text('X8')
        .group('mode')
        .iconAlign(RIGHT)
        .select()
        .setAction(() => setMode('X8'));
    bdrs.push(grid.border(0, 0, 2, 3));
    r = 3;
    gui.label('lbl1', ...grid.cell(0, r, 1, 1))
        .opaque()
        .text('Magnitude');
    gui.label('lblMag', ...grid.cell(1, r, 1, 1))
        .transparent()
        .text('0');
    bdrs.push(grid.border(0, r, 2, 1));
    r++;
    gui.label('lbl2', ...grid.cell(0, r, 1, 1))
        .opaque()
        .text('Angle');
    gui.label('lblAng', ...grid.cell(1, r, 1, 1))
        .transparent()
        .text('1');
    bdrs.push(grid.border(0, r, 2, 1));
    r++;
    gui.label('lbl3', ...grid.cell(0, r, 1, 1))
        .opaque()
        .text('Direction');
    gui.label('lblDir', ...grid.cell(1, r, 1, 1))
        .transparent()
        .text('-1');
    bdrs.push(grid.border(0, r, 2, 1));
    r++;
    gui.label('lbl4', ...grid.cell(0, r, 1, 1))
        .opaque()
        .text('In Dead Zone?');
    gui.label('lblDead', ...grid.cell(1, r, 1, 1))
        .transparent()
        .text('TRUE');
    bdrs.push(grid.border(0, r, 2, 1));
    r++;
    gui.label('lbl5', ...grid.cell(0, r, 1, 1))
        .opaque()
        .text('Final value?');
    gui.label('lblFinal', ...grid.cell(1, r, 1, 1))
        .transparent()
        .text('TRUE');
    bdrs.push(grid.border(0, r, 2, 1));
}

function populateGuiJoysticks(gui) {
    grid = gui.grid(254, 60, 372, 496);
    grid.size([100, 100, 100], [100, 100, 100, 100])
        .insets(5, 5);
    const cs = gui.colorSchemeNames;
    for (let i = 0; i < 9; i++) {
        gui.joystick(`js${i + 1}`, ...grid.cell(i % 3, floor(i / 3), 1, 1))
            .scheme(cs[i]).opaque();
    }

    gui.joystick('js0', 20, 36, 200, 200)
        .opaque()
        .corners(12)
        .setAction((info) => {
            gui.$('lblMag').text(nfs(info.mag, 1, 4));
            gui.$('lblAng').text(nfs(info.angle, 1, 4));
            gui.$('lblDir').text(info.dir);
            gui.$('lblDead').text(info.dead ? 'TRUE' : 'FALSE');
            gui.$('lblFinal').text(info.final ? 'TRUE' : 'FALSE');
        });
    setMode('X8');
}

function setMode(mode) {
    for (let i = 0; i <= 9; i++) {
        gui.$(`js${i}`).mode(mode);
    }
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
