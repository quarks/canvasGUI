function createColorMixer(gui) {
    let pane = gui.pane("mixer", "south", 90, "RGB Color Mixer", cMixer);
    const grid = gui.grid((width - 480) / 2, 6, 480, 56);
    grid.size(3, 2).insets(10, 4);
    // RED
    gui.slider("sdrR", ...grid.cell(0, 0, 1, 1))
        .limits(0, 255)
        .weight(12)
        .value(red)
        .parent(pane)
        .setAction(info => red = round(info.value));
    gui.label("lblR", ...grid.cell(0, 1, 1, 1), "Red")
        .parent(pane);
    // GREEN
    gui.slider("sdrG", ...grid.cell(1, 0, 1, 1))
        .limits(0, 255)
        .weight(12)
        .value(green)
        .parent(pane)
        .setAction(info => green = round(info.value));
    gui.label("lblG", ...grid.cell(1, 1, 1, 1), "Green")
        .parent(pane);
    // BLUE
    gui.slider("sdrB", ...grid.cell(2, 0, 1, 1))
        .limits(0, 255)
        .weight(12)
        .value(blue)
        .parent(pane)
        .setAction(info => blue = round(info.value));
    gui.label("lblB", ...grid.cell(2, 1, 1, 1), "Blue")
        .parent(pane);
}

function createColorPresets(gui) {
    let pane = gui.pane("presets", "south", 110, "Color Presets", cPresets);
    const grid = gui.grid((width - 480) / 2, 10, 480, 60);
    grid.size(3, 2).insets(10, 4);
    //presetAction
    gui.button("ps1", ...grid.cell(0, 0, 1, 1), "Burnt Sienna")
        .icon(getColorIcon(12, 12, 218, 95, 28))
        .parent(pane)
        .setAction(() => presetAction(218, 95, 28));
    gui.button("ps4", ...grid.cell(0, 1, 1, 1), "Harvest Gold")
        .parent(pane)
        .icon(getColorIcon(12, 12, 252, 185, 77))
        .setAction(() => presetAction(252, 185, 77));
    gui.button("ps2", ...grid.cell(1, 0, 1, 1), "Blue Mustang")
        .parent(pane)
        .icon(getColorIcon(12, 12, 56, 135, 157))
        .setAction(() => presetAction(56, 135, 157));
    gui.button("ps5", ...grid.cell(1, 1, 1, 1), "Teak")
        .parent(pane)
        .icon(getColorIcon(12, 12, 170, 108, 24))
        .setAction(() => presetAction(170, 108, 24));
    gui.button("ps3", ...grid.cell(2, 0, 1, 1), "Natural")
        .parent(pane)
        .icon(getColorIcon(12, 12, 218, 191, 151))
        .setAction(() => presetAction(218, 191, 151));
    gui.button("ps6", ...grid.cell(2, 1, 1, 1), "Avacado")
        .parent(pane)
        .icon(getColorIcon(12, 12, 135, 155, 66))
        .setAction(() => presetAction(135, 155, 66));
}

function createColorSchemePane(gui) {
    let pane = gui.pane("cslist", "east", 120, "GUI Color Scheme")
        .icon(cSwatch);
    let top = 40;
    gui.label("cslabel", 10, top, 100, 40, "Select GUI\ncolor scheme")
        .textSize(14)
        .parent(pane);
    top += 50;
    gui.colorSchemeNames.forEach(name => {
        gui.option(name, 10, top, 100, 20)
            .text(name.charAt(0).toUpperCase() + name.substr(1).toLowerCase())
            .group("scheme")
            .parent(pane)
            .setAction(csAction);
        top += 30;
    });
}

function presetAction(r, g, b) {
    gui.$('sdrR').value((red = r));
    gui.$('sdrG').value((green = g));
    gui.$('sdrB').value((blue = b));
}

function csAction(ei) {
    gui.scheme(ei.source.id);
}

function getColorIcon(w, h, r, g, b) {
    let img = createImage(w, h);
    img.loadPixels();
    for (let i = 0; i < img.pixels.length; i += 4) {
        img.pixels[i] = r;
        img.pixels[i + 1] = g;
        img.pixels[i + 2] = b;
        img.pixels[i + 3] = 255;
    }
    img.updatePixels();
    return img;
}
