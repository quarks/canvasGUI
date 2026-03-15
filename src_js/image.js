var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CvsImage_image, _CvsImage_border, _CvsImage_frameWeight;
/**
 * Wraps an image into a control
 */
class CvsImage extends CvsBufferedControl {
    /** @hidden */
    constructor(gui, name, x, y, image) {
        image = cvsGuiCanvas(image);
        super(gui, name, x || 0, y || 0, image.width, image.height);
        _CvsImage_image.set(this, void 0);
        _CvsImage_border.set(this, 0);
        _CvsImage_frameWeight.set(this, 0);
        __classPrivateFieldSet(this, _CvsImage_image, image, "f");
        this.invalidateBuffer();
    }
    /**
     * Sets the stroke weight to use for the frame. If not provided
     * or &lt;0 then no frame is drawn.
     * @param sw the stroke weight for the frame
     * @returns this control
     */
    frame(sw = 0) {
        __classPrivateFieldSet(this, _CvsImage_frameWeight, sw < 0 ? 0 : sw, "f");
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Resizes the control.</p>
     * <p>if both parameters are &equals;0 the control will be resized to
     * match the original image size, but if both parameters are &ne;0 the
     * control will be stretched to fit the new size.</p>
     * <p>If just one parameter is &equals;0 then it will be calculated from
     * the other parameter so as to maintain the original aspect ratio.</p>
     *
     * @param w requested width
     * @param h requested height
     * @returns this control
     */
    resize(w, h) {
        w = Math.round(w);
        h = Math.round(h);
        if (Number.isNaN(w) || Number.isNaN(h) || (w == this._w && h == this._h))
            return this;
        const aspect = __classPrivateFieldGet(this, _CvsImage_image, "f").width / __classPrivateFieldGet(this, _CvsImage_image, "f").height;
        if (w == 0 && h == 0) {
            w = __classPrivateFieldGet(this, _CvsImage_image, "f").width;
            h = __classPrivateFieldGet(this, _CvsImage_image, "f").height;
        }
        else if (w == 0 && h > 0)
            w = Math.ceil(h * aspect);
        else if (h == 0 && w > 0)
            h = Math.ceil(w / aspect);
        this._w = w;
        this._h = h;
        this.invalidateBuffer();
        return this;
    }
    /** @hidden */
    _updateControlVisual() {
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const OPAQUE = cs.C$(2, this._alpha);
        const FORE = cs.C$(8);
        const img = __classPrivateFieldGet(this, _CvsImage_image, "f");
        const [w, h] = [this._w, this._h];
        const fw = __classPrivateFieldGet(this, _CvsImage_frameWeight, "f");
        const uic = this._uicContext;
        uic.save();
        uic.clearRect(0, 0, w, h);
        // Image clipped for corners
        uic.save();
        uic.beginPath();
        uic.roundRect(fw / 2, fw / 2, w - fw, h - fw, cnrs);
        uic.clip();
        if (this._opaque) {
            uic.fillStyle = OPAQUE;
            uic.fillRect(0, 0, w, h);
        }
        uic.drawImage(img, 0, 0, img.width, img.height, 0, 0, w, h);
        uic.restore();
        if (fw > 0) {
            uic.strokeStyle = FORE;
            uic.lineWidth = __classPrivateFieldGet(this, _CvsImage_frameWeight, "f");
            uic.roundRect(fw, fw, w - 2 * fw, h - 2 * fw, cnrs);
            uic.stroke();
        }
        uic.restore();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */ get isEnabled() { return this.warn$('isEnabled'); }
    /** @hidden */ setAction() { return this.warn$('setAction'); }
    /** @hidden */ orient(a) { return this.warn$('orient'); }
    /** @hidden */ tooltip(a) { return this.warn$('tooltip'); }
    /** @hidden */ tipTextSize(a) { return this.warn$('tipTextSize'); }
    /** @hidden */ enable() { return this.warn$('enable'); }
    /** @hidden */ disable() { return this.warn$('disable'); }
}
_CvsImage_image = new WeakMap(), _CvsImage_border = new WeakMap(), _CvsImage_frameWeight = new WeakMap();
//# sourceMappingURL=image.js.map