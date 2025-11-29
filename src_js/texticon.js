/**
 * </p>The base class for any control that displays text as part of its
 * visual interface</p>
 * @hidden
 */
class CvsText extends CvsBufferedControl {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
        /** @hidden */ this._lines = [];
        /** @hidden */ this._textSize = undefined;
        /** @hidden */ this._textAlign = this._p.CENTER;
        /** @hidden */ this._tbox = { w: 0, h: 0 };
        /** @hidden */ this._gap = 2;
    }
    /** @hidden */
    get T_SIZE() { return this._textSize || this._gui._textSize; }
    /** @hidden */
    get T_FONT() { return this._textFont || this._gui._textFont; }
    /** @hidden */
    get T_STYLE() { return this._textStyle || this._gui._textStyle; }
    /**
     * <p>Gets or sets the current text.</p>
     * <p>Processing constants are used to define the alignment.</p>
     * @param t the text to display
     * @param align LEFT, CENTER or RIGHT
     * @returns this control or the existing text
     */
    text(t, align) {
        // getter
        if (t == null || t == undefined)
            return this._lines.join('\n');
        //setter
        if (Array.isArray(t))
            this._lines = t.map(x => x.toString());
        else {
            let lines = t.toString().split('\n');
            this._lines = lines.map(x => x.toString());
        }
        this.textAlign(align);
        // If necessary expand the control to surround text
        let s = this._minControlSize();
        this._w = Math.max(this._w, s.w);
        this._h = Math.max(this._h, s.h);
        this._validateControlBuffers();
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Sets or gets the text font for this control.</p>
     * <p>If the parameter is true-type-font <em>or</em> the name of a system
     * font it will be used as the local font and this control will be
     * returned.</p>
     * <p>Recognised font names are :-</p>
     * <pre>
     * 'arial'             'verdana'   'tahoma'        'trebuchet ms'
     * 'times new roman'   'georgia'   'courier new'   'brush script mt'
     * 'impact'            'serif'     'sans-serif'    'monospace'
     * </pre>
     * <p>Invalid fonts are ignored and the local font is unchanged.</p>
     * <p>If no parameter is passed then the current local font is
     * returned.</p>
     * @param ltf A true-type-font or the name (case-insensitive) of a
     * valid system font.
     * @returns this control
     */
    textFont(ltf) {
        if (!ltf)
            return this._gui.textFont(); // getter
        if (ltf instanceof p5.Font)
            this._textFont = ltf;
        else if (IS_VALID_FONT(ltf.toLowerCase()))
            this._textFont = ltf;
        else
            CWARN(`The font '${ltf}' is not a recognized so will be ignored!`);
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Sets or gets the local text style.</p>
     * <p>The 4 recognised font styles are :-</p>
     * <pre>
     * NORMAL    BOLD   ITALIC   BOLDITALIC
     * </pre>
     * <p>Unrecognized styles are ignored and the local style is unchanged.</p>
     * <p>If no parameter is passed then the current style is returned.</p>
     * @param gty the font style to use.
     * @returns this control
     */
    textStyle(gty) {
        if (!gty)
            return this._textStyle; // getter
        gty = gty.toLowerCase();
        switch (gty) {
            case 'normal':
            case 'bold':
            case 'italic':
            case 'bold italic':
                this._textStyle = gty;
                break;
            default:
                CWARN(`The text style '${gty}' was not recognized so will be ignored!`);
        }
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Sets the text alignment.</p>
     * <p>Processing constants are used to define the text alignment.</p>
     * @param align LEFT, CENTER or RIGHT
     * @returns this control
     */
    textAlign(align) {
        if (align && (align == this._p.LEFT || align == this._p.CENTER || align == this._p.RIGHT)) {
            this._textAlign = align;
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * <p>Renoves any text that the control might use to display itself.</p>
     * @returns this control
     */
    noText() {
        this._lines = [];
        this._tbox = { w: 0, h: 0 };
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Sets or gets the text size. If neccessary the control will expand
     * to surround the text.</p>
     * @param lts the text size to use
     * @returns this control or the current text size
     */
    textSize(lts) {
        let ts = this._textSize || this._gui.textSize();
        // getter
        if (!Number.isFinite(lts))
            return ts;
        // setter
        lts = Number(lts);
        if (lts != ts) {
            this._textSize = lts;
            let s = this._minControlSize();
            this._w = Math.max(this._w, s.w);
            this._h = Math.max(this._h, s.h);
            this._validateControlBuffers();
            this.invalidateBuffer();
        }
        return this;
    }
    /** @hidden */
    _minControlSize() {
        let b = this._uiBfr;
        let lines = this._lines;
        let ts = this._textSize || this._gui.textSize();
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
        // Calculate minimum length and height of are to hold
        // multiple lines of text
        if (lines.length > 0) {
            if (!b)
                this._validateBuffer();
            b.textSize(ts);
            tbox.w = ts + lines.map(t => b.textWidth(t)).reduce((x, y) => (x > y) ? x : y);
            tbox.h = (lines.length - 1) * b.textLeading(); // + b.textAscent() + b.textDescent(); fix for 0.9.3
            gap += this._gap;
        }
        sw += tbox.w + gap;
        sh = Math.max(tbox.h, sh) + 2 * gap;
        return { w: sw, h: sh };
    }
}
/**
 * <p>This class enables icons to be added to any text control.</p>
 * @hidden
 */
class CvsTextIcon extends CvsText {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
        this._icon = undefined;
        this._iconAlign = this._p.LEFT;
    }
    /**
     * <p>Gets or sets the icon and its alignment relative to any text in the control.</p>
     * <p>Processing constants are used to define the icon alignment.</p>
     * @param icon the icon to use for this control
     * @param align LEFT or RIGHT
     * @returns this control or the current icon
     */
    icon(icon, align) {
        // getter
        if (!icon)
            return this._icon;
        //setter    
        this._icon = icon;
        if (align && (align == this._p.LEFT || align == this._p.RIGHT))
            this._iconAlign = align;
        // If necessary expand the control to surrond text and icon 
        let s = this._minControlSize();
        this._w = Math.max(this._w, s.w);
        this._h = Math.max(this._h, s.h);
        this._validateControlBuffers();
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Sets the icon alignment relative to the text.</p>
     * <p>Processing constants are used to define the text alignment.</p>
     * @param align LEFT or RIGHT
     * @returns this control
     */
    iconAlign(align) {
        if (align && (align == this._p.LEFT || align == this._p.RIGHT)) {
            this._iconAlign = align;
            // If necessary expand the control to surrond text and icon 
            let s = this._minControlSize();
            this._w = Math.max(this._w, s.w);
            this._h = Math.max(this._h, s.h);
            this._validateControlBuffers();
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     *
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
    _minControlSize() {
        let b = this._uiBfr;
        let lines = this._lines;
        let icon = this._icon;
        let ts = this._textSize || this._gui.textSize();
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
        if (icon) {
            sw = icon.width;
            sh = icon.height;
            gap += this._gap;
        }
        // Calculate minimum length and height of are to hold
        // multiple lines of text
        if (lines.length > 0) {
            if (!b)
                this._validateBuffer();
            b.textSize(ts);
            tbox.w = ts + lines.map(t => b.textWidth(t)).reduce((x, y) => (x > y) ? x : y);
            tbox.h = (lines.length - 1) * b.textLeading() + b.textAscent() + b.textDescent();
            gap += this._gap;
        }
        sw += tbox.w + gap;
        sh = Math.max(this._tbox.h, sh) + gap;
        return { w: Math.ceil(sw), h: Math.ceil(sh) };
    }
}
/**
 * <p>Simple label with text and / or icon</p>
 */
class CvsLabel extends CvsTextIcon {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 60, h || 16);
    }
    /** @hidden */ setAction() { return this; }
    /** @hidden */
    _updateControlVisual() {
        let cs = this.SCHEME;
        let cnrs = this.CNRS;
        let ts = this.T_SIZE;
        let tf = this.T_FONT;
        let ty = this.T_STYLE;
        let p = this._p;
        let icon = this._icon, iA = this._iconAlign, tA = this._textAlign;
        let lines = this._lines, gap = this._gap;
        const OPAQUE = cs.C(3, this._alpha);
        const FORE = cs.C(8);
        let uib = this._uiBfr;
        uib.push();
        uib.clear();
        uib.textFont(tf);
        uib.textStyle(ty);
        // Background
        if (this._opaque) {
            uib.noStroke();
            uib.fill(...OPAQUE);
            uib.rect(0, 0, this._w, this._h, ...cnrs);
        }
        if (icon) {
            let px = 0, py;
            switch (iA) {
                case p.LEFT:
                    px = gap;
                    break;
                case p.RIGHT:
                    px = this._w - icon.width - gap;
                    break;
            }
            if (lines.length == 0) // no text so center icon
                px = (this._w - icon.width) / 2;
            py = (this._h - icon.height + gap) / 2;
            uib.image(this._icon, px, py);
        }
        if (lines.length > 0) {
            uib.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            if (icon && iA == p.LEFT)
                x0 += icon.width;
            if (icon && iA == p.RIGHT)
                x1 -= icon.width;
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = uib.textAscent() + (this._h - th) / 2;
            uib.fill(...FORE);
            for (let line of lines) {
                switch (tA) {
                    case p.LEFT:
                        sx = x0;
                        break;
                    case p.CENTER:
                        sx = x0 + (tw - uib.textWidth(line)) / 2;
                        break;
                    case p.RIGHT:
                        sx = x1 - uib.textWidth(line) - gap;
                        break;
                }
                uib.text(line, sx, py);
                py += uib.textLeading();
            }
        }
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    // Hide these methods from typeDoc
    /** @hidden */ tooltip(tiptext) { return this; }
    /** @hidden */ tipTextSize(gtts) { return this; }
}
Object.assign(CvsLabel.prototype, NoTooltip);
//# sourceMappingURL=texticon.js.map