/**
 * This class supports simple true-false checkbox
 */
class CvsCheckbox extends CvsTextIcon {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 18);
        this._selected = false; // 0
        this._createDefaultIcons();
        this.invalidateBuffer();
    }
    /** @hidden */
    _createDefaultIcons() {
        const s = this._iSize || this._gui._iSize;
        const cs = this.SCHEME;
        const FG = cs.G$(9), BG = cs.G$(0);
        this._icons = [];
        // False
        let ib = new OffscreenCanvas(s, s);
        let ic = ib.getContext('2d');
        ic.fillStyle = FG;
        ic.fillRect(0, 0, s, s);
        ic.fillStyle = BG;
        ic.fillRect(2, 2, s - 4, s - 4);
        this._icons.push(ib);
        // True
        ib = new OffscreenCanvas(s, s);
        ic = ib.getContext('2d');
        ic.fillStyle = FG;
        ic.fillRect(0, 0, s, s);
        ic.fillStyle = BG;
        ic.fillRect(2, 2, s - 4, s - 4);
        ic.beginPath();
        ic.strokeStyle = FG;
        ic.lineWidth = 2.5;
        ic.moveTo(0.2 * s, 0.55 * s);
        ic.lineTo(0.45 * s, 0.75 * s);
        ic.lineTo(0.8 * s, 0.2 * s);
        ic.stroke();
        this._icons.push(ib);
        // Set icon to display
        this._icon = this._icons[Number(this._selected)];
        this.invalidateBuffer();
    }
    /**
     * <p>Sets the icon and its alignment relative to any text in
     * the control.</p>
     * <p>Processing constants are used to define the icon alignment.</p>
     * @param icons array of 2 icons [falseImage, trueImage]
     * @param alignH 'left', 'right' or 'center'
     * @param alignV 'top', 'bottom' or 'center'
     * @returns this control or the current icon
     */
    icons(icons, alignH, alignV) {
        if (Array.isArray(icons) && icons.length >= 2) {
            this._icons = [cvsGuiCanvas(icons[0]), cvsGuiCanvas(icons[1])];
            this._icon = this._icons[Number(this._selected)];
            this.iconAlign(alignH, alignV);
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * <p>If there is no parameter then it returns the size of the default
     * tick-box icon is returned.</p>
     * <p>The default icon will be resized and replace any user defined
     * icons.</p>
     *
     * @param size
     * @returns this control
     */
    iconSize(size) {
        if (!Number.isFinite(size))
            return this._iSize || this._gui._iSize;
        this._iSize = Math.ceil(size);
        this._createDefaultIcons();
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Select this checkbox.</p>
     * @returns this control
     */
    select() {
        if (!this._selected) {
            this._selected = true;
            this._icon = this._icons[Number(this._selected)];
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * <p>Deselect this checkbox.</p>
     * @returns this control
     */
    deselect() {
        if (this._selected) {
            this._selected = false;
            this._icon = this._icons[Number(this._selected)];
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * Get the state of this checkbox.
     * @returns true if this checkbox is selected
     */
    isSelected() {
        return this._selected;
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                // will be set to false if the mouse is dragged
                this._clickAllowed = true;
                this.over = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    if (this._clickAllowed) {
                        this._selected = !this._selected;
                        this._icon = this._icons[Number(this._selected)];
                        this.action({ source: this, event: e, selected: this._selected });
                    }
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
    /** @hidden */
    _updateControlVisual() {
        if (this._textInvalid)
            this._formatText();
        this._updateFaceElements();
        if (this._fitWH)
            this._fitToContent();
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const OPAQUE = cs.C$(3, this._alpha);
        const FORE = cs.C$(8);
        const HIGHLIGHT = cs.C$(9);
        const uic = this._uicContext;
        uic.save();
        uic.font = this._cssFont;
        uic.clearRect(0, 0, this._w, this._h);
        // Background
        if (this._opaque) {
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, this.CNRS);
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
    }
    /** @hidden */
    _updatePickBuffer() {
        let pkc = this._pkcContext;
        let c = this._gui.pickColor(this);
        pkc.clearRect(0, 0, this._w, this._h);
        pkc.save();
        pkc.fillStyle = c.cssColor;
        pkc.beginPath();
        pkc.roundRect(1, 1, this._w - 1, this._h - 1, this.CNRS);
        pkc.fill();
        pkc.restore();
    }
    /** @hidden */ icon(a, b, c) { return this.warn$('icon'); }
}
Object.assign(CvsCheckbox.prototype, PICKABLE);
//# sourceMappingURL=checkbox.js.map