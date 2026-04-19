
function addAlignSelectors(gui, panel, data) {
    const grid = gui.grid(40, 30, 240, 225);
    grid.size(2, 9).insets(1, 1);
    gui.label('txtAlign', ...grid.cell(0, 0, 2, 1))
        .text('ALIGNMENT')
        .textStyle(BOLD)
        .parent(panel);
    data.forEach(item => {
        const d = item.trim().split(/\s*,\s*/);
        const [id, r, c, align] = [d[0], Number(d[1]), Number(d[2]), d[3]];
        gui.option(id, ...grid.cell(c, r, 1, 1))
            .text(align)
            .group('align')
            .scheme('light')
            .parent(panel)
            .setAction(info => changeAlign(info.source.id));
    });
    gui.$(align).select();

    grid.cols([80, 20])
    gui.label('lblGap', ...grid.cell(0, 3, 1, 1))
        .textSize(13)
        .textStyle(BOLD)
        .text('PARAGRAPH SPACING')
        .parent(panel);
    gui.label('gap', ...grid.cell(1, 3, 1, 1))
        .scheme('light')
        .textSize(13)
        .parent(panel);
    gui.slider('sdrGap', ...grid.cell(0, 4, 2, 1))
        .scheme('light')
        .limits(0, 30)
        .ticks(3, 5, true)
        .weight(4)
        .opaque()
        .parent(panel)
        .setAction(info => changeGap(info.value));
    gui.$('sdrGap').value(gap);
    gui.$('gap').text(`${gap}`);

    gui.label('lblLeading', ...grid.cell(0, 5, 1, 1))
        .textSize(13)
        .textStyle(BOLD)
        .text('LINE SPACING')
        .parent(panel);
    gui.label('leading', ...grid.cell(1, 5, 1, 1))
        .scheme('light')
        .textSize(13)
        .parent(panel);
    gui.slider('sdrLeading', ...grid.cell(0, 6, 2, 1))
        .scheme('light')
        .limits(0, 20)
        .ticks(4, 5, true)
        .weight(4)
        .opaque()
        .parent(panel)
        .setAction(info => changeLeading(info.value));
    gui.$('sdrLeading').value(leading);
    gui.$('leading').text(`${leading}`);

    gui.label('lblInsets', ...grid.cell(0, 7, 2, 1))
        .textSize(13)
        .textStyle(BOLD)
        .text('LINE INSET AND WIDTH')
        .parent(panel);

    gui.ranger('rngInsets', ...grid.cell(0, 8, 2, 1))
        .scheme('light')
        .limits(0, 100)
        .values(0, 100)
        .ticks(10, 2, true)
        .weight(4)
        .opaque()
        .parent(panel)
        .setAction(info => changeInsets(info.low, info.high, info.final));

}

function addStyleSelectors(gui, panel, data) {
    let grid = gui.grid(40, 290, 240, 225)
    grid.size(2, 9).insets(1, 3);
    gui.label('txtStyle', ...grid.cell(0, 0, 2, 1))
        .text('STYLE')
        .textStyle(BOLD)
        .parent(panel);
    data.forEach(item => {
        const d = item.trim().split(/\s*,\s*/);
        const [id, r, c, style] = [d[0], Number(d[1]), Number(d[2]), d[3]];
        gui.option(id, ...grid.cell(c, r, 1, 1))
            .textSize(13)
            .text(style)
            .group('style')
            .scheme('light')
            .parent(panel)
            .setAction(info => changeStyle(info.source.id));
    });
    gui.$(style).select();

    grid.cols([80, 20])
    gui.label('lblSlant', ...grid.cell(0, 5, 1, 1))
        .textSize(13)
        .textStyle(BOLD)
        .text('SLANT')
        .parent(panel);
    gui.label('slant', ...grid.cell(1, 5, 1, 1))
        .scheme('light')
        .textSize(13)
        .parent(panel);
    gui.slider('sdrSlant', ...grid.cell(0, 6, 2, 1))
        .scheme('light')
        .limits(0, 30)
        .ticks(3, 5, true)
        .weight(4)
        .opaque()
        .parent(panel)
        .setAction(info => changeSlant(info.value));

    gui.$('sdrSlant').value(slant);
    gui.$('slant').text(`${slant}`);

    gui.label('lblSize', ...grid.cell(0, 7, 1, 1))
        .textSize(13)
        .textStyle(BOLD)
        .text('FONT SIZE')
        .parent(panel);
    gui.label('size', ...grid.cell(1, 7, 1, 1))
        .scheme('light')
        .textSize(13)
        .parent(panel);
    gui.slider('sdrSize', ...grid.cell(0, 8, 2, 1))
        .scheme('light')
        .limits(12, 30)
        .ticks(18, 0, true)
        .weight(4)
        .opaque()
        .parent(panel)
        .setAction(info => changeSize(info.value));

    gui.$('sdrSize').value(size);
    gui.$('size').text(`${size}`);
}
