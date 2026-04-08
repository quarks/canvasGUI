/**
 * <h2>Clickable 2 state (true / false) button.</h2>
 * <p>The button has optional text and its state can be flipped between true
 * and false by clicking it's face.</p>
 * <p>The standard tick-box icon is provided by default but its size can be
 * changed by the user.</p>
 * <p>The user can also supply their own icons for this control.</p>
 */
class CvsCheckbox extends CvsTextIcon {

    /** @hidden */ protected _selected: boolean;
    /** @hidden */ protected _iSize!: number;


    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x, y, w, h, true);
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
        if (ic) {
            ic.fillStyle = FG;
            ic.fillRect(0, 0, s, s);
            ic.fillStyle = BG;
            ic.fillRect(2, 2, s - 4, s - 4);
        }
        this._icons.push(ib);
        // True
        ib = new OffscreenCanvas(s, s);
        ic = ib.getContext('2d');
        if (ic) {
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
        }
        this._icons.push(ib);
        // Set icon to display
        this._icon = this._icons[Number(this._selected)];
        this.invalidateBuffer();
    }

    /**
     * <p>Replaces the existing icons representing false / true states.</p>
     * <p>The first parameter must be an array of 2 images [falseImage, trueImage]
     * representing the state of the checkbox. It is recomended that the images
     * the same size</p>
     * 
     * If provided the last two paratmeters control the icon alignment within
     * the control. </p>
     * 
     * <p>Processing constants are used to define the icon alignment.</p>
     * @param icons array of 2 icons [falseImage, trueImage]
     * @param alignH 'left', 'right' or 'center'
     * @param alignV 'top', 'bottom' or 'center'
     * @returns this control or the current icon
     */
    icons(icons: Array<cvsIcon>, alignH?: string, alignV?: string): cvsIcon | CvsControl {
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
    iconSize(size: number) {
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
    _doEvent(e: MouseEvent | TouchEvent, x = 0, y = 0, over: any, enter: boolean): any {
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
    _updateControlVisual() { //  CvsCheckbox
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic) return;
        this._clearBuffer(uib, uic);

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

        uic.save();
        uic.font = this._cssFont;
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
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc) return;
        this._clearBuffer(pkb, pkc);
        let c = this._gui.pickColor(this);
        pkc.save();
        pkc.fillStyle = c.cssColor;
        pkc.beginPath();
        pkc.roundRect(1, 1, this._w - 1, this._h - 1, this.CNRS);
        pkc.fill();
        pkc.restore();
    }

    /** @hidden */ icon(a: any, b: any, c: any) { return this.warn$('icon'); }
}
