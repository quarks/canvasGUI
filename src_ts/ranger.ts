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
    range(v0?: number, v1?: number): CvsBaseControl | Object {
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
    values(v0?: number, v1?: number): CvsBaseControl | Array<number> {
        function inLimits(v: number) {
            return ((v - l0) * (v - l1) <= 0);
        }
        let [l0, l1] = [this._limit0, this._limit1]
        if (Number.isFinite(v0) && Number.isFinite(v1)) {
            if (inLimits(v0) && inLimits(v1)) {
                this._t[0] = this._norm01(Math.min(v0, v1));
                this._t[1] = this._norm01(Math.max(v0, v1));
                // CLOG(`Ranger setting values to ${v0}  and  ${v1}`);
                // CLOG(`    normalised values to ${this._t[0]}  and  ${this._t[1]}`);
                this.invalidateBuffer();
                return this;
            }
        }
        return [this._t2v(this._t[0]), this._t2v(this._t[1])];
    }

    /** @hidden */
    _doEvent(e: MouseEvent | TouchEvent, x = 0, y = 0, over: any, enter: boolean): CvsBaseControl {
        let absPos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0 || over.part == 1) { // A thumb
                    this._active = true;
                    this._tIdx = over.part;  // Which thumb is the mouse over
                    this.isOver = true;
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
                        source: this, p5Event: e, low: this._t2v(t0), high: this._t2v(t1), final: true
                    });
                    this._active = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    let t01 = this._norm01(mx - this._inset, 0, this._uiBfr.width - 2 * this._inset);
                    if (this._s2ticks)
                        t01 = this._nearestTickT(t01);
                    if (this._t[this._tIdx] != t01) {
                        this._t[this._tIdx] = t01;
                        let t0 = Math.min(this._t[0], this._t[1]);
                        let t1 = Math.max(this._t[0], this._t[1]);
                        this.action({
                            source: this, p5Event: e, low: this._t2v(t0), high: this._t2v(t1), final: false
                        });
                    }
                }
                this.isOver = (this == over.control && (over.part == 0 || over.part == 1));
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
        let cs = this.SCHEME;
        let cnrs = this.CNRS;
        let uib = this._uiBfr;
        let [tLen, tWgt, tbSize] =
            [uib.width - 2 * this._inset, this._trackWeight, this._thumbSize];
        let [majT, minT] = [this._majorTickSize, this._minorTickSize];

        const OPAQUE = cs.C(3, this._alpha);
        const TICKS = cs.G(7);
        const UNUSED_TRACK = cs.G(3);
        const USED_TRACK = cs.G(1);
        const HIGHLIGHT = cs.C(9);
        const THUMB = cs.C(6);

        uib.push();
        uib.clear();
        // Background
        if (this._opaque) {
            uib.noStroke(); uib.fill(...OPAQUE);
            uib.rect(0, 0, this._w, this._h, ...cnrs);
        }
        // Now translate to track left edge - track centre
        uib.translate(this._inset, Math.round(uib.height / 2));
        // Now draw ticks
        uib.stroke(...TICKS);
        uib.strokeWeight(1);
        let dT: number, n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            dT = tLen / n;
            for (let i = 0; i <= n; i++) { // minor ticks
                let tickX = i * dT;
                uib.line(tickX, -minT, tickX, minT);
            }
        }
        n = this._majorTicks;
        if (n >= 2) {
            dT = tLen / this._majorTicks;
            for (let i = 0; i <= n; i++) {  // major ticks
                let tickX = i * dT;
                uib.line(tickX, -majT, tickX, majT);
            }
        }
        // draw unused track
        uib.fill(...UNUSED_TRACK);
        uib.rect(0, -tWgt / 2, tLen, tWgt);
        // draw used track
        let tx0 = tLen * Math.min(this._t[0], this._t[1]);
        let tx1 = tLen * Math.max(this._t[0], this._t[1]);
        uib.fill(...USED_TRACK);
        uib.rect(tx0, -tWgt / 2, tx1 - tx0, tWgt);
        // Draw thumbs
        for (let tnbr = 0; tnbr < 2; tnbr++) {
            uib.fill(...THUMB);
            uib.noStroke();
            if ((this.isActive || this.isOver)) {
                uib.strokeWeight(2);
                uib.stroke(...HIGHLIGHT);
            }
            uib.rect(this._t[tnbr] * tLen - tbSize / 2, -tbSize / 2, tbSize, tbSize, ...this._thumbCnrs);
        }
        if (!this._enabled)
            this._disable_hightlight(uib, cs, -10, -this._h / 2, this._w, this._h);
        this._updateRangerPickBuffer(tx0, tx1);
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */
    _updateRangerPickBuffer(tx0: number, tx1: number) {
        let c = this._gui.pickColor(this);
        let pkb = this._pkBfr;
        let [tLen, tWgt, tbSize] =
            [pkb.width - 2 * this._inset, this._trackWeight, this._thumbSize];
        tx0 = Math.round(tx0);
        tx1 = Math.round(tx1);

        pkb.push();
        pkb.clear();
        pkb.noStroke();
        // Now translate to track left edge - track centre
        pkb.translate(this._inset, Math.round(pkb.height / 2));
        // Track
        pkb.fill(c.r, c.g, c.b + 5);
        pkb.rect(0, -tWgt / 2, tLen, tWgt);
        pkb.fill(c.r, c.g, c.b + 6);
        pkb.rect(tx0, -tWgt / 2, tx1 - tx0, tWgt);
        // Thumb
        pkb.fill(c.r, c.g, c.b);
        pkb.rect(tx0 - tbSize / 2, -tbSize / 2, tbSize, tbSize);
        pkb.fill(c.r, c.g, c.b + 1);
        pkb.rect(tx1 - tbSize / 2, -tbSize / 2, tbSize, tbSize);
        pkb.pop();
    }

}
