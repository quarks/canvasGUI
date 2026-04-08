/**
 * <h2>Clickable image buttons.</h2>
 * 
 * <p>The over-button state occurs when the mouse is over the <b>hit-zone</b>
 * and this is determined by the images provided when the control is 
 * created.</p>
 * <p>The images are </p>
 * <ol>
 * <li> used when the mouse is not over the hit zone (required)</li>
 * <li> used when the mouse is over the hit zone (optional)</li>
 * <li> mask where non-transparent pixels define the hit-zone (optional)</li>
 * </ol>
 * <p>If a mask is not provided the non-transparent pixels in image (1) 
 * define the hit-zone.</p>
 * @see {@link GUI.image }
 * 
 */
class CvsImage extends CvsBufferedControl {

    #offImg: cvsIcon;
    #overImg: cvsIcon;
    #maskImg: cvsIcon;

    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number,
        faceImages: cvsIcon | Array<cvsIcon>,
        mask?: cvsIcon) {
        let images = Array.isArray(faceImages) ? faceImages : [faceImages];
        let [w, h] = [images[0].width, images[0].height];
        super(gui, name, x, y, w, h, true);
        this.#offImg = cvsGuiCanvas(images[0]);
        this.#overImg = cvsGuiCanvas(images[1]);
        this.#maskImg = cvsGuiCanvas(mask);
        this._uicBuffer.getContext('2d')?.drawImage(this.#offImg, 0, 0, w, h, 0, 0, w, h);
        this.invalidateBuffer();
    }

    /** @hidden */
    _makePickImage() {
        let pickCol = this._gui.pickColor(this);
        let [w, h] = [this.#offImg.width, this.#offImg.height];
        let p_rgb = [pickCol.r, pickCol.g, pickCol.b, 255];
        // Source color byte data array from either the off-image or
        // the mask if it exists.
        let srcData;
        if (this.#maskImg) {
            const cvs = new OffscreenCanvas(w, h);
            const ctx = cvs.getContext('2d');
            ctx?.drawImage(this.#maskImg, 0, 0, w, h, 0, 0, w, h);
            srcData = ctx?.getImageData(0, 0, w, h).data;
        }
        else {
            srcData = this._uicBuffer.getContext('2d')?.getImageData(0, 0, w, h).data;
        }
        // Create the pick image and clear context
        this.#maskImg = new OffscreenCanvas(w, h);
        let pkCtx = this.#maskImg.getContext('2d');
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
    resize(w: number, h: number) {
        w = Math.round(w);
        h = Math.round(h);
        if (Number.isNaN(w) || Number.isNaN(h) || (w == this._w && h == this._h))
            return this;
        const aspect = this.#offImg.width / this.#offImg.height;
        if (w == 0 && h == 0) {
            w = this.#offImg.width;
            h = this.#offImg.height;
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
    _updateControlVisual() { // CvsImage
        const uib = this._uicBuffer;
        const uic = uib.getContext('2d');
        if (!uic) return;
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
        const icon = highlight && this.#overImg ? this.#overImg : this.#offImg;
        uic.drawImage(icon, 0, 0, icon.width, icon.height, 0, 0, w, h);
        uic.restore();
        // End of clipped region
        // Mouse over and no over-image then add border highlight
        if (highlight && !this.#overImg) {
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
        const pkc = pkb?.getContext('2d');
        if (!pkb || !pkc) return;
        this._clearBuffer(pkb, pkc);

        const [w, h] = [pkb.width, pkb.height];
        const mask = this.#maskImg;
        const cnrs = this.CNRS;

        pkc.save();
        pkc.beginPath();
        pkc.roundRect(0, 0, w, h, cnrs);
        pkc.clip();

        pkc.drawImage(mask, 0, 0, mask.width, mask.height, 0, 0, w, h);
        pkc.restore();
    }


    /** @hidden */
    _doEvent(e: MouseEvent | TouchEvent, x = 0, y = 0, over: any, enter: boolean): any {
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
