/*
 ##############################################################################
 CvsScroller
 This class represents a simple scrollbar. Although it can be used as a 
 distinct control it is more likely to be used as part of a larger control 
 such as CvsViewer.
 ##############################################################################
 */
/** 
 * <p>The scroller is used to scroll thorugh an object larger than the 
 * display area.</p>
 * @hidden
 */
class CvsScroller extends CvsBufferedControl {

    /** @hidden */ protected _value: number = 0.5;
    /** @hidden */ protected _dvalue: number = 0.5;
    /** @hidden */ protected _used: number = 0.1;

    /** @hidden */ protected _s_value: number = 0.5;
    /** @hidden */ protected _s_dvalue: number = 0.5;
    /** @hidden */ protected _s_mx: number = 0.5;

    /** @hidden */ protected _minV: number = this._used / 2;
    /** @hidden */ protected _maxV: number = 1 - this._used / 2;

    /** @hidden */ protected _BORDER: number = 10;
    /** @hidden */ protected _TLENGTH: number;
    /** @hidden */ protected _THEIGHT: number = 8;
    /** @hidden */ protected _THUMB_HEIGHT: number = 12;
    /** @hidden */ protected _MIN_THUMB_WIDTH: number = 10;


    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x || 0, y || 0, w || 100, h || 20);
        this._TLENGTH = this._w - 3 * this._BORDER;
        this._c = gui.corners();
        this._opaque = false;
    }

    update(v: number, u?: number) {
        // If a used value is available then set it
        if (Number.isFinite(u) && u !== this._used) {
            this._used = u;
            this._minV = this._used / 2;
            this._maxV = 1 - this._used / 2;
            this.invalidateBuffer();
        }
        if (Number.isFinite(v) && v !== this._value) {
            v = this._p.constrain(v, 0, 1);
            let dv = v, u2 = this._used / 2;
            if (v < u2) dv = u2;
            else if (v > 1 - u2) dv = 1 - u2;
            if (this._value != v || this._dvalue != dv) {
                this._value = v;
                this._dvalue = dv;
                this.invalidateBuffer();
            }
        }
    }

    getValue() {
        return this._value;
    }

    getUsed() {
        return this._used;
    }
    /** @hidden */
    _whereOver(px: number, py: number, tol = 20) {
        let tx = this._BORDER + this._dvalue * this._TLENGTH;
        let ty = this._h / 2;
        let thumbSizeX = Math.max(this._used * this._TLENGTH, this._MIN_THUMB_WIDTH);
        if (Math.abs(tx - px) <= thumbSizeX / 2 && Math.abs(ty - py) <= tol / 2) {
            return 1;
        }
        return 0;
    }

    /** @hidden */
    _handleMouse(e: MouseEvent) { //    CvsScroller
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x;
        let my = this._p.mouseY - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x;
        my = r.y;
        this._pover = this._over;                 // Store previous mouse over state
        this._over = this._whereOver(mx, my, this._THUMB_HEIGHT);     // Store current mouse over state
        if (this._pover != this._over) this.invalidateBuffer();
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx);
        return false;
    }

    /** @hidden */
    _handleTouch(e: TouchEvent) {
        e.preventDefault();
        let pos = this.getAbsXY();
        const rect = this._gui._canvas.getBoundingClientRect();
        const t = e.changedTouches[0];
        let mx = t.clientX - rect.left - pos.x;
        let my = t.clientY - rect.top - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x; my = r.y;
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my, Math.max(this._THUMB_HEIGHT, 20)); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx);
    }

    /** @hidden */
    _processEvent(e: any, ...info) {
        let mx = info[0];
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (this._over > 0) {
                    this._active = true;
                    this._s_value = this._value;
                    this._s_mx = mx;
                    this.invalidateBuffer();
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this._active) {
                    this.action({ source: this, p5Event: e, value: this._value, used: this._used, final: true });
                    this._active = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this._active) {
                    let delta = (mx - this._s_mx) / this._TLENGTH;
                    this.update(this._s_value + delta);
                    this.action({ source: this, p5Event: e, value: this._value, used: this._used, final: false });
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
    _updateControlVisual() { // CvsScroller
        let b = this._buffer;
        let cs = this._scheme || this._gui.scheme();
        let thumbSizeX = Math.max(this._used * this._TLENGTH, this._MIN_THUMB_WIDTH), thumbSizeY = this._THUMB_HEIGHT;
        let tx = this._dvalue * this._TLENGTH;

        const OPAQUE = cs['C_0'];
        const TICKS = cs['G_8'];
        const UNUSED_TRACK = cs['G_4'];
        const HIGHLIGHT = cs['C_9'];
        const THUMB = cs['C_5'];

        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke(); b.fill(OPAQUE);
            b.rect(0, 0, this._w, this._h,
                this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Now translate to track left edge - track centre
        b.translate(this._BORDER, b.height / 2);
        // draw track
        b.fill(UNUSED_TRACK);
        b.stroke(TICKS);
        b.strokeWeight(1);
        b.rect(0, -this._THEIGHT / 2, this._TLENGTH, this._THEIGHT);
        // Draw thumb
        b.fill(THUMB);
        b.noStroke();
        if (this._active || this._over > 0) {
            b.strokeWeight(2);
            b.stroke(HIGHLIGHT);
        }
        b.rect(tx - thumbSizeX / 2, -thumbSizeY / 2, thumbSizeX, thumbSizeY,
            this._c[0], this._c[1], this._c[2], this._c[3]);
        if (!this._enabled) this._disable_hightlight(b, cs, 0, -this._h / 2, this._w - 20, this._h);
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */
    _minControlSize() {
        return { w: this._w, h: 20 };
    }

}

