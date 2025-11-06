/**
 * This class supports simple true-false checkbox
 */
class CvsCheckbox extends CvsText {

    protected _selected: boolean;
    protected _iconAlign: number;
    protected _icon: p5.Graphics;

    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x || 0, y || 0, w || 80, h || 18);
        this._selected = false;
        this._iconAlign = this._p.LEFT;
        this._textAlign = this._p.LEFT;
    }

    /**
     * <p>Gets or sets the icon and alignment relative to any text in the control.</p>
     * <p>Processing constants are used to define the icon alignment.</p>
     * @param align LEFT or RIGHT
     * @returns this control or the current icon alignment
     */
    iconAlign(align?: number) {
        if (!align)
            return this._iconAlign;
        if (align == this._p.LEFT || align == this._p.RIGHT) {
            this._iconAlign = align;
            this.invalidateBuffer();
        }
        return this;
    }

    /**
     * <p>Select this checkbox making it 'true'</p>
     * @returns this control
     */
    select() {
        if (!this._selected) {
            this._selected = true;
            this.invalidateBuffer();
        }
        return this;
    }

    /**
     * <p>Deelect this checkbox making it 'false'</p>
     * @returns this control
     */
    deselect() {
        if (this._selected) {
            this._selected = false;
            this.invalidateBuffer();
        }
        return this;
    }

    /**
     * Get the state of the checkbox.
     * @returns true if this checkbox is selecd
     */
    isSelected() {
        return this._selected;
    }

    /** @hidden */
    _doEvent(e: MouseEvent | TouchEvent, x = 0, y = 0, over: any, enter: boolean): CvsBaseControl {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                // will be set to false if the mouse is dragged
                this._clickAllowed = true;
                this.isOver = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    if (this._clickAllowed) {
                        this._selected = !this._selected;
                        this.action({ source: this, p5Event: e, selected: this._selected });
                    }
                }
                this._active = false;
                this._clickAllowed = false;
                this.isOver = false;
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                this.isOver = (this == over.control);
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
    _updateControlVisual() { //  CvsCheckbox
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
        if (this._opaque) {
            uib.noStroke(); uib.fill(BACK);
            uib.rect(0, 0, this._w, this._h,
                this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Start with box and tick
        uib.push();
        let px = (iA == p.RIGHT) ? this._w - gap - isize / 2 : gap + isize / 2;
        uib.translate(px, uib.height / 2);
        uib.stroke(ICON_FG); uib.fill(ICON_BG); uib.strokeWeight(1.5);
        uib.rect(-isize / 2, -isize / 2, isize, isize, 3);
        if (this._selected) {
            uib.strokeWeight(2.5);
            uib.line(-0.281 * isize, 0, -0.188 * isize, 0.313 * isize);
            uib.line(0.270 * isize, -0.27 * isize, -0.188 * isize, 0.313 * isize);
        }
        uib.pop();
        if (lines.length > 0) {
            uib.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            if (iA == p.LEFT) x0 += isize + gap;
            if (iA == p.RIGHT) x1 -= isize + gap;
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = uib.textAscent() + (this._h - th) / 2;
            uib.fill(FORE);
            for (let line of lines) {
                switch (tA) {
                    case p.LEFT: sx = x0; break;
                    case p.CENTER: sx = x0 + (tw - uib.textWidth(line)) / 2; break;
                    case p.RIGHT: sx = x1 - uib.textWidth(line) - gap; break;
                }
                uib.text(line, sx, py);
                py += uib.textLeading();
            }
        }
        // Mouse over control
        if (this._isOver) {
            uib.stroke(HIGHLIGHT);
            uib.strokeWeight(2);
            uib.noFill();
            uib.rect(1, 1, this._w - 2, this._h - 2,
                this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (!this._enabled)
            this._disable_hightlight(uib, cs, 0, 0, this._w, this._h);
        // Update pick buffer before restoring
        this._updateRectControlPB();
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */
    _minControlSize() { // CvsCheckbox
        let b = this._uiBfr;
        let lines = this._lines;
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
        let ts = this._textSize || this._gui.textSize();
        let isize = this._p.constrain(Number(ts) * 0.7, 12, 16);
        // Calculate minimum length and height of are to hold
        // multiple lines of text
        if (lines.length > 0) {
            if (!b) this._validateBuffer();
            let ts = this._textSize || this._gui.textSize();
            b.textSize(ts);
            tbox.w = ts + lines.map(t => b.textWidth(t)).reduce((x, y) => (x > y) ? x : y);
            tbox.h = (lines.length - 1) * b.textLeading() + b.textAscent() + b.textDescent();
            //gap += this._gap;
        }
        sw += tbox.w + gap + isize;
        sh = Math.max(this._tbox.h, isize + gap) + 2 * gap;
        return { w: sw, h: sh };
    }

}
