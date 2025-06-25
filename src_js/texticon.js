/**
 * </p>The base class for any control that displays text as part of its
 * visual interface</p>
 *
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
        //console.log(`'${this.name()}'   Size: ${this._w} x ${this._y}   Min size: ${s.w} x ${s.h}`)
        this._w = Math.max(this._w, s.w);
        this._h = Math.max(this._h, s.h);
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
     * <p>Renoves any text that the control might use ti  display itself.</p>
     *
     * @returns this control
     */
    noText() {
        this._lines = [];
        this._tbox = { w: 0, h: 0 };
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Sets or gets the text size.</p>
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
            // If necessary expand the control to surrond text
            let s = this._minControlSize();
            this._w = Math.max(this._w, s.w);
            this._h = Math.max(this._h, s.h);
            this.invalidateBuffer();
        }
        return this;
    }
    /** @hidden */
    _minControlSize() {
        let b = this._buffer;
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
 *
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
     * @param i the icon to use for this control
     * @param align LEFT or RIGHT
     * @returns this control or the current icon
     */
    icon(i, align) {
        // getter
        if (!i)
            return this._icon;
        //setter    
        this._icon = i;
        if (align && (align == this._p.LEFT || align == this._p.RIGHT))
            this._iconAlign = align;
        // If necessary expand the control to surrond text and icon 
        let s = this._minControlSize();
        this._w = Math.max(this._w, s.w);
        this._h = Math.max(this._h, s.h);
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
        let b = this._buffer;
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
        return { w: sw, h: sh };
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
    /** @hidden */
    _updateControlVisual() {
        let ts = this._textSize || this._gui.textSize();
        let cs = this._scheme || this._gui.scheme();
        let b = this._buffer;
        let p = this._p;
        let icon = this._icon;
        let iconAlign = this._iconAlign;
        let textAlign = this._textAlign;
        let lines = this._lines;
        let gap = this._gap;
        const OPAQUE = cs['C_0'];
        const FORE = cs['C_8'];
        b.push();
        b.clear();
        // Background
        if (this._opaque) {
            b.noStroke();
            b.fill(OPAQUE);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (icon) {
            let px = 0, py;
            switch (iconAlign) {
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
            b.image(this._icon, px, py);
        }
        if (lines.length > 0) {
            b.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            if (icon && iconAlign == p.LEFT)
                x0 += icon.width;
            if (icon && iconAlign == p.RIGHT)
                x1 -= icon.width;
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = b.textAscent() + (this._h - th) / 2;
            b.fill(FORE);
            for (let line of lines) {
                switch (textAlign) {
                    case p.LEFT:
                        sx = x0;
                        break;
                    case p.CENTER:
                        sx = x0 + (tw - b.textWidth(line)) / 2;
                        break;
                    case p.RIGHT:
                        sx = x1 - b.textWidth(line) - gap;
                        break;
                }
                b.text(line, sx, py);
                py += b.textLeading();
            }
        }
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }
}
//# sourceMappingURL=texticon.js.map