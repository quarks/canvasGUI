class CvsScrollpad extends CvsBufferedControl {
    /** @hidden */
    constructor(gui, name, x = 0, y = 0, w = 80, h = 80) {
        super(gui, name, x, y, w, h, true);
        this._value = [0.5, 0.5];
        this._dvalue = [0.5, 0.5];
        this._used = [0.1, 0.1];
        this._s_value = [0.5, 0.5];
        this._s_mx = 0.5;
        this._s_my = 0.5;
        this._minThumbSize = 12;
        this._corners = [4, 4, 4, 4];
        this._inset = 5;
        this._padW = w - 2 * this._inset;
        this._padH = h - 2 * this._inset;
        this._opaque = false;
        this.invalidateBuffer();
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
        const [w, h, inset] = [this._w, this._h, this._inset];
        const [padW, padH] = [this._padW, this._padH];
        const [value, used] = [this._value, this._used];
        uic.save();
        if (this._opaque) { // Background
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, w, h, cnrs);
            uic.fill();
        }
        // Thumb paddock
        uic.fillStyle = UNUSED_TRACK;
        uic.strokeStyle = BORDER;
        uic.lineWidth = 1;
        uic.beginPath();
        uic.roundRect(inset, inset, padW, padH, cnrs);
        uic.fill();
        uic.stroke();
        // Draw thumb
        uic.save();
        const tw = 2 + Math.max(this._minThumbSize, padW * used[0]);
        const th = 2 + Math.max(this._minThumbSize, padH * used[1]);
        const tx = padW * value[0];
        const ty = padH * value[1];
        uic.translate(inset + tx, inset + ty);
        uic.fillStyle = THUMB;
        uic.strokeStyle = BORDER;
        uic.lineWidth = 1;
        if (this.isActive || this.over) {
            uic.strokeStyle = HIGHLIGHT;
            uic.lineWidth = 2.5;
        }
        uic.beginPath();
        uic.roundRect(-tw / 2, -th / 2, tw, th, [4, 4, 4, 4]);
        uic.fill();
        uic.stroke();
        uic.restore();
        if (!this._enabled)
            this._disable_highlight(cs, 0, 0, w, h);
        this._updateScrollerPickBuffer(inset, tx, ty, tw, th);
        uic.restore();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _updateScrollerPickBuffer(inset, tx, ty, tw, th) {
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        let c = this._gui.pickColor(this);
        pkc.save();
        pkc.fillStyle = c.cssColor;
        pkc.translate(inset + tx, inset + ty);
        pkc.beginPath();
        pkc.roundRect(-tw / 2, -th / 2, tw, th, [4, 4, 4, 4]);
        pkc.fill();
        pkc.restore();
    }
    /** @hidden */
    isSameControl(ctrl) {
        return this === ctrl;
    }
    /** @hidden */
    getValue() {
        return Array.from(this._value);
    }
    /** @hidden */
    getUsed() {
        return Array.from(this._used);
    }
    /** @hidden */
    setValue(hValue = this._value[0], vValue = this._value[1]) {
        function changeValue(sp, idx, v) {
            if (Number.isFinite(v) && v !== sp._value[idx]) {
                v = _constrain(v, 0, 1);
                let u2 = sp._used[idx] / 2;
                let dv = _constrain(v, u2, 1 - u2);
                if (sp._dvalue[idx] != dv) {
                    sp._value[idx] = v;
                    sp._dvalue[idx] = dv;
                    sp.invalidateBuffer();
                }
            }
        }
        changeValue(this, 0, hValue);
        changeValue(this, 1, vValue);
    }
    /** @hidden */
    setUsed(hValue = this._used[0], vValue = this._used[1]) {
        if (hValue != this._used[0] || vValue != this._used[1]) {
            this._used[0] = hValue;
            this._used[1] = vValue;
            this.invalidateBuffer();
            this.setValue();
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
            value: Array.from(this._value), used: Array.from(this._used),
            final: final
        };
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let [mx, my, w, h] = [x - this.x, y - this.y, this.w, this.h];
        let [padW, padH] = [this._padW, this._padH];
        let halfInset = this._inset / 2;
        let [halfUsedH, halfUsedV] = [this._used[0] / 2, this._used[1] / 2];
        let [svalueH, svalueV] = [this._s_value[0], this._s_value[1]];
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0) { // Thumb
                    this._active = true;
                    this._s_value = Array.from(this._value);
                    this._s_mx = mx;
                    this._s_my = my;
                    this.over = true;
                }
                break;
            case 'mouseout':
                this?._parent?._scroller.hide();
            case 'mouseup':
            case 'touchend':
                this.action(this.actionInfo(e, true));
                this._active = false;
                this.over = false;
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    let newValueX = svalueH + (mx - this._s_mx) / padW;
                    newValueX = (newValueX + halfInset - halfUsedH >= 0 && newValueX - halfInset + halfUsedH <= 1)
                        ? newValueX : undefined;
                    let newValueY = svalueV + (my - this._s_my) / padH;
                    newValueY = (newValueY + halfInset - halfUsedV >= 0 && newValueY - halfInset + halfUsedV <= 1)
                        ? newValueY : undefined;
                    if (newValueX || newValueY) {
                        this.setValue(newValueX, newValueY);
                        this.action(this.actionInfo(e, false));
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
    // Hide these methods from typeDoc
    /** @hidden */ orient(dir) { return this.warn$('orient'); }
    /** @hidden */ tooltip(a) { return this.warn$('tooltip'); }
    /** @hidden */ tipTextSize(a) { return this.warn$('tipTextSize'); }
    /** @hidden */ corners(c) { return this.warn$('corners'); }
}
//# sourceMappingURL=scrollpad.js.map