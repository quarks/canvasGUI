/**
 * <p>This class enables icons to be added to any text control.</p>
 * @hidden
 */
class CvsTextIcon extends CvsText {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
        /** @hidden */ this._iAlignH = 'left';
        /** @hidden */ this._iAlignV = 'center';
        this._icon = undefined;
    }
    /**
     * <p>Replaces the existing icons representing false / true states.</p>
     * <p>The first parameter must be an array of 2 images [falseImage, trueImage]
     * representing the state of the checkbox. It is recomended that the images
     * the same size</p>
     *
     * If provided the last two paratmeters control the icon alignment within
     * the control.</p>
     * @see iconAlign
     * @param icon the icon to appear
     * @param alignH horizontal position relative to the text.
     * @param alignV vertical position within the control
     * @returns this control or the current icon
     */
    icon(icon, alignH, alignV) {
        this._icon = cvsGuiCanvas(icon);
        this.iconAlign(alignH, alignV);
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Sets the horizontal and vertical icon aligment.</p>
     * <p>The following strings are recognised as valid alignments :-</p>
     * <pre>
     * Horz:  'left', 'right' or 'center'
     * Vert:  'top', 'bottom' or 'center'
     * </pre>
     * <p>It will also accept the equivalent p5js constants :-</p>
     * <pre>
     * LEFT  RIGHT  CENTER  TOP  BOTTOM   CENTER
     * </pre>
     * <p>Center icon alignment is only possible if there is no text. If there
     * is some text it will use the default 'left'.</p>
     * <p>Unrecognized values are ignored and the icon allignment is unchanged.</p>
     *
     * @param horz 'left', 'right' or 'center'
     * @param vert 'top', 'bottom' or 'center'
     * @returns this control
     */
    iconAlign(horz, vert) {
        let a = this._validateAlign(this._iAlignH, this._iAlignV, horz, vert);
        this._iAlignH = a.horz;
        this._iAlignV = a.vert;
        if (a.changed)
            this.invalidateBuffer();
        return this;
    }
    /**
     * Removes an existing icon
     * @returns this control
     */
    noIcon() {
        if (this._icon) {
            this._icon = undefined;
            this.invalidateBuffer();
        }
        return this;
    }
    /** @hidden */
    _fitToContent() {
        const [fx, fy, fw, fh] = this._getUseableFaceRegion();
        const [nW, nH] = this._fitWH;
        const tW = Math.ceil(this._tBox[0] + 2 * fx);
        const tH = Math.ceil(this._tBox[1] + 2 * fy);
        if (this._fitWH[0]) {
            const dw = this._icon ? this._icon.width + GUTTER : 0;
            this._w = Math.max(tW + dw, nW);
        }
        if (this._fitWH[1]) {
            let dh = this._icon ? this._icon.height : 0;
            this._h = Math.max(dh, tH, nH);
        }
        this._fitWH = null;
        this.invalidateBuffer();
    }
    /** @hidden */
    _updateFaceElements() {
        const [fx, fy, fw, fh] = this._getUseableFaceRegion();
        if (!this._icon) {
            this._tArea = [fx, fy, fw, fh];
        }
        else {
            const [iw, ih] = this._icon ? [this._icon.width, this._icon.height] : [0, 0];
            let ix = fx, iy = fy;
            let textX, textW;
            switch (this._iAlignH) {
                case "left":
                    ix = fx;
                    textX = fx + iw + GUTTER;
                    textW = fw - iw - GUTTER;
                    break;
                case "right":
                    ix = fx + fw - iw;
                    textX = fx;
                    textW = fw - iw - GUTTER;
                    break;
                case "center":
                    if (this._tLines.length > 0) {
                        ix = fx;
                        textX = iw + GUTTER;
                        textW = fw - iw - GUTTER;
                    }
                    else {
                        ix = (fw - iw) / 2;
                    }
                    break;
            }
            switch (this._iAlignV) {
                case "top":
                    iy = fy;
                    break;
                case "bottom":
                    iy = fy + fh - ih;
                    break;
                case "center":
                    iy = (fh - ih) / 2;
                    break;
            }
            this._ix = ix;
            this._iy = iy;
            this._tArea = [textX, fy, textW, fh];
        }
    }
}
//# sourceMappingURL=texticon.js.map