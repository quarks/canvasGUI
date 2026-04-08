 /**
 * @preserve canvasGUI    (c) Peter Lager  2026
 * @license MIT
 * @version 3.0.0
 */
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
const FONT_FAMILIES = function () {
    return Array.of('serif', 'sans-serif', 'monospace', 'fantasy', 'cursive');
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
    m.set('o', 'oblique'); // right slant
    m.set('or', 'oblique'); // right slant
    m.set('ol', 'oblique'); // left slant
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
    if (icon)
        return icon.canvas ? icon.canvas : icon;
    return undefined;
};
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
const cvsGuiFont = function (font) {
    if (typeof font === 'string')
        return font;
    else if (font instanceof FontFace)
        return font.family;
    else if (font["face"] instanceof FontFace)
        return font["face"].family;
    return 'sans-serif';
};
/**
 * Accepts a css color descriptor or a p5.Color object and returns a css
 * color descriptor. Any other input returns 'transparent'.
 *
 * @param color either css color or p5js p5.Color object
 * @returns css color descriptor for valid parameters
 * @hidden
 */
const cvsGuiColor = function (color) {
    if (typeof color === 'string')
        return color;
    if (color && color["_getRed"] && color["_getGreen"] && color["_getBlue"] && color["_getAlpha"]) {
        let [r, g, b, a] = [color['_getRed'](255), color['_getGreen'](255),
            color['_getBlue'](255), color['_getAlpha'](100)];
        if (a < 100)
            return `rgb(${r} ${g} ${b} / ${a}%)`;
        else
            return `rgb(${r} ${g} ${b})`;
    }
    ;
    return 'transparent';
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
        ['iexcl', 161], // Inverted exclamation mark
        ['cent', 162], // Cent
        ['pound', 163], // Pound
        ['curren', 164], // Currency
        ['yen', 165], // Yen
        ['brvbar', 166], // Broken vertical bar
        ['sect', 167], // Section
        ['uml', 168], // Spacing diaeresis
        ['copy', 169], // Copyright
        ['ordf', 170], // Feminine ordinal indicator
        ['laquo', 171], // Opening/Left angle quotation mark
        ['not', 172], // Negation
        ['reg', 174], // Registered trademark
        ['macr', 175], // Spacing macron
        ['deg', 176], // Degree
        ['plusmn', 177], // Plus or minus
        ['sup2', 178], // Superscript 2
        ['sup3', 179], // Superscript 3
        ['acute', 180], // Spacing acute
        ['micro', 181], // Micro
        ['para', 182], // Paragraph
        ['cedil', 184], // Spacing cedilla
        ['sup1', 185], // Superscript 1
        ['ordm', 186], // Masculine ordinal indicator
        ['raquo', 187], // Closing/Right angle quotation mark
        ['frac14', 188], // Fraction 1/4
        ['frac12', 189], // Fraction 1/2
        ['frac34', 190], // Fraction 3/4
        ['iquest', 191], // Inverted question mark
        ['times', 215], // Multiplication
        ['divide', 247], // Divide
        // Math Symbols
        ['lt', 60], // Less-than
        ['gt', 62], // Greater than
        ['forall', 8704], // For all
        ['part', 8706], // Part
        ['exist', 8707], // Exist
        ['empty', 8709], // Empty
        ['nabla', 8711], // Nabla
        ['isin', 8712], // Is in
        ['notin', 8713], // Not in
        ['ni', 8715], // Ni
        ['prod', 8719], // Product
        ['sum', 8721], // Sum
        ['minus', 8722], // Minus
        ['lowast', 8727], // Asterisk (Lowast)
        ['radic', 8730], // Square root
        ['prop', 8733], // Proportional to
        ['infin', 8734], // Infinity
        ['ang', 8736], // Angle
        ['and', 8743], // And
        ['or', 8744], // Or
        ['cap', 8745], // Cap
        ['cup', 8746], // Cup
        ['int', 8747], // Integral
        ['there4', 8756], // Therefore
        ['sim', 8764], // Similar to
        ['cong', 8773], // Congurent to
        ['asymp', 8776], // Almost equal
        ['ne', 8800], //  Not equal
        ['equiv', 8801], // Equivalent
        ['le', 8804], // Less or equal
        ['ge', 8805], // Greater or equal
        ['sub', 8834], // Subset of
        ['sup', 8835], // Superset of
        ['nsub', 8836], // Not subset of
        ['sube', 8838], // Subset or equal
        ['supe', 8839], // Superset or equal
        ['oplus', 8853], // Circled plus
        ['otimes', 8855], // Circled times
        ['perp', 8869], // Perpendicular
        ['sdot', 8901], // Dot operator
        // Greek Letters
        ['Alpha', 913], // Alpha
        ['Beta', 914], // Beta
        ['Gamma', 915], // Gamma
        ['Delta', 916], // Delta
        ['Epsilon', 917], // Epsilon
        ['Zeta', 918], // Zeta
        ['Eta', 919], // Eta
        ['Theta', 920], // Theta
        ['Iota', 921], // Iota
        ['Kappa', 922], // Kappa
        ['Lambda', 923], // Lambda
        ['Mu', 924], // Mu
        ['Nu', 925], // Nu
        ['Xi', 926], // Xi
        ['Omicron', 927], // Omicron
        ['Pi', 928], // Pi
        ['Rho', 929], // Rho
        ['Sigma', 931], // Sigma
        ['Tau', 932], // Tau
        ['Upsilon', 933], // Upsilon
        ['Phi', 934], // Phi
        ['Chi', 935], // Chi
        ['Psi', 936], // Psi
        ['Omega', 937], // Omega
        ['alpha', 945], // alpha
        ['beta', 946], // beta
        ['gamma', 947], // gamma
        ['delta', 948], // delta
        ['epsilon', 949], // epsilon
        ['zeta', 950], // zeta
        ['eta', 951], // eta
        ['theta', 952], // theta
        ['iota', 953], // iota
        ['kappa', 954], // kappa
        ['lambda', 955], // lambda
        ['mu', 956], // mu
        ['nu', 957], // nu
        ['xi', 958], // xi
        ['omicron', 959], // omicron
        ['pi', 960], // pi
        ['rho', 961], // rho
        ['sigmaf', 962], // sigmaf
        ['sigma', 963], // sigma
        ['tau', 964], // tau
        ['upsilon', 965], // upsilon
        ['phi', 966], // phi
        ['chi', 97], // chi
        ['psi', 968], // psi
        ['omega', 969], // omega
        ['thetasym', 977], // Theta symbol
        ['upsih', 978], // Upsilon symbol
        ['piv', 982], // Pi symbol
        // Miscellaneous HTML entities
        ['OElig', 338], // Uppercase ligature OE
        ['oelig', 339], // Lowercase ligature OE
        ['Scaron', 352], // Uppercase S with caron
        ['scaron', 353], // Lowercase S with caron
        ['Yuml', 376], // Capital Y with diaeres
        ['fnof', 402], // Lowercase with hook
        ['circ', 710], // Circumflex accent
        ['tilde', 732], // Tilde
        ['ensp', 8194], // En space
        ['emsp', 8195], // Em space
        ['thinsp', 8194], // Thin space
        ['ndash', 8211], // En dash
        ['mdash', 8212], // Em dash
        ['lsquo', 8216], // Left single quotation mark
        ['rsquo', 8217], // Right single quotation mark
        ['sbquo', 8218], // Single low-9 quotation mark
        ['ldquo', 8220], // Left double quotation mark
        ['rdquo', 8221], // Right double quotation mark
        ['bdquo', 8222], // Double low-9 quotation mark
        ['dagger', 8224], // Dagger
        ['Dagger', 8225], // Double dagger
        ['bull', 8226], // Bullet
        ['hellip', 8230], // Horizontal ellipsis
        ['permil', 8240], // Per mille
        ['prime', 8242], // Minutes (Degrees)
        ['Prime', 8243], // Seconds (Degrees)
        ['lsaquo', 8249], // Single left angle quotation
        ['rsaquo', 8250], // Single right angle quotation
        ['oline', 8254], // Overline
        ['euro', 8364], // Euro
        ['trade', 8482], // Trademark
        ['larr', 8592], // Left arrow
        ['uarr', 8593], // Up arrow
        ['rarr', 8594], // Right arrow
        ['darr', 8595], // Down arrow
        ['harr', 8596], // Left right arrow
        ['crarr', 8629], // Carriage return arrow
        ['lceil', 8968], // Left ceiling
        ['rceil', 8969], // Right ceiling
        ['lfloor', 8970], // Left floor
        ['rfloor', 8971], // Right floor
        ['loz', 9674], // Lozenge
        ['spades', 9824], // Spade
        ['clubs', 9827], // Club
        ['hearts', 9829], // Heart
        ['diams', 9830], // Diamond
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
const replaceEntities = function (str) {
    const ptn = /(&\w+;)/gu;
    return str.replace(ptn, m => CHAR_ENTITIES.get(m) || m);
};
//# sourceMappingURL=constants.js.map
const CANVAS_GUI_VERSION = '3.0.0';
/**
 * <h2>Core class for the canvasGUI library </h2>
 *
 * <p>To make use of canvasGUI the user requires a GUI controller and the
 * global method <br>&nbsp;&nbsp;&nbsp;<code>createGUI(id, display)</code>
 * <br>must be used to create it.</p>
 *
 * <p>The first parameter (<code>id</code>) is a unique string identifier for
 * the gui. If the string is empty then a random id will be generated GUI.</p>
 *
 * <p>The second parameter (<code>display</code>) must be the one of the
 * following :</p>
 * <ul>
 * <li>an existing HTML canvas element</li>
 * <li>the id of an existing HTML canvas element</li>
 * <li>if using p5js it will be the value returned by the <code>createCanvas()'</code>
 * method executed in the <code>setup()'</code> function.</li>
 * </ul>
 *
 * <p>Any other value will result the program being terminated with an
 * error</p>
 */
class GUI {
    /**
     * Create a GUI object to create and manage the GUI controls for
     * an HTML canvas.
     *
     * @hidden
     * @param p5c the renderer
     * @param p the sketch instance
     */
    constructor(id, canvas, pixelRatio, mode) {
        // Prevent duplicate event handlers
        /** @hidden */ this._touchListenersCreated = false;
        /** @hidden */ this._mouseListenersCreated = false;
        /** @hidden */ this._keyListenersCreated = false;
        // Hide / disable GUI
        /** @hidden */ this._visible = true;
        /** @hidden */ this._enabled = true;
        /** @hidden */ this._is3D = false;
        // Controls
        /** @hidden */ this._controls = new Map();
        /** @hidden */ this._ctrls = [];
        /** @hidden */ this._corners = [4, 4, 4, 4];
        /** @hidden */ this._optionGroups = new Map();
        /** @hidden */ this._tSize = 12;
        /** @hidden */ this._tFace = 'sans-serif';
        /** @hidden */ this._tStyle = 'normal';
        /** @hidden */ this._iSize = 14;
        /** @hidden */ this._tipTextSize = 10;
        /** @hidden */ this._panesEast = [];
        /** @hidden */ this._panesSouth = [];
        /** @hidden */ this._panesWest = [];
        /** @hidden */ this._panesNorth = [];
        /** @hidden */ this._tabsInvalid = false;
        /** @hidden */ this._tabMinHeight = 16;
        // Attributes
        /** @hidden */ this._schemes = new Map();
        /** @hidden */ this._clipboard = '';
        // Tooltip times
        /** @hidden */ this._show_time = TT_SHOW_TIME;
        /** @hidden */ this._repeat_time = TT_REPEAT_TIME;
        /** @hidden */ this._color2control = new Map(); // Map the base pick color to the object
        /** @hidden */ this._control2color = new Map(); // Find the colour for a given object
        // Mouse position
        /** @hidden */ this._mouseX = 0;
        /** @hidden */ this._mouseY = 0;
        this._uid = id;
        this._mode = mode;
        this._pr = pixelRatio;
        this._canvas = canvas; // HTMLCanvasElement
        this._canvasContext = // Drawing context for canvas
            this._canvas.getContext(this._canvas["hasContext"]());
        this._is3D = this._canvas["hasContext"]() === 'webgl2';
        if (this._is3D)
            this._guiShader = this._createGuiShaderProgram();
        // Pick buffer
        this._COLOR_STEP = 8;
        this._PART_MASK = this._COLOR_STEP - 1;
        this._COLOR_MASK = 0x00FFFFFF ^ this._PART_MASK;
        this._NEXT_COLOR = this._COLOR_STEP;
        // Create color schemes
        this._initColorSchemes();
        // Event handlers for canvas
        this._addFocusHandlers();
        this._addMouseEventHandlers();
        this._addTouchEventHandlers();
        this._currOver = null;
        this._activeCtrl = null;
        this._activePart = 0;
        // Choose 2D / 3D rendering methods  
        this._showUI = this._is3D ? this._showOverWebGL : this._showOver2d;
        // Create buffers
        this._createGuiBuffers(this._canvas.width, this._canvas.height);
    }
    /** @hidden */
    invalidateTabs() {
        this._tabsInvalid = true;
    }
    /** @hidden */
    _createGuiBuffers(w, h) {
        this._uiBuffer = new OffscreenCanvas(w, h);
        this._uiBuffer.getContext('2d')?.scale(this._pr, this._pr);
        this._pkBuffer = new OffscreenCanvas(w, h);
        this._pkBuffer.getContext('2d');
        this._clearGuiBuffers();
    }
    /**
     * Clear the gui buffers ready for next frame
     * @hidden
     */
    _clearGuiBuffers() {
        const [uib, pkb] = [this._uiBuffer, this._pkBuffer];
        uib.getContext('2d')?.clearRect(0, 0, uib.width, uib.height);
        pkb.getContext('2d')?.clearRect(0, 0, pkb.width, pkb.height);
    }
    /**
     * Make sure we have an overlay buffer and a pick buffer of the correct size.
     * @returns true if the buffers were ressized else false.
     * @hidden
     */
    _validateGuiBuffers() {
        const [w, h] = [this._canvas.width, this._canvas.height];
        if (this._uiBuffer.width != w || this._uiBuffer.height != h) {
            this._createGuiBuffers(w, h);
            this.invalidateTabs();
        }
    }
    /**
     * Draw the controls to the ui buffer then display over the canvas
     * @hidden
     */
    draw() {
        const uic = this._uiBuffer.getContext('2d');
        const pkc = this._pkBuffer.getContext('2d');
        if (!uic || !pkc)
            return;
        this._validateGuiBuffers();
        this._clearGuiBuffers();
        if (this._visible) {
            for (const c of this._ctrls)
                if (!c.getParent())
                    c._draw(uic, pkc);
            this._showUI();
        }
        if (this._tabsInvalid) {
            this.validateTabsNorth();
            this.validateTabsSouth();
            this.validateTabsEast();
            this.validateTabsWest();
            this._tabsInvalid = false;
        }
    }
    /**
     * Show GUI over a '2d' canvas
     * @hidden
     */
    _showOver2d() {
        this._canvasContext.save();
        this._canvasContext.resetTransform();
        this._canvasContext.drawImage(this._uiBuffer, 0, 0); // Display GUI controls
        this._canvasContext.restore();
    }
    /**
     * Show GUI over a 'webgl2' canvas
     * @hidden
     */
    _showOverWebGL() {
        const gl = this._canvasContext;
        // Create texture from 2D canvas
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._uiBuffer);
        gl.generateMipmap(gl.TEXTURE_2D);
        // Create and bind a buffer for the vertices
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, GUI.VERTS, gl.STATIC_DRAW);
        gl.useProgram(this._guiShader);
        // Bind vertex position attribute
        const position = gl.getAttribLocation(this._guiShader, 'aVertexPosition');
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
        // Set the texture sampler uniform
        const uSampler = gl.getUniformLocation(this._guiShader, 'uSampler');
        gl.uniform1i(uSampler, 0);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        gl.disable(gl.BLEND);
    }
    /**
     * Create the shader program to overlay a 2D HUD over a 3D canvas
     * @hidden
     */
    _createGuiShaderProgram() {
        const gl = this._canvasContext;
        // Vertex shader program
        const vsSource = `
    precision mediump float;

    uniform vec2 uScale;
    attribute vec3 aVertexPosition;
    varying vec2 vTextureCoord;

    void main(void) {
        gl_Position = vec4(aVertexPosition, 1.0);
        vTextureCoord.x = (1.0 + aVertexPosition.x) * 0.5;
        vTextureCoord.y = (1.0 - aVertexPosition.y) * 0.5;
    }
    `;
        // Fragment shader program
        const fsSource = `
    precision mediump float;

    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;

    void main(void) {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
    `;
        // Compile shaders and link the program
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vsSource);
        gl.compileShader(vertexShader);
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fsSource);
        gl.compileShader(fragmentShader);
        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        return shaderProgram;
    }
    // ##################################################################
    // ###### ++++++++++++++++++++++++++++++++++++++++++++++++++++ ######
    // ######         Factory methods to create controls           ######
    // ###### ++++++++++++++++++++++++++++++++++++++++++++++++++++ ######
    // ##################################################################
    /**
     * <p>Create a pin control.</p>
     * <p>The Pin control is a simple place holder for containing child controls
     * relative to each other.</p>
     * @param id
     * @param x
     * @param y
     * @returns
     */
    pin(id, x, y) {
        return new CvsPin(this, id, x, y);
    }
    /**
     * Create a label control
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @param text optional face text
     * @param icon optional face icon
     * @returns a label
     */
    label(id, x, y, w, h, text, icon) {
        const ctrl = new CvsLabel(this, id, x, y, w, h);
        if (text)
            ctrl.text(text);
        if (icon)
            ctrl.icon(icon);
        return ctrl;
    }
    /**
     * Create a button control
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @param text optional face text
     * @param icon optional face icon
     * @returns a button
     */
    button(id, x, y, w, h, text, icon) {
        const ctrl = new CvsButton(this, id, x, y, w, h);
        if (text)
            ctrl.text(text);
        if (icon)
            ctrl.icon(icon);
        return ctrl;
    }
    /**
     * <p>Create an image button control.</p>
     * <p>The button size is determined by the size of the off-button image. If
     * a second image is provided (optional) then it will be used for the
     * over-button state. In the absence of the second image otherwise a border
     * highlight is used.</p>
     *
     * <p>The button hit-zone is any non-transparent pixel if the off-button
     * image of the mask image if provided. Any pixel with an alpha value
     * &ge;128 is considered non-transparent.</p>
     *
     *
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param images array of images for off-button and over-button states
     * @param mask hit zone image
     * @returns image button control
     */
    image(id, x, y, images, mask) {
        const ctrl = new CvsImage(this, id, x, y, cvsGuiCanvas(images), mask);
        ctrl._makePickImage();
        return ctrl;
    }
    /**
     * Create a slider control
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @returns slider control
     */
    slider(id, x, y, w, h) {
        return new CvsSlider(this, id, x, y, w, h);
    }
    /**
     * Create a ranger control
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @returns ranger control
     */
    ranger(id, x, y, w, h) {
        return new CvsRanger(this, id, x, y, w, h);
    }
    /**
     * Create a single line text input control
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @returns a textfield
     */
    textfield(id, x, y, w, h) {
        this._addKeyEventHandlers();
        return new CvsTextField(this, id, x, y, w, h);
    }
    /**
     * Create a checkbox control
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @param text optional face text
     * @returns a checkbox
     */
    checkbox(id, x, y, w, h, text) {
        const ctrl = new CvsCheckbox(this, id, x, y, w, h);
        if (text)
            ctrl.text(text);
        return ctrl;
    }
    /**
     * Create an option (radio button) control
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @param text optional face text
     * @returns an option button
     */
    option(id, x, y, w, h, text) {
        const ctrl = new CvsOption(this, id, x, y, w, h);
        if (text)
            ctrl.text(text);
        return ctrl;
    }
    /**
     * Create a poster control
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @returns a label
     */
    poster(id, x, y, w, h) {
        return new CvsPoster(this, id, x, y, w, h);
    }
    /**
     * Create a label control
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @returns a label
     */
    panel(id, x, y, w, h) {
        return new CvsPanel(this, id, x, y, w, h);
    }
    /**
     * Create a viewer control
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @returns an image viewer
     */
    viewer(id, x, y, w, h) {
        return new CvsViewer(this, id, x, y, w, h);
    }
    /**
     * Create a joystick control
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @returns a joystick control
     */
    joystick(id, x, y, w, h) {
        return new CvsJoystick(this, id, x, y, w, h);
    }
    /**
     * Create a knob control
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @returns a knob control
     */
    knob(id, x, y, w, h) {
        return new CvsKnob(this, id, x, y, w, h);
    }
    /**
     * Create a scroller control
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @returns scroller control
     * @hidden
     */
    __scroller(id, x, y, w, h) {
        return new CvsScroller(this, id, x, y, w, h);
    }
    /**
     * Description placeholder
     * @param {string} id
     * @returns {CvsTooltip}
     * @hidden
     */
    __tooltip(id) {
        return new CvsTooltip(this, id);
    }
    /**
     * Create a side pane. The pane location is either 'north', 'south',
     * 'east' or 'west'.
     *
     * The pane will fill the whole width/height of the canvas depending on its
     * position. The user controls how far the pane extends into the canvas when
     * open.
     * @param id unique id for this control
     * @param location the pane position ('north', 'south', 'east' or 'west')
     * @param depth the maximum depth the pane expands into the canvas
     * @returns a side pane
     */
    pane(id, location, depth) {
        let ctrl;
        depth = Math.round(depth);
        switch (location) {
            case 'north':
                ctrl = new CvsPaneNorth(this, id, depth);
                break;
            case 'south':
                ctrl = new CvsPaneSouth(this, id, depth);
                break;
            case 'west':
                ctrl = new CvsPaneWest(this, id, depth);
                break;
            case 'east':
            default: ctrl = new CvsPaneEast(this, id, depth);
        }
        return ctrl;
    }
    // ######           End of control factory methods             ######
    // ###### ++++++++++++++++++++++++++++++++++++++++++++++++++++ ######
    // ##################################################################
    /** @returns the canvas context type  */
    // get contextType() { return this._canvas["hasContext"]() }
    /** @returns true gui is over a 3D canvas  */
    get is3D() { return this._is3D; }
    /** @returns 'p5js' if using p5.js else returns 'JS' */
    get mode() { return this._mode; }
    /** @returns an array with the names of built-in color schemes */
    get colorSchemeNames() {
        return Array.from(['blue', 'green', 'red', 'cyan', 'yellow', 'purple', 'orange', 'light', 'dark']);
    }
    /** @returns true if this gui can respond to mouse/key events   */
    get isEnabled() { return this._enabled; }
    /** @returns true if gui rendering is allowed   */
    get isVisible() { return this._visible; }
    /** @returns the display width   */
    get canvasWidth() { return this._canvas.width / this._pr; }
    /** @returns the display height   */
    get canvasHeight() { return this._canvas.height / this._pr; }
    /**
     * Get a grid layout for a given pixel position and size in the display area.
     * Initially the grid repreents a single cell but the number and size of
     * horizontal and vertical cells should be set before creating the controls.
     * @param x left edge position
     * @param y top edge position
     * @param w grid width
     * @param h grid height
     * @returns the grid layout
     */
    grid(x, y, w, h) {
        return new GridLayout(x, y, w, h);
    }
    /**
     * Returns the unique id for this GUI.
     *
     * @returns GUI id
     */
    id() {
        return this._uid;
    }
    /**
     * <p>Gets or sets the global minimum height for pane tabs.</p>
     * @param th the minimum tab height (must be &ge;10)
     * @returns this gui instance
     */
    tabHeight(th) {
        if (th === undefined || !Number.isFinite(th))
            return this._tabMinHeight;
        if (th >= 10)
            this._tabMinHeight = th;
        return this;
    }
    /**
     * Render any controls for this gui
     * @returns this gui
     */
    show() {
        this._visible = true;
        return this;
    }
    /**
     * Hides all the controls for this gui
     * @returns this gui
     */
    hide() {
        this._visible = false;
        return this;
    }
    /**
     * Enable mouse/key event handling for this gui
     * @returns this gui
     */
    enable() {
        this._enabled = true;
        return this;
    }
    /**
     * Disable mouse/key event handling for this gui
     * @returns this gui
     */
    disable() {
        this._enabled = false;
        return this;
    }
    /**
     * Controls how long a tooltip is shown and how long to wait before it can
     * be shown again. This helps avoid the tip flicking on and off as the mouse
     * moves over the control.
     *
     * @param show show duration (ms)
     * @param repeat duration before the tip can be shown again
     * @returns this gui
     */
    tooltipTimes(show = TT_SHOW_TIME, repeat = TT_REPEAT_TIME) {
        this._show_time = show;
        this._repeat_time = repeat;
        return this;
    }
    /**
     * Adds event listeners to the HTML canvas object. It also sets the draw method
     * based on whether the render is WEBGL or P2D
     * @hidden
     */
    _addFocusHandlers() {
        const canvas = this._canvas;
        canvas.addEventListener('focusout', (e) => { this._processFocusEvent(e); });
        canvas.addEventListener('focusin', (e) => { this._processFocusEvent(e); });
    }
    /** @hidden */
    _addMouseEventHandlers() {
        if (!this._mouseListenersCreated) {
            const canvas = this._canvas;
            // Add mouse events
            canvas.addEventListener('mousedown', (e) => { this._processMouseEvent(e); });
            canvas.addEventListener('mouseup', (e) => { this._processMouseEvent(e); });
            canvas.addEventListener('mousemove', (e) => { this._processMouseEvent(e); });
            canvas.addEventListener('wheel', (e) => { this._processMouseEvent(e); });
            // Leave and enter canvas
            canvas.addEventListener('mouseout', (e) => { this._processMouseEvent(e); });
            canvas.addEventListener('mouseenter', (e) => { this._processMouseEvent(e); });
            this._mouseListenersCreated = true;
        }
    }
    /** @hidden */
    _addKeyEventHandlers() {
        if (!this._keyListenersCreated) {
            const keyTarget = document.getElementById(this._canvas.id);
            keyTarget?.setAttribute('tabindex', '0');
            keyTarget?.focus();
            keyTarget?.addEventListener('keydown', (e) => { this._processKeyEvent(e); return false; });
            keyTarget?.addEventListener('keyup', (e) => { this._processKeyEvent(e); return false; });
            this._keyListenersCreated = true;
        }
    }
    /** @hidden */
    _addTouchEventHandlers() {
        if (!this._touchListenersCreated) {
            const canvas = this._canvas;
            canvas.addEventListener('touchstart', (e) => { this._processTouchEvent(e); });
            canvas.addEventListener('touchend', (e) => { this._processTouchEvent(e); });
            canvas.addEventListener('touchmove', (e) => { this._processTouchEvent(e); });
            canvas.addEventListener('touchcancel', (e) => { this._processTouchEvent(e); });
            this._touchListenersCreated = true;
        }
    }
    // ===============================================================================
    //     Event handlers
    /** @hidden */
    _processMouseEvent(e) {
        if (this._visible && this._enabled) {
            const rect = this._canvas.getBoundingClientRect();
            this._processEvent(e, e.clientX - rect.left, e.clientY - rect.top);
            // e.preventDefault();
        }
    }
    /** @hidden */
    _processTouchEvent(e) {
        if (this._visible && this._enabled) {
            const rect = this._canvas.getBoundingClientRect();
            const te = e.changedTouches[0];
            this._processEvent(e, te.clientX - rect.left, te.clientY - rect.top);
            // e.preventDefault();
        }
    }
    /**
     * Process mouse and touch events provided the active control is not
     * a textfield.
     * @param e the mouse or touch event
     * @param x the x position in the canvas
     * @param y the y position in the canvas
     * @hidden
     */
    _processEvent(e, x, y) {
        this._mouseX = x;
        this._mouseY = y;
        if (e.type == 'mouseout') {
            if (this._currOver)
                this._currOver.over = false;
            if (this._prevOver)
                this._prevOver.over = false;
        }
        // Ignore mouse / touch events while we have an active textfield
        if (this._activeCtrl instanceof CvsTextField)
            return;
        const over = this.getPicked(x, y);
        this._currOver = over.control;
        // Determine if we have entered current over control
        const enter = this._currOver && this._currOver != this._prevOver;
        if (this._activeCtrl) {
            this._activeCtrl = this._activeCtrl._doEvent(e, x, y, over, enter);
        }
        else {
            // Check for highlighting as pointer moves over a control
            if (e.type == 'mousemove' || e.type == 'touchmove') {
                this._prevOver?._doEvent(e, x, y, over, false);
                this._currOver?._doEvent(e, x, y, over, enter);
            }
            else {
                // If we are over a control then let it handle the event
                this._activeCtrl = this._currOver?._doEvent(e, x, y, over, enter);
            }
        }
        this._prevOver = this._currOver;
    }
    /**
     * Process the key event if the active control is a CvsTextField
     * @hidden
     * @param e keyboard event
     */
    _processKeyEvent(e) {
        // Pass the event if the active control is a CvsTextField
        if (this._visible && this._enabled && this._activeCtrl instanceof CvsTextField)
            this._activeCtrl = this._activeCtrl._doKeyEvent(e);
    }
    /** @hidden */
    _processFocusEvent(e) {
        // CLOG(`Focus event ${this._activeCtrl?.id}`);
        switch (e.type) {
            case 'focusout':
                if (this._activeCtrl instanceof CvsTextField) {
                    this._activeCtrl._deactivate();
                    this._activeCtrl = null;
                }
                break;
            case 'focusin':
                break;
        }
    }
    /** @returns mouse x position relative to top-left corner of the canvas */
    get mouseX() { return this._mouseX; }
    /** @returns mouse y position relative to top-left corner of the canvas */
    get mouseY() { return this._mouseY; }
    //     End of Event handlers
    // ===============================================================================
    /**
     * <p>Get the control given it's unique id.</p>
     * @param id unique ID for the control to find
     * @returns  get the associated control
     */
    $(id) {
        return (typeof id === "string") ? this._controls.get(id) : id;
    }
    registerID(control) {
        CASSERT(!this._controls.has(control.id), `Control '${control.id}' already exists and will be replaced.`);
        // Map control by ID
        this._controls.set(control.id, control);
        // Now find render order
        this._ctrls = [...this._controls.values()];
        this.setRenderOrder();
        return control;
    }
    /**
     * <p>Register a control so it is pickable.</p>
     * <p>If the control has already been registered it will be unchanged.</p>
     *
     * @param control the control to make pickable
     */
    registerPickable(control) {
        if (control && !this._control2color.has(control)) {
            this._control2color.set(control, this._NEXT_COLOR);
            this._color2control.set(this._NEXT_COLOR, control);
            this._NEXT_COLOR += this._COLOR_STEP;
        }
    }
    /**
     * Add an object so it can be detected using this pick buffer.
     * @param control the object to add
     * @hidden
     */
    register(control) {
        if (control && !this._control2color.has(control)) {
            this._control2color.set(control, this._NEXT_COLOR);
            this._color2control.set(this._NEXT_COLOR, control);
            this._NEXT_COLOR += this._COLOR_STEP;
        }
    }
    /**
     * Sorts the controls so that they are rendered in order of their z
     * value (low z --> high z).
     * @hidden
     */
    setRenderOrder() {
        this._ctrls.sort((a, b) => { return a.z - b.z; });
    }
    /**
     * Remove this object so it can't be detected using this pick buffer.
     * @param control the object to remove
     * @hidden
     */
    deregister(control) {
        if (control && this._control2color.has(control)) {
            const pc = this._control2color.get(control);
            this._control2color.delete(control);
            this._color2control.delete(pc);
        }
    }
    /**
     * <p>Get the pick color associated with the control. If the control is
     * pickable it will return an object describing the pick color otherwise
     * it returns the color 'white'</p>
     *
     * @hidden
     * @param control the control we are interested in.
     * @returns the pick color descriptor object
     */
    pickColor(control) {
        if (this._control2color.has(control)) {
            const pc = this._control2color.get(control);
            const [r, g, b] = [(pc >> 16) & 0xFF, (pc >> 8) & 0xFF, pc & 0xFF];
            return { r: r, g: g, b: b, cssColor: `rgb(${r} ${g} ${b})` };
        }
        return { r: 255, g: 255, b: 255, cssColor: 'white' };
    }
    /**
     * Display a 2D buffer in a canvas element with the specified ID.
     *
     * An existing HTML element with this ID that is not a canvas element this
     * will be ignored and the buffer will not be displayed.
     *
     * An exising HTML canvas element with this ID will be used to display the
     * buffer, if not it will be created and appended to the body section.
     *
     * @param cvsID the ID (string) of the HTML canvas element to use.
     * @param buffer the 2D canvas to display.
     */
    showBuffer(cvsID, buffer = this._pkBuffer) {
        let ele = document.getElementById(cvsID);
        if (!ele) { // Create the HTML canvas element if it doesn't exist
            ele = document.createElement('canvas');
            ele.setAttribute('id', cvsID);
            document.getElementsByTagName('body')[0].append(ele);
        }
        if (ele instanceof HTMLCanvasElement) {
            ele.setAttribute('width', `${buffer.width}`);
            ele.setAttribute('height', `${buffer.height}`);
            ele.setAttribute('padding', '3px');
            ele.style.border = '2px solid #FF0000';
            const ctx = ele.getContext('2d');
            ctx?.drawImage(buffer, 0, 0, buffer.width, buffer.height, 0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    }
    /**
     * List the controls and their buffers.
     * @hidden
     */
    listBuffers() {
        CLOG('----------------------   List of Buffers    ---------------------');
        for (let [id, ctrl] of this._controls) {
            const bs = ctrl.bufferStatus;
            const uic = bs.ui ? 'Y' : 'N';
            const pkc = bs.pk ? 'Y' : 'N';
            const pickable = this._control2color.has(ctrl) ? "Y" : "N";
            const id = `${ctrl.type}   ${ctrl.id}  ................................`
                .substring(0, 30);
            CLOG(`${id}    ui: ${uic}     pk: ${pkc}     pickable:${pickable}`);
        }
        CLOG('-----------------------------------------------------------------');
    }
    /**
     * <p>Gets the option group associated with a given name. If the group
     * does not exist create it.</p>
     * @param name the name of the option group
     * @returns the maatching option group
     * @hidden
     */
    getOptionGroup(name) {
        let og = this._optionGroups.get(name);
        if (!og) {
            og = new CvsOptionGroup(name);
            this._optionGroups.set(name, og);
        }
        return og;
    }
    /**
     * Sets the global default icon for checkboxes and option buttons.
     * @param size iscon size (pixels)
     * @returns
     */
    iconSize(size) {
        if (!Number.isFinite(size))
            return this._iSize;
        this._iSize = Math.ceil(size);
        this._ctrls.forEach((c) => {
            if (c instanceof CvsCheckbox || c instanceof CvsOption)
                c.invalidateBuffer();
        });
        return this;
    }
    /**
     * <p>Sets or gets the global text size.</p>
     * <p>If no parameter is passed then the global text size is returned
     * otherwise it returns this gui.</p>
     * @param tsize new global text size
     * @returns the global text size or this gui
     */
    textSize(tsize) {
        if (!Number.isFinite(tsize))
            return this._tSize;
        this._tSize = Number(tsize);
        // Update visual for all controls
        this._ctrls.forEach((c) => { c.invalidateBuffer(); });
        return this;
    }
    /**
     * <p>If no parameter is passed then the global font family name will be
     * returned.</p>
     * <p>If a parameter is provided it will be accepted if it is one of the
     * following :-</p>
     * <ul>
     * <li>The font family name of a TTF system font e.g. 'arial',
     * 'courier new', 'times new roman' ...</li>
     * <li>The name of a logical font e.g. 'serif', 'sans-serif',
     * 'monospace' ...</li>
     * <li>A font loaded in p5js with the <code>loadFont()</code>
     * function.</li>
     * </ul>
     * <p>Any other parameter value will display a warning and be ignored
     * leaving the font unchanged.</p>
     *
     * @param font system or logical font, a FontFace object or a p5js
     * font object.
     * @returns this control
     */
    textFont(font) {
        const fface = cvsGuiFont(font);
        if (fface)
            this._tFace = fface;
        else
            CWARN(`'${font?.toString()}' is unrecognized so will be ignored!`);
        return this;
    }
    /**
     * <p>Sets or gets the global text style.</p>
     * <p>The following strings are recognised as valid styles :-</p>
     * <pre>
     * 'normal'  'bold'  'thin'  'italic'
     * 'bold italic'  'thin italic'  'oblique'
     * </pre>
     * <p>It will also accept the 4 p5js constants :-</p>
     * <pre>
     * NORMAL    BOLD   ITALIC   BOLDITALIC
     * </pre>
     * <p>Unrecognized styles are ignored and the global style left
     * unchanged.</p>
     * <p>If no parameter is passed then the current global style is
     * returned.</p>
     *
     * @param style the font style to use.
     * @returns this control
     */
    textStyle(style) {
        if (!style)
            return this._tStyle; // getter
        style = _validateTextStyle(style);
        if (style)
            this._tStyle = style;
        return this;
    }
    /**
     * Sets or gets the global tip text size.
     * If no parameter is passed then the global tip text size is returned
     * otherwise it returns this control
     * @param gtts new global tip text size
     * @returns the global tip text size or this control
     */
    tipTextSize(gtts) {
        if (gtts) {
            this._tipTextSize = gtts;
            return this;
        }
        return this._tipTextSize;
    }
    /**
     * <p>Get or set the default corner radii used in this GUI.</p>
     * <p>To set the radii the parameters must be one of the following</p>
     * <ul>
     * <li>an array of 4 numbers.</li>
     * <li>a comma seperated list of 4 numbers.</li>
     * <li>a single number to be used for all 4 radii.</li>
     * </ul>
     * <p>If no parameter is passed or does not match one of the above then an
     * array of the currently used radii values.</p>
     *
     * @param c valid radii combination
     * @returns an array of the currently used radii values
     */
    corners(...c) {
        switch (c.length) {
            case 0: // Getter
                return [...this._corners];
            case 4:
                this._corners = [...c];
                break;
            case 1:
                if (Array.isArray(c[0]) && c[0].length == 4)
                    this._corners = [...c[0]];
                else
                    this._corners = [c[0], c[0], c[0], c[0]];
                break;
        }
        return this;
    }
    /**
     * Close all side panes (replaces _closeAll)
     * @hidden
     */
    _closePanes() {
        for (const pane of this._panesEast)
            pane.close();
        for (const pane of this._panesWest)
            pane.close();
        for (const pane of this._panesSouth)
            pane.close();
        for (const pane of this._panesNorth)
            pane.close();
    }
    /**
     * Hide all side panes. This will also close any pane that is open.<br>
     */
    hidePanes() {
        this._closePanes();
        for (const pane of this._panesEast)
            pane.hide();
        for (const pane of this._panesWest)
            pane.hide();
        for (const pane of this._panesSouth)
            pane.hide();
        for (const pane of this._panesNorth)
            pane.hide();
    }
    /**
     * Show all pane tabs. All panes will be shown closed.
     */
    showPanes() {
        for (const pane of this._panesEast)
            pane.show();
        for (const pane of this._panesWest)
            pane.show();
        for (const pane of this._panesSouth)
            pane.show();
        for (const pane of this._panesNorth)
            pane.show();
    }
    /**
     * Reposition all tabs attached to East side
     * @hidden
     */
    validateTabsEast() {
        const panes = this._panesEast;
        let sum = panes
            .map(pane => pane.TAB._w)
            .reduce((x, y) => x + y, 2 * (panes.length - 1));
        // Now find start position for the first tab
        let pos = (this.canvasHeight - sum) / 2;
        panes.forEach(pane => {
            pane._updateLocation(pos, this.canvasWidth, this.canvasHeight);
            pos += pane.TAB._w + 2;
        });
    }
    /**
     * Reposition all tabs attached to West side
     * @hidden
     */
    validateTabsWest() {
        const panes = this._panesWest;
        let sum = panes
            .map(pane => pane.TAB._w)
            .reduce((x, y) => x + y, 2 * (panes.length - 1));
        // Now find start position for the first tab
        let pos = (this.canvasHeight - sum) / 2;
        panes.forEach(pane => {
            pane._updateLocation(pos, this.canvasWidth, this.canvasHeight);
            pos += pane.TAB._w + 2;
        });
    }
    /**
     * Reposition all tabs attached to South side
     * @hidden
     */
    validateTabsSouth() {
        const panes = this._panesSouth;
        let sum = panes
            .map(pane => pane.TAB._w)
            .reduce((x, y) => x + y, 2 * (panes.length - 1));
        // Now find start position for the first tab
        let pos = (this.canvasWidth - sum) / 2;
        panes.forEach(pane => {
            pane._updateLocation(pos, this.canvasWidth, this.canvasHeight);
            pos += pane.TAB._w + 2;
        });
    }
    /**
     * Reposition all tabs attached to North side
     * @hidden
     */
    validateTabsNorth() {
        const panes = this._panesNorth;
        let sum = panes
            .map(pane => pane.TAB._w)
            .reduce((x, y) => x + y, 2 * (panes.length - 1));
        // Now find start position for the first tab
        let pos = (this.canvasWidth - sum) / 2;
        panes.forEach(pane => {
            pane._updateLocation(pos, this.canvasWidth, this.canvasHeight);
            pos += pane.TAB._w + 2;
        });
    }
    /** @hidden */
    _initColorSchemes() {
        this._scheme = new BlueScheme();
        this._schemes
            .set('blue', this._scheme)
            .set('green', new GreenScheme())
            .set('red', new RedScheme())
            .set('cyan', new CyanScheme())
            .set('yellow', new YellowScheme())
            .set('purple', new PurpleScheme())
            .set('orange', new OrangeScheme())
            .set('light', new LightScheme())
            .set('dark', new DarkScheme());
    }
    /**
     * <p>Set or get the existing global color scheme.</p>
     * @param csName name of the color scheme to set
     * @returns this gui instance
     */
    scheme(csName) {
        if (!csName) {
            return this._scheme;
        }
        // set global scheme and invalidate any controls using the global scheme
        const scheme = this._schemes.get(csName);
        if (scheme) {
            this._scheme = scheme;
            // Invalidate all controls
            this._ctrls.forEach((c) => c.invalidateBuffer());
        }
        else
            CWARN(`'${csName}' is not a valid color scheme`);
        return this;
    }
    /**
     * <p>Get the named color scheme.</p>
     * @param csName the name of the color scheme
     * @returns the color scheme or undefined if it doesn't exist
     */
    getScheme(csName) {
        const scheme = this._schemes.get(csName);
        if (scheme)
            return scheme;
        CWARN(`Unable to retrieve color scheme '${csName}'`);
        return undefined;
    }
    /**
     * <p>This will create a new color scheme from an existing one. The returned
     * scheme is a deep-copy of the source scheme and should be edited before
     * adding it to the GUI with  the addScheme(...) method. The name of the
     * new scheme is specified in the first parameter and cannot be changed later.</p>
     * <p>The method will fail if -</p>
     * <ul>
     * <li>either parameter is not a string of length &gt;0, or</li>
     * <li>destination and source names are equal (case insensitve comparison), or</li>
     * <li>the source scheme does not exist.</li>
     * </ul>
     *
     * @param userName a unique name for the user's color scheme.
     * @param srcName the name of an existing color scheme.
     * @returns the new color scheme or null if unable to create it.
     */
    createScheme(userName = '', srcName = '') {
        const srcScheme = this.getScheme(srcName);
        if (!srcScheme) {
            CWARN(`The source scheme '${srcName}', does not exist.`);
            return undefined;
        }
        if (typeof userName !== "string" || userName.length === 0) {
            CWARN(`Inavlid name for the user color scheme.`);
            return undefined;
        }
        return new UserColorScheme(userName, srcScheme);
    }
    /**
     * <p>Adds a new color scheme to those already available. It does not replace an
     * existing scheme.</p>
     * @param scheme  the color scheme
     * @returns this gui instance
     */
    addScheme(scheme) {
        if (!(scheme instanceof ColorScheme)) {
            CWARN(`The parameter is not a valid color scheme so can't be used.`);
        }
        else if (this._schemes.has(scheme.name))
            CERROR(`Cannot add scheme '${scheme.name}' because it already exists.'`);
        else
            this._schemes.set(scheme.name, scheme);
        return this;
    }
    /**
     * <p>If the [x, y] display position is over a controls pick region then
     * return an object containing the 'control' and the pick region ('part')
     * number.</p>
     * @param x horizontal pixel location
     * @param y vertical pixel location
     * @returns an object containing the control hit and the control part number
     */
    getPicked(x, y) {
        x *= this._pr;
        y *= this._pr;
        const pkb = this._pkBuffer;
        const result = { control: null, part: -1 };
        if (x >= 0 && x < pkb.width && y >= 0 && y < pkb.height) {
            const rgb = this.getPickColor(x, y);
            const ctl_col = rgb & this._COLOR_MASK;
            result.control = this._color2control.get(ctl_col);
            result.part = rgb & this._PART_MASK;
        }
        return result;
    }
    getPickColor(x, y) {
        const imgData = this._pkBuffer.getContext('2d')?.getImageData(x, y, 1, 1);
        const r = imgData?.data[0] ?? 255;
        const g = imgData?.data[1] ?? 255;
        const b = imgData?.data[2] ?? 255;
        const rgb = (r << 16) + (g << 8) + b;
        return rgb;
    }
    /** @hidden */
    static ANNOUNCE_CANVAS_GUI() {
        if (GUI._guis.size == 0) {
            CLOG('================================================');
            CLOG(`  canvasGUI (${CANVAS_GUI_VERSION})   \u00A9 2025 Peter Lager`);
            CLOG('================================================');
        }
    }
    /**
     * <p>Get the GUI with the given id. If no such GUI exists then the
     * function returns undefined. </p>
     * <p>The global function getGUI(...) is an alternative method that
     * accepts the same parameters performs exactly the same task.</p>
     * @param id the GUI id
     * @returns the matching GUI controller or undefined if not found.
     */
    static $$(id) {
        return GUI._guis.get(id);
    }
    /**
     * <p>After V2.0 this method was marked as private and should not be used.</p>
     * <p>The global method <code>createGUI(...)</code> method <b><i>must</i></b>
     * be used instead.</p>
     *
     * @param id unique id for the GUI
     * @param canvas the HTMLCanvasElement or a value that can be used to find
     * the HTMLCanvasElement used for the display
     * @returns a GUI controller existing or new GUI with the given id.
     * @hidden
     */
    static _create(id, canvas, pr, mode) {
        GUI.ANNOUNCE_CANVAS_GUI();
        if (GUI._guis.has(id)) {
            CWARN(`You already have a GUI called '${id} it will not be replaced.`);
            return GUI._guis.get(id);
        }
        // Need to create a GUI for this canvas
        let gui = new GUI(id, canvas, pr, mode);
        GUI._guis.set(id, gui);
        return gui;
    }
}
/** canvasGUI version */
GUI.VERSION = '3.0.0';
// Remember all GUIs created are accessible using gui's unique string
// identifier.
/** @hidden */ GUI._guis = new Map();
// Vertices used in shader program to reneder gui over WebGL2 canvas
/** @hidden */ GUI.VERTS = new Float32Array([-1, -1, 0, -1, 1, 0, 1, 1, 0, 1, -1, 0]);
/**
 *
 * <h2>Creates and returns a GUI controller.</h2>
 * <p><b><em>This function must be used when creating a GUI.</em></b></p>
 *
 * <p>If no 'id' is passed to the function canvasGUI will generate a random
 * 'id'. If there is a pre-exisiting gui with the id provided it will be returned
 * instead of creating a new one.</p>
 *
 * <p>The second parameter must be the one of the following :</p>
 * <ul>
 * <li>an existing HTML canvas element</li>
 * <li>the id of an existing HTML canvas element</li>
 * <li>if using p5js then value returned by the <code>createCanvas()'</code>
 * method when executed in the <code>setup()'</code> function.</li>
 * </ul>
 * <p>Any other value will result the program being terminated with an
 * error</p>
 *
 * @param id unique id for the GUI
 * @param display something that identifies the display canvas element.
 * @returns a GUI controller with the given id.
 */
const createGUI = function (id, display) {
    if (arguments.length === 1) {
        display = arguments[0];
        id = `#${Math.floor(1111 + 8888 * Math.random())}`;
        CWARN(`Since no 'id' was provided this GUI will be called '${id}'.`);
    }
    const elt = typeof display === 'string'
        ? document.getElementById(display)
        : display;
    // The canvas element exists.
    if (elt instanceof HTMLCanvasElement) {
        const is_p5js = elt.className.startsWith('p5Canvas');
        const dp = is_p5js ? devicePixelRatio : 1;
        const mode = is_p5js ? 'p5js' : 'JS';
        return GUI._create(id, elt, dp, mode);
    }
    // See if p5js
    if (typeof display === 'object') {
        const ctor = display.constructor.name;
        if (ctor == 'Renderer2D' || ctor == 'RendererGL')
            return GUI._create(id, display.canvas, devicePixelRatio, 'p5js');
    }
    throw new Error(`Cannot find the canvas element for the GUI '${id}'`);
};
/**
 * <p>Get the GUI with the given unique id. If no such GUI exists then the
 * function returns undefined. </p>
 * @param id the GUI id
 * @returns the matching GUI controller or undefined if not found.
 */
const getGUI = function (id) {
    return GUI.$$(id);
};
//# sourceMappingURL=canvas_gui.js.map
/**
 * The parent class for all color schemes.
 * @hidden
 */
class ColorScheme {
    /** @hidden */
    constructor(name = 'color scheme name') {
        /** @hidden */
        this._colors = [];
        /** @hidden */
        this._greys = [];
        /** @hidden */
        this._tints = [];
        /** @hidden */
        this._name = 'color scheme name';
        /**@hidden */
        this._original = true;
        this._name = name;
        this._tints = [[0, 13], [0, 19], [0, 77], [0, 153]];
        this._greys = [[255], [204], [179], [153], [128], [102], [77], [51], [26], [0]];
    }
    /** Get the name of this color scheme e.g. 'green', 'blue' ...  */
    get name() { return this._name; }
    /** @hidden */
    set name(v) { CWARN(`Cannot change the name of a library color scheme.`); }
    /**
     * <p>Returns true if this scheme is one of the canvasGUI library color
     * schemes and false for a user defined scheme.</p>
     */
    get isOriginal() { return this._original; }
    /** @hidden */
    C(n, alpha = 255) {
        alpha = Math.floor((alpha < 0 ? 0 : alpha > 255 ? 255 : alpha));
        return [...this._colors[n], alpha];
    }
    /** @hidden */
    C$(n, alpha = 255) {
        let a = alpha < 0 ? 0 : alpha > 255 ? 255 : alpha;
        a = Math.floor(a / 0.255) / 10;
        const [r, g, b] = this._colors[n];
        return a == 100 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${a}%)`;
    }
    /** @hidden */
    G(n, alpha = 255) {
        alpha = Math.floor((alpha < 0 ? 0 : alpha > 255 ? 255 : alpha));
        return [...this._greys[n], alpha];
    }
    /** @hidden */
    G$(n, alpha = 255) {
        let a = alpha < 0 ? 0 : alpha > 255 ? 255 : alpha;
        a = Math.floor(a / 0.255) / 10;
        const [g] = this._greys[n];
        return a == 100 ? `rgb(${g} ${g} ${g})` : `rgb(${g} ${g} ${g} / ${a}%)`;
    }
    /** @hidden */
    T(n) { return this._tints[n]; }
    /** @hidden */
    T$(n) {
        let [t, a] = this._tints[n];
        a = Math.floor(a / 0.255) / 10;
        return `rgb(${t} ${t} ${t} / ${a}%)`;
    }
    /** @hidden */
    _deepCopyArray2D(a) {
        const b = [];
        a.forEach(v => b.push([...v]));
        return b;
    }
}
/**
 * <p>User color scheme</p>
 * @hidden
 */
class UserColorScheme extends ColorScheme {
    constructor(name, scheme) {
        super(name);
        this._original = false;
        this._tints = this._deepCopyArray2D(scheme._tints);
        this._greys = this._deepCopyArray2D(scheme._greys);
        this._colors = this._deepCopyArray2D(scheme._colors);
    }
    /**
     * <p>Change the name of this user color scheme.</p>
     */
    set name(n) { this._name = n; }
    /**
     * Get a deep copy of the tints array which can then be edited. Changes to
     * the copy will not change the color scheme unless the matching setter is
     * called.
     */
    getTints() {
        return this._deepCopyArray2D(this._tints);
    }
    /**
     * Get a deep copy of the tints array which can then be edited. Changes to
     * the copy will not change the color scheme unless the matching setter is
     * called.
     */
    getGreys() {
        return this._deepCopyArray2D(this._greys);
    }
    /**
     * <p>Get a deep copy of the colors array which can then be edited. Changes
     * to the copy will not change the color scheme unless the matching set
     * method is called.</p>
     */
    getColors() {
        return this._deepCopyArray2D(this._colors);
    }
    /**
     * <p>Replaces the scheme's tints array.</p>
     * <p>No error checking is performed so invalid parameter values
     * may cause the sketch to crash.</p>
     * @param tints
     */
    setTints(tints) {
        this._tints = tints;
    }
    /**
     * <p>Replaces the scheme's tints array.</p>
     * <p>No error checking is performed so invalid parameter values
     * may cause the sketch to crash.</p>
     * @param greys
     */
    setGreys(greys) {
        this._greys = greys;
    }
    /**
     * <p>Replaces the scheme's colors array.</p>
     * <p>No error checking is performed so invalid parameter values
     * may cause the sketch to crash.</p>
     * @param colors
     */
    setColors(colors) {
        this._colors = colors;
    }
}
class BlueScheme extends ColorScheme {
    constructor() {
        super('blue');
        this._colors = [
            [230, 236, 255], [204, 218, 255], [179, 199, 255], [153, 180, 255],
            [102, 143, 255], [69, 112, 230], [41, 84, 204], [19, 65, 191],
            [15, 52, 153], [10, 35, 102]
        ];
    }
}
class GreenScheme extends ColorScheme {
    constructor() {
        super('green');
        this._colors = [
            [230, 255, 230], [204, 255, 204], [179, 255, 179], [153, 255, 153],
            [102, 255, 102], [69, 230, 69], [41, 204, 41], [19, 191, 19],
            [12, 80, 12], [8, 64, 8]
        ];
    }
}
class RedScheme extends ColorScheme {
    constructor() {
        super('red');
        this._colors = [
            [255, 230, 230], [255, 204, 204], [255, 179, 179], [255, 153, 153],
            [255, 102, 102], [230, 69, 69], [204, 41, 41], [191, 19, 19],
            [153, 15, 15], [102, 10, 10]
        ];
    }
}
class CyanScheme extends ColorScheme {
    constructor() {
        super('cyan');
        this._colors = [
            [230, 255, 255], [204, 255, 255], [179, 255, 255], [153, 255, 255],
            [102, 255, 255], [69, 230, 230], [41, 204, 204], [19, 191, 191],
            [15, 96, 96], [10, 80, 80]
        ];
    }
}
class YellowScheme extends ColorScheme {
    constructor() {
        super('yellow');
        this._colors = [
            [255, 255, 230], [255, 255, 204], [255, 255, 179], [255, 255, 153],
            [255, 255, 102], [230, 230, 69], [204, 204, 41], [191, 191, 19],
            [96, 96, 15], [80, 80, 10]
        ];
    }
}
class PurpleScheme extends ColorScheme {
    constructor() {
        super('purple');
        this._colors = [
            [255, 230, 255], [255, 204, 255], [255, 179, 255], [255, 153, 255],
            [255, 102, 255], [230, 69, 230], [204, 41, 204], [191, 19, 191],
            [153, 15, 153], [102, 10, 102]
        ];
    }
}
class OrangeScheme extends ColorScheme {
    constructor() {
        super('orange');
        this._colors = [
            [255, 242, 230], [255, 230, 204], [255, 217, 179], [255, 204, 153],
            [255, 179, 102], [230, 149, 69], [204, 122, 41], [191, 105, 19],
            [140, 77, 13], [102, 56, 10]
        ];
    }
}
class LightScheme extends ColorScheme {
    constructor() {
        super('light');
        this._colors = [
            [254, 254, 254], [228, 228, 228], [203, 203, 203], [177, 177, 177],
            [152, 152, 152], [127, 127, 127], [101, 101, 101], [76, 76, 76],
            [50, 50, 50], [25, 25, 25]
        ];
    }
}
class DarkScheme extends ColorScheme {
    constructor() {
        super('dark');
        this._colors = [
            [0, 0, 0], [25, 25, 25], [50, 50, 50], [76, 76, 76], [101, 101, 101],
            [127, 127, 127], [152, 152, 152], [177, 177, 177], [203, 203, 203],
            [228, 228, 228]
        ];
        this._tints = [[102, 160], [131, 172], [191, 204], [226, 230]];
        this._greys = this._greys.reverse();
    }
}
//# sourceMappingURL=colorschemes.js.map
/*
##############################################################################
ORIENTATIONS
These four classes allows the used to orientate any visual control (except
side panes) in one of the four cardinal compass directions. The default
direction is east i.e. left-to-right.

The position supplied when creating a control represents the top-left corner
of the control irrespective of the orientation specified.
##############################################################################
*/
class OrientNorth {
    getTransform(w, h) {
        return { tx: 0, ty: w, rot: 1.5 * Math.PI };
    }
    xy(x, y, w, h) {
        return [w - y, x, h, w];
    }
    wh(w, h) {
        return [h, w];
    }
}
class OrientSouth {
    getTransform(w, h) {
        return { tx: h, ty: 0, rot: 0.5 * Math.PI };
    }
    xy(x, y, w, h) {
        return [y, h - x, h, w];
    }
    wh(w, h) {
        return [h, w];
    }
}
class OrientEast {
    getTransform(w, h) {
        return { tx: 0, ty: 0, rot: 0 };
    }
    xy(x, y, w, h) {
        return [x, y, w, h];
    }
    wh(w, h) {
        return [w, h];
    }
}
class OrientWest {
    getTransform(w, h) {
        return { tx: w, ty: h, rot: Math.PI };
    }
    xy(x, y, w, h) {
        return [w - x, h - y, w, h];
    }
    wh(w, h) {
        return [w, h];
    }
}
//# sourceMappingURL=orientations.js.map
/**
 *
 * <p>This control is a placeholder for other controls (its children). It has
 * a position but no visual representation.</p>
 *
 * <p>Its children will be shown relative to the pins xy position.</p>
 */
class CvsPin {
    constructor(gui, id, x, y) {
        /** @hidden */ this._children = [];
        /** @hidden */ this._x = 0;
        /** @hidden */ this._y = 0;
        /** @hidden */ this._z = 0;
        /** @hidden */ this._visible = false;
        /** @hidden */ this._enabled = false;
        /** @hidden */ this._bufferInvalid = true;
        this._gui = gui;
        this._id = id;
        this._x = Math.round(x);
        this._y = Math.round(y);
        this._gui.registerID(this);
    }
    /** The unique identifier for this control.   */
    get id() { return this._id; }
    /**
     * The type name for this control.<br>
     * (type name = class name without the <code>Cvs</code> prefix)
     */
    get type() { return this.constructor.name.substring(3); }
    ;
    /** @hidden */
    get x() { return this._x; }
    /** @hidden */
    set x(v) { this._x = Math.round(v); }
    /** @hidden */
    get y() { return this._y; }
    /** @hidden */
    set y(v) { this._y = Math.round(v); }
    /** @hidden */
    get z() { return this._z; }
    /** @hidden */
    set z(v) { this._z = v; }
    /**
     * <p>This is true if the control can respond to UI events else false.</p>
     * <p>Use <code>enable()</code> and <code>disable()</code> to enable and disable it.</p>
     */
    get isEnabled() { return this._enabled; }
    /**
     * <p>This is true if the control is visible else false.</p>
     * <p>Use <code>hide()</code> and <code>show()</code> to set visibility.</p>
     */
    get isVisible() { return this._visible; }
    // /**
    //  * <p>Sets the visibility of this control.</p>
    //  * <p>It is an alternative to using show and hide.</p>
    //  */
    // set visible(v) { this._visible = v }
    // /**
    //  * <p>Gets the visibility of this control.</p>
    //  * <p>It is an alternative to using isVisible.</p>
    //  */
    // get visible() { return this._visible }
    /**
     * Test function to show existing puffers
     * @hidden
     */
    get bufferStatus() { return { ui: false, pk: false }; }
    /**
     * Move this control to an absolute position.
     * @param x horizontal position
     * @param y vertical position
     * @returns this control
     */
    moveTo(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    /**
     * Move this control relative to current position.
     * @param x horizontal distance
     * @param y vertical distance
     * @returns this control
     */
    moveBy(x, y) {
        this.x += x;
        this.y += y;
        return this;
    }
    /**
     * <p>Calculates the absolute position on the canvas taking into account
     * any ancestors.</p>
     * @returns the actual position in the canvas
     * @hidden
     */
    getAbsXY() {
        if (!this._parent) {
            return { x: this._x, y: this._y };
        }
        else {
            let pos = this._parent.getAbsXY();
            pos.x += this._x;
            pos.y += this._y;
            return pos;
        }
    }
    /**
     * <p>Adds this control to another control which becomes its parent.</p>
     * @param parent is the parental control or its id
     * @param rx x position relative to parent
     * @param ry  y position relative to parent
     * @returns this control
     */
    parent(parent, rx, ry) {
        const prnt = this._gui.$(parent);
        if (prnt) {
            prnt.addChild(this, rx, ry);
            this.z = prnt.z + DELTA_Z;
            this._gui.setRenderOrder();
        }
        return this;
    }
    /**
     * <p>Add a child to this control using its relative position [rx, ry].
     * If rx and ry are not provided then it uses the values set in the child.</p>
     * @param child is the actual control or its id
     * @returns this control
     */
    addChild(child, rx, ry) {
        const control = this._gui.$(child);
        if (control) {
            rx = !Number.isFinite(rx) ? control.x : Number(rx);
            ry = !Number.isFinite(ry) ? control.y : Number(ry);
            // If the control already has a parent remove it ready for new parent.
            if (!control._parent)
                control.leaveParent();
            // Position and add parent to control control
            control.x = rx;
            control.y = ry;
            control._parent = this;
            control.z = this.z + DELTA_Z;
            this._children.push(control);
            this._gui.setRenderOrder();
        }
        return this;
    }
    /**
     * <p>Remove a child control from this one so that it stays in same screen position.</p>
     * @param child the control to remove or its id
     * @returns this control
     */
    removeChild(child) {
        const control = this._gui.$(child);
        if (control) {
            for (let i = 0; i < this._children.length; i++) {
                if (control === this._children[i]) {
                    let pos = control.getAbsXY();
                    control._x = pos.x;
                    control._y = pos.y;
                    control._parent = null;
                    this._children[i] = undefined;
                    break;
                }
            }
            this._children = this._children.filter(Boolean);
            this._gui.setRenderOrder();
        }
        return this;
    }
    /**
     * <p>Remove this control from its parent</p>
     * @returns this control
     */
    leaveParent() {
        if (this._parent) {
            this._parent.removeChild(this);
            this.z = 0;
        }
        return this;
    }
    /**
     * @hidden
     */
    getParent() {
        return this._parent;
    }
    /**
     * <p>Enables this control and all its children.</p>
     * @param cascade if true enable child controls
     * @returns this control
     */
    enable(cascade) {
        cascade = true;
        if (cascade)
            for (let c of this._children)
                c.enable(cascade);
        return this;
    }
    /**
     * <p>Disables this control and all its children.</p>
     * @param cascade if true disable child controls
     * @returns this control
     */
    disable(cascade) {
        cascade = true;
        if (cascade)
            for (let c of this._children)
                c.disable(cascade);
        return this;
    }
    /**
     * An alternative to the enable / disable methods.
     *
     * @param enable true / false
     * @param cascade  true apply to all children
     * @returns this control
     */
    setEnabled(enable, cascade) {
        if (enable)
            return this.enable(cascade);
        else
            return this.disable(cascade);
    }
    /**
     * <p>Show all the children for this 'pin'.</p>
     * @param cascade always true
     * @returns this control
     */
    show(cascade) {
        cascade = true;
        if (cascade)
            for (let c of this._children)
                c.show(cascade);
        return this;
    }
    /**
     * <p>Hide all the children for this 'pin'.</p>
     * @param cascade always true
     * @returns this control
     */
    hide(cascade) {
        cascade = true;
        if (cascade)
            for (let c of this._children)
                c.hide(cascade);
        return this;
    }
    /**
     * An alternative to the show / hide methods.
     *
     * @param visible true / false
     * @param cascade if true hide children
     * @returns this control
     */
    setVisible(visible, cascade) {
        if (visible)
            return this.show(cascade);
        else
            return this.hide(cascade);
    }
    /**
     * <p>This method will force the control to update its visual appearance
     * when the next frame is rendered.</p>
     * <p><em>It is included in the most unlikely event it is needed.</em></p>
     * @returns this control
     * @hidden
     */
    invalidateBuffer() {
        this._bufferInvalid = true;
        return this;
    }
    /** @hidden */
    warn$(method) {
        CWARN(`'${method}' is not supported by '${this.type}' controls.`);
        return this;
    }
    /**
     * @param guiCtx ui overlay buffer drawing context
     * @param pkCtx picker buffer drawing context
     * @hidden
     */
    _draw(guiCtx, pkCtx) {
        guiCtx.save();
        guiCtx.translate(this._x, this._y);
        // Display children
        for (let c of this._children)
            if (c._visible)
                c._draw(guiCtx, pkCtx);
        guiCtx.restore();
    }
}
//# sourceMappingURL=pin.js.map
/*
##############################################################################
 CvsControl
 The base class for controls and panes that don't require a graphics buffer.
 ##############################################################################
 */
/**
 * <p>This class provides most of the core functionality for the canvasGUI
 * controls.</p>
 */
class CvsControl extends CvsPin {
    /**
     * CvsControl class
     * @hidden
     * @param gui
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui, id, x, y, w, h, pickable) {
        super(gui, id, x, y);
        /** @hidden */ this._w = 0;
        /** @hidden */ this._h = 0;
        /** @hidden */ this._isOver = false;
        /** @hidden */ this._active = false;
        /** @hidden */ this._alpha = 255;
        /** @hidden */ this._clickAllowed = false;
        /** @hidden */ this._opaque = true;
        /** @hidden */ this._tooltip = undefined;
        /**
         * <p>The event handler for this control. Although it is permitted to set this
         * property directly it is recommended that the <code>setAction(...)</code>
         * method is used to define the event handler actions.</p>
         * @hidden
         */
        this.action = function () { };
        this._w = Math.round(w);
        this._h = Math.round(h);
        this._visible = true;
        this._enabled = true;
        this._scheme = undefined;
        this._orientation = CvsControl.EAST;
        this._dragging = false; // is mouse being dragged on active control
        if (pickable)
            this._gui.registerPickable(this);
    }
    /** @hidden */
    get w() { return this._w; }
    /** @hidden */
    set w(v) { this._w = Math.round(v); }
    /** @hidden */
    get h() { return this._h; }
    /** @hidden */
    set h(v) { this._h = Math.round(v); }
    /**
     * <p>This is true if the control background is opaque else false.</p>
     * <p>Use <code>opaque()</code> and <code>transparent()</code> display / hide the background.</p>
     */
    get isOpaque() { return this._opaque; }
    /**
     * A control becomes active when the mouse button is pressed over it.
     * This method has little practical use except when debugging.
     * @returns true if this control is expecting more mouse events
     * @hidden
     */
    get isActive() { return this._active; }
    /** @hidden */
    get over() { return this._isOver; }
    /** @hidden */
    set over(b) {
        if (b != this._isOver) {
            this._isOver = b;
            this.invalidateBuffer();
        }
    }
    /** @hidden */
    get CNRS() { return this._corners || this._gui._corners; }
    /** @hidden */
    get SCHEME() { return this._scheme || this._gui._scheme; }
    /**
     * <p>If the name of a valid color scheme is provided then it will use it
     * to display the control, non-existant scheme names will be ignored. In
     * both cases this control is returned.</p>
     * <p>If there is no parameter it returns the name of the current color
     * scheme used by this control.</p>
     * @param name the color scheme name e.g. 'blue'
     * @param cascade if true propogate scheme to all child controls.
     * @returns this control or the control's color scheme
     */
    scheme(name, cascade) {
        if (name) { // setter
            let next_scheme = this._gui.getScheme(name);
            if (next_scheme && this._scheme != next_scheme) {
                this._scheme = next_scheme;
                this.invalidateBuffer();
                if (cascade)
                    for (let c of this._children)
                        c.scheme(name, cascade);
            }
            return this;
        }
        return this._scheme;
    }
    /**
     * <p>Get or set the corner radii used for this control.</p>
     * <p>To set the radii the parameters must be one of the following</p>
     * <ul>
     * <li>an array of 4 numbers.</li>
     * <li>a comma seperated list of 4 numbers.</li>
     * <li>a single number to be used for all 4 radii.</li>
     * </ul>
     * <p>If no parameter is passed or does not match one of the above then an
     * array of the currently used radii values.</p>
     *
     * @param c valid radii combination
     * @returns an array of the currently used radii values
     */
    corners(...c) {
        switch (c.length) {
            case 0: // Getter
                return [...this.CNRS];
            case 4:
                this._corners = [...c];
                break;
            case 1:
                if (Array.isArray(c[0]) && c[0].length == 4)
                    this._corners = [...c[0]];
                else
                    this._corners = [c[0], c[0], c[0], c[0]];
                break;
        }
        return this;
    }
    /**
     * <p>This sets the event handler to be used when this control fires
     * an event. The parameter can take one of three forms:</p>
     * <ol>
     * <li>Arrow function definition</li>
     * <li>Anonymous function definition</li>
     * <li>Named function declaration</li>
     * </ol>
     *
     * @param event_handler  the function to handle this control's events.
     * @returns this control
     */
    setAction(event_handler) {
        if (typeof event_handler === 'function')
            this.action = event_handler;
        else
            console.error(`The action for '$(this._id)' must be a function definition`);
        return this;
    }
    /**
     * <p>Sets this controls display orientation to one of the four cardinal
     * compass points. An invalid parameter will set the orientation to 'east'
     * which is the default value.</p>
     * @param dir 'north', 'south', 'east' or 'west'
     * @returns this control
     */
    orient(dir = 'east') {
        dir = dir.toString().toLowerCase();
        switch (dir) {
            case 'north':
                this._orientation = CvsControl.NORTH;
                break;
            case 'south':
                this._orientation = CvsControl.SOUTH;
                break;
            case 'west':
                this._orientation = CvsControl.WEST;
                break;
            case 'east':
            default:
                this._orientation = CvsControl.EAST;
        }
        return this;
    }
    /**
     * Create a tooltip for this control.
     *
     * @param tiptext the text to appear in the tooltip
     * @returns this control
     */
    tooltip(tiptext) {
        let tt = this._gui.__tooltip(this._id + '.tooltip')
            .text(tiptext);
        this.addChild(tt);
        if (tt instanceof CvsTooltip) {
            tt._validatePosition();
            this._tooltip = tt;
        }
        return this;
    }
    /**
     * Sets the size of the text to use in the tooltip.
     * @param {number} tsize text size for this tooltip
     */
    tipTextSize(tsize) {
        if (this._tooltip && tsize && tsize > 0)
            this._tooltip.textSize(tsize);
        return this;
    }
    /**
     * <p>Enables this control.</p>
     * @param cascade if true enable child controls
     * @returns this control
     */
    enable(cascade) {
        if (!this._enabled) {
            this._enabled = true;
            this.invalidateBuffer();
        }
        if (cascade)
            for (let c of this._children)
                c.enable(cascade);
        return this;
    }
    /**
     * <p>Disables this control.</p>
     * @param cascade if true disable child controls
     * @returns this control
     */
    disable(cascade) {
        if (this._enabled) {
            this._enabled = false;
            this.invalidateBuffer();
        }
        if (cascade)
            for (let c of this._children)
                c.disable(cascade);
        return this;
    }
    /**
     * <p>Make this control visible.</p>
     * @param cascade if true then show any children
     * @returns this control
     */
    show(cascade) {
        this._visible = true;
        if (cascade)
            for (let c of this._children)
                c.show(true);
        return this;
    }
    /**
     * <p>Make this control invisible.</p>
     * @param cascade if true hide any children
     * @returns this control
     */
    hide(cascade) {
        this._visible = false;
        if (cascade)
            for (let c of this._children)
                c.hide(cascade);
        return this;
    }
    /**
     * <p>Makes the controls background opaque. The actual color depends
     * on the controls color scheme.</p>
     * <p>The second parameter, alpha, is optional and controls the level
     * of opaqueness from 0 - transparent to 255 - fully opaque
     * (default value).</p>
     *
     * @param alpha alpha value for controls background color.
     * @returns this control
     */
    opaque(alpha = 255) {
        this._alpha = Math.floor((alpha < 0 ? 0 : alpha > 255 ? 255 : alpha));
        this._opaque = true;
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Makes the controls background fully transparent.</p>
     * @returns this control
     */
    transparent() {
        this._opaque = false;
        this.invalidateBuffer();
        return this;
    }
    /** @hidden */
    orientation() {
        return this._orientation;
    }
    /** @hidden */
    _updateControlVisual() { }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) { return this; }
    /** @hidden */
    _doKeyEvent(e) { return this; }
    /**
     * @param uic ui overlay buffer drawing context
     * @param pkc picker buffer drawing context
     * @hidden
     */
    _draw(uic, pkc) { }
}
/** @hidden */
CvsControl.NORTH = new OrientNorth();
/** @hidden */
CvsControl.SOUTH = new OrientSouth();
/** @hidden */
CvsControl.EAST = new OrientEast();
/** @hidden */
CvsControl.WEST = new OrientWest();
//# sourceMappingURL=control.js.map
/*
 ##############################################################################
 CvsBufferedControl
 This is the base class for all visual controls that require a graphic buffer
 ##############################################################################
 */
/**
 * <p>This is the base class for all visual controls that require a graphic buffer.</p>
 * @hidden
 */
class CvsBufferedControl extends CvsControl {
    /**
     * CvsBufferedControl class
     * @hidden
     * @param {GUI} gui
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui, id, x, y, w, h, pickable = false) {
        super(gui, id, x, y, w, h, pickable);
        /** @hidden */ this._textInvalid = false;
        this._createBuffer = pickable ? this._createUIandPKbuffer : this._createUIbuffer;
        this._createBuffer(w, h);
        this.invalidateBuffer();
    }
    /**
     * Create the UI buffer
     * @hidden
     */
    _createBuffer(w, h) {
        this._uicBuffer = new OffscreenCanvas(w, h);
        this._uicBuffer.getContext('2d')?.clearRect(0, 0, w, h);
        this._pkcBuffer = new OffscreenCanvas(w, h);
        this._pkcBuffer.getContext('2d')?.clearRect(0, 0, w, h);
        this.invalidateBuffer();
    }
    _createUIbuffer(w, h) {
        this._uicBuffer = new OffscreenCanvas(w, h);
        this._uicBuffer.getContext('2d')?.clearRect(0, 0, w, h);
        this.invalidateBuffer();
    }
    _createUIandPKbuffer(w, h) {
        this._uicBuffer = new OffscreenCanvas(w, h);
        this._uicBuffer.getContext('2d')?.clearRect(0, 0, w, h);
        this._pkcBuffer = new OffscreenCanvas(w, h);
        this._pkcBuffer.getContext('2d')?.clearRect(0, 0, w, h);
        this.invalidateBuffer();
    }
    _clearBuffer(buff, ctx) {
        if (buff && ctx)
            ctx.clearRect(0, 0, buff.width, buff.height);
    }
    /**
     * If this control has changed size then recreate the ui buffers
     * and invalidate the control so it is forced to recreate the buffer on
     * when being rendered.
     * @hidden
     */
    _validateBuffer(w = this._uicBuffer.width, h = this._uicBuffer.height) {
        if (this._uicBuffer.width != w || this._uicBuffer.height != h)
            this._createBuffer(w, h);
    }
    /**
     * Test function to show existing puffers
     * @hidden
     */
    get bufferStatus() { return { ui: Boolean(this._uicBuffer), pk: Boolean(this._pkcBuffer) }; }
    /**
     * Invalidates display text.
     * If the text or its attributes are changed then the text needs updating
     * at next draw cycle.
     *
     * @returns this control
     * @hidden
     */
    invalidateText() {
        this._textInvalid = true;
        this.invalidateBuffer();
        return this;
    }
    /** @hidden */
    _draw(guiCtx, pkCtx) {
        // Make sure the buffer exists and the same size as the control
        this._validateBuffer(this._w, this._h);
        if (this._bufferInvalid)
            this._updateControlVisual();
        guiCtx.save();
        guiCtx.translate(this._x, this._y);
        if (this._visible) {
            let tr = this._orientation.getTransform(this._w, this._h);
            guiCtx.translate(tr.tx, tr.ty);
            guiCtx.rotate(tr.rot);
            guiCtx.drawImage(this._uicBuffer, 0, 0);
            // Draw pick buffer image if enabled
            if (this._pkcBuffer && this._enabled) {
                pkCtx.save();
                pkCtx.setTransform(guiCtx.getTransform());
                pkCtx.drawImage(this._pkcBuffer, 0, 0);
                pkCtx.restore();
            }
        }
        // Display children
        for (let c of this._children)
            if (c._visible)
                c._draw(guiCtx, pkCtx);
        guiCtx.restore();
    }
    /** @hidden */
    _disable_highlight(cs, x, y, w, h) {
        const uic = this._uicBuffer.getContext('2d');
        if (uic) {
            uic.fillStyle = cs.T$(2);
            uic.beginPath();
            uic.roundRect(x, y, w, h, this.CNRS);
            uic.fill();
        }
    }
    /** @hidden */
    _getUseableFaceRegion() {
        const iH = Math.max(...this.CNRS, 3 * ISET_H);
        return [iH, ISET_V, this._w - 2 * iH, this._h - 2 * ISET_V];
    }
}
//# sourceMappingURL=bufferedcontrol.js.map
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CvsImage_offImg, _CvsImage_overImg, _CvsImage_maskImg;
/**
 * <p>This class represents clickable image buttons.</p>
 *
 * <p>The hit-zone is any non-transparent pixel in the off-state image or if
 * provided the mask-image.</p>
 *
 * <p>The over-button state occurs when the mouse is in the hit-zone. When
 * this occurs the button face image will be displayed, or if not defined, a
 * simple a simple border highlight is used.</p>
 */
class CvsImage extends CvsBufferedControl {
    /** @hidden */
    constructor(gui, name, x, y, faceImages, mask) {
        let images = Array.isArray(faceImages) ? faceImages : [faceImages];
        let [w, h] = [images[0].width, images[0].height];
        super(gui, name, x, y, w, h, true);
        _CvsImage_offImg.set(this, void 0);
        _CvsImage_overImg.set(this, void 0);
        _CvsImage_maskImg.set(this, void 0);
        __classPrivateFieldSet(this, _CvsImage_offImg, cvsGuiCanvas(images[0]), "f");
        __classPrivateFieldSet(this, _CvsImage_overImg, cvsGuiCanvas(images[1]), "f");
        __classPrivateFieldSet(this, _CvsImage_maskImg, cvsGuiCanvas(mask), "f");
        this._uicBuffer.getContext('2d')?.drawImage(__classPrivateFieldGet(this, _CvsImage_offImg, "f"), 0, 0, w, h, 0, 0, w, h);
        this.invalidateBuffer();
    }
    /** @hidden */
    _makePickImage() {
        let pickCol = this._gui.pickColor(this);
        let [w, h] = [__classPrivateFieldGet(this, _CvsImage_offImg, "f").width, __classPrivateFieldGet(this, _CvsImage_offImg, "f").height];
        let p_rgb = [pickCol.r, pickCol.g, pickCol.b, 255];
        // Source color byte data array from either the off-image or
        // the mask if it exists.
        let srcData;
        if (__classPrivateFieldGet(this, _CvsImage_maskImg, "f")) {
            const cvs = new OffscreenCanvas(w, h);
            const ctx = cvs.getContext('2d');
            ctx?.drawImage(__classPrivateFieldGet(this, _CvsImage_maskImg, "f"), 0, 0, w, h, 0, 0, w, h);
            srcData = ctx?.getImageData(0, 0, w, h).data;
        }
        else {
            srcData = this._uicBuffer.getContext('2d')?.getImageData(0, 0, w, h).data;
        }
        // Create the pick image and clear context
        __classPrivateFieldSet(this, _CvsImage_maskImg, new OffscreenCanvas(w, h), "f");
        let pkCtx = __classPrivateFieldGet(this, _CvsImage_maskImg, "f").getContext('2d');
        pkCtx?.clearRect(0, 0, w, h);
        // Create the dest color byte data array
        if (srcData) {
            let dstData = new Uint8ClampedArray(srcData.length);
            for (let i = 0; i < dstData.length; i += 4) {
                if (srcData[i + 3] >= 128) {
                    dstData[i] = p_rgb[0];
                    dstData[i + 1] = p_rgb[1];
                    dstData[i + 2] = p_rgb[2];
                    dstData[i + 3] = 255;
                }
            }
            let dstImgData = new ImageData(dstData, w, h);
            pkCtx?.putImageData(dstImgData, 0, 0);
        }
    }
    /**
     * <p>Resizes the control.</p>
     * <p>if both parameters are &equals;0 the control will be resized to
     * match the original image size, but if both parameters are &ne;0 the
     * control will be stretched to fit the new size.</p>
     * <p>If just one parameter is &equals;0 then it will be calculated from
     * the other parameter so as to maintain the original aspect ratio.</p>
     *
     * @param w requested width
     * @param h requested height
     * @returns this control
     */
    resize(w, h) {
        w = Math.round(w);
        h = Math.round(h);
        if (Number.isNaN(w) || Number.isNaN(h) || (w == this._w && h == this._h))
            return this;
        const aspect = __classPrivateFieldGet(this, _CvsImage_offImg, "f").width / __classPrivateFieldGet(this, _CvsImage_offImg, "f").height;
        if (w == 0 && h == 0) {
            w = __classPrivateFieldGet(this, _CvsImage_offImg, "f").width;
            h = __classPrivateFieldGet(this, _CvsImage_offImg, "f").height;
        }
        else if (w == 0 && h > 0)
            w = Math.ceil(h * aspect);
        else if (h == 0 && w > 0)
            h = Math.ceil(w / aspect);
        this._w = w;
        this._h = h;
        this.invalidateBuffer();
        return this;
    }
    /** @hidden */
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        const [w, h] = [this._w, this._h];
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const OPAQUE = cs.C$(2, this._alpha);
        const HIGHLIGHT = cs.C$(9);
        uic.save();
        // Image clipped for corners
        uic.save();
        uic.beginPath();
        uic.roundRect(0, 0, w, h, cnrs);
        uic.clip();
        if (this._opaque) {
            uic.fillStyle = OPAQUE;
            uic.fillRect(0, 0, w, h);
        }
        const highlight = (this.isActive || this.over);
        const icon = highlight && __classPrivateFieldGet(this, _CvsImage_overImg, "f") ? __classPrivateFieldGet(this, _CvsImage_overImg, "f") : __classPrivateFieldGet(this, _CvsImage_offImg, "f");
        uic.drawImage(icon, 0, 0, icon.width, icon.height, 0, 0, w, h);
        uic.restore();
        // End of clipped region
        // Mouse over and no over-image then add border highlight
        if (highlight && !__classPrivateFieldGet(this, _CvsImage_overImg, "f")) {
            uic.strokeStyle = HIGHLIGHT;
            uic.lineWidth = 2;
            uic.beginPath();
            uic.roundRect(1, 1, this._w - 2, this._h - 2, cnrs);
            uic.stroke();
        }
        // Update pick buffer before restoring
        this._updatePickBuffer();
        uic.restore();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    _updatePickBuffer() {
        const pkb = this._pkcBuffer;
        const pkc = pkb.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        const [w, h] = [this._pkcBuffer.width, this._pkcBuffer.height];
        const mask = __classPrivateFieldGet(this, _CvsImage_maskImg, "f");
        const cnrs = this.CNRS;
        pkc.save();
        pkc.beginPath();
        pkc.roundRect(0, 0, w, h, cnrs);
        pkc.clip();
        pkc.drawImage(mask, 0, 0, mask.width, mask.height, 0, 0, w, h);
        pkc.restore();
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this._clickAllowed = true; // false if mouse moves
                this.over = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    if (this._clickAllowed)
                        this.action({ source: this, event: e });
                    this._active = false;
                }
                this._clickAllowed = false;
                this.over = false;
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                this.over = (this == over.control);
                this._tooltip?._updateState(enter);
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
}
_CvsImage_offImg = new WeakMap(), _CvsImage_overImg = new WeakMap(), _CvsImage_maskImg = new WeakMap();
//# sourceMappingURL=image.js.map
/**
 * <p>This class represents a horizontal slider with a draggable thumb to
 * define a value within user defined limits.</p>
 * <p>Major and minor tick marks can be added to the bar and supports
 * stick-to-ticks if wanted.</p>
 */
class CvsSlider extends CvsBufferedControl {
    /**
     * @hidden
     * @param gui the gui controller
     * @param name unique name for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h, true);
        this._t01 = 0.5;
        this._limit0 = 0;
        this._limit1 = 1;
        this._majorTicks = 0;
        this._minorTicks = 0;
        this._s2ticks = false;
        this._opaque = false;
        // Set track weight (thickness) and calculate related fields
        this.weight(8);
    }
    /**
     * Set the lower and upper limits for the slider
     *
     * @param l0 lower limit
     * @param l1 upper limit
     * @returns this slider object
     */
    limits(l0, l1) {
        if (Number.isFinite(l0) && Number.isFinite(l1)) {
            this._limit0 = l0;
            this._limit1 = l1;
        }
        return this;
    }
    /**
     * Checks whether a value is between the lower and upper limits for this
     * control. It allows the user to prevalidate a value before attempting
     * to change the control's value.
     * @param value value to test
     * @returns true if the value lies within the control's limits else false
     */
    isInsideLimits(value) {
        return (Number.isFinite(value)
            && (value - this._limit0) * (value - this._limit1) <= 0);
    }
    /**
     * <p>The track can be divided up into a number of domains separated with major ticks. The
     * major domains and be further divided into subdomains separated with minor ticks. If the
     * final parameter is true then values returned by the slider are consrained to the
     * tick values.</p>
     * @param {number} major the number of major domains on the track
     * @param {number} minor the number of minor domains  between major ticks
     * @param {boolean} stick2ticks slider value is constrainged to tick values
     * @returns {CvsControl} this slider object
     */
    ticks(major, minor, stick2ticks) {
        this._majorTicks = major;
        this._minorTicks = minor;
        this._s2ticks = Boolean(stick2ticks);
        return this;
    }
    /**
     * <p>Gets or sets the thickness of the track.</p>
     * <p>The thickness is constrained to the range &ge;&nbsp;4 and
     * &le;&nbsp;0.1 * control width.</p>
     * @param tWgt the required track thickness)
     * @returns the curent track thickness or this control
     */
    weight(tWgt) {
        if (!tWgt)
            return this._trackWeight;
        // Setter
        let maxWgt = Math.round(Math.max(8, this.w / 10));
        tWgt = _constrain(tWgt, 4, maxWgt);
        this._trackWeight = tWgt;
        this._thumbSize = Math.max(9, tWgt * 1.5);
        this._thumbCnrs = [tWgt / 3, tWgt / 3, tWgt / 3, tWgt / 3];
        this._majorTickSize = Math.max(8, 1.25 * tWgt);
        this._minorTickSize = Math.max(6, 0.90 * tWgt);
        this._inset = Math.round(this._thumbSize / 2 + 4);
        return this;
    }
    /**
     * If the parameter value is withing the slider limits it will move the thumb
     * to the appropriate position. If no parameter is passed or is outside the
     * limits this methods returns the current slider value.
     * @param value the selected value to be set
     * @returns the current value or this slider object
     */
    value(value) {
        if (Number.isFinite(value)) {
            value = Number(value);
            if ((value - this._limit0) * (value - this._limit1) <= 0) {
                this._t01 = this._norm01(value);
                this.invalidateBuffer();
                return this;
            }
        }
        return this._t2v(this._t01);
    }
    /**
     * <p>Converts parametic value to user value</p>
     * @hidden
     * @param t parametric value
     * @returns the correspoding value
     */
    _t2v(t) {
        return this._limit0 + t * (this._limit1 - this._limit0);
    }
    /**
     * <p>Converts parametic value to user value</p>
     * @hidden
     * @param v value
     * @returns the correspoding parametric value
     */
    _v2t(v) {
        return (v - this._limit0) / (this._limit1 - this._limit0);
    }
    /**
     * <p>get the parametic value t for a given value, whwre v can be any value
     * and not constrained to the slider limits. The result is constrained to the
     * range &ge;0 and &lt;1</p>
     * @hidden
     * @param v user value
     * @param l0 lower limit
     * @param l1 upper limit
     * @returns parametric value in range &ge;0 and &lt;1
     */
    _norm01(v, l0 = this._limit0, l1 = this._limit1) {
        return _map(v, l0, l1, 0, 1, true);
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let absPos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0) { // Thumb
                    this._active = true;
                    this.over = true;
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                this.action({ source: this, event: e, value: this.value(), final: true });
                this._active = false;
                this.over = false;
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    let t01 = this._norm01(mx - this._inset, 0, this._w - 2 * this._inset);
                    if (this._s2ticks)
                        t01 = this._nearestTickT(t01);
                    if (this._t01 != t01) {
                        this._t01 = t01;
                        this.action({ source: this, event: e, value: this.value(), final: false });
                    }
                }
                this.over = (this == over.control && over.part == 0);
                this._tooltip?._updateState(enter);
                this.invalidateBuffer();
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /**
     * For a given value p01 find the value at the nearest tick
     * @hidden
     */
    _nearestTickT(p01) {
        let nbrTicks = this._minorTicks > 0
            ? this._minorTicks * this._majorTicks : this._majorTicks;
        return (nbrTicks > 0) ? Math.round(p01 * nbrTicks) / nbrTicks : p01;
    }
    /** @hidden */
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        let cs = this.SCHEME;
        let cnrs = this.CNRS;
        let [tLen, tWgt, tbSize] = [this._w - 2 * this._inset, this._trackWeight, this._thumbSize];
        let [majT, minT] = [this._majorTickSize, this._minorTickSize];
        const OPAQUE = cs.C$(3, this._alpha);
        const TICKS = cs.G$(7);
        const UNUSED_TRACK = cs.G$(3);
        const USED_TRACK = cs.G$(1);
        const HIGHLIGHT = cs.C$(9);
        const THUMB = cs.C$(6);
        uic.save();
        if (this._opaque) { // Background
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.fill();
        }
        // Now translate to track left edge - track centre
        uic.translate(this._inset, Math.round(this._h / 2));
        // Now draw ticks
        uic.strokeStyle = TICKS;
        uic.lineWidth = (1);
        let dT, n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            dT = tLen / n;
            uic.beginPath();
            for (let i = 0; i <= n; i++) { // minor ticks
                let tickX = i * dT;
                uic.moveTo(tickX, -minT);
                uic.lineTo(tickX, minT);
            }
            uic.stroke();
        }
        n = this._majorTicks;
        if (n >= 2) {
            dT = tLen / n;
            uic.beginPath();
            for (let i = 0; i <= n; i++) { // major ticks
                let tickX = i * dT;
                uic.moveTo(tickX, -majT);
                uic.lineTo(tickX, majT);
                uic.stroke();
            }
        }
        // draw unused track
        uic.fillStyle = UNUSED_TRACK;
        uic.fillRect(0, -tWgt / 2, tLen, tWgt);
        // draw used track
        let tbX = tLen * this._t01;
        uic.fillStyle = USED_TRACK;
        uic.fillRect(0, -tWgt / 2, tbX, tWgt);
        // Draw thumb
        uic.fillStyle = THUMB;
        uic.beginPath();
        uic.roundRect(tbX - tbSize / 2, -tbSize / 2, tbSize, tbSize, this._thumbCnrs);
        uic.fill();
        if (this._isOver) {
            uic.lineWidth = 2;
            uic.strokeStyle = HIGHLIGHT;
            uic.stroke();
        }
        this._updatePickBuffer();
        uic.restore();
        if (!this._enabled)
            this._disable_highlight(cs, 0, 0, this._w, this._h);
        this._bufferInvalid = false; // Finally mark as valid
    }
    /** @hidden */
    _updatePickBuffer() {
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        const c = this._gui.pickColor(this);
        const [tLen, tWgt, tbSize] = [this._w - 2 * this._inset, this._trackWeight, this._thumbSize];
        const tbX = Math.round(tLen * this._t01);
        pkc.save();
        // Now translate to track left edge - track centre
        pkc.translate(this._inset, Math.round(this.h / 2));
        // Track
        pkc.fillStyle = _rgb$(c.r, c.g, c.b + 5);
        pkc.fillRect(0, -tWgt / 2, tLen, tWgt);
        pkc.fillStyle = _rgb$(c.r, c.g, c.b + 6);
        pkc.fillRect(0, -tWgt / 2, tbX, tWgt);
        // Thumb
        pkc.fillStyle = c.cssColor;
        pkc.fillRect(tbX - tbSize / 2, -tbSize / 2, tbSize, tbSize);
        pkc.restore();
    }
}
//# sourceMappingURL=slider.js.map
/**
 * <p>This class represents a slider with 2 draggable thumbs to
 * define a value within user defined limits.</p>
 * <p>Major and minor tick marks can be added to the bar and supports
 * stick-to-ticks if wanted.</p>
 */
class CvsRanger extends CvsSlider {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h);
        /** @hidden */ this._t = [0.25, 0.75];
        /** @hidden */ this._tIdx = -1;
        this._t = [0.25, 0.75];
        this._tIdx = -1;
        this._limit0 = 0;
        this._limit1 = 1;
        this._opaque = false;
    }
    /**
     * <p>Sets or gets the low and high thumb values for this control. If both
     * parameters are within the ranger limits then they are accepted and the
     * thumbs are moved to the correct position.</p>
     * <p>If either of the parameters are invalid then they are ignored and
     * the method returns the current range low and high values.</p>
     * @param v0 low value
     * @param v1 high value
     * @returns this control or the low/high values
     */
    range(v0, v1) {
        if (Number.isFinite(v0) && Number.isFinite(v1)) { // If two numbers then
            v0 = Number(v0);
            v1 = Number(v1);
            let t0 = this._norm01(Math.min(v0, v1));
            let t1 = this._norm01(Math.max(v0, v1));
            if (t0 >= 0 && t0 <= 1 && t1 >= 0 && t1 <= 1) {
                this._bufferInvalid = (this._t[0] != t0) || (this._t[1] != t1);
                this._t[0] = t0;
                this._t[1] = t1;
                return this;
            }
        }
        // Invalid parameters
        return { low: this._t2v(this._t[0]), high: this._t2v(this._t[1]) };
    }
    /**
     * @returns the low value of the range
     */
    low() {
        return this._t2v(this._t[0]);
    }
    /**
     * @returns the high value of the range
     */
    high() {
        return this._t2v(this._t[1]);
    }
    /**
     * If both parameter values are within the ranger's limits it will move
     * the thumbs to the appropriate positions. If no parameters are passed
     * or if either is outside the ranger's limits this methods returns the
     * an array containing the current ranger values.
     * @param v0 value to set the first thumbs.
     * @param v1 value to set the second thumbs.
     * @returns an array of the current values or this ranger object.
     */
    values(v0, v1) {
        function inLimits(v) {
            return ((v - l0) * (v - l1) <= 0);
        }
        let [l0, l1] = [this._limit0, this._limit1];
        if (Number.isFinite(v0) && Number.isFinite(v1)) {
            v0 = Number(v0);
            v1 = Number(v1);
            if (inLimits(v0) && inLimits(v1)) {
                this._t[0] = this._norm01(Math.min(v0, v1));
                this._t[1] = this._norm01(Math.max(v0, v1));
                this.invalidateBuffer();
                return this;
            }
        }
        return [this._t2v(this._t[0]), this._t2v(this._t[1])];
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let absPos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0 || over.part == 1) { // A thumb
                    this._active = true;
                    this._tIdx = over.part; // Which thumb is the mouse over
                    this.over = true;
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    let t0 = Math.min(this._t[0], this._t[1]);
                    let t1 = Math.max(this._t[0], this._t[1]);
                    this._t[0] = t0;
                    this._t[1] = t1;
                    this._tIdx = -1;
                    this.action({
                        source: this, event: e, low: this._t2v(t0), high: this._t2v(t1), final: true
                    });
                    this._active = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    let t01 = this._norm01(mx - this._inset, 0, this._w - 2 * this._inset);
                    if (this._s2ticks)
                        t01 = this._nearestTickT(t01);
                    if (this._t[this._tIdx] != t01) {
                        this._t[this._tIdx] = t01;
                        let t0 = Math.min(this._t[0], this._t[1]);
                        let t1 = Math.max(this._t[0], this._t[1]);
                        this.action({
                            source: this, event: e, low: this._t2v(t0), high: this._t2v(t1), final: false
                        });
                    }
                }
                this.over = (this == over.control && (over.part == 0 || over.part == 1));
                this._tooltip?._updateState(enter);
                this.invalidateBuffer();
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /** @hidden */
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const [tLen, tWgt, tbSize] = [this._w - 2 * this._inset, this._trackWeight, this._thumbSize];
        const [majT, minT] = [this._majorTickSize, this._minorTickSize];
        const OPAQUE = cs.C$(3, this._alpha);
        const TICKS = cs.G$(7);
        const UNUSED_TRACK = cs.G$(3);
        const USED_TRACK = cs.G$(1);
        const HIGHLIGHT = cs.C$(9);
        const THUMB = cs.C$(6);
        uic.save();
        if (this._opaque) {
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.fill();
        }
        // Now translate to track left edge - track centre
        uic.translate(this._inset, Math.round(this._h / 2));
        // Now draw ticks
        uic.strokeStyle = TICKS;
        uic.lineWidth = 1;
        let dT, n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            dT = tLen / n;
            uic.beginPath();
            for (let i = 0; i <= n; i++) { // minor ticks
                let tickX = i * dT;
                uic.moveTo(tickX, -minT);
                uic.lineTo(tickX, minT);
            }
            uic.stroke();
        }
        n = this._majorTicks;
        if (n >= 2) {
            dT = tLen / this._majorTicks;
            uic.beginPath();
            for (let i = 0; i <= n; i++) { // major ticks
                let tickX = i * dT;
                uic.moveTo(tickX, -majT);
                uic.lineTo(tickX, majT);
            }
            uic.stroke();
        }
        // draw unused track
        uic.fillStyle = UNUSED_TRACK;
        uic.fillRect(0, -tWgt / 2, tLen, tWgt);
        // draw used track
        const tx0 = tLen * Math.min(this._t[0], this._t[1]);
        const tx1 = tLen * Math.max(this._t[0], this._t[1]);
        uic.fillStyle = USED_TRACK;
        uic.fillRect(tx0, -tWgt / 2, tx1 - tx0, tWgt);
        // Draw thumbs
        for (let tnbr = 0; tnbr < 2; tnbr++) {
            uic.beginPath();
            uic.roundRect(this._t[tnbr] * tLen - tbSize / 2, -tbSize / 2, tbSize, tbSize, this._thumbCnrs);
            uic.fillStyle = THUMB;
            uic.fill();
            if ((this.isActive || this.over)) {
                uic.lineWidth = 2;
                uic.strokeStyle = HIGHLIGHT;
                uic.stroke();
            }
        }
        this._updatePickBuffer();
        uic.restore();
        if (!this._enabled)
            this._disable_highlight(cs, 0, 0, this._w, this._h);
        this._bufferInvalid = false; // Finally mark as valid
    }
    /** @hidden */
    _updatePickBuffer() {
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        const [tLen, tWgt, tbSize] = [this._w - 2 * this._inset, this._trackWeight, this._thumbSize];
        const tx0 = Math.round(tLen * Math.min(this._t[0], this._t[1]));
        const tx1 = Math.round(tLen * Math.max(this._t[0], this._t[1]));
        const c = this._gui.pickColor(this);
        pkc.save();
        // Now translate to track left edge - track centre
        pkc.translate(this._inset, Math.round(this._h / 2));
        // Track
        pkc.fillStyle = _rgb$(c.r, c.g, c.b + 5);
        pkc.fillRect(0, -tWgt / 2, tLen, tWgt);
        pkc.fillStyle = _rgb$(c.r, c.g, c.b + 6);
        pkc.fillRect(tx0, -tWgt / 2, tx1 - tx0, tWgt);
        // Thumb
        pkc.fillStyle = c.cssColor;
        pkc.fillRect(tx0 - tbSize / 2, -tbSize / 2, tbSize, tbSize);
        pkc.fillStyle = _rgb$(c.r, c.g, c.b + 1);
        pkc.fillRect(tx1 - tbSize / 2, -tbSize / 2, tbSize, tbSize);
        pkc.restore();
    }
    /** @hidden */ value(v) { return this.warn$('value'); }
}
//# sourceMappingURL=ranger.js.map
/**
 * </p>The base class for any control that displays text as part of its
 * visual interface</p>
 * @hidden
 */
class CvsText extends CvsBufferedControl {
    /** @hidden */
    get T_SIZE() { return this._tSize || this._gui._tSize; }
    /** @hidden */
    get T_FACE() { return this._tFace || this._gui._tFace; }
    /** @hidden */
    get T_STYLE() { return this._tStyle || this._gui._tStyle; }
    /** @hidden */
    constructor(gui, name, x, y, w, h, pickable) {
        super(gui, name, x, y, w, h, pickable);
        /** @hidden */ this._tLines = [];
        /** @hidden */ this._tBox = [0, 0];
        /** @hidden */ this._tAlignH = "center";
        /** @hidden */ this._tAlignV = "center";
        /** @hidden */ this._tSlant = 14;
        /** @hidden */ this._tArea = [];
        this._tArea = [ISET_H, ISET_V, this._w - 2 * ISET_H, this._h - 2 * ISET_V];
    }
    /**
     * <p>Gets or sets the current text.</p>
     * <p>Processing constants are used to define the alignment.</p>
     * @param text the text to display
     * @param alignH 'left', 'right' or 'center'
     * @param alignV 'top', 'bottom' or 'center'
     * @returns this control or the existing text
     */
    text(text, alignH, alignV) {
        if (text == null || text == undefined) // getter
            return this._tLines.map(line => line.txt).join('\n');
        // Convert first parameter to an array if not already'
        if (!Array.isArray(text))
            text = [text];
        this._tLines = [];
        let lines = [];
        // Split any array elements containing newline characters and trim any
        // leading or trailing whitespace.
        text.forEach(t => lines = lines.concat(String(t).split(/\s*\n+\s*/)));
        lines.forEach(v => this._tLines.push({ txt: v.trim(), x: 0, y: 0, w: 0 }));
        this.textAlign(alignH, alignV);
        this.invalidateText();
        return this;
    }
    /**
     * <p>If no parameter is passed then the current font family name will be
     * returned.</p>
     * <p>If a parameter is provided it will be accepted if it is one of the
     * following :-</p>
     * <ul>
     * <li>The font family name of a TTF system font e.g. 'arial',
     * 'courier new', 'times new roman' ...</li>
     * <li>The name of a logical font e.g. 'serif', 'sans-serif',
     * 'monospace' ...</li>
     * <li>A font loaded in p5js with the <code>loadFont()</code>
     * function.</li>
     * </ul>
     * <p>Any other parameter value will display a warning and be ignored
     * leaving the font unchanged.</p>
     *
     * @param font system or logical font, a FontFace object or a p5js
     * font object.
     * @returns this control
     */
    textFont(font) {
        let fface = cvsGuiFont(font);
        if (fface) {
            this._tFace = fface;
            this.invalidateText();
        }
        else
            CWARN(`'${font?.toString()}' is unrecognized so will be ignored!`);
        return this;
    }
    /**
     * <p>Sets or gets the local text style.</p>
     * <p>The following strings are recognised as valid styles :-</p>
     * <pre>
     * 'normal'  'bold'  'thin'  'italic'
     * 'bold italic'  'thin italic'  'oblique'
     * </pre>
     * <p>It will also accept the 4 p5js constants :-</p>
     * <pre>
     * NORMAL    BOLD   ITALIC   BOLDITALIC
     * </pre>
     * <p>If the 'oblique' style is specified then the parameter 'slant' is
     * the angle (degress) that the font is tilted from the vertical. An angle
     * of +14&deg; is the equivalent to 'italic' and 'normal' is 0&deg;.</p>
     * <p>Unrecognized styles are ignored and the local style is left
     * unchanged.</p>
     * <p>If no parameter is passed then the current style is returned.</p>
     *
     * @param style the font style to use.
     * @param slant the oblique slant angle (degrees)
     * @returns this control
     */
    textStyle(style, slant = 0) {
        if (!style)
            return this._tStyle; // getter
        style = _validateTextStyle(style);
        if (style) {
            if (style == 'oblique')
                this._tSlant = slant ? 14 : +slant;
            this._tStyle = style;
            this.invalidateText();
        }
        return this;
    }
    /**
     * <p>Sets the horizontal and vertical text aligment.</p>
     * <p>The following strings are recognised as valid styles :-</p>
     * <pre>
     * Horz:  'left', 'right' or 'center'
     * Vert:  'top', 'bottom' or 'center'
     * </pre>
     * <p>It will also accept the equivalent p5js constants :-</p>
     * <pre>
     * LEFT  RIGHT  CENTER  TOP  BOTTOM   CENTER
     * </pre>
     * <p>Unrecognized values are ignored and the text allignment is unchanged.</p>
     *
     * @param horz 'left', 'right' or 'center'
     * @param vert 'top', 'bottom' or 'center'
     * @returns this control
     */
    textAlign(horz, vert) {
        let a = this._validateAlign(this._tAlignH, this._tAlignV, horz, vert);
        this._tAlignH = a.horz;
        this._tAlignV = a.vert;
        if (a.changed)
            this.invalidateText();
        return this;
    }
    /**
     * <p>Removes any text that the control might use to display itself.</p>
     * @returns this control
     */
    noText() {
        this._tLines = [];
        this._tBox = [0, 0];
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Sets or gets the local text size.</p>
     * @param tsize the text size to use
     * @returns this control or the current text size
     */
    textSize(tsize) {
        if (!Number.isFinite(tsize))
            return this.T_SIZE; // getter;
        if (this._tSize != tsize) { // setter
            this._tSize = tsize;
            this.invalidateText();
        }
        return this;
    }
    /**
     * <p>Resize the control to fit the face content (text and/or icon).</p>
     * <p>The parameter values control which dimension(s), width and/or
     * height, are changed and their minimum.</p>
     * @param rsW if &le;0 then leave the width unchanged otherwise it is the
     *               minimum width allowed after resizing.
     * @param rsH if &le;0 then leave the height unchanged otherwise it is the
     *               minimum height allowed after resizing.
     * @returns this control
     */
    shrink(rsW = 0, rsH = 0) {
        this._fitWH = [rsW, rsH];
        this.invalidateBuffer();
        return this;
    }
    /**
     * Get the css font descriptor for this control
     * @hidden
     * @readonly
     * @type {*}
     */
    get _cssFont() {
        return cssFont$(this.T_FACE, this.T_SIZE, this.T_STYLE, this._tSlant);
    }
    /**
     * Wrapper for JS <code>measureText()</code> function to summarise
     * the metrics needed form measuring text.
     *
     * @param {*} str the text to measure
     * @returns summary of text metrics
     * @hidden
     */
    _textMetrics(str) {
        const uic = this._uicBuffer.getContext('2d');
        uic.save();
        uic.font = this._cssFont;
        let tm = uic.measureText(str);
        uic.restore();
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
    /** @hidden */
    _updateFaceElements() {
        this._tArea = this._getUseableFaceRegion();
    }
    /** @hidden */
    _fitToContent() {
        const [fx, fy, fw, fh] = this._getUseableFaceRegion();
        const [nW, nH] = this._fitWH;
        const tW = Math.ceil(this._tBox[0] + 2 * fx);
        const tH = Math.ceil(this._tBox[1] + 2 * fy);
        if (nW > 0)
            this._w = Math.max(tW, nW);
        if (nH > 0)
            this._h = Math.max(tH, nH);
        this._fitWH = [0, 0];
        this.invalidateBuffer();
    }
    /** @hidden */
    _validateAlign(caH, caV, horz, vert) {
        let changed = false;
        switch (horz) {
            case 'left':
            case 'right':
            case 'center':
                changed = (horz != caH);
                break;
            default:
                horz = caH;
        }
        switch (vert) {
            case 'top':
            case 'bottom':
            case 'center':
                changed = changed || (vert != caV);
                break;
            default:
                vert = caV;
        }
        return { horz: horz, vert: vert, changed: changed };
    }
    /** @hidden */
    _formatText() {
        const para = this._calcTextBox();
        this._tBox = [para.boxW, para.boxH];
        this._textInvalid = false;
    }
    /**
     * Converts raw text data into a form ready for rendering
     * @returns lines and textblock size data
     * @hidden
     */
    _calcTextBox() {
        const uic = this._uicBuffer.getContext('2d');
        uic.save();
        uic.font = this._cssFont;
        uic.textBaseline = 'alphabetic';
        let ln = 0, maxW = 0, maxH = 0, tm;
        this._tLines.forEach(line => {
            tm = this._textMetrics(line.txt);
            line.y = ln * tm.fHeight + tm.fAscent;
            line.w = tm.tWidth;
            maxW = Math.max(maxW, line.w);
            ln++;
        });
        // Apply horizontal alignment
        this._tLines.forEach(line => {
            switch (this._tAlignH) {
                case "left":
                    line.x = 0;
                    break;
                case "right":
                    line.x = maxW - line.w;
                    break;
                case "center":
                    line.x = (maxW - line.w) / 2;
                    break;
            }
        });
        maxH = tm ? this._tLines.length * tm.fHeight : 0;
        uic.restore();
        return { boxW: maxW, boxH: maxH };
    }
    /**
     * Render the text.
     * @param tcolor colour to use for the text
     * @hidden
     */
    _renderTextArea(tcolor) {
        const uic = this._uicBuffer.getContext('2d');
        const [tx, ty, tw, th] = [...this._tArea];
        const [bw, bh] = [...this._tBox];
        let px = tx, py = ty;
        switch (this._tAlignH) {
            case "right":
                px += tw - bw;
                break;
            case "center":
                px += (tw - bw) / 2;
                break;
        }
        switch (this._tAlignV) {
            case "bottom":
                py += th - bh;
                break;
            case "center":
                py += (th - bh) / 2;
                break;
        }
        uic.save();
        uic.beginPath();
        uic.rect(tx, ty, tw, th);
        uic.clip();
        uic.textBaseline = 'alphabetic';
        uic.font = this._cssFont;
        uic.fillStyle = tcolor;
        this._tLines.forEach(line => {
            uic.fillText(line.txt, line.x + px, line.y + py);
        });
        uic.restore();
    }
}
//# sourceMappingURL=text.js.map
/**
 * <p>This class enables icons to be added to any text control.</p>
 * @hidden
 */
class CvsTextIcon extends CvsText {
    /** @hidden */
    constructor(gui, name, x, y, w, h, pickable) {
        super(gui, name, x, y, w, h, pickable);
        /** @hidden */ this._ix = 0;
        /** @hidden */ this._iy = 0;
        /** @hidden */ this._icons = [];
        /** @hidden */ this._iAlignH = 'left';
        /** @hidden */ this._iAlignV = 'center';
        this._icon = undefined;
    }
    /**
     * <p>Sets the icon and its alignment relative to any text in the
     * control.</p>
     * <p>Processing constants can also be used to define the icon
     * alignment.</p>
     * @see iconAlign
     * @param icon the icon to show
     * @param alignH 'left', 'right' or 'center'
     * @param alignV 'top', 'bottom' or 'center'
     * @returns this control or the current icon
     */
    icon(icon, alignH, alignV) {
        this._icon = cvsGuiCanvas(icon);
        this.iconAlign(alignH, alignV);
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Sets the horizontal and vertical icon aligment.</p>
     * <p>The following strings are recognised as valid alignments :-</p>
     * <pre>
     * Horz:  'left', 'right' or 'center'
     * Vert:  'top', 'bottom' or 'center'
     * </pre>
     * <p>It will also accept the equivalent p5js constants :-</p>
     * <pre>
     * LEFT  RIGHT  CENTER  TOP  BOTTOM   CENTER
     * </pre>
     * <p>Center icon alignment is only possible if there is no text. If there
     * is some text it will use the default 'left'.</p>
     * <p>Unrecognized values are ignored and the icon allignment is unchanged.</p>
     *
     * @param horz 'left', 'right' or 'center'
     * @param vert 'top', 'bottom' or 'center'
     * @returns this control
     */
    iconAlign(horz, vert) {
        let a = this._validateAlign(this._iAlignH, this._iAlignV, horz, vert);
        this._iAlignH = a.horz;
        this._iAlignV = a.vert;
        if (a.changed)
            this.invalidateBuffer();
        return this;
    }
    /**
     * Removes an existing icon
     * @returns this control
     */
    noIcon() {
        if (this._icon) {
            this._icon = undefined;
            this.invalidateBuffer();
        }
        return this;
    }
    /** @hidden */
    _fitToContent() {
        const [fx, fy, fw, fh] = this._getUseableFaceRegion();
        const [nW, nH] = this._fitWH;
        const tW = Math.ceil(this._tBox[0] + 2 * fx);
        const tH = Math.ceil(this._tBox[1] + 2 * fy);
        if (this._fitWH[0]) {
            const dw = this._icon ? this._icon.width + GUTTER : 0;
            this._w = Math.max(tW + dw, nW);
        }
        if (this._fitWH[1]) {
            let dh = this._icon ? this._icon.height : 0;
            this._h = Math.max(dh, tH, nH);
        }
        this._fitWH = null;
        this.invalidateBuffer();
    }
    /** @hidden */
    _updateFaceElements() {
        const [fx, fy, fw, fh] = this._getUseableFaceRegion();
        if (!this._icon) {
            this._tArea = [fx, fy, fw, fh];
        }
        else {
            const [iw, ih] = this._icon ? [this._icon.width, this._icon.height] : [0, 0];
            let ix = fx, iy = fy;
            let textX = 0, textW = 0;
            switch (this._iAlignH) {
                case "left":
                    ix = fx;
                    textX = fx + iw + GUTTER;
                    textW = fw - iw - GUTTER;
                    break;
                case "right":
                    ix = fx + fw - iw;
                    textX = fx;
                    textW = fw - iw - GUTTER;
                    break;
                case "center":
                    if (this._tLines.length > 0) {
                        ix = fx;
                        textX = iw + GUTTER;
                        textW = fw - iw - GUTTER;
                    }
                    else {
                        ix = (fw - iw) / 2;
                    }
                    break;
            }
            switch (this._iAlignV) {
                case "top":
                    iy = fy;
                    break;
                case "bottom":
                    iy = fy + fh - ih;
                    break;
                case "center":
                    iy = (fh - ih) / 2;
                    break;
            }
            this._ix = ix;
            this._iy = iy;
            this._tArea = [textX, fy, textW, fh];
        }
    }
}
//# sourceMappingURL=texticon.js.map
/**
 * <p>Simple label with text and / or icon</p>
 */
class CvsLabel extends CvsTextIcon {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h, false);
    }
    /** @hidden */
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        if (this._textInvalid)
            this._formatText();
        this._updateFaceElements();
        if (this._fitWH)
            this._fitToContent();
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const OPAQUE = cs.C$(3, this._alpha);
        const FORE = cs.C$(8);
        uic.save();
        uic.font = this._cssFont;
        // Background
        if (this._opaque) {
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.fill();
        }
        if (this._icon)
            uic.drawImage(this._icon, this._ix, this._iy);
        this._renderTextArea(FORE);
        uic.restore();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */ get isEnabled() { return this.warn$('isEnabled'); }
    /** @hidden */ setAction() { return this.warn$('setAction'); }
    /** @hidden */ tooltip(a) { return this.warn$('tooltip'); }
    /** @hidden */ tipTextSize(a) { return this.warn$('tipTextSize'); }
    /** @hidden */ enable() { return this.warn$('enable'); }
    /** @hidden */ disable() { return this.warn$('disable'); }
}
//# sourceMappingURL=label.js.map
/**
 * <p>This class is to create simple clickable buttons with text and/or icons
 * on its face.</p>
 */
class CvsButton extends CvsTextIcon {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h, true);
        this._enabled = true;
    }
    /** @hidden */
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        if (this._textInvalid)
            this._formatText();
        this._updateFaceElements();
        if (this._fitWH)
            this._fitToContent();
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const BACK = cs.C$(3, this._alpha);
        const FORE = cs.C$(8);
        const HIGHLIGHT = cs.C$(9);
        uic.save();
        uic.font = this._cssFont;
        // Background
        if (this._opaque) {
            uic.fillStyle = BACK;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.fill();
        }
        if (this._icon) {
            uic.save();
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.clip();
            uic.drawImage(this._icon, this._ix, this._iy);
            uic.restore();
        }
        this._renderTextArea(FORE);
        // Mouse over add border highlight
        if (this.isActive || this.over) {
            uic.strokeStyle = HIGHLIGHT;
            uic.lineWidth = 2;
            uic.beginPath();
            uic.roundRect(1, 1, this._w - 2, this._h - 2, cnrs);
            uic.stroke();
        }
        if (!this._enabled)
            this._disable_highlight(cs, 0, 0, this._w, this._h);
        // Update pick buffer before restoring
        this._updatePickBuffer();
        uic.restore();
        // The last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _updatePickBuffer() {
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        let c = this._gui.pickColor(this);
        pkc.save();
        pkc.fillStyle = c.cssColor;
        pkc.beginPath();
        pkc.roundRect(1, 1, this._w - 1, this._h - 1, this.CNRS);
        pkc.fill();
        pkc.restore();
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this._clickAllowed = true; // false if mouse moves
                this.over = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    if (this._clickAllowed)
                        this.action({ source: this, event: e });
                    this._active = false;
                }
                this._clickAllowed = false;
                this.over = false;
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                this.over = (this == over.control);
                this._tooltip?._updateState(enter);
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
}
//# sourceMappingURL=button.js.map
/**
 * <p>A tooltip is a simply text hint that appears near to a control with the
 * mouse over it.</p>
 * <p>The tooltip's relative position to the control is automatically set to
 * make sure it is visible inside the canvas area.</p>
 * @hidden
 */
class CvsTooltip extends CvsText {
    /** @hidden */
    constructor(gui, name) {
        super(gui, name, 0, 0, 100, 30, false);
        this._gap = 1;
        this._visible = false;
        this._tSize = 12;
        this.invalidateText();
    }
    //  Changing the text or text size should update the control size
    /**
     * <p>Sets the text to be displayed in the tooltip.</p>
     * <p>Processing constants are used to define the alignment.</p>
     * @param text the text to display
     * @returns this control
     */
    text(text, alignH, alignV) {
        if (!text)
            return this._tLines.map(line => line.txt).join('\n');
        super.text(text);
        this.shrink(1, 1);
        this.invalidateText();
        return this;
    }
    /** @hidden */
    show(cascade) { return this; }
    /** @hidden */
    hide(cascade) { return this; }
    /** @hidden */
    _updateState(enter) {
        if (enter && !this._active) {
            this._active = true;
            this._visible = true;
            setTimeout(() => { this._visible = false; }, this._gui._show_time);
            setTimeout(() => { this._active = false; }, this._gui._repeat_time);
        }
    }
    /** @hidden */
    _validatePosition() {
        let p = this._parent;
        let { x: px, y: py } = p.getAbsXY();
        let [pw, ph] = p['orientation']().wh(p['_w'], p['_h']);
        this._x = 0, this._y = -this._h;
        if (py + this._y < 0)
            this._y += this._h + ph;
        if (px + this._x + this._w > this._gui.canvasWidth)
            this._x -= this._w - pw;
    }
    /** @hidden */
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        if (this._textInvalid)
            this._formatText();
        this._updateFaceElements();
        if (this._fitWH) {
            this._fitToContent();
            this._validatePosition();
        }
        const cs = this._parent['scheme']() || this._gui.scheme();
        const BACK = cs.C$(3);
        const FORE = cs.C$(9);
        uic.save();
        uic.font = this._cssFont;
        uic.strokeStyle = FORE;
        uic.fillStyle = BACK;
        uic.fillRect(0, 0, this._w - 1, this._h - 1);
        uic.strokeRect(0, 0, this._w - 1, this._h - 1);
        this._renderTextArea(FORE);
        uic.restore();
        this._bufferInvalid = false; // buffer is now valid
    }
}
//# sourceMappingURL=tooltip.js.map
/*
 ##############################################################################
 CvsScroller
 This class represents a simple scrollbar. Although it can be used as a
 distinct control it is more likely to be used as part of a larger control
 such as CvsViewer.
 ##############################################################################
 */
/**
 * <p>The scroller is used to scroll thorough an object larger than the
 * display area.</p>
 * @hidden
 */
class CvsScroller extends CvsBufferedControl {
    /** @hidden */
    constructor(gui, name, x = 0, y = 0, w = 100, h = 20) {
        super(gui, name, x, y, w, h, true);
        // All values are in the range 0-1
        /** @hidden */ this._value = 0.5;
        /** @hidden */ this._dvalue = 0.5;
        /** @hidden */ this._used = 0.1;
        /** @hidden */ this._s_value = 0.5;
        /** @hidden */ this._s_dvalue = 0.5;
        /** @hidden */ this._s_mx = 0.5;
        /** @hidden */ this._minV = this._used / 2;
        /** @hidden */ this._maxV = 1 - this._used / 2;
        /** @hidden */ this._inset = 2;
        /** @hidden */ this._trackHeight = 8;
        /** @hidden */ this._thumbHeight = 12;
        /** @hidden */ this._minThumbWidth = 10;
        this._trackWidth = w - 2 * this._inset;
        this._opaque = false;
        this._corners = [4, 4, 4, 4];
    }
    /**
     * Update the scroller from an external source.
     *
     * @param value The scroller position (0-1)
     * @param used The amount 'used' by the source
     * @hidden
     */
    update(value, used) {
        // If a used value is available then use it
        if (used && Number.isFinite(used) && used !== this._used) {
            this._used = used;
            this._minV = this._used / 2;
            this._maxV = 1 - this._used / 2;
            this.invalidateBuffer();
        }
        if (value && Number.isFinite(value) && value !== this._value) {
            value = _constrain(value, 0, 1);
            let dv = value, u2 = this._used / 2;
            if (value < u2)
                dv = u2;
            else if (value > 1 - u2)
                dv = 1 - u2;
            if (this._value != value || this._dvalue != dv) {
                this._value = value;
                this._dvalue = dv;
                this.invalidateBuffer();
            }
        }
    }
    /** @hidden */
    getValue() {
        return this._value;
    }
    /** @hidden */
    getUsed() {
        return this._used;
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let [mx, my, w, h] = this._orientation.xy(x - this._x, y - this._y, this.w, this.h);
        let [tw, halfUsed] = [this._trackWidth, this._used / 2];
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0) { // Thumb
                    this._active = true;
                    this._s_value = this._value;
                    this._s_mx = mx;
                    this.over = true;
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                this.action({ source: this, event: e, value: this._value, used: this._used, final: true });
                this._active = false;
                this.over = false;
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    let newValue = this._s_value + (mx - this._s_mx) / tw;
                    if (newValue - halfUsed >= 0 && newValue + halfUsed <= 1) {
                        this.update(newValue);
                        this.action({ source: this, event: e, value: this._value, used: this._used, final: false });
                    }
                }
                this.over = (this == over.control);
                this.invalidateBuffer();
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /** @hidden */
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        let cs = this.SCHEME;
        let cnrs = this.CNRS;
        const OPAQUE = cs.C$(3);
        const BORDER = cs.G$(8);
        const UNUSED_TRACK = cs.G$(3);
        const HIGHLIGHT = cs.C$(9);
        const THUMB = cs.C$(5);
        let [w, h, inset, used] = [this._w, this._h, this._inset, this._used];
        let [tx0, tx1] = [inset, w - inset];
        let [tw, th] = [this._trackWidth, this._trackHeight];
        let tbW = Math.max(used * tw, this._minThumbWidth);
        let tbH = this._thumbHeight;
        let tx = this._dvalue * this._trackWidth;
        uic.save();
        if (this._opaque) { // Background
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.fill();
        }
        // Now translate to track left edge - track centre
        uic.translate(inset, this._h / 2);
        // draw track
        uic.fillStyle = UNUSED_TRACK;
        uic.strokeStyle = BORDER;
        uic.lineWidth = 1;
        uic.fillRect(0, -th / 2, tw, th);
        uic.strokeRect(0, -th / 2, tw, th);
        // Draw thumb
        uic.fillStyle = THUMB;
        // uic.noStroke();
        if (this.isActive || this.over) {
            uic.lineWidth = 2;
            uic.strokeStyle = HIGHLIGHT;
        }
        uic.beginPath();
        uic.roundRect(tx - tbW / 2, -tbH / 2, tbW, tbH, cnrs);
        uic.fill();
        uic.stroke();
        if (!this._enabled)
            this._disable_highlight(cs, 0, -h / 2, w - 20, h);
        this._updateScrollerPickBuffer(tx - tbW / 2, -tbH / 2, tbW, tbH);
        uic.restore();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _updateScrollerPickBuffer(tbX, tby, tbw, tbh) {
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        let c = this._gui.pickColor(this);
        pkc.save();
        pkc.fillStyle = c.cssColor;
        // Now translate to track left edge - track centre
        pkc.translate(this._inset, this._h / 2);
        pkc.fillRect(Math.round(tbX), Math.round(tby), tbw, tbh);
        pkc.restore();
    }
    /** @hidden */ tooltip(a) { return this.warn$('tooltip'); }
    /** @hidden */ tipTextSize(a) { return this.warn$('tipTextSize'); }
    /** @hidden */ corners(c) { return this.warn$('corners'); }
}
//# sourceMappingURL=scroller.js.map
/**
 * <p>The option group manages a group of option buttons where only one can
 * be selected at any time.</p>
 * <p>The user should <i>not</i> create instances of this class because the library
 * will make them when needed.</p>
 * @hidden
 */
class CvsOptionGroup {
    /** @hidden */
    constructor(name) {
        this._name = name;
        this._group = new Set();
    }
    /**
     * Add an option to this group.
     * @hidden
     */
    _add(option) {
        // If option is selected then deselect all other options in group
        if (option.isSelected())
            this._group.forEach(opt => opt._deselect());
        this._group.add(option);
    }
    /**
     * Remove an option to this group
     * @hidden
     */
    _remove(option) {
        this._group.delete(option);
    }
    /**
     * @hidden
     * @returns the currently selected option which will be deselected
     */
    _prev() {
        let prev = undefined;
        for (let opt of this._group)
            if (opt.isSelected()) {
                prev = opt;
                break;
            }
        return prev;
    }
}
/*
 ##############################################################################
 CvsOption
 ##############################################################################
 */
/**
 * This class represents an option button (aka radio button). These are usually
 * grouped together so that only one can be selected at a time.
 */
class CvsOption extends CvsTextIcon {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h, true);
        this._selected = false; // 0
        this._createDefaultIcons();
        this.invalidateBuffer();
        this._optGroup = null;
    }
    /** @hidden */
    _createDefaultIcons() {
        const s = this._iSize || this._gui._iSize;
        const cs = this.SCHEME;
        const FG = cs.G$(9), BG = cs.G$(0);
        this._icons = [];
        const ctr = 0.5 + s / 2, r0 = ctr - 2, r1 = 0.5 * r0;
        // False
        let ib = new OffscreenCanvas(s, s);
        let ic = ib.getContext('2d');
        if (ic) {
            ic.clearRect(0, 0, s, s);
            ic.fillStyle = BG;
            ic.strokeStyle = FG;
            ic.lineWidth = 2;
            ic.beginPath();
            ic.arc(ctr, ctr, r0, 0, 2 * Math.PI);
            ic.fill();
            ic.stroke();
        }
        this._icons.push(ib);
        // True
        ib = new OffscreenCanvas(s, s);
        ic = ib.getContext('2d');
        if (ic) {
            ic.clearRect(0, 0, s, s);
            ic.fillStyle = BG;
            ic.strokeStyle = FG;
            ic.lineWidth = 2;
            ic.beginPath();
            ic.arc(ctr, ctr, r0, 0, 2 * Math.PI);
            ic.fill();
            ic.stroke();
            ic.fillStyle = FG;
            ic.beginPath();
            ic.arc(ctr, ctr, r1, 0, 2 * Math.PI);
            ic.fill();
        }
        this._icons.push(ib);
        // Set icon to display
        this._icon = this._icons[Number(this._selected)];
        this.invalidateBuffer();
    }
    /**
     * <p>Replaces the existing icons representing false / true states.</p>
     * <p>The first parameter must be an array of 2 images [falseImage, trueImage]
     * representing the state of the checkbox. It is recomended that the images
     * the same size</p>
     *
     * If provided the last two paratmeters control the icon alignment within
     * the control. </p>
     *
     * <p>Processing constants are used to define the icon alignment.</p>
     * @param icons array of 2 icons [falseImage, trueImage]
     * @param alignH 'left', 'right' or 'center'
     * @param alignV 'top', 'bottom' or 'center'
     * @returns this control or the current icon
     */
    icons(icons, alignH, alignV) {
        if (Array.isArray(icons) && icons.length >= 2) {
            this._icons = [cvsGuiCanvas(icons[0]), cvsGuiCanvas(icons[1])];
            this._icon = this._icons[Number(this._selected)];
            this.iconAlign(alignH, alignV);
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * <p>If there is no parameter then it returns the size of the default
     * radio-button icon is returned.</p>
     * <p>The default icon will be resized and replace any user defined
     * icons.</p>
     *
     * @param size
     * @returns this control
     */
    iconSize(size) {
        if (!Number.isFinite(size))
            return this._iSize || this._gui._iSize;
        this._iSize = Math.ceil(size);
        this._createDefaultIcons();
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Select this option, replacing the previous selection.</p>
     * @returns this control
     */
    select() {
        let curr = this._optGroup?._prev();
        if (curr) {
            curr._selected = false;
            curr._icon = curr._icons[0];
            curr.invalidateBuffer();
        }
        this._selected = true;
        this._icon = this._icons[1];
        this.invalidateBuffer();
        return this;
    }
    /** @hidden */
    _deselect() {
        this._selected = false;
        this._icon = this._icons[0];
        return this;
    }
    /**
     * Get the state of this option button
     * @returns true if this option selected
     */
    isSelected() {
        return this._selected;
    }
    /**
     * <p>Add this option to a named option-group.</p>
     * <p>If the group doesn't exist then it will be created.</p>
     * @returns this control
     */
    group(optGroupName) {
        const og = this._gui.getOptionGroup(optGroupName);
        // if (og)
        this._optGroup = this._gui.getOptionGroup(optGroupName);
        this._optGroup._add(this);
        return this;
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this._clickAllowed = true; // false if mouse moves
                this.over = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    if (this._clickAllowed && !this._selected) {
                        if (this._optGroup) {
                            // If we have an option group then use it to  
                            // replace old selection with this one
                            this.select();
                            this._icon = this._icons[Number(this._selected)];
                            this.action({ source: this, event: e, selected: true });
                        }
                    }
                    this._active = false;
                }
                this._clickAllowed = false;
                this.over = false;
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                this.over = (this == over.control);
                this._tooltip?._updateState(enter);
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /** @hidden */
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        if (this._textInvalid)
            this._formatText();
        this._updateFaceElements();
        if (this._fitWH)
            this._fitToContent();
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const OPAQUE = cs.C$(3, this._alpha);
        const FORE = cs.C$(8);
        const HIGHLIGHT = cs.C$(9);
        uic.save();
        uic.font = this._cssFont;
        // Background
        if (this._opaque) {
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.fill();
        }
        if (this._icon)
            uic.drawImage(this._icon, this._ix, this._iy);
        this._renderTextArea(FORE);
        // Mouse over add border highlight
        if (this.isActive || this.over) {
            uic.strokeStyle = HIGHLIGHT;
            uic.lineWidth = 2;
            uic.beginPath();
            uic.roundRect(1, 1, this._w - 2, this._h - 2, cnrs);
            uic.stroke();
        }
        if (!this._enabled)
            this._disable_highlight(cs, 0, 0, this._w, this._h);
        // Update pick buffer before restoring
        this._updatePickBuffer();
        uic.restore();
        // The last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _updatePickBuffer() {
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        let c = this._gui.pickColor(this);
        pkc.save();
        pkc.fillStyle = c.cssColor;
        pkc.beginPath();
        pkc.roundRect(1, 1, this._w - 1, this._h - 1, this.CNRS);
        pkc.fill();
        pkc.restore();
    }
    /** @hidden */ icon(a, b, c) { return this.warn$('icon'); }
}
//# sourceMappingURL=option.js.map
/**
 * This class supports simple true-false checkbox
 */
class CvsCheckbox extends CvsTextIcon {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h, true);
        this._selected = false; // 0
        this._createDefaultIcons();
        this.invalidateBuffer();
    }
    /** @hidden */
    _createDefaultIcons() {
        const s = this._iSize || this._gui._iSize;
        const cs = this.SCHEME;
        const FG = cs.G$(9), BG = cs.G$(0);
        this._icons = [];
        // False
        let ib = new OffscreenCanvas(s, s);
        let ic = ib.getContext('2d');
        if (ic) {
            ic.fillStyle = FG;
            ic.fillRect(0, 0, s, s);
            ic.fillStyle = BG;
            ic.fillRect(2, 2, s - 4, s - 4);
        }
        this._icons.push(ib);
        // True
        ib = new OffscreenCanvas(s, s);
        ic = ib.getContext('2d');
        if (ic) {
            ic.fillStyle = FG;
            ic.fillRect(0, 0, s, s);
            ic.fillStyle = BG;
            ic.fillRect(2, 2, s - 4, s - 4);
            ic.beginPath();
            ic.strokeStyle = FG;
            ic.lineWidth = 2.5;
            ic.moveTo(0.2 * s, 0.55 * s);
            ic.lineTo(0.45 * s, 0.75 * s);
            ic.lineTo(0.8 * s, 0.2 * s);
            ic.stroke();
        }
        this._icons.push(ib);
        // Set icon to display
        this._icon = this._icons[Number(this._selected)];
        this.invalidateBuffer();
    }
    /**
     * <p>Replaces the existing icons representing false / true states.</p>
     * <p>The first parameter must be an array of 2 images [falseImage, trueImage]
     * representing the state of the checkbox. It is recomended that the images
     * the same size</p>
     *
     * If provided the last two paratmeters control the icon alignment within
     * the control. </p>
     *
     * <p>Processing constants are used to define the icon alignment.</p>
     * @param icons array of 2 icons [falseImage, trueImage]
     * @param alignH 'left', 'right' or 'center'
     * @param alignV 'top', 'bottom' or 'center'
     * @returns this control or the current icon
     */
    icons(icons, alignH, alignV) {
        if (Array.isArray(icons) && icons.length >= 2) {
            this._icons = [cvsGuiCanvas(icons[0]), cvsGuiCanvas(icons[1])];
            this._icon = this._icons[Number(this._selected)];
            this.iconAlign(alignH, alignV);
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * <p>If there is no parameter then it returns the size of the default
     * tick-box icon is returned.</p>
     * <p>The default icon will be resized and replace any user defined
     * icons.</p>
     *
     * @param size
     * @returns this control
     */
    iconSize(size) {
        if (!Number.isFinite(size))
            return this._iSize || this._gui._iSize;
        this._iSize = Math.ceil(size);
        this._createDefaultIcons();
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Select this checkbox.</p>
     * @returns this control
     */
    select() {
        if (!this._selected) {
            this._selected = true;
            this._icon = this._icons[Number(this._selected)];
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * <p>Deselect this checkbox.</p>
     * @returns this control
     */
    deselect() {
        if (this._selected) {
            this._selected = false;
            this._icon = this._icons[Number(this._selected)];
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * Get the state of this checkbox.
     * @returns true if this checkbox is selected
     */
    isSelected() {
        return this._selected;
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                // will be set to false if the mouse is dragged
                this._clickAllowed = true;
                this.over = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    if (this._clickAllowed) {
                        this._selected = !this._selected;
                        this._icon = this._icons[Number(this._selected)];
                        this.action({ source: this, event: e, selected: this._selected });
                    }
                    this._active = false;
                }
                this._clickAllowed = false;
                this.over = false;
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                this.over = (this == over.control);
                this._tooltip?._updateState(enter);
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /** @hidden */
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        if (this._textInvalid)
            this._formatText();
        this._updateFaceElements();
        if (this._fitWH)
            this._fitToContent();
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const OPAQUE = cs.C$(3, this._alpha);
        const FORE = cs.C$(8);
        const HIGHLIGHT = cs.C$(9);
        uic.save();
        uic.font = this._cssFont;
        // Background
        if (this._opaque) {
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, this.CNRS);
            uic.fill();
        }
        if (this._icon)
            uic.drawImage(this._icon, this._ix, this._iy);
        this._renderTextArea(FORE);
        // Mouse over add border highlight
        if (this.isActive || this.over) {
            uic.strokeStyle = HIGHLIGHT;
            uic.lineWidth = 2;
            uic.beginPath();
            uic.roundRect(1, 1, this._w - 2, this._h - 2, cnrs);
            uic.stroke();
        }
        if (!this._enabled)
            this._disable_highlight(cs, 0, 0, this._w, this._h);
        // Update pick buffer before restoring
        this._updatePickBuffer();
        uic.restore();
        // The last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _updatePickBuffer() {
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        let c = this._gui.pickColor(this);
        pkc.save();
        pkc.fillStyle = c.cssColor;
        pkc.beginPath();
        pkc.roundRect(1, 1, this._w - 1, this._h - 1, this.CNRS);
        pkc.fill();
        pkc.restore();
    }
    /** @hidden */ icon(a, b, c) { return this.warn$('icon'); }
}
//# sourceMappingURL=checkbox.js.map
/**
 * <p>This control is used to scroll and zoom on an image.</p>
 * <p>When the mouse moves over the control scrollbars will appear (if needed)
 * inside the bottom and right-hand-side edges of the view. When the mouse is
 * near the centre a slider will appear which can be used to change the scale.</p>
 *
 * <p>This control also supports layers where multiple images can be layered
 * to make the final visual.</p>
 *
 */
class CvsViewer extends CvsBufferedControl {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h, true);
        /** @hidden */ this._layers = [];
        /** @hidden */ this._hidden = new Set();
        // Layer width and height (pixels)
        /** @hidden */ this._lw = 0;
        /** @hidden */ this._lh = 0;
        /** @hidden */ this._wcx = 0;
        /** @hidden */ this._wcy = 0;
        /** @hidden */ this._wscale = 1;
        /** @hidden */ this._usedX = 0;
        /** @hidden */ this._usedY = 0;
        /** @hidden */ this._scalerZone = { x0: 0, y0: 0, x1: 0, y1: 0 };
        /** @hidden */ this._frameWeight = 0;
        this._corners = [0, 0, 0, 0];
        this._scrH = gui.__scroller(this._id + "-scrH", 4, h - 24, w - 28, 20);
        this._scrH.hide()
            .setAction((info) => {
            this.view(info.value * this._lw, this._wcy);
            this.invalidateBuffer();
        });
        this._scrV = gui.__scroller(this._id + "-scrV", w - 24, 4, h - 28, 20);
        this._scrV.orient('south').hide()
            .setAction((info) => {
            this.view(this._wcx, info.value * this._lh);
            this.invalidateBuffer();
        });
        this.addChild(this._scrH);
        this.addChild(this._scrV);
    }
    /**
     * <p>Sets the existing scaler value (if there is no scaler it will be created)
     * and limits. The initial value will be constrained to the limits.</p>
     * @param v the scale to use
     * @param l0 the lowest scale allowed
     * @param l1  the highest scale allowed
     * @returns this control
     */
    scaler(v, l0, l1) {
        if (Number.isFinite(v) && Number.isFinite(l0) && Number.isFinite(l1)) {
            let low = Math.min(l0, l1);
            let high = Math.max(l0, l1);
            let value = _constrain(v, low, high);
            // If we don't have a scaler then create it
            if (!this._scaler) {
                let [w, h] = [this._w, this._h];
                let sclrX = 0.25 * w, sclrY = 0.5 * h - 10;
                let sclrW = 0.5 * w, sclrH = 20;
                this._scaler = this._gui.slider(this._id + "-scaler", sclrX, sclrY, sclrW, sclrH);
                this._scaler.weight(12);
                this._scaler.hide()
                    .setAction((info) => {
                    this._wscale = info.value;
                    this.invalidateBuffer();
                });
                this.addChild(this._scaler);
                this._scalerZone = {
                    x0: 0.15 * w, y0: 0.4 * h - 10,
                    x1: 0.85 * w, y1: 0.6 * h + 10
                };
            }
            // Now update the scroller
            this._scaler?.limits(low, high);
            this._scaler?.value(value);
            this._wscale = value;
            // If we already have layers then update centre position
            if (this._lw > 0 && this._lh > 0) {
                this._wcx = this._lw * this._scrH.getValue();
                this._wcy = this._lh * this._scrV.getValue();
                this.invalidateBuffer();
            }
        }
        return this;
    }
    /**
     * <p>Sets or gets the current scale in use.</p>
     * <p>If no parameters are passed the the current scale is returned. A
     * single parameter sets the current scale and three parameter sets the
     * current scale and the limits for the zoom slider.</p>
     *
     * @param v the scale to use
     * @returns this control or the current scale
     */
    scale(v) {
        if (!Number.isFinite(v)) // no parameters
            return this._wscale;
        if (this._scaler)
            this._scaler.value(v);
        this._wscale = v;
        this.view(this._wcx, this._wcy, this._wscale);
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>The current status is an object with 3 fields <code>\{ cX, cY, scale \}</code>
     * where -</p>
     * <ul>
     * <li><code>cX, cY</code> is the position in the image that correseponds to the view center and</li>
     * <li><code>scale</code> is the current scale used to display the image.</li>
     * </ul>
     * @returns the current status
     */
    status() {
        return { cX: this._wcx, cY: this._wcy, scale: this._wscale };
    }
    /**
     * <p>Make this control invisible</p>
     * @returns this control
     */
    hide() {
        return super.hide(true);
    }
    /**
     * <p>Make this control visible</p>
     * @returns this control
     */
    show() {
        return super.show(true);
    }
    /**
     * <p>Make a layer invisible</p>
     * @param n the layer number &ge;0
     * @returns this control
     */
    hideLayer(n) {
        if (Number.isInteger(n))
            if (n >= 0 && n < this._layers.length && !this._hidden.has(n)) {
                this._hidden.add(n);
                this.invalidateBuffer();
            }
        return this;
    }
    /**
     * <p>Make a layer visible</p>
     * @param n the layer number &ge;0
     * @returns this control
     */
    showLayer(n) {
        if (Number.isInteger(n))
            if (n >= 0 && n < this._layers.length && this._hidden.has(n)) {
                this._hidden.delete(n);
                this.invalidateBuffer();
            }
        return this;
    }
    /**
     * Sets the view of the image to be displayed. If you enter values outside the
     * image or ar scale value outside scaler limts they will be constrained to legal
     * action on the viewer to report back changes to the view centre and/or scale
     * attributes.
    */
    view(wcx, wcy, wscale = this._wscale) {
        function different(a, b) {
            return Math.abs(a - b) >= 0.001;
        }
        if (Number.isFinite(wcx) && Number.isFinite(wcy)) {
            if (different(this._wcx, wcx) || different(this._wcy, wcy)) {
                this._wcx = _constrain(wcx, 0, this._lw);
                this._wcy = _constrain(wcy, 0, this._lh);
                this._scrH.update(wcx / this._lw);
                this._scrV.update(wcy / this._lh);
                this.invalidateBuffer();
            }
            if (different(this._wscale, wscale)) {
                this._wscale = wscale;
                if (this._scaler)
                    this._scaler.value(wscale);
                this.invalidateBuffer();
            }
            this.action({
                source: this, event: undefined,
                cX: this._wcx, cY: this._wcy, scale: this._wscale
            });
        }
        return this;
    }
    /**
     * <p>Sets the image(s) to be displayed in this viewer. Any pre-existing
     * layers will be deleted.</p>
     * <p>All images will be resized to match the first (bottom) layer.</p>
     *
     * @param img an image or an array of images
     * @returns this control
     */
    layers(img) {
        let imgList = (Array.isArray(img) ? Array.from(img) : [img]);
        this._layers = [cvsGuiCanvas(imgList.shift())];
        this._lw = this._layers[0].width;
        this._lh = this._layers[0].height;
        // Now set the world centre based on scrollers
        this._wcx = this._scrH.getValue() * this._lw;
        this._wcy = this._scrV.getValue() * this._lh;
        // Append any remiang images
        if (imgList.length > 0)
            this.appendLayers(imgList);
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Appends additional image(s) to those already in this viewer. These
     * images will appear above any pre-existing layers.</p>
     *
     * <p>The additional images will be resized to match the first (bottom)
     * layer.</p>
     *
     * @param img an image or an array of images
     * @returns this control
     */
    appendLayers(img) {
        // If no existing layers then fresh start. 
        if (this._layers.length === 0)
            return this.layers(img);
        // Ready to append to existing layers
        let imgList = (Array.isArray(img) ? Array.from(img) : [img]);
        imgList.forEach(image => this._layers.push(this._getImageToFit(image)));
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Adds additional images the image(s) to those already displayed in
     * this viewer. They will be inserted after the position by the first
     * parameter.</p>
     *
     * <p>All additional images will be resized to match the first (bottom)
     * layer.</p>
     *
     * @param idx an image or an array of images
     * @param img an image or an array of images
     * @returns this control
     */
    addLayers(idx, img) {
        // If no existing layers then fresh start. 
        if (this._layers.length === 0)
            return this.layers(img);
        // Constrain insertion point to valid array position
        idx = Number.isFinite(idx) && idx >= 0 && idx < this._layers.length
            ? idx : this._layers.length - 1;
        // Create new list with images resized to fit
        let imgList = (Array.isArray(img) ? Array.from(img) : [img]);
        let imgFitList = imgList.map(image => this._getImageToFit(image));
        this._layers.splice(idx, 0, ...imgFitList);
        this.invalidateBuffer();
        return this;
    }
    /**
     * Deletes one or more layers from this viewer.
     *
     * @param idx the starting layer to delete
     * @param nbr the number of layers to delete
     * @returns this control
     */
    deleteLayers(idx, nbr) {
        if (Number.isFinite(idx) && Number.isFinite(nbr)) {
            if (idx >= 0 && idx < this._layers.length)
                this._layers.splice(idx, nbr);
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * Sets the stroke weight to use for the frame. If not provided
     * or &lt;0 then no frame is drawn.
     * @param sw the stroke weight for the frame
     * @returns this control
     */
    frame(sw = 0) {
        this._frameWeight = sw < 0 ? 0 : sw;
        return this;
    }
    /** @hidden */
    _getImageToFit(img) {
        const [lw, lh] = [this._lw, this._lh];
        img = cvsGuiCanvas(img);
        if (img.width != lw || img.height != lh) {
            let layer = new OffscreenCanvas(lw, lh);
            const ctx = layer.getContext('2d');
            ctx?.drawImage(img, 0, 0, img.width, img.height, 0, 0, lw, lh);
            return layer;
        }
        return img;
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let absPos = this.getAbsXY();
        let [mx, my, cw, ch] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        this.over = (mx >= 0 && mx <= cw && my >= 0 && my <= ch);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this.over = true;
                this._dragging = true;
                // Remember starting values
                this._mx0 = this._pmx = mx;
                this._my0 = this._pmy = my;
                this._dcx = this._wcx;
                this._dcy = this._wcy;
                this._scrH.show();
                this._scrV.show();
                this.invalidateBuffer();
                break;
            case 'mouseout':
                this._scrH.hide();
                this._scrV.hide();
            case 'mouseup':
            case 'touchend':
                this.action({
                    source: this, event: undefined,
                    cX: this._wcx, cY: this._wcy, scale: this._wscale
                });
                this._active = false;
                this._dragging = false;
                this.over = false;
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.over) {
                    if (this._dragging) {
                        this._scaler?.hide();
                        this._validateMouseDrag(this._dcx + (this._mx0 - mx) / this._wscale, this._dcy + (this._my0 - my) / this._wscale);
                        this.invalidateBuffer();
                    }
                    else if (this._scaler) {
                        let a = this._scalerZone;
                        let v = mx >= a.x0 && mx <= a.x1 && my >= a.y0 && my <= a.y1;
                        if (v)
                            this._scaler.show();
                        else
                            this._scaler.hide();
                    }
                    this._scrH.show();
                    this._scrV.show();
                }
                else {
                    this._scrH.hide();
                    this._scrV.hide();
                }
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.over ? this : null;
    }
    /** @hidden */
    _validateMouseDrag(ncx, ncy) {
        let ww2 = Math.round(0.5 * this._w / this._wscale);
        let wh2 = Math.round(0.5 * this._h / this._wscale);
        // See if the current display should be pinned
        let cleft = this._wcx - ww2, cright = this._wcx + ww2;
        let ctop = this._wcy - wh2, cbottom = this._wcy + wh2;
        let pinnedH = (cleft < 0 && cright > this._lw);
        let pinnedV = (ctop < 0 && cbottom > this._lh);
        // Now cosnider the 'new' centre
        let left = ncx - ww2, right = ncx + ww2;
        let top = ncy - wh2, bottom = ncy + wh2;
        if (pinnedH || left < 0 && right > this._lw) // Horizontal
            ncx = this._lw / 2;
        else if (_xor(left < 0, right > this._lw))
            if (left < 0)
                ncx -= left;
            else
                ncx += this._lw - right;
        if (pinnedV || top < 0 && bottom > this._lh) // vertical
            ncy = this._lh / 2;
        else if (_xor(top < 0, bottom > this._lh))
            if (top < 0)
                ncy -= top;
            else
                ncy += this._lh - bottom;
        this.view(ncx, ncy);
        this.invalidateBuffer();
    }
    /** @hidden */
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        const cs = this.SCHEME;
        const [ws, wcx, wcy] = [this._wscale, this._wcx, this._wcy];
        const [w, h, lw, lh] = [this._w, this._h, this._lw, this._lh];
        const OPAQUE = cs.C$(2, this._alpha);
        const FRAME = cs.C$(7);
        uic.save();
        if (this._opaque) {
            uic.fillStyle = OPAQUE;
            uic.fillRect(0, 0, this._w, this._h);
        }
        else {
            uic.clearRect(0, 0, this._w, this._h);
        }
        // Get corners of requested view
        const ww2 = Math.round(0.5 * w / ws);
        const wh2 = Math.round(0.5 * h / ws);
        const o = this._overlap(0, 0, lw, lh, // image corners
        wcx - ww2, wcy - wh2, wcx + ww2, wcy + wh2); // world corners
        this._pkBox = [
            Math.round(o.offsetX * ws),
            Math.round(o.offsetY * ws),
            Math.round(o.width * ws),
            Math.round(o.height * ws)
        ];
        // If we have an offset then calculate the view image 
        if (o.valid) { // Calculate display offset
            for (let i = 0; i < this._layers.length; i++) {
                if (!this._hidden.has(i) && this._layers[i]) {
                    uic.drawImage(this._layers[i], o.left, o.top, o.width, o.height, o.offsetX * ws, o.offsetY * ws, o.width * ws, o.height * ws);
                }
            }
        }
        if (this._frameWeight > 0) {
            const fw = this._frameWeight;
            uic.lineWidth = fw;
            uic.strokeStyle = FRAME;
            uic.strokeRect(fw / 2, fw / 2, this._w - fw, this._h - fw);
        }
        this._updatePickBuffer();
        uic.restore();
    }
    /** @hidden */
    _updatePickBuffer() {
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        const [x, y, w, h] = [...this._pkBox];
        const c = this._gui.pickColor(this);
        pkc.save();
        pkc.fillStyle = 'white';
        pkc.fillRect(0, 0, this._w, this._h);
        pkc.fillStyle = c.cssColor;
        pkc.fillRect(x, y, w, h);
        pkc.restore();
    }
    /**
     * <p>the 'a' parameters represent the image size i.e. [0, 0, image_width, imgaeHeight]
     * and 'b' the view area taking into account scaling.</p>
     * @hidden
     */
    _overlap(ax0, ay0, ax1, ay1, bx0, by0, bx1, by1) {
        let topA = Math.min(ay0, ay1);
        let botA = Math.max(ay0, ay1);
        let leftA = Math.min(ax0, ax1);
        let rightA = Math.max(ax0, ax1); // image edges
        let topB = Math.min(by0, by1);
        let botB = Math.max(by0, by1);
        let leftB = Math.min(bx0, bx1);
        let rightB = Math.max(bx0, bx1); // world edges
        if (botA <= topB || botB <= topA || rightA <= leftB || rightB <= leftA)
            return {
                valid: false, left: 0, right: 0, top: 0, bottom: 0,
                width: 0, height: 0, offsetX: 0, offsetY: 0,
            };
        let leftO = leftA < leftB ? leftB : leftA;
        let rightO = rightA > rightB ? rightB : rightA;
        let botO = botA > botB ? botB : botA;
        let topO = topA < topB ? topB : topA;
        let width = rightO - leftO;
        let height = botO - topO;
        let offsetX = leftO - leftB;
        let offsetY = topO - topB;
        // Update scrollers
        this._scrH.update(undefined, width / this._lw);
        this._scrV.update(undefined, height / this._lh);
        return {
            valid: true,
            left: leftO, right: rightO, top: topO, bottom: botO,
            width: width, height: height,
            offsetX: offsetX, offsetY: offsetY,
        };
    }
    // Hide these methods from typeDoc
    /** @hidden */ orient(dir) { return this.warn$('orient'); }
    /** @hidden */ tooltip(a) { return this.warn$('tooltip'); }
    /** @hidden */ tipTextSize(a) { return this.warn$('tipTextSize'); }
    /** @hidden */ corners(c) { return this.warn$('corners'); }
}
//# sourceMappingURL=viewer.js.map
/**
 * This class supports a single line text entry field.
 *
 * The left/right arrow keys move the text-insertion-point within the
 * text. Used in combination with the shift key it enables part or all
 * of the text to be selected. The entire text can be selected with the
 * Ctrl+A or Cmd+A keys.
 *
 * Selected text can be copied with the Ctrl+C or Cmd+C keys and pasted at
 * the current text-insertion-point with the Ctrl+V or Cmd+V keys. The
 * Ctrl+X or Cmd+X keys will cut (and copy) the selected text.
 *
 * If no text is selected then the arrows keys can move off the current
 * control to another. This only works if each textfield has a unique
 * index number (&gt0;).
 *
 * If the control has the index value 'idx' then the next control depends
 * on the arrow key pressed - <br>
 * left : idx - 1 <br>
 * right : idx + 1 <br>
 * up : idx - offset <br>
 * down : idx + offset <br>
 *
 * The offset value is set when initialising the idx value with the
 * <code>index(idx, deltaIndex)</code> method.
 *
 * No other controls can be used while a textfield control is active. Pressing
 * 'Enter' or attempting to move to a non-existant textfield deactivates the
 * current textfield.
 *
 * The user can provide their own validation function which is checked when
 * the control is deativated.
 *
 */
class CvsTextField extends CvsText {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h, true);
        /** @hidden */ this._linkOffset = 0;
        /** @hidden */ this._prevCsrIdx = 0;
        /** @hidden */ this._currCsrIdx = 0;
        /** @hidden */ this._line = '';
        /** @hidden */ this._cursorOn = false;
        /** @hidden */ this._inputInvalid = false;
        this.textAlign("left", "top");
        this.invalidateBuffer();
    }
    // Clipboard
    /** @hidden */ get snip() { return this._gui._clipboard; }
    /** @hidden */ set snip(txt) { this._gui._clipboard = txt; }
    /**
     * Set a unique index number for this text field.
     *
     * @param idx unique index number
     * @param deltaIndex relative link when using up/down arrow keys
     * @returns this control
     */
    index(idx, deltaIndex) {
        if (Number.isFinite(idx)) {
            if (deltaIndex && Number.isFinite(deltaIndex))
                this._linkOffset = deltaIndex;
            this._linkIndex = idx;
            if (!this._gui._links)
                this._gui._links = new Map();
            this._gui._links.set(idx, this);
        }
        return this;
    }
    /**
     * Removes the link index from this textfield. After this it will not be possible
     * to move focus to this textfield using the keyboard arrows.
     * @returns this control
     */
    noIndex() {
        if (Number.isFinite(this._linkIndex))
            this._gui._links?.delete(Number(this._linkIndex));
        this._linkIndex = undefined;
        return this;
    }
    /**
     * Gets or sets the current text.
     * Any EOL characters are stripped out of the string. If necessary the
     * string length will be reduced until it will fit inside the textfield.
     * If a validation function has been set then the string will be
     * validated.
     *
     * @param text a string representing text to display
     * @returns this control for setter
     */
    text(text) {
        if (text == null || text == undefined) // getter
            return this._line;
        this.invalidateText();
        this.invalidateBuffer();
        this._line = this._delEOL(text);
        this._performValidation();
        return this;
    }
    /** @hidden */
    textAlign(alignW, alignH) { return this; }
    /** @hidden */
    noText() { return this; }
    /**
     * True if the text has passed validation. If there is no validation
     * function this is always true.
     */
    get isValid() {
        return !this._validation || !this._inputInvalid;
    }
    /**
     * True if there is some text and it has been accepted by a validation
     * function. If there is no text then this will be false.</p>
     */
    get hasValidText() {
        return this._line.length > 0 && !this._inputInvalid;
    }
    /**
     * <p>If the text is invalid this method sets the text as being valid and
     * changes the visual appearance accordingly. This will remain in effect
     * until the next time the text is validated.</p>
     * @returns this control
     */
    setTextValid() {
        if (this._inputInvalid) {
            this._inputInvalid = false;
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * Set the validation function to be used for this control.
     *
     * The function is created by the user and should return an array of
     * two elements e.g. <code>[valid, valid-text]</code>
     *
     * <code>valid</code> is a boolean indicating if the text entered is valid and<br>
     * <code>valid-text</code> can be the original text or amended in some way.
     *
     * For instance a textfield used for getting a persons name will be valid
     * if there are 2 or more words and the valid-text will be the name
     * but with the first letter of each word being capatilised.
     *
     * @param vfunc the validation function
     * @returns this control
     */
    validation(vfunc) {
        this._validation = vfunc;
        return this;
    }
    /**
     * Validate the text
     * @hidden
     */
    _performValidation() {
        this._inputInvalid = false; // Assume it is valid
        if (this._validation) {
            // CLOG(`Applying validation`)
            let r = this._validation(this._line);
            if (Array.isArray(r) && r.length > 0) {
                this._inputInvalid = !Boolean(r[0]);
                // Validator has returned formatted text?
                if (r[1])
                    this._line = this._delEOL(r[1]);
            }
        }
    }
    /**
     * Deactivate this control.
     * @hidden
     */
    _deactivate() {
        this._active = false;
        this.over = false;
        this._cursorOn = false;
        this._performValidation();
        this._prevCsrIdx = this._currCsrIdx = this._line.length;
        if (this._inputInvalid)
            this._prevCsrIdx = 0;
        this.invalidateBuffer();
        this._nextActive = null;
    }
    /**
     * Activate this control to receive keyboard events. Occurs if the user
     * clicks on the control or is 'tabbed' into the control.
     * @hidden
     */
    _activate(selectAll = false) {
        this._active = true;
        this._cursorOn = true;
        // Set cursor flashing while active
        setTimeout(() => this._flashCursor(), 550);
        this.invalidateBuffer();
        this._nextActive = this;
    }
    /** @hidden */
    _flashCursor() {
        if (this._active) {
            this._cursorOn = !this._cursorOn;
            setTimeout(() => this._flashCursor(), 550);
        }
        else
            this._cursorOn = false;
        this.invalidateBuffer();
    }
    /**
     * Called when this control passes focus to a new control.
     * @param idx the index for the control to be activated
     * @hidden
     */
    _activateNext(offset) {
        const links = this._gui._links;
        let ctrl = null;
        if (links && this._linkIndex) {
            let idx = this._linkIndex;
            do {
                idx += offset;
                ctrl = links.get(idx);
            } while (ctrl && (!ctrl.isEnabled || !ctrl.isVisible));
            ctrl?._activate();
            this._nextActive = ctrl;
            this.invalidateBuffer();
        }
    }
    /**
     * Calculates the pixel length for a given character position.
     * @hidden
     */
    _cursorX(idx = 0) {
        return idx == 0
            ? 0
            : this._textMetrics(this._line.substring(0, idx)).fWidth;
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._activate();
                break;
            case 'mousemove':
            case 'touchmove':
                this.over = (this == over.control);
                this._tooltip?._updateState(enter);
                this.invalidateBuffer();
                break;
        }
        return this._nextActive;
    }
    /** @hidden */
    _doKeyEvent(e) {
        this._nextActive = this;
        let hasSelection = this._prevCsrIdx != this._currCsrIdx;
        let tabLeft = Boolean(this._linkIndex && !hasSelection && this._currCsrIdx == 0);
        let tabRight = Boolean(this._linkIndex && !hasSelection && this._currCsrIdx >= this._line.length);
        if (e.type == 'keydown') {
            if (e.key.length == 1) { // single character key
                // If the control or meta key has been pressed then perform 
                // appropraite selected text action'
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 'a': // select all
                            this._prevCsrIdx = 0;
                            this._currCsrIdx = this._line.length;
                            break;
                        case 'c': // copy selected text
                            if (hasSelection)
                                this.snip = this._line.substring(this._prevCsrIdx, this._currCsrIdx);
                            break;
                        case 'v': //paste copied text
                            if (hasSelection)
                                this._line = this._delSelected(this._line);
                            if (this.snip.length > 0)
                                this._line = this._insChar(this.snip, this._line, this._currCsrIdx);
                            this._currCsrIdx += this.snip.length;
                            this._prevCsrIdx = this._currCsrIdx;
                            break;
                        case 'x': // delete selected text
                            if (hasSelection) {
                                this.snip = this._line.substring(this._prevCsrIdx, this._currCsrIdx);
                                this._line = this._delSelected(this._line);
                                this._prevCsrIdx = this._currCsrIdx = Math.min(this._currCsrIdx, this._prevCsrIdx);
                            }
                    }
                }
                else {
                    if (hasSelection)
                        this._line = this._delSelected(this._line);
                    this._line = this._insChar(e.key, this._line, this._currCsrIdx);
                    this._currCsrIdx++;
                    this._prevCsrIdx++;
                    this.invalidateBuffer();
                }
            }
            switch (e.key) {
                case 'ArrowLeft':
                    if (tabLeft) {
                        this._deactivate();
                        this._activateNext(-1);
                        this.action({ source: this, event: e, value: this._line, valid: !this._inputInvalid });
                    }
                    else {
                        if (this._currCsrIdx > 0) {
                            if (!e.shiftKey && hasSelection)
                                this._currCsrIdx = Math.min(this._currCsrIdx, this._prevCsrIdx);
                            else
                                this._currCsrIdx--;
                            if (!e.shiftKey)
                                this._prevCsrIdx = this._currCsrIdx;
                        }
                    }
                    break;
                case 'ArrowRight':
                    if (tabRight) {
                        this._deactivate();
                        this._activateNext(1);
                        this.action({ source: this, event: e, value: this._line, valid: !this._inputInvalid });
                    }
                    else {
                        if (this._currCsrIdx <= this._line.length) {
                            if (!e.shiftKey && hasSelection)
                                this._currCsrIdx = Math.max(this._currCsrIdx, this._prevCsrIdx);
                            else
                                this._currCsrIdx++;
                            if (!e.shiftKey)
                                this._prevCsrIdx = this._currCsrIdx;
                        }
                    }
                    break;
                case 'ArrowUp':
                    if (!hasSelection) {
                        if (this._linkOffset) {
                            this._deactivate();
                            this._activateNext(-this._linkOffset);
                        }
                        this.action({ source: this, event: e, value: this._line, valid: !this._inputInvalid });
                    }
                    break;
                case 'ArrowDown':
                    if (!hasSelection) {
                        if (this._linkOffset) {
                            this._deactivate();
                            this._activateNext(this._linkOffset);
                        }
                        this.action({ source: this, event: e, value: this._line, valid: !this._inputInvalid });
                    }
                    break;
                case 'Enter':
                    this._deactivate();
                    this.action({ source: this, event: e, value: this._line, valid: !this._inputInvalid });
                    break;
                case 'Backspace':
                    if (this._prevCsrIdx != this._currCsrIdx) {
                        this._line = this._delSelected(this._line);
                    }
                    else { // Delete character to left
                        if (this._currCsrIdx > 0) {
                            this._line = this._delChar(this._line, this._currCsrIdx - 1);
                            this._currCsrIdx--;
                            this._prevCsrIdx = this._currCsrIdx;
                        }
                    }
                    break;
                case 'Delete':
                    if (this._prevCsrIdx != this._currCsrIdx) {
                        this._line = this._delSelected(this._line);
                    }
                    else { // Delete character to right
                        if (this._currCsrIdx < this._line.length)
                            this._line = this._delChar(this._line, this._currCsrIdx);
                    }
                    break;
                default:
            }
            this.invalidateBuffer();
        } // End of key down
        return this._nextActive;
    }
    /** @hidden */
    _delEOL(line) {
        line = String(line);
        return line.replaceAll('\n', ' ');
    }
    /** @hidden */
    _delChar(line, pos) {
        line = String(line);
        return line.substring(0, pos) + line.substring(pos + 1);
    }
    /** @hidden */
    _insChar(chars, line, pos) {
        line = String(line);
        return line.substring(0, pos) + chars + line.substring(pos);
    }
    /**
     * Remove any user selected text
     * @hidden
     */
    _delSelected(line) {
        line = String(line);
        let p0 = Math.min(this._prevCsrIdx, this._currCsrIdx);
        let p1 = Math.max(this._prevCsrIdx, this._currCsrIdx);
        this._prevCsrIdx = this._currCsrIdx = p0;
        return line.substring(0, p0) + line.substring(p1);
    }
    /** @hidden */
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const [isetH, isetV] = [Math.max(...cnrs) + ISET_H, 2 * ISET_V];
        const [taX, taY, taW, taH] = [isetH, isetV, this._w - 2 * isetH, this._h - 2 * isetV];
        const CURSOR = cs.G$(9);
        const SELECT = cs.C$(3);
        const LIGHT = cs.C$(1);
        const DARK = cs.C$(9);
        const ACTIVE_BACK = cs.G$(0);
        let FORE = DARK;
        uic.save();
        uic.font = this._cssFont;
        uic.textBaseline = 'top';
        // Draw background based on whether active or not
        if (this.isActive) {
            uic.fillStyle = ACTIVE_BACK;
            uic.strokeStyle = DARK;
        }
        else { // Control is inactive so colors depend on text validity
            if (!this._inputInvalid) {
                uic.fillStyle = LIGHT;
                uic.strokeStyle = DARK;
            }
            else {
                uic.fillStyle = DARK;
                uic.strokeStyle = LIGHT;
                FORE = LIGHT;
            }
        }
        uic.lineWidth = 2;
        uic.beginPath();
        uic.roundRect(1, 1, this._w - 2, this._h - 2, cnrs);
        uic.fill();
        uic.stroke();
        // Clip to textArea
        uic.save();
        uic.beginPath();
        uic.rect(taX - 2, taY, taW + 4, taH);
        uic.clip();
        // Current cursor pixel position
        const cx = this._cursorX(this._currCsrIdx);
        // If active display any selection area
        if (this.isActive) {
            const offsetX = cx - taW;
            // If tx > 0 then cursor is outside visible area
            if (offsetX > 0)
                uic.translate(-offsetX, 0);
            // Show any selected text
            if (this._currCsrIdx != this._prevCsrIdx) {
                const px = this._cursorX(this._prevCsrIdx);
                const cx0 = taX + Math.min(px, cx), cx1 = Math.abs(px - cx);
                uic.fillStyle = SELECT;
                uic.fillRect(cx0, 1.5, cx1, this._h - 3);
            }
        }
        if (this._line.length > 0) {
            uic.fillStyle = FORE;
            const tm = this._textMetrics(this._line);
            const fh = tm.fHeight;
            uic.fillText(this._line, taX, taY + (taH - fh) / 2);
        }
        // Draw cursor
        if (this._active && this._cursorOn) {
            uic.fillStyle = CURSOR;
            uic.fillRect(taX + cx - 0.9, 0, 1.8, this._h);
        }
        uic.restore(); // Clipping ends
        // Mouse over control highlight
        if (this.over) {
            uic.strokeStyle = FORE;
            uic.lineWidth = 3;
            uic.beginPath();
            uic.roundRect(1.5, 1.5, this._w - 3, this._h - 3, cnrs);
            uic.stroke();
        }
        // Control disabled highlight
        if (!this._enabled)
            this._disable_highlight(cs, 0, 0, this._w, this._h);
        this._updatePickBuffer();
        uic.restore();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _updatePickBuffer() {
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        let c = this._gui.pickColor(this);
        pkc.save();
        pkc.fillStyle = c.cssColor;
        pkc.beginPath();
        pkc.roundRect(1, 1, this._w - 1, this._h - 1, this.CNRS);
        pkc.fill();
        pkc.restore();
    }
    /** @hidden */ orient(a) { return this.warn$('orient'); }
}
//# sourceMappingURL=textfield.js.map
/**
 * <p>This class simulates a multi-mode joystick. Each of the three possible
 * modes apply different constraints to the range of movement allowed they
 * are -.</p>
 * <p><code>'X0'</code> : can move in any direction (360&deg;). This is the default value.<br>
 * <code>'X4'</code> : constrained to the 4 main compass directions
 * (N, E, S, W).<br>
 * <code>'X8'</code> : constrained to the 8 main compass directions
 * (N, NE, E, SE, S, SW, W, NW).</p>
 *
 * <p>To handle events use the <code>setAction</code> method to specify
 * the action-method that will be used to process action-info objects
 * created when the joystick is moved.</p>
 * <p>The action-info object has several very useful fields that describes
 * the state of the joystick, they include -</p>
 * <p>
 * <ul>
 * <li><code>dir</code></li>
 * <p>An integer that indicates the direction the stick is pushed. The values
 * returned depend on the current mode -</p>
 * <pre>
 * <b>Direction values for X4 and X8 modes</b>
 *      5   6   7
 *       \  |  /
 *        \ | /
 *    4 --- <b>Z</b> --- 0       <b>Z</b> is the dead zone.
 *        / | \
 *       /  |  \          If control is in mode 'X0' or the joystick
 *      3   2   1         position is in the dead zone then the value is -1
 * </pre>
 * <p><code>'X0'</code> : always -1<br>
 * <code>'X4'</code> : 0, 2, 4 or 6<br>
 * <code>'X8'</code> : 0, 1, 2, 3, 4, 5, 6 or 7</p>
 *
 * <li><code>dead</code></li>
 * <p>If the stick is in the dead zone which surrounds the stick's
 * rest state then this value will be <code>true</code>.</p>
 *
 * <li><code>mag</code></li>
 * <p>The magnitude is in range &ge; 0 and &le; 1 representing
 * the distance the stick has been pushed.</p>
 *
 * <li><code>angle</code>
 * <p>The angle is in range &ge; 0 and &lt; 2&pi;
 * representing the angle the stick makes to the poistive x axis in the
 * clockwise direction. In modes X4 and X8 the angles will be constrained to
 * the permitted directions.</p>
 *
 * <li><code>final</code></li>
 * <p>This is <code>false</code> if the stick is still being moved and
 * <code>true</code> if the stick has been released.</p>
 * </ul>
 * <p>When the joystick is released it will return back to its rest state
 * i.e. centered.</p>
 */
class CvsJoystick extends CvsBufferedControl {
    /**
      * @hidden
      * @param gui the gui controller
      * @param name unique name for this control
      * @param x left-hand pixel position
      * @param y top pixel position
      * @param w width
      * @param h height
      */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h, true);
        this._size = Math.min(w, h);
        this._pr0 = 0.05 * this._size;
        this._pr1 = 0.40 * this._size;
        this._tSize = Math.max(0.075 * this._size, 6);
        this._mode = 'X0';
        this._mag = 0;
        this._ang = 0;
        this._opaque = false;
        this._tmrID = undefined;
    }
    /**
     * The mode defines the constraints applied to movement of the joystick. There are three
     * permitted modes -<p>
     * <ul>
     * <li>'X0' : can move in any direction (360&deg;). This is the default value.</li>
     * <li>'X4' : constrained to the 4 main compass directions (N, E, S, W).</li>
     * <li>'X8' : constrained to the 8 main compass directions (N, NE, E, SE, S, SW, W, NW).</li>
     * </ul>
     * <p>Any other value will be silently ignored.</p>
     * @param m either 'X0', 'X4' or 'X8'
     * @returns this control
     */
    mode(m) {
        if (!m)
            return this._mode;
        m = m.toUpperCase();
        switch (m) {
            case 'X0':
            case 'X4':
            case 'X8':
                if (this._mode != m) {
                    this._mode = m;
                    this.invalidateBuffer();
                }
        }
        return this;
    }
    /**
     * Set the thumb size.
     * @param ts the diameter of the thumb
     * @returns this control
     */
    thumbSize(ts) {
        this._tSize = ts;
        return this;
    }
    /**
     * Converts the polar position to cartesian cooordinates.
     * @hidden
     */
    _getThumbXY() {
        return [this._mag * Math.cos(this._ang), this._mag * Math.sin(this._ang)];
    }
    /**
     * Validates the mouse / touch position based on joystick size and mode.
     * @hidden
     */
    _validateThumbPosition(x, y) {
        let mag = _constrain(Math.sqrt(x * x + y * y), 0, this._pr1);
        let ang = Math.atan2(y, x);
        ang += ang < 0 ? 2 * Math.PI : 0;
        let dead = mag <= this._pr0;
        let dir = -1, da;
        switch (this._mode) {
            case 'X4':
                da = Math.PI / 2;
                dir = Math.floor((ang + da / 2) / da) % 4;
                ang = da * dir;
                dir *= 2;
                break;
            case 'X8':
                da = Math.PI / 4;
                dir = Math.floor((ang + da / 2) / da) % 8;
                ang = da * dir;
                break;
        }
        [this._mag, this._ang, this._dir, this._dead] = [mag, ang, dir, dead];
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        /** @hidden */
        function getValue(source, event, fini) {
            let mag = (source._mag - source._pr0) / (source._pr1 - source._pr0);
            return {
                source: source, event: event, final: fini, mag: mag,
                angle: source._ang, dir: source._dir, dead: source._dead,
            };
        }
        let [mx, my, w, h] = this._orientation.xy(x - this._x, y - this._y, this.w, this.h);
        mx -= w / 2;
        my -= h / 2; // Make relative to joystick centre
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this.over = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                this._validateThumbPosition(mx, my);
                this.action(getValue(this, e, true));
                this._active = false;
                this.invalidateBuffer();
                if (!this._tmrID)
                    this._tmrID = setInterval(() => {
                        this._mag -= 0.07 * this._size;
                        if (this._mag <= 0) {
                            clearInterval(this._tmrID);
                            this._tmrID = undefined;
                            this._mag = 0;
                        }
                        this.invalidateBuffer();
                    }, 25);
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    this._validateThumbPosition(mx, my);
                    this.action(getValue(this, e, false));
                }
                this.over = (this == over.control);
                this._tooltip?._updateState(enter);
                this.invalidateBuffer();
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /** @hidden */
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        let cs = this.SCHEME;
        let cnrs = this.CNRS;
        let [tx, ty] = [this._mag * Math.cos(this._ang), this._mag * Math.sin(this._ang)];
        const OPAQUE = cs.C$(3, this._alpha); //cs.C(3, this._alpha);
        const DIAL_FACE = cs.C$(1);
        const DIAL_TINT = cs.T$(0);
        const DIAL_BORDER = cs.C$(9);
        const THUMB_STROKE = cs.C$(9);
        const THUMB_OFF = cs.C$(4);
        const THUMB_OVER = cs.C$(6);
        const ROD = cs.C$(7);
        const MARKERS = cs.C$(8);
        const DEAD_ZONE = cs.T$(2);
        uic.save();
        if (this._opaque) {
            uic.beginPath();
            uic.fillStyle = OPAQUE;
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.fill();
        }
        uic.translate(uib.width / 2, uib.height / 2);
        // dial face background
        uic.beginPath();
        uic.fillStyle = DIAL_FACE;
        uic.ellipse(0, 0, this._pr1, this._pr1, 0, 0, 2 * Math.PI);
        uic.fill();
        // dial face highlight
        let s = 0, e = 0.26 * this._size, da = 0;
        uic.beginPath();
        uic.fillStyle = DIAL_TINT;
        uic.ellipse(0, 0, e, e, 0, 0, 2 * Math.PI);
        uic.ellipse(0, 0, e * 0.625, e * 0.625, 0, 0, 2 * Math.PI);
        uic.fill();
        // Dial face markers
        uic.strokeStyle = MARKERS;
        switch (this._mode) {
            case 'X0':
                uic.beginPath();
                s = this._pr1;
                da = Math.PI / 8;
                let r = [0.6, 0.22, 0.35, 0.22];
                uic.save();
                uic.lineWidth = 0.75;
                for (let i = 0; i < 16; i++) {
                    e = s * r[i % 4];
                    uic.moveTo(s, 0);
                    uic.lineTo(s - e, 0);
                    uic.rotate(da);
                }
                uic.stroke();
                uic.restore();
                break;
            case 'X8':
                uic.beginPath();
                s = this._pr0;
                e = 0.625 * this._pr1;
                da = Math.PI / 4;
                uic.save();
                uic.lineWidth = 1;
                for (let i = 0; i < 8; i++) {
                    uic.moveTo(s, 0);
                    uic.lineTo(e, 0);
                    uic.rotate(da);
                }
                uic.stroke();
                uic.restore();
            case 'X4':
                uic.beginPath();
                s = this._pr0;
                e = 0.85 * this._pr1;
                da = Math.PI / 2;
                uic.save();
                uic.lineWidth = 1.25;
                for (let i = 0; i < 4; i++) {
                    uic.moveTo(s, 0);
                    uic.lineTo(e, 0);
                    uic.rotate(da);
                }
                uic.stroke();
                uic.restore();
                break;
        }
        // Dial border
        uic.beginPath();
        uic.strokeStyle = DIAL_BORDER;
        uic.lineWidth = Math.max(3, 0.025 * this._size);
        uic.ellipse(0, 0, this._pr1, this._pr1, 0, 0, 2 * Math.PI);
        uic.stroke();
        // Dead zone
        uic.beginPath();
        uic.fillStyle = DEAD_ZONE;
        uic.ellipse(0, 0, this._pr0, this._pr0, 0, 0, 2 * Math.PI);
        uic.stroke();
        // Stick     
        uic.beginPath();
        uic.strokeStyle = ROD;
        uic.lineWidth = this._size * 0.05;
        uic.moveTo(0, 0);
        uic.lineTo(tx, ty);
        uic.stroke();
        // Thumb
        uic.beginPath();
        uic.lineWidth = 2;
        uic.strokeStyle = THUMB_STROKE;
        uic.fillStyle = (this.isActive || this.over) ? THUMB_OVER : THUMB_OFF;
        uic.ellipse(tx, ty, this._tSize, this._tSize, 0, 0, 2 * Math.PI);
        uic.fill();
        uic.stroke();
        uic.restore();
        this._updatePickBuffer(tx, ty, this._tSize);
        if (!this._enabled)
            this._disable_highlight(cs, 0, 0, this._w, this._h);
        this._bufferInvalid = false; // Finally mark as valid
    }
    /** @hidden */
    _updatePickBuffer(tx, ty, tSize) {
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        let c = this._gui.pickColor(this);
        pkc.save();
        pkc.translate(this._w / 2, this._h / 2);
        pkc.fillStyle = c.cssColor;
        pkc.beginPath();
        pkc.ellipse(tx, ty, tSize, tSize, 0, 0, 2 * Math.PI);
        pkc.fill();
        pkc.restore();
    }
    /** @hidden */ orient(dir) { return this.warn$('orient'); }
}
//# sourceMappingURL=joystick.js.map
/**
 * <p>This class represents a turnable knob with a surrounding status track
 * (optional). Three modes are available to rotate the knob.</p>
 * <p>Major and minor tick marks can be added to the status track and
 * supports stick-to-ticks if wanted. </p>
 */
class CvsKnob extends CvsSlider {
    /**
     * @hidden
     * @param gui the gui controller
     * @param name unique name for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h);
        // Mouse / touch mode
        /** @hidden */ this._mode = CvsKnob.X_MODE;
        /** @hidden */ this._sensitivity = 0.005;
        this._size = Math.min(w, h);
        this._turnArc = 2 * Math.PI; // Full turn of 360 degrees
        this._gapPos = 0.5 * Math.PI; // South
        this._tw = 0;
        this._kRad = 0.5 * this._size - 2;
        this._gRad = this._kRad - 4;
        this._opaque = true;
    }
    /**
     * <p>Sets the interaction mode for rotating the knob.</p>
     * <ul>
     * <li><code>'x'</code> : dragging left and right turns the knob
     * anticlockwise and clockwise respectively.</li>
     * <li><code>'y'</code> : dragging down and up turns the knob
     * anticlockwise and clockwise respectively.</li>
     * <li><code>'a'</code> : dragging in a circular motion round the
     * knob center turns the knob to face the drag point.</li>
     * </ul>
     * <p>Rotation is constrained within the maximum turn angle for this
     * knob.</p>
     * <p>Any other parameter value is ignored and the mode is unchanged.</p>
     *
     * @param mode 'x', 'y' or 'a'
     * @returns this control
     */
    mode(mode) {
        switch (mode) {
            case 'x':
                this._mode = CvsKnob.X_MODE;
                break;
            case 'y':
                this._mode = CvsKnob.Y_MODE;
                break;
            case 'a':
                this._mode = CvsKnob.A_MODE;
                break;
        }
        return this;
    }
    /**
     * <p>Only applies to modes 'x' and 'y'. It controls how far the knob
     * rotates for a given drag distance.</p>
     * <p>The drag distance needed to rotate the knob by the maximum turn
     * angle is the reciprocal of the parameter value i.e. <code>1.0 / sens</code>.</p>
     * <p>The default value is 0.005 which equates to a drag distance of 200
     * pixels and the minimum permitted value is 0.0025 (400 pixels).</p>
     *
     * @param svty &ge;0.0025
     * @returns this control
     */
    sensitivity(svty) {
        if (svty != 0) {
            let sgn = svty < 0 ? -1 : 1;
            let mag = Math.abs(svty);
            this._sensitivity = sgn * (mag < 0.0025 ? 0.0025 : mag);
        }
        return this;
    }
    /**
     * <p>Sets the width of the track surrounding the central knob-grip. The
     * value will be constrained so the minimum width is 6 pixels upto
     * the radius of the knob.</p>
     * <p>The track is used to display current value bar as well as any user
     * specified ticks.</p>
     *
     * @param tw the width of the value track
     * @returns this control
     */
    track(tw) {
        tw = _constrain(tw, 6, this._kRad);
        this._gRad = this._kRad - tw;
        this._tw = tw;
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Sets the maximum angle the knob can be turned in degrees. Angles
     * outside the range &gt;0&deg; and &le;360&deg; will be ignored and
     * the current turn angle is unchanged.</p>
     * @param ang max.turn angle &gt;0 and &le;360 degrees
     * @returns this control
     */
    turnAngle(ang) {
        if (ang > 0 && ang <= 360) {
            this._turnArc = _radians(ang);
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * <p>If the turn angle is &lt 360&deg; then there will be an 'unused'
     * section of track. This is called the gap and this method sets the
     * position of the gap center effectively rotating the whole knob.</p>
     * <p>The angle is 0&deg; along positive x-axis and increases clockwise.
     * The default value is 90&deg; which means the gap center is facing
     * south.</p>
     *
     * @param ang must be in the range &ge; 0 and &le; 360
     * @returns this control
     */
    gap(ang) {
        if (ang >= 0 && ang <= 360) {
            this._gapPos = _radians(ang);
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * Converts XY position to a parmetric value in the range
     * 0 and 1 inclusive.
     *
     * @hidden
     */
    _tFromXY(x, y) {
        let t = this._t01, under = false, over = false;
        switch (this._mode) {
            case CvsKnob.X_MODE:
                t = this._t01 + (x - this._prevX) * this._sensitivity;
                under = (t < 0);
                over = (t > 1);
                t = _constrain(t, 0, 1);
                break;
            case CvsKnob.Y_MODE:
                t = this._t01 - (y - this._prevY) * this._sensitivity;
                under = (t < 0);
                over = (t > 1);
                t = _constrain(t, 0, 1);
                break;
            case CvsKnob.A_MODE:
                let low = Math.PI - this._turnArc / 2;
                let high = 2 * Math.PI - low;
                let ang = _fixAngle2Pi(Math.atan2(y, x) - this._gapPos - this._deltaA);
                under = ang < low;
                over = ang > high;
                t = _map(ang, low, high, 0, 1, true);
                break;
        }
        return { t: t, under: under, over: over };
    }
    /** @hidden */
    _angFromT(t) {
        let low = Math.PI - this._turnArc / 2;
        let high = 2 * Math.PI - low;
        return _map(t, 0, 1, low, high);
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let [mx, my, w, h] = this._orientation.xy(x - this._x, y - this._y, this.w, this.h);
        mx -= w / 2;
        my -= h / 2; // Make relative to knob centre
        let next;
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._prevX = mx;
                this._prevY = my;
                this._deltaA = _fixAngle2Pi(Math.atan2(my, mx) - this._gapPos - this._angFromT(this._t01));
                this._active = true;
                this.over = true;
                this.invalidateBuffer();
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                next = this._tFromXY(mx, my);
                this._t01 = this._s2ticks ? this._nearestTickT(next.t) : next.t;
                this.action({ source: this, event: e, value: this.value(), final: true });
                this._active = false;
                this.invalidateBuffer();
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    next = this._tFromXY(mx, my);
                    let t01 = this._s2ticks ? this._nearestTickT(next.t) : next.t;
                    if (this._t01 != t01) {
                        this._prevX = mx;
                        this._prevY = my;
                        this._t01 = t01;
                        this.action({ source: this, event: e, value: this.value(), final: false });
                    }
                }
                this.over = (this == over.control);
                this._tooltip?._updateState(enter);
                this.invalidateBuffer();
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /** @hidden */
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        let cs = this.SCHEME;
        let cnrs = this.CNRS;
        const OPAQUE = cs.C$(3, this._alpha);
        const GRIP_OFF = cs.C$(7);
        const GRIP_STROKE = cs.C$(8);
        const MARKER = cs.C$(3);
        const HIGHLIGHT = cs.C$(9);
        const TRACK_BACK = cs.C$(3);
        const TRACK_ARC = cs.C$(1);
        const TICKS = cs.G$(8);
        const USED_TRACK = cs.G$(2);
        const UNUSED_TRACK = cs.T$(2);
        uic.save();
        if (this._opaque) {
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.fill();
        }
        let arc = this._turnArc, gap = 2 * Math.PI - arc, lowA = gap / 2;
        let rTrack = (this._kRad + this._gRad) / 2;
        uic.save();
        uic.translate(uib.width / 2, uib.height / 2);
        uic.rotate(this._gapPos + lowA);
        // Draw full background 
        uic.fillStyle = TRACK_BACK;
        uic.beginPath();
        uic.ellipse(0, 0, this._kRad, this._kRad, 0, 0, 2 * Math.PI);
        uic.fill();
        uic.fillStyle = TRACK_ARC;
        uic.beginPath();
        uic.moveTo(0, 0);
        uic.arc(0, 0, this._kRad, 0, this._turnArc, false);
        uic.closePath();
        uic.fill();
        // Unused track
        uic.fillStyle = UNUSED_TRACK;
        uic.beginPath();
        uic.moveTo(0, 0);
        uic.arc(0, 0, rTrack, 0, this._turnArc, false);
        uic.closePath();
        uic.fill();
        // Used track
        uic.fillStyle = USED_TRACK;
        uic.beginPath();
        uic.moveTo(0, 0);
        uic.arc(0, 0, rTrack, 0, this._t01 * arc, false);
        uic.closePath();
        uic.fill();
        // Draw ticks? 
        let n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            let mjrTickLen = this._kRad;
            let mnrTickLen = this._gRad + 0.65 * (this._kRad - this._gRad);
            uic.strokeStyle = TICKS;
            let da = arc / n;
            uic.save();
            uic.lineWidth = 1;
            // minor ticks
            uic.beginPath();
            for (let i = 0; i <= n; i++) {
                uic.moveTo(0, 0);
                uic.lineTo(mnrTickLen, 0);
                uic.rotate(da);
            }
            uic.stroke();
            uic.restore();
            n = this._majorTicks;
            if (n >= 2) {
                let da = arc / n;
                uic.save();
                uic.beginPath();
                uic.lineWidth = 1.2;
                // major ticks
                for (let i = 0; i <= n; i++) {
                    uic.moveTo(0, 0);
                    uic.lineTo(mjrTickLen, 0);
                    uic.rotate(da);
                }
                uic.stroke();
                uic.restore();
            }
        }
        // Grip section
        uic.strokeStyle = GRIP_STROKE;
        uic.lineWidth = 1.5;
        uic.fillStyle = GRIP_OFF;
        uic.beginPath();
        uic.ellipse(0, 0, this._gRad, this._gRad, 0, 0, 2 * Math.PI);
        uic.fill();
        uic.stroke();
        // Grip arrow marker
        uic.save();
        uic.rotate(this._t01 * arc);
        let ms = 0.2 * this._gRad;
        uic.fillStyle = MARKER;
        uic.beginPath();
        uic.moveTo(-ms, 0);
        uic.lineTo(0, -ms);
        uic.lineTo(this._gRad, 0);
        uic.lineTo(0, ms);
        uic.closePath();
        uic.fill();
        uic.restore();
        // Is over highlight?
        if (this.over) {
            uic.strokeStyle = HIGHLIGHT;
            uic.lineWidth = 3;
            uic.beginPath();
            uic.arc(0, 0, this._kRad, 0, arc);
            uic.stroke();
        }
        this._updatePickBuffer();
        uic.restore();
        if (!this._enabled)
            this._disable_highlight(cs, 0, 0, this._w, this._h);
        this._bufferInvalid = false; // Now the buffer is valid
    }
    /** @hidden */
    _updatePickBuffer() {
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        let c = this._gui.pickColor(this);
        pkc.save();
        pkc.translate(this._w / 2, this._h / 2);
        // Background
        pkc.fillStyle = c.cssColor;
        pkc.ellipse(0, 0, this._kRad, this._kRad, 0, 0, 2 * Math.PI);
        pkc.fill();
        pkc.restore();
    }
    /** @hidden */ orient(a) { return this.warn$('orient'); }
}
/** @hidden */ CvsKnob.X_MODE = 1;
/** @hidden */ CvsKnob.Y_MODE = 2;
/** @hidden */ CvsKnob.A_MODE = 3;
//# sourceMappingURL=knob.js.map
/**
 * <p>This class represents a draggable panel that can be used to hold other
 * controls.</p>
 * <p>On creation the panel -</p>
 * <ol>
 * <li>has an opaque background (this is required for dragging).</li>
 * <li>can be dragged in both X and Y directions.</li>
 * <li>is constrained so the entire panel stays within the display area.</li>
 * </ol>
 * <p>If the background is transparent then the panel cannot be dragged.
 * Panel movement can limited using the <code>draggable()</code> and
 * <code>constrain()</code> methods.</p>
 * <p>It is recommended that the panel width and height should not exceed
 * that of the display area (i.e. canvas).</p>
 */
class CvsPanel extends CvsBufferedControl {
    /**
     * @hidden
     * @param gui the gui controller
     * @param name unique name for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h, true);
        /** @hidden */ this._canDragX = true;
        /** @hidden */ this._canDragY = true;
        /** @hidden */ this._constrainX = true;
        /** @hidden */ this._constrainY = true;
        this._opaque = true;
        this._z = PANEL_Z;
    }
    /**
     * Horizontal and vertical movement can be restricted based on the actual
     * parameters. If either parameter is true then then the panel is
     * considered 'draggable'.
     * @param allowX allow horizontal movement if true
     * @param allowY allow vertical movement if true
     * @returns this control
     */
    draggable(allowX = true, allowY = true) {
        this._canDragX = allowX;
        this._canDragY = allowY;
        return this;
    }
    /**
     * Panel position can be constrained horizontally and vertically so that
     * it fits within the outside the display area.
     * @param limitX
     * @param limitY
     * @returns this control
     */
    constrain(limitX = true, limitY = true) {
        this._constrainX = limitX;
        this._constrainY = limitY;
        return this;
    }
    /** True if the panel can be dragged else false. */
    get isDraggable() { return this._opaque && (this._canDragX || this._canDragY); }
    /** @hidden */
    get canDragX() { return this._canDragX; }
    /** @hidden */
    get canDragY() { return this._canDragY; }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let absPos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0 && (this._canDragX || this._canDragY)) {
                    this._active = true;
                    this.over = true;
                    this._dragData = [mx, my];
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    this._active = false;
                    this.over = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive && (this._canDragX || this._canDragY)) {
                    let [msx, msy] = this._dragData;
                    let nx = this._x + (this._canDragX ? mx - msx : 0);
                    let ny = this._y + (this._canDragY ? my - msy : 0);
                    let [pw, ph] = [this._gui.canvasWidth, this._gui.canvasHeight];
                    let [cw, ch] = [this._w, this._h];
                    if (this._constrainX && cw <= pw) {
                        if (nx < 0)
                            nx = 0;
                        else if (nx > pw - cw)
                            nx = pw - cw;
                    }
                    if (this._constrainY && ch <= ph) {
                        if (ny < 0)
                            ny = 0;
                        else if (ny > ph - ch)
                            ny = ph - ch;
                    }
                    this.moveTo(nx, ny);
                }
                this.over = (this == over.control);
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /** @hidden */
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const OPAQUE = cs.C$(4, this._alpha);
        const HIGHLIGHT = cs.C$(9);
        uic.save();
        if (this._opaque) {
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.fill();
        }
        if (this.isDraggable && this.over) {
            uic.strokeStyle = HIGHLIGHT;
            uic.lineWidth = 2;
            uic.beginPath();
            uic.roundRect(1, 1, this._w - 2, this._h - 2, cnrs);
            uic.stroke();
        }
        // Update pick buffer before restoring
        this._updatePickBuffer();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _updatePickBuffer() {
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        let c = this._gui.pickColor(this);
        pkc.save();
        pkc.fillStyle = c.cssColor;
        pkc.beginPath();
        pkc.roundRect(1, 1, this._w - 1, this._h - 1, this.CNRS);
        pkc.fill();
        pkc.restore();
    }
    // Hide these methods from typeDoc
    /** @hidden */ parent(a, b, c) { return this.warn$('parent'); }
    /** @hidden */ leaveParent() { return this.warn$('leaveParent'); }
    /** @hidden */ tooltip(a) { return this.warn$('tooltip'); }
    /** @hidden */ tipTextSize(a) { return this.warn$('tipTextSize'); }
    /** @hidden */ orient(a) { return this.warn$('orient'); }
}
//# sourceMappingURL=panel.js.map
/*
##############################################################################
 CvsPane
 This is the base class side panes
 ##############################################################################
 */
class CvsPane extends CvsControl {
    /** @hidden */
    constructor(gui, id, x, y, w, h) {
        super(gui, id, x, y, w, h, true);
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
        this._cnrRad = 8;
        this._status = 'closed';
        this._timer = 0;
        this._z = PANE_Z;
    }
    /**
     * Get the tab button.
     * @hidden
     */
    get TAB() { return this._children[0]; }
    /** @hidden */
    get HEIGHT() { return this._tabMinHeight ?? this._gui._tabMinHeight; }
    /**
     * <p>Gets or sets the global minimum height for pane tabs.</p>
     * @param th the minimum tab height (must be &ge;10)
     * @returns this gui instance
     */
    tabHeight(th) {
        if (th === undefined || !Number.isFinite(th))
            return this._tabMinHeight;
        if (th >= 10) {
            this._tabMinHeight = th;
            this.TAB.shrink(1, this.HEIGHT);
            this.TAB.invalidateBuffer();
            this._gui.invalidateTabs();
        }
        return this;
    }
    createTabButton(orient, corners) {
        if (this._children.length === 0) {
            const tabid = `Tab ${CvsPane._TAB_ID++}`;
            const tab = this._gui.button(tabid, 0, 0, 80, this.HEIGHT);
            tab.corners(corners);
            tab.orient(orient);
            tab.text(tab.id);
            tab.setAction(this._tabAction);
            this._gui.invalidateTabs();
            this.addChild(tab);
        }
    }
    /**
     * <p>Get the 'depth' the pane will intrude into the canvas when open.</p>
     * @returns the depth
     */
    depth() {
        return this._depth;
    }
    /**
     * <p>Close this pane.</p>
     * @returns this control
     */
    close() {
        switch (this._status) {
            case "opening": // Stop existing timer
                clearInterval(this._timer);
            case "open": // now add closing timer
                this._timer = setInterval(() => { this._closing(); }, CvsPane._dI);
                this._status = 'closing';
                this.action({ source: this, event: undefined, state: 'closed' });
                break;
        }
        return this;
    }
    /** True if the pane is closed else false. */
    get isClosed() { return this._status == 'closed'; }
    /** True if the pane is closing else false. */
    get isClosing() { return this._status == 'closing'; }
    /**
     * <p>Open this pane.</p>
     * @returns this control
     */
    open() {
        switch (this._status) {
            case "closing": // Stop existing timer
                clearInterval(this._timer);
            case "closed": // now add opening timer
                this._gui._closePanes();
                this._timer = setInterval(() => { this._opening(); }, CvsPane._dI);
                this._status = 'opening';
                this.action({ source: this, event: undefined, state: 'open' });
                break;
        }
    }
    /** True if the pane is open else false.*/
    get isOpen() { return this._status == 'open'; }
    /** true if the pane is opening else false.*/
    get isOpening() { return this._status == 'opening'; }
    /**
     * <p>Sets or gets the color scheme used by the pane's tab and the
     * translucent background. Controls on the pane are not affected.</p>
     * @param name the color scheme name e.g. 'blue'
     * @returns this pane or its color scheme
     */
    scheme(name) {
        let result = this.TAB.scheme(name, false);
        return (result instanceof ColorScheme) ? result : this;
    }
    /**
     * <p>Sets the current text.</p>
     * <p>Processing constants are used to define the alignment.</p>
     * @param t the text toset
     * @returns this control
     */
    text(t) {
        this.TAB.text(t);
        this.TAB.shrink(1, this.HEIGHT);
        this._gui.invalidateTabs();
        return this;
    }
    /**
     * <p>Removes the text from the pane tab.</p>
     * @returns this control
     */
    noText() {
        this.TAB.noText();
        this.TAB.shrink(1, this.HEIGHT);
        this._gui.invalidateTabs();
        return this;
    }
    /**
     * <p>Sets the icon and its alignment relative to any text in the control.</p>
     * <p>Processing constants are used to define the icon alignment.</p>
     * @param i the icon to use for this control
     * @param alignH 'left', 'right' or 'center'
     * @param alignV 'top', 'bottom' or 'center'
     * @returns this control
     */
    icon(i, alignH, alignV) {
        this.TAB.icon(i, alignH, alignV);
        this.TAB.shrink(1, this.HEIGHT);
        this._gui.invalidateTabs();
        return this;
    }
    /**
     * <p>Removes the icon from the pane tab.</p>
     * @returns this control
     */
    noIcon() {
        this.TAB.noIcon();
        this.TAB.shrink(1, this.HEIGHT);
        this._gui.invalidateTabs();
        return this;
    }
    /**
     * <p>Sets the text font for the pane tab.</p>
     * @param font the text font to use
     * @returns this control
     */
    textFont(font) {
        this.TAB.textFont(font);
        this.TAB.shrink(1, this.HEIGHT);
        this._gui.invalidateTabs();
        return this;
    }
    /**
     * <p>Sets the text style for the pane tab.</p>
     * @param style the text style to use
     * @returns this control
     */
    textStyle(style, slant) {
        this.TAB.textStyle(style, slant);
        this.TAB.shrink(1, this.HEIGHT);
        this._gui.invalidateTabs();
        return this;
    }
    /**
     * <p>Sets the text size for the pane tab.</p>
     * @param ts the text size to use
     * @returns this control
     */
    textSize(ts) {
        this.TAB.textSize(ts);
        this.TAB.shrink(1, this.HEIGHT);
        this._gui.invalidateTabs();
        return this;
    }
    /**
     * <p>Enables tab opening / closure</p>
     * @returns this control
     */
    enable() {
        this.TAB.enable();
        return this;
    }
    /**
     * <p>Disables tab opening / closure</p>
     * @returns this control
     */
    disable() {
        this.close();
        this.TAB.disable();
        return this;
    }
    /**
     * <p>Make this control invisible</p>
     * @returns this control
     */
    hide() {
        this.close();
        this.TAB.hide();
        return this;
    }
    /**
     * <p>Make this control visible</p>
     * @returns this control
     */
    show() {
        this.TAB.show();
        return this;
    }
    /** @hidden */
    _tabAction(ta) {
        // This method is called when the tab button is clicked. What 
        // happens next depends on the pane status
        let pane = ta.source._parent;
        switch (pane._status) {
            case 'open':
                pane.close();
                break;
            case 'closed':
                pane.open();
                break;
            case 'opening':
                break;
            case 'closing':
                break;
        }
    }
    _doEvent(e, x = 0, y = 0, over, enter) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this._clickAllowed = true;
                this.over = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    if (this._clickAllowed) {
                        this.close();
                    }
                    this._active = false;
                    this._clickAllowed = false;
                    this.over = false;
                }
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                this.over = (this == over.control);
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /** @hidden */
    _draw(guiCtx, pkCtx) {
        let cs = (this.TAB.scheme() || this._gui.scheme());
        const BACKGROUND = cs.C$(9, 208);
        let c = this._gui.pickColor(this);
        guiCtx.save();
        guiCtx.translate(this._x, this._y);
        pkCtx.save();
        pkCtx.setTransform(guiCtx.getTransform());
        if (this._visible) {
            guiCtx.fillStyle = BACKGROUND;
            guiCtx.fillRect(0, 0, this._w, this._h);
            pkCtx.fillStyle = c.cssColor;
            pkCtx.fillRect(0, 0, this._w, this._h);
            for (let c of this._children)
                if (c._visible)
                    c._draw(guiCtx, pkCtx);
        }
        pkCtx.restore();
        guiCtx.restore();
    }
    // Hide these methods from typeDoc
    /** @hidden */ orient(a) { return this.warn$('orient'); }
    /** @hidden */ parent(a, b, c) { return this.warn$('parent'); }
    /** @hidden */ leaveParent() { return this.warn$('leaveParent'); }
    /** @hidden */ transparent() { return this.warn$('tansparent'); }
    /** @hidden */ opaque() { return this.warn$('opaque'); }
    /** @hidden */ tooltip(a) { return this.warn$('tooltip'); }
    /** @hidden */ tipTextSize(a) { return this.warn$('tipTextSize'); }
    /** @hidden */ corners(a) { return this.warn$('corners'); }
    /** @hidden */ shrink(a, b) { return this.warn$('shrink'); }
    /** @hidden */ moveBy(a, b) { return this.warn$('moveBy'); }
    /** @hidden */ moveTo(a, b) { return this.warn$('moveTo'); }
}
// Deltas used in controlling opening and closing speeds
/** @hidden */ CvsPane._dI = 50; // Interval time (50)
/** @hidden */ CvsPane._dC = 60; // Close speed px/sec
/** @hidden */ CvsPane._dO = 40; // Open speed px/sec
/** @hidden */ CvsPane._TAB_ID = 1;
/** @hidden */
class CvsPaneNorth extends CvsPane {
    constructor(gui, id, depth) {
        super(gui, id, 0, -depth, gui.canvasWidth, depth);
        this._depth = depth;
        this.createTabButton('east', [0, 0, this._cnrRad, this._cnrRad]);
        gui._panesNorth.push(this);
        this._gui.invalidateTabs();
    }
    /**
     * North
     * @param tabPos the postion when shut
     * @param cvsWidth the width of the display canvas
     * @param cvsHeight the height of the display canvas
     * @hidden
     */
    _updateLocation(tabPos, cvsWidth, cvsHeight) {
        this._y = -this._depth;
        this._w = cvsWidth;
        this.TAB.y = this._depth;
        this.TAB.x = tabPos;
    }
    _opening() {
        let py = this._y + CvsPane._dO;
        if (py > 0) { // See if open
            py = 0;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._y = py;
    }
    _closing() {
        let py = this._y - CvsPane._dC;
        if (py < -this._depth) { // See if closed
            py = -this._depth;
            clearInterval(this._timer);
            this._status = 'closed';
        }
        this._y = py;
    }
}
/** @hidden */
class CvsPaneSouth extends CvsPane {
    constructor(gui, id, depth) {
        super(gui, id, 0, gui.canvasHeight, gui.canvasWidth, depth);
        this._depth = depth;
        this.createTabButton('east', [this._cnrRad, this._cnrRad, 0, 0]);
        this._gui._panesSouth.push(this);
        this._gui.invalidateTabs();
    }
    /**
     * South
     * @param tabPos the postion when shut
     * @param cvsWidth the width of the display canvas
     * @param cvsHeight the height of the display canvas
     * @hidden
     */
    _updateLocation(tabPos, cvsWidth, cvsHeight) {
        this._y = cvsHeight;
        this._w = cvsWidth;
        this.TAB.y = -this.TAB._h;
        this.TAB.x = tabPos;
    }
    _opening() {
        let py = this._y - CvsPane._dO;
        if (py < this._gui.canvasHeight - this._depth) { // See if open
            py = this._gui.canvasHeight - this._depth;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._y = py;
    }
    _closing() {
        let py = this._y + CvsPane._dC;
        if (py > this._gui.canvasHeight) { // See if closed
            py = this._gui.canvasHeight;
            clearInterval(this._timer);
            this._status = 'closed';
        }
        this._y = py;
    }
}
/** @hidden */
class CvsPaneEast extends CvsPane {
    constructor(gui, id, depth) {
        super(gui, id, gui.canvasWidth, 0, depth, gui.canvasHeight);
        this._depth = depth;
        this.createTabButton('north', [this._cnrRad, this._cnrRad, 0, 0]);
        this._gui._panesEast.push(this);
        this._gui.invalidateTabs();
    }
    /**
     * East
     * @param tabPos the postion when shut
     * @param cvsWidth the width of the display canvas
     * @param cvsHeight the height of the display canvas
     * @hidden
     */
    _updateLocation(tabPos, cvsWidth, cvsHeight) {
        this._x = cvsWidth;
        this._h = cvsHeight;
        this.TAB.x = -this.TAB.h;
        this.TAB.y = tabPos;
    }
    _opening() {
        let px = this._x - CvsPane._dO;
        if (px < this._gui.canvasWidth - this._depth) { // See if open
            px = this._gui.canvasWidth - this._depth;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._x = px;
    }
    _closing() {
        let px = this._x + CvsPane._dC;
        if (px > this._gui.canvasWidth) { // See if closed
            px = this._gui.canvasWidth;
            clearInterval(this._timer);
            this._status = 'closed';
        }
        this._x = px;
    }
}
/** @hidden */
class CvsPaneWest extends CvsPane {
    constructor(gui, name, depth) {
        super(gui, name, -depth, 0, depth, gui.canvasHeight);
        this._depth = depth;
        this.createTabButton('south', [this._cnrRad, this._cnrRad, 0, 0]);
        this._gui._panesWest.push(this);
        this._gui.validateTabsWest();
    }
    /**
     * Weat
     * @param tabPos the postion when shut
     * @param cvsWidth the width of the display canvas
     * @param cvsHeight the height of the display canvas
     * @hidden
     */
    _updateLocation(tabPos, cvsWidth, cvsHeight) {
        this._x = -this._depth;
        this._h = cvsHeight;
        this.TAB.x = this._depth;
        this.TAB.y = tabPos;
    }
    _opening() {
        let px = this._x + CvsPane._dO;
        if (px > 0) { // See if open
            px = 0;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._x = px;
    }
    _closing() {
        let px = this._x - CvsPane._dC;
        if (px < -this._depth) { // See if closed
            px = -this._depth;
            clearInterval(this._timer);
            this._status = 'closed';
        }
        this._x = px;
    }
}
//# sourceMappingURL=panes.js.map
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _CvsPoster_taggedText, _CvsPoster_words, _CvsPoster_fonts, _CvsPoster_colors, _CvsPoster_wrapW, _CvsPoster_isetHorz, _CvsPoster_isetVert, _CvsPoster_icons, _CvsPoster_backStyle, _Poster_Icon_icon, _Poster_Icon_x, _Poster_Icon_y, _Poster_Line_words, _Poster_Line_align, _Poster_Line_lAscent, _Poster_Line_lHeight, _Poster_Line_gap, _Poster_Line_indent, _Poster_Line_wrapW, _Poster_Line_leading, _Poster_Para_tokens, _Poster_Para_align, _Poster_Para_gap, _Poster_Para_indent, _Poster_Para_wrapW, _Poster_Para_leading, _Poster_Ascii_ascii, _Poster_Ascii_x, _Poster_Ascii_y, _Poster_Ascii_w, _Poster_Ascii_h, _Poster_Ascii_a, _Poster_Ascii_cssFont, _Poster_Ascii_glyphStrokeWidth, _Poster_Ascii_glyphStroke, _Poster_Ascii_glyphFill, _Poster_Tag_id, _Poster_Tag_attrs, _Poster_State_font, _Poster_State_size, _Poster_State_style, _Poster_State_slant, _Poster_State_glyphStrokeWidth, _Poster_State_glyphStroke, _Poster_State_glyphFill, _Poster_Stack_stack;
/**
 * <p>This control creates a text-based poster where the user has full control
 * over the font-face, text size, text sty</p>
 * <ul>
 * <li><b>Font:</b> any logical or system font or any true-type-font (TTF)
 * loaded from a file. </li>
 * <li><b>Text size:</b></li>
 * <li><b>Text style:</b> normal, bold, thin, italic, oblique</li>
 * <li>Horizontal alignment:
 *
 *
 *
 *
 *
 *
 */
class CvsPoster extends CvsBufferedControl {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h, false);
        /** @hidden */ _CvsPoster_taggedText.set(this, '');
        /** @hidden */ _CvsPoster_words.set(this, []);
        /** @hidden */ _CvsPoster_fonts.set(this, FONT_FAMILIES());
        /** @hidden */ _CvsPoster_colors.set(this, new Array(3));
        /** @hidden */ _CvsPoster_wrapW.set(this, void 0);
        /** @hidden */ _CvsPoster_isetHorz.set(this, 3);
        /** @hidden */ _CvsPoster_isetVert.set(this, 2);
        /** @hidden */ _CvsPoster_icons.set(this, []);
        /** @hidden */ _CvsPoster_backStyle.set(this, 2);
        __classPrivateFieldSet(this, _CvsPoster_wrapW, this._w - 2 * __classPrivateFieldGet(this, _CvsPoster_isetHorz, "f"), "f");
        __classPrivateFieldGet(this, _CvsPoster_colors, "f")[0] = 'transparent';
        __classPrivateFieldGet(this, _CvsPoster_colors, "f")[1] = this.SCHEME.C$(8);
        __classPrivateFieldGet(this, _CvsPoster_colors, "f")[2] = this.SCHEME.C$(3, this._alpha);
        this.invalidateBuffer();
    }
    /** Get the number of fonts in this poster */
    get fontCount() { return __classPrivateFieldGet(this, _CvsPoster_fonts, "f").length; }
    /** Get the number of colors in this poster */
    get colorCount() { return __classPrivateFieldGet(this, _CvsPoster_colors, "f").length; }
    /**
     * <p>If the name of a valid color scheme is provided then it will used
     * to display this control, non-existant scheme names will be ignored. In
     * both cases this control is returned.</p>
     * <p>If there is no parameter it returns the name of the current color
     * scheme used by this control.</p>
     * @param name the color scheme name e.g. 'blue'
     * @param cascade if true propogate scheme to all child controls.
     * @returns this control or the control's color scheme
     */
    scheme(name, cascade) {
        if (name) { // setter
            super.scheme(name, false);
            __classPrivateFieldGet(this, _CvsPoster_colors, "f")[1] = this.SCHEME.C$(8);
            __classPrivateFieldGet(this, _CvsPoster_colors, "f")[2] = this.SCHEME.C$(3, this._alpha);
            return this;
        }
        return this._scheme;
    }
    /**
     * <p>This method accepts the tagged text which it formats and styles
     * ready to display in the control.</p>
     * <p>The text can be a single string or an array of strings. If it is an
     * array then the elements will be concatenated using the 'separator'
     * between elements.</p>
     *
     * @param text a string or an array of strings
     * @param separator default value is an empty string.
     * @returns this control
     */
    text(text, separator = '') {
        __classPrivateFieldSet(this, _CvsPoster_taggedText, Array.isArray(text) ? text.join(separator) : text, "f");
        this.invalidateText();
        return this;
    }
    /**
     *
     * @param icon the icon to display
     * @param x horzontal position inside poster
     * @param y vertical position inside poster
     * @returns this control
     */
    icon(icon, x = 0, y = 0) {
        __classPrivateFieldGet(this, _CvsPoster_icons, "f").push(new Poster_Icon(icon, x, y));
        return this;
    }
    /**
     * Removes all icons added to this poster.
     * @returns this control
     */
    removeIcons() {
        __classPrivateFieldSet(this, _CvsPoster_icons, [], "f");
        return this;
    }
    /**
     * <p>By default the user can select from one the logical fonts -</p>
     * <ul>
     * <li>ft0 'serif'</li>
     * <li>ft1 'sans-serif'</li>
     * <li>ft2 'monospace'</li>
     * <li>ft3 'fantasy'</li>
     * <li>ft4 'cursive'</li>
     * </ul>
     * <p>This method allows the user to replace or append to any existing
     * font(s).</p>
     *
     * @param fonts an array of one or more fonts.
     * @param replace if true existing fonts are replaced but if false (default)
     * the fonts are appended to existing fonts.
     * @returns this control
     */
    fonts(fonts, replace = false) {
        if (fonts) {
            let data = Array.isArray(fonts) ? Array.from(fonts) : [fonts];
            data = data.filter(x => x !== undefined && x !== null);
            let fontList = data.map(ff => cvsGuiFont(ff));
            if (fontList.length > 0) {
                if (replace)
                    __classPrivateFieldSet(this, _CvsPoster_fonts, fontList, "f");
                else
                    __classPrivateFieldSet(this, _CvsPoster_fonts, __classPrivateFieldGet(this, _CvsPoster_fonts, "f").concat(...fontList), "f");
                this.invalidateText();
            }
            return this;
        }
        return Array.from(__classPrivateFieldGet(this, _CvsPoster_fonts, "f"));
    }
    /**
     * <p>By default the user can select one of the following colors  -</p>
     * <ul>
     * <li>gf0 'transparent'</li>
     * <li>gf1 the poster's color scheme text color</li>
     * <li>gf2 the poster's color scheme opaque color</li>
     * </ul>
     * <p>This method allows the user to replace or append to any existing
     * color(s).</p>
     *
     * @param colors a color or an array of CSS color definitions.
     * @param replace if true existing colors are replaced but if false (default)
     * the colors are appended to existing colors.
     * @returns this control
     */
    colors(colors, replace = false) {
        if (colors) {
            let data = Array.isArray(colors) ? Array.from(colors) : [colors];
            data = data.filter(x => x.length > 0);
            let colorList = data.map(ff => cvsGuiColor(ff));
            if (colorList.length > 0) {
                if (replace)
                    __classPrivateFieldSet(this, _CvsPoster_colors, colorList, "f");
                else
                    __classPrivateFieldSet(this, _CvsPoster_colors, __classPrivateFieldGet(this, _CvsPoster_colors, "f").concat(...colorList), "f");
                this.invalidateBuffer();
            }
            return this;
        }
        return Array.from(__classPrivateFieldGet(this, _CvsPoster_colors, "f"));
    }
    /**
     * <p>This sets the background color to be used when the poster has been set
     * to opaque by calling the 'opaque(alpha)' function.</p>
     * <If no index value is passed to the function then the default value 2
     * is used which correseponds the scheme color and alpha (transparency)
     * value specified in the call to the 'opaque(alpha)' function.</p>
     * <p>This method has no effect if the poster state is transparent.</p>
     *
     * @param index the index into the colors array
     * @returns this control
     */
    background(index = 2) {
        __classPrivateFieldSet(this, _CvsPoster_backStyle, index % __classPrivateFieldGet(this, _CvsPoster_colors, "f").length, "f");
        return this;
    }
    /**
     * Sets the internal margins to use when formating text.
     * @param mgnX left / right margin
     * @param mgnY top margin
     * @returns this control;
     */
    margins(mgnX = 0, mgnY = mgnX) {
        __classPrivateFieldSet(this, _CvsPoster_isetHorz, mgnX, "f");
        __classPrivateFieldSet(this, _CvsPoster_isetVert, mgnY, "f");
        __classPrivateFieldSet(this, _CvsPoster_wrapW, this._w - 2 * mgnX, "f");
        this.invalidateText();
        return this;
    }
    /**
     * The maximum line length (pixels) possible. The length depends on the
     * poster width and the horizontal margins.
     */
    get wrapWidth() { return __classPrivateFieldGet(this, _CvsPoster_wrapW, "f"); }
    /**
     * Parses the raw text into tokens (Tag and Ascii objects)
     * @returns the list of tokens
     * @hidden
     */
    _makeTokens() {
        function getChunks(tagtxt) {
            const tagPtn = /<[a-zA-Z0-9 .:-]+>|\s+|[^&<> ]+/gu;
            let ch = tagtxt.match(tagPtn);
            return ch ? ch.map(t => String(t)) : [];
        }
        function getTokens(chunks, pw) {
            const tokens = [];
            chunks.forEach(chunk => {
                if (chunk.startsWith("<")) {
                    chunk = chunk.substring(1, chunk.length - 1);
                    chunk.split(/\s+/g)
                        .forEach(m => tokens.push(new Poster_Tag(String(m), pw)));
                }
                else
                    tokens.push(new Poster_Ascii(chunk));
            });
            return tokens;
        }
        const chunks = getChunks(__classPrivateFieldGet(this, _CvsPoster_taggedText, "f"));
        const tokens = getTokens(chunks, __classPrivateFieldGet(this, _CvsPoster_wrapW, "f"));
        return tokens;
    }
    /** @hidden */
    _makeParagraphs(tokens) {
        const paras = [];
        let para;
        if (!tokens[0].isParaTag)
            paras.push(para = new Poster_Para('pc', 0, 0, __classPrivateFieldGet(this, _CvsPoster_wrapW, "f"), 0));
        tokens.forEach(tkn => {
            if (tkn.isParaTag)
                paras.push(para = new Poster_Para(tkn.id, tkn.value, tkn.indent, tkn.wrapW, tkn.leading));
            else
                para.tokens.push(tkn);
        });
        return paras;
    }
    /** @hidden */
    _applyTextAttributes(paras) {
        const stack = new Poster_Stack();
        let state = new Poster_State();
        stack.push(state);
        paras.forEach(para => {
            const asciiTokens = [];
            para.tokens.forEach((tkn) => {
                if (tkn instanceof Poster_Tag && TAGS.has(tkn.id)) {
                    switch (tkn.id) {
                        case 'ol': // left slant
                            state.slant = -tkn.value;
                            state.style = TAGS.get(tkn.id);
                            break;
                        case 'or': // right slant
                        case 'o': // right slant
                            state.slant = tkn.value;
                        case 'n':
                        case 't':
                        case 'b':
                        case 'i':
                        case 'ti':
                        case 'bi':
                            state.style = TAGS.get(tkn.id);
                            break;
                        case 'fs':
                            state.size = tkn.value;
                            break;
                        case 'ft':
                            state.font = __classPrivateFieldGet(this, _CvsPoster_fonts, "f")[tkn.value % __classPrivateFieldGet(this, _CvsPoster_fonts, "f").length];
                            break;
                        case 'gsw':
                            state.strokeWidth = tkn.value;
                            break;
                        case 'gs':
                            state.stroke = tkn.value;
                            break;
                        case 'gf':
                            state.fill = tkn.value;
                            break;
                        case 'push':
                            stack.push(state);
                            break;
                        case 'pop':
                            state = stack.pop();
                    }
                }
                else if (tkn instanceof Poster_Ascii) {
                    tkn.applyState(state);
                    asciiTokens.push(tkn);
                }
            });
            para.tokens = asciiTokens;
        });
    }
    /** @hidden */
    _measureText(paras) {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (uic) {
            uic.save();
            uic.textBaseline = 'alphabetic';
            paras.forEach(para => {
                para.tokens.forEach((tkn) => {
                    uic.save();
                    uic.font = tkn.cssFont;
                    let tm = textMetrics(uic, tkn.ascii);
                    tkn.width = tm.fWidth;
                    tkn.height = tm.fHeight;
                    tkn.ascent = tm.fAscent;
                    uic.restore();
                });
            });
            uic.restore();
        }
    }
    /** @hidden */
    _splitIntoLines(paras) {
        const lines = [];
        paras.forEach(para => {
            let line;
            let advance = 0;
            lines.push(line = new Poster_Line(para.gap, para));
            para.tokens.forEach((ascii) => {
                if (advance + ascii.width > line.wrapW) { // Start a new line
                    lines.push(line = new Poster_Line(0, para));
                    advance = 0;
                    if (ascii.isAscii) {
                        ascii.x = advance;
                        advance += ascii.width;
                        line.ascent = Math.max(line.ascent, ascii.ascent);
                        line.height = Math.max(line.height, ascii.height);
                        line.addWord(ascii);
                    }
                }
                else { // Extend existing line
                    ascii.x = advance;
                    advance += ascii.width;
                    line.ascent = Math.max(line.ascent, ascii.ascent);
                    line.height = Math.max(line.height, ascii.height);
                    if (ascii.isAscii)
                        line.addWord(ascii);
                }
            });
        });
        return lines;
    }
    /** @hidden */
    _positionWords(lines) {
        const words = [];
        let py = lines[0].ascent + 2 * __classPrivateFieldGet(this, _CvsPoster_isetVert, "f");
        lines.forEach(line => {
            const ww = line.wrapW;
            const px = line.indent;
            py += line.gap;
            let dx = 0, sx = 0;
            switch (line.align) {
                case 'left':
                    sx = px;
                    break;
                case 'right':
                    sx = px + ww - line.length;
                    break;
                case 'center':
                    sx = px + (ww - line.length) / 2;
                    break;
                case 'justified':
                    sx = px;
                    if (line.nbrWords >= 2 && line.length / ww > 0.75)
                        dx = (ww - line.length) / (line.nbrWords - 1);
            }
            sx += __classPrivateFieldGet(this, _CvsPoster_isetHorz, "f");
            for (let i = 0; i < line.nbrWords; i++) {
                line.words[i].x += sx + i * dx;
                line.words[i].y = py;
                words.push(line.words[i]);
            }
            py += line.height + line.leading;
        });
        return words;
    }
    /** @hidden */
    _formatText() {
        const tokens = this._makeTokens();
        const paras = this._makeParagraphs(tokens);
        this._applyTextAttributes(paras);
        this._measureText(paras);
        const lines = this._splitIntoLines(paras);
        __classPrivateFieldSet(this, _CvsPoster_words, this._positionWords(lines), "f");
        this._textInvalid = false;
    }
    /** @hidden */
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        if (this._textInvalid)
            this._formatText();
        const cs = this.SCHEME;
        // Color scheme fore and opaque colors
        __classPrivateFieldGet(this, _CvsPoster_colors, "f")[1] = cs.C$(8);
        __classPrivateFieldGet(this, _CvsPoster_colors, "f")[2] = cs.C$(3, this._alpha);
        const OPAQUE = __classPrivateFieldGet(this, _CvsPoster_colors, "f")[__classPrivateFieldGet(this, _CvsPoster_backStyle, "f")];
        const cnrs = this.CNRS;
        if (this._opaque && __classPrivateFieldGet(this, _CvsPoster_backStyle, "f") != 0) {
            uic.save();
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, ...cnrs);
            uic.fill();
            uic.restore();
        }
        // Display icons
        __classPrivateFieldGet(this, _CvsPoster_icons, "f").forEach(i => uic.drawImage(i.icon, i.x, i.y));
        uic.textBaseline = 'alphabetic';
        __classPrivateFieldGet(this, _CvsPoster_words, "f").forEach(word => {
            uic.font = word.cssFont;
            const fill = __classPrivateFieldGet(this, _CvsPoster_colors, "f")[word.fill % __classPrivateFieldGet(this, _CvsPoster_colors, "f").length];
            if (fill !== 'transparent') {
                uic.fillStyle = fill; //this.#colors[word.fill % this.#colors.length];
                uic.fillText(word.ascii, word.x, word.y);
            }
            const stroke = __classPrivateFieldGet(this, _CvsPoster_colors, "f")[word.stroke % __classPrivateFieldGet(this, _CvsPoster_colors, "f").length];
            if (stroke !== 'transparent') {
                uic.lineWidth = word.strokeWidth;
                uic.strokeStyle = stroke; //this.#colors[word.stroke % this.#colors.length];
                uic.strokeText(word.ascii, word.x, word.y);
            }
        });
        this._bufferInvalid = false; // buffer is now valid
    }
    /** @hidden */ orient(a) { return this.warn$('orient'); }
    /** @hidden */ enable() { return this.warn$('enable'); }
    /** @hidden */ disable() { return this.warn$('disable'); }
    /** @hidden */ setAction() { return this.warn$('setAction'); }
    /** @hidden */ tooltip(a) { return this.warn$('tooltip'); }
    /** @hidden */ tipTextSize(a) { return this.warn$('tipTextSize'); }
} // End of CvsPoster class
_CvsPoster_taggedText = new WeakMap(), _CvsPoster_words = new WeakMap(), _CvsPoster_fonts = new WeakMap(), _CvsPoster_colors = new WeakMap(), _CvsPoster_wrapW = new WeakMap(), _CvsPoster_isetHorz = new WeakMap(), _CvsPoster_isetVert = new WeakMap(), _CvsPoster_icons = new WeakMap(), _CvsPoster_backStyle = new WeakMap();
// ##################################################################
//        Supporting classes for formating text & icons
// ##################################################################
class Poster_Icon {
    constructor(icon, x = 0, y = 0) {
        _Poster_Icon_icon.set(this, void 0);
        _Poster_Icon_x.set(this, void 0);
        _Poster_Icon_y.set(this, void 0);
        __classPrivateFieldSet(this, _Poster_Icon_icon, cvsGuiCanvas(icon), "f");
        __classPrivateFieldSet(this, _Poster_Icon_x, x, "f");
        __classPrivateFieldSet(this, _Poster_Icon_y, y, "f");
    }
    get icon() { return __classPrivateFieldGet(this, _Poster_Icon_icon, "f"); }
    get x() { return __classPrivateFieldGet(this, _Poster_Icon_x, "f"); }
    get y() { return __classPrivateFieldGet(this, _Poster_Icon_y, "f"); }
}
_Poster_Icon_icon = new WeakMap(), _Poster_Icon_x = new WeakMap(), _Poster_Icon_y = new WeakMap();
/** @hidden */
class Poster_Line {
    constructor(gap, para) {
        _Poster_Line_words.set(this, []);
        _Poster_Line_align.set(this, void 0);
        _Poster_Line_lAscent.set(this, 0);
        _Poster_Line_lHeight.set(this, 0);
        _Poster_Line_gap.set(this, 0);
        _Poster_Line_indent.set(this, 0);
        _Poster_Line_wrapW.set(this, 0);
        _Poster_Line_leading.set(this, 0);
        __classPrivateFieldSet(this, _Poster_Line_gap, gap, "f");
        __classPrivateFieldSet(this, _Poster_Line_align, para.align, "f");
        __classPrivateFieldSet(this, _Poster_Line_indent, para.indent, "f");
        __classPrivateFieldSet(this, _Poster_Line_wrapW, para.wrapW, "f");
        __classPrivateFieldSet(this, _Poster_Line_leading, para.leading, "f");
    }
    get words() { return __classPrivateFieldGet(this, _Poster_Line_words, "f"); }
    ;
    get nbrWords() { return __classPrivateFieldGet(this, _Poster_Line_words, "f").length; }
    ;
    set align(a) { __classPrivateFieldSet(this, _Poster_Line_align, a, "f"); }
    ;
    get align() { return __classPrivateFieldGet(this, _Poster_Line_align, "f"); }
    ;
    set gap(n) { __classPrivateFieldSet(this, _Poster_Line_gap, n, "f"); }
    ;
    get gap() { return __classPrivateFieldGet(this, _Poster_Line_gap, "f"); }
    ;
    set indent(n) { __classPrivateFieldSet(this, _Poster_Line_indent, n, "f"); }
    ;
    get indent() { return __classPrivateFieldGet(this, _Poster_Line_indent, "f"); }
    ;
    set wrapW(n) { __classPrivateFieldSet(this, _Poster_Line_wrapW, n, "f"); }
    ;
    get wrapW() { return __classPrivateFieldGet(this, _Poster_Line_wrapW, "f"); }
    ;
    set ascent(a) { __classPrivateFieldSet(this, _Poster_Line_lAscent, a, "f"); }
    ;
    get ascent() { return __classPrivateFieldGet(this, _Poster_Line_lAscent, "f"); }
    ;
    set height(h) { __classPrivateFieldSet(this, _Poster_Line_lHeight, h, "f"); }
    ;
    get height() { return __classPrivateFieldGet(this, _Poster_Line_lHeight, "f"); }
    ;
    set leading(ld) { __classPrivateFieldSet(this, _Poster_Line_leading, ld, "f"); }
    get leading() { return __classPrivateFieldGet(this, _Poster_Line_leading, "f"); }
    get length() {
        if (__classPrivateFieldGet(this, _Poster_Line_words, "f").length > 0) {
            let word = __classPrivateFieldGet(this, _Poster_Line_words, "f")[__classPrivateFieldGet(this, _Poster_Line_words, "f").length - 1];
            return word.x + word.width;
        }
        else
            return 0;
    }
    addWord(word) { __classPrivateFieldGet(this, _Poster_Line_words, "f").push(word); }
    toString() {
        const [aln, indent, wrapW, asc, hgt, len] = [this.align, this.indent, this.wrapW,
            Math.round(this.ascent), Math.round(this.height), Math.round(this.length)];
        return `LINE  "${aln}"  Len: ${len}  Height: ${hgt}  Ascent: ${asc}`
            + `  Indent: ${indent}  Wrap: ${wrapW} \n`;
    }
}
_Poster_Line_words = new WeakMap(), _Poster_Line_align = new WeakMap(), _Poster_Line_lAscent = new WeakMap(), _Poster_Line_lHeight = new WeakMap(), _Poster_Line_gap = new WeakMap(), _Poster_Line_indent = new WeakMap(), _Poster_Line_wrapW = new WeakMap(), _Poster_Line_leading = new WeakMap();
/** @hidden */
class Poster_Para {
    constructor(tagId = 'pc', gap, indent, wrapW, leading) {
        _Poster_Para_tokens.set(this, []);
        _Poster_Para_align.set(this, 'center');
        _Poster_Para_gap.set(this, 0);
        _Poster_Para_indent.set(this, 0);
        _Poster_Para_wrapW.set(this, 0);
        _Poster_Para_leading.set(this, 0);
        __classPrivateFieldSet(this, _Poster_Para_align, TAGS.get(tagId), "f");
        __classPrivateFieldSet(this, _Poster_Para_gap, gap, "f");
        __classPrivateFieldSet(this, _Poster_Para_indent, indent, "f");
        __classPrivateFieldSet(this, _Poster_Para_wrapW, wrapW, "f");
        __classPrivateFieldSet(this, _Poster_Para_leading, leading, "f");
    }
    get tokens() { return __classPrivateFieldGet(this, _Poster_Para_tokens, "f"); }
    set tokens(v) { __classPrivateFieldSet(this, _Poster_Para_tokens, v, "f"); }
    get align() { return __classPrivateFieldGet(this, _Poster_Para_align, "f"); }
    get gap() { return __classPrivateFieldGet(this, _Poster_Para_gap, "f"); }
    get indent() { return __classPrivateFieldGet(this, _Poster_Para_indent, "f"); }
    get wrapW() { return __classPrivateFieldGet(this, _Poster_Para_wrapW, "f"); }
    get leading() { return __classPrivateFieldGet(this, _Poster_Para_leading, "f"); }
    toString() {
        return `PARAGRAPH (${__classPrivateFieldGet(this, _Poster_Para_align, "f")})   Gap: ${this.gap}   `
            + `Indent: ${this.indent}   wrapW: ${this.wrapW}    `
            + `leading: ${this.leading}`;
    }
}
_Poster_Para_tokens = new WeakMap(), _Poster_Para_align = new WeakMap(), _Poster_Para_gap = new WeakMap(), _Poster_Para_indent = new WeakMap(), _Poster_Para_wrapW = new WeakMap(), _Poster_Para_leading = new WeakMap();
/** @hidden */
class Poster_Ascii {
    get x() { return __classPrivateFieldGet(this, _Poster_Ascii_x, "f"); }
    ;
    set x(n) { __classPrivateFieldSet(this, _Poster_Ascii_x, n, "f"); }
    ;
    get y() { return __classPrivateFieldGet(this, _Poster_Ascii_y, "f"); }
    ;
    set y(n) { __classPrivateFieldSet(this, _Poster_Ascii_y, n, "f"); }
    ;
    get width() { return __classPrivateFieldGet(this, _Poster_Ascii_w, "f"); }
    ;
    set width(n) { __classPrivateFieldSet(this, _Poster_Ascii_w, n, "f"); }
    ;
    get height() { return __classPrivateFieldGet(this, _Poster_Ascii_h, "f"); }
    ;
    set height(n) { __classPrivateFieldSet(this, _Poster_Ascii_h, n, "f"); }
    ;
    get ascent() { return __classPrivateFieldGet(this, _Poster_Ascii_a, "f"); }
    ;
    set ascent(n) { __classPrivateFieldSet(this, _Poster_Ascii_a, n, "f"); }
    ;
    get ascii() { return __classPrivateFieldGet(this, _Poster_Ascii_ascii, "f"); }
    get isAscii() { return !this.ascii.startsWith(' '); }
    get isSpace() { return this.ascii.startsWith(' '); }
    get cssFont() { return __classPrivateFieldGet(this, _Poster_Ascii_cssFont, "f"); }
    ;
    set cssFont(v) { __classPrivateFieldSet(this, _Poster_Ascii_cssFont, v, "f"); }
    ;
    get strokeWidth() { return __classPrivateFieldGet(this, _Poster_Ascii_glyphStrokeWidth, "f"); }
    set strokeWidth(v) { __classPrivateFieldSet(this, _Poster_Ascii_glyphStrokeWidth, v, "f"); }
    get stroke() { return __classPrivateFieldGet(this, _Poster_Ascii_glyphStroke, "f"); }
    set stroke(v) { __classPrivateFieldSet(this, _Poster_Ascii_glyphStroke, v, "f"); }
    get fill() { return __classPrivateFieldGet(this, _Poster_Ascii_glyphFill, "f"); }
    set fill(v) { __classPrivateFieldSet(this, _Poster_Ascii_glyphFill, v, "f"); }
    constructor(chunk) {
        _Poster_Ascii_ascii.set(this, '');
        _Poster_Ascii_x.set(this, 0);
        _Poster_Ascii_y.set(this, 0);
        _Poster_Ascii_w.set(this, 0);
        _Poster_Ascii_h.set(this, 0);
        _Poster_Ascii_a.set(this, 0);
        _Poster_Ascii_cssFont.set(this, void 0);
        _Poster_Ascii_glyphStrokeWidth.set(this, 0);
        _Poster_Ascii_glyphStroke.set(this, 0);
        _Poster_Ascii_glyphFill.set(this, 0);
        __classPrivateFieldSet(this, _Poster_Ascii_cssFont, this.cssFont, "f");
        const ptn = /(&\w+;)/gu;
        __classPrivateFieldSet(this, _Poster_Ascii_ascii, chunk.replace(ptn, m => CHAR_ENTITIES.get(m) || m), "f");
    }
    applyState(state) {
        this.cssFont = state.cssFont;
        this.strokeWidth = state.strokeWidth;
        this.stroke = state.stroke;
        this.fill = state.fill;
    }
    toString() {
        const [x, y, w, h] = [this.x, this.y, this.width, this.height];
        const [word, font, ascent, t] = [this.ascii, this.cssFont, this.ascent, '          '];
        let s = `WORD   "${word}" \n${t}Font:     ${font} \n`;
        s += `${t}Pos:      (${x}, ${y})   Size: ${w} x ${h} \n`;
        s += `${t}Ascent:   ${ascent} \n`;
        return s;
    }
}
_Poster_Ascii_ascii = new WeakMap(), _Poster_Ascii_x = new WeakMap(), _Poster_Ascii_y = new WeakMap(), _Poster_Ascii_w = new WeakMap(), _Poster_Ascii_h = new WeakMap(), _Poster_Ascii_a = new WeakMap(), _Poster_Ascii_cssFont = new WeakMap(), _Poster_Ascii_glyphStrokeWidth = new WeakMap(), _Poster_Ascii_glyphStroke = new WeakMap(), _Poster_Ascii_glyphFill = new WeakMap();
/** @hidden */
class Poster_Tag {
    constructor(tag, line_length) {
        _Poster_Tag_id.set(this, '');
        _Poster_Tag_attrs.set(this, []);
        let m = tag.match(/[a-z]+|\S+/g);
        __classPrivateFieldSet(this, _Poster_Tag_id, m ? String(m.shift()) : '?', "f");
        let tagParts = m ? m.shift()?.split(/:{1}/) : undefined;
        let attrs = !tagParts ? [0, 0, 0, 0] : tagParts.map(x => Number(x));
        attrs = attrs.concat([0, 0, 0, 0]);
        attrs.length = 4;
        const reqd = attrs[1] + attrs[2];
        if (this.isParaTag) {
            // [1] = indent     [2] = wrap length
            if (reqd === 0) {
                attrs[2] = line_length;
            }
            else if (reqd > line_length) {
                attrs[1] *= line_length / reqd;
                attrs[2] *= line_length / reqd;
            }
            else if (attrs[1] > 0 && attrs[2] === 0) {
                attrs[2] = line_length - attrs[1];
            }
        }
        __classPrivateFieldSet(this, _Poster_Tag_attrs, attrs, "f");
    }
    get id() { return __classPrivateFieldGet(this, _Poster_Tag_id, "f"); }
    get value() { return __classPrivateFieldGet(this, _Poster_Tag_attrs, "f")[0]; }
    get indent() { return __classPrivateFieldGet(this, _Poster_Tag_attrs, "f")[1]; }
    get wrapW() { return __classPrivateFieldGet(this, _Poster_Tag_attrs, "f")[2]; }
    get leading() { return __classPrivateFieldGet(this, _Poster_Tag_attrs, "f")[3]; }
    get isParaTag() { return Boolean(__classPrivateFieldGet(this, _Poster_Tag_id, "f").match(/^p[lrcj]/)); }
    toString() {
        let s = `TAG id: "${__classPrivateFieldGet(this, _Poster_Tag_id, "f")}" (para tag? ${this.isParaTag})  `;
        s += `Value: ${this.value}   Indent: ${this.indent}   Line length: ${this.wrapW}  Leading: ${this.leading}`;
        return s;
    }
}
_Poster_Tag_id = new WeakMap(), _Poster_Tag_attrs = new WeakMap();
/** @hidden */
class Poster_State {
    constructor() {
        _Poster_State_font.set(this, 'sans-serif');
        _Poster_State_size.set(this, 20);
        _Poster_State_style.set(this, 'normal');
        _Poster_State_slant.set(this, 14);
        _Poster_State_glyphStrokeWidth.set(this, 0);
        _Poster_State_glyphStroke.set(this, 0);
        _Poster_State_glyphFill.set(this, 1);
    }
    get font() { return __classPrivateFieldGet(this, _Poster_State_font, "f"); }
    set font(v) { __classPrivateFieldSet(this, _Poster_State_font, v, "f"); }
    get size() { return __classPrivateFieldGet(this, _Poster_State_size, "f"); }
    set size(v) { __classPrivateFieldSet(this, _Poster_State_size, v, "f"); }
    get style() { return __classPrivateFieldGet(this, _Poster_State_style, "f"); }
    set style(v) { __classPrivateFieldSet(this, _Poster_State_style, v, "f"); }
    get slant() { return __classPrivateFieldGet(this, _Poster_State_slant, "f"); }
    set slant(v) { __classPrivateFieldSet(this, _Poster_State_slant, v, "f"); }
    get strokeWidth() { return __classPrivateFieldGet(this, _Poster_State_glyphStrokeWidth, "f"); }
    set strokeWidth(v) { __classPrivateFieldSet(this, _Poster_State_glyphStrokeWidth, v, "f"); }
    get stroke() { return __classPrivateFieldGet(this, _Poster_State_glyphStroke, "f"); }
    set stroke(v) { __classPrivateFieldSet(this, _Poster_State_glyphStroke, v, "f"); }
    get fill() { return __classPrivateFieldGet(this, _Poster_State_glyphFill, "f"); }
    set fill(v) { __classPrivateFieldSet(this, _Poster_State_glyphFill, v, "f"); }
    get cssFont() {
        return cssFont$(__classPrivateFieldGet(this, _Poster_State_font, "f"), __classPrivateFieldGet(this, _Poster_State_size, "f"), __classPrivateFieldGet(this, _Poster_State_style, "f"), __classPrivateFieldGet(this, _Poster_State_slant, "f"));
    }
    clone() {
        let clone = new Poster_State();
        clone.font = this.font;
        clone.size = this.size;
        clone.style = this.style;
        clone.slant = this.slant;
        clone.strokeWidth = this.strokeWidth;
        clone.stroke = this.stroke;
        clone.fill = this.fill;
        return clone;
    }
    toString() {
        let s = `STATE:     font:   "${this.cssFont}" \n`;
        s += `           gsw:    ${this.strokeWidth} \n`;
        s += `           gs:     ${this.stroke} \n`;
        s += `           gf:     ${this.fill} \n`;
        return s;
    }
}
_Poster_State_font = new WeakMap(), _Poster_State_size = new WeakMap(), _Poster_State_style = new WeakMap(), _Poster_State_slant = new WeakMap(), _Poster_State_glyphStrokeWidth = new WeakMap(), _Poster_State_glyphStroke = new WeakMap(), _Poster_State_glyphFill = new WeakMap();
/** @hidden */
class Poster_Stack {
    constructor() {
        _Poster_Stack_stack.set(this, []);
    }
    push(state) {
        __classPrivateFieldGet(this, _Poster_Stack_stack, "f").push(state.clone());
    }
    pop() {
        if (__classPrivateFieldGet(this, _Poster_Stack_stack, "f").length > 1)
            return __classPrivateFieldGet(this, _Poster_Stack_stack, "f").pop();
        else
            return __classPrivateFieldGet(this, _Poster_Stack_stack, "f")[0].clone();
    }
}
_Poster_Stack_stack = new WeakMap();
//# sourceMappingURL=poster.js.map
/**
 * <p>This class represents a rectangular grid layout of cells that can be
 * used to specify the position and size of canvasGUI controls. </p>
 * <p>The grid layout enables the user to</p>
 * <ul>
 * <li>Define the overall size and position of the grid in pixels.</li>
 * <li>Define the number and relative width of the columns.</li>
 * <li>Define the number and relative height of the rows.</li>
 * <li>Position controls within the grid</li>
 * <li>Allow controls to span multiple columns and/or rows</li>
 * </ul>
 * <p>The methds <code>cols</code>, <code>rows</code> and <code>cells</code>
 * are used to set the number and/or the relative cell size within the grid
 * area. Passing integers to these methods will create cells of equal widths
 * and equal
 * heights.</p>
 * <p>To have columns of different widths or rows with different heights then
 * the parameter must be an array of numbers, the array length represents the
 * number of cells and the array values represent their relative sizes.</p>
 * <p>An example will make this clearer, consider the following code</p>
 * <p><code>grid.cols([10, 24, 16]).rows(4); </code><br>
 * <code>grid.size([10, 24, 16], 4); </code></p>
 * <p>Both lines perform the same action by specifying a grid of 3 variable
 * width columns and 4 equal height rows. The row height in pixels will be
 * the 0.25 x the grid area height.</p>
 * <p>To caluclate the column widths divide each array element by the sum of
 * all the array values. If we do that the array elements becomes
 * <code>[0.2, 0.48, 0.32]</code> and  to find the column pixel widths,
 * simply multiply these values by grid area width.</p>
 */
class GridLayout {
    /**
     * <p>Instantiates a grid layout for a given pixel position and size in
     * the display area. All parameters values are rounded to the nearest
     * integer.</p>
     *
     * @param x left edge position
     * @param y top edge position
     * @param w grid width
     * @param h grid height
     * @hidden
     */
    constructor(x, y, w, h) {
        /** @hidden */ this._x = 0;
        /** @hidden */ this._y = 0;
        /** @hidden */ this._w = 0;
        /** @hidden */ this._h = 0;
        /** @hidden */ this._ix = 2;
        /** @hidden */ this._iy = 2;
        this._x = Math.round(x);
        this._y = Math.round(y);
        this._w = Math.round(w);
        this._h = Math.round(h);
        this._ix = 2;
        this._iy = 2;
        this._cx = [0, 1];
        this._cy = [0, 1];
    }
    /** Get the left position of the grid */
    get x() { return this._x; }
    /** Get the top edge position of the grid */
    get y() { return this._y; }
    /** Get the grid's width in pixels */
    get w() { return this._w; }
    /** Get the grid's height in pixels */
    get h() { return this._h; }
    /** the number of columns in the grid */
    get nbrCols() { return this._cx.length - 1; }
    /** the number of rows in the grid */
    get nbrRows() { return this._cy.length - 1; }
    /**
     * Internal pixel boundary values for the columns.
     * (relative to top-left position of the grid)
     */
    get intPxlCols() { return this._cx.map(v => Math.round(v * this._w)); }
    /**
     * External (display) pixel boundary values for the columns.
     * (includes top-left position of the grid)
     */
    get extPxlCols() { return this._cx.map(v => this._x + Math.round(v * this._w)); }
    /** Normalised internal boundary values for the columns. */
    get normCols() { return [...this._cx]; }
    /**
     * Internal pixel boundary values for the rows.
     * (relative to top-left position of the grid)
     */
    get intPxlRows() { return this._cy.map(v => Math.round(v * this._h)); }
    /**
     * External (display) pixel boundary values for the rows.
     * (includes top-left position of the grid)
     */
    get extPxlRows() { return this._cy.map(v => this._y + Math.round(v * this._h)); }
    /** Normalised internal boundary values for the rows. */
    get normRows() { return [...this._cy]; }
    /**
     * Reposition the grid
     * @param x left edge position to use
     * @param y top edge position to use
     * @returns this grid
     */
    xy(x, y) {
        this._x = Math.round(x);
        this._y = Math.round(y);
        return this;
    }
    /**
     * Resize the grid
     * @param w new grid width
     * @param h new grid height
     * @returns this grid
     */
    wh(w, h) {
        this._w = Math.round(w);
        this._h = Math.round(h);
        return this;
    }
    /**
     * <p>Set the number and relative widths of the horizontal cells.</p>
     *
     * @param n number or an array containing relative widths
     * @returns this grid
     */
    cols(n) {
        let values = this._makeNormArray(n);
        if (values.length > 0)
            this._cx = values;
        return this;
    }
    /**
     * <p>Set the number and relative heights of the vertical cells.</p>
     *
     * @param n number or an array containing relative heights
     * @returns this grid
     */
    rows(n) {
        let values = this._makeNormArray(n);
        if (values.length > 0)
            this._cy = values;
        return this;
    }
    /**
     * <p>Set the number and relative sizes of the cells in both horizontal
     * and vertical dimensions.</p>
     *
     * @param nc number or an array containing relative widths
     * @param nr number or an array containing relative height
     * @returns this grid
     */
    size(nc, nr) {
        this.cols(nc);
        this.rows(nr);
        return this;
    }
    /**
     * <p>Get the position and size for the control that fits the specified
     * cells taking into account the insets which provide a clear border
     * between the control and the cell boundary.</p>
     * <p>The top-left cell number is [0, 0]</p>
     * @param px horizontal cell number
     * @param py vertical cell number
     * @param pw number of horizontal cells to span
     * @param ph number of vertical cells to span
     * @returns the array [x, y, w, h]
     */
    cell(px, py, pw = 1, ph = 1) {
        return this._calcRect(px, py, pw, ph, this._ix, this._iy);
    }
    /**
     * <p>Get the position and size for the specified cells ignoring insets.
     * This can be used to define rectangles that surround groups of
     * controls.<p>
     * <p>The top-left cell number is [0, 0]</p>
     * @param px horizontal cell number
     * @param py vertical cell number
     * @param pw number of hrizontal cells to span
     * @param ph number of vertical cells to span
     * @returns the array [x, y, w, h]
     */
    border(px, py, pw = 1, ph = 1) {
        return this._calcRect(px, py, pw, ph);
    }
    /**
     * <p>The gap (pixels) between the cell border and the control.</p>
     * @param hinset horizontal inset
     * @param vinset vertical inset
     * @returns this grid
     */
    insets(hinset = 2, vinset = 2) {
        this._ix = Math.round(hinset);
        this._iy = Math.round(vinset);
        return this;
    }
    /** @hidden */
    _calcRect(px, py, pw, ph, insetX = 0, insetY = 0) {
        [px, py, pw, ph] = this._validateCellPositions(px, py, pw, ph);
        let x = Math.round(this._cx[px] * this._w + this._x + insetX);
        let w = Math.round((this._cx[px + pw] - this._cx[px]) * this._w - 2 * insetX);
        let y = Math.round(this._cy[py] * this._h + this._y + insetY);
        let h = Math.round((this._cy[py + ph] - this._cy[py]) * this._h - 2 * insetY);
        return [x, y, w, h];
    }
    /** @hidden */
    _validateCellPositions(px, py, pw = 1, ph = 1) {
        function constrain(v, n0, n1) {
            return v < n0 ? n0 : v > n1 ? n1 : v;
        }
        px = constrain(px, 0, this._cx.length - 2);
        py = constrain(py, 0, this._cy.length - 2);
        pw = constrain(pw, 1, this._cx.length - px - 1);
        ph = constrain(ph, 1, this._cy.length - py - 1);
        return [px, py, pw, ph];
    }
    /** @hidden */
    _makeNormArray(n) {
        let size = [], pos = [0];
        if (Array.isArray(n)) {
            if (n.length > 0) {
                let sum = 0;
                n.forEach(v => sum += v);
                n.forEach(v => size.push(v / sum));
            }
        }
        else {
            for (let i = 0; i < n; i++)
                size.push(1 / n);
        }
        let sum = 0;
        size.forEach(v => pos.push((sum += v)));
        return pos;
    }
}
//# sourceMappingURL=grid.js.map
