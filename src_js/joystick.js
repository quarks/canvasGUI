/**
 * <p>This class simulates a multi-mode joystick. Each of the three possible
 * modes apply different constraints to the range of movement allowed they
 * are -.</p>
 * <p><code>'X0'</code> : can move in any direction (360&deg;).<br>
 * <code>'X4'</code> : constrained to the 4 main compass directions
 * (N, E, S, W).<br>
 * <code>'X8'</code> : constrained to the 8 main compass directions
 * (N, NE, E, SE, S, SW, W, NW).</p>
 *
 * <p>To handle events use the <code>setAction</code> method to specify
 * the action-method that will be used to process action-info objects
 * created when the joystick is moved.</p>
 * <p>The action-info object has several very useful fields dthat describes
 * the state of the joystick, they include -</p>
 * <p>
 * <ul>
 * <li><code>dir</code></li>
 * <p>An integer that indicates the direction the stick is pushed. The values
 * returned depend on the current mode -</p>
 * <pre>
 * <b>Direction values for X4 and X8 modes</b>
 *      5   6   7
 *       \  |  /
 *        \ | /
 *    4 --- <b>Z</b> --- 0       <b>Z</b> is the dead zone.
 *        / | \
 *       /  |  \          If control is in mode 'X0' or the joystick
 *      3   2   1         position is in the dead zone the the value is -1
 * </pre>
 * <p><code>'X0'</code> : always -1<br>
 * <code>'X4'</code> : 0, 2, 4 or 6<br>
 * <code>'X8'</code> : 0, 1, 2, 3, 4, 5, 6 or 7</p>
 *
 * <li><code>dead</code></li>
 * <p>If the stick is in the dead zone which surrounds the stick's
 * rest state then this value will be <code>true</code>.</p>
 *
 * <li><code>mag</code> : has a value in range &ge; 0 and &le; 1 representing
 * the distance the stick has been pushed.</li>
 *
 * <li><code>angle</code> : has a value in range &ge; 0 and &lt; 2&pi;
 * representing the angle the stick makes to the poistive x axis in the
 * clockwise direction. In modes X4 and X8 the angles will be constrained to
 * the permitted directions.</li>
 *
 * <li><code>final</code> : has the value <code>false</code> if the stick is
 * still being moved and <code>false</code> if the stick has been released.</li>
 * </ul>
 * <p>When the joystick is released it will return back to its rest state
 * i.e. centered.</p>
 * @since 1.1.0
 */
