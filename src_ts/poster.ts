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

    /** @hidden */ #taggedText: string = '';
    /** @hidden */ #words: Array<Poster_Ascii> = [];
    /** @hidden */ #fonts: Array<string> = GENERIC_FONTS();
    /** @hidden */ #colors: Array<string> = new Array(3);
    /** @hidden */ #wrapW: number;
    /** @hidden */ #icons: Array<Poster_Icon> = [];
    /** @hidden */ #backStyle = 2;

    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x || 0, y || 0, w || 320, h || 240);
        this.#wrapW = this._w - 2 * ISET_H;
        this.#colors[0] = 'transparent';
        this.invalidateBuffer();
    }

    /**
     * This method accepts the tagged text which it formats and styles ready
     * to display in the control.
     * 
     * @param text a string or an array of strings
     * @returns this control
     */
    text(text: string | Array<string>) {
        this.#taggedText = Array.isArray(text) ? text.join('') : text;
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
    icon(icon: cvsIcon, x = 0, y = 0) {
        this.#icons.push(new Poster_Icon(icon, x, y));
        return this;
    }

    /**
     * Removes all icons added to this poster.
     * @returns this control
     */
    removeIcons() {
        this.#icons = [];
        return this;
    }

    /**
     * <p>By default the poster can use the logical fonts -</p>
     * <ul>
     * <li>ft0 'serif'</li>
     * <li>ft1 'sans-serif'</li>
     * <li>ft2 'monospace'</li>
     * <li>ft3 'cursive'</li>
     * <li>ft4 'fantasy'</li>
     * </ul>
     * <p>This method allows the user to append additional font(s).</p>
     * 
     * @param fonts a font or an array of fonts
     * @returns this control
     */
    fonts(fonts: string | object | Array<string | object>) {
        let ffs = Array.isArray(fonts) ? fonts : [fonts];
        ffs = ffs.map(ff => cvsGuiFont(ff));
        this.#fonts = this.#fonts.concat(...ffs);
        this.invalidateText();
        return this;
    }

    /**
     * <p>By default the poster can use the colors  -</p>
     * <ul>
     * <li>gf0 'transparent'</li>
     * <li>gf1 the poster's color scheme text color</li>
     * <li>gf2 the poster's color scheme opaque color</li>
     * </ul>
     * <p>This method allows the user to append additional color(s).</p>
     * @returns this control
     */
    colors(colors: string | object | Array<string | object>) {
        let clrs = Array.isArray(colors) ? colors : [colors];
        clrs = clrs.map(ff => cvsGuiColor(ff));
        this.#colors = this.#colors.concat(...clrs);
        this.invalidateBuffer();
        return this;
    }

    /**
     * <p>This sets the background color to be used when the poster has been set 
     * to opaque by calling the 'opaque(alpha)' function.</p>
     * <If no index value is passed to the function then the default value 2 
     * is used which correseponds the scheme color and alpha (transparency) value 
     * specified in the call to the 'opaque(alpha)' function.</p>
     * <p>This method has no effect if the poster state is transparent.</p>
     * 
     * @param index the index into the colors array
     * @returns this control
     */
    backStyle(index = 2) {
        this.#backStyle = index % this.#colors.length;
        return this;
    }

    /**
     * Parses the raw text into tokens (Tag and Ascii objects)
     * @returns the list of tokens
     * @hidden
     */
    _makeTokens() {
        function findTokens(chunk: string, pw: number) {
            if (chunk.startsWith("<")) {
                chunk = chunk.substring(1, chunk.length - 1);
                chunk.split(/\s+/g)
                    .forEach(m => tokens.push(new Poster_Tag(m, pw)));
            }
            else
                tokens.push(new Poster_Ascii(chunk));
        }
        const tokens = [];
        const tagPtn = /&\w+;|<[a-zA-Z0-9 .:]+>|\s+|[^&<> ]+/ug;
        const matches = this.#taggedText.match(tagPtn);
        matches.forEach(m => findTokens(m, this.#wrapW));
        return tokens;
    }

    /** @hidden */
    _makeParagraphs(tokens) {
        const paras: Array<Poster_Para> = [];
        let para: Poster_Para;
        if (!tokens[0].isParaTag)
            paras.push(para = new Poster_Para('pc', 0, 0, this.#wrapW));
        tokens.forEach(tkn => {
            if (tkn.isParaTag)
                paras.push(para = new Poster_Para(tkn.id, tkn.value, tkn.indent, tkn.wrapW));
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
            para.tokens.forEach(tkn => {
                if (tkn instanceof Poster_Tag && TAGS.has(tkn.id)) {
                    switch (tkn.id) {
                        case 'o':
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
                            state.font = this.#fonts[tkn.value % this.#fonts.length];
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
        const uic = this._uicContext;
        uic.save();
        uic.textBaseline = 'alphabetic';
        paras.forEach(para => {
            para.tokens.forEach(tkn => {
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

    /** @hidden */
    _splitIntoLines(paras) {
        const lines = [];
        paras.forEach(para => {
            let line: Poster_Line, advance = 0;
            lines.push(line = new Poster_Line(para.align, para.gap, para.indent, para.wrapW));
            para.tokens.forEach(ascii => {
                if (advance + ascii.width > line.wrapW) { // Start a new line
                    lines.push(line = new Poster_Line(para.align, 0, para.indent, para.wrapW));
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
        let py = lines[0].ascent + 2 * ISET_V;
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
                    if (line.nbrWords >= 2 && line.length / ww > 0 / 75)
                        dx = (ww - line.length) / (line.nbrWords - 1);
            }
            sx += ISET_H;
            for (let i = 0; i < line.nbrWords; i++) {
                line.words[i].x += sx + i * dx;
                line.words[i].y = py;
                words.push(line.words[i]);
            }
            py += line.height + 3;
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
        this.#words = this._positionWords(lines);
        this._textInvalid = false;
    }

    /** @hidden */
    _updateControlVisual() { // CvsLabel
        if (this._textInvalid)
            this._formatText();
        const cs = this.SCHEME;
        // Color scheme fore color
        this.#colors[1] = cs.C$(8);
        // Color scheme opaque color
        this.#colors[2] = cs.C$(3, this._alpha);
        const cnrs = this.CNRS;

        const uic = this._uicContext;
        uic.clearRect(0, 0, this._w, this._h);
        if (this._opaque && this.#backStyle != 0) {
            uic.save();
            uic.fillStyle = this.#colors[this.#backStyle];
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, ...cnrs);
            uic.fill();
            uic.restore();
        }

        // Display icons
        this.#icons.forEach(i => uic.drawImage(i.icon, i.x, i.y));

        uic.textBaseline = 'alphabetic';
        this.#words.forEach(word => {
            if (word.fill > 0) {
                uic.font = word.cssFont;
                uic.fillStyle = this.#colors[word.fill % this.#colors.length];
                uic.fillText(word.ascii, word.x, word.y);
            }
            if (word.strokeWidth > 0) {
                uic.lineWidth = word.strokeWidth;
                uic.strokeStyle = this.#colors[word.stroke % this.#colors.length];
                uic.strokeText(word.ascii, word.x, word.y);
            }
        });
        this._bufferInvalid = false;  // buffer is now valid
    }

    /** @hidden */ orient(a) { return this.warn$('orient') }
    /** @hidden */ enable() { return this.warn$('enable'); }
    /** @hidden */ disable() { return this.warn$('disable'); }
    /** @hidden */ setAction() { return this.warn$('setAction'); }
    /** @hidden */ tooltip(a) { return this.warn$('tooltip') }
    /** @hidden */ tipTextSize(a) { return this.warn$('tipTextSize') }

} // End of CvsPoster class

class Poster_Icon {
    #icon: cvsIcon;
    #x: number;
    #y: number;

    constructor(icon: cvsIcon, x = 0, y = 0) {
        this.#icon = cvsGuiCanvas(icon);
        this.#x = x;
        this.#y = y;
    }

    get icon() { return this.#icon }
    get x() { return this.#x }
    get y() { return this.#y }

}

/** @hidden */
class Poster_Line {
    #words = [];
    #align: string;
    #lAscent: number = 0;
    #lHeight: number = 0;
    #gap: number = 0;
    #indent: number = 0;
    #wrapW: number = 0;

    constructor(align, gap, indent, wrapW) {
        this.#align = align;
        this.#gap = gap;
        this.#indent = indent;
        this.#wrapW = wrapW;
    }

    get words() { return this.#words };

    get nbrWords() { return this.#words.length };

    set align(a) { this.#align = a };
    get align() { return this.#align };

    set gap(n) { this.#gap = n };
    get gap() { return this.#gap };

    set indent(n) { this.#indent = n };
    get indent() { return this.#indent };

    set wrapW(n) { this.#wrapW = n };
    get wrapW() { return this.#wrapW };

    set ascent(a) { this.#lAscent = a };
    get ascent() { return this.#lAscent };

    set height(h) { this.#lHeight = h };
    get height() { return this.#lHeight };

    get length() {
        if (this.#words.length > 0) {
            let word = this.#words[this.#words.length - 1];
            return word.x + word.width;
        }
        else
            return 0;
    }

    addWord(word) { this.#words.push(word); }

    toString() {
        let [aln, indent, wrapW, asc, hgt, len] = [this.align, this.indent, this.wrapW,
        Math.round(this.ascent), Math.round(this.height), Math.round(this.length)];
        let s = `LINE  "${aln}"  Len: ${len}  Height: ${hgt}  Ascent: ${asc}  Indent: ${indent}  Wrap: ${wrapW} \n`;
        // this.#words.forEach(word => s += word.toString() + '\n');
        return s;
    }
}

/** @hidden */
class Poster_Para {
    #tokens: Array<object> = [];
    #align = 'center';
    #gap = 0;
    #indent = 0;
    #wrapW = 0;

    constructor(tagId = 'pc', gap: number, indent: number, wrapW: number) {
        this.#align = TAGS.get(tagId);
        this.#gap = gap;
        this.#indent = indent;
        this.#wrapW = wrapW;
    }

    get tokens() { return this.#tokens }
    set tokens(v) { this.#tokens = v }

    get align() { return this.#align }
    get gap() { return this.#gap }
    get indent() { return this.#indent }
    get wrapW() { return this.#wrapW }

    toString() {
        return `PARAGRAPH (${this.#align})   Gap: ${this.gap}   Indent: ${this.indent}   wrapW: ${this.wrapW}`;
    }
}

/** @hidden */
class Poster_Ascii {
    #ascii = '';
    #x = 0;
    #y = 0;
    #w = 0;
    #h = 0;
    #a = 0;

    #cssFont: string;
    #glyphStrokeWidth = 0;
    #glyphStroke = 0;
    #glyphFill = 0;

    get x() { return this.#x };
    set x(n) { this.#x = n };
    get y() { return this.#y };
    set y(n) { this.#y = n };

    get width() { return this.#w };
    set width(n) { this.#w = n };
    get height() { return this.#h };
    set height(n) { this.#h = n };
    get ascent() { return this.#a };
    set ascent(n) { this.#a = n };

    get ascii() { return this.#ascii }
    get isAscii() { return !this.ascii.startsWith(' ') }
    get isSpace() { return this.ascii.startsWith(' ') }

    get cssFont() { return this.#cssFont };
    set cssFont(v) { this.#cssFont = v };

    get strokeWidth() { return this.#glyphStrokeWidth }
    set strokeWidth(v) { this.#glyphStrokeWidth = v }

    get stroke() { return this.#glyphStroke }
    set stroke(v) { this.#glyphStroke = v }

    get fill() { return this.#glyphFill }
    set fill(v) { this.#glyphFill = v }

    constructor(chunk: string) {
        this.#cssFont = this.cssFont;
        if (chunk.startsWith("&")) {
            this.#ascii = CHAR_ENTITIES.has(chunk)
                ? CHAR_ENTITIES.get(chunk) : chunk;
        }
        else {
            this.#ascii = chunk;
        }
    }

    applyState(state) {
        this.cssFont = state.cssFont;
        this.strokeWidth = state.strokeWidth;
        this.stroke = state.stroke;
        this.fill = state.fill;
    }

    toString() {
        let s = `WORD   "${this.ascii}" \n`;
        s += `          Font:     ${this.cssFont} \n`;
        s += `          Pos:      (${this.x}, ${this.y})   Size: ${this.width} x ${this.height} \n`;
        s += `          Ascent:   ${this.ascent} \n`;
        return s;
    }
}

/** @hidden */
class Poster_Tag {
    #id = '';
    #attrs = [];

    constructor(tag: string, line_length: number) {
        let m = tag.match(/[a-z]+|\S+/g);
        this.#id = m.shift();
        let tagParts = m.shift()?.split(/:{1}/);
        let attrs = !tagParts ? [0, 0, 0] : tagParts.map(x => Number(x));
        attrs = attrs.concat([0, 0, 0]);
        attrs.length = 3;
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
        this.#attrs = attrs;
    }

    get id() { return this.#id }
    get value() { return this.#attrs[0] }
    get indent() { return this.#attrs[1] }
    get wrapW() { return this.#attrs[2] }
    get isParaTag() { return Boolean(this.#id.match(/^p[lrcj]/)) }

    toString() {
        let s = `TAG id: "${this.#id}" (para tag? ${this.isParaTag})  `;
        s += `Value: ${this.value}   Indent: ${this.indent}   Line length: ${this.wrapW}`
        return s;
    }
}

/** @hidden */
class Poster_State {
    #font = 'sans-serif';
    #size = 20;
    #style = 'normal';
    #slant = 14;
    #glyphStrokeWidth = 0;
    #glyphStroke = 0;
    #glyphFill = 1;

    constructor() { }

    get font() { return this.#font }
    set font(v) { this.#font = v }

    get size() { return this.#size }
    set size(v) { this.#size = v }

    get style() { return this.#style }
    set style(v) { this.#style = v }

    get slant() { return this.#slant }
    set slant(v) { this.#slant = v }

    get strokeWidth() { return this.#glyphStrokeWidth }
    set strokeWidth(v) { this.#glyphStrokeWidth = v }

    get stroke() { return this.#glyphStroke }
    set stroke(v) { this.#glyphStroke = v }

    get fill() { return this.#glyphFill }
    set fill(v) { this.#glyphFill = v }

    get cssFont() {
        return cssFont$(this.#font, this.#size, this.#style, this.#slant);
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
    #stack = [];

    constructor() { }

    push(state: Poster_State) {
        this.#stack.push(state.clone());
    }

    pop(): Poster_State | undefined {
        if (this.#stack.length > 1)
            return this.#stack.pop();
        else
            return this.#stack[0].clone();
    }
}
