/**
 * <p>This class represents a slider with 2 draggable thumbs to 
 * define a value within user defined limits.</p>
 * <p>Major and minor tick marks can be added to the bar and supports 
 * stick-to-ticks if wanted.</p>
 */
class CvsRanger extends CvsSlider {

    /** @hidden */ protected _t: Array<number> = [0.25, 0.75];
    /** @hidden */ protected _tIdx: number = -1;

    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x || 0, y || 0, w || 100, h || 20);
        this._t = [0.25, 0.75];
        this._tIdx = -1;
        this._limit0 = 0;
        this._limit1 = 1;
        this._opaque = false;
    }

    /**
     * <p>Sets or gets the low and high thumb values for this control. If both 
     * parameters are within the ranger limits then they are accepted and the 
     * thumbs are moved to the correct position.</p>
     * <p>If either of the parameters are invalid then they are ignored and 
     * the method returns the current range low and high values.</p>
     * @param v0 low value
     * @param v1 high value
     * @returns this control or the low/high values
     */
    range(v0?: number, v1?: number): CvsControl | Object {
        if (Number.isFinite(v0) && Number.isFinite(v1)) { // If two numbers then
            let t0 = this._norm01(Math.min(v0, v1));
            let t1 = this._norm01(Math.max(v0, v1));
            if (t0 >= 0 && t0 <= 1 && t1 >= 0 && t1 <= 1) {
                this._bufferInvalid = (this._t[0] != t0) || (this._t[1] != t1);
                this._t[0] = t0; this._t[1] = t1;
                return this;
            }
        }
        // Invalid parameters
        return { low: this._t2v(this._t[0]), high: this._t2v(this._t[1]) };
    }

    /**
     * @returns the low value of the range
     */
    low(): number {
        return this._t2v(this._t[0]);
    }

    /**
     * @returns the high value of the range
     */
    high(): number {
        return this._t2v(this._t[1]);
    }

    /**
     * If both parameter values are within the ranger's limits it will move
     * the thumbs to the appropriate positions. If no parameters are passed 
     * or if either is outside the ranger's limits this methods returns the
     * an array containing the current ranger values.
     * @param v0 value to set the first thumbs.
     * @param v1 value to set the second thumbs.
     * @returns an array of the current values or this ranger object.
     */
    values(v0?: number, v1?: number): CvsControl | Array<number> {
        function inLimits(v: number) {
            return ((v - l0) * (v - l1) <= 0);
        }
        let [l0, l1] = [this._limit0, this._limit1]
        if (Number.isFinite(v0) && Number.isFinite(v1)) {
            if (inLimits(v0) && inLimits(v1)) {
                this._t[0] = this._norm01(Math.min(v0, v1));
                this._t[1] = this._norm01(Math.max(v0, v1));
                this.invalidateBuffer();
                return this;
            }
        }
        return [this._t2v(this._t[0]), this._t2v(this._t[1])];
    }

    /** @hidden */
    _doEvent(e: MouseEvent | TouchEvent, x = 0, y = 0, over: any, enter: boolean): CvsControl {
        let absPos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0 || over.part == 1) { // A thumb
                    this._active = true;
                    this._tIdx = over.part;  // Which thumb is the mouse over
                    this.over = true;
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    let t0 = Math.min(this._t[0], this._t[1]);
                    let t1 = Math.max(this._t[0], this._t[1]);
                    this._t[0] = t0; this._t[1] = t1; this._tIdx = -1;
                    this.action({
                        source: this, event: e, low: this._t2v(t0), high: this._t2v(t1), final: true
                    });
                    this._active = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    let t01 = this._norm01(mx - this._inset, 0, this._w - 2 * this._inset);
                    if (this._s2ticks)
                        t01 = this._nearestTickT(t01);
                    if (this._t[this._tIdx] != t01) {
                        this._t[this._tIdx] = t01;
                        let t0 = Math.min(this._t[0], this._t[1]);
                        let t1 = Math.max(this._t[0], this._t[1]);
                        this.action({
                            source: this, event: e, low: this._t2v(t0), high: this._t2v(t1), final: false
                        });
                    }
                }
                this.over = (this == over.control && (over.part == 0 || over.part == 1));
                this._tooltip?._updateState(enter);
                this.invalidateBuffer();
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }

    /** @hidden */
    _updateControlVisual() { // CvsRanger
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const [tLen, tWgt, tbSize] =
            [this._w - 2 * this._inset, this._trackWeight, this._thumbSize];
        const [majT, minT] = [this._majorTickSize, this._minorTickSize];

        const OPAQUE = cs.C$(3, this._alpha);
        const TICKS = cs.G$(7);
        const UNUSED_TRACK = cs.G$(3);
        const USED_TRACK = cs.G$(1);
        const HIGHLIGHT = cs.C$(9);
        const THUMB = cs.C$(6);

        const uic = this._uicContext;
        this._clearUiBuffer();
        this._clearPickBuffer();

        uic.save();
        if (this._opaque) {
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.fill();
        }
        // Now translate to track left edge - track centre
        uic.translate(this._inset, Math.round(this._h / 2));
        // Now draw ticks
        uic.strokeStyle = TICKS;
        uic.lineWidth = 1;
        let dT: number, n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            dT = tLen / n;
            uic.beginPath();
            for (let i = 0; i <= n; i++) { // minor ticks
                let tickX = i * dT;
                uic.moveTo(tickX, -minT);
                uic.lineTo(tickX, minT);
            }
            uic.stroke();
        }
        n = this._majorTicks;
        if (n >= 2) {
            dT = tLen / this._majorTicks;
            uic.beginPath();
            for (let i = 0; i <= n; i++) {  // major ticks
                let tickX = i * dT;
                uic.moveTo(tickX, -majT);
                uic.lineTo(tickX, majT);
            }
            uic.stroke();
        }
        // draw unused track
        uic.fillStyle = UNUSED_TRACK;
        uic.fillRect(0, -tWgt / 2, tLen, tWgt);
        // draw used track
        const tx0 = tLen * Math.min(this._t[0], this._t[1]);
        const tx1 = tLen * Math.max(this._t[0], this._t[1]);
        uic.fillStyle = USED_TRACK;
        uic.fillRect(tx0, -tWgt / 2, tx1 - tx0, tWgt);
        // Draw thumbs
        for (let tnbr = 0; tnbr < 2; tnbr++) {
            uic.beginPath();
            uic.roundRect(this._t[tnbr] * tLen - tbSize / 2,
                -tbSize / 2, tbSize, tbSize, this._thumbCnrs);
            uic.fillStyle = THUMB;
            uic.fill()
            if ((this.isActive || this.over)) {
                uic.lineWidth = 2;
                uic.strokeStyle = HIGHLIGHT;
                uic.stroke();
            }
        }
        this._updatePickBuffer();
        uic.restore();
        if (!this._enabled)
            this._disable_highlight(cs, 0, 0, this._w, this._h);

        this._bufferInvalid = false; // Finally mark as valid
    }

    /** @hidden */
    _updatePickBuffer() { //tx0?: number, tx1?: number) {
        const pkc = this._pkcContext;

        const [tLen, tWgt, tbSize] =
            [this._w - 2 * this._inset, this._trackWeight, this._thumbSize];
        const tx0 = Math.round(tLen * Math.min(this._t[0], this._t[1]));
        const tx1 = Math.round(tLen * Math.max(this._t[0], this._t[1]));
        const c = this._gui.pickColor(this);

        pkc.save();
        // Now translate to track left edge - track centre
        pkc.translate(this._inset, Math.round(this._h / 2));
        // Track
        pkc.fillStyle = _rgb$(c.r, c.g, c.b + 5);
        pkc.fillRect(0, -tWgt / 2, tLen, tWgt);
        pkc.fillStyle = _rgb$(c.r, c.g, c.b + 6);
        pkc.fillRect(tx0, -tWgt / 2, tx1 - tx0, tWgt);
        // Thumb
        pkc.fillStyle = c.cssColor;
        pkc.fillRect(tx0 - tbSize / 2, -tbSize / 2, tbSize, tbSize);
        pkc.fillStyle = _rgb$(c.r, c.g, c.b + 1);
        pkc.fillRect(tx1 - tbSize / 2, -tbSize / 2, tbSize, tbSize);
        pkc.restore();
    }

}


Object.assign(CvsRanger.prototype, PICKABLE);