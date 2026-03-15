// =================================================================
// ====    canvasGUI control variables
/** @hidden */
const DELTA_Z = 64, PANEL_Z = 2048, PANE_Z = 4096;
/** @hidden */
const TT_SHOW_TIME = 1600, TT_REPEAT_TIME = 10000;
/** @hidden */
const START_TIME = Date.now(), MILLIS = function () { return Date.now() - START_TIME; };
// =================================================================
// ====    Poster and text attributes
const CHAR_ENTITIES = function () {
    let c = [
        // Math symbols
        [60, 'lt'], [62, 'gt'], [8804, 'le'], [8805, 'ge'], [8800, 'ne'],
        [8776, 'asymp'], [177, 'plusmin'], [215, 'times'], [247, 'divide'],
        [8901, 'sdot'], [8733, 'prop'], [8736, 'ang'],
        // Currency symbols
        [162, 'cent'], [163, 'pound'], [8364, 'euro'], [165, 'yen'],
        // Arrows
        [8592, 'larr'], [8595, 'uarr'], [8594, 'rarr'], [8595, 'darr'],
        [8596, 'harr'], [8629, 'crarr'],
        // Fractions and superscripts (deg = superscript0)
        [188, 'frac14'], [189, 'frac12'], [190, 'frac34'],
        [176, 'deg'], [185, 'sup1'], [178, 'sup2'], [179, 'sup3'],
        // Greek symbols
        [945, 'alpha'], [946, 'beta'], [947, 'gamma'], [948, 'delta'],
        [949, 'epsilon'], [960, 'pi'],
        // Bullets and markers
        [8226, 'bull'], [9674, 'loz'], [8224, 'dagger'], [8225, 'Dagger'],
        // Playing card suits
        [9824, 'spades'], [9827, 'clubs'], [9829, 'hearts'], [9830, 'diams'],
        // Symbols
        [169, 'copy'], [174, 'reg'], [8482, 'trade'], [182, 'para'],
        [8230, 'hellip'], [171, 'laquo'], [187, 'raquo'], [167, 'sect'],
    ];
    let m = new Map();
    c.forEach(e => m.set(`&${e[1]};`, String.fromCharCode(Number(e[0]))));
    return m;
}();
const GENERIC_FONTS = function () {
    return Array.of('sans-serif', 'serif', 'monospace', 'cursive', 'fantasy');
};
const TAGS = function () {
    let m = new Map();
    // Alignment
    m.set('pl', 'left');
    m.set('pr', 'right');
    m.set('pc', 'center');
    m.set('pj', 'justified');
    // Style
    m.set('n', 'normal');
    m.set('t', 'thin');
    m.set('b', 'bold');
    m.set('i', 'italic');
    m.set('ti', 'thin italic');
    m.set('bi', 'bold italic');
    m.set('o', 'oblique');
    // Font
    m.set('ft', 'font face name');
    m.set('fs', 'font size');
    // Glyph attributes
    m.set('gsw', 'glyph stroke width');
    m.set('gs', 'glyph stroke color');
    m.set('gf', 'glyph fill color');
    // Stack
    m.set('push', 'save current state');
    m.set('pop', 'restore state');
    return m;
}();
/**
 * Get the css font descriptor for this control.
 *
 * @readonly
 * @type {*}
 * @hidden
 */
const cssFont$ = function (fontface, size, style, slant = 14) {
    let s = 'normal', w = 400;
    switch (style) {
        case "bold":
            w = 600;
            break;
        case "thin":
            w = 200;
            break;
        case "bold italic":
            w = 600;
            s = "italic";
            break;
        case "thin italic":
            w = 200;
            s = "italic";
            break;
        case "italic":
            s = "italic";
            break;
        case "oblique":
            switch (slant) {
                case 0:
                    s = "normal";
                    break;
                case 14:
                    s = "italic";
                    break;
                default: s = `oblique ${slant}deg`;
            }
    }
    return `${s} ${w} ${size}px ${fontface}`;
};
/**
 * Wrapper for JS <code>measureText()</code> function to summarise
 * the metrics needed form measuring text.
 * The fontface, size and style for the 2D context must be set before calling this
 * function
 *
 * @param {*} ctx the 2d drawing context
 * @param {*} str the text to measure
 * @returns summary of text metrics
 * @hidden
 */
const textMetrics = function (ctx, str) {
    ctx.save();
    let tm = ctx.measureText(str);
    ctx.restore();
    return {
        tWidth: tm.actualBoundingBoxRight + tm.actualBoundingBoxLeft,
        tAscent: tm.actualBoundingBoxAscent,
        tDescent: tm.actualBoundingBoxDescent,
        tHeight: tm.actualBoundingBoxAscent + tm.actualBoundingBoxDescent,
        fWidth: tm.width,
        fAscent: tm.fontBoundingBoxAscent,
        fDescent: tm.fontBoundingBoxDescent,
        fHeight: tm.fontBoundingBoxAscent + tm.fontBoundingBoxDescent,
        left: tm.actualBoundingBoxLeft,
        right: tm.actualBoundingBoxRight,
    };
};
/**
 * Validate text alignment changing invalid values with their defaults.
 * @param {*} horz horizontal alignment
 * @param {*} vert vertical alignment
 * @returns array of validated alignments
 * @hidden
 */
