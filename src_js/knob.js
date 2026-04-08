/**
 * <p>This class represents a turnable knob with a surrounding status track
 * (optional). Three modes are available to rotate the knob.</p>
 * <p>Major and minor tick marks can be added to the status track and
 * supports stick-to-ticks if wanted. </p>
 */
class CvsKnob extends CvsSlider {
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
        super(gui, name, x, y, w, h);
        // Mouse / touch mode
        /** @hidden */ this._mode = CvsKnob.X_MODE;
        /** @hidden */ this._sensitivity = 0.005;
        this._size = Math.min(w, h);
        this._turnArc = 2 * Math.PI; // Full turn of 360 degrees
        this._gapPos = 0.5 * Math.PI; // South
        this._tw = 0;
        this._kRad = 0.5 * this._size - 2;
        this._gRad = this._kRad - 4;
        this._opaque = true;
    }
    /**
     * <p>Sets the interaction mode for rotating the knob.</p>
     * <ul>
     * <li><code>'x'</code> : dragging left and right turns the knob
     * anticlockwise and clockwise respectively.</li>
     * <li><code>'y'</code> : dragging down and up turns the knob
     * anticlockwise and clockwise respectively.</li>
     * <li><code>'a'</code> : dragging in a circular motion round the
     * knob center turns the knob to face the drag point.</li>
     * </ul>
     * <p>Rotation is constrained within the maximum turn angle for this
     * knob.</p>
     * <p>Any other parameter value is ignored and the mode is unchanged.</p>
     *
     * @param mode 'x', 'y' or 'a'
     * @returns this control
     */
    mode(mode) {
        switch (mode) {
            case 'x':
                this._mode = CvsKnob.X_MODE;
                break;
            case 'y':
                this._mode = CvsKnob.Y_MODE;
                break;
            case 'a':
                this._mode = CvsKnob.A_MODE;
                break;
        }
        return this;
    }
    /**
     * <p>Only applies to modes 'x' and 'y'. It controls how far the knob
     * rotates for a given drag distance.</p>
     * <p>The drag distance needed to rotate the knob by the maximum turn
     * angle is the reciprocal of the parameter value i.e. <code>1.0 / sens</code>.</p>
     * <p>The default value is 0.005 which equates to a drag distance of 200
     * pixels and the minimum permitted value is 0.0025 (400 pixels).</p>
     *
     * @param svty &ge;0.0025
     * @returns this control
     */
    sensitivity(svty) {
        if (svty != 0) {
            let sgn = svty < 0 ? -1 : 1;
            let mag = Math.abs(svty);
            this._sensitivity = sgn * (mag < 0.0025 ? 0.0025 : mag);
        }
        return this;
    }
    /**
     * <p>Sets the width of the track surrounding the central knob-grip. The
     * value will be constrained so the minimum width is 6 pixels upto
     * the radius of the knob.</p>
     * <p>The track is used to display current value bar as well as any user
     * specified ticks.</p>
     *
     * @param tw the width of the value track
     * @returns this control
     */
    track(tw) {
        tw = _constrain(tw, 6, this._kRad);
        this._gRad = this._kRad - tw;
        this._tw = tw;
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Sets the maximum angle the knob can be turned in degrees. Angles
     * outside the range &gt;0&deg; and &le;360&deg; will be ignored and
     * the current turn angle is unchanged.</p>
     * @param ang max.turn angle &gt;0 and &le;360 degrees
     * @returns this control
     */
    turnAngle(ang) {
        if (ang > 0 && ang <= 360) {
            this._turnArc = _radians(ang);
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * <p>If the turn angle is &lt 360&deg; then there will be an 'unused'
     * section of track. This is called the gap and this method sets the
     * position of the gap center effectively rotating the whole knob.</p>
     * <p>The angle is 0&deg; along positive x-axis and increases clockwise.
     * The default value is 90&deg; which means the gap center is facing
     * south.</p>
     *
     * @param ang must be in the range &ge; 0 and &le; 360
     * @returns this control
     */
    gap(ang) {
        if (ang >= 0 && ang <= 360) {
            this._gapPos = _radians(ang);
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * Converts XY position to a parmetric value in the range
     * 0 and 1 inclusive.
     *
     * @hidden
     */
    _tFromXY(x, y) {
        let t = this._t01, under = false, over = false;
        switch (this._mode) {
            case CvsKnob.X_MODE:
                t = this._t01 + (x - this._prevX) * this._sensitivity;
                under = (t < 0);
                over = (t > 1);
                t = _constrain(t, 0, 1);
                break;
            case CvsKnob.Y_MODE:
                t = this._t01 - (y - this._prevY) * this._sensitivity;
                under = (t < 0);
                over = (t > 1);
                t = _constrain(t, 0, 1);
                break;
            case CvsKnob.A_MODE:
                let low = Math.PI - this._turnArc / 2;
                let high = 2 * Math.PI - low;
                let ang = _fixAngle2Pi(Math.atan2(y, x) - this._gapPos - this._deltaA);
                under = ang < low;
                over = ang > high;
                t = _map(ang, low, high, 0, 1, true);
                break;
        }
        return { t: t, under: under, over: over };
    }
    /** @hidden */
    _angFromT(t) {
        let low = Math.PI - this._turnArc / 2;
        let high = 2 * Math.PI - low;
        return _map(t, 0, 1, low, high);
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let [mx, my, w, h] = this._orientation.xy(x - this._x, y - this._y, this.w, this.h);
        mx -= w / 2;
        my -= h / 2; // Make relative to knob centre
        let next;
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._prevX = mx;
                this._prevY = my;
                this._deltaA = _fixAngle2Pi(Math.atan2(my, mx) - this._gapPos - this._angFromT(this._t01));
                this._active = true;
                this.over = true;
                this.invalidateBuffer();
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                next = this._tFromXY(mx, my);
                this._t01 = this._s2ticks ? this._nearestTickT(next.t) : next.t;
                this.action({ source: this, event: e, value: this.value(), final: true });
                this._active = false;
                this.invalidateBuffer();
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    next = this._tFromXY(mx, my);
                    let t01 = this._s2ticks ? this._nearestTickT(next.t) : next.t;
                    if (this._t01 != t01) {
                        this._prevX = mx;
                        this._prevY = my;
                        this._t01 = t01;
                        this.action({ source: this, event: e, value: this.value(), final: false });
                    }
                }
                this.over = (this == over.control);
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
    _updateControlVisual() {
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        let cs = this.SCHEME;
        let cnrs = this.CNRS;
        const OPAQUE = cs.C$(3, this._alpha);
        const GRIP_OFF = cs.C$(7);
        const GRIP_STROKE = cs.C$(8);
        const MARKER = cs.C$(3);
        const HIGHLIGHT = cs.C$(9);
        const TRACK_BACK = cs.C$(3);
        const TRACK_ARC = cs.C$(1);
        const TICKS = cs.G$(8);
        const USED_TRACK = cs.G$(2);
        const UNUSED_TRACK = cs.T$(2);
        uic.save();
        if (this._opaque) {
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.fill();
        }
        let arc = this._turnArc, gap = 2 * Math.PI - arc, lowA = gap / 2;
        let rTrack = (this._kRad + this._gRad) / 2;
        uic.save();
        uic.translate(uib.width / 2, uib.height / 2);
        uic.rotate(this._gapPos + lowA);
        // Draw full background 
        uic.fillStyle = TRACK_BACK;
        uic.beginPath();
        uic.ellipse(0, 0, this._kRad, this._kRad, 0, 0, 2 * Math.PI);
        uic.fill();
        uic.fillStyle = TRACK_ARC;
        uic.beginPath();
        uic.moveTo(0, 0);
        uic.arc(0, 0, this._kRad, 0, this._turnArc, false);
        uic.closePath();
        uic.fill();
        // Unused track
        uic.fillStyle = UNUSED_TRACK;
        uic.beginPath();
        uic.moveTo(0, 0);
        uic.arc(0, 0, rTrack, 0, this._turnArc, false);
        uic.closePath();
        uic.fill();
        // Used track
        uic.fillStyle = USED_TRACK;
        uic.beginPath();
        uic.moveTo(0, 0);
        uic.arc(0, 0, rTrack, 0, this._t01 * arc, false);
        uic.closePath();
        uic.fill();
        // Draw ticks? 
        let n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            let mjrTickLen = this._kRad;
            let mnrTickLen = this._gRad + 0.65 * (this._kRad - this._gRad);
            uic.strokeStyle = TICKS;
            let da = arc / n;
            uic.save();
            uic.lineWidth = 1;
            // minor ticks
            uic.beginPath();
            for (let i = 0; i <= n; i++) {
                uic.moveTo(0, 0);
                uic.lineTo(mnrTickLen, 0);
                uic.rotate(da);
            }
            uic.stroke();
            uic.restore();
            n = this._majorTicks;
            if (n >= 2) {
                let da = arc / n;
                uic.save();
                uic.beginPath();
                uic.lineWidth = 1.2;
                // major ticks
                for (let i = 0; i <= n; i++) {
                    uic.moveTo(0, 0);
                    uic.lineTo(mjrTickLen, 0);
                    uic.rotate(da);
                }
                uic.stroke();
                uic.restore();
            }
        }
        // Grip section
        uic.strokeStyle = GRIP_STROKE;
        uic.lineWidth = 1.5;
        uic.fillStyle = GRIP_OFF;
        uic.beginPath();
        uic.ellipse(0, 0, this._gRad, this._gRad, 0, 0, 2 * Math.PI);
        uic.fill();
        uic.stroke();
        // Grip arrow marker
        uic.save();
        uic.rotate(this._t01 * arc);
        let ms = 0.2 * this._gRad;
        uic.fillStyle = MARKER;
        uic.beginPath();
        uic.moveTo(-ms, 0);
        uic.lineTo(0, -ms);
        uic.lineTo(this._gRad, 0);
        uic.lineTo(0, ms);
        uic.closePath();
        uic.fill();
        uic.restore();
        // Is over highlight?
        if (this.over) {
            uic.strokeStyle = HIGHLIGHT;
            uic.lineWidth = 3;
            uic.beginPath();
            uic.arc(0, 0, this._kRad, 0, arc);
            uic.stroke();
        }
        this._updatePickBuffer();
        uic.restore();
        if (!this._enabled)
            this._disable_highlight(cs, 0, 0, this._w, this._h);
        this._bufferInvalid = false; // Now the buffer is valid
    }
    /** @hidden */
    _updatePickBuffer() {
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        let c = this._gui.pickColor(this);
        pkc.save();
        pkc.translate(this._w / 2, this._h / 2);
        // Background
        pkc.fillStyle = c.cssColor;
        pkc.ellipse(0, 0, this._kRad, this._kRad, 0, 0, 2 * Math.PI);
        pkc.fill();
        pkc.restore();
    }
    /** @hidden */ orient(a) { return this.warn$('orient'); }
}
/** @hidden */ CvsKnob.X_MODE = 1;
/** @hidden */ CvsKnob.Y_MODE = 2;
/** @hidden */ CvsKnob.A_MODE = 3;
//# sourceMappingURL=knob.js.map