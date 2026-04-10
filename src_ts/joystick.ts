/**
 * <h2>A multi-mode Joystick control</h2>
 * <p>This class simulates a multi-mode joystick. Each of the three possible
 * modes apply different constraints to the range of movement allowed they 
 * are -</p>
 * <p><code>'X0'</code> : can move in any direction (360&deg;). This is the default value.<br>
 * <code>'X4'</code> : constrained to the 4 main compass directions 
 * (N, E, S, W).<br>
 * <code>'X8'</code> : constrained to the 8 main compass directions 
 * (N, NE, E, SE, S, SW, W, NW).</p>
 * 
 * <p>To handle events use the <code>setAction</code> method to specify 
 * the action-method that will be used to process action-info objects 
 * created when the joystick is moved.</p>
 * <p>The action-info object has several very useful fields that describes 
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
 *      3   2   1         position is in the dead zone then the value is -1
 * </pre>
 * <p><code>'X0'</code> : always -1<br>
 * <code>'X4'</code> : 0, 2, 4 or 6<br>
 * <code>'X8'</code> : 0, 1, 2, 3, 4, 5, 6 or 7</p>
 * 
 * <li><code>dead</code></li>
 * <p>If the stick is in the dead zone which surrounds the stick's
 * rest state then this value will be <code>true</code>.</p>
 * 
 * <li><code>mag</code></li>
 * <p>The magnitude is in range &ge; 0 and &le; 1 representing
 * the distance the stick has been pushed.</p> 
 * 
 * <li><code>angle</code>
 * <p>The angle is in range &ge; 0 and &lt; 2&pi; 
 * representing the angle the stick makes to the poistive x axis in the 
 * clockwise direction. In modes X4 and X8 the angles will be constrained to 
 * the permitted directions.</p>
 * 
 * <li><code>final</code></li>
 * <p>This is <code>false</code> if the stick is still being moved and 
 * <code>true</code> if the stick has been released.</p>
 * </ul>
 * <p>When the joystick is released it will return back to its rest state 
 * i.e. centered.</p>
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
    /** @hidden */ protected _dir!: number;
    /** @hidden */ protected _dead!: boolean;

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
        super(gui, name, x, y, w, h, true);
        this._size = Math.min(w, h);
        this._pr0 = 0.05 * this._size; this._pr1 = 0.40 * this._size;
        this._tSize = Math.max(0.075 * this._size, 6);
        this._mode = 'X0';
        this._mag = 0;
        this._ang = 0;
        this._opaque = false;
        this._tmrID = undefined;
    }

    /**
     * The mode defines the constraints applied to movement of the joystick. There are three
     * permitted modes -<p>
     * <ul>
     * <li>'X0' : can move in any direction (360&deg;). This is the default value.</li>
     * <li>'X4' : constrained to the 4 main compass directions (N, E, S, W).</li>
     * <li>'X8' : constrained to the 8 main compass directions (N, NE, E, SE, S, SW, W, NW).</li>
     * </ul>
     * <p>Any other value will be silently ignored.</p>
     * @param m either 'X0', 'X4' or 'X8'
     * @returns this control
     */
    mode(m: string): CvsControl | string {
        if (!m) return this._mode;
        m = m.toUpperCase();
        switch (m) {
            case 'X0': case 'X4': case 'X8':
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
        let mag = _constrain(Math.sqrt(x * x + y * y), 0, this._pr1);
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
    _doEvent(e: MouseEvent | TouchEvent, x = 0, y = 0, over: any, enter: boolean): any {
        /** @hidden */
        function getValue(source: CvsJoystick, event: any, fini: boolean) {
            let mag = (source._mag - source._pr0) / (source._pr1 - source._pr0);
            return {
                source: source, event: event, final: fini, mag: mag,
                angle: source._ang, dir: source._dir, dead: source._dead,
            }
        }
        let [mx, my, w, h] = this._orientation.xy(x - this._x, y - this._y, this.w, this.h);
        mx -= w / 2; my -= h / 2;  // Make relative to joystick centre
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this.over = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                this._validateThumbPosition(mx, my);
                this.action(getValue(this, e, true));
                this._active = false;
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
    _updateControlVisual(): void { // CvsStick
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic) return;
        this._clearBuffer(uib, uic);

        let cs = this.SCHEME;
        let cnrs = this.CNRS;
        let [tx, ty] =
            [this._mag * Math.cos(this._ang), this._mag * Math.sin(this._ang)];

        const OPAQUE = cs.C$(3, this._alpha); //cs.C(3, this._alpha);
        const DIAL_FACE = cs.C$(1);
        const DIAL_TINT = cs.T$(0);
        const DIAL_BORDER = cs.C$(9);
        const THUMB_STROKE = cs.C$(9);
        const THUMB_OFF = cs.C$(4);
        const THUMB_OVER = cs.C$(6);
        const ROD = cs.C$(7);
        const MARKERS = cs.C$(8);
        const DEAD_ZONE = cs.T$(2);

        uic.save();
        if (this._opaque) {
            uic.beginPath();
            uic.fillStyle = OPAQUE;
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.fill();
        }
        uic.translate(uib.width / 2, uib.height / 2);
        // dial face background
        uic.beginPath();
        uic.fillStyle = DIAL_FACE;
        uic.ellipse(0, 0, this._pr1, this._pr1, 0, 0, 2 * Math.PI);
        uic.fill();
        // dial face highlight
        let s = 0, e = 0.26 * this._size, da = 0;
        uic.beginPath();
        uic.fillStyle = DIAL_TINT;
        uic.ellipse(0, 0, e, e, 0, 0, 2 * Math.PI);
        uic.ellipse(0, 0, e * 0.625, e * 0.625, 0, 0, 2 * Math.PI);
        uic.fill();
        // Dial face markers

        uic.strokeStyle = MARKERS;
        switch (this._mode) {
            case 'X0':
                uic.beginPath();
                s = this._pr1; da = Math.PI / 8;
                let r = [0.6, 0.22, 0.35, 0.22];
                uic.save();
                uic.lineWidth = 0.75;
                for (let i = 0; i < 16; i++) {
                    e = s * r[i % 4];
                    uic.moveTo(s, 0)
                    uic.lineTo(s - e, 0);
                    uic.rotate(da);
                }
                uic.stroke();
                uic.restore();
                break;
            case 'X8':
                uic.beginPath();
                s = this._pr0; e = 0.625 * this._pr1; da = Math.PI / 4;
                uic.save();
                uic.lineWidth = 1;
                for (let i = 0; i < 8; i++) {
                    uic.moveTo(s, 0)
                    uic.lineTo(e, 0);
                    uic.rotate(da);
                }
                uic.stroke();
                uic.restore();
            case 'X4':
                uic.beginPath();
                s = this._pr0; e = 0.85 * this._pr1; da = Math.PI / 2;
                uic.save();
                uic.lineWidth = 1.25;
                for (let i = 0; i < 4; i++) {
                    uic.moveTo(s, 0)
                    uic.lineTo(e, 0);
                    uic.rotate(da);
                }
                uic.stroke();
                uic.restore();
                break;
        }
        // Dial border
        uic.beginPath();
        uic.strokeStyle = DIAL_BORDER;
        uic.lineWidth = Math.max(3, 0.025 * this._size);
        uic.ellipse(0, 0, this._pr1, this._pr1, 0, 0, 2 * Math.PI);
        uic.stroke();
        // Dead zone
        uic.beginPath();
        uic.fillStyle = DEAD_ZONE;
        uic.ellipse(0, 0, this._pr0, this._pr0, 0, 0, 2 * Math.PI);
        uic.stroke();

        // Stick     
        uic.beginPath();
        uic.strokeStyle = ROD;
        uic.lineWidth = this._size * 0.05;
        uic.moveTo(0, 0);
        uic.lineTo(tx, ty);
        uic.stroke();

        // Thumb
        uic.beginPath();
        uic.lineWidth = 2;
        uic.strokeStyle = THUMB_STROKE;
        uic.fillStyle = (this.isActive || this.over) ? THUMB_OVER : THUMB_OFF;
        uic.ellipse(tx, ty, this._tSize, this._tSize, 0, 0, 2 * Math.PI);
        uic.fill();
        uic.stroke();
        uic.restore();

        this._updatePickBuffer(tx, ty, this._tSize);
        if (!this._enabled)
            this._disable_highlight(cs, 0, 0, this._w, this._h);

        this._bufferInvalid = false; // Finally mark as valid
    }

    /** @hidden */
    _updatePickBuffer(tx: number, ty: number, tSize: number) { // CvsStick
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc) return;
        this._clearBuffer(pkb, pkc);

        let c = this._gui.pickColor(this);
        pkc.save();
        pkc.translate(this._w / 2, this._h / 2);
        pkc.fillStyle = c.cssColor;
        pkc.beginPath();
        pkc.ellipse(tx, ty, tSize, tSize, 0, 0, 2 * Math.PI);
        pkc.fill();
        pkc.restore();
    }


    /** @hidden */ orient(dir: any) { return this.warn$('orient') }

}

