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
var _CvsImage_offImg, _CvsImage_overImg, _CvsImage_maskImg;
/**
 * <p>This class represents clickable image buttons.</p>
 *
 * <p>The hit-zone is any non-transparent pixel in the off-state image or if
 * provided the mask-image.</p>
 *
 * <p>The over-button state occurs when the mouse is in the hit-zone. When
 * this occurs the button face image will be displayed, or if not defined, a
 * simple a simple border highlight is used.</p>
 */
class CvsImage extends CvsBufferedControl {
    /** @hidden */
    constructor(gui, name, x, y, faceImages, mask) {
        let images = Array.isArray(faceImages) ? faceImages : [faceImages];
        let [w, h] = [images[0].width, images[0].height];
        super(gui, name, x, y, w, h, true);
        _CvsImage_offImg.set(this, void 0);
        _CvsImage_overImg.set(this, void 0);
        _CvsImage_maskImg.set(this, void 0);
        __classPrivateFieldSet(this, _CvsImage_offImg, cvsGuiCanvas(images[0]), "f");
        __classPrivateFieldSet(this, _CvsImage_overImg, cvsGuiCanvas(images[1]), "f");
        __classPrivateFieldSet(this, _CvsImage_maskImg, cvsGuiCanvas(mask), "f");
        this._uicBuffer.getContext('2d')?.drawImage(__classPrivateFieldGet(this, _CvsImage_offImg, "f"), 0, 0, w, h, 0, 0, w, h);
        this.invalidateBuffer();
    }
    /** @hidden */
    _makePickImage() {
        let pickCol = this._gui.pickColor(this);
        let [w, h] = [__classPrivateFieldGet(this, _CvsImage_offImg, "f").width, __classPrivateFieldGet(this, _CvsImage_offImg, "f").height];
        let p_rgb = [pickCol.r, pickCol.g, pickCol.b, 255];
        // Source color byte data array from either the off-image or
        // the mask if it exists.
        let srcData;
        if (__classPrivateFieldGet(this, _CvsImage_maskImg, "f")) {
            const cvs = new OffscreenCanvas(w, h);
            const ctx = cvs.getContext('2d');
            ctx?.drawImage(__classPrivateFieldGet(this, _CvsImage_maskImg, "f"), 0, 0, w, h, 0, 0, w, h);
            srcData = ctx?.getImageData(0, 0, w, h).data;
        }
        else {
            srcData = this._uicBuffer.getContext('2d')?.getImageData(0, 0, w, h).data;
        }
        // Create the pick image and clear context
        __classPrivateFieldSet(this, _CvsImage_maskImg, new OffscreenCanvas(w, h), "f");
        let pkCtx = __classPrivateFieldGet(this, _CvsImage_maskImg, "f").getContext('2d');
        pkCtx?.clearRect(0, 0, w, h);
        // Create the dest color byte data array
        if (srcData) {
            let dstData = new Uint8ClampedArray(srcData.length);
            for (let i = 0; i < dstData.length; i += 4) {
                if (srcData[i + 3] >= 128) {
                    dstData[i] = p_rgb[0];
                    dstData[i + 1] = p_rgb[1];
                    dstData[i + 2] = p_rgb[2];
                    dstData[i + 3] = 255;
                }
            }
            let dstImgData = new ImageData(dstData, w, h);
            pkCtx?.putImageData(dstImgData, 0, 0);
        }
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
        const aspect = __classPrivateFieldGet(this, _CvsImage_offImg, "f").width / __classPrivateFieldGet(this, _CvsImage_offImg, "f").height;
        if (w == 0 && h == 0) {
            w = __classPrivateFieldGet(this, _CvsImage_offImg, "f").width;
            h = __classPrivateFieldGet(this, _CvsImage_offImg, "f").height;
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
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic)
            return;
        this._clearBuffer(uib, uic);
        const [w, h] = [this._w, this._h];
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const OPAQUE = cs.C$(2, this._alpha);
        const HIGHLIGHT = cs.C$(9);
        uic.save();
        // Image clipped for corners
        uic.save();
        uic.beginPath();
        uic.roundRect(0, 0, w, h, cnrs);
        uic.clip();
        if (this._opaque) {
            uic.fillStyle = OPAQUE;
            uic.fillRect(0, 0, w, h);
        }
        const highlight = (this.isActive || this.over);
        const icon = highlight && __classPrivateFieldGet(this, _CvsImage_overImg, "f") ? __classPrivateFieldGet(this, _CvsImage_overImg, "f") : __classPrivateFieldGet(this, _CvsImage_offImg, "f");
        uic.drawImage(icon, 0, 0, icon.width, icon.height, 0, 0, w, h);
        uic.restore();
        // End of clipped region
        // Mouse over and no over-image then add border highlight
        if (highlight && !__classPrivateFieldGet(this, _CvsImage_overImg, "f")) {
            uic.strokeStyle = HIGHLIGHT;
            uic.lineWidth = 2;
            uic.beginPath();
            uic.roundRect(1, 1, this._w - 2, this._h - 2, cnrs);
            uic.stroke();
        }
        // Update pick buffer before restoring
        this._updatePickBuffer();
        uic.restore();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    _updatePickBuffer() {
        const pkb = this._pkcBuffer;
        const pkc = pkb.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        const [w, h] = [this._pkcBuffer.width, this._pkcBuffer.height];
        const mask = __classPrivateFieldGet(this, _CvsImage_maskImg, "f");
        const cnrs = this.CNRS;
        pkc.save();
        pkc.beginPath();
        pkc.roundRect(0, 0, w, h, cnrs);
        pkc.clip();
        pkc.drawImage(mask, 0, 0, mask.width, mask.height, 0, 0, w, h);
        pkc.restore();
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this._clickAllowed = true; // false if mouse moves
                this.over = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    if (this._clickAllowed)
                        this.action({ source: this, event: e });
                    this._active = false;
                }
                this._clickAllowed = false;
                this.over = false;
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                this.over = (this == over.control);
                this._tooltip?._updateState(enter);
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
}
_CvsImage_offImg = new WeakMap(), _CvsImage_overImg = new WeakMap(), _CvsImage_maskImg = new WeakMap();
//# sourceMappingURL=image.js.map