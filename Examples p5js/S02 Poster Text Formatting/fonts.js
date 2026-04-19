function prepareFontData(data) {
    const fd = [];
    const fn = [];
    data.forEach(item => {
        if (item.length > 0) {
            const d = item.trim().split(/\s*,\s*/);
            fd.push({ r: Number(d[0]), c: Number(d[1]), w: Number(d[2]), name: d[3] });
            fn.push(d[3]);
        }
    });
    return [fd, fn];
}

function addFontSelectors(gui, panel, data) {
    const grid = gui.grid(10, 10, 300, 525);
    grid.size(2, 21).insets(1, 1);
    let id = 0;
    data.forEach(f => {
        gui.option(`F#${id++}`, ...grid.cell(f.c, f.r, f.w, 1))
            .group('font')
            .textSize(f.w == 2 ? 14 : 11)
            .textStyle(BOLD)
            .text(f.name)
            .scheme(f.w == 2 ? 'green' : 'light')
            .parent(panel)
            .setAction(info => changeFont(info.source.id));
    });
    gui.$(`F#${fontIdx}`).select();
}