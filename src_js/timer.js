/**
 * <h2>Performs a user-defined action after a specified time.</h2>
 *
 * <p>This control is invisible when it is created and waits until it is
 * needed. Before starting the control the user-defined action must be
 * specified using the <code>setAction</code> method.</p>
 * <p>The timer is reusable and the user-defined action can be changed
 * between uses.</p>
 *
 * <p>The <code>start</code> method initiaties the timer and sets its duration.
 * It also allows the user to set the time the control is visible before
 * (lead-time) and after (lag-time) the timer runs (ticks).<p>
 *
 * <p>The shape of the timer is <b>round</b> if the user sets the control's
 * width and height equal otherwise it will display as a horizontal
 * <b>bar</b>.</b>
 *
 * <p>By default the timer does not respond to ui events but the can be
 * changed with the <code>uiResponse</code> method.</p>
 */
class CvsTimer extends CvsBufferedControl {
    /**
     *
     * @param gui the gui controller
     * @param name unique name for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @hidden
     */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h, true);
        this.corners(Math.min(w, h) / 3);
        this._dir = CvsTimer.FORWARD;
        this._timer = 0;
        this._uiReaction = CvsTimer.IGNORE;
        this._cssFont = this._getFont();
        this._reset();
    }
    /**
     * <p>Returns the proportion of the duration time used in the range
     * 0.0 to 1.0</p>
     *
     * @readonly
     * @type {number}
     */
    get t() { return this._t; }
    /** <p>A string indicating the current state of the timer </p>
     * <ul>
     * <li><b>idle</b> the timer is waiting to be initiated.</li>
     * <li><b>initiated</b> the timer has been initiated and is ready to start ticking.</li>
     * <li><b>ticking</b> the timer is ticking.</li>
     * <li><b>paused</b> the ticking has been paused until resumed.</li>
     * <li><b>finished</b> the timer has finished ticking.</li>
     * </ul>
    */
    get status() { return this._status; }
    /**
     * Describes the shape of the timer and returns either "round" or "bar".
     *
     * @readonly
     * @type {("round" | "bar")}
     */
    get shape() { return this._w === this._h ? 'round' : 'bar'; }
    /**
     * Describes what happens when the user clicks on the timer.
     *
     * @readonly
     * @type {string}
     */
    get ui_mode() { return this._uiReaction; }
    /**
     * The control fills with a dark color as the timer runs.
     *
     * @returns this control
     */
    forward() {
        if (this._status === CvsTimer.IDLE)
            this._dir = CvsTimer.FORWARD;
        return this;
    }
    /**
     * The control starts filled with a darker color buts empties as the timer
     * runs.
     *
     * @returns this control
     */
    reverse() {
        if (this._status === CvsTimer.IDLE)
            this._dir = CvsTimer.REVERSE;
        return this;
    }
    /**
     * <p>Sets the response when the user clicks on the timer.</p>
     * <ul>
     * <li><b>ignore</b> do nothing.</li>
     * <li><b>pause</b> pause the timer, the next click will resume the timer.</li>
     * <li><b>cancal</b> immediately cancel the timer making it invisible. No
     * event will be fired.</li>
     * </ul>
     * @param response 'ignore', 'pause' or 'cancel;
     * @returns this control
     */
    uiReaction(response = 'ignore') {
        if (this._status === CvsTimer.IDLE) {
            switch (response) {
                case 'pause':
                case 'cancel':
                    this._uiReaction = response;
                    break;
                default:
                    this._uiReaction = CvsTimer.IGNORE;
            }
        }
        return this;
    }
    /**
     * <p>This will initiate the timer and make it visible. The user must
     * specify the duration but the time to remain visible before and after
     * the timer is running (ticking) is optional, the default being 0ms.</p>
     *
     * @param duration the timer duration (millisecnds)
     * @param leadTime time the control is visible before the timer starts
     * @param lagTime time the control is visible after the timer ends
     */
    start(duration, leadTime = 0, lagTime = 0) {
        this._runTime = duration;
        this._leadTime = leadTime;
        this._lagTime = lagTime;
        if (this._status === CvsTimer.IDLE) {
            this._status = CvsTimer.INITIATED;
            this.invalidateBuffer();
            this.show(true);
            this._t = 0;
            this._startedAt = performance.now();
            this._timer = setInterval(() => { this._update(); }, 12);
        }
        return this;
    }
    /**
     * <p>Will pause the control if the timer is ticking and the ui response
     * type allows for pausing.</p>
     *
     * @returns this control
     */
    pause() {
        if (this._uiReaction == CvsTimer.PAUSE && this._status === CvsTimer.TICKING) {
            this._status = CvsTimer.PAUSED;
            this._pausedAt = performance.now();
        }
        return this;
    }
    /**
     * <p>Will resume a paused timer.</p>
     *
     * @returns this control
     */
    resume() {
        if (this._uiReaction == CvsTimer.PAUSE && this._status === CvsTimer.PAUSED) {
            this._status = CvsTimer.TICKING;
            this._startedAt += (performance.now() - this._pausedAt);
        }
        return this;
    }
    /**
     * <p>Will cancel and hide the timer if it is <em>not idle</em> and the
     * ui response type allows for cancelling.</p>
     *
     * @returns this control
     */
    cancel() {
        if (this._uiReaction == CvsTimer.CANCEL && this._status !== CvsTimer.IDLE) {
            this._reset();
        }
        return this;
    }
    /**
     * Resets the timer attributes to make it idle.
     * @returns this control
     * @hidden
     */
    _reset() {
        clearInterval(this._timer);
        this._t = 0;
        this._startedAt = 0;
        this._pausedAt = 0;
        this._leadTime = 0;
        this._runTime = 0;
        this._lagTime = 0;
        this._status = CvsTimer.IDLE;
        this._uiText = '';
        this.hide(true);
        this.invalidateBuffer();
        return this;
    }
    /**
     * Calculate a suitable font height based on the controls width and
     * height and create a CSS font descriptor string.
     * @hidden
     */
    _getFont() {
        const uic = this._uicBuffer.getContext('2d');
        uic.save();
        let font;
        let ts = 0.6 * this._h;
        let found = false;
        do {
            font = cssFont$('sans-serif', ts, 'bold');
            uic.font = font;
            found = textMetrics(uic, 'RESUME').tWidth < 0.8 * this._w;
            ts *= 0.90;
        } while (!found);
        uic.restore();
        return font;
    }
    /**
     * This returns the ui resposes prompt text (if any) based on
     * the times current status.
     * @hidden
     */
    _getUiResponseString() {
        let str = '';
        switch (this._status) {
            case CvsTimer.PAUSED:
                str = 'RESUME';
                break;
            case CvsTimer.TICKING:
                if (this._uiReaction == CvsTimer.CANCEL)
                    str = 'CANCEL';
                else if (this._uiReaction == CvsTimer.PAUSE)
                    str = 'PAUSE';
                break;
        }
        return str;
    }
    /** @hidden */
    _updateControlVisual() {
        function drawBar(status, t) {
            uic.fillStyle = BACK;
            uic.beginPath();
            uic.roundRect(0, 0, w, h, cnrs);
            uic.fill();
            if (status !== CvsTimer.IDLE) {
                const bw = Math.min(3, w * 0.1), barW = w - 2 * bw;
                const bh = Math.min(3, h * 0.1), barH = h - 2 * bh;
                const p = _map(t, 0, 1, 0, barW, true);
                uic.fillStyle = FORE;
                uic.beginPath();
                uic.roundRect(bw, bh, p, barH, cnrs);
                uic.fill();
            }
        }
        function barHighlight() {
            uic.strokeStyle = HIGHLIGHT;
            uic.lineWidth = 2.5;
            uic.beginPath();
            uic.roundRect(1, 1, w - 2, h - 2, cnrs);
            uic.stroke();
        }
        function roundHighlight() {
            const cp = w / 2, r = w / 2;
            uic.strokeStyle = HIGHLIGHT;
            uic.lineWidth = 2.5;
            uic.beginPath();
            uic.arc(cp, cp, r - 2, 0, 2 * Math.PI);
            uic.stroke();
        }
        function drawRound(status, t) {
            const cp = w / 2, r = w / 2;
            uic.fillStyle = BACK;
            uic.beginPath();
            uic.arc(cp, cp, r, 0, 2 * Math.PI);
            uic.fill();
            if (status !== CvsTimer.IDLE) {
                const sa = 1.5 * Math.PI;
                const ea = sa + t * 2 * Math.PI;
                uic.fillStyle = FORE;
                uic.beginPath();
                uic.moveTo(cp, cp);
                uic.arc(cp, cp, r - 4, sa, ea);
                uic.moveTo(cp, cp);
                uic.fill();
            }
        }
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        this._clearBuffer(uib, uic);
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const BACK = cs.C$(1);
        const FORE = cs.C$(4);
        const TEXT = cs.C$(9);
        const HIGHLIGHT = cs.C$(9);
        const [w, h] = [this._w, this._h];
        uic.save();
        // Draw control background
        const t = this._dir === CvsTimer.FORWARD ? this._t : 1 - this._t;
        if (w !== h)
            drawBar(this._status, t);
        else
            drawRound(this._status, t);
        // Draw status text
        let str = this._getUiResponseString();
        if (str.length > 0) {
            uic.save();
            const tm = textMetrics(uic, str);
            let px = w / 2;
            let py = (tm.fHeight + h) / 2;
            uic.font = this._cssFont;
            uic.textAlign = 'center';
            uic.textBaseline = 'alphabetic';
            uic.lineWidth = 3;
            uic.strokeStyle = BACK;
            uic.fillStyle = TEXT;
            uic.strokeText(str, px, py);
            uic.fillText(str, px, py);
            uic.restore();
        }
        // Mouse over border highlight
        if (this.isActive || this.over) {
            if (w !== h)
                barHighlight();
            else
                roundHighlight();
        }
        // Update pick buffer before restoring
        if (this._uiReaction != CvsTimer.IGNORE)
            this._updatePickBuffer(w, h);
        uic.restore();
        // The last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _updatePickBuffer(w, h) {
        const pkb = this._pkcBuffer;
        const pkc = pkb.getContext('2d');
        this._clearBuffer(pkb, pkc);
        let c = this._gui.pickColor(this);
        CLOG(c.cssColor);
        pkc.save();
        pkc.fillStyle = c.cssColor;
        pkc.beginPath();
        if (w != h)
            pkc.roundRect(0, 0, w, h, this.CNRS);
        else
            pkc.arc(w / 2, w / 2, w / 2, 0, 2 * Math.PI);
        pkc.fill();
        pkc.restore();
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        if (this._uiReaction == CvsTimer.IGNORE) {
            this._active = false;
            return null;
        }
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this._clickAllowed = true; // false if mouse moves
                this.over = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    if (this._clickAllowed) {
                        if (this._uiReaction == CvsTimer.PAUSE) {
                            if (this._status === CvsTimer.PAUSED)
                                this.resume();
                            else if (this._status === CvsTimer.TICKING)
                                this.pause();
                        }
                        else {
                            this.cancel();
                        }
                    }
                    this._active = false;
                }
                this._clickAllowed = false;
                this.over = false;
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                this.over = (this == over.control);
                this._tooltip?._updateState(enter);
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /**
     * When the timer is not idle this method is called approximately
     * every 12 ms to update the timers runtime and status.
     * @hidden
     */
    _update() {
        const time = performance.now();
        let et = time - this._startedAt;
        switch (this._status) {
            case CvsTimer.INITIATED:
                if (et > this._leadTime) {
                    this._startedAt += et;
                    this._status = CvsTimer.TICKING;
                    this.invalidateBuffer();
                }
                break;
            case CvsTimer.TICKING:
                if (et > this._runTime) {
                    this._startedAt += et;
                    this._status = CvsTimer.FINISHED;
                    this.action({ source: this, event: undefined });
                }
                this.invalidateBuffer();
                this._t = Math.min(et / this._runTime, 1);
                break;
            case CvsTimer.FINISHED:
                if (et > this._lagTime)
                    this._reset();
                this.invalidateBuffer();
                break;
        }
    }
    // Hide these methods from typeDoc
    /** @hidden */ transparent() { return this.warn$('tansparent'); }
    /** @hidden */ opaque() { return this.warn$('opaque'); }
    /** @hidden */ shrink(a, b) { return this.warn$('shrink'); }
    /** @hidden */ enable() { return this.warn$('enable'); }
    /** @hidden */ disable() { return this.warn$('disable'); }
}
// Status constants
/** @hidden */ CvsTimer.IDLE = 'idle';
/** @hidden */ CvsTimer.INITIATED = 'initiated';
/** @hidden */ CvsTimer.FINISHED = 'finished';
/** @hidden */ CvsTimer.TICKING = 'ticking';
/** @hidden */ CvsTimer.PAUSED = 'paused';
// Direction constants
/** @hidden */ CvsTimer.FORWARD = 1;
/** @hidden */ CvsTimer.REVERSE = 2;
// User interaction
/** @hidden */ CvsTimer.IGNORE = 'ignore';
/** @hidden */ CvsTimer.PAUSE = 'pause';
/** @hidden */ CvsTimer.CANCEL = 'cancel';
//# sourceMappingURL=timer.js.map