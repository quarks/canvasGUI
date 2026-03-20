/**
 * <p>The option group manages a group of option buttons where only one can
 * be selected at any time.</p>
 * <p>The user should <i>not</i> create instances of this class because the library
 * will make them when needed.</p>
 * @hidden
 */
class CvsOptionGroup {
    /** @hidden */
    constructor(name) {
        this._name = name;
        this._group = new Set();
    }
    /**
     * Add an option to this group.
     * @hidden
     */
    _add(option) {
        // If this option is selected then deselect all the existing options in group
        if (option.isSelected())
            for (let opt of this._group)
                opt._deselect();
        this._group.add(option);
    }
    /**
     * Remove an option to this group
     * @hidden
     */
    _remove(option) {
        this._group.delete(option);
    }
    /**
     * @hidden
     * @returns the currently selected option which will be deselected
     */
    _prev() {
        let prev = undefined;
        for (let opt of this._group)
            if (opt.isSelected()) {
                prev = opt;
                break;
            }
        return prev;
    }
}
/*
 ##############################################################################
 CvsOption
 ##############################################################################
 */
/**
 * This class represents an option button (aka radio button). These are usually
 * grouped together so that only one can be selected at a time.
 */
class CvsOption extends CvsTextIcon {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 100, h || 18);
        this._selected = false; // 0
        this._createDefaultIcons();
        this.invalidateBuffer();
        this._optGroup = null;
    }
    /** @hidden */
    _createDefaultIcons() {
        const s = this._iSize || this._gui._iSize;
        const cs = this.SCHEME;
        const FG = cs.G$(9), BG = cs.G$(0);
        this._icons = [];
        const ctr = 0.5 + s / 2, r0 = ctr - 2, r1 = 0.5 * r0;
        // False
        let ib = new OffscreenCanvas(s, s);
        let ic = ib.getContext('2d');
        ic.clearRect(0, 0, s, s);
        ic.fillStyle = BG;
        ic.strokeStyle = FG;
        ic.lineWidth = 2;
        ic.beginPath();
        ic.arc(ctr, ctr, r0, 0, 2 * Math.PI);
        ic.fill();
        ic.stroke();
        this._icons.push(ib);
        // True
        ib = new OffscreenCanvas(s, s);
        ic = ib.getContext('2d');
        ic.clearRect(0, 0, s, s);
        ic.fillStyle = BG;
        ic.strokeStyle = FG;
        ic.lineWidth = 2;
        ic.beginPath();
        ic.arc(ctr, ctr, r0, 0, 2 * Math.PI);
        ic.fill();
        ic.stroke();
        ic.fillStyle = FG;
        ic.beginPath();
        ic.arc(ctr, ctr, r1, 0, 2 * Math.PI);
        ic.fill();
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
     * radio-button icon is returned.</p>
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
     * <p>Select this option, replacing the previous selection.</p>
     * @returns this control
     */
    select() {
        let curr = this._optGroup?._prev();
        if (curr) {
            curr._selected = false;
            curr._icon = curr._icons[0];
            curr.invalidateBuffer();
        }
        this._selected = true;
        this._icon = this._icons[1];
        this.invalidateBuffer();
        return this;
    }
    /** @hidden */
    _deselect() {
        this._selected = false;
        this._icon = this._icons[0];
        return this;
    }
    /**
     * Get the state of this option button
     * @returns true if this option selected
     */
    isSelected() {
        return this._selected;
    }
    /**
     * <p>Add this option to a named option-group.</p>
     * <p>If the group doesn't exist then it will be created.</p>
     * @returns this control
     */
    group(optGroupName) {
        this._optGroup = this._gui.getOptionGroup(optGroupName);
        this._optGroup._add(this);
        return this;
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
                    if (this._clickAllowed && !this._selected) {
                        if (this._optGroup) {
                            // If we have an option group then use it to  
                            // replace old selection with this one
                            this.select();
                            this._icon = this._icons[Number(this._selected)];
                            this.action({ source: this, event: e, selected: true });
                        }
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
Object.assign(CvsOption.prototype, PICKABLE);
//# sourceMappingURL=option.js.map