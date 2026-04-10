/**
 * <h2>Clickable button with text and/or icon</h2>
 * <p>The button can be displayed with either text or icon or both on it's
 * face. The text and icon alignment is configurable.</p>
 */
class CvsButton extends CvsTextIcon {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h, true);
        this._enabled = true;
    }
    /** @hidden */
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        if (this._textInvalid)
            this._formatText();
        this._updateFaceElements();
        if (this._fitWH)
            this._fitToContent();
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const BACK = cs.C$(3, this._alpha);
        const FORE = cs.C$(8);
        const HIGHLIGHT = cs.C$(9);
        uic.save();
        uic.font = this._cssFont;
        // Background
        if (this._opaque) {
            uic.fillStyle = BACK;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.fill();
        }
        if (this._icon) {
            uic.save();
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.clip();
            uic.drawImage(this._icon, this._ix, this._iy);
            uic.restore();
        }
        this._renderTextArea(FORE);
        // Mouse over add border highlight
        if (this.isActive || this.over) {
            uic.strokeStyle = HIGHLIGHT;
            uic.lineWidth = 2;
            uic.beginPath();
            uic.roundRect(1, 1, this._w - 2, this._h - 2, cnrs);
            uic.stroke();
        }
        if (!this._enabled)
            this._disable_highlight(cs, 0, 0, this._w, this._h);
        // Update pick buffer before restoring
        this._updatePickBuffer();
        uic.restore();
        // The last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _updatePickBuffer() {
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        let c = this._gui.pickColor(this);
        pkc.save();
        pkc.fillStyle = c.cssColor;
        pkc.beginPath();
        pkc.roundRect(1, 1, this._w - 1, this._h - 1, this.CNRS);
        pkc.fill();
        pkc.restore();
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this._clickAllowed = true; // false if mouse moves
                this.over = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    if (this._clickAllowed)
                        this.action({ source: this, event: e });
                    this._active = false;
                }
                this._clickAllowed = false;
                this.over = false;
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                this.over = (this == over.control);
                this._tooltip?._updateState(enter);
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
}
//# sourceMappingURL=button.js.map