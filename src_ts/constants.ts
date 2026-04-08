// =================================================================
// ====    canvasGUI control variables

/** @hidden */
const DELTA_Z = 64, PANEL_Z = 2048, PANE_Z = 4096;

/** @hidden */
const TT_SHOW_TIME = 1600, TT_REPEAT_TIME = 10000;

/** @hidden */
const START_TIME = Date.now(),
    MILLIS = function () { return Date.now() - START_TIME; }


// =================================================================
// ====    Poster and text attributes


const FONT_FAMILIES = function () {
    return Array.of('serif', 'sans-serif', 'monospace', 'fantasy', 'cursive');
}

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
    m.set('o', 'oblique');   // right slant
    m.set('or', 'oblique');  // right slant
    m.set('ol', 'oblique');  // left slant
    // Font
    m.set('ft', 'font face name');
    m.set('fs', 'font size');
    // Glyph attributes
    m.set('gsw', 'glyph stroke width');
    m.set('gs', 'glyph stroke color');
    m.set('gf', 'glyph fill color');
    // Stack
    m.set('push', 'save current state');
    m.set('pop', 'restore state')
    return m;
}();

/**
 * Get the css font descriptor for this control.
 * 
 * @readonly
 * @type {*}
 * @hidden
 */
const cssFont$ = function (fontface: string, size: number, style: string, slant = 14) {
    let s = 'normal', w = 400;
    switch (style) {
        case "bold": w = 600; break;
        case "thin": w = 200; break;
        case "bold italic": w = 600; s = "italic"; break;
        case "thin italic": w = 200; s = "italic"; break;
        case "italic": s = "italic"; break;
        case "oblique":
            switch (slant) {
                case 0: s = "normal"; break;
                case 14: s = "italic"; break;
                default: s = `oblique ${slant}deg`;
            }
    }
    return `${s} ${w} ${size}px ${fontface}`;
}

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
const textMetrics = function (ctx: OffscreenCanvasRenderingContext2D, str: string) {
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
}

/**
 * Validate text alignment changing invalid values with their defaults.
 * @param {*} horz horizontal alignment
 * @param {*} vert vertical alignment
 * @returns array of validated alignments
 * @hidden
 */
const _validateTextAlign = function (horz = 'center', vert = 'center'): Array<string> {
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
}


/**
 * Tests the the style requested is valid.
 * @param style the requested style 
 * @returns the validated style or undefined if invalid
 * @hidden 
 */
const _validateTextStyle = function (style: string) {
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
}

/** @hidden */
const ISET_H = 3, ISET_V = 2, GUTTER = 3;


// =================================================================
// ====    p5js utility functions

/** @hidden */
// type cvsIcon = HTMLImageElement | HTMLCanvasElement
//     | HTMLVideoElement | OffscreenCanvas | ImageBitmap;
type cvsIcon = HTMLCanvasElement | OffscreenCanvas;


/**
 * Used to convert p5js image objects to one that can be used 
 * directly in JS.
 * @param icon a p5js image or suitable canvas object
 * @returns a CvsImage object that can be drawn to a 2d context 
 * @hidden
 */
const cvsGuiCanvas = function (icon: any) {
    if (icon)
        return icon.canvas ? icon.canvas : icon;
    return undefined;
}

/**
 * <p>Used to retrieve the font family name depending on the parameter type.</p>
 * <p>Acceptable types are -</p>
 * <ol>
 *  <li>System or logical font</li>
 *  <li>A JS FontFace object</li>
 *  <li>A p5js font object loaded with loadFont(...)</li>
 * </ol>
 * @param font an acceptable font type
 * @returns the font family name or 'sans-serif' if type not recognised.
 * @hidden
 */
const cvsGuiFont = function (font: any) {
    if (typeof font === 'string')
        return font;
    else if (font instanceof FontFace)
        return font.family;
    else if (font["face"] instanceof FontFace)
        return font["face"].family;
    return 'sans-serif';
}

/**
 * Accepts a css color descriptor or a p5.Color object and returns a css
 * color descriptor. Any other input returns 'transparent'.
 * 
 * @param color either css color or p5js p5.Color object
 * @returns css color descriptor for valid parameters
 * @hidden
 */
const cvsGuiColor = function (color: any): string {
    if (typeof color === 'string')
        return color;
    if (color && color["_getRed"] && color["_getGreen"] && color["_getBlue"] && color["_getAlpha"]) {
        let [r, g, b, a] =
            [color['_getRed'](255), color['_getGreen'](255),
            color['_getBlue'](255), color['_getAlpha'](100)];
        if (a < 100)
            return `rgb(${r} ${g} ${b} / ${a}%)`;
        else
            return `rgb(${r} ${g} ${b})`;
    };
    return 'transparent';
}


// =================================================================
// ====    General utility functions

/** @hidden */
const _xor = function (a: boolean, b: boolean): boolean {
    return (a || b) && !(a && b);
}

/** @hidden */
const _radians = function (deg: number) {
    return deg * Math.PI / 180;
}

