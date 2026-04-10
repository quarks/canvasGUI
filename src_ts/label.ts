/**
 * <h2>A label defines a rectangular control with text and/or icon</h2>
 * <p>The label can be displayed with either text or icon or both on it's
 * face. The text and icon alignment is configurable.</p>
 */
class CvsLabel extends CvsTextIcon {

    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x, y, w, h, false);
    }

    /** @hidden */
    _updateControlVisual() { // CvsLabel
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

        uic.save();
        uic.font = this._cssFont;
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
        uic.restore();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */ get isEnabled() { return this.warn$('isEnabled') }
    /** @hidden */ setAction() { return this.warn$('setAction') }
    /** @hidden */ tooltip(a: any) { return this.warn$('tooltip'); }
    /** @hidden */ tipTextSize(a: any) { return this.warn$('tipTextSize'); }
    /** @hidden */ enable() { return this.warn$('enable'); }
    /** @hidden */ disable() { return this.warn$('disable'); }

}

