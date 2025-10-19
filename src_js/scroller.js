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
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 100, h || 20);
        /** @hidden */ this._value = 0.5;
        /** @hidden */ this._dvalue = 0.5;
        /** @hidden */ this._used = 0.1;
        /** @hidden */ this._s_value = 0.5;
        /** @hidden */ this._s_dvalue = 0.5;
        /** @hidden */ this._s_mx = 0.5;
        /** @hidden */ this._minV = this._used / 2;
        /** @hidden */ this._maxV = 1 - this._used / 2;
        /** @hidden */ this._BORDER = 10;
        /** @hidden */ this._THEIGHT = 8;
        /** @hidden */ this._THUMB_HEIGHT = 12;
        /** @hidden */ this._MIN_THUMB_WIDTH = 10;
        this._TLENGTH = this._w - 3 * this._BORDER;
        this._c = gui.corners();
        this._opaque = false;
    }
    update(v, u) {
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
            if (v < u2)
                dv = u2;
            else if (v > 1 - u2)
                dv = 1 - u2;
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
    _whereOver(px, py, tol = 20) {
        let tx = this._BORDER + this._dvalue * this._TLENGTH;
        let ty = this._h / 2;
        let thumbSizeX = Math.max(this._used * this._TLENGTH, this._MIN_THUMB_WIDTH);
        if (Math.abs(tx - px) <= thumbSizeX / 2 && Math.abs(ty - py) <= tol / 2) {
            return 1;
        }
        return 0;
    }
    /** @hidden */
    _processEvent(e, ...info) {
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
    _updateControlVisual() {
        let cs = this._scheme || this._gui.scheme();
        const OPAQUE = cs['C_3'];
        const TICKS = cs['G_8'];
        const UNUSED_TRACK = cs['G_3'];
        const HIGHLIGHT = cs['C_9'];
        const THUMB = cs['C_5'];
        let thumbSizeX = Math.max(this._used * this._TLENGTH, this._MIN_THUMB_WIDTH);
        let thumbSizeY = this._THUMB_HEIGHT;
        let tx = this._dvalue * this._TLENGTH;
        let uib = this._uiBfr;
        uib.push();
        uib.clear();
        if (this._opaque) {
            uib.noStroke();
            uib.fill(OPAQUE);
            uib.rect(0, 0, this._w, this._h, ...this._c);
        }
        // Now translate to track left edge - track centre
        uib.translate(this._BORDER, uib.height / 2);
        // draw track
        uib.fill(UNUSED_TRACK);
        uib.stroke(TICKS);
        uib.strokeWeight(1);
        uib.rect(0, -this._THEIGHT / 2, this._TLENGTH, this._THEIGHT);
        // Draw thumb
        uib.fill(THUMB);
        uib.noStroke();
        if (this._active || this._over > 0) {
            uib.strokeWeight(2);
            uib.stroke(HIGHLIGHT);
        }
        uib.rect(tx - thumbSizeX / 2, -thumbSizeY / 2, thumbSizeX, thumbSizeY, ...this._c);
        if (!this._enabled)
            this._disable_hightlight(uib, cs, 0, -this._h / 2, this._w - 20, this._h);
        this._updateScrollerPickBuffer(tx - thumbSizeX / 2, -thumbSizeY / 2, thumbSizeX, thumbSizeY);
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _updateScrollerPickBuffer(tx, ty, tw, th) {
        let c = this._gui.pickColor(this);
        let pkb = this._pkBfr;
        pkb.push();
        pkb.clear();
        pkb.noStroke();
        pkb.fill(c.r, c.g, c.b);
        // Now translate to track left edge - track centre
        pkb.translate(this._BORDER, 0); //pkb.height / 2);
        pkb.rect(Math.round(tx), Math.round((pkb.height - th) / 2), tw, th);
        pkb.pop();
    }
    /** @hidden */
    _minControlSize() {
        return { w: this._w, h: 20 };
    }
}
Object.assign(CvsScroller.prototype, processMouse, processTouch);
//# sourceMappingURL=scroller.js.map