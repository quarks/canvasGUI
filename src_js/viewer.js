/**
 * <h2>Displays a layered image the same size or larger than the view.</h2>
 *
 * <p><b>Scrolling:</b> if the image is larger than the control then it can
 * panned by dragging the mouse on the image. Alternatively the scrollbars,
 * which automatically appear when if needed, can be used to pane the image.</p>
 * <p><b>Zooming:</b> requires the user to request a scaler when creating
 * this control. When the mouse is near the centre a slider will appear
 * which can be used to zoom in to and out of te image.</p>
 *
 * <p>This control also supports layers where multiple images can be layered
 * to make the final visual. Layers can be added, removed, hiiden and show
 * on an individual basis</p>
 *
 */
class CvsViewer extends CvsBufferedControl {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h, true);
        /** @hidden */ this._layers = [];
        /** @hidden */ this._hidden = new Set();
        // Layer width and height (pixels)
        /** @hidden */ this._lw = 0;
        /** @hidden */ this._lh = 0;
        /** @hidden */ this._wcx = 0;
        /** @hidden */ this._wcy = 0;
        /** @hidden */ this._wscale = 1;
        /** @hidden */ this._usedX = 0;
        /** @hidden */ this._usedY = 0;
        /** @hidden */ this._scalerZone = { x0: 0, y0: 0, x1: 0, y1: 0 };
        /** @hidden */ this._frameWeight = 0;
        this._corners = [0, 0, 0, 0];
        this._scrH = gui.__scroller(this._id + "-scrH", 4, h - 24, w - 28, 20);
        this._scrH.hide()
            .setAction((info) => {
            this.view(info.value * this._lw, this._wcy);
            this.invalidateBuffer();
        });
        this._scrV = gui.__scroller(this._id + "-scrV", w - 24, 4, h - 28, 20);
        this._scrV.orient('south').hide()
            .setAction((info) => {
            this.view(this._wcx, info.value * this._lh);
            this.invalidateBuffer();
        });
        this.addChild(this._scrH);
        this.addChild(this._scrV);
    }
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
            let low = Math.min(l0, l1);
            let high = Math.max(l0, l1);
            let value = _constrain(v, low, high);
            // If we don't have a scaler then create it
            if (!this._scaler) {
                let [w, h] = [this._w, this._h];
                let sclrX = 0.25 * w, sclrY = 0.5 * h - 10;
                let sclrW = 0.5 * w, sclrH = 20;
                this._scaler = this._gui.slider(this._id + "-scaler", sclrX, sclrY, sclrW, sclrH);
                this._scaler.weight(12);
                this._scaler.hide()
                    .setAction((info) => {
                    this._wscale = info.value;
                    this.invalidateBuffer();
                });
                this.addChild(this._scaler);
                this._scalerZone = {
                    x0: 0.15 * w, y0: 0.4 * h - 10,
                    x1: 0.85 * w, y1: 0.6 * h + 10
                };
            }
            // Now update the scroller
            this._scaler?.limits(low, high);
            this._scaler?.value(value);
            this._wscale = value;
            // If we already have layers then update centre position
            if (this._lw > 0 && this._lh > 0) {
                this._wcx = this._lw * this._scrH.getValue();
                this._wcy = this._lh * this._scrV.getValue();
                this.invalidateBuffer();
            }
        }
        return this;
    }
    /**
     * <p>Sets or gets the current scale in use.</p>
     * <p>If no parameters are passed the the current scale is returned. A
     * single parameter sets the current scale and three parameter sets the
     * current scale and the limits for the zoom slider.</p>
     *
     * @param v the scale to use
     * @returns this control or the current scale
     */
    scale(v) {
        if (!Number.isFinite(v)) // no parameters
            return this._wscale;
        if (this._scaler)
            this._scaler.value(v);
        this._wscale = v;
        this.view(this._wcx, this._wcy, this._wscale);
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>The current status is an object with 3 fields <code>\{ cX, cY, scale \}</code>
     * where -</p>
     * <ul>
     * <li><code>cX, cY</code> is the position in the image that correseponds to the view center and</li>
     * <li><code>scale</code> is the current scale used to display the image.</li>
     * </ul>
     * @returns the current status
     */
    status() {
        return { cX: this._wcx, cY: this._wcy, scale: this._wscale };
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
        if (Number.isInteger(n))
            if (n >= 0 && n < this._layers.length && !this._hidden.has(n)) {
                this._hidden.add(n);
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
        if (Number.isInteger(n))
            if (n >= 0 && n < this._layers.length && this._hidden.has(n)) {
                this._hidden.delete(n);
                this.invalidateBuffer();
            }
        return this;
    }
    /**
     * Sets the view of the image to be displayed. If you enter values outside the
     * image or ar scale value outside scaler limts they will be constrained to legal
     * values. If it is important that you know the correct view details then add an
     * action on the viewer to report back changes to the view centre and/or scale
     * attributes.
    */
    view(wcx, wcy, wscale = this._wscale) {
        function different(a, b) {
            return Math.abs(a - b) >= 0.001;
        }
        if (Number.isFinite(wcx) && Number.isFinite(wcy)) {
            if (different(this._wcx, wcx) || different(this._wcy, wcy)) {
                this._wcx = _constrain(wcx, 0, this._lw);
                this._wcy = _constrain(wcy, 0, this._lh);
                this._scrH.update(wcx / this._lw);
                this._scrV.update(wcy / this._lh);
                this.invalidateBuffer();
            }
            if (different(this._wscale, wscale)) {
                this._wscale = wscale;
                if (this._scaler)
                    this._scaler.value(wscale);
                this.invalidateBuffer();
            }
            this.action({
                source: this, event: undefined,
                cX: this._wcx, cY: this._wcy, scale: this._wscale
            });
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
        let imgList = (Array.isArray(img) ? Array.from(img) : [img]);
        this._layers = [cvsGuiCanvas(imgList.shift())];
        this._lw = this._layers[0].width;
        this._lh = this._layers[0].height;
        // Now set the world centre based on scrollers
        this._wcx = this._scrH.getValue() * this._lw;
        this._wcy = this._scrV.getValue() * this._lh;
        // Append any remiang images
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
        let imgList = (Array.isArray(img) ? Array.from(img) : [img]);
        imgList.forEach(image => this._layers.push(this._getImageToFit(image)));
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
     * @param idx an image or an array of images
     * @param img an image or an array of images
     * @returns this control
     */
    addLayers(idx, img) {
        // If no existing layers then fresh start. 
        if (this._layers.length === 0)
            return this.layers(img);
        // Constrain insertion point to valid array position
        idx = Number.isFinite(idx) && idx >= 0 && idx < this._layers.length
            ? idx : this._layers.length - 1;
        // Create new list with images resized to fit
        let imgList = (Array.isArray(img) ? Array.from(img) : [img]);
        let imgFitList = imgList.map(image => this._getImageToFit(image));
        this._layers.splice(idx, 0, ...imgFitList);
        this.invalidateBuffer();
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
    _getImageToFit(img) {
        const [lw, lh] = [this._lw, this._lh];
        img = cvsGuiCanvas(img);
        if (img.width != lw || img.height != lh) {
            let layer = new OffscreenCanvas(lw, lh);
            const ctx = layer.getContext('2d');
            ctx?.drawImage(img, 0, 0, img.width, img.height, 0, 0, lw, lh);
            return layer;
        }
        return img;
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let absPos = this.getAbsXY();
        let [mx, my, cw, ch] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        this.over = (mx >= 0 && mx <= cw && my >= 0 && my <= ch);
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
                this._scrH.show();
                this._scrV.show();
                this.invalidateBuffer();
                break;
            case 'mouseout':
                this._scrH.hide();
                this._scrV.hide();
            case 'mouseup':
            case 'touchend':
                this.action({
                    source: this, event: undefined,
                    cX: this._wcx, cY: this._wcy, scale: this._wscale
                });
                this._active = false;
                this._dragging = false;
                this.over = false;
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.over) {
                    if (this._dragging) {
                        this._scaler?.hide();
                        this._validateMouseDrag(this._dcx + (this._mx0 - mx) / this._wscale, this._dcy + (this._my0 - my) / this._wscale);
                        this.invalidateBuffer();
                    }
                    else if (this._scaler) {
                        let a = this._scalerZone;
                        let v = mx >= a.x0 && mx <= a.x1 && my >= a.y0 && my <= a.y1;
                        if (v)
                            this._scaler.show();
                        else
                            this._scaler.hide();
                    }
                    this._scrH.show();
                    this._scrV.show();
                }
                else {
                    this._scrH.hide();
                    this._scrV.hide();
                }
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.over ? this : null;
    }
    /** @hidden */
    _validateMouseDrag(ncx, ncy) {
        let ww2 = Math.round(0.5 * this._w / this._wscale);
        let wh2 = Math.round(0.5 * this._h / this._wscale);
        // See if the current display should be pinned
        let cleft = this._wcx - ww2, cright = this._wcx + ww2;
        let ctop = this._wcy - wh2, cbottom = this._wcy + wh2;
        let pinnedH = (cleft < 0 && cright > this._lw);
        let pinnedV = (ctop < 0 && cbottom > this._lh);
        // Now cosnider the 'new' centre
        let left = ncx - ww2, right = ncx + ww2;
        let top = ncy - wh2, bottom = ncy + wh2;
        if (pinnedH || left < 0 && right > this._lw) // Horizontal
            ncx = this._lw / 2;
        else if (_xor(left < 0, right > this._lw))
            if (left < 0)
                ncx -= left;
            else
                ncx += this._lw - right;
        if (pinnedV || top < 0 && bottom > this._lh) // vertical
            ncy = this._lh / 2;
        else if (_xor(top < 0, bottom > this._lh))
            if (top < 0)
                ncy -= top;
            else
                ncy += this._lh - bottom;
        this.view(ncx, ncy);
        this.invalidateBuffer();
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
        const OPAQUE = cs.C$(2, this._alpha);
        const FRAME = cs.C$(7);
        uic.save();
        if (this._opaque) {
            uic.fillStyle = OPAQUE;
            uic.fillRect(0, 0, this._w, this._h);
        }
        else {
            uic.clearRect(0, 0, this._w, this._h);
        }
        // Get corners of requested view
        const ww2 = Math.round(0.5 * w / ws);
        const wh2 = Math.round(0.5 * h / ws);
        const o = this._overlap(0, 0, lw, lh, // image corners
        wcx - ww2, wcy - wh2, wcx + ww2, wcy + wh2); // world corners
        this._pkBox = [
            Math.round(o.offsetX * ws),
            Math.round(o.offsetY * ws),
            Math.round(o.width * ws),
            Math.round(o.height * ws)
        ];
        // If we have an offset then calculate the view image 
        if (o.valid) { // Calculate display offset
            for (let i = 0; i < this._layers.length; i++) {
                if (!this._hidden.has(i) && this._layers[i]) {
                    uic.drawImage(this._layers[i], o.left, o.top, o.width, o.height, o.offsetX * ws, o.offsetY * ws, o.width * ws, o.height * ws);
                }
            }
        }
        if (this._frameWeight > 0) {
            const fw = this._frameWeight;
            uic.lineWidth = fw;
            uic.strokeStyle = FRAME;
            uic.strokeRect(fw / 2, fw / 2, this._w - fw, this._h - fw);
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
        const [x, y, w, h] = [...this._pkBox];
        const c = this._gui.pickColor(this);
        pkc.save();
        pkc.fillStyle = 'white';
        pkc.fillRect(0, 0, this._w, this._h);
        pkc.fillStyle = c.cssColor;
        pkc.fillRect(x, y, w, h);
        pkc.restore();
    }
    /**
     * <p>the 'a' parameters represent the image size i.e. [0, 0, image_width, imgaeHeight]
     * and 'b' the view area taking into account scaling.</p>
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
        if (botA <= topB || botB <= topA || rightA <= leftB || rightB <= leftA)
            return {
                valid: false, left: 0, right: 0, top: 0, bottom: 0,
                width: 0, height: 0, offsetX: 0, offsetY: 0,
            };
        let leftO = leftA < leftB ? leftB : leftA;
        let rightO = rightA > rightB ? rightB : rightA;
        let botO = botA > botB ? botB : botA;
        let topO = topA < topB ? topB : topA;
        let width = rightO - leftO;
        let height = botO - topO;
        let offsetX = leftO - leftB;
        let offsetY = topO - topB;
        // Update scrollers
        this._scrH.update(undefined, width / this._lw);
        this._scrV.update(undefined, height / this._lh);
        return {
            valid: true,
            left: leftO, right: rightO, top: topO, bottom: botO,
            width: width, height: height,
            offsetX: offsetX, offsetY: offsetY,
        };
    }
    // Hide these methods from typeDoc
    /** @hidden */ orient(dir) { return this.warn$('orient'); }
    /** @hidden */ tooltip(a) { return this.warn$('tooltip'); }
    /** @hidden */ tipTextSize(a) { return this.warn$('tipTextSize'); }
    /** @hidden */ corners(c) { return this.warn$('corners'); }
}
//# sourceMappingURL=viewer.js.map