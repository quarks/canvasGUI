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
     * <p>Make this checkbox true</p>
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
     * <p>Make this checkbox false</p>
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
     * 
     * @returns true if this checkbox is selecetd
     */
    isSelected() {
        return this._selected;
    }

    /** @hidden */
    _handleMouse(e: MouseEvent) { // CvsCheckbox
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x;
        let my = this._p.mouseY - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x;
        my = r.y;
        this._pover = this._over;                 // Store previous mouse over state
        this._over = this._whereOver(mx, my);     // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e);
        return false;
    }

    /** @hidden */
    _handleTouch(e: TouchEvent) {
        // e.preventDefault();
        let pos = this.getAbsXY();
        const rect = this._gui._canvas.getBoundingClientRect();
        const t = e.changedTouches[0];
        let mx = t.clientX - rect.left - pos.x;
        let my = t.clientY - rect.top - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x; my = r.y;
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e);
    }

    /** @hidden */
    _processEvent(e: any, ...info) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (this._over > 0) {
                    // Use these to see if there is movement between mosuseDown and mouseUp
                    this._clickAllowed = true;
                    this._dragging = true;
                    this._active = true;
                    this.invalidateBuffer();
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this._active) {
                    if (this._clickAllowed) {
                        this._selected = !this._selected;
                        this.action({ source: this, p5Event: e, selected: this._selected });
                    }
                    this._over = 0;
                    this._clickAllowed = false;
                    this._dragging = false;
                    this._active = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }

    }
    /** @hidden */
    _updateControlVisual() { //  CvsCheckbox
        let ts = this._textSize || this._gui.textSize();
        let cs = this._scheme || this._gui.scheme();
        let b = this._buffer;
        let iconAlign = this._iconAlign;
        let isize = this._p.constrain(Number(ts) * 0.7, 12, 16);
        let textAlign = this._textAlign;
        let lines = this._lines;
        let gap = this._gap;

        const BACK = cs['C_3'];
        const FORE = cs['C_8'];
        const ICON_BG = cs['G_0'];
        const ICON_FG = cs['G_9'];
        const HIGHLIGHT = cs['C_9'];

        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke(); b.fill(BACK);
            b.rect(0, 0, this._w, this._h,
                this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Start with box and tick
        b.push();
        let px = (iconAlign == this._p.RIGHT) ? this._w - gap - isize / 2 : gap + isize / 2;
        b.translate(px, b.height / 2);
        b.stroke(ICON_FG); b.fill(ICON_BG); b.strokeWeight(1.5);
        b.rect(-isize / 2, -isize / 2, isize, isize, 3);
        if (this._selected) {
            b.strokeWeight(2.5);
            b.line(-0.281 * isize, 0, -0.188 * isize, 0.313 * isize);
            b.line(0.270 * isize, -0.27 * isize, -0.188 * isize, 0.313 * isize);
        }
        b.pop();
        if (lines.length > 0) {
            b.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            if (iconAlign == this._p.LEFT) x0 += isize + gap;
            if (iconAlign == this._p.RIGHT) x1 -= isize + gap;
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = b.textAscent() + (this._h - th) / 2;
            b.fill(FORE);
            for (let line of lines) {
                switch (textAlign) {
                    case this._p.LEFT: sx = x0; break;
                    case this._p.CENTER: sx = x0 + (tw - b.textWidth(line)) / 2; break;
                    case this._p.RIGHT: sx = x1 - b.textWidth(line) - gap; break;
                }
                b.text(line, sx, py);
                py += b.textLeading();
            }
        }
        // Mouse over control
        if (this._over > 0) {
            b.stroke(HIGHLIGHT);
            b.strokeWeight(2);
            b.noFill();
            b.rect(1, 1, this._w - 2, this._h - 2,
                this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (!this._enabled) this._disable_hightlight(b, cs, 0, 0, this._w, this._h);
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */
    _minControlSize() { // CvsCheckbox
        let b = this._buffer;
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


