/**
 * <p>This class represents a horizontal slider with a draggable thumb to
 * define a value within user defined limits.</p>
 * <p>Major and minor tick marks can be added to the bar and supports
 * stick-to-ticks if wanted.</p>
 */
class CvsSlider extends CvsBufferedControl {
    /**
     * @hidden
     * @param gui the gui controller
     * @param name unique name for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 100, h || 20);
        this._t01 = 0.5;
        this._limit0 = 0;
        this._limit1 = 1;
        this._majorTicks = 0;
        this._minorTicks = 0;
        this._s2ticks = false;
        this._opaque = false;
    }
    /**
     * Set the lower and upper limits for the slider
     *
     * @param l0 lower limit
     * @param l1 upper limit
     * @returns this slider object
     */
    limits(l0, l1) {
        if (Number.isFinite(l0) && Number.isFinite(l1)) {
            this._limit0 = l0;
            this._limit1 = l1;
        }
        return this;
    }
    /**
     *
     * @param value scale value to test
     * @returns true if the value lies within the slider's limits else false
     */
    isValid(value) {
        return (Number.isFinite(value)
            && (value - this._limit0) * (value - this._limit1) <= 0);
    }
    /**
     * <p>The track can be divided up into a number of domains separated with major ticks. The
     * major domains and be further divided into subdomains separated with minor ticks. If the
     * final parameter is true then values retqurned by the slider are consrained to the
     * tick values.</p>
     * @param {number} major the number of major domains on the track
     * @param {number} minor the number of minor domains  between major ticks
     * @param {boolean} stick2ticks slider value is constrainged to tick values
     * @returns {CvsBaseControl} this slider object
     */
    ticks(major, minor, stick2ticks) {
        this._majorTicks = major;
        this._minorTicks = minor;
        this._s2ticks = Boolean(stick2ticks);
        return this;
    }
    /**
     * If the parameter value is withing the slider limits it will move the thumb
     * to the appropriate position. If no parameter is passed or is outside the
     * limits this methods returns the current slider value.
     * @param value the selected value to be set
     * @returns the current value or this slider object
     */
    value(value) {
        if (Number.isFinite(value)) {
            if ((value - this._limit0) * (value - this._limit1) <= 0) {
                this.invalidateBuffer();
                this._t01 = this._norm01(value);
                return this;
            }
        }
        return this._t2v(this._t01);
    }
    /**
     * <p>Converts parametic value to user value</p>
     * @hidden
     * @param t parametric value
     * @returns the correspoding value
     */
    _t2v(t) {
        return this._limit0 + t * (this._limit1 - this._limit0);
    }
    /**
     * <p>Converts parametic value to user value</p>
     * @hidden
     * @param v value
     * @returns the correspoding parametric value
     */
    _v2t(v) {
        return (v - this._limit0) / (this._limit1 - this._limit0);
    }
    /**
     * <p>get the parametic value t for a given value, whwre v can be any value
     * and not constrained to the slider limits. The result is constrained to the
     * range &ge;0 and &lt;1</p>
     * @hidden
     * @param v user value
     * @param l0 lower limit
     * @param l1 upper limit
     * @returns parametric value in range &ge;0 and &lt;1
     */
    _norm01(v, l0 = this._limit0, l1 = this._limit1) {
        return this._p.constrain(this._p.map(v, l0, l1, 0, 1), 0, 1);
    }
    /**
     * <p>See if the position [px, py] is over the control.</p>
     * @hidden
     * @param px horizontal position
     * @param py vertical position
     * @param tol tolerance in pixels
     * @returns 0 if not over the control of &ge;1
     */
    _whereOver(px, py, tol = 8) {
        px -= 10; // Adjust mouse to start of track
        let ty = this._buffer.height / 2;
        let tx = this._t01 * (this._buffer.width - 20);
        return (Math.abs(tx - px) <= tol && Math.abs(ty - py) <= tol)
            ? 1 : 0;
    }
    /** @hidden */
    _handleMouse(e) {
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x;
        let my = this._p.mouseY - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x;
        my = r.y;
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip)
            this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx);
        return false;
    }
    /** @hidden */
    _handleTouch(e) {
        e.preventDefault();
        let pos = this.getAbsXY();
        const rect = this._gui._canvas.getBoundingClientRect();
        const t = e.changedTouches[0];
        let mx = t.clientX - rect.left - pos.x;
        let my = t.clientY - rect.top - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x;
        my = r.y;
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my, 20); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip)
            this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx);
    }
    /** @hidden */
    _processEvent(e, ...info) {
        let mx = info[0];
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (this._over > 0) {
                    this._active = true;
                    this.invalidateBuffer();
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this._active) {
                    this.action({ source: this, p5Event: e, value: this.value(), final: true });
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
                    if (this._t01 != t01) {
                        this._t01 = t01;
                        this.action({ source: this, p5Event: e, value: this.value(), final: false });
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
    /**
     * For a given value p01 find the value at the nearest tick
     * @hidden
     */
    _nearestTickT(p01) {
        let nbrTicks = this._minorTicks > 0
            ? this._minorTicks * this._majorTicks : this._majorTicks;
        return (nbrTicks > 0) ? Math.round(p01 * nbrTicks) / nbrTicks : p01;
    }
    /** @hidden */
    _updateControlVisual() {
        let b = this._buffer;
        let cs = this._scheme || this._gui.scheme();
        let tw = b.width - 20, trackW = 8, thumbSize = 12, majorT = 10, minorT = 7;
        const OPAQUE = cs['C_0'];
        const TICKS = cs['G_9'];
        const UNUSED_TRACK = cs['G_4'];
        const USED_TRACK = cs['G_1'];
        const HIGHLIGHT = cs['C_9'];
        const THUMB = cs['C_6'];
        b.push();
        b.clear();
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
            dT = tw / n;
            for (let i = 0; i <= n; i++) { // major ticks
                let tx = i * dT;
                b.line(tx, -majorT, tx, majorT);
            }
        }
        // draw unused track
        b.fill(UNUSED_TRACK);
        b.rect(0, -trackW / 2, tw, trackW);
        // draw used track
        let tx = tw * this._t01;
        b.fill(USED_TRACK);
        b.rect(0, -trackW / 2, tx, trackW, this._c[0], this._c[1], this._c[2], this._c[3]);
        // Draw thumb
        b.fill(THUMB);
        b.noStroke();
        if (this._active || this._over > 0) {
            b.strokeWeight(2);
            b.stroke(HIGHLIGHT);
        }
        b.rect(tx - thumbSize / 2, -thumbSize / 2, thumbSize, thumbSize, this._c[0], this._c[1], this._c[2], this._c[3]);
        if (!this._enabled)
            this._disable_hightlight(b, cs, 0, -this._h / 2, this._w - 20, this._h);
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _minControlSize() {
        return { w: this._w, h: 20 };
    }
}
//# sourceMappingURL=slider.js.map