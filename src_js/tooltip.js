/**
 * <p>A tooltip is a simply text hint that appears near to a control with the
 * mouse over it.</p>
 * <p>The tooltip's relative position to the control is automatically set to
 * make sure it is visible inside the canvas area.</p>
 * @hidden
 */
class CvsTooltip extends CvsText {
    /** @hidden */
    constructor(gui, name) {
        super(gui, name);
        this._gap = 1;
        this._visible = false;
        this._tSize = 12;
        this.invalidateText();
    }
    //  Changing the text or text size should update the control size
    /**
     * <p>Sets the text to be displayed in the tooltip.</p>
     * <p>Processing constants are used to define the alignment.</p>
     * @param text the text to display
     * @returns this control
     */
    text(text, alignH, alignV) {
        if (!text)
            return this._tLines.map(line => line.txt).join('\n');
        super.text(text);
        this.shrink(1, 1);
        this.invalidateText();
        return this;
    }
    /** @hidden */
    show(cascade) { return this; }
    /** @hidden */
    hide(cascade) { return this; }
    /** @hidden */
    _updateState(enter) {
        if (enter && !this._active) {
            this._active = true;
            this._visible = true;
            setTimeout(() => { this._visible = false; }, this._gui._show_time);
            setTimeout(() => { this._active = false; }, this._gui._repeat_time);
        }
    }
    /** @hidden */
    _validatePosition() {
        let p = this._parent;
        let { x: px, y: py } = p.getAbsXY();
        let [pw, ph] = p.orientation().wh(p.w, p.h);
        this._x = 0, this._y = -this._h;
        if (py + this._y < 0)
            this._y += this._h + ph;
        if (px + this._x + this._w > this._gui.canvasWidth)
            this._x -= this._w - pw;
    }
    /** @hidden */
    _updateControlVisual() {
        if (this._textInvalid)
            this._formatText();
        this._updateFaceElements();
        if (this._fitWH) {
            this._fitToContent();
            this._validatePosition();
        }
        const cs = this._parent.scheme() || this._gui.scheme();
        const BACK = cs.C$(3);
        const FORE = cs.C$(9);
        const uic = this._uicContext;
        this._clearUiBuffer();
        uic.save();
        uic.font = this._cssFont;
        uic.strokeStyle = FORE;
        uic.fillStyle = BACK;
        uic.fillRect(0, 0, this._w - 1, this._h - 1);
        uic.strokeRect(0, 0, this._w - 1, this._h - 1);
        this._renderTextArea(FORE);
        uic.restore();
        this._bufferInvalid = false; // buffer is now valid
    }
}
//# sourceMappingURL=tooltip.js.map