const _validateTextAlign = function (horz = 'center', vert = 'center') {
    switch (horz) {
        case 'left':
        case 'right':
        case 'center':
            break;
        default:
            horz = 'center';
    }
    switch (vert) {
        case 'top':
        case 'bottom':
        case 'center':
            break;
        default:
            vert = 'center';
    }
    return [horz, vert];
};
/**
 * Tests the the style requested is valid.
 * @param style the requested style
 * @returns the validated style or undefined if invalid
 * @hidden
 */
const _validateTextStyle = function (style) {
    switch (style) {
        case 'normal':
        case 'bold':
        case 'thin':
        case 'italic':
        case 'bold italic':
        case 'thin italic':
        case 'oblique':
            return style;
        default:
            return undefined;
    }
};
/** @hidden */
const ISET_H = 3, ISET_V = 2, GUTTER = 3;
/**
 * Used to convert p5js image objects to one that can be used
 * directly in JS.
 * @param icon a p5js image or suitable canvas object
 * @returns a CvsImage object that can be drawn to a 2d context
 * @hidden
 */
const cvsGuiCanvas = function (icon) {
    return icon.canvas ? icon.canvas : icon;
};
/**
 * Used to retrieve the font family name depending on the parameter type.
 * Acceptable types are
 *  System or logical font
 *  A JS FontFace object
 *  A p5js font object loaded with loadFont(...)
 *
 * @param font an acceptable font type
 * @returns the font family name or undefined if type not recognised.
 * @hidden
 */
const cvsGuiFont = function (font) {
    if (typeof font === 'string')
        return font;
    else if (font instanceof FontFace)
        return font.family;
    else if (font["face"] instanceof FontFace)
        return font["face"].family;
    return undefined;
};
/**
 * Accepts a css color descriptor or a p5.Color object and returns a css
 * color descriptor. Any other input returns undefined.
 *
 * @param color either css color or p5js p5.Color object
 * @returns css color descriptor for valid parameters
 * @hidden
 */
const cvsGuiColor = function (color) {
    if (typeof color === 'string')
        return color;
    if (color["_getRed"] && color["_getGreen"] && color["_getBlue"] && color["_getAlpha"]) {
        let [r, g, b, a] = [color['_getRed'](255), color['_getGreen'](255),
            color['_getBlue'](255), color['_getAlpha'](100)];
        if (a < 100)
            return `rgb(${r} ${g} ${b} / ${a}%)`;
        else
            return `rgb(${r} ${g} ${b})`;
    }
    ;
    return undefined;
};
// =================================================================
// ====    General utility functions
/** @hidden */
const _xor = function (a, b) {
    return (a || b) && !(a && b);
};
/** @hidden */
const _radians = function (deg) {
    return deg * Math.PI / 180;
};
/** @hidden */
const _fixAngle2Pi = function (a) {
    const TAU = 2 * Math.PI;
    while (a < 0)
        a += TAU;
    return a % TAU;
};
/** @hidden */
const _fixAngle360 = function (a) {
    while (a < 0)
        a += 360;
    return a % 360;
};
/** @hidden */
const _rgb$ = function (r, g, b) {
    return `rgb(${r} ${g} ${b})`;
};
/** @hidden */
const _rgba$ = function (r, g, b, a = 255) {
    let alpha = a < 0 ? 0 : a > 255 ? 255 : a;
    alpha = Math.floor(alpha / 0.255) / 10;
    return `rgb(${r} ${g} ${b} / ${alpha}%)`;
};
/** @hidden */
const _constrain = function (n, low, high) {
    return Math.max(Math.min(n, high), low);
};
/** @hidden */
const _map = function (n, low1, high1, low2, high2, keepInRange = false) {
    const newval = (n - low1) / (high1 - low1) * (high2 - low2) + low2;
    if (!keepInRange)
        return newval;
    if (low2 < high2)
        return _constrain(newval, low2, high2);
    else
        return _constrain(newval, high2, low2);
};
// =================================================================
// ====    Development utilities
/** @hidden */
const [CLOG, CWARN, CERROR, CASSERT, CCLEAR] = [console.log, console.warn, console.error, console.assert, console.clear];
// Source - https://stackoverflow.com/a/26983095
// Posted by user1693593, modified by community. 
// See post 'Timeline' for change history
// Retrieved 2026-02-06, License - CC BY-SA 3.0
// Store existing call
HTMLCanvasElement.prototype["_getContext"] = HTMLCanvasElement.prototype.getContext;
// Store context type
HTMLCanvasElement.prototype["._contextType"] = null;
// Register getContext wrapper method
HTMLCanvasElement.prototype.getContext = function (type) {
    this._contextType = type;
    return this._getContext(type);
};
// Return the context type. If no context type has bee set return null
HTMLCanvasElement.prototype["hasContext"] = function () {
    return this._contextType;
};
//# sourceMappingURL=constants.js.map