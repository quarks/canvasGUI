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