/**
 * <p>This class represents a slider with 2 draggable thumbs to
 * define a value within user defined limits.</p>
 * <p>Major and minor tick marks can be added to the bar and supports
 * stick-to-ticks if wanted.</p>
 */
class CvsRanger extends CvsSlider {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 100, h || 20);
        /** @hidden */ this._t = [0.25, 0.75];
        /** @hidden */ this._tIdx = -1;
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
    range(v0, v1) {
        // if (!v0 || !v1)
        //   return { low: this._t2v(this._t[0]), high: this._t2v(this._t[1]) };
        if (Number.isFinite(v0) && Number.isFinite(v1)) { // If two numbers then
            let t0 = this._norm01(Math.min(v0, v1));
            let t1 = this._norm01(Math.max(v0, v1));
            if (t0 >= 0 && t0 <= 1 && t1 >= 0 && t1 <= 1) {
                this._bufferInvalid = (this._t[0] != t0) || (this._t[1] != t1);
                this._t[0] = t0;
                this._t[1] = t1;
                return this;
            }
        }
        // Invalid parameters
        return { low: this._t2v(this._t[0]), high: this._t2v(this._t[1]) };
    }
    /**
     * @returns the low value of the range
     */
    low() {
        return this._t2v(this._t[0]);
    }
    /**
     * @returns the high value of the range
     */
    high() {
        return this._t2v(this._t[1]);
    }
    /** @hidden */
    value(v) {
        console.warn('Ranger controls require 2 values - use range(v0, v1) instead');
        return undefined;
    }
    /** @hidden */
    _whereOver(px, py, tol = 8) {
        // Check vertical position  
        let ty = this._buffer.height / 2;
        if (Math.abs(py - ty) <= 8) {
            let tw = this._buffer.width - 20;
            let t = this._t;
            px -= 10;
            if (Math.abs(t[0] * tw - px) <= tol)
                return 1;
            if (Math.abs(t[1] * tw - px) <= tol)
                return 2;
        }
        return 0;
    }
    /** @hidden */
    _processEvent(e, ...info) {
        let mx = info[0];
        this._tIdx = this._active ? this._tIdx : this._over - 1;
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (this._over > 0) {
                    this._active = true;
                    this._tIdx = this._over - 1; // Which thumb is the mouse over
                    this.invalidateBuffer();
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this._active) {
                    let t0 = Math.min(this._t[0], this._t[1]);
                    let t1 = Math.max(this._t[0], this._t[1]);
                    this._t[0] = t0;
                    this._t[1] = t1;
                    this._tIdx = -1;
                    this.action({
                        source: this, p5Event: e, low: this._t2v(t0), high: this._t2v(t1), final: true
                    });
                    this._active = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this._active) {
                    let t01 = this._norm01(mx - 10, 0, this._buffer.width - 20);
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
                    this.invalidateBuffer();
                }
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
    }
    /** @hidden */
    _updateControlVisual() {
        let b = this._buffer;
        let cs = this._scheme || this._gui.scheme();
        let tw = b.width - 20;
        let trackW = 8, thumbSize = 12, majorT = 10, minorT = 7;
        const OPAQUE = cs['C_3'];
        const TICKS = cs['G_7'];
        const UNUSED_TRACK = cs['G_3'];
        const USED_TRACK = cs['G_1'];
        const HIGHLIGHT = cs['C_9'];
        const THUMB = cs['C_6'];
        b.push();
        b.clear();
        // Background
        if (this._opaque) {
            b.noStroke();
            b.fill(OPAQUE);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Now translate to track left edge - track centre
        b.translate(10, b.height / 2);
        // Now draw ticks
        b.stroke(TICKS);
        b.strokeWeight(1);
        let dT, n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            dT = tw / n;
            for (let i = 0; i <= n; i++) { // minor ticks
                let tx = i * dT;
                b.line(tx, -minorT, tx, minorT);
            }
        }
        n = this._majorTicks;
        if (n >= 2) {
            dT = tw / this._majorTicks;
            for (let i = 0; i <= n; i++) { // major ticks
                let tx = i * dT;
                b.line(tx, -majorT, tx, majorT);
            }
        }
        // draw unused track
        b.fill(UNUSED_TRACK);
        b.rect(0, -trackW / 2, tw, trackW);
        // draw used track
        let tx0 = tw * Math.min(this._t[0], this._t[1]);
        let tx1 = tw * Math.max(this._t[0], this._t[1]);
        b.fill(USED_TRACK);
        b.rect(tx0, -trackW / 2, tx1 - tx0, trackW, this._c[0], this._c[1], this._c[2], this._c[3]);
        // Draw thumb
        for (let tnbr = 0; tnbr < 2; tnbr++) {
            b.fill(THUMB);
            b.noStroke();
            if ((this._active || this._over > 0) && tnbr == this._tIdx) {
                b.strokeWeight(2);
                b.stroke(HIGHLIGHT);
            }
            b.rect(this._t[tnbr] * tw - thumbSize / 2, -thumbSize / 2, thumbSize, thumbSize, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (!this._enabled)
            this._disable_hightlight(b, cs, 0, -this._h / 2, this._w - 20, this._h);
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }
}
Object.assign(CvsRanger.prototype, processMouse, processTouch);
//# sourceMappingURL=ranger.js.map