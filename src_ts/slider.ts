/**
 * <p>This class represents a horizontal slider with a draggable thumb to 
 * define a value within user defined limits.</p>
 * <p>Major and minor tick marks can be added to the bar and supports 
 * stick-to-ticks if wanted.</p>
 */
class CvsSlider extends CvsBufferedControl {
    protected _t01: number;
    protected _limit0: number;
    protected _limit1: number;
    protected _majorTicks: number;
    protected _minorTicks: number;
    protected _s2ticks: boolean;

    /**
     * @hidden
     * @param gui the gui controller
     * @param name unique name for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
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
    limits(l0: number, l1: number): CvsSlider {
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
    isInsideLimits(value: number): boolean {
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
     * @returns {CvsBaseControl} this slider object
     */
    ticks(major: number, minor: number, stick2ticks?: boolean): CvsBaseControl {
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
    value(value?: number): CvsBaseControl | number {
        if (Number.isFinite(value)) {
            if ((value - this._limit0) * (value - this._limit1) <= 0) {
                this.invalidateBuffer();
                this._t01 = this._norm01(value);
                // CLOG(`Slider setting value to ${value} _norm01 ${this._t01}  v2t ${this._v2t(value)}`)
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
    protected _t2v(t: number): number {
        return this._limit0 + t * (this._limit1 - this._limit0);
    }

    /**
     * <p>Converts parametic value to user value</p>
     * @hidden
     * @param v value
     * @returns the correspoding parametric value
     */
    protected _v2t(v: number): number {
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
    _norm01(v: number, l0 = this._limit0, l1 = this._limit1): number {
        return this._p.map(v, l0, l1, 0, 1, true);
    }

    /** @hidden */
    _doEvent(e: MouseEvent | TouchEvent, x = 0, y = 0, over: any, enter: boolean): CvsBaseControl {
        let absPos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0) { // Thumb
                    this._active = true;
                    this.isOver = true;
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                this.action({ source: this, p5Event: e, value: this.value(), final: true });
                this._active = false;
                this.isOver = false;
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    let t01 = this._norm01(mx - 10, 0, this._uiBfr.width - 20);
                    if (this._s2ticks)
                        t01 = this._nearestTickT(t01);
                    if (this._t01 != t01) {
                        this._t01 = t01;
                        this.action({ source: this, p5Event: e, value: this.value(), final: false });
                    }
                }
                this.isOver = (this == over.control && over.part == 0);
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
    _nearestTickT(p01: number): number {
        let nbrTicks = this._minorTicks > 0
            ? this._minorTicks * this._majorTicks : this._majorTicks;
        return (nbrTicks > 0) ? Math.round(p01 * nbrTicks) / nbrTicks : p01;
    }

    /** @hidden */
    _updateControlVisual(): void { // CvsSlider
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
        if (this._opaque) {
            uib.noStroke(); uib.fill(OPAQUE);
            uib.rect(0, 0, this._w, this._h, ...this._c);
        }
        // Now translate to track left edge - track centre
        uib.translate(10, ty);
        // Now draw ticks
        uib.stroke(TICKS); uib.strokeWeight(1);
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
            dT = tw / n;
            for (let i = 0; i <= n; i++) {  // major ticks
                let tickX = i * dT;
                uib.line(tickX, -majT, tickX, majT);
            }
        }
        // draw unused track
        uib.fill(UNUSED_TRACK);
        uib.rect(0, -tH / 2, tw, tH);
        // draw used track
        let tbX = tw * this._t01;
        uib.fill(USED_TRACK);
        uib.rect(0, -tH / 2, tbX, tH, ...this._c);
        // Draw thumb
        uib.fill(THUMB);
        uib.noStroke();
        if (this._isOver) {
            uib.strokeWeight(2);
            uib.stroke(HIGHLIGHT);
        }
        uib.rect(tbX - tbSize / 2, -tbSize / 2, tbSize, tbSize, ...this._c);
        if (!this._enabled)
            this._disable_hightlight(uib, cs, -10, -this._h / 2, this._w, this._h);

        this._updateSliderPickBuffer(ty, tw, tH, tbX, tbSize);
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */
    _updateSliderPickBuffer(ty: number, tw: number, tH: number, tbX: number, tbSize: number) {
        tbX = Math.round(tbX)
        let c = this._gui.pickColor(this);
        let pkb = this._pkBfr;
        pkb.push();
        pkb.clear();
        pkb.noStroke();
        // Now translate to track left edge - track centre
        pkb.translate(10, ty);
        // pkb.rect(-10, pkb.width, -ty, pkb.height); //, ...this._c);
        // Track
        pkb.fill(c.r, c.g, c.b + 5);
        pkb.rect(0, -tH / 2, tw, tH, ...this._c);
        pkb.fill(c.r, c.g, c.b + 6);
        pkb.rect(0, -tH / 2, tbX, tH, ...this._c);
        // Thumb
        pkb.fill(c.r, c.g, c.b);
        pkb.rect(tbX - tbSize / 2, -tbSize / 2, tbSize, tbSize); //, ...this._c);
        pkb.pop();
    }

    /** @hidden */
    _minControlSize() {
        return { w: this._w, h: 20 };
    }

}
