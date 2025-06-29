/**
 * <p>This class simulates a simple joystick.</p>
 *
 * <p>Use the <code>setAction</code> method to specify the action-method that
 * will be used to process action-info objects created when the joystick is
 * moved.</p>
 *
 * <p>The action-info object has several very useful fields dthat describes
 * the state of the joystick, they include -</p>
 * <ul>
 * <li><code>dead</code></li>
 * <p>If the stick is in the dead zone which surrounds the stick's
 * rest state then this value will be <code>true</code>.</p>
 * <li><code>X</code>, <code>Y</code> and <code>XY</code></li>
 * <p>Early joysticks used mechanical switches had just 9 states. Of these 8
 * are used to represent the direction the joystick is pushed and 1 for the
 * rest state. These variables can be used to detect the current state of
 * the joystick.</p>
 * <pre>
 *      <b>X</b>                                       <b>XY</b>
 * -1   0   +1                              5   6   7
 *   \  |  /   -1                            \  |  /
 *    \ | /                                   \ | /
 *  --- O ---   0   <b>Y</b>      O is the       4 --- O --- 0    <b>XY</b> = -1 when in
 *    / | \                dead zone          / | \         the dead zone.
 *   /  |  \    +1                           /  |  \
 *                                          3   2   1
 * </pre>
 * <li><code>mag</code> and <code>angle</code></li>
 * <p>The joysticks state can also be represented by the distance and angle
 * the stick has been pushed.</p>
 * <ul>
 * <li><code>mag</code> : has a value in range &ge; 0 and &le; 1 representing
 * the distance the stick has been pushed.</li>
 * <li><code>angle</code> : has a value in range &ge; 0 and &lt; 2.Pi
 * representing the angle the stick makes to the poistive x axis in the
 * clockwise direction.</li>
 * </ul>
 * <li><code>final</code> : has the value <code>false</code> if the stick is
 * still being moved and <code>false</code> if the stick has been released.
 * </li>
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
        this._tmrID = undefined;
        this._nSlices = 4;
        this._nRings = 2;
        // Initial values for testing
        this._ang = 0;
        this._td = 0;
        this._ta = 0;
        this._opaque = false;
    }
    /**
     * <p>Apply decoration to the joystick active area</p>
     * @param nslices number of slices
     * @param nrings number of rings
     * @returns this control
     */
    decor(nslices, nrings) {
        this._nSlices = Math.round(nslices);
        this._nRings = Math.round(nrings);
        this.invalidateBuffer();
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
    /** @hidden */
    _updateControlVisual() {
        let b = this._buffer;
        let cs = this._scheme || this._gui.scheme();
        let [tx, ty] = this._getThumbXY();
        const OPAQUE = cs['C_3'];
        const DIAL_FACE = cs['C_1'];
        const DIAL_BORDER = cs['C_7'];
        const ROD = cs['C_7'];
        const THUMB_OFF = cs['C_4'];
        const THUMB_OVER = cs['C_8'];
        const THUMB_STROKE = cs['C_9'];
        const DECOR = cs['C_6'];
        const DEAD_ZONE = cs['T_4'];
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
        // Dial face slices
        if (this._nSlices > 1) {
            let a = 2 * Math.PI / this._nSlices;
            b.push();
            b.stroke(DECOR);
            b.strokeWeight(1.5);
            for (let i = 0; i < this._nSlices; i++) {
                b.line(this._pr0, 0, this._pr1, 0);
                b.rotate(a);
            }
            b.pop();
        }
        // Dial radial ticks
        if (this._nRings > 1) {
            let delta = (this._pr1 - this._pr0) / (this._nRings);
            b.push();
            b.stroke(DECOR);
            b.strokeWeight(1.5);
            b.noFill();
            for (let i = 1; i < this._nRings; i++) {
                let d = this._pr0 + i * delta;
                b.ellipse(0, 0, 2 * d, 2 * d);
            }
            b.pop();
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
    /**
     * <p>See if the position [px, py] is over the control.</p>
     * @hidden
     * @param px horizontal position
     * @param py vertical position
     * @param tol tolerance in pixels
     * @returns 0 if not over the control of &ge;1
     */
    _whereOver(px, py, tol = this._tSize) {
        let [tx, ty] = this._getThumbXY();
        return (Math.abs(tx - px) <= tol && Math.abs(ty - py) <= tol)
            ? 1 : 0;
    }
    /**
     * Converts the polar position to cartesian cooordinates.
     * @hidden
     */
    _getThumbXY() {
        return [this._td * Math.cos(this._ta), this._td * Math.sin(this._ta)];
    }
    /**
     * Converts cartesian to polar cooordinates, constraing the radius to fit
     * the display.
     * @hidden
     */
    _getThumbDA(x, y) {
        let d = Math.sqrt(x * x + y * y);
        d = d < 0 ? 0 : d > this._pr1 ? this._pr1 : d;
        return [d, Math.atan2(y, x)];
    }
    /**
     * Gets a 'value' object representing the current state of the joystick.
     * @hidden
     */
    _getValue() {
        let [tx, ty] = this._getThumbXY();
        let sX = tx < -this._pr0 ? -1 : tx > this._pr0 ? 1 : 0;
        let sY = ty < -this._pr0 ? -1 : ty > this._pr0 ? 1 : 0;
        let ta = this._ta;
        ta = ta >= 0 ? ta : ta + 2 * Math.PI;
        let a = (ta + Math.PI / 8) % (2 * Math.PI);
        let dead = this._td <= this._pr0;
        let sXY = dead ? -1 : Math.floor(4 * a / Math.PI);
        let tm = (this._td - this._pr0) / (this._pr1 - this._pr0);
        tm = tm < 0 ? 0 : tm > 1 ? 1 : tm;
        let v = { X: sX, Y: sY, XY: sXY, mag: tm, angle: ta, dead: dead };
        return v;
    }
    /** @hidden */
    _handleMouse(e) {
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x - this._w / 2;
        let my = this._p.mouseY - pos.y - this._h / 2;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x;
        my = r.y;
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip)
            this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx, my);
        return false;
    }
    /** @hidden */
    _handleTouch(e) {
        e.preventDefault();
        let pos = this.getAbsXY();
        const rect = this._gui._canvas.getBoundingClientRect();
        const t = e.changedTouches[0];
        let mx = t.clientX - rect.left - pos.x - this._w / 2;
        let my = t.clientY - rect.top - pos.y - this._h / 2;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x;
        my = r.y;
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my, 20); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip)
            this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx, my);
    }
    /** @hidden */
    _processEvent(e, ...info) {
        let mx = info[0], my = info[1];
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
                    let r = { source: this, p5Event: e, final: true, ...this._getValue() };
                    this.action(r);
                    this._active = false;
                    this.invalidateBuffer();
                    if (!this._tmrID)
                        this._tmrID = setInterval(() => {
                            this._td -= 0.07 * this._size;
                            if (this._td <= 0) {
                                clearInterval(this._tmrID);
                                this._tmrID = undefined;
                                this._td = 0;
                            }
                            this.invalidateBuffer();
                        }, 25);
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this._active) {
                    [this._td, this._ta] = this._getThumbDA(mx, my);
                    let r = { source: this, p5Event: e, final: false, ...this._getValue() };
                    this.action(r);
                    this.invalidateBuffer();
                }
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
    }
}
//# sourceMappingURL=joystick.js.map