/** @hidden */
const _fixAngle2Pi = function (a: number): number {
    const TAU = 2 * Math.PI;
    while (a < 0) a += TAU;
    return a % TAU;
}

/** @hidden */
const _fixAngle360 = function (a: number): number {
    while (a < 0) a += 360;
    return a % 360;
}

/** @hidden */
const _rgb$ = function (r: number, g: number, b: number) {
    return `rgb(${r} ${g} ${b})`;
}

/** @hidden */
const _rgba$ = function (r: number, g: number, b: number, a = 255) {
    let alpha = a < 0 ? 0 : a > 255 ? 255 : a;
    alpha = Math.floor(alpha / 0.255) / 10;
    return `rgb(${r} ${g} ${b} / ${alpha}%)`;
}

/** @hidden */
const _constrain = function (n: number, low: number, high: number) {
    return Math.max(Math.min(n, high), low);
};

/** @hidden */
const _map = function (n: number, low1: number, high1: number,
    low2: number, high2: number, keepInRange = false) {
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
const [CLOG, CWARN, CERROR, CASSERT, CCLEAR] =
    [console.log, console.warn, console.error, console.assert, console.clear];


// Source - https://stackoverflow.com/a/26983095
// Posted by user1693593, modified by community. 
// See post 'Timeline' for change history
// Retrieved 2026-02-06, License - CC BY-SA 3.0
// Modified by Quark for this project.

// Store original code 
HTMLCanvasElement.prototype["_getContext"] =
    HTMLCanvasElement.prototype.getContext;

// Store context type 
HTMLCanvasElement.prototype["_contextType"] = '';

// Register getContext wrapper method 
HTMLCanvasElement.prototype.getContext = function (type) {
    this["_contextType"] = type;
    return this["_getContext"](type);
};

// Return the context type used 
HTMLCanvasElement.prototype["hasContext"] = function () {
    return this["_contextType"];
};


// =================================================================
// ====    HTML Character Entities
const CHAR_ENTITIES = function () {
    let c = [
        // ISO-8859-1 Symbols
        ['iexcl', 161],     // Inverted exclamation mark
        ['cent', 162],      // Cent
        ['pound', 163],     // Pound
        ['curren', 164],    // Currency
        ['yen', 165],       // Yen
        ['brvbar', 166],    // Broken vertical bar
        ['sect', 167],      // Section
        ['uml', 168],       // Spacing diaeresis
        ['copy', 169],      // Copyright
        ['ordf', 170],      // Feminine ordinal indicator
        ['laquo', 171],     // Opening/Left angle quotation mark
        ['not', 172],       // Negation
        ['reg', 174],       // Registered trademark
        ['macr', 175],      // Spacing macron
        ['deg', 176],       // Degree
        ['plusmn', 177],    // Plus or minus
        ['sup2', 178],      // Superscript 2
        ['sup3', 179],      // Superscript 3
        ['acute', 180],     // Spacing acute
        ['micro', 181],     // Micro
        ['para', 182],      // Paragraph
        ['cedil', 184],     // Spacing cedilla
        ['sup1', 185],      // Superscript 1
        ['ordm', 186],      // Masculine ordinal indicator
        ['raquo', 187],     // Closing/Right angle quotation mark
        ['frac14', 188],    // Fraction 1/4
        ['frac12', 189],    // Fraction 1/2
        ['frac34', 190],    // Fraction 3/4
        ['iquest', 191],    // Inverted question mark
        ['times', 215],     // Multiplication
        ['divide', 247],    // Divide

        // Math Symbols
        ['lt', 60],         // Less-than
        ['gt', 62],         // Greater than
        ['forall', 8704],   // For all
        ['part', 8706],     // Part
        ['exist', 8707],    // Exist
        ['empty', 8709],    // Empty
        ['nabla', 8711],    // Nabla
        ['isin', 8712],     // Is in
        ['notin', 8713],    // Not in
        ['ni', 8715],       // Ni
        ['prod', 8719],     // Product
        ['sum', 8721],      // Sum
        ['minus', 8722],    // Minus
        ['lowast', 8727],   // Asterisk (Lowast)
        ['radic', 8730],    // Square root
        ['prop', 8733],     // Proportional to
        ['infin', 8734],    // Infinity
        ['ang', 8736],      // Angle
        ['and', 8743],      // And
        ['or', 8744],       // Or
        ['cap', 8745],      // Cap
        ['cup', 8746],      // Cup
        ['int', 8747],      // Integral
        ['there4', 8756],   // Therefore
        ['sim', 8764],      // Similar to
        ['cong', 8773],     // Congurent to
        ['asymp', 8776],    // Almost equal
        ['ne', 8800],       //  Not equal
        ['equiv', 8801],    // Equivalent
        ['le', 8804],       // Less or equal
        ['ge', 8805],       // Greater or equal
        ['sub', 8834],      // Subset of
        ['sup', 8835],      // Superset of
        ['nsub', 8836],     // Not subset of
        ['sube', 8838],     // Subset or equal
        ['supe', 8839],     // Superset or equal
        ['oplus', 8853],    // Circled plus
        ['otimes', 8855],   // Circled times
        ['perp', 8869],     // Perpendicular
        ['sdot', 8901],     // Dot operator

        // Greek Letters
        ['Alpha', 913],     // Alpha
        ['Beta', 914],      // Beta
        ['Gamma', 915],     // Gamma
        ['Delta', 916],     // Delta
        ['Epsilon', 917],   // Epsilon
        ['Zeta', 918],      // Zeta
        ['Eta', 919],       // Eta
        ['Theta', 920],     // Theta
        ['Iota', 921],      // Iota
        ['Kappa', 922],     // Kappa
        ['Lambda', 923],    // Lambda
        ['Mu', 924],        // Mu
        ['Nu', 925],        // Nu
        ['Xi', 926],        // Xi
        ['Omicron', 927],   // Omicron
        ['Pi', 928],        // Pi
        ['Rho', 929],       // Rho
        ['Sigma', 931],     // Sigma
        ['Tau', 932],       // Tau
        ['Upsilon', 933],   // Upsilon
        ['Phi', 934],       // Phi
        ['Chi', 935],       // Chi
        ['Psi', 936],       // Psi
        ['Omega', 937],     // Omega
        ['alpha', 945],     // alpha
        ['beta', 946],      // beta
        ['gamma', 947],     // gamma
        ['delta', 948],     // delta
        ['epsilon', 949],   // epsilon
        ['zeta', 950],      // zeta
        ['eta', 951],       // eta
        ['theta', 952],     // theta
        ['iota', 953],      // iota
        ['kappa', 954],     // kappa
        ['lambda', 955],    // lambda
        ['mu', 956],        // mu
        ['nu', 957],        // nu
        ['xi', 958],        // xi
        ['omicron', 959],   // omicron
        ['pi', 960],        // pi
        ['rho', 961],       // rho
        ['sigmaf', 962],    // sigmaf
        ['sigma', 963],     // sigma
        ['tau', 964],       // tau
        ['upsilon', 965],   // upsilon
        ['phi', 966],       // phi
        ['chi', 97],        // chi
        ['psi', 968],       // psi
        ['omega', 969],     // omega
        ['thetasym', 977],  // Theta symbol
        ['upsih', 978],     // Upsilon symbol
        ['piv', 982],       // Pi symbol

        // Miscellaneous HTML entities
        ['OElig', 338],     // Uppercase ligature OE
        ['oelig', 339],     // Lowercase ligature OE
        ['Scaron', 352],    // Uppercase S with caron
        ['scaron', 353],    // Lowercase S with caron
        ['Yuml', 376],      // Capital Y with diaeres
        ['fnof', 402],      // Lowercase with hook
        ['circ', 710],      // Circumflex accent
        ['tilde', 732],     // Tilde
        ['ensp', 8194],     // En space
        ['emsp', 8195],     // Em space
        ['thinsp', 8194],   // Thin space
        ['ndash', 8211],    // En dash
        ['mdash', 8212],    // Em dash
        ['lsquo', 8216],    // Left single quotation mark
        ['rsquo', 8217],    // Right single quotation mark
        ['sbquo', 8218],    // Single low-9 quotation mark
        ['ldquo', 8220],    // Left double quotation mark
        ['rdquo', 8221],    // Right double quotation mark
        ['bdquo', 8222],    // Double low-9 quotation mark
        ['dagger', 8224],   // Dagger
        ['Dagger', 8225],   // Double dagger
        ['bull', 8226],     // Bullet
        ['hellip', 8230],   // Horizontal ellipsis
        ['permil', 8240],   // Per mille
        ['prime', 8242],    // Minutes (Degrees)
        ['Prime', 8243],    // Seconds (Degrees)
        ['lsaquo', 8249],   // Single left angle quotation
        ['rsaquo', 8250],   // Single right angle quotation
        ['oline', 8254],    // Overline
        ['euro', 8364],     // Euro
        ['trade', 8482],    // Trademark
        ['larr', 8592],     // Left arrow
        ['uarr', 8593],     // Up arrow
        ['rarr', 8594],     // Right arrow
        ['darr', 8595],     // Down arrow
        ['harr', 8596],     // Left right arrow
        ['crarr', 8629],    // Carriage return arrow
        ['lceil', 8968],    // Left ceiling
        ['rceil', 8969],    // Right ceiling
        ['lfloor', 8970],   // Left floor
        ['rfloor', 8971],   // Right floor
        ['loz', 9674],      // Lozenge
        ['spades', 9824],   // Spade
        ['clubs', 9827],    // Club
        ['hearts', 9829],   // Heart
        ['diams', 9830],    // Diamond
    ];
    let m = new Map();
    c.forEach(e => {
        let ch = typeof e[1] === 'number'
            ? String.fromCharCode(Number(e[1]))
            : e[1];
        m.set(`&${e[0]};`, ch);
    });
    return m;
}();

/**
 * @param str a string with possible character entities
 * @returns the string with recognised enties replaced with unicode character
 * @hidden
 */
const replaceEntities = function (str: string): string {
    const ptn = /(&\w+;)/gu;
    return str.replace(ptn, m => CHAR_ENTITIES.get(m) || m);
}
