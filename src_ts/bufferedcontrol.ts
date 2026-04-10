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
abstract class CvsBufferedControl extends CvsControl {

    /** @hidden */ protected _uicBuffer!: OffscreenCanvas;
    /** @hidden */ protected _pkcBuffer?: OffscreenCanvas;

    /** @hidden */ protected _textInvalid = false;

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
    constructor(gui: GUI, id: string, x: number, y: number, w: number, h: number, pickable: boolean = false) {
        super(gui, id, x, y, w, h, pickable);
        this._createBuffer = pickable ? this._createUIandPKbuffer : this._createUIbuffer;
        this._createBuffer(w, h);
        this.invalidateBuffer();
    }

    /** @hidden */
    _createBuffer(w: number, h: number) { }

    /**
     * Create the UI buffer only
     * @param w width
     * @param h height
     * @hidden
     */
    _createUIbuffer(w: number, h: number) {
        this._uicBuffer = new OffscreenCanvas(w, h);
        this._uicBuffer.getContext('2d')?.clearRect(0, 0, w, h);
        this.invalidateBuffer();
    }

    /**
     * Dreate both the UI and PK buffers
     * @param w width
     * @param h height
     * @hidden
     */
    _createUIandPKbuffer(w: number, h: number) {
        this._uicBuffer = new OffscreenCanvas(w, h);
        this._uicBuffer.getContext('2d')?.clearRect(0, 0, w, h);
        this._pkcBuffer = new OffscreenCanvas(w, h);
        this._pkcBuffer.getContext('2d')?.clearRect(0, 0, w, h);
        this.invalidateBuffer();
    }

    /**
     * @param buff the buffer to clear
     * @param ctx the buffers 2d context
     * @hidden
     */
    _clearBuffer(buff?: OffscreenCanvas, ctx?: OffscreenCanvasRenderingContext2D) {
        if (buff && ctx)
            ctx.clearRect(0, 0, buff.width, buff.height);
    }

    /**
     * If this control has changed size then recreate the ui buffers
     * and invalidate the control so it is forced to recreate the buffer on
     * when being rendered.
     * @hidden
     */
    _validateBuffer(w = this._uicBuffer.width, h = this._uicBuffer.height) {
        if (this._uicBuffer.width != w || this._uicBuffer.height != h)
            this._createBuffer(w, h);
    }

    /**
     * Test function to show existing puffers
     * @hidden
     */
    get bufferStatus() { return { ui: Boolean(this._uicBuffer), pk: Boolean(this._pkcBuffer) } }

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

    /** @hidden */
    _draw(guiCtx: OffscreenCanvasRenderingContext2D, pkCtx: OffscreenCanvasRenderingContext2D) {
        // Make sure the buffer exists and the same size as the control
        this._validateBuffer(this._w, this._h);
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
            if (c._visible) c._draw(guiCtx, pkCtx);
        guiCtx.restore();
    }

    /** @hidden */
    protected _disable_highlight(cs: ColorScheme, x: number, y: number, w: number, h: number) {
        const uic = this._uicBuffer.getContext('2d');
        if (uic) {
            uic.fillStyle = cs.T$(2);
            uic.beginPath();
            uic.roundRect(x, y, w, h, this.CNRS);
            uic.fill();
        }
    }

    /** @hidden */
    protected _getUseableFaceRegion() {
        const iH = Math.max(...this.CNRS, 3 * ISET_H);
        return [iH, ISET_V, this._w - 2 * iH, this._h - 2 * ISET_V];
    }
}
