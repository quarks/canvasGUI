function createPaper(w, h) {
    const pg = createGraphics(w, h);
    pg.background(128, 128, 200);
    pg.noStroke();
    pg.fill(212, 212, 255);
    pg.rect(0, 10, w, h - 20);
    return pg;
}

function createGraph(w, h) {
    const pg = createGraphics(w, h);
    pg.image(paper, 0, 0);
    return pg;
}

function getStatusColors() {
    return new Map([
        [CvsTimer.IDLE, 'black'],
        [CvsTimer.INITIATED, 'orange'],
        [CvsTimer.TICKING, 'lightgreen'],
        [CvsTimer.PAUSED, 'green'],
        [CvsTimer.FINISHED, 'rgb(255 255 60)'],
        ['A0', 'rgb(218, 0, 0)'],
        ['A1', 'rgb(255 255 255)'],
    ]);
}

function createIcons() {
    const icons = [];
    let pg = createGraphics(30, 20);
    pg.pixelDensity(1);
    pg.clear();
    pg.noFill();
    pg.strokeWeight(1)
    pg.stroke(0, 0, 160);
    pg.rect(0, 6, 30, 14);
    pg.noStroke();
    pg.fill(0, 0, 160);
    pg.rect(0, 6, 18, 14);
    icons['bar'] = pg.get();

    pg = createGraphics(30, 20);
    pg.pixelDensity(1);
    pg.clear();
    pg.strokeWeight(1)
    pg.stroke(0, 0, 160);
    pg.noFill();
    pg.ellipse(14.5, 9.5, 18, 18);
    pg.noStroke();
    pg.fill(0, 0, 160);
    pg.arc(14.5, 9.5, 18, 18, 1.5 * PI, 2.7 * PI, PIE);
    icons['round'] = pg.get();

    pg = createGraphics(30, 20);
    pg.pixelDensity(1);
    pg.clear();
    pg.fill(0, 0, 160);
    pg.noStroke();
    pg.triangle(2, 18, 28, 18, 28, 2);
    icons['forward'] = pg.get();

    pg = createGraphics(30, 20);
    pg.pixelDensity(1);
    pg.clear();
    pg.fill(0, 0, 160);
    pg.noStroke();
    pg.triangle(2, 18, 28, 18, 2, 2);
    icons['reverse'] = pg.get();
    return icons;
}

