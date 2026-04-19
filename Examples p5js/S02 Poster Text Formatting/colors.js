function prepareColorData(data) {
    const icons = [];
    const cn = [];
    data.forEach(c => {
        if (c.length > 0) {
            let pg = createGraphics(120, 60);
            pg.background(c);
            icons.push(pg.get());
            cn.push(c);
        }
    });
    return [icons, cn];
}

function addSchemeSelectors(gui, panel) {
    const grid = gui.grid(45, 26, 240, 125);
    grid.size(3, 5)//.insets(2, 2);
    gui.label('color scheme', ...grid.cell(0, 0, 3, 1))
        .text('POSTER COLOR SCHEME')
        .textStyle(BOLD)
        .parent(panel);
    let n = 0;
    gui.colorSchemeNames.forEach(sn => {
        gui.option(sn, ...grid.cell(n % 3, 1 + floor(n / 3), 1, 1))
            .group('color scheme')
            .parent(panel)
            .scheme(sn)
            .setAction(info => changeScheme(info.source.id));
        n++;
    });
    gui.checkbox('pstr opaque', ...grid.cell(0, 4, 3, 1), 'Opaque')
        .scheme('light').parent(panel)
        .setAction(info => {
            if (info.selected)
                poster.opaque(128);
            else
                poster.transparent();
        })
    gui.$(scheme).select();
}


function addColorSelectors(gui, panel) {
    let grid = gui.grid(45, 184, 240, 50);
    grid.size(2, 2);
    // Column heading text (2 rows)
    gui.label('lbl colors', ...grid.cell(0, 0, 2, 1))
        .text('GLYPH COLORS')
        .textStyle(BOLD)
        .parent(panel);
    gui.label('lbl fill', ...grid.cell(0, 1, 1, 1), 'FILL')
        .textStyle(BOLD).parent(panel);
    gui.label('lbl edge', ...grid.cell(1, 1, 1, 1), 'EDGE')
        .textStyle(BOLD).parent(panel);
    let row = 0; nbrRows = csIcons.length + 2;
    grid = gui.grid(45, grid.y + grid.h, 250, 22 * nbrRows)
        .size(2, nbrRows);
    // Color selectors background
    grid.insets(2, 1);
    gui.poster('fill back', ...grid.cell(0, 0, 1, nbrRows))
        .colors('gainsboro').background(3).corners(8).parent(panel);
    gui.poster('edge back', ...grid.cell(1, 0, 1, nbrRows))
        .colors('gainsboro').background(3).corners(8).parent(panel);
    // Color selector buttons
    grid.insets(24, 4);
    gui.button('gf0', ...grid.cell(0, row, 1, 1), 'NONE').scheme(scheme)
        .textSize(12).textStyle(BOLD).transparent().parent(panel)
        .setAction(info => changeGlyphFill(info.source.id));
    gui.button('gs0', ...grid.cell(1, row, 1, 1), 'NONE').scheme(scheme)
        .textSize(12).textStyle(BOLD).transparent().parent(panel)
        .setAction(info => changeGlyphEdge(info.source.id));
    row++;
    gui.button('gf1', ...grid.cell(0, row, 1, 1), 'SCHEME').scheme(scheme)
        .textSize(12).textStyle(BOLD).parent(panel)
        .setAction(info => changeGlyphFill(info.source.id));
    gui.button('gs1', ...grid.cell(1, row, 1, 1), 'SCHEME').scheme(scheme)
        .textSize(12).textStyle(BOLD).parent(panel)
        .setAction(info => changeGlyphEdge(info.source.id));
    row++;
    let cn = 3;
    csIcons.forEach(csi => {
        let [c, r, w, h] = [...grid.cell(0, row, 1, 1)];
        gui.image(`gf${cn}`, c, r, csi)
            .corners(6)
            .resize(w, h)
            .scheme('light')
            .parent(panel)
            .setAction(info => changeGlyphFill(info.source.id));
        [c, r, w, h] = [...grid.cell(1, row, 1, 1)];
        gui.image(`gs${cn}`, c, r, csi)
            .corners(6)
            .resize(w, h)
            .scheme('light')
            .parent(panel)
            .setAction(info => changeGlyphEdge(info.source.id));
        row++;
        cn++;
    });
    // Edge weight
    grid = gui.grid(45, grid.y + grid.h, 250, 50)
        .size(1, 2);
    gui.label('edge weight', ...grid.cell(0, 0, 1, 1), 'EDGE WEIGHT')
        .textStyle(BOLD).parent(panel);
    gui.slider('sdr edge weight', ...grid.cell(0, 1, 1, 1))
        .scheme('light').opaque()
        .limits(0, 2).value(0.2).ticks(2, 10, true)
        .parent(panel)
        .setAction(info => changeGlyphStrokeWeight(info.value));
}
