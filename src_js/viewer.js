/**
 * <h2>Displays a single or multiple layered images.</h2>
 *
 * <p>The size of the image does not have to be the same as the viewer
 * and the <code>view(...)</code> method can be used to display any part of
 * the image at any scale. In all cases the control will automatically adjust
 * the view position and scale so that it fills the entire control surface.</p>
 *
 * <p><b>Scrolling:</b> if the size of image differs from the control then the
 * view can be panned by dragging the mouse on the image. Alternatively the
 * user can drag on the scrollpad or scrollbars which automatically appear
 * when required.</p>
 *
 * <p><b>Zooming:</b> is achieved by changing the display scale. This can be
 * done using the <code>scale(...)</code> method. Alternatively the user can
 * drag on the scaler slider that appears when the mouse is near the center
 * of the viewer. the scaler is <em>only</em> available if the user requests
 * one when creating this control.</p>
 *
 * <p>This control also supports layers where multiple images can be layered
 * to make the final visual. The control will resize all images to the same
 * size as the first (base) image. The layers (images) will be displayed in
 * the ordered they were added. The user can control which layers are to be
 * hidden and shown.</p>
 *
 */
class CvsViewer extends CvsBufferedControl {
    /** @hidden */
    constructor(gui, name, x, y, w, h, padSize = 0) {
        super(gui, name, x, y, w, h, true);
        this._layers = [];
        this._lw = 0;
        this._lh = 0;
        this._wcx = 0;
        this._wcy = 0;
        this._wscale = 1;
        this._fillViewScale = 1;
        this._scalerZone = { x0: 0, y0: 0, x1: 0, y1: 0 };
        this._corners = [0, 0, 0, 0];
        this._frameWeight = 0;
        if (padSize <= 0)
            this._scroller = new ViewScrollBars(gui, this._id + '-scroller', this);
        else
            this._scroller = new ViewScrollPad(gui, this._id + '-scroller', this, padSize);
        this._scroller.hide();
    }
    /** @hidden */
    get lw() { return this._lw; }
    /** @hidden */
    get lh() { return this._lh; }
    /** @hidden */
    get wcx() { return this._wcx; }
    /** @hidden */
    get wcy() { return this._wcy; }
    /** @hidden */
    get wscale() { return this._wscale; }
    /**
     * <p>Sets the existing scaler value (if there is no scaler it will be created)
     * and limits. The initial value will be constrained to the limits.</p>
     * @param v the scale to use
     * @param l0 the lowest scale allowed
     * @param l1  the highest scale allowed
     * @returns this control
     */
    scaler(v, l0, l1) {
        if (Number.isFinite(v) && Number.isFinite(l0) && Number.isFinite(l1)) {
            // If we don't have a scaler then create it
            if (!this._scaler)
                this._scaler = this._createScaler(this._w, this._h);
            // Now update the scaler
            let low = Math.max(this._fillViewScale, Math.min(l0, l1));
            let high = Math.max(this._fillViewScale, Math.max(l0, l1));
            let value = _constrain(v, low, high);
            this._scaler.limits(low, high);
            this._scaler.value(value);
            this._wscale = value;
            // If we already have layers then update centre position
            if (this._lw > 0 && this._lh > 0) {
                const [valueH, valueV] = this._scroller.getValue();
                this._wcx = this._lw * valueH;
                this._wcy = this._lh * valueV;
                this.invalidateBuffer();
            }
        }
        return this;
    }
    /**
     * <p>Sets or gets the current scale in use.</p>
     * <p>If a parameter is passed it will be </p>
     * <ul>
     * <li>adjusted to ensure that the image fills the entire view, and</li>
     * <li>constrained to the limits of the scaler if one has been requested by the user.</li>
     * </ul>
     * <p>If no parameters are passed the the current scale is returned.</p>
     *
     * @param v the scale to use
     * @returns this control or the current scale
     */
    scale(v) {
        if (!Number.isFinite(v)) // no parameters
            return this._wscale;
        if (this._updateScale(v)) {
            this._updateView(this._wcx, this._wcy);
            this.action(this.actionInfo());
        }
        return this;
    }
    /**
     * Sets the scale after validation.
     * @param v new scale value
     * @returns true if the scale has been changed
     * @hidden
     */
    _updateScale(v) {
        v = this._scaler
            ? _constrain(v, this._scaler.lowLimit, this._scaler.highLimit)
            : Math.max(this._fillViewScale, v);
        if (this._wscale != v) {
            this._wscale = v;
            this.invalidateBuffer();
            return true;
        }
        return false;
    }
    /**
     * Create a scaler if required.
     * @param w
     * @param h
     * @hidden
     */
    _createScaler(w, h) {
        let sclrX = 0.25 * w, sclrY = 0.5 * h - 10;
        let sclrW = 0.5 * w, sclrH = 20;
        let scaler = this._gui.slider(this._id + "-scaler", sclrX, sclrY, sclrW, sclrH);
        scaler.weight(12);
        scaler.hide()
            .setAction((info) => {
            if (this._updateScale(info.value)) {
                this._updateView(this._wcx, this._wcy);
                this.action(this.actionInfo());
            }
        });
        this.addChild(scaler);
        this._scalerZone = {
            x0: 0.15 * w, y0: 0.4 * h - 10,
            x1: 0.85 * w, y1: 0.6 * h + 10
        };
        return scaler;
    }
    /**
     * <p>Sets the view and scale of the layer(s) to be displayed.</p>
     *
     * <p>The scale is adjusted so that it exceeds the minimum scale to fill
     * the viewer and is constrained to the limits of the scaler, if one has
     * been created with the <code>scaler(...)</code> method.</p>
     *
     * <p>The first two parameters define the pixel position within the layer
     * that corresponds to the centre of the viewer. If neccessary the pixel
     * position is adjusted to ensure the layer(s) fill the entire viewer.</p>
     *
     * @param wcx horizontal position in the layer coressponding to the viewport centre
     * @param wcy vertical position in the layer coressponding to the viewport centre
     * @param wscale the display scale (optional)
     * @returns this control
     */
    view(wcx, wcy, wscale = this._wscale) {
        if (Number.isFinite(wcx) && Number.isFinite(wcy) && Number.isFinite(wscale)) {
            this._updateScale(wscale);
            this._updateView(wcx, wcy);
            this._updateScrollerThumb();
        }
        return this;
    }
    /**
     *
     * @param ncx horizontal centre location
     * @param ncy vetical centre location
     * @hidden
     */
    _updateView(ncx, ncy) {
        const ww2 = Math.round(0.5 * this._w / this._wscale);
        const wh2 = Math.round(0.5 * this._h / this._wscale);
        const left = ncx - ww2, right = ncx + ww2;
        const top = ncy - wh2, bottom = ncy + wh2;
        // keep in view horizontally
        if (left < 0)
            ncx -= left;
        else if (right > this._lw)
            ncx += this._lw - right;
        // keep in view vertically
        if (top < 0)
            ncy -= top;
        else if (bottom > this._lh)
            ncy += this._lh - bottom;
        if (_neq(ncx, this._wcx) || _neq(ncy, this._wcy)) {
            this._wcx = ncx;
            this._wcy = ncy;
            this._scroller.setValue(this._wcx / this._lw, this._wcy / this._lh);
            this.invalidateBuffer();
            this.action(this.actionInfo());
        }
    }
    /** @hidden */
    _updateScrollerThumb() {
        this._scroller.setValue(this._wcx / this._lw, this._wcy / this._lh);
    }
    /**
     * <p>Get the action info object to be sent to the user-defined action
     * function.</p>
     * @param event the JS avent if any
     * @returns the current status
     */
    actionInfo(event) {
        return {
            source: this, event: event,
            cX: this._wcx, cY: this._wcy, scale: this._wscale
        };
    }
    /**
     * <p>Make this control invisible</p>
     * @returns this control
     */
    hide() {
        return super.hide(true);
    }
    /**
     * <p>Make this control visible</p>
     * @returns this control
     */
    show() {
        return super.show(true);
    }
    /**
     * <p>Make a layer invisible</p>
     * @param n the layer number &ge;0
     * @returns this control
     */
    hideLayer(n) {
        if (Number.isInteger(n) && n >= 0 && n < this._layers.length) {
            this._layers[n].hide();
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * <p>Make a layer visible</p>
     * @param n the layer number &ge;0
     * @returns this control
     */
    showLayer(n) {
        if (Number.isInteger(n) && n >= 0 && n < this._layers.length) {
            this._layers[n].show();
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * <p>Sets the image(s) to be displayed in this viewer. Any pre-existing
     * layers will be deleted.</p>
     * <p>All images will be resized to match the first (bottom) layer.</p>
     *
     * @param img an image or an array of images
     * @returns this control
     */
    layers(img) {
        const imgList = (Array.isArray(img) ? Array.from(img) : [img]);
        this._layers = [new Layer(imgList.shift())];
        this._lw = this._layers[0].width;
        this._lh = this._layers[0].height;
        // Calculate the minimum scale to ensure viewer is always filled
        this._fillViewScale = Math.max(this._w / this._lw, this._h / this._lh);
        this._wscale = this._fillViewScale;
        // Now set the world centre based on scrollers
        const [valueH, valueV] = this._scroller.getValue();
        this._wcx = this._lw * valueH;
        this._wcy = this._lh * valueV;
        // Append any remaining images
        if (imgList.length > 0)
            this.appendLayers(imgList);
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Appends additional image(s) to those already in this viewer. These
     * images will appear above any pre-existing layers.</p>
     *
     * <p>The additional images will be resized to match the first (bottom)
     * layer.</p>
     *
     * @param img an image or an array of images
     * @returns this control
     */
    appendLayers(img) {
        // If no existing layers then fresh start. 
        if (this._layers.length === 0)
            return this.layers(img);
        // Ready to append to existing layers
        const imgList = (Array.isArray(img) ? Array.from(img) : [img]);
        imgList.forEach(image => {
            const layer = new Layer(image);
            layer.resize(this._lw, this._lh);
            this._layers.push(layer);
        });
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Adds additional images the image(s) to those already displayed in
     * this viewer. They will be inserted after the position by the first
     * parameter.</p>
     *
     * <p>All additional images will be resized to match the first (bottom)
     * layer.</p>
     *
     * @param idx position to insert an image or an array of images
     * @param img an image or an array of images
     * @returns this control
     */
    addLayers(idx, img) {
        if (Number.isFinite(idx)) {
            // If no existing layers then fresh start. 
            if (this._layers.length === 0)
                return this.layers(img);
            // Constrain insertion point to valid array position
            idx = _constrain(idx, 0, this._layers.length);
            // Create new list with images resized to fit
            const imgList = (Array.isArray(img) ? Array.from(img) : [img]);
            const layerList = imgList.map(image => {
                const layer = new Layer(image);
                layer.resize(this._lw, this._lh);
                return layer;
            });
            this._layers.splice(idx, 0, ...layerList);
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * Deletes one or more layers from this viewer.
     *
     * @param idx the starting layer to delete
     * @param nbr the number of layers to delete
     * @returns this control
     */
    deleteLayers(idx, nbr) {
        if (Number.isFinite(idx) && Number.isFinite(nbr)) {
            if (idx >= 0 && idx < this._layers.length)
                this._layers.splice(idx, nbr);
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * Sets the stroke weight to use for the frame. If not provided
     * or &lt;0 then no frame is drawn.
     * @param sw the stroke weight for the frame
     * @returns this control
     */
    frame(sw = 0) {
        this._frameWeight = sw < 0 ? 0 : sw;
        return this;
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        const absPos = this.getAbsXY();
        const [mx, my] = [x - absPos.x, y - absPos.y];
        const needScroller = this._lw != this.w || this._lh != this.h || this._wscale != 1;
        // Over this control, scrollbar or scaler?
        this.over = Boolean(over.control === this
            || this._scroller.isSameControl(over.control)
            || (this._scaler && over.control === this._scaler));
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this.over = true;
                this._dragging = true;
                // Remember starting values
                this._mx0 = this._pmx = mx;
                this._my0 = this._pmy = my;
                this._dcx = this._wcx;
                this._dcy = this._wcy;
                if (needScroller)
                    this._scroller.show();
                this.invalidateBuffer();
                break;
            case 'mouseout':
                this._scroller.hide();
            case 'mouseup':
            case 'touchend':
                this._active = false;
                this._dragging = false;
                this.over = false;
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.over) {
                    if (this._dragging) {
                        this._scaler?.hide();
                        this._updateView(this._dcx + (this._mx0 - mx) / this._wscale, this._dcy + (this._my0 - my) / this._wscale);
                        this.view(this._wcx, this._wcy, this._wscale);
                        this._updateScrollerThumb();
                    }
                    else if (this._scaler) {
                        let a = this._scalerZone;
                        let v = mx >= a.x0 && mx <= a.x1 && my >= a.y0 && my <= a.y1;
                        if (v)
                            this._scaler.show();
                        else
                            this._scaler.hide();
                    }
                    if (needScroller)
                        this._scroller.show();
                }
                else {
                    this._scroller.hide();
                }
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
        const cs = this.SCHEME;
        const [ws, wcx, wcy] = [this._wscale, this._wcx, this._wcy];
        const [w, h, lw, lh] = [this._w, this._h, this._lw, this._lh];
        const cnrs = this.CNRS;
        const FRAME = cs.C$(7);
        // Get corners of requested view
        const ww2 = Math.round(0.5 * w / ws);
        const wh2 = Math.round(0.5 * h / ws);
        const o = this._overlap(0, 0, lw, lh, // image corners
        wcx - ww2, wcy - wh2, wcx + ww2, wcy + wh2); // world corners
        this._scroller.setUsed(o.usedH, o.usedV);
        uic.save();
        uic.beginPath();
        uic.roundRect(0, 0, w, h, cnrs);
        uic.clip();
        this._layers.forEach(layer => {
            if (layer.isVisible)
                uic.drawImage(layer.image, o.left, o.top, o.width, o.height, 0, 0, o.width * ws, o.height * ws);
        });
        if (this._frameWeight > 0) {
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.lineWidth = 2 * this._frameWeight;
            uic.strokeStyle = FRAME;
            uic.stroke();
        }
        this._updatePickBuffer();
        uic.restore();
    }
    /** @hidden */
    _updatePickBuffer() {
        const pkb = this._pkcBuffer;
        const pkc = pkb?.getContext('2d');
        if (!pkc)
            return;
        this._clearBuffer(pkb, pkc);
        const c = this._gui.pickColor(this);
        pkc.save();
        pkc.beginPath();
        pkc.roundRect(0, 0, this._w, this._h, this.CNRS);
        pkc.fillStyle = c.cssColor;
        pkc.fill();
        pkc.restore();
    }
    /**
     * <p>the 'a' parameters represent the image size
     * i.e. [0, 0, image_width, imgaeHeight] and 'b' the view
     * area taking into account scaling.</p>
     * @hidden
     */
    _overlap(ax0, ay0, ax1, ay1, bx0, by0, bx1, by1) {
        let topA = Math.min(ay0, ay1);
        let botA = Math.max(ay0, ay1);
        let leftA = Math.min(ax0, ax1);
        let rightA = Math.max(ax0, ax1); // image edges
        let topB = Math.min(by0, by1);
        let botB = Math.max(by0, by1);
        let leftB = Math.min(bx0, bx1);
        let rightB = Math.max(bx0, bx1); // world edges
        let leftO = leftA < leftB ? leftB : leftA;
        let rightO = rightA > rightB ? rightB : rightA;
        let botO = botA > botB ? botB : botA;
        let topO = topA < topB ? topB : topA;
        let width = rightO - leftO;
        let height = botO - topO;
        return {
            left: leftO, right: rightO, top: topO, bottom: botO,
            width: width, height: height,
            usedH: width / this._lw, usedV: height / this._lh
        };
    }
    // Hide these methods from typeDoc
    /** @hidden */ orient(dir) { return this.warn$('orient'); }
    /** @hidden */ tooltip(a) { return this.warn$('tooltip'); }
    /** @hidden */ tipTextSize(a) { return this.warn$('tipTextSize'); }
    /** @hidden */ opaque(a) { return this.warn$('opaque'); }
}
/** @hidden */
class Layer {
    constructor(img) {
        this._visible = true;
        this._image = cvsGuiCanvas(img);
    }
    get isVisible() { return this._visible; }
    ;
    get image() { return this._image; }
    ;
    get width() { return this._image.width; }
    get height() { return this._image.height; }
    show() {
        this._visible = true;
    }
    hide() {
        this._visible = false;
    }
    resize(lw, lh) {
        const [img, iw, ih] = [this._image, this._image.width, this._image.height];
        if (iw != lw || ih != lh) {
            const resizedImage = new OffscreenCanvas(lw, lh);
            const ctx = resizedImage.getContext('2d');
            ctx?.drawImage(img, 0, 0, iw, ih, 0, 0, lw, lh);
            this._image = resizedImage;
        }
    }
}
/** @hidden */
class ViewScrollPad {
    constructor(gui, name, vwr, padSize) {
        const pw = padSize > 1 ? padSize : vwr.w * padSize;
        const ph = padSize > 1 ? padSize : vwr.h * padSize;
        const px = vwr.w - pw - 4, py = vwr.h - ph - 4;
        this._scrPad = gui.__scrollpad(vwr.id + "-scrPad", px, py, pw, ph);
        this._scrPad.setAction((info) => {
            vwr.view(info.value[0] * vwr.lw, info.value[1] * vwr.lh);
            vwr.invalidateBuffer();
        });
        vwr.addChild(this._scrPad);
    }
    isSameControl(ctrl) {
        return this._scrPad === ctrl;
    }
    getValue() {
        return Array.from(this._scrPad.getValue());
    }
    setValue(hValue, vValue) {
        this._scrPad.setValue(hValue, vValue);
    }
    getUsed() {
        return Array.from(this._scrPad.getUsed());
    }
    setUsed(hValue, vValue) {
        this._scrPad.setUsed(hValue, vValue);
    }
    show() {
        this._scrPad.show();
        // this._scrV.show();
        return this;
    }
    hide() {
        this._scrPad.hide();
        // this._scrV.hide();
        return this;
    }
}
/** @hidden */
class ViewScrollBars {
    constructor(gui, name, vwr) {
        this._scrH = gui.__scrollbar(vwr.id + "-scrH", 16, vwr.h - 20, vwr.w - 32, 20);
        this._scrH.setAction((info) => {
            vwr.view(info.value * vwr.lw, vwr.wcy);
            vwr.invalidateBuffer();
        });
        this._scrV = gui.__scrollbar(vwr.id + "-scrV", vwr.w - 20, 10, vwr.h - 32, 20);
        this._scrV.orient('south').setAction((info) => {
            vwr.view(vwr.wcx, info.value * vwr.lh);
            vwr.invalidateBuffer();
        });
        vwr.addChild(this._scrH);
        vwr.addChild(this._scrV);
    }
    isSameControl(ctrl) {
        return this._scrH === ctrl || this._scrV === ctrl;
    }
    getValue() {
        return [this._scrH.getValue(), this._scrV.getValue()];
    }
    setValue(hValue, vValue) {
        this._scrH.setValue(hValue);
        this._scrV.setValue(vValue);
    }
    getUsed() {
        return [this._scrH.getUsed(), this._scrV.getUsed()];
    }
    setUsed(hValue, vValue) {
        this._scrH.setUsed(hValue);
        this._scrV.setUsed(vValue);
    }
    show() {
        this._scrH.show();
        this._scrV.show();
        return this;
    }
    hide() {
        this._scrH.hide();
        this._scrV.hide();
        return this;
    }
}
//# sourceMappingURL=viewer.js.map