let gui, crab;

async function setup() {
    let p5canvas = createCanvas(480, 200);
    p5canvas.parent('sketch');
    cursor(CROSS);
    // Get resources 

    // Create the GUI controller for this canvas
    gui = createGUI('my gui', p5canvas);
    ABOUT(gui, "DESCRIPTION");
    populateGUI(gui);
}

function populateGUI(gui) {
    // Change some gui default values
    gui.scheme('green') // default = 'blue'
        .textSize(20)   // default 12
    // Now make the control(s)
    gui.button('btn0', 10, 50, 100, 25)
        .text('Click me!')
        .textSize(15)
        .scheme('red')
        .setAction((info) => {
            const csn = gui.colorSchemeNames;
            info.source.scheme(csn[floor(random(0, csn.length))]);
        });

    gui.button('btn1', 10, 80, 100, 25)
        .text('Click me!')
        .textSize(15)
        .scheme('red')
        .setAction(csAction);

    gui.button('btn2', 10, 110, 100, 25)
        .text('Click me!')
        .textSize(15)
        .scheme('red')
        .setAction(function (info) {
            const csn = gui.colorSchemeNames;
            info.source.scheme(csn[floor(random(0, csn.length))]);
        });

    gui.button('btn2', 10, 110, 100, 25)
        .text('Click me!')
        .textSize(15)
        .scheme('red')
        .setAction((info) => {
            const csn = gui.colorSchemeNames;
            const btn = info.source;
            const col = csn[floor(random(0, csn.length))];
            const time_ms = Date.now() % 1000;
            csTimedAction(btn, col, time_ms);
        });

    function csTimedAction(button, colScheme, msec) {
        button.scheme(colScheme);
        button.text(`${msec} ms`);
    }

    function csAction(info) {
        const csn = gui.colorSchemeNames;
        info.source.scheme(csn[floor(random(0, csn.length))]);
    }

}

function draw() {
    background(100, 149, 237);

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