class CvsJoystick extends CvsBufferedControl {
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
        this._size = Math.min(w, h);
        this._pr0 = 0.05 * this._size;
        this._pr1 = 0.40 * this._size;
        this._tSize = Math.max(0.075 * this._size, 6);
        this._mode = 'X0';
        this._mag = 0;
        this._ang = 0;
        this._opaque = false;
        this._tmrID = undefined;
    }
    mode(m) {
        if (!m)
            return this._mode;
        m = m.toUpperCase();
        (m);
        switch (m) {
            case 'X0':
            case 'X4':
            case 'X8':
                if (this._mode != m) {
                    this._mode = m;
                    this.invalidateBuffer();
                }
        }
        return this;
    }
    /**
     * Set the thumb size.
     * @param ts the diameter of the thumb
     * @returns this control
     */
    thumbSize(ts) {
        this._tSize = ts;
        return this;
    }
    /**
     * <p>See if the position [px, py] is over the control.</p>
     * @hidden
     * @param px horizontal position
     * @param py vertical position
     * @param tol tolerance in pixels
     * @returns 0 if not over the control of &ge;1
     */
    _whereOver(px, py, tol = this._tSize) {
        // adjust position to centre of knob
        px -= this._w / 2;
        py -= this._h / 2;
        let [tx, ty] = this._getThumbXY();
        return (Math.abs(tx - px) <= tol && Math.abs(ty - py) <= tol)
            ? 1 : 0;
    }
    /**
     * Converts the polar position to cartesian cooordinates.
     * @hidden
     */
    _getThumbXY() {
        return [this._mag * Math.cos(this._ang), this._mag * Math.sin(this._ang)];
    }
    /**
     * Validates the mouse / touch position based on joystick size and mode.
     * @hidden
     */
    _validateThumbPosition(x, y) {
        let mag = this._p.constrain(Math.sqrt(x * x + y * y), 0, this._pr1);
        let ang = Math.atan2(y, x);
        ang += ang < 0 ? 2 * Math.PI : 0;
        let dead = mag <= this._pr0;
        let dir = -1, da;
        switch (this._mode) {
            case 'X4':
                da = Math.PI / 2;
                dir = Math.floor((ang + da / 2) / da) % 4;
                ang = da * dir;
                dir *= 2;
                break;
            case 'X8':
                da = Math.PI / 4;
                dir = Math.floor((ang + da / 2) / da) % 8;
                ang = da * dir;
                break;
        }
        [this._mag, this._ang, this._dir, this._dead] = [mag, ang, dir, dead];
    }
    /** @hidden */
    _processEvent(e, ...info) {
        /** @hidden */
        function getValue(source, event, fini) {
            let mag = (source._mag - source._pr0) / (source._pr1 - source._pr0);
            return {
                source: source, p5Event: event, final: fini, mag: mag,
                angle: source._ang, dir: source._dir, dead: source._dead,
            };
        }
        let mx = info[0], my = info[1];
        mx -= this._w / 2;
        my -= this._h / 2;
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
                    this._validateThumbPosition(mx, my);
                    this.action(getValue(this, e, true));
                    this._active = false;
                    this.invalidateBuffer();
                    if (!this._tmrID)
                        this._tmrID = setInterval(() => {
                            this._mag -= 0.07 * this._size;
                            if (this._mag <= 0) {
                                clearInterval(this._tmrID);
                                this._tmrID = undefined;
                                this._mag = 0;
                            }
                            this.invalidateBuffer();
                        }, 25);
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this._active) {
                    this._validateThumbPosition(mx, my);
                    this.action(getValue(this, e, false));
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
        let [tx, ty] = [this._mag * Math.cos(this._ang), this._mag * Math.sin(this._ang)];
        const OPAQUE = cs['C_3'];
        const DIAL_FACE = cs['C_1'];
        const DIAL_TINT = cs['T_0'];
        const DIAL_BORDER = cs['C_9'];
        const THUMB_STROKE = cs['C_9'];
        const THUMB_OFF = cs['C_4'];
        const THUMB_OVER = cs['C_6'];
        const ROD = cs['C_7'];
        const MARKERS = cs['C_8'];
        const DEAD_ZONE = cs['T_5'];
        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke();
            b.fill(OPAQUE);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        b.translate(b.width / 2, b.height / 2);
        // dial face background
        b.noStroke();
        b.fill(DIAL_FACE);
        b.ellipse(0, 0, this._pr1 * 2, this._pr1 * 2);
        // dial face highlight
        let s = 0, e = 0.26 * this._size, da = 0;
        b.fill(DIAL_TINT);
        b.noStroke(); //b.stroke(DIAL_TINT); b.strokeWeight(2);
        b.ellipse(0, 0, e * 2, e * 2);
        b.ellipse(0, 0, e * 1.25, e * 1.25);
        // Dial face markers
        b.stroke(MARKERS);
        switch (this._mode) {
            case 'X0':
                s = this._pr1;
                e = 0.33 * this._size;
                da = Math.PI / 8;
                b.push();
                b.strokeWeight(0.75);
                e = 0.3 * this._size;
                for (let i = 0; i < 16; i++) {
                    b.line(s, 0, e, 0);
                    b.rotate(da);
                }
                b.pop();
                break;
            case 'X8':
                s = this._pr0;
                e = 0.33 * this._size;
                da = Math.PI / 4;
                b.push();
                b.strokeWeight(1);
                for (let i = 0; i < 8; i++) {
                    b.line(s, 0, e, 0);
                    b.rotate(da);
                }
                b.pop();
            case 'X4':
                s = this._pr0;
                e = this._pr1;
                da = Math.PI / 2;
                b.push();
                b.strokeWeight(1.5);
                for (let i = 0; i < 4; i++) {
                    b.line(s, 0, e, 0);
                    b.rotate(da);
                }
                b.pop();
                break;
        }
        // Dial border
        b.stroke(DIAL_BORDER);
        b.strokeWeight(Math.max(3, 0.025 * this._size));
        b.noFill();
        b.ellipse(0, 0, this._pr1 * 2, this._pr1 * 2);
        // Dead zone
        b.fill(DEAD_ZONE);
        b.noStroke();
        b.ellipse(0, 0, this._pr0 * 2, this._pr0 * 2);
        // Stick                                                                                    
        b.stroke(ROD);
        b.strokeWeight(this._size * 0.05);
        b.line(0, 0, tx, ty);
        // Thumb
        b.strokeWeight(2);
        b.stroke(THUMB_STROKE);
        if (this._active || this._over > 0)
            b.fill(THUMB_OVER);
        else
            b.fill(THUMB_OFF);
        b.ellipse(tx, ty, this._tSize * 2, this._tSize * 2);
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }
}
Object.assign(CvsJoystick.prototype, processMouse, processTouch);
//# sourceMappingURL=joystick.js.map