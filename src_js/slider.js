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
        // Set track weight (thickness) and calculate related fields
        this.weight(8);
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
     * Checks whether a value is between the lower and upper limits for this
     * control. It allows the user to prevalidate a value before attempting
     * to change the control's value.
     * @param value value to test
     * @returns true if the value lies within the control's limits else false
     */
    isInsideLimits(value) {
        return (Number.isFinite(value)
            && (value - this._limit0) * (value - this._limit1) <= 0);
    }
    /**
     * <p>The track can be divided up into a number of domains separated with major ticks. The
     * major domains and be further divided into subdomains separated with minor ticks. If the
     * final parameter is true then values returned by the slider are consrained to the
     * tick values.</p>
     * @param {number} major the number of major domains on the track
     * @param {number} minor the number of minor domains  between major ticks
     * @param {boolean} stick2ticks slider value is constrainged to tick values
     * @returns {CvsControl} this slider object
     */
    ticks(major, minor, stick2ticks) {
        this._majorTicks = major;
        this._minorTicks = minor;
        this._s2ticks = Boolean(stick2ticks);
        return this;
    }
    /**
     * <p>Gets or sets the thickness of the track.</p>
     * <p>If there is no parameter the currect track thickness is returned.
     * Any other value is constrained to the range &ge;&nbsp;4 and
     * &le;&nbsp;0.1 * control width.</p>
     * @param tWgt the required track thickness)
     * @returns the curent track thickness or this control
     */
    weight(tWgt) {
        if (!tWgt) // getter
            return this._trackWeight;
        // Setter
        let maxWgt = Math.round(Math.max(8, this.w / 10));
        tWgt = _constrain(tWgt, 4, maxWgt);
        this._trackWeight = tWgt;
        this._thumbSize = Math.max(14, tWgt * 1.5);
        this._thumbCnrs = [tWgt / 3, tWgt / 3, tWgt / 3, tWgt / 3];
        this._majorTickSize = Math.max(10, 1.25 * tWgt);
        this._minorTickSize = Math.max(7, 0.90 * tWgt);
        this._inset = Math.round(this._thumbSize / 2 + 4);
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
                this._t01 = this._norm01(value);
                this.invalidateBuffer();
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
        return _map(v, l0, l1, 0, 1, true);
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let absPos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0) { // Thumb
                    this._active = true;
                    this.over = true;
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                this.action({ source: this, event: e, value: this.value(), final: true });
                this._active = false;
                this.over = false;
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    let t01 = this._norm01(mx - this._inset, 0, this._w - 2 * this._inset);
                    if (this._s2ticks)
                        t01 = this._nearestTickT(t01);
                    if (this._t01 != t01) {
                        this._t01 = t01;
                        this.action({ source: this, event: e, value: this.value(), final: false });
                    }
                }
                this.over = (this == over.control && over.part == 0);
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
        let cs = this.SCHEME;
        let cnrs = this.CNRS;
        let [tLen, tWgt, tbSize] = [this._w - 2 * this._inset, this._trackWeight, this._thumbSize];
        let [majT, minT] = [this._majorTickSize, this._minorTickSize];
        const OPAQUE = cs.C$(3, this._alpha);
        const TICKS = cs.G$(7);
        const UNUSED_TRACK = cs.G$(3);
        const USED_TRACK = cs.G$(1);
        const HIGHLIGHT = cs.C$(9);
        const THUMB = cs.C$(6);
        let uic = this._uicContext;
        this._clearUiBuffer();
        this._clearPickBuffer();
        uic.save();
        if (this._opaque) { // Background
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.fill();
        }
        // Now translate to track left edge - track centre
        uic.translate(this._inset, Math.round(this._h / 2));
        // Now draw ticks
        uic.strokeStyle = TICKS;
        uic.lineWidth = (1);
        let dT, n = this._majorTicks * this._minorTicks;
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
            dT = tLen / n;
            uic.beginPath();
            for (let i = 0; i <= n; i++) { // major ticks
                let tickX = i * dT;
                uic.moveTo(tickX, -majT);
                uic.lineTo(tickX, majT);
                uic.stroke();
            }
        }
        // draw unused track
        uic.fillStyle = UNUSED_TRACK;
        uic.fillRect(0, -tWgt / 2, tLen, tWgt);
        // draw used track
        let tbX = tLen * this._t01;
        uic.fillStyle = USED_TRACK;
        uic.fillRect(0, -tWgt / 2, tbX, tWgt);
        // Draw thumb
        uic.fillStyle = THUMB;
        uic.beginPath();
        uic.roundRect(tbX - tbSize / 2, -tbSize / 2, tbSize, tbSize, this._thumbCnrs);
        uic.fill();
        if (this._isOver) {
            uic.lineWidth = 2;
            uic.strokeStyle = HIGHLIGHT;
            uic.stroke();
        }
        this._updatePickBuffer();
        uic.restore();
        if (!this._enabled)
            this._disable_highlight(cs, 0, 0, this._w, this._h);
        this._bufferInvalid = false; // Finally mark as valid
    }
    /** @hidden */
    _updatePickBuffer() {
        const pkc = this._pkcContext;
        const c = this._gui.pickColor(this);
        const [tLen, tWgt, tbSize] = [this._w - 2 * this._inset, this._trackWeight, this._thumbSize];
        const tbX = Math.round(tLen * this._t01);
        pkc.clearRect(0, 0, this._w, this._h);
        pkc.save();
        // Now translate to track left edge - track centre
        pkc.translate(this._inset, Math.round(this.h / 2));
        // Track
        pkc.fillStyle = _rgb$(c.r, c.g, c.b + 5);
        pkc.fillRect(0, -tWgt / 2, tLen, tWgt);
        pkc.fillStyle = _rgb$(c.r, c.g, c.b + 6);
        pkc.fillRect(0, -tWgt / 2, tbX, tWgt);
        // Thumb
        pkc.fillStyle = c.cssColor;
        pkc.fillRect(tbX - tbSize / 2, -tbSize / 2, tbSize, tbSize);
        pkc.restore();
    }
}
Object.assign(CvsSlider.prototype, PICKABLE);
//# sourceMappingURL=slider.js.map