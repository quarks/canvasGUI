/**
 * <h2>A control that displays a positive integer where each digit can be
 * changed independently through user-interaction.</h2>
 *
 * <p>A spinner can have between 1 and 15 reels do can display any integer in
 * the range &ge;0 and &le;999,999,999,999,999 depending on the number of
 * reels specified when creating the spinner control.</p>
 *
 * <p>Individual digits can be changed by moving the mouse over a reel and </p>
 * <ul>
 * <li>dragging the mouse, or</li>
 * <li>scrolling the mouse wheel</li>
 * </ul>
 *
 * <p>Alternatively the displayed number can be changed with these three
 * methods </p>
 * <ol>
 * <li><code>setTo(n)</code> immdediately change the displayed value.</li>
 * <li><code>rollTo(n, speed)</code> scroll the individual reels to display
 * a new value. </li>
 * <li><code>countTo(n, speed)</code> scroll the reels by counting (up / down)
 *  to a new value.</li>
 * </ol>
 * <p>In the last 2 methods the second parameter determines how fast the wheels
 * spin the wheels and the user can set an action wfor when the desired value
 * is reached. </p>
 *
 */
class CvsSpinner extends CvsBufferedControl {
    /** @hidden */
    constructor(gui, id, x, y, w, h, nbrReels) {
        super(gui, id, x, y, w, h, true);
        this._tmrID = 0;
        this._status = CvsSpinner.IDLE;
        this._gap = 0;
        this._inset = 2;
        this._ti = 33; // timer interval
        this.speed(3);
        this._stride = 8;
        this.wheel();
        nbrReels = _constrain(Math.floor(nbrReels), 1, 15);
        this._max = Number('9'.repeat(nbrReels));
        this._reels = [];
        // Creates an enpty buffer
        [this._rBfr, this._dBfr] = (this._createReelGraphicBuffer(this._uicBuffer));
        // Paints the reel using scheme colour
        this._paintReelGraphic();
        this._paintShading();
        // Create the reels
        this._createReels(nbrReels);
        this.gap(this._gap);
        this._endValue = 0;
        this._startValue = 0;
        this._startTime = 0;
        this._tmrID = 0;
        this._status = CvsSpinner.IDLE;
        // This is set to true when the reel graphic need updating
        this._reelInvalid = true;
    }
    /**
     * Get the spinner's current value. If the status is 'working' then this
     * value can change rapidily.
     *
     * @readonly
     * @type {number}
     */
    get value() { return this._valueFromReels(); }
    /**
     * Get the spinner's current status description. It will return either
     * 'idle' or 'working'.
     * @readonly
     * @type {string}
     */
    get status() { return this._status; }
    /**
     * Get the maximum integer value that this spinner can use and display.
     * @readonly
     * @type {number}
     */
    get maxValue() { return this._max; }
    /**
     * Get the mouse wheel event handling attributes.
     *
     * @readonly
     * @type {{ enabled: boolean; stride: number; dir: number; }}
     */
    get wheelDetail() {
        return {
            enabled: this._wEnabled, stride: this._wStride, dir: this._wDir
        };
    }
    get isIdle() { return this._status == CvsSpinner.IDLE; }
    get isRolling() { return this._status == CvsSpinner.ROLLING; }
    get isCounting() { return this._status == CvsSpinner.COUNTING; }
    get isWorking() { return this._status != CvsSpinner.IDLE; }
    /**
     * <p>Changes the display value with immediate effect provided the statys
     * is 'idle' otherwise it has no effect.</p>
     *
     * @param v the new initial value to display
     * @returns this control
     */
    setTo(v = 0) {
        if (Number.isFinite(v) && this._status === CvsSpinner.IDLE) {
            v = Math.abs(v);
            this._setReels(v);
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * <p>Change the current display value by rolling the reels independently.
     * </p>
     * <p>If the spinner's status is not 'idle' then this instruction will be
     * silently ignored.</p>
     *
     * @param n the number to roll to
     * @param speed the roll speed (&ge;1 and &le;9)
     * @returns this control
     */
    rollTo(n, speed) {
        if (Number.isFinite(n) && this._status === CvsSpinner.IDLE) {
            if (Number.isFinite(speed))
                this.speed(speed);
            n = Math.floor(_constrain(n, 0, this._max));
            this._startValue = this._valueFromReels();
            if (n != this._startValue) {
                this._endValue = n;
                this._setReels(this._startValue);
                this._setTargets(this._endValue);
                this._tmrID = setInterval(() => this._rollEvent(this._dV), this._ti);
                this._status = CvsSpinner.ROLLING;
            }
        }
        return this;
    }
    /**
     * <p>Change the current display value by counting from the current value
     * to the requested value. The display value will continuously increase
     * or decrease by 1 until the requested value is reached or the spinner
     * is forced to stop.</p>
     * <p>If the spinner's status is not 'idle' then this instruction will be
     * silently ignored.</p>
     *
     * @param n the number to roll to
     * @param speed the roll speed (&ge;1 and &le;9)
     * @returns this control
     */
    countTo(n, speed) {
        if (Number.isFinite(n) && this._status === CvsSpinner.IDLE) {
            n = Math.floor(_constrain(n, 0, this._max));
            this._startValue = this._valueFromReels();
            if (n != this._startValue) {
                if (Number.isFinite(speed))
                    this.speed(speed);
                this._endValue = n;
                this._setReels(this._startValue);
                this._setTargets(this._startValue);
                const dir = _sign(n - this._startValue);
                this._startTime = NOW();
                this._tmrID =
                    setInterval(() => this._countEvent(this._dV, dir), this._ti);
                this._status = CvsSpinner.COUNTING;
            }
        }
        return this;
    }
    /**
     * <p>Stops the spinner at the current value and makes its status 'idle'.
     * </p>
     * @returns this control
     */
    stop() {
        clearInterval(this._tmrID);
        this._tmrID = 0;
        this._status = CvsSpinner.IDLE;
        this._setReels(this._valueFromReels());
        return this;
    }
    /**
     *
     * @param s Any value in the range 1.0 to 10.0
     * @returns
     */
    speed(s) {
        if (Number.isFinite(s)) {
            this._speed = _constrain(s, 1, 9);
            this._dV = _map(this._speed, 1, 9, 0.00499999, 0.99999);
            return this;
        }
        return this._speed;
    }
    /**
     * <p>Use this method to change the mouse wheel's behaviour. </p>
     * <p>The first parameter determines whether the reels can be changed
     * using the mouse wheel. The stride how rapidly the reel's digit changes
     * based the controls the sensitivity of the wheel scroll amount.</p>
     *
     *
     * @param enabled true / false
     * @param stride &gt;0  (number of wheel-pixels per digit change)
     * @param dir -1 or +1
     * @returns this control
     */
    wheel(enabled = true, stride = 16, dir = 1) {
        this._wEnabled = enabled;
        this._wStride = stride;
        this._wDir = dir;
        this._wCount = 0;
        return this;
    }
    /**
     * <p>When dragging the mouse the stride is the pixel drag distance
     * needed to change  by one digit.</p>
     * <p>If the parameter is missing or invalid then the current stride
     * distance is returned.</p>
     *
     * @param n nust be &gt;1 to be valid
     * @returns this control or the current stride distance
     */
    stride(n) {
        if (n && Number.isFinite(n) && n > 1) {
            this._stride = n;
            return this;
        }
        return this._stride;
    }
    /**
     * <p>If a valid color scheme or the name of a valid color scheme is
     * provided then it will be used to display the control otherwise the
     * control's color scheme remains unchanged. In both cases this control
     * is returned.</p>
     * <p>If there is no parameter it returns the current color scheme used
     * by this control.</p>
     * @param name a color scheme or the name of a color scheme e.g. 'blue'
     * @param cascade if true propogate scheme to all child controls.
     * @returns this control or the control's color scheme
     */
    scheme(name, cascade) {
        const result = super.scheme(name);
        if (result === this) {
            this._reelInvalid = true;
            this.invalidateBuffer();
        }
        return result;
    }
    /**
     * <p>This controls the spacing between reels. it is the user's
     * responsiblity to ensure the control is wide enough to display all the
     * reels.</p>
     * <p>If no valid parameter is provided then the current gap value is
     * returned.</p>
     * @param v the pixel gap between reels (&ge;0)
     * @returns this control ro the current gap value.
     */
    gap(v) {
        if (Number.isFinite(v)) {
            this._gap = v < 0 ? 0 : v;
            const [dw, gap, nr] = [this._dW, this._gap, this._reels.length];
            const stride = dw + gap;
            const sx = (this._w - nr * stride + gap) / 2;
            for (let i = 0; i < nr; i++)
                this._reels[i].x = sx + stride * (nr - 1 - i);
            this.invalidateBuffer();
            return this;
        }
        return this._gap;
    }
    /**
     * Interval event to roll reels to desired value.
     * @param dV the change to make in the reel value (<<1)
     * @hidden
     */
    _rollEvent(dV) {
        let todo = this._reels.length;
        this._reels.forEach(reel => {
            if (reel.roll(dV))
                todo--;
        });
        if (todo == 0) {
            this._stopSpinning('roll');
        }
        this.invalidateBuffer();
    }
    /**
     * Interval event to count to desired value.
     * @param dV the change to make in the reel value (<<1)
     * @hidden
     */
    _countEvent(dV, dir) {
        const reels = this._reels;
        // test for carry on reel 0
        if (reels[0].count(dV, dir)) { // See if we have a carry
            for (let rn = 1; rn < reels.length; rn++) {
                const reel = reels[rn];
                let carryOver = false;
                if (dir > 0 && reel.digit == 9) { // forward
                    reel.target = 0;
                    carryOver = true;
                }
                else if (dir < 0 && reel.digit == 0) {
                    reel.v = 10;
                    reel.target = 9;
                    carryOver = true;
                }
                else {
                    reel.target += dir;
                }
                if (!carryOver)
                    break;
            }
        }
        // Have we reached the final value if not Now spin the other reels
        if (this._valueFromReels() != this._endValue) {
            for (let rn = 1; rn < reels.length; rn++) {
                const reel = reels[rn];
                if (reel.digit != reel.target)
                    reel.count(dV, dir);
                else
                    reel.v = reel.digit;
            }
        }
        else {
            this._stopSpinning('count');
        }
        this.invalidateBuffer();
    }
    /**
     * Convert the number into an array of digits starting with the 1's
     * @hidden
     */
    _toArray(v) {
        const array = (new Array(this._reels.length)).fill(0);
        for (let i = 0; i < array.length; i++) {
            if (v > 0) {
                array[i] = v % 10;
                v = Math.floor(v / 10);
            }
            else
                break;
        }
        return array;
    }
    /** @hidden */
    _setTargets(n) {
        const a = this._toArray(n);
        for (let rn = 0; rn < a.length; rn++)
            this._reels[rn].target = a[rn];
    }
    /** @hidden */
    _stopTimer() {
        clearInterval(this._tmrID);
        this._tmrID = 0;
        this._status = CvsSpinner.IDLE;
    }
    /** @hidden */
    _stopSpinning(reason) {
        clearInterval(this._tmrID);
        this._tmrID = 0;
        this._status = CvsSpinner.IDLE;
        this._setReels(this._endValue);
        this._setTargets(this._endValue);
        const dT = NOW() - this._startTime;
        const range = Math.abs(this._endValue - this._startValue);
        this.action({
            source: this, event: undefined,
            type: reason,
            startValue: this._startValue, endValue: this._endValue,
        });
    }
    /** @hidden */
    _setReels(v) {
        const a = this._toArray(v);
        for (let rn = 0; rn < a.length; rn++) {
            this._reels[rn].v = a[rn];
            this._reels[rn].digit = a[rn];
        }
        this.invalidateBuffer();
    }
    /** @hidden */
    _valueFromReels() {
        let v = 0;
        this._reels.forEach(r => v += r.value);
        return v;
    }
    /** @hidden */
    _createReelGraphicBuffer(uic) {
        const digits = '01234567890';
        const digitH = Math.floor(this._h - 2 * this._inset);
        const fontSize = Math.floor(digitH - 2);
        const cssFont = cssFont$('sans-serif', fontSize, 'normal');
        // Use canvasGUI UI buffer to calculate text metrics
        let uiCtx = uic.getContext('2d');
        uiCtx.font = cssFont;
        uiCtx.textBaseline = 'top';
        const tm = textMetrics(uiCtx, digits);
        const digitW = 2 + Math.round(tm.fWidth / digits.length);
        uiCtx.restore();
        // Save reel metrics and return buffer for reel garphics
        this._dW = digitW;
        this._dH = digitH;
        this._offY = tm.tAscent + (digitH - tm.tHeight) / 2;
        this._cssFont = cssFont;
        return [new OffscreenCanvas(digitW, digitH * digits.length),
            new OffscreenCanvas(digitW, digitH)];
    }
    /** @hidden */
    _paintShading(bfr = this._dBfr) {
        const [w, h] = [bfr.width, bfr.height];
        const ctx = bfr.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        const cs = this.SCHEME;
        const clr = cs.T$(3);
        let fade = ctx.createLinearGradient(0, 0, 0, h);
        fade.addColorStop(0.0, clr);
        fade.addColorStop(0.2, 'transparent');
        fade.addColorStop(0.8, 'transparent');
        fade.addColorStop(1.0, clr);
        ctx.fillStyle = fade;
        ctx.fillRect(0, 0, w, h);
    }
    /** @hidden */
    _paintReelGraphic(bfr = this._rBfr) {
        const rctx = bfr.getContext('2d');
        const cs = this.SCHEME;
        const TEXT = cs.C$(8);
        const BACK = cs.C$(1);
        // Fill background
        rctx.save();
        rctx.fillStyle = BACK;
        rctx.fillRect(0, 0, bfr.width, bfr.height);
        // Draw digits
        const digits = '01234567890';
        rctx.font = this._cssFont;
        rctx.textBaseline = 'top';
        rctx.translate(1, this._offY);
        rctx.fillStyle = TEXT;
        for (let i = 0; i < digits.length; i++) {
            let dgt = digits.charAt(i);
            rctx.fillText(dgt, 0, i * this._dH);
        }
        rctx.restore();
    }
    /** @hidden */
    _createReels(nbrReels) {
        for (let i = 0; i < nbrReels; i++) {
            const reel = new Reel(i, 0, this._inset);
            this._reels.push(reel);
        }
    }
    /** @hidden */
    printReels(nbr = this._reels.length) {
        const [currV, destV] = [this._valueFromReels(), this._endValue];
        console.log(`Curr value: ${currV}     Target value: ${destV}`);
        for (let i = 0; i < nbr; i++)
            console.log(`   ${this._reels[i].toString()}`);
    }
    /**
     *       \3/       segment determines which axis
     *      2 X 0      to use for changing reel value
     *       /1\
     * Segs: 0 & 1: increments digit
     *       2 & 3: decrements digit
     *
     * @hidden
     */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let absPos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this._overReelNumber = over.part; // Which reel is the mouse over
                this.over = true;
                this._sX = mx;
                this._sY = my;
                this._sD = this._reels[over.part].digit;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    const reel = this._reels[this._overReelNumber];
                    this.action({
                        source: this, event: undefined, type: 'ui',
                        reelIdx: this._overReelNumber, digit: reel.digit,
                        value: this.value, final: true
                    });
                    this._active = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    let reel = this._reels[this._overReelNumber];
                    if (reel) {
                        const [dx, dy] = [mx - this._sX, my - this._sY];
                        let seg = 4 * Math.atan2(dy, dx) / Math.PI;
                        seg = Math.floor(((seg + 9) % 8) / 2);
                        const sgn = (seg == 0 || seg == 1) ? 1 : -1;
                        const dv = Math.abs(seg == 0 || seg == 2 ? dx : dy);
                        const nD = Math.round(100 + this._sD + sgn * dv
                            / this._stride) % 10;
                        if (reel.digit != nD) {
                            reel.v = nD;
                            reel.digit = nD;
                            this.action({
                                source: this, event: undefined, type: 'ui',
                                reelIdx: this._overReelNumber, digit: reel.digit,
                                value: this.value, final: false
                            });
                        }
                        this.invalidateBuffer();
                    }
                }
                else {
                    this._overReelNumber = over.part;
                }
                this.over = (this == over.control); // Spinner control
                this.invalidateBuffer();
                break;
            case 'mouseover':
                break;
            case 'wheel':
                if (e instanceof WheelEvent) {
                    e.preventDefault();
                    const reel = this._reels[this._overReelNumber];
                    if (this._wEnabled && reel) {
                        const delta = e.deltaY;
                        if (delta * this._wCount < 0) // reverse direction
                            this._wCount = 0;
                        else
                            this._wCount += delta;
                        const mag = Math.abs(this._wCount);
                        const sgn = _sign(this._wCount);
                        if (mag >= this._wStride) {
                            const change = Math.floor(mag / this._wStride);
                            const remain = mag % this._wStride;
                            this._wCount = remain * sgn;
                            const nD = (reel.digit + sgn * change + 1000) % 10;
                            reel.digit = nD;
                            reel.v = nD;
                            this.action({
                                source: this, event: undefined, type: 'ui',
                                reelIdx: this._overReelNumber, digit: reel.digit,
                                value: this.value, final: false
                            });
                            this.invalidateBuffer();
                        }
                    }
                }
                break;
        }
        return this.isActive ? this : null;
    }
    /** @hidden */
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        this._clearBuffer(uib, uic);
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const OPAQUE = cs.C$(3, this._alpha);
        const EDGE = cs.C$(6);
        const HIGHLIGHT = cs.C$(9);
        if (this._reelInvalid) {
            this._paintReelGraphic();
            // this._paintShading();
            this._reelInvalid = false;
        }
        uic.save();
        // Background
        if (this._opaque) {
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.fill();
        }
        // Reels
        uic.strokeStyle = EDGE;
        uic.lineWidth = 1;
        this._reels.forEach(r => {
            uic.drawImage(this._rBfr, 0, r.v * this._dH, this._dW, this._dH, // Source
            r.x, r.y, this._dW, this._dH // Destination
            );
            // Add shading and border
            uic.drawImage(this._dBfr, r.x, r.y);
            uic.strokeRect(r.x, r.y, this._dW, this._dH);
        });
        // Mouse over border highlight
        if (this.isActive || this.over) {
            const reel = this._reels[this._overReelNumber];
            if (reel) {
                uic.strokeStyle = HIGHLIGHT;
                uic.lineWidth = 2;
                uic.strokeRect(reel.x, reel.y, this._dW, this._dH);
            }
        }
        // Update pick buffer before restoring
        this._updatePickBuffer();
        uic.restore();
        // The last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _updatePickBuffer() {
        const pkb = this._pkcBuffer;
        const pkc = pkb.getContext('2d');
        this._clearBuffer(pkb, pkc);
        if (this._status === CvsSpinner.IDLE) {
            const c = this._gui.pickColor(this);
            let rn = 0;
            pkc.save();
            this._reels.forEach(reel => {
                pkc.fillStyle = _rgb$(c.r, c.g, c.b + rn);
                pkc.fillRect(reel.x, reel.y, this._dW, this._dH);
                rn++;
            });
            pkc.restore();
        }
    }
}
/** @hidden */ CvsSpinner.IDLE = 'idle';
/** @hidden */ CvsSpinner.ROLLING = 'rolling';
/** @hidden */ CvsSpinner.COUNTING = 'counting';
/**
 * A single reel
 * @hidden
 */
