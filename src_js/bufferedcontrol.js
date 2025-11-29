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
        this._validateControlBuffers();
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
        pkb.rect(1, 1, this._w - 1, this._h - 1, ...this.CNRS);
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
        b.fill(cs.T(2));
        b.noStroke();
        b.rect(x, y, w, h, ...this.CNRS);
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
}
//# sourceMappingURL=bufferedcontrol.js.map