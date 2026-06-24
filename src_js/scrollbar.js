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
class CvsScrollbar extends CvsBufferedControl {
    /** @hidden */
    constructor(gui, name, x = 0, y = 0, w = 100, h = 20) {
        super(gui, name, x, y, w, h, true);
        this._value = 0.5;
        this._dvalue = 0.5;
        this._used = 0.1;
        this._s_value = 0.5;
        this._s_mx = 0;
        this._inset = 2;
        this._trackWidth = w - 2 * this._inset;
        this._trackHeight = 8;
        this._thumbHeight = 12;
        this._minThumbWidth = 10;
        this._corners = [4, 4, 4, 4];
        this._opaque = false;
        this.invalidateBuffer();
    }
    /** @hidden */
    getValue() {
        return this._value;
    }
    /** @hidden */
    setValue(value) {
        if (Number.isFinite(value) && value !== this._value) {
            value = _constrain(value, 0, 1);
            let u2 = this._used / 2;
            let dv = _constrain(value, u2, 1 - u2);
            if (this._value != value || this._dvalue != dv) {
                this._value = value;
                this._dvalue = dv;
                this.invalidateBuffer();
            }
        }
    }
    /** @hidden */
    getUsed() {
        return this._used;
    }
    /** @hidden */
    setUsed(used) {
        if (Number.isFinite(used) && used !== this._used) {
            this._used = used;
            this.invalidateBuffer();
        }
    }
    /**
    * <p>Get the action info object to be sent to the user-defined action
    * function.</p>
    * @param event the JS avent if any
    * @param final true if the thumb has been released
    * @returns the current status
    */
    actionInfo(event = undefined, final = false) {
        return {
            source: this, event: event,
            value: this._value, used: this._used,
            final: final
        };
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let [mx, my, w, h] = this._orientation.xy(x - this._x, y - this._y, this.w, this.h);
        let [tw, halfUsed] = [this._trackWidth, this._used / 2];
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0) { // Thumb
                    this._active = true;
                    this._s_value = this._value;
                    this._s_mx = mx;
                    this.over = true;
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                this.action(this.actionInfo(e, true));
                this._active = false;
                this.over = false;
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    let newValue = this._s_value + (mx - this._s_mx) / tw;
                    if (newValue - halfUsed >= 0 && newValue + halfUsed <= 1) {
                        this.setValue(newValue);
                        this.action(this.actionInfo(e, true));
                    }
                }
                this.over = (this == over.control);
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
        const OPAQUE = cs.C$(3);
        const BORDER = cs.G$(8);
        const UNUSED_TRACK = cs.G$(3);
        const HIGHLIGHT = cs.C$(9);
        const THUMB = cs.C$(5);
        let [w, h, inset, used] = [this._w, this._h, this._inset, this._used];
        // let [tx0, tx1] = [inset, w - inset];
        let [tw, th] = [this._trackWidth, this._trackHeight];
        let tbW = Math.max(used * tw, this._minThumbWidth);
        let tbH = this._thumbHeight;
        let tx = this._dvalue * this._trackWidth;
        uic.save();
        if (this._opaque) { // Background
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, w, h, cnrs);
            uic.fill();
        }
        // Now translate to track left edge - track centre
        uic.translate(inset, h / 2);
        // draw track
        uic.fillStyle = UNUSED_TRACK;
        uic.strokeStyle = BORDER;
        uic.lineWidth = 1;
        uic.fillRect(0, -th / 2, tw, th);
        uic.strokeRect(0, -th / 2, tw, th);
        // Draw thumb
        uic.fillStyle = THUMB;
        if (this.isActive || this.over) {
            uic.lineWidth = 2.5;
            uic.strokeStyle = HIGHLIGHT;
        }
        uic.beginPath();
        uic.roundRect(tx - tbW / 2, -tbH / 2, tbW, tbH, cnrs);
        uic.fill();
        uic.stroke();
        if (!this._enabled)
            this._disable_highlight(cs, 0, -h / 2, w - 20, h);
        this._updateScrollerPickBuffer(tx - tbW / 2, -tbH / 2, tbW, tbH);
        uic.restore();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _updateScrollerPickBuffer(tbX, tby, tbw, tbh) {
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        let c = this._gui.pickColor(this);
        pkc.save();
        pkc.fillStyle = c.cssColor;
        // Now translate to track left edge - track centre
        pkc.translate(this._inset, this._h / 2);
        pkc.fillRect(Math.round(tbX), Math.round(tby), tbw, tbh);
        pkc.restore();
    }
    /** @hidden */ tooltip(a) { return this.warn$('tooltip'); }
    /** @hidden */ tipTextSize(a) { return this.warn$('tipTextSize'); }
    /** @hidden */ corners(c) { return this.warn$('corners'); }
}
//# sourceMappingURL=scrollbar.js.map