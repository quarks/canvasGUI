/*
 ##############################################################################
 CvsScroller
 This class represents a simple scrollbar. Although it can be used as a 
 distinct control it is more likely to be used as part of a larger control 
 such as CvsViewer.
 ##############################################################################
 */
/** 
 * <p>The scroller is used to scroll thorough an object larger than the 
 * display area.</p>
 * @hidden
 */
class CvsScroller extends CvsBufferedControl {

    // All values are in the range 0-1

    /** @hidden */ protected _value: number = 0.5;
    /** @hidden */ protected _dvalue: number = 0.5;
    /** @hidden */ protected _used: number = 0.1;

    /** @hidden */ protected _s_value: number = 0.5;
    /** @hidden */ protected _s_dvalue: number = 0.5;
    /** @hidden */ protected _s_mx: number = 0.5;

    /** @hidden */ protected _minV: number = this._used / 2;
    /** @hidden */ protected _maxV: number = 1 - this._used / 2;

    /** @hidden */ protected _inset: number = 2;
    /** @hidden */ protected _trackWidth: number; // pixels
    /** @hidden */ protected _trackHeight = 8;
    /** @hidden */ protected _thumbHeight = 12;
    /** @hidden */ protected _minThumbWidth = 10;


    /** @hidden */
    constructor(gui: GUI, name: string, x = 0, y = 0, w = 100, h = 20) {
        super(gui, name, x, y, w, h);
        this._trackWidth = w - 2 * this._inset;
        this._opaque = false;
        this._corners = [4, 4, 4, 4];
    }

    /**
     * Update the scroller from an external source.
     * 
     * @param value The scroller position (0-1) 
     * @param used The amount 'used' by the source
     */
    update(value: number, used?: number) {
        // If a used value is available then use it
        if (Number.isFinite(used) && used !== this._used) {
            this._used = used;
            this._minV = this._used / 2;
            this._maxV = 1 - this._used / 2;
            this.invalidateBuffer();
        }
        if (Number.isFinite(value) && value !== this._value) {
            value = this._p.constrain(value, 0, 1);
            let dv = value, u2 = this._used / 2;
            if (value < u2) dv = u2;
            else if (value > 1 - u2) dv = 1 - u2;
            if (this._value != value || this._dvalue != dv) {
                this._value = value;
                this._dvalue = dv;
                this.invalidateBuffer();
            }
        }
    }

    /** @hidden */
    getValue() {
        return this._value;
    }

    /** @hidden */
    getUsed() {
        return this._used;
    }

    /** @hidden */
    _doEvent(e: MouseEvent | TouchEvent, x = 0, y = 0, over: any, enter: boolean): CvsBaseControl {
        let [mx, my, w, h] = this._orientation.xy(x - this._x, y - this._y, this.w, this.h);
        let [tw, halfUsed] = [this._trackWidth, this._used / 2];
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0) { // Thumb
                    this._active = true;
                    this._s_value = this._value;
                    this._s_mx = mx;
                    this.isOver = true;
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                this.action({ source: this, p5Event: e, value: this._value, used: this._used, final: true });
                this._active = false;
                this.isOver = false;
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    let newValue = this._s_value + (mx - this._s_mx) / tw;
                    if (newValue - halfUsed >= 0 && newValue + halfUsed <= 1) {
                        this.update(newValue);
                        this.action({ source: this, p5Event: e, value: this._value, used: this._used, final: false });
                    }
                }
                this.isOver = (this == over.control);
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
    _updateControlVisual() { // CvsScroller
        let cs = this.SCHEME;

        const OPAQUE = cs.C(3);
        const BORDER = cs.G(8);
        const UNUSED_TRACK = cs.G(3);
        const HIGHLIGHT = cs.C(9);
        const THUMB = cs.C(5);

        let [w, h, inset, used] = [this._w, this._h, this._inset, this._used];
        let [tx0, tx1] = [inset, w - inset];
        let [tw, th] = [this._trackWidth, this._trackHeight];
        let tbW = Math.max(used * tw, this._minThumbWidth);
        let tbH = this._thumbHeight;
        let tx = this._dvalue * this._trackWidth;

        let uib = this._uiBfr;
        uib.push();
        uib.clear();
        if (this._opaque) {
            uib.noStroke(); uib.fill(...OPAQUE);
            uib.rect(0, 0, w, h, ...this._corners);
        }
        // Now translate to track left edge - track centre
        uib.translate(inset, this._uiBfr.height / 2);
        // draw track
        uib.fill(...UNUSED_TRACK);
        uib.stroke(...BORDER);
        uib.strokeWeight(1);
        uib.rect(0, -th / 2, tw, th);
        // Draw thumb
        uib.fill(...THUMB);
        uib.noStroke();
        if (this.isActive || this.isOver) {
            uib.strokeWeight(2);
            uib.stroke(...HIGHLIGHT);
        }
        uib.rect(tx - tbW / 2, -tbH / 2, tbW, tbH, ...this._corners);
        if (!this._enabled) this._disable_hightlight(uib, cs, 0, -h / 2, w - 20, h);
        this._updateScrollerPickBuffer(tx - tbW / 2, -tbH / 2, tbW, tbH);
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */
    _updateScrollerPickBuffer(tbX: number, tby: number, tbw: number, tbh: number) {
        let c = this._gui.pickColor(this);
        let pkb = this._pkBfr;
        pkb.push();
        pkb.clear();
        pkb.noStroke();
        pkb.fill(c.r, c.g, c.b);
        // Now translate to track left edge - track centre
        pkb.translate(this._inset, this._pkBfr.height / 2);
        pkb.rect(Math.round(tbX), Math.round(tby), tbw, tbh);
        pkb.pop();
    }

    /** @hidden */
    _minControlSize() {
        return { w: this._w, h: 20 };
    }

    // Hide these methods from typeDoc
    /** @hidden */ tooltip(tiptext) { return this }
    /** @hidden */ tipTextSize(gtts) { return this }
    /** @hidden */ corners(c) { return this }

}

Object.assign(CvsScroller.prototype, NoTooltip);
Object.assign(CvsScroller.prototype, NoCorners);

