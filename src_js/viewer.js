/**
 * <p>This control is used to scroll and zoom on an image.</p>
 * <p>When the mouse moves over the control scrollbars will appear (if needed)
 * inside the bottom and right-hand-side edges of the view. When the mouse is
 * near the centre a slider will appear which can be used to change the scale.</p>
 *
 * <p>This control also supports layers where multiple images can be layered
 * to make the final visual.</p>
 *
 */
class CvsViewer extends CvsBufferedControl {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h);
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
        this._scrH = gui.__scroller(this._id + "-scrH", 4, h - 24, w - 28, 20).hide()
            .setAction((info) => {
            this.view(info.value * this._lw, this._wcy);
            this.invalidateBuffer();
        });
        this._scrV = gui.__scroller(this._id + "-scrV", w - 24, 4, h - 28, 20).orient('south').hide()
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
            let value = this._p.constrain(v, low, high);
            // If we don't have a scaler then create it
            if (!this._scaler) {
                let [w, h] = [this._w, this._h];
                let sclrX = 0.25 * w, sclrY = 0.5 * h - 10;
                let sclrW = 0.5 * w, sclrH = 20;
                this._scaler = this._gui.slider(this._id + "-scaler", sclrX, sclrY, sclrW, sclrH)
                    .hide()
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
            this._scaler.limits(low, high);
            this._scaler.value(value);
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
     * <p>Sets or gets the scale and or scale limits</p>
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
    view(wcx, wcy, wscale) {
        // /** @hidden */
        function different(a, b) {
            return Math.abs(a - b) >= 0.001;
        }
        if (Number.isFinite(wcx) && Number.isFinite(wcy)) {
            if (different(this._wcx, wcx) || different(this._wcy, wcy)) {
                this._wcx = this._p.constrain(wcx, 0, this._lw);
                this._wcy = this._p.constrain(wcy, 0, this._lh);
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
                source: this, p5Event: undefined,
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
        this._layers = (Array.isArray(img) ? Array.from(img) : [img]);
        // Make all layers the same size as the first one
        let lw = this._lw = this._layers[0].width;
        let lh = this._lh = this._layers[0].height;
        for (let idx = 1; idx < this._layers.length; idx++) {
            let l = this._layers[idx];
            if (l.width != lw || l.height != lh)
                l.resize(lw, lh);
        }
        // Now set the world centre based on scrollers
        this._wcx = this._scrH.getValue() * this._lw;
        this._wcy = this._scrV.getValue() * this._lh;
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
        if (this._layers.length === 0)
            return this.layers(img);
        let imgs = (Array.isArray(img) ? Array.from(img) : [img]);
        let [lw, lh] = [this._lw, this._lh];
        imgs.forEach(i => {
            if (i.width !== lw || i.height !== lh)
                i.resize(lw, lh);
            this._layers.push(i);
        });
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Adds additional images the image(s) to those already displayed in
     * this viewer. They will be inserted at the position by the first
     * parameter.</p>
     *
     * <p>All additional images will be resized to match the first (bottom)
     * layer.</p>
     *
     * @param img an image or an array of images
     * @returns this control
     */
    addLayers(idx, img) {
        idx = Number.isFinite(idx) && idx >= 0 && idx < this._layers.length
            ? idx : this._layers.length;
        if (this._layers.length === 0)
            return this.layers(img);
        if (idx === this._layers.length)
            return this.appendLayers(img);
        let imgs = (Array.isArray(img) ? Array.from(img) : [img]);
        let more = [];
        let [lw, lh] = [this._lw, this._lh];
        imgs.forEach(i => {
            if (i.width !== lw || i.height !== lh)
                i.resize(lw, lh);
            more.push(i);
        });
        this._layers.splice(idx, 0, ...more);
        this.invalidateBuffer();
        return this;
    }
    /**
     * Deletes 1 or more layers from this viewer.
     *
     * @param idx the starting layer to delete
     * @param nbr the number of layers to delete
     * @returns this control
     */
    deleteLayers(idx, nbr) {
        if (Number.isFinite(idx) && Number.isFinite(nbr)) {
            if (idx >= 0 && idx < this._layers.length)
                this._layers.splice(idx, nbr);
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
    shrink(dim) {
        console.warn("Cannot 'shrink' a viewer");
        return this;
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let absPos = this.getAbsXY();
        let [mx, my, cw, ch] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        this.isOver = (mx >= 0 && mx <= cw && my >= 0 && my <= ch);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this.isOver = true;
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
                    source: this, p5Event: undefined,
                    cX: this._wcx, cY: this._wcy, scale: this._wscale
                });
                this._active = false;
                this._dragging = false;
                this.isOver = false;
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isOver) {
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
        return this.isOver ? this : null;
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
        else if (this._xor(left < 0, right > this._lw))
            if (left < 0)
                ncx -= left;
            else
                ncx += this._lw - right;
        if (pinnedV || top < 0 && bottom > this._lh) // vertical
            ncy = this._lh / 2;
        else if (this._xor(top < 0, bottom > this._lh))
            if (top < 0)
                ncy -= top;
            else
                ncy += this._lh - bottom;
        this.view(ncx, ncy);
        this.invalidateBuffer();
    }
    /** @hidden */
    _updateControlVisual() {
        let cs = this.SCHEME;
        let p = this._p;
        let [ws, wcx, wcy] = [this._wscale, this._wcx, this._wcy];
        let [w, h, lw, lh] = [this._w, this._h, this._lw, this._lh];
        const OPAQUE = cs.C(2, this._alpha);
        const FRAME = cs.C(7);
        let uib = this._uiBfr;
        uib.push();
        if (this._opaque)
            uib.background(...OPAQUE);
        else
            uib.clear();
        // Get corners of requested view
        let ww2 = Math.round(0.5 * w / ws);
        let wh2 = Math.round(0.5 * h / ws);
        let o = this._overlap(0, 0, lw, lh, // image corners
        wcx - ww2, wcy - wh2, wcx + ww2, wcy + wh2); // world corners
        let [ox, oy] = [Math.round(o.offsetX * ws), Math.round(o.offsetY * ws)];
        let [ow, oh] = [Math.round(o.width * ws), Math.round(o.height * ws)];
        // If we have an offset then calculate the view image 
        if (o.valid) { // Calculate display offset
            for (let i = 0, len = this._layers.length; i < len; i++) {
                if (!this._hidden.has(i) && this._layers[i]) {
                    // Get view image and adjust for scale
                    let view = this._layers[i].get(o.left, o.top, o.width, o.height);
                    if (Math.abs(ws - 1) > 0.01)
                        view.resize(ow, oh);
                    uib.image(view, o.offsetX * ws, o.offsetY * ws, view.width, view.height);
                }
            }
        }
        if (this._frameWeight > 0) {
            uib.noFill();
            uib.stroke(...FRAME);
            uib.strokeWeight(this._frameWeight);
            uib.rect(0, 0, uib.width, uib.height);
        }
        this._updateViewerPickBuffer(ox, oy, ow, oh);
        uib.pop();
    }
    /** @hidden */
    _updateViewerPickBuffer(x, y, w, h) {
        let c = this._gui.pickColor(this);
        let pkb = this._pkBfr;
        pkb.push();
        pkb.clear();
        pkb.noStroke();
        pkb.fill(c.r, c.g, c.b);
        pkb.rect(x, y, w, h);
        pkb.pop();
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
            return { valid: false };
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
    /** @hidden */
    _xor(a, b) {
        return (a || b) && !(a && b);
    }
    /** @hidden */
    _minControlSize() {
        return { w: this._w, h: this._h };
    }
    // Hide these methods from typeDoc
    /** @hidden */ orient(dir) { return this; }
    /** @hidden */ tooltip(tiptext) { return this; }
    /** @hidden */ tipTextSize(tsize) { return this; }
    /** @hidden */ corners(c) { return this; }
}
Object.assign(CvsViewer.prototype, NoOrient);
Object.assign(CvsViewer.prototype, NoTooltip);
Object.assign(CvsViewer.prototype, NoCorners);
//# sourceMappingURL=viewer.js.map