class Reel {
    constructor(id, x, y) {
        this._id = id;
        this._mag = (10 ** id);
        this._x = x;
        this._y = y;
        this._v = 0;
        this._target = 0;
        this._digit = 0;
    }
    set x(n) { this._x = n; }
    set v(n) { this._v = n; }
    get x() { return this._x; }
    get y() { return this._y; }
    get id() { return this._id; }
    set target(n) { this._target = n; }
    set digit(n) { this._digit = n; }
    get v() { return this._v; }
    get target() { return this._target; }
    get value() { return this._digit * this._mag; }
    get digit() { return this._digit; }
    count(dv, dir) {
        function hit(tgt, t0, t1) {
            return (tgt - t0) * (tgt - t1) < 0;
        }
        const nv = this._v + dv * dir;
        const ct = dir < 0 ? 0 : 9;
        const carry = hit(ct, this._v, nv);
        this._v = (nv + 10) % 10;
        this._digit = dir < 0 ? Math.ceil(this._v) % 10 : Math.floor(this._v);
        return carry;
    }
    roll(dv) {
        function hit(tgt, t0, t1) {
            return (tgt - t0) * (tgt - t1) < 0;
        }
        const dir = _sign(this._target - this._v);
        const nv = this._v + dv * dir;
        const onTarget = dir == 0 || hit(this._target, this._v, nv);
        if (onTarget) {
            this._digit = this._target;
            this._v = this._target;
        }
        else {
            this._v = (nv + 10) % 10;
            this._digit = dir < 0 ? Math.ceil(this._v) % 10 : Math.floor(this._v);
        }
        return onTarget;
    }
    /** @hidden */
    toString() {
        const [id, v, tgt, dgt] = [this._id, this._v, this.target, this.digit];
        return `Reel-${id}  digit: ${dgt}   target: ${tgt}     v: ${v}`;
    }
}
//# sourceMappingURL=spinner.js.map