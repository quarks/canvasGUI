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
class CvsBufferedControl extends CvsBaseControl {
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
    constructor(gui, id, x, y, w, h) {
        super(gui, id, x, y, w, h);
        /** @hidden */ this._tooltip = undefined;
        /** @hidden */ this._isOver = false;
        this._validateControlBuffers();
        this._c = this._gui.corners();
    }
    /** @hidden */
    get isOver() { return this._isOver; }
    /** @hidden */
    set isOver(b) {
        if (b != this._isOver) {
            this._isOver = b;
            this.invalidateBuffer();
        }
    }
    /**
     * Make sure we have a ui buffer and a pick buffer of the correct size
     * for this control.
     * @hidden
     */
    _validateControlBuffers() {
        if (!this._uiBfr || this._uiBfr.width != this._w || this._uiBfr.height != this._h) {
            this._uiBfr = this._p.createGraphics(this._w, this._h);
            this._uiBfr.pixelDensity(2);
            this._uiBfr.clear();
            this._pkBfr = this._p.createGraphics(this._w, this._h);
            this._pkBfr.pixelDensity(1);
            this._pkBfr.clear();
        }
    }
    /**
     * <p>This method ensures we have a buffer of the correct size for the control</p>
     * @hidden
     */
    _validateBuffer() {
        let b = this._uiBfr;
        if (b.width != this._w || b.height != this._h) {
            this._uiBfr = this._p.createGraphics(this._w, this._h);
            this.invalidateBuffer(); // Force a redraw of the buffer
        }
        if (this._bufferInvalid) {
            this._updateControlVisual();
            this._bufferInvalid = false;
        }
    }
    /**
     * Update rectangular controls using full buffer i.e.
     * Button, Option, Checkbox, Textfield
     * @hidden
     */
    _updateRectControlPB() {
        let pkb = this._pkBfr;
        pkb.clear();
        let c = this._gui.pickColor(this);
        pkb.noStroke();
        pkb.fill(c.r, c.g, c.b);
        pkb.rect(1, 1, this._w - 1, this._h - 1, ...this._c);
    }
    /**
     *
     * @param uib ui overlay buffer
     * @param pkb picker buffer
     * @hidden
     */
    _draw(uib, pkb) {
        this._validateBuffer();
        uib.push();
        uib.translate(this._x, this._y);
        if (this._visible) {
            let tr = this._orientation.getTransform(this._w, this._h);
            uib.translate(tr.tx, tr.ty);
            uib.rotate(tr.rot);
            uib.image(this._uiBfr, 0, 0);
            // Draw pick buffer image if enabled
            if (this._enabled) {
                pkb.drawingContext.setTransform(uib.drawingContext.getTransform());
                pkb.image(this._pkBfr, 0, 0);
            }
        }
        // Display children
        for (let c of this._children)
            if (c._visible)
                c._draw(uib, pkb);
        uib.pop();
    }
    /** @hidden */
    _disable_hightlight(b, cs, x, y, w, h) {
        b.fill(cs.T(5));
        b.noStroke();
        b.rect(x, y, w, h, ...this._c);
    }
    /**
     * <p>Shrink the control to fit contents.</p>
     * <p>To shrink on one dimension only pass either 'w' (width) or 'h'
     * (height) to indicate which dimmension to shrink</p>
     * @param dim the dimension to shrink
     * @returns this control
     */
    shrink(dim) {
        let s = this._minControlSize();
        switch (dim) {
            case 'w':
                this._w = s.w;
                break;
            case 'h':
                this._h = s.h;
                break;
            default:
                this._w = s.w;
                this._h = s.h;
        }
        this._validateControlBuffers();
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Set or get the corner radii used for this control</p>
     * @param c an array of 4 corner radii
     * @returns an array with the 4 corner radii
     */
    corners(c) {
        if (Array.isArray(c) && c.length == 4) {
            this._c = [...c];
            return this;
        }
        return [...this._c];
    }
    /**
     * Create a tooltip for this control
     *
     * @param tiptext the text to appear in the tooltip
     * @param duration how long the tip remains visible (milliseconds)
     * @returns this control
     */
    tooltip(tiptext) {
        let tt = this._gui.__tooltip(this._id + '.tooltip')
            .text(tiptext)
            .shrink();
        this.addChild(tt);
        if (tt instanceof CvsTooltip) {
            tt._validatePosition();
            this._tooltip = tt;
        }
        return this;
    }
    /**
     * Sets the size of the text to use in the tooltip
     * @param {number} tsize text size for this tooltip
     */
    tipTextSize(tsize) {
        if (this._tooltip && tsize && tsize > 0)
            this._tooltip.textSize(tsize);
        return this;
    }
}
//# sourceMappingURL=bufferedcontrol.js.map