function populateGUI(gui) {
    gui.scheme('blue').textSize(16);

    const tx = width / 2, ty = (PY + paper.height + 30) / 2;
    timers['round'] = gui.timer('tmr round', tx - 50, ty - 35, 100, 100)
        .setAction(timeout);
    timers['bar'] = gui.timer('tmr bar', tx - 150, ty - 15, 300, 30)
        .setAction(timeout);

    // Timer status indicator on graph
    gui.label('status', 70, 50, 200, 30).textAlign(LEFT, CENTER).transparent();

    // Timeout warning message
    gui.label('timeout', 10, 160, width - 20, 30).scheme('red').textSize(22)
        .hide();

    const icons = createIcons();
    const nbrFmt = { textFont: 'monospace', textStyle: BOLD, textSize: 18 };
    let fmt = { scheme: 'green', opaque: undefined };

    // Timer duration controls
    let grid = gui.grid(10, PY + 10, 440, 90);
    grid.size([25, 15, 60], 3);
    gui.label('label1', ...grid.cell(0, 0, 1, 1), 'Duration').format(fmt);
    gui.label('duration', ...grid.cell(1, 0, 1, 1), duration)
        .format(nbrFmt, fmt);
    gui.slider('sdr duration', ...grid.cell(2, 0, 1, 1)).format(fmt)
        .limits(1000, 8000).ticks(7, 5, true).value(duration)
        .setAction(info => {
            duration = info.value;
            gui.$('duration').text(duration);
        });

    // Lead time controls
    fmt.scheme = 'orange';
    gui.label('label2', ...grid.cell(0, 1, 1, 1), 'Lead time').format(fmt);
    gui.label('lead time', ...grid.cell(1, 1, 1, 1), leadTime)
        .format(nbrFmt, fmt);
    gui.slider('sdr lead time', ...grid.cell(2, 1, 1, 1)).format(fmt)
        .limits(0, 2000).ticks(2, 10, true).value(leadTime)
        .setAction(info => {
            leadTime = info.value;
            gui.$('lead time').text(leadTime);
        });

    // Lag time controls
    fmt.scheme = 'yellow';
    gui.label('label3', ...grid.cell(0, 2, 1, 1), 'Lag time').format(fmt);
    gui.label('lag time', ...grid.cell(1, 2, 1, 1), lagTime)
        .format(nbrFmt, fmt);
    gui.slider('sdr tail time', ...grid.cell(2, 2, 1, 1)).format(fmt)
        .limits(0, 2000).ticks(2, 10, true).value(lagTime)
        .setAction(info => {
            lagTime = info.value;
            gui.$('lag time').text(lagTime);
        });

    // Scheme colour selectors
    grid = gui.grid(460, PY + 10, 252, 90);
    grid.size(3, 3);
    let i = 0;
    fmt = {
        textSize: 12, textStyle: BOLD, iconAlign: RIGHT, group: 'timer colors',
        setAction: (info) => scheme = info.source.id
    }
    gui.colorSchemeNames.forEach(scheme => {
        gui.option(scheme, ...grid.cell(i % 3, floor(i / 3), 1, 1), scheme)
            .scheme(scheme)
            .format(fmt)
        i++;
    });
    gui.$(scheme).select();

    // SHAPE selection controls
    grid = gui.grid(10, 430, 140, 60);
    grid.size(2, [35, 25]);
    fmt = { scheme: 'cyan', textSize: 14, textStyle: BOLD, }
    gui.label('shape', ...grid.cell(0, 0, 2, 1), 'SHAPE').format(fmt)
        .icon(icons['bar'], LEFT, CENTER);
    gui.button('bar', ...grid.cell(0, 1, 1, 1), 'Bar').format(fmt)
        .setAction((info) => changeShape('bar', icons['bar']))
    gui.button('round', ...grid.cell(1, 1, 1, 1), 'Round').format(fmt)
        .setAction((info) => changeShape('round', icons['round']))

    // DIRECTION selection controls
    grid = gui.grid(160, 430, 160, 60);
    grid.size(2, [35, 25]);
    gui.label('direction', ...grid.cell(0, 0, 2, 1), 'DIRECTION').format(fmt)
        .icon(icons['forward'], LEFT, CENTER);
    gui.button('forward', ...grid.cell(0, 1, 1, 1), 'forward').format(fmt)
        .setAction((info) => changeDirection('forward', icons['forward']));
    gui.button('reverse', ...grid.cell(1, 1, 1, 1), 'reverse').format(fmt)
        .setAction((info) => changeDirection('reverse', icons['reverse']))

    // UI RESPONSE selection controls
    fmt = {
        scheme: 'cyan', textSize: 14, textStyle: BOLD, group: 'ui responses',
        setAction: (info) => uia = info.source.id,
    }
    grid = gui.grid(330, 430, 280, 60);
    grid.size(3, [35, 25]);
    gui.label('ui respond', ...grid.cell(0, 0, 3, 1), 'UI RESPONSE').format(fmt);
    gui.option('ignore', ...grid.cell(0, 1, 1, 1), 'ignore').format(fmt);
    gui.option('pause', ...grid.cell(1, 1, 1, 1), 'pause').format(fmt);
    gui.option('cancel', ...grid.cell(2, 1, 1, 1), 'cancel').format(fmt);
    gui.$(uia).select();

    // Initiate timer control
    gui.button('start timer', 620, 431, 90, 58, 'START\nTIMER')
        .textStyle(BOLD).corners(8).scheme('red')
        .setAction(startTimer)
}

function changeDirection(direction, icon) {
    gui.$('direction').icon(icon);
    console.log(direction)
    nextDir = direction;
}

function changeShape(nextShape, icon) {
    gui.$('shape').icon(icon);
    shape = nextShape;
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
