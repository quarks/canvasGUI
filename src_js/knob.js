/**
 * <p>This class represents a turnable knob with a surrounding status track
 * (optional). Three modes are available to rotate the knob.</p>
 * <p>Major and minor tick marks can be added to the status track and
 * supports stick-to-ticks if wanted. </p>
 * @since 1.1.0
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
        super(gui, name, x || 0, y || 0, w || 40, h || 40);
        // Mouse / touch mode
        /** @hidden */ this._mode = CvsKnob.X_MODE;
        /** @hidden */ this._sensitivity = 0.005;
        this._size = Math.min(w, h);
        this._turnArc = 2 * Math.PI; // Full turn of 360 degrees
        this._gapPos = 0.5 * Math.PI; // South
        this._tw = 0;
        this._kRad = 0.5 * this._size;
        this._gRad = this._kRad - 4;
        this._opaque = true;
    }
    /**
     * <p>Sets the interaction mode for rotating the knob.</p>
     * <ul>
     * <li><code>'x'</code> : dragging left and right turns the knob anticlockwise and clockwise respectively.</li>
     * <li><code>'y'</code> : dragging down and up turns the knob anticlockwise and clockwise respectively.</li>
     * <li><code>'a'</code> : dragging in a circular motion round the knob center turns the knob to face the drag point.</li>
     * </ul>
     * <p>Rotation is constrained within the maximum turn angle for this knob.</p>
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
     * <p>The default value is 0.005 which equates to a drag distance of 200 pixels
     * and the minimum permitted value is 0.0025 (400 pixels).</p>
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
        tw = this._p.constrain(tw, 6, this._kRad);
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
            this._turnArc = this._p.radians(ang);
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
            this._gapPos = this._p.radians(ang);
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
        function fixAngle(a) {
            return a < 0 ? a + 2 * Math.PI : a;
        }
        let t = this._t01, under = false, over = false;
        switch (this._mode) {
            case CvsKnob.X_MODE:
                t = this._t01 + (x - this._prevX) * this._sensitivity;
                under = (t < 0);
                over = (t > 1);
                t = this._p.constrain(t, 0, 1);
                break;
            case CvsKnob.Y_MODE:
                t = this._t01 - (y - this._prevY) * this._sensitivity;
                under = (t < 0);
                over = (t > 1);
                t = this._p.constrain(t, 0, 1);
                break;
            case CvsKnob.A_MODE:
                let low = Math.PI - this._turnArc / 2;
                let high = 2 * Math.PI - low;
                let ang = fixAngle(Math.atan2(y, x));
                ang = fixAngle(ang - this._gapPos);
                under = ang < low;
                over = ang > high;
                t = this._p.map(ang, low, high, 0, 1, true);
                break;
        }
        return { t: t, under: under, over: over };
    }
    /** @hidden */
    _doEvent(e, x, y, picked) {
        let [mx, my, w, h] = this._orientation.xy(x - this._x, y - this._y, this.w, this.h);
        mx -= w / 2;
        my -= h / 2; // Make relative to knob centre
        let next;
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._prevX = mx;
                this._prevY = my;
                this._active = true;
                this.isOver = true;
                this.invalidateBuffer();
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                next = this._tFromXY(mx, my);
                this._t01 = this._s2ticks ? this._nearestTickT(next.t) : next.t;
                this.action({ source: this, p5Event: e, value: this.value(), final: true });
                this._active = false;
                this.invalidateBuffer();
                break;
            case 'mousemove':
            case 'touchmove':
                if (this._active) {
                    next = this._tFromXY(mx, my);
                    let t01 = this._s2ticks ? this._nearestTickT(next.t) : next.t;
                    if (this._t01 != t01) {
                        this._prevX = mx;
                        this._prevY = my;
                        this._t01 = t01;
                        this.action({ source: this, p5Event: e, value: this.value(), final: false });
                    }
                }
                this.isOver = (this == picked.control);
                this.invalidateBuffer();
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this._active ? this : null;
    }
    /**
     * <p>See if the position [px, py] is over the control.</p>
     * @hidden
     * @param px horizontal position
     * @param py vertical position
     * @param tol knob radius tolerance in pixels
     * @returns 1 if over any part of the knob otherwise return 0
     */
    _whereOver(px, py, tol = 0) {
        // adjust position to centre of knob
        px -= this._w / 2;
        py -= this._h / 2;
        let d2 = px * px + py * py;
        let rt = this._kRad + tol;
        return d2 <= rt * rt ? 1 : 0;
    }
    /** @hidden */
    _updateControlVisual() {
        let cs = this._scheme || this._gui.scheme();
        const OPAQUE = cs['C_3'];
        const GRIP_OFF = cs['C_7'], GRIP_STROKE = cs['C_8'];
        const MARKER = cs['C_3'];
        const HIGHLIGHT = cs['C_9'];
        const TRACK_BACK = cs['C_3'], TRACK_ARC = cs['C_1'];
        const TICKS = cs['G_8'];
        const USED_TRACK = cs['G_2'], UNUSED_TRACK = cs['T_1'];
        let uib = this._uiBfr;
        uib.clear();
        if (this._opaque) {
            uib.noStroke();
            uib.fill(OPAQUE);
            uib.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        let arc = this._turnArc, gap = 2 * Math.PI - arc, lowA = gap / 2;
        let rOut = this._kRad, rIn = this._gRad;
        let dOut = 2 * rOut, dIn = 2 * rIn;
        uib.push();
        uib.translate(uib.width / 2, uib.height / 2);
        uib.rotate(this._gapPos + lowA);
        // Draw full background and track arc
        uib.noStroke();
        uib.fill(TRACK_BACK);
        uib.ellipse(0, 0, dOut, dOut);
        uib.fill(TRACK_ARC);
        uib.arc(0, 0, dOut, dOut, 0, this._turnArc);
        // Draw ticks? 
        let n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            let b0 = this._tw, b1 = 0.65 * b0;
            uib.stroke(TICKS);
            let da = arc / n;
            uib.push();
            {
                uib.strokeWeight(0.9);
                // minor ticks
                for (let i = 0; i <= n; i++) {
                    uib.line(rIn, 0, rIn + b1, 0);
                    uib.rotate(da);
                }
            }
            uib.pop();
            n = this._majorTicks;
            if (n >= 2) {
                let da = arc / n;
                uib.push();
                {
                    uib.strokeWeight(1);
                    // major ticks
                    for (let i = 0; i <= n; i++) {
                        uib.line(rIn, 0, rIn + b0, 0);
                        uib.rotate(da);
                    }
                }
                uib.pop();
            }
            // Unused track
            uib.noStroke();
            uib.fill(UNUSED_TRACK);
            uib.arc(0, 0, dIn + b0, dIn + b0, 0, arc);
            // Unused track
            uib.fill(USED_TRACK);
            uib.arc(0, 0, dIn + b0, dIn + b0, 0, this._t01 * arc);
        }
        // Grip section
        uib.stroke(GRIP_STROKE);
        uib.strokeWeight(1.5);
        uib.fill(GRIP_OFF);
        uib.ellipse(0, 0, dIn, dIn);
        // Grip arrow marker
        uib.push();
        {
            uib.rotate(this._t01 * arc);
            let ms = 0.2 * rIn;
            uib.fill(MARKER);
            uib.noStroke();
            uib.beginShape();
            uib.vertex(-ms, 0);
            uib.vertex(0, -ms);
            uib.vertex(rIn, 0);
            uib.vertex(0, ms);
            uib.endShape(this._p.CLOSE);
        }
        uib.pop();
        // Is over highlight?
        if (this.isOver) {
            uib.noFill();
            uib.stroke(HIGHLIGHT);
            uib.strokeWeight(3);
            uib.arc(0, 0, 2 * this._kRad, 2 * this._kRad, 0, arc);
        }
        this._updateKnobPickBuffer(dOut);
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    _updateKnobPickBuffer(dOut) {
        let c = this._gui.pickColor(this);
        let pkb = this._pkBfr;
        pkb.push();
        pkb.clear();
        pkb.translate(pkb.width / 2, pkb.height / 2);
        pkb.noStroke();
        pkb.fill(c.r, c.g, c.b);
        pkb.ellipse(0, 0, dOut, dOut);
        pkb.pop();
    }
    /** @hidden */
    _minControlSize() {
        return { w: this._size, h: this._size };
    }
}
/** @hidden */ CvsKnob.X_MODE = 1;
/** @hidden */ CvsKnob.Y_MODE = 2;
/** @hidden */ CvsKnob.A_MODE = 3;
//# sourceMappingURL=knob.js.map