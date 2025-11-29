/**
 * <p>This class represents a draggable panel that can be used to hold other
 * controls.</p>
 * <p>On creation the panel -</p>
 * <ol>
 * <li>has an opaque background (this is required for dragging).</li>
 * <li>can be dragged in both X and Y directions.</li>
 * <li>is constrained so the entire panel stays within the display area.</li>
 * </ol>
 * <p>If the background is transparent then the panel cannot be dragged.
 * Panel movement can limited using the <code>draggable()</code> and
 * <code>constrain()</code> methods.</p>
 * <p>It is recommended that the panel width and height should not exceed
 * that of the display area (i.e. canvas).</p>
 */
class CvsPanel extends CvsBufferedControl {
    /**
     * @hidden
     * @param gui the gui controller
     * @param name unique name for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 100, h || 100);
        /** @hidden */ this._canDragX = true;
        /** @hidden */ this._canDragY = true;
        /** @hidden */ this._constrainX = true;
        /** @hidden */ this._constrainY = true;
        this._opaque = true;
        this._z = PANEL_Z;
    }
    /**
     * Horizontal and vertical movement can be restricted based on the actual
     * parameters. If either parameter is true then then the panel is
     * considered 'draggable'.
     * @param allowX allow horizontal movement if true
     * @param allowY allow vertical movement if true
     * @returns this control
     */
    draggable(allowX = true, allowY = true) {
        this._canDragX = allowX;
        this._canDragY = allowY;
        return this;
    }
    /**
     * Panel position can be constrained horizontally and vertically so that
     * it fits within the outside the display area.
     * @param limitX
     * @param limitY
     * @returns this control
     */
    constrain(limitX = true, limitY = true) {
        this._constrainX = limitX;
        this._constrainY = limitY;
        return this;
    }
    /** True if the panel can be dragged else false. */
    get isDraggable() { return this._opaque && (this._canDragX || this._canDragY); }
    /** @hidden */
    get canDragX() { return this._canDragX; }
    /** @hidden */
    get canDragY() { return this._canDragY; }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let absPos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0 && (this._canDragX || this._canDragY)) {
                    this._active = true;
                    this.isOver = true;
                    this._dragData = [mx, my];
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    this._active = false;
                    this.isOver = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive && (this._canDragX || this._canDragY)) {
                    let [msx, msy] = this._dragData;
                    let nx = this._x + (this._canDragX ? mx - msx : 0);
                    let ny = this._y + (this._canDragY ? my - msy : 0);
                    let [pw, ph] = [this._p.width, this._p.height];
                    let [cw, ch] = [this._w, this._h];
                    if (this._constrainX && cw <= pw) {
                        if (nx < 0)
                            nx = 0;
                        else if (nx > pw - cw)
                            nx = pw - cw;
                    }
                    if (this._constrainY && ch <= ph) {
                        if (ny < 0)
                            ny = 0;
                        else if (ny > ph - ch)
                            ny = ph - ch;
                    }
                    this.moveTo(nx, ny);
                }
                this.isOver = (this == over.control);
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
        let cs = this.SCHEME;
        let cnrs = this.CNRS;
        const OPAQUE = cs.C(6, this._alpha);
        const HIGHLIGHT = cs.C(9);
        let uib = this._uiBfr;
        uib.push();
        uib.clear();
        uib.strokeWeight(3);
        uib.noStroke();
        uib.noFill();
        if (this._opaque)
            uib.fill(...OPAQUE);
        if (this.isOver)
            uib.stroke(...HIGHLIGHT);
        uib.rect(0, 0, this._w, this._h, ...cnrs);
        // Update pick buffer before restoring
        this._updatePanelControlPB();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /**
     * Update rectangular controls using full buffer i.e.
     * Button, Option, Checkbox, Textfield
     * @hidden
     */
    _updatePanelControlPB() {
        let cnrs = this.CNRS;
        let pkb = this._pkBfr;
        pkb.clear();
        pkb.noStroke();
        pkb.noFill();
        let c = this._gui.pickColor(this);
        if (this._opaque)
            pkb.fill(c.r, c.g, c.b);
        pkb.rect(0, 0, this._w, this._h, ...cnrs);
    }
    /** @hidden */
    _minControlSize() {
        return { w: this._w, h: this._h };
    }
    // Hide these methods from typeDoc
    /** @hidden */ parent(parent, rx, ry) { return this; }
    /** @hidden */ leaveParent() { return this; }
    /** @hidden */ tooltip(tiptext) { return this; }
    /** @hidden */ tipTextSize(gtts) { return this; }
    /** @hidden */ orient(dir) { return this; }
}
Object.assign(CvsPanel.prototype, NoParent);
Object.assign(CvsPanel.prototype, NoTooltip);
Object.assign(CvsPanel.prototype, NoOrient);
//# sourceMappingURL=panel.js.map