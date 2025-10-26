/**
 * <p>The option group manages a group of option buttons where only one can
 * be selected at any time.</p>
 * <p>The user should <i>not</i> create instances of this class because the library
 * will make them when needed.</p>
 */
class CvsOptionGroup {
    /** @hidden */
    constructor(name) {
        this._name = name;
        this._group = new Set();
    }
    /**
     * Add an option to this group
     * @hidden
     */
    add(option) {
        // If this option is selected then deselect all the existing options  in group
        if (option.isSelected()) {
            for (let opt of this._group) {
                opt._deselect();
            }
        }
        this._group.add(option);
    }
    /**
     * Remove an option to this group
     * @hidden
     */
    remove(option) {
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
 This class represents an option button (aka radio button). These are usually
 grouped together so that only one can be selected at a time.
 ##############################################################################
 */
class CvsOption extends CvsText {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 100, h || 18);
        this._selected = false;
        this._optGroup = null;
        this._iconAlign = this._p.LEFT;
        this._textAlign = this._p.LEFT;
    }
    /**
     * <p>Gets or sets the icon and alignment relative to any text in the control.</p>
     * <p>Processing constants are used to define the icon alignment.</p>
     * @param align LEFT or RIGHT
     * @returns this control or the current icon alignment
     */
    iconAlign(align) {
        if (!align)
            return this._iconAlign;
        if (align == this._p.LEFT || align == this._p.RIGHT) {
            this._iconAlign = align;
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * <p>Make this option true (selected) replacing the previos selection.</p>
     *
     */
    select() {
        let curr = this._optGroup?._prev();
        if (curr) {
            curr._selected = false;
            curr.invalidateBuffer();
        }
        this._selected = true;
        this.invalidateBuffer();
        return this;
    }
    /** @hidden */
    _deselect() {
        this._selected = false;
        return this;
    }
    /**
     *
     * @returns true if this option selected else returns false
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
        this._optGroup = this._gui.getOptionGroup(optGroupName);
        this._optGroup.add(this);
        return this;
    }
    /** @hidden */
    _doEvent(e, x, y, picked) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this.isActive = true;
                this._clickAllowed = true; // false if mouse moves
                this._part = picked.part;
                this.isOver = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    if (this._clickAllowed && !this._selected) {
                        if (this._optGroup) {
                            // If we have an opt group then use it to replace 
                            // old selection with this one
                            this.select();
                            this.action({ source: this, p5Event: e, selected: true });
                        }
                    }
                    this.isActive = false;
                    this._clickAllowed = false;
                    this.isOver = false;
                }
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                this.isOver = (this == picked.control);
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
        let ts = this._textSize || this._gui.textSize();
        let cs = this._scheme || this._gui.scheme();
        let p = this._p;
        let isize = p.constrain(Number(ts) * 0.7, 12, 16);
        let iA = this._iconAlign, tA = this._textAlign;
        let lines = this._lines, gap = this._gap;
        const BACK = cs['C_3'], FORE = cs['C_8'], ICON_BG = cs['G_0'];
        const ICON_FG = cs['G_9'], HIGHLIGHT = cs['C_9'];
        let uib = this._uiBfr;
        uib.push();
        uib.clear();
        // If opaque
        if (this._opaque) {
            uib.noStroke();
            uib.fill(BACK);
            uib.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Start with circle
        uib.push();
        let px = (iA == p.RIGHT) ? this._w - gap - isize / 2 : gap + isize / 2;
        uib.translate(px, uib.height / 2);
        uib.stroke(ICON_FG);
        uib.fill(ICON_BG);
        uib.strokeWeight(1.5);
        uib.ellipse(0, 0, isize, isize);
        if (this._selected) {
            uib.fill(ICON_FG);
            uib.noStroke();
            uib.ellipse(0, 0, isize / 2, isize / 2);
        }
        uib.pop();
        if (lines.length > 0) {
            uib.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            if (iA == p.LEFT)
                x0 += isize + gap;
            if (iA == p.RIGHT)
                x1 -= isize + gap;
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = uib.textAscent() + (this._h - th) / 2;
            uib.fill(FORE);
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
        // Mouse over control
        if (this.isOver) {
            uib.stroke(HIGHLIGHT);
            uib.strokeWeight(2);
            uib.noFill();
            uib.rect(1, 1, this._w - 2, this._h - 2, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (!this._enabled)
            this._disable_hightlight(uib, cs, 0, 0, this._w, this._h);
        this._updateRectControlPB();
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _minControlSize() {
        let b = this._uiBfr;
        let lines = this._lines;
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
        let ts = this._textSize || this._gui.textSize();
        let isize = this._p.constrain(Number(ts) * 0.7, 12, 16);
        // Calculate minimum length and height of are to hold
        // multiple lines of text
        if (lines.length > 0) {
            if (!b)
                this._validateBuffer();
            let ts = this._textSize || this._gui.textSize();
            b.textSize(ts);
            tbox.w = ts + lines.map(t => b.textWidth(t)).reduce((x, y) => (x > y) ? x : y);
            tbox.h = (lines.length - 1) * b.textLeading() + b.textAscent() + b.textDescent();
        }
        sw += tbox.w + gap + isize;
        sh = Math.max(this._tbox.h, isize + gap) + 2 * gap;
        return { w: sw, h: sh };
    }
}
//# sourceMappingURL=option.js.map