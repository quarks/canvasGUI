/**
 * <h2>Similar to the label contol but with much greater controls over text
 * rendering</h2>
 * <p>Although it is possible to specify font, text size and style for the
 * label control these are applied to the whole text. The poster control
 * removes this restriction allowing the text attributes to be changed for
 * any part of the text.</p>
 * <p>Configurable attributes include
 * <ul>
 * <li><b>Font:</b> multiple fonts can be used within one poster control.
 * Any logical or system font or any true-type-font (TTF) previously loaded
 * from a file can be used.</li>
 * <li><b>Text size:</b></li>
 * <li><b>Text style:</b> normal, bold, thin, italic, oblique</li>
 * <li><b>Multiple paragraphs:</b> each having their own
 * <ul>
 * <li>left, right, center or justied text alignment</li>
 * <li>leading (vetical gap) from previous paragraph</li>
 * <li>left and right indents</li>
 * <li>vertical line spacing (leading)</li>
 * </ul>
 * <li><b>Glyphs:</b> the fill and outline colors can be specified as well as
 * the outine stroke weight.</li>
 * <li><b>Icons:</b> multiple images positioned inside the poster control
 * independantly of any text.</li>
 * <li><b>Character entities:</b> virtually all HTML Character Entities can
 * be embedded in the text.</li>
 *
 * <p>To achieve this the user must provide tagged-text in a similar style to
 * that used in HTML documents.</p>
 *
 *
 */
