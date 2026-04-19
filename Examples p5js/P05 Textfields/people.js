let gui;

function setup() {
    let p5canvas = createCanvas(600, 350);
    p5canvas.parent('sketch');
    // Create the GUI controller for this canvas
    gui = createGUI('gui 1', p5canvas);

    ABOUT(gui, 'Textfields with validation');
    populateGUI(gui);
}

function draw() {
    push();
    background(250, 250, 210);
    pop();
    gui.draw();
    // Delete or comment out the next line to hide the pick buffer.
    gui.showBuffer();
}

function populateGUI(gui) {
    let row = 0;
    gui.scheme('green')
        .textSize(16)
        .corners(6);
    let nbrPeople = 4, nbrRows = nbrPeople + 4;
    let grid = gui.grid(20, 30, width - 40, 280)
        .cols([50, 25, 25])
        .rows(nbrRows);
    gui.label('name', ...grid.cell(0, row, 1, 1))
        .scheme('blue')
        .textSize(18)
        .textStyle(BOLD)
        .text('First & Last names');
    gui.label('age', ...grid.cell(1, row, 1, 1))
        .scheme('blue')
        .textSize(18)
        .textStyle(BOLD)
        .text('Age (years)');
    gui.label('height (m)', ...grid.cell(2, row, 1, 1))
        .scheme('blue')
        .textSize(18)
        .textStyle(BOLD)
        .text('Height (m)');
    row++;
    let linkIdx = 1;
    for (let r = 1; r <= nbrPeople; r++) {
        gui.textfield(`name-${r}`, ...grid.cell(0, row, 1, 1))
            .index(linkIdx++, 3)
            .textSize(16)
            .validation(validateName)
            .setAction((info) => showEventInfo(info));
        gui.textfield(`age-${r}`, ...grid.cell(1, row, 1, 1))
            .index(linkIdx++, 3)
            .validation(validateAge)
            .setAction((info) => showEventInfo(info));
        gui.textfield(`height-${r}`, ...grid.cell(2, row, 1, 1))
            .index(linkIdx++, 3)
            .validation(validateHeight)
            .setAction((info) => showEventInfo(info));
        row++;
    }
    gui.label('v-name', ...grid.cell(0, row, 1, 1))
        .scheme('red')
        .textStyle(BOLDITALIC)
        .text('Requires 2 or more words');
    gui.label('v-age', ...grid.cell(1, row, 1, 1))
        .scheme('red')
        .textStyle(BOLDITALIC)
        .text('0 to 120 years');
    gui.label('v-height (m)', ...grid.cell(2, row, 1, 1))
        .scheme('red')
        .textStyle(BOLDITALIC)
        .text('0.15 to 2.4 m');
    row++;
    gui.label('event time', ...grid.cell(0, row, 3, 1))
        .scheme('purple')
        .textFont('monospace')
        .textStyle(BOLD)
        .text(`Event time  :  ${floor(millis() / 1000)} seconds`, LEFT);
    row++;
    gui.label('event info', ...grid.cell(0, row, 3, 1))
        .scheme('purple')
        .textFont('monospace')
        .textStyle(BOLD)
        .text(`Event info  :  -`, LEFT);
}

function showEventInfo(info) {
    const str = `id: ${info.source.id}    value: "${info.value}"  valid: ${info.valid ? "VALID" : "INVALID"}`;
    gui.$('event info').text(str);
    gui.$('event time').text(`Event time  :  ${floor(millis() / 1000)} seconds`, LEFT);
}

function capitalizeName(str) {
    // Capitilise the first letter of each word
    str = str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
    // Convert Mcdonald to McDonald
    str = str.replace(/\bMc[a-z]*/g, function (txt) {
        return 'Mc' + txt.charAt(2).toUpperCase() + txt.substr(3).toLowerCase();
    });
    return str;
}

function validateName(text) {
    const t = text.trim();
    // Allow empty field
    if (t.length == 0) return [true, ''];
    // If less than 2 names then invalid and leave unchanged
    if (t.indexOf(' ') < 0)
        return [false, text];
    else // Have at least 2 names so capitalize them
        return [true, capitalizeName(text)];
}

function validateAge(text) {
    let t = text.trim();
    // Allow empty field
    if (t.length === 0) return [true, ''];
    let valid = Boolean(t.match(/^\d+$/));
    // If invalid leave unchanged
    if (!valid) return [false, text];
    let age = Number.parseInt(t);
    return [(age >= 0 && age <= 120), age];
}

function validateHeight(text) {
    let t = text.trim();
    // Allow empty field
    if (t.length === 0) return [true, ''];
    let valid = Boolean(t.match(/^\d+\.?\d+$|^\d+$/));
    // If invalid leave unchanged
    if (!valid) return [false, text];
    let height = Number.parseFloat(t);
    return [(height >= 0.15 && height <= 2.4), height];
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