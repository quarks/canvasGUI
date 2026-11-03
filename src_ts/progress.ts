/**
 * <h2>A progress bar showing what proportion of a user-defined task has
 * been completed.</h2>
 * 
 * <p>The most likely scenario for using this control would be complex or
 * lengthy tasks involving Promises or Web Workers. </p>
 */
class CvsProgress extends CvsTextIcon {

    /** @hidden */ protected _t: number;

    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x, y, w, h, false);
        this._t = 0;
    }

    /**
     * <p>The first parmeter is required and indictaes the proportion of the
     * task completed so far. The value supplied will be constrained to the
     * range 0.0 to 1.0</p>
     * <p>The second paremeter is optional and is the text to appear on the
     * progress bar. The user can change the text as the task is progressed
     * and an empty string can be used to leave the bar unadorned.</p>
     * <p>If there is no second parameter (undefined) then the bar will show
     * the percentage progress based on the first parameter.</p> 
     * 
     * @param t  progress made so far (0.0 to 1.0)
     * @param desc the text to appear on the progress bar
     * @returns this control
     */
    progress(t: number, desc?: string) {
        t = _constrain(t, 0, 1);
        desc = desc === undefined ? `${Math.round(t * 100)}%` : desc;
        if (this._t != t || desc !== this._tLines[0].txt) {
            this._t = t;
            super.text(desc);
            this.invalidateBuffer();
        }
        return this;
    }

    /**
     * <p>Reset the progress meter to its initial state.<p>
     * 
     * @returns this control
     */
    reset() {
        this._t = 0;
        super.text('');
        this.invalidateBuffer();
        return this;
    }

    /** @hidden */
    _updateControlVisual() { // CvsProgress
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        this._clearBuffer(uib, uic!);

        if (this._textInvalid)
            this._formatText();
        this._updateFaceElements();

        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const BACK = cs.C$(1);
        const FORE = cs.C$(4);
        const TEXT = cs.C$(8);

        const OPAQUE = cs.C$(3, this._alpha);

        const [w, h] = [this._w, this._h];
        let [tx, ty, tw, th] = this._tArea;

        uic!.save();
        uic!.font = this._cssFont;
        // Background
        if (this._opaque) {
            uic!.fillStyle = OPAQUE;
            uic!.beginPath();
            uic!.roundRect(0, 0, w, h, cnrs);
            uic!.fill();
        }
        if (this._icon)
            uic!.drawImage(this._icon, this._ix, this._iy);

        uic!.fillStyle = BACK;
        uic!.beginPath();
        uic!.roundRect(tx, ty, tw, th, cnrs);
        uic!.fill();

        tx += 3; tw -= 6; ty += 3; th -= 6;

        const pw = _map(this._t, 0, 1, 0, tw);

        // console.log(`tx ${tx}  ty ${ty}  tw ${tw}  th ${th}     p ${p}  `);

        uic!.fillStyle = FORE;
        uic!.beginPath();
        uic!.roundRect(tx, ty, pw, th, cnrs);
        uic!.fill();

        this._renderTextArea(TEXT);
        uic!.restore();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */ get isEnabled() { return this.warn$('isEnabled') }
    /** @hidden */ setAction() { return this.warn$('setAction') }
    /** @hidden */ text(a: any) { return this.warn$('text'); }
    /** @hidden */ tooltip(a: any) { return this.warn$('tooltip'); }
    /** @hidden */ tipTextSize(a: any) { return this.warn$('tipTextSize'); }
    /** @hidden */ enable() { return this.warn$('enable'); }
    /** @hidden */ disable() { return this.warn$('disable'); }
    /** @hidden */ shrink() { return this.warn$('shrink'); }

}