class CvsPoster extends CvsBufferedControl {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h, false);
        this._taggedText = '';
        this._words = [];
        this._fonts = FONT_FAMILIES();
        this._isetHorz = 3;
        this._isetVert = 2;
        this._wrapW = this._w - 2 * this._isetHorz;
        this._icons = [];
        this._backStyle = 2;
        this._colors = new Array(3);
        this._colors[0] = 'transparent';
        this._colors[1] = this.SCHEME.C$(8);
        this._colors[2] = this.SCHEME.C$(3, this._alpha);
        this.invalidateBuffer();
    }
    /** Get the number of fonts in this poster */
    get fontCount() { return this._fonts.length; }
    /** Get the number of colors in this poster */
    get colorCount() { return this._colors.length; }
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
            this._colors[1] = this.SCHEME.C$(8);
            this._colors[2] = this.SCHEME.C$(3, this._alpha);
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
        this._taggedText = Array.isArray(text) ? text.join(separator) : text;
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
        this._icons.push(new Poster_Icon(icon, x, y));
        return this;
    }
    /**
     * Removes all icons added to this poster.
     * @returns this control
     */
    removeIcons() {
        this._icons = [];
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
     * <p>Add to or replace these fonts with a user defined font list.</p>
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
                    this._fonts = fontList;
                else
                    this._fonts = this._fonts.concat(...fontList);
                this.invalidateText();
            }
            return this;
        }
        return Array.from(this._fonts);
    }
    /**
     * <p>By default the user can select one of the following colors  -</p>
     * <ul>
     * <li>gf0 'transparent'</li>
     * <li>gf1 the poster's color scheme text color</li>
     * <li>gf2 the poster's color scheme opaque color</li>
     * </ul>
     * <p>Add to or replace these colors with a user defined color list.</p>
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
                    this._colors = colorList;
                else
                    this._colors = this._colors.concat(...colorList);
                this.invalidateBuffer();
            }
            return this;
        }
        return Array.from(this._colors);
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
        this._backStyle = index % this._colors.length;
        return this;
    }
    /**
     * Sets the internal margins to use when formating text.
     * @param mgnX left / right margin
     * @param mgnY top margin
     * @returns this control;
     */
    margins(mgnX = 0, mgnY = mgnX) {
        this._isetHorz = mgnX;
        this._isetVert = mgnY;
        this._wrapW = this._w - 2 * mgnX;
        this.invalidateText();
        return this;
    }
    /**
     * The maximum line length (pixels) possible. The length depends on the
     * poster width and the horizontal margins.
     */
    get wrapWidth() { return this._wrapW; }
    /**
     * Parses the raw text into tokens (Tag and Ascii objects)
     * @returns the list of tokens
     * @hidden
     */
    //const tagPtn = /<[a-zA-Z0-9 .:]+>|\s+|[^&<> ]+/gu;
    _makeTokens() {
        function getChunks(tagtxt) {
            const tagPtn = /<[a-zA-Z0-9 .:-]+>|&\w+;|\s+|[^&<> ]+/gu;
            let ch = tagtxt.match(tagPtn);
            return ch ? ch.map(t => String(t)) : [];
        }
        function getTokens(chunks, pw) {
            const tokens = [];
            chunks.forEach(chunk => {
                if (chunk.startsWith("<")) {
                    chunk = chunk.substring(1, chunk.length - 1);
                    chunk.split(/\s+/g)
                        .forEach(ch => tokens.push(new Poster_Tag(String(ch), pw)));
                }
                else
                    tokens.push(new Poster_Ascii(chunk));
            });
            return tokens;
        }
        const chunks = getChunks(this._taggedText);
        const tokens = getTokens(chunks, this._wrapW);
        return tokens;
    }
    /** @hidden */
    _makeParagraphs(tokens) {
        const paras = [];
        let para;
        if (!tokens[0].isParaTag)
            paras.push(para = new Poster_Para('pc', 0, 0, this._wrapW, 0));
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
                            state.font = this._fonts[tkn.value % this._fonts.length];
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
        let py = lines[0].ascent + 2 * this._isetVert;
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
            sx += this._isetHorz;
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
        this._words = this._positionWords(lines);
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
        this._colors[1] = cs.C$(8);
        this._colors[2] = cs.C$(3, this._alpha);
        const OPAQUE = this._colors[this._backStyle];
        const cnrs = this.CNRS;
        if (this._opaque && this._backStyle != 0) {
            uic.save();
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, ...cnrs);
            uic.fill();
            uic.restore();
        }
        // Display icons
        this._icons.forEach(i => uic.drawImage(i.icon, i.x, i.y));
        uic.textBaseline = 'alphabetic';
        this._words.forEach(word => {
            uic.font = word.cssFont;
            const fill = this._colors[word.fill % this._colors.length];
            if (fill !== 'transparent') {
                uic.fillStyle = fill;
                uic.fillText(word.ascii, word.x, word.y);
            }
            const stroke = this._colors[word.stroke % this._colors.length];
            if (stroke !== 'transparent') {
                uic.lineWidth = word.strokeWidth;
                uic.strokeStyle = stroke;
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
// ##################################################################
//        Supporting classes for formating text & icons
// ##################################################################
class Poster_Icon {
    constructor(icon, x = 0, y = 0) {
        this._icon = cvsGuiCanvas(icon);
        this._x = x;
        this._y = y;
    }
    get icon() { return this._icon; }
    get x() { return this._x; }
    get y() { return this._y; }
}
/** @hidden */
class Poster_Line {
    constructor(gap, para) {
        this._words = [];
        this._lAscent = 0;
        this._lHeight = 0;
        this._gap = 0;
        this._indent = 0;
        this._wrapW = 0;
        this._leading = 0;
        this._gap = gap;
        this._align = para.align;
        this._indent = para.indent;
        this._wrapW = para.wrapW;
        this._leading = para.leading;
    }
    get words() { return this._words; }
    ;
    get nbrWords() { return this._words.length; }
    ;
    set align(a) { this._align = a; }
    ;
    get align() { return this._align; }
    ;
    set gap(n) { this._gap = n; }
    ;
    get gap() { return this._gap; }
    ;
    set indent(n) { this._indent = n; }
    ;
    get indent() { return this._indent; }
    ;
    set wrapW(n) { this._wrapW = n; }
    ;
    get wrapW() { return this._wrapW; }
    ;
    set ascent(a) { this._lAscent = a; }
    ;
    get ascent() { return this._lAscent; }
    ;
    set height(h) { this._lHeight = h; }
    ;
    get height() { return this._lHeight; }
    ;
    set leading(ld) { this._leading = ld; }
    get leading() { return this._leading; }
    get length() {
        if (this._words.length > 0) {
            let word = this._words[this._words.length - 1];
            return word.x + word.width;
        }
        else
            return 0;
    }
    addWord(word) { this._words.push(word); }
    toString() {
        const [aln, indent, wrapW, asc, hgt, len] = [this.align, this.indent, this.wrapW,
            Math.round(this.ascent), Math.round(this.height), Math.round(this.length)];
        return `LINE  "${aln}"  Len: ${len}  Height: ${hgt}  Ascent: ${asc}`
            + `  Indent: ${indent}  Wrap: ${wrapW} \n`;
    }
}
/** @hidden */
class Poster_Para {
    constructor(tagId = 'pc', gap, indent, wrapW, leading) {
        this._tokens = [];
        this._align = 'center';
        this._gap = 0;
        this._indent = 0;
        this._wrapW = 0;
        this._leading = 0;
        this._align = TAGS.get(tagId);
        this._gap = gap;
        this._indent = indent;
        this._wrapW = wrapW;
        this._leading = leading;
    }
    get tokens() { return this._tokens; }
    set tokens(v) { this._tokens = v; }
    get align() { return this._align; }
    get gap() { return this._gap; }
    get indent() { return this._indent; }
    get wrapW() { return this._wrapW; }
    get leading() { return this._leading; }
    toString() {
        return `PARAGRAPH (${this._align})   Gap: ${this.gap}   `
            + `Indent: ${this.indent}   wrapW: ${this.wrapW}    `
            + `leading: ${this.leading}`;
    }
}
/** @hidden */
class Poster_Ascii {
    get x() { return this._x; }
    ;
    set x(n) { this._x = n; }
    ;
    get y() { return this._y; }
    ;
    set y(n) { this._y = n; }
    ;
    get width() { return this._w; }
    ;
    set width(n) { this._w = n; }
    ;
    get height() { return this._h; }
    ;
    set height(n) { this._h = n; }
    ;
    get ascent() { return this._a; }
    ;
    set ascent(n) { this._a = n; }
    ;
    get ascii() { return this._ascii; }
    get isAscii() { return !this.ascii.startsWith(' '); }
    get isSpace() { return this.ascii.startsWith(' '); }
    get cssFont() { return this._cssFont; }
    ;
    set cssFont(v) { this._cssFont = v; }
    ;
    get strokeWidth() { return this._glyphStrokeWidth; }
    set strokeWidth(v) { this._glyphStrokeWidth = v; }
    get stroke() { return this._glyphStroke; }
    set stroke(v) { this._glyphStroke = v; }
    get fill() { return this._glyphFill; }
    set fill(v) { this._glyphFill = v; }
    constructor(chunk) {
        this._ascii = '';
        this._x = 0;
        this._y = 0;
        this._w = 0;
        this._h = 0;
        this._a = 0;
        this._glyphStrokeWidth = 0;
        this._glyphStroke = 0;
        this._glyphFill = 0;
        this._cssFont = this.cssFont;
        const ptn = /(&\w+;)/gu;
        this._ascii = chunk.replace(ptn, m => CHAR_ENTITIES.get(m) || m);
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
/** @hidden */
class Poster_Tag {
    constructor(tag, line_length) {
        this._id = '';
        this._attrs = [];
        let m = tag.match(/[a-z]+|\S+/g);
        this._id = m ? String(m.shift()) : '?';
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
        this._attrs = attrs;
    }
    get id() { return this._id; }
    get value() { return this._attrs[0]; }
    get indent() { return this._attrs[1]; }
    get wrapW() { return this._attrs[2]; }
    get leading() { return this._attrs[3]; }
    get isParaTag() { return Boolean(this._id.match(/^p[lrcj]/)); }
    toString() {
        let s = `TAG id: "${this._id}" (para tag? ${this.isParaTag})  `;
        s += `Value: ${this.value}   Indent: ${this.indent}   Line length: ${this.wrapW}  Leading: ${this.leading}`;
        return s;
    }
}
/** @hidden */
class Poster_State {
    constructor() {
        this._font = 'sans-serif';
        this._size = 20;
        this._style = 'normal';
        this._slant = 14;
        this._glyphStrokeWidth = 0;
        this._glyphStroke = 0;
        this._glyphFill = 1;
    }
    get font() { return this._font; }
    set font(v) { this._font = v; }
    get size() { return this._size; }
    set size(v) { this._size = v; }
    get style() { return this._style; }
    set style(v) { this._style = v; }
    get slant() { return this._slant; }
    set slant(v) { this._slant = v; }
    get strokeWidth() { return this._glyphStrokeWidth; }
    set strokeWidth(v) { this._glyphStrokeWidth = v; }
    get stroke() { return this._glyphStroke; }
    set stroke(v) { this._glyphStroke = v; }
    get fill() { return this._glyphFill; }
    set fill(v) { this._glyphFill = v; }
    get cssFont() {
        return cssFont$(this._font, this._size, this._style, this._slant);
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
/** @hidden */
class Poster_Stack {
    constructor() {
        this._stack = [];
    }
    push(state) {
        this._stack.push(state.clone());
    }
    pop() {
        if (this._stack.length > 1)
            return this._stack.pop();
        else
            return this._stack[0].clone();
    }
}
//# sourceMappingURL=poster.js.map