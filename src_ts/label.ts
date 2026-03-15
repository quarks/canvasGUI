/**
 * <p>Simple label with text and / or icon</p>
 */
class CvsLabel extends CvsTextIcon {

    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x || 0, y || 0, w || 60, h || 16);
    }

    /** @hidden */
    _updateControlVisual() { // CvsLabel
        if (this._textInvalid)
            this._formatText();
        this._updateFaceElements();
        if (this._fitWH)
            this._fitToContent();

        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const OPAQUE = cs.C$(3, this._alpha);
        const FORE = cs.C$(8);

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
        uic.restore();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */ get isEnabled() { return this.warn$('isEnabled') }

    /** @hidden */ setAction() { return this.warn$('setAction') }

    /** @hidden */ tooltip(a) { return this.warn$('tooltip'); }
    /** @hidden */ tipTextSize(a) { return this.warn$('tipTextSize'); }
    /** @hidden */ enable() { return this.warn$('enable'); }
    /** @hidden */ disable() { return this.warn$('disable'); }

}

