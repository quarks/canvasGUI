let gui;

function setup() {
    let p5canvas = createCanvas(600, 480, WEBGL);
    p5canvas.parent('sketch');
    cursor(CROSS);

    // Create the GUI controller for this canvas
    gui = createGUI('gui 1', p5canvas);

    ABOUT(gui, 'Sliders and Rangers')
    populateGUI(gui);
}

function draw() {
    push();
    background(160, 208, 160);
    pop();
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


function populateGUI(gui) {
    gui.textSize(14).scheme('blue');
    let grid = gui.grid(20, 30, width - 40, 420);
    grid.cols([20, 80, 20]).rows(7).insets(2, 4);
    let row = 0;
    // Grid title row
    gui.label('title', ...grid.cell(0, row, 3, 1))
        .scheme('dark')
        .text('Sliders and Rangers')
        .textSize(24);
    row++;
    // Slider 1 row
    gui.slider('sdr1', ...grid.cell(1, row, 1, 1))
        .limits(0, 100)
        .value(23)
        .opaque()
        .setAction((info) => {
            gui.$('sdr1v').text(nfs(info.value, 0, 2));
        })
    gui.label('sdr1v', ...grid.cell(2, row, 1, 1)).text(gui.$('sdr1').value());
    row++;
    // Slider 2 row
    gui.slider('sdr2', ...grid.cell(1, row, 1, 1))
        .limits(0, 100)
        .value(64)
        .ticks(2, 5)
        .opaque()
        .weight(11)
        .setAction((info) => {
            gui.$('sdr2v').text(nfs(info.value, 0, 2));
        })
    gui.label('sdr2v', ...grid.cell(2, row, 1, 1)).text(gui.$('sdr2').value());
    row++;
    // Slider 3 row
    gui.slider('sdr3', ...grid.cell(1, row, 1, 1))
        .limits(0, 100)
        .value(80)
        .ticks(10, 2, true)
        .scheme('red')
        .opaque()
        .weight(14)
        .setAction((info) => {
            gui.$('sdr3v').text(nfs(info.value, 0, 0));
        });
    gui.label('sdr3v', ...grid.cell(2, row, 1, 1)).scheme('red')
        .text(gui.$('sdr3').value());
    row++;
    // Ranger 1 row
    gui.ranger('rgr1', ...grid.cell(1, row, 1, 1)).limits(0, 100).range(22, 60)
        .opaque()
        .weight(14)
        .setAction((info) => {
            gui.$('rgr1high').text(nfs(info.high, 0, 2));
            gui.$('rgr1low').text(nfs(info.low, 0, 2));
        })
    gui.label('rgr1low', ...grid.cell(0, row, 1, 1)).text(gui.$('rgr1').low());
    gui.label('rgr1high', ...grid.cell(2, row, 1, 1)).text(gui.$('rgr1').high());
    row++;
    // Ranger 2 row
    gui.ranger('rgr2', ...grid.cell(1, row, 1, 1))
        .limits(0, 100)
        .range(40, 77)
        .ticks(5, 5)
        .tooltip('Ranger 1')
        .opaque()
        .weight(11)
        .setAction((info) => {
            gui.$('rgr2high').text(nfs(info.high, 0, 2));
            gui.$('rgr2low').text(nfs(info.low, 0, 2));
        })
    gui.label('rgr2low', ...grid.cell(0, row, 1, 1))
        .text(gui.$('rgr2').low());
    gui.label('rgr2high', ...grid.cell(2, row, 1, 1))
        .text(gui.$('rgr2').high());
    row++;
    // Ranger 3 row
    gui.ranger('rgr3', ...grid.cell(1, row, 1, 1)).scheme('red')
        .limits(0, 100)
        .range(30, 90)
        .ticks(10, 2, true)
        .opaque()
        .setAction((info) => {
            gui.$('rgr3high').text(nfs(info.high, 0, 0));
            gui.$('rgr3low').text(nfs(info.low, 0, 0));
        })
    gui.label('rgr3low', ...grid.cell(0, row, 1, 1)).scheme('red')
        .text(gui.$('rgr3').low());
    gui.label('rgr3high', ...grid.cell(2, row, 1, 1)).scheme('red')
        .text(gui.$('rgr3').high());
}
