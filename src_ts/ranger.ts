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
     * <p>Sets or gets the low and high values for this control. If both parameters
     * and within the rangers limits then they are used to set the low and high
     * values of the ranger and move the thumbs to the correct postion.</p>
     * <p>If one or both parameters are invalid then they are ignored and the method 
     * returns the current range low and high values.</p>
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


    /** @hidden */
    value(v?: number): number | CvsBaseControl {
        console.warn('Ranger controls require 2 values - use range(v0, v1) instead');
        return undefined;
    }

    /** @hidden */
    _doEvent(e: MouseEvent | TouchEvent, x = 0, y = 0, over: any, enter: boolean): CvsBaseControl {
        let absPos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0 || over.part == 1) { // A thumb
                    this.isActive = true;
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
                    this.isActive = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    let t01 = this._norm01(mx - 10, 0, this._uiBfr.width - 20);
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
        let cs = this._scheme || this._gui.scheme();

        const OPAQUE = cs['C_3'];
        const TICKS = cs['G_7'];
        const UNUSED_TRACK = cs['G_3'];
        const USED_TRACK = cs['G_1'];
        const HIGHLIGHT = cs['C_9'];
        const THUMB = cs['C_6'];

        let uib = this._uiBfr;
        let tw = uib.width - 20, tH = 8, tbSize = 12;
        let ty = Math.round(uib.height / 2);
        let majT = 10, minT = 7;
        uib.push();
        uib.clear();
        // Background
        if (this._opaque) {
            uib.noStroke(); uib.fill(OPAQUE);
            uib.rect(0, 0, this._w, this._h, ...this._c);
        }
        // Now translate to track left edge - track centre
        uib.translate(10, ty);
        // Now draw ticks
        uib.stroke(TICKS);
        uib.strokeWeight(1);
        let dT: number, n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            dT = tw / n;
            for (let i = 0; i <= n; i++) { // minor ticks
                let tickX = i * dT;
                uib.line(tickX, -minT, tickX, minT);
            }
        }
        n = this._majorTicks;
        if (n >= 2) {
            dT = tw / this._majorTicks;
            for (let i = 0; i <= n; i++) {  // major ticks
                let tickX = i * dT;
                uib.line(tickX, -majT, tickX, majT);
            }
        }
        // draw unused track
        uib.fill(UNUSED_TRACK);
        uib.rect(0, -tH / 2, tw, tH);
        // draw used track
        let tx0 = tw * Math.min(this._t[0], this._t[1]);
        let tx1 = tw * Math.max(this._t[0], this._t[1]);
        uib.fill(USED_TRACK);
        uib.rect(tx0, -tH / 2, tx1 - tx0, tH, ...this._c);
        // Draw thumbs
        for (let tnbr = 0; tnbr < 2; tnbr++) {
            uib.fill(THUMB);
            uib.noStroke();
            if ((this.isActive || this.isOver) && tnbr == this._tIdx) {
                uib.strokeWeight(2);
                uib.stroke(HIGHLIGHT);
            }
            uib.rect(this._t[tnbr] * tw - tbSize / 2, -tbSize / 2, tbSize, tbSize, ...this._c);
        }
        if (!this._enabled)
            this._disable_hightlight(uib, cs, -10, -this._h / 2, this._w, this._h);
        this._updateRangerPickBuffer(ty, tw, tH, tx0, tx1, tbSize);
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */
    _updateRangerPickBuffer(ty: number, tw: number, tH: number, tx0: number, tx1: number, tbSize: number) {
        tx0 = Math.round(tx0);
        tx1 = Math.round(tx1);
        let c = this._gui.pickColor(this);
        let pkb = this._pkBfr;
        pkb.push();
        pkb.clear();
        pkb.noStroke();
        // Now translate to track left edge - track centre
        pkb.translate(10, ty);
        // Track
        pkb.fill(c.r, c.g, c.b + 5);
        pkb.rect(0, -tH / 2, tw, tH, ...this._c);
        pkb.fill(c.r, c.g, c.b + 6);
        pkb.rect(tx0, -tH / 2, tx1 - tx0, tH, ...this._c);
        // Thumb
        pkb.fill(c.r, c.g, c.b);
        pkb.rect(tx0 - tbSize / 2, -tbSize / 2, tbSize, tbSize); //, ...this._c);
        pkb.fill(c.r, c.g, c.b + 1);
        pkb.rect(tx1 - tbSize / 2, -tbSize / 2, tbSize, tbSize); //, ...this._c);
        pkb.pop();
    }

}
