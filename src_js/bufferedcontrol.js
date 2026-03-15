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
class CvsBufferedControl extends CvsControl {
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
        /** @hidden */ this._textInvalid = false;
        this._validateBuffer();
    }
    /**
     * Invalidates display text.
     * If the text or its attributes are changed then the text needs updating
     * at next draw cycle.
     *
     * @returns this control
     * @hidden
     */
    invalidateText() {
        this._textInvalid = true;
        this.invalidateBuffer();
        return this;
    }
    /**
     * Clear the ui buffer
     * @hidden
     */
    _clearUiBuffer() {
        this._uicContext.clearRect(0, 0, this._uicBuffer.width, this._uicBuffer.height);
    }
    /**
     * Clear the pick buffer
     * @hidden
     */
    _clearPickBuffer() {
        this._pkcContext?.clearRect(0, 0, this._pkcBuffer.width, this._pkcBuffer.height);
    }
    /**
     * If this control has changed size then recreate the ui and pick buffers
     * and invalidate the control so it is forced to redraw the buffers on
     * when being rendered'
     * @hidden
     */
    _validateBuffer() {
        if (!this._uicBuffer || this._uicBuffer.width != this._w || this._uicBuffer.height != this._h) {
            this._uicBuffer = new OffscreenCanvas(this._w, this._h);
            this._uicContext = this._uicBuffer.getContext('2d');
            this._uicContext.clearRect(0, 0, this._w, this._h);
            this.invalidateBuffer();
        }
    }
    /** @hidden */
    _draw(guiCtx, pkCtx) {
        // Make sure the buffer exists and the same size as the control
        this._validateBuffer();
        if (this._bufferInvalid)
            this._updateControlVisual();
        guiCtx.save();
        guiCtx.translate(this._x, this._y);
        if (this._visible) {
            let tr = this._orientation.getTransform(this._w, this._h);
            guiCtx.translate(tr.tx, tr.ty);
            guiCtx.rotate(tr.rot);
            guiCtx.drawImage(this._uicBuffer, 0, 0);
            // Draw pick buffer image if enabled
            if (this._pkcBuffer && this._enabled) {
                pkCtx.save();
                pkCtx.setTransform(guiCtx.getTransform());
                pkCtx.drawImage(this._pkcBuffer, 0, 0);
                pkCtx.restore();
            }
        }
        // Display children
        for (let c of this._children)
            if (c._visible)
                c._draw(guiCtx, pkCtx);
        guiCtx.restore();
    }
    /** @hidden */
    _disable_highlight(cs, x, y, w, h) {
        this._uicContext.fillStyle = cs.T$(2);
        this._uicContext.beginPath();
        this._uicContext.roundRect(x, y, w, h, this.CNRS);
        this._uicContext.fill();
    }
    /** @hidden */
    _getUseableFaceRegion() {
        const iH = Math.max(...this.CNRS, 3 * ISET_H);
        return [iH, ISET_V, this._w - 2 * iH, this._h - 2 * ISET_V];
    }
}
const PICKABLE = {
    /**
     * If this control has changed size then recreate the ui and pick buffers
     * and invalidate the control so it is forced to redraw the buffers on
     * when being rendered'
     * @hidden
     */
    _validateBuffer() {
        if (!this._uicBuffer || this._uicBuffer.width != this._w || this._uicBuffer.height != this._h) {
            this._uicBuffer = new OffscreenCanvas(this._w, this._h);
            this._uicContext = this._uicBuffer.getContext('2d');
            this._uicContext.clearRect(0, 0, this._w, this._h);
            this._pkcBuffer = new OffscreenCanvas(this._w, this._h);
            this._pkcContext = this._pkcBuffer.getContext('2d');
            this._pkcContext.clearRect(0, 0, this._w, this._h);
            this.invalidateBuffer();
        }
    }
};
//# sourceMappingURL=bufferedcontrol.js.map