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

    /** @hidden */ protected _size: number;
    // Pixel radii for active size
    /** @hidden */ protected _pr0: number;
    /** @hidden */ protected _pr1: number;
    // Thumb size and polar position
    /** @hidden */ protected _tSize: number;
    /** @hidden */ protected _mag: number;
    /** @hidden */ protected _ang: number;
    /** @hidden */ protected _dir: number;
    /** @hidden */ protected _dead: boolean;

    // Mode either 0 (free) or 4, 8 (constrained
    /** @hidden */ protected _mode: string;
    // Restore timer
    /** @hidden */ protected _tmrID: any;

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
        super(gui, name, x || 0, y || 0, w || 40, h || 40);
        this._size = Math.min(w, h);
        this._pr0 = 0.05 * this._size; this._pr1 = 0.40 * this._size;
        this._tSize = Math.max(0.075 * this._size, 6);
        this._mode = 'X0';
        this._mag = 0;
        this._ang = 0;
        this._opaque = false;
        this._tmrID = undefined;
    }

    mode(m: string): CvsBaseControl | string {
        if (!m) return this._mode;
        m = m.toUpperCase();
        switch (m) {
            case 'X0': case 'X4': case 'X8':
                if (this._mode != m) {
                    this._mode = m; this.invalidateBuffer();
                }
        }
        return this;
    }

    /**
     * Set the thumb size. 
     * @param ts the diameter of the thumb
     * @returns this control
     */
    thumbSize(ts: number) {
        this._tSize = ts;
        return this;
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
    _validateThumbPosition(x: number, y: number) {
        let mag = this._p.constrain(Math.sqrt(x * x + y * y), 0, this._pr1);
        let ang = Math.atan2(y, x);
        ang += ang < 0 ? 2 * Math.PI : 0;
        let dead = mag <= this._pr0;
        let dir = -1, da: number;
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
    _doEvent(e: MouseEvent | TouchEvent, x: number, y: number, picked: any): CvsBufferedControl {
        /** @hidden */
        function getValue(source: CvsJoystick, event: any, fini: boolean) {
            let mag = (source._mag - source._pr0) / (source._pr1 - source._pr0);
            return {
                source: source, p5Event: event, final: fini, mag: mag,
                angle: source._ang, dir: source._dir, dead: source._dead,
            }
        }
        let [mx, my, w, h] = this._orientation.xy(x - this._x, y - this._y, this.w, this.h);
        mx -= w / 2; my -= h / 2;  // Make relative to joystick centre
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this.isActive = true;
                this._part = picked.part;
                this.isOver = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                this._validateThumbPosition(mx, my);
                this.action(getValue(this, e, true));
                this.isActive = false;
                this.invalidateBuffer();
                if (!this._tmrID)
                    this._tmrID = setInterval(() => {
                        this._mag -= 0.07 * this._size;
                        if (this._mag <= 0) {
                            clearInterval(this._tmrID);
                            this._tmrID = undefined; this._mag = 0;
                        }
                        this.invalidateBuffer();
                    }, 25);
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    this._validateThumbPosition(mx, my);
                    this.action(getValue(this, e, false));
                }
                this.isOver = (this == picked.control);
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
    _updateControlVisual(): void { // CvsStick
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

        let uib = this._uiBfr;
        uib.push();
        uib.clear();
        if (this._opaque) {
            uib.noStroke(); uib.fill(OPAQUE);
            uib.rect(0, 0, this._w, this._h,
                this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        uib.translate(uib.width / 2, uib.height / 2);
        // dial face background
        uib.noStroke(); uib.fill(DIAL_FACE);
        uib.ellipse(0, 0, this._pr1 * 2, this._pr1 * 2);
        // dial face highlight
        let s = 0, e = 0.26 * this._size, da = 0;
        uib.fill(DIAL_TINT); uib.noStroke() //b.stroke(DIAL_TINT); b.strokeWeight(2);
        uib.ellipse(0, 0, e * 2, e * 2);
        uib.ellipse(0, 0, e * 1.25, e * 1.25);
        // Dial face markers
        uib.stroke(MARKERS);
        switch (this._mode) {
            case 'X0':
                s = this._pr1; e = 0.33 * this._size; da = Math.PI / 8;
                uib.push();
                uib.strokeWeight(0.75);
                e = 0.3 * this._size;
                for (let i = 0; i < 16; i++) {
                    uib.line(s, 0, e, 0); uib.rotate(da);
                }
                uib.pop();
                break;
            case 'X8':
                s = this._pr0; e = 0.33 * this._size; da = Math.PI / 4;
                uib.push();
                uib.strokeWeight(1);
                for (let i = 0; i < 8; i++) {
                    uib.line(s, 0, e, 0); uib.rotate(da);
                }
                uib.pop();
            case 'X4':
                s = this._pr0; e = this._pr1; da = Math.PI / 2;
                uib.push();
                uib.strokeWeight(1.5);
                for (let i = 0; i < 4; i++) {
                    uib.line(s, 0, e, 0); uib.rotate(da);
                }
                uib.pop();
                break;
        }
        // Dial border
        uib.stroke(DIAL_BORDER); uib.strokeWeight(Math.max(3, 0.025 * this._size)); uib.noFill();
        uib.ellipse(0, 0, this._pr1 * 2, this._pr1 * 2);
        // Dead zone
        uib.fill(DEAD_ZONE); uib.noStroke();
        uib.ellipse(0, 0, this._pr0 * 2, this._pr0 * 2);
        // Stick                                                                                    
        uib.stroke(ROD); uib.strokeWeight(this._size * 0.05);
        uib.line(0, 0, tx, ty);
        // Thumb
        uib.strokeWeight(2); uib.stroke(THUMB_STROKE);
        if (this.isActive || this._over > 0)
            uib.fill(THUMB_OVER);
        else
            uib.fill(THUMB_OFF);
        uib.ellipse(tx, ty, this._tSize * 2, this._tSize * 2);

        this._updateJoystickPickBuffer(tx, ty, this._tSize);
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */
    _updateJoystickPickBuffer(tx: number, ty: number, tSize: number) {
        let c = this._gui.pickColor(this);
        let pkb = this._pkBfr;
        pkb.push();
        pkb.clear();
        pkb.translate(pkb.width / 2, pkb.height / 2);
        pkb.noStroke();
        pkb.fill(c.r, c.g, c.b);
        pkb.ellipse(tx, ty, tSize * 2, tSize * 2);
        pkb.pop();
    }

}
