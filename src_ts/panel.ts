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

    /** @hidden */ protected _canDragX: boolean = true;
    /** @hidden */ protected _canDragY: boolean = true;
    /** @hidden */ protected _dragData: Array<number>;
    /** @hidden */ protected _constrainX: boolean = true;
    /** @hidden */ protected _constrainY: boolean = true;

    /**
     * @hidden
     * @param gui the gui controller
     * @param name unique name for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x || 0, y || 0, w || 100, h || 100);
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
    get isDraggable() { return this._opaque && (this._canDragX || this._canDragY) }

    /** @hidden */
    get canDragX() { return this._canDragX }
    /** @hidden */
    get canDragY() { return this._canDragY }

    /** @hidden */
    _doEvent(e: MouseEvent | TouchEvent, x = 0, y = 0, over: any, enter: boolean): CvsControl {
        let absPos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0 && (this._canDragX || this._canDragY)) {
                    this._active = true;
                    this.over = true;
                    this._dragData = [mx, my];
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    this._active = false;
                    this.over = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive && (this._canDragX || this._canDragY)) {
                    let [msx, msy] = this._dragData;
                    let nx = this._x + (this._canDragX ? mx - msx : 0);
                    let ny = this._y + (this._canDragY ? my - msy : 0);
                    let [pw, ph] = [this._gui.canvasWidth, this._gui.canvasHeight];
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
                this.over = (this == over.control);
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }

    /** @hidden */
    _updateControlVisual(): void { // CvsPanel
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const OPAQUE = cs.C$(4, this._alpha);
        const HIGHLIGHT = cs.C$(9);

        const uic = this._uicContext;

        uic.save();
        uic.clearRect(0, 0, this._w, this._h);
        if (this._opaque) {
            uic.fillStyle = OPAQUE;
            uic.beginPath();
            uic.roundRect(0, 0, this._w, this._h, cnrs);
            uic.fill();
        }
        if (this.over) {
            uic.strokeStyle = HIGHLIGHT;
            uic.lineWidth = 2;
            uic.beginPath();
            uic.roundRect(1, 1, this._w - 2, this._h - 2, cnrs);
            uic.stroke();
        }
        // Update pick buffer before restoring
        this._updatePickBuffer();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */
    _updatePickBuffer() {
        let pkc = this._pkcContext;
        let c = this._gui.pickColor(this);
        pkc.clearRect(0, 0, this._w, this._h);
        pkc.save();
        pkc.fillStyle = c.cssColor;
        pkc.beginPath();
        pkc.roundRect(1, 1, this._w - 1, this._h - 1, this.CNRS);
        pkc.fill();
        pkc.restore();
    }

    // Hide these methods from typeDoc
    /** @hidden */ parent(a, b, c) { return this.warn$('parent') }
    /** @hidden */ leaveParent() { return this.warn$('leaveParent') }
    /** @hidden */ tooltip(a) { return this.warn$('tooltip') }
    /** @hidden */ tipTextSize(a) { return this.warn$('tipTextSize') }
    /** @hidden */ orient(a) { return this.warn$('orient') }
}

Object.assign(CvsPanel.prototype, PICKABLE);

