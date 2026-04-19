let gui, panels = [], poster, scheme = 'purple';
// Font and colour data
let fsData, fonts, fontIdx = 9;
let csIcons, colors;
// Text style
let style = 'n', slant = 14, size = 16;
// Paragraph metrics
let align = 'pl', gap = 0, indent = 0, wide = 0, leading = 0;
// Glyph metrics
let gf = 'gf1', gs = 'gs0', gsw = 0.2;

let taggedText;

async function setup() {
    const p5canvas = createCanvas(800, 648);
    p5canvas.parent('sketch');
    cursor(CROSS);
    // Get GUI resources 
    const fontData = await loadStrings('./assets/atrFonts.txt');
    const algnData = await loadStrings('./assets/atrAlign.txt');
    const styleData = await loadStrings('./assets/atrStyles.txt');
    const colorData = await loadStrings('./assets/atrColors.txt');
    const cooky = await loadFont('./assets/COOKY.TTF');
    // Get the tagged text to appear in the poster control
    taggedText = await loadStrings('./assets/tt.txt');

    // Prepare font and color data for use in GUI
    [fsData, fonts] = prepareFontData(fontData);
    [csIcons, colors] = prepareColorData(colorData);

    // Create the GUI controller for this canvas
    gui = createGUI('poster gui', p5canvas);
    // POSTER
    poster = gui.poster('poster', 4, 30, 472, height - 60)
        .scheme(scheme)
        .transparent()
        .margins(8)
        .colors(colors)
        .fonts(fonts, true)
        .fonts(cooky)
        .text(taggedText);
    // REST OF GUI
    populateGUI(gui, fsData, algnData, styleData, colorData);

    ABOUT(gui, 'Web Safe Fonts');
    updatePosterText();
}

function changeMode(mode) {
    panels.forEach(pnl => pnl.hide(true));
    panels[Number(mode.substring(4))].show(true);
}

function changeInsets(low, high, final) {
    let pww = poster.wrapWidth;
    low = constrain(low, 0, 95);
    high = constrain(high, 5, 100);
    if (low == high) high = 100;
    indent = round(pww * low / 100);
    wide = round(pww * high / 100) - indent;
    if (final) {
        gui.$('rngInsets').values(low, high);
    }
    updatePosterText();
}

function changeScheme(_scheme) {
    scheme = _scheme;
    gui.$('gf0').scheme(scheme);
    gui.$('gf1').scheme(scheme);
    gui.$('gs0').scheme(scheme);
    gui.$('gs1').scheme(scheme);
    poster.scheme(scheme);
}

function changeSize(_size) {
    size = _size;
    gui.$('size').text(`${size}`);
    updatePosterText();
}

function changeStyle(_style) {
    style = _style;
    updatePosterText();
}

function changeAlign(_align) {
    align = _align;
    updatePosterText();
}

function changeSlant(_slant) {
    slant = _slant;
    gui.$('slant').text(`${slant}`);
    updatePosterText();
}

function changeGap(_gap) {
    gap = _gap;
    gui.$('gap').text(`${gap}`);
    updatePosterText();
}

function changeLeading(_leading) {
    leading = _leading;
    gui.$('leading').text(`${leading}`);
    updatePosterText();
}

function changeGlyphFill(v) {
    gf = v;
    updatePosterText();
    CLOG(gf);
}

function changeGlyphEdge(v) {
    gs = v;
    updatePosterText();
    CLOG(gs);
}

function changeGlyphStrokeWeight(v) {
    gsw = v;
    updatePosterText();
    CLOG(gsw);
}

function changeFont(id) {
    fontIdx = Number(id.substring(2));
    updatePosterText();
}

function updatePosterText() {
    // ALIGN
    wide = (indent == 0 && wide == poster.wrapWidth) ? 0 : wide;
    let t = gap == 0 ? `<${align}` : `<${align}${gap}`
    t += (indent + wide + leading > 0) ? `:${indent}:${wide}:${leading}>` : '>';
    t = t.replaceAll(':0', ':');
    // STYLE
    t += `<${style}`;
    t += (style == 'ol' || style == 'or') ? `${slant}>` : '>';
    // FONT FACE
    t += `<ft${fontIdx}>`
    // SIZE
    t += `<fs${size}>`;
    // GLYPH
    if (gf != 'gf1')
        t += `<${gf}>`;
    if (gs != 'gs0' && gsw > 0)
        t += `<${gs} gsw${gsw}>`;
    // Simplify
    t = t.replaceAll('><', ' ');
    taggedText[8] = t;
    taggedText[16] = t;
    poster.text(taggedText);
}

function draw() {
    background(236);
    gui.draw();
    noFill();
    stroke(0, 90);
    strokeWeight(1);
    rect(poster.x, poster.y, poster.w, poster.h, ...poster.CNRS);
    // Delete or comment out the next line to hide the pick buffer.
    gui.showBuffer();
}

function populateGUI(gui, fsData, algnData, styleData, colorData) {
    gui.scheme('green').textSize(16);
    // PANELS
    const [px, pw, py, ph] = [width - 320, 320, 24, height - 82];
    const [sn, alpha] = ['light', 60];
    panels.push(gui.panel('font selectors', px, py, pw, ph)
        .draggable(false, false).scheme(sn).opaque(alpha).corners(0));
    panels.push(atrPane = gui.panel('font attributes', px, py, pw, ph)
        .draggable(false, false).scheme(sn).opaque(alpha).corners(0));
    panels.push(gui.panel('poster colors', px, py, pw, ph)
        .draggable(false, false).scheme(sn).opaque(alpha).corners(0));
    // SELECTORS
    addFontSelectors(gui, panels[0], fsData);
    addAlignSelectors(gui, panels[1], algnData);
    addStyleSelectors(gui, panels[1], styleData);
    addSchemeSelectors(gui, panels[2]);
    addColorSelectors(gui, panels[2]);
    panels.forEach(pnl => pnl.hide(true));
    // CONFIG MODE PICKERS
    const grid = gui.grid(width - 320, height - 57, 320, 29)
        .size(3, 1).insets(4, 2);
    gui.option('mode0', ...grid.cell(0, 0, 1, 1), 'FONTS').scheme('purple')
        .textSize(15).textStyle(BOLD).group('modes').select()
        .setAction(info => changeMode(info.source.id));
    gui.option('mode1', ...grid.cell(1, 0, 1, 1), 'ATTRS').scheme('purple')
        .textSize(15).textStyle(BOLD).group('modes')
        .setAction(info => changeMode(info.source.id));
    gui.option('mode2', ...grid.cell(2, 0, 1, 1), 'COLORS').scheme('purple')
        .textSize(15).textStyle(BOLD).group('modes')
        .setAction(info => changeMode(info.source.id));
    changeMode('mode0');
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
