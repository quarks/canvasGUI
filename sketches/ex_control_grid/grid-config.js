const X = 40, Y = 30, W = 560, H = 160;
const NONE = 0, COL = 1, ROW = 2, CELL = 3;
let gui, bdrs = [], code = [];
let grid, info, cols = [], rows = [];
let px = 0, py = 0, pw = 1, ph = 1, ix = 2, iy = 2;
let c$ = '5', r$ = '4';
let fmt = Intl.NumberFormat('en-UK', {
    style: "decimal", minimumFractionDigits: 0, maximumFractionDigits: 2
}).format;

function setup() {
    p5canvas = createCanvas(W + 2 * X, 800);
    p5canvas.parent('paper');
    console.clear();
    resetInfo();
    gui = GUI.get(p5canvas);
    grid = gui.grid(X, Y, W, H).size(5, 4).insets(ix, iy);
    cols = grid.intPxlCols; rows = grid.intPxlRows;
    makeCode();
    createGUI(gui);
}

function draw() {
    push();
    background(230, 230, 255);
    drawGrid(grid);
    drawCell();
    drawCode();
    pop();
    stroke(0); strokeWeight(1); noFill();
    bdrs.forEach(b => rect(...b));
    gui.draw();
}

function drawGrid() {
    push();
    translate(grid.x, grid.y);
    fill(255); noStroke();
    rect(0, 0, grid.w, grid.h);
    noFill(); stroke(120), strokeWeight(1);
    rows.forEach(v => line(0, v, grid.w, v));
    cols.forEach(v => line(v, 0, v, grid.h));
    noStroke(); fill(0); textSize(14);
    textAlign(CENTER, BOTTOM);
    for (let i = 0; i < cols.length - 1; i++)
        text(i, (cols[i] + cols[i + 1]) / 2, -4);
    textAlign(CENTER, CENTER);
    for (let i = 0; i < rows.length - 1; i++)
        text(i, -8, (rows[i] + rows[i + 1]) / 2);
    pop();
}

function drawCell() {
    push();
    let c = grid.cell(px, py, pw, ph);
    stroke(0, 128, 0); strokeWeight(1.5); fill(90, 255, 90, 160);
    rect(...grid.cell(px, py, pw, ph), 10);
    pop();
}

function drawCode() {
    push();
    textFont('Courier New'); textSize(18); textAlign(LEFT, CENTER);
    let codeY = Y + H + 230, codeW = W - 20, codeH = height - codeY - 20;
    let la = 20, tab = 2 * textWidth(' ');
    translate(X, codeY);
    noStroke(); fill(0); rect(0, 0, W, codeH); fill(0, 255, 0);
    for (let i = 0; i < code.length; i++) {
        let left = 10 + code[i][0] * tab, line = code[i][1];
        line.charAt(0) == '/' ? fill(0, 255, 0) : fill(255, 255, 0);
        text(line, left, 10 + i * la, codeW, la);
    }
    pop();
}

function makeCode() {
    code = [];
    code.push([0, `// Create the 5x4 grid layout shown above`]);
    code.push([0, `gui.grid( ${X}, ${Y}, ${W}, ${H} )`]);
    if (ix != 2 || iy != 2) code.push([1, `.insets( ${ix}, ${iy} )`]);
    code.push([1, `.cols( ${c$} )`]);
    code.push([1, `.rows( ${r$} );`]);
    code.push([0, '']);
    code.push([0, `// Get the position and size (pixels) of the`]);
    code.push([0, `// green area and use this info when creating the`]);
    code.push([0, `// gui control:      x  y  w  h`]);
    code.push([0, `let area = grid.cell(${px}, ${py}, ${pw}, ${ph});`])
    code.push([0, `console.log(...area);`]);
    let [x, y, w, h] = grid.cell(px, py, pw, ph);
    code.push([0, `// Output: ${x} ${y} ${w} ${h} `]);
    code.push([0, '']);
    code.push([0, `// To create a label in this area use`]);
    code.push([0, `gui.label('uid', ...grid.cell(${px}, ${py}, ${pw}, ${ph}))`]);
    code.push([1, `.text('Hello World'};`]);
    code.push([0, `// 'uid' is a unique control identifier`]);
}

function mouseMoved() {
    let mx = mouseX - grid.x, my = mouseY - grid.y;
    if (mx > 0 && mx < grid.w && my > 0 && my < grid.h)
        overGrid(mx, my);
    else {
        resetInfo();
        cursor(ARROW);
    }
}

function mouseDragged() {
    let mx = mouseX - grid.x, my = mouseY - grid.y;
    switch (info.over) {
        case COL:
            cols[info.col] = constrain(mx, info.low, info.high);
            adjustCols()
            break;
        case ROW:
            rows[info.row] = constrain(my, info.low, info.high);
            adjustRows();
            break;
        case CELL:
            [info.cellx, info.celly] = getCellPosition(mx, my);
            pw = info.cellx - px + 1; ph = info.celly - py + 1;
            validateCellInfo();
            makeCode();
            break;
    }
}

function mousePressed() {
    if (info.over == CELL) {
        [px, py] = [info.cellx, info.celly];
        pw = ph = 1;
    }
}

function mouseReleased() {
    resetInfo();
}

function resetCols() {
    grid.cols(5);
    cols = grid.intPxlCols;
}

function resetRows() {
    grid.rows(4);
    rows = grid.intPxlRows;
}

function adjustCols() {
    let array = [];
    for (let i = 1; i < cols.length; i++)
        array.push(cols[i] - cols[i - 1]);
    grid.cols(array);
    cols = grid.intPxlCols;
    c$ = arrayToString(grid.normCols);
    makeCode();
}

