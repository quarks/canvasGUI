/**
 * <p>This class is to create simple clickable buttons with text and/or icons
 * on its face.</p>
 */
class CvsButton extends CvsTextIcon {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
        this._enabled = true;
    }
    /** @hidden */
    _updateControlVisual() {
        if (this._textInvalid)
            this._formatText();
        this._updateFaceElements();
        if (this._fitWH)
            this._fitToContent();
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        // const font = this.cssFont;
        const BACK = cs.C$(3, this._alpha);
        const FORE = cs.C$(8);
        const HIGHLIGHT = cs.C$(9);
        let uic = this._uicContext;
        this._clearUiBuffer();
        uic.save();
        uic.font = this._cssFont;
        // Background
        if (this._opaque) {
            uic.fillStyle = BACK;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.fill();
        }
        if (this._icon)
            uic.drawImage(this._icon, this._ix, this._iy);
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
        // but if this is a pane-tab then must validate the tabs
        // if (this._parent instanceof CvsPane) this._parent.validateTabs();
    }
    /** @hidden */
    _updatePickBuffer() {
        let pkc = this._pkcContext;
        let c = this._gui.pickColor(this);
        this._clearPickBuffer();
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
Object.assign(CvsButton.prototype, PICKABLE);
//# sourceMappingURL=button.js.map