function adjustRows() {
    let array = [];
    for (let i = 1; i < rows.length; i++)
        array.push(rows[i] - rows[i - 1]);
    grid.rows(array);
    rows = grid.intPxlRows;
    r$ = arrayToString(grid.normRows);
    makeCode();
}

function arrayToString(a) {
    let s = '[';
    for (let i = 1, n = a.length - 1; i <= n; i++) {
        let v = fmt(100 * (a[i] - a[i - 1]));
        s += i == n ? v : v + ', ';
    }
    s += ']';
    return s;
}

function getCellPosition(mx, my) {
    let col = 0, row = 0;
    for (let i = 0; i < cols.length - 1; i++)
        if (mx > cols[i]) col = i; else break;
    for (let i = 0; i < rows.length - 1; i++)
        if (my > rows[i]) row = i; else break;
    return [col, row];
}

function overGrid(mx, my) {
    resetInfo();
    // Check column boundaries
    for (let i = 1; i < cols.length - 1; i++)
        if (abs(mx - cols[i]) <= 2) {
            info.col = i; info.over = COL;
            info.low = cols[i - 1] + 30; info.high = cols[i + 1] - 30;
            cursor('csr-xx.png', 13, 13);
            return;
        }
    // Check row boundaries
    for (let i = 1; i < rows.length - 1; i++)
        if (abs(my - rows[i]) <= 2) {
            info.row = i; info.over = ROW;
            info.low = rows[i - 1] + 20; info.high = rows[i + 1] - 20; .00
            cursor('csr-yy.png', 13, 13);
            return;
        }
    // If not over a boundary it must be in a cell
    [info.cellx, info.celly] = getCellPosition(mx, my);
    info.over = CELL;
    cursor(HAND);
}

function resetInfo() {
    info = { col: 0, row: 0, over: NONE, low: 0, high: 0, cellx: 0, celly: 0 };
}

function validateCellInfo() {
    px = constrain(px, 0, cols.length - 2);
    py = constrain(py, 0, rows.length - 2);
    pw = constrain(pw, 1, cols.length - px - 1);
    ph = constrain(ph, 1, rows.length - py - 1);
}

function createGUI(gui) {
    gui.scheme('blue').textSize(16);
    let gd = gui.grid(X, 1.5 * Y + H, W, 200).insets(4, 3)
        .cols(12).rows([25, 50, 25, 25, 25, 25]);
    gui.label('H0', ...gd.cell(0, 0, 12, 1)).text('GRID LAYOUT');
    bdrs.push(gd.border(0, 0, 12, 1));
    // Instructions
    let s = "Drag the column and row boudaries to change cell sizes.\nDrag over the cells to select a grid area.";
    gui.label('L0', ...gd.cell(0, 1, 12, 1)).scheme('green').text(s);
    bdrs.push(gd.border(0, 1, 12, 1));
    // Insets
    gui.label('L1', ...gd.cell(0, 2, 8, 1)).text('Insets');
    gui.label('L2', ...gd.cell(0, 3, 2, 1)).text('Horz');
    gui.label('hinset', ...gd.cell(6, 3, 2, 1)).scheme('orange')
        .opaque().text('2');
    gui.slider('sdrHinset', ...gd.cell(2, 3, 4, 1)).scheme('orange')
        .opaque().limits(0, 10).value(2).ticks(10, 0, true)
        .setAction(info => {
            ix = info.value; gui.$('hinset').text(ix); grid.insets(ix, iy);
            makeCode();
        });
    gui.label('L3', ...gd.cell(0, 4, 2, 1)).text('Vert');
    gui.label('vinset', ...gd.cell(6, 4, 2, 1)).scheme('orange')
        .opaque().text('2');
    gui.slider('sdrVI', ...gd.cell(2, 4, 4, 1)).scheme('orange')
        .opaque().limits(0, 7).value(2).ticks(7, 0, true)
        .setAction(info => {
            iy = info.value; gui.$('vinset').text(iy); grid.insets(ix, iy);
            makeCode();
        });
    gui.button('btnInsets', ...gd.cell(0, 6, 8, 1)).scheme('red')
        .text('Reset Indents')
        .setAction(info => {
            ix = iy = 2;
            gui.$('hinset').text(ix); gui.$('sdrHinset').value(ix);
            gui.$('vinset').text(iy); gui.$('sdrVI').value(iy);
            grid.insets(ix, iy);
            makeCode();
        });
    bdrs.push(gd.border(0, 2, 8, 4));
    // Reset buttons for layout
    gui.label('L4', ...gd.cell(8, 2, 4, 1)).text('Layout');
    gui.button('btnCols', ...gd.cell(8, 3, 4, 1)).scheme('red')
        .text('Reset Columns')
        .setAction(info => {
            grid.cols(5); cols = grid.intPxlCols; c$ = '5';
            makeCode();
        });
    gui.button('btnRows', ...gd.cell(8, 4, 4, 1)).scheme('red')
        .text('Reset Rows')
        .setAction(info => {
            grid.rows(4); rows = grid.intPxlRows; r$ = '4';
            makeCode();

        });
    gui.button('btnLayout', ...gd.cell(8, 5, 4, 1)).scheme('red')
        .text('Reset Layout')
        .setAction(info => {
            grid.cols(5); cols = grid.intPxlCols; c$ = '5';
            grid.rows(4); rows = grid.intPxlRows; r$ = '4';
            makeCode();
        });

    bdrs.push(gd.border(8, 2, 4, 4));
}