/**
 * <p>This class represents a draggable panel that can be used to hold other
 * controls.</p>
 */
class CvsPanel extends CvsBufferedControl {


    /** @hidden */ protected _canDragX: boolean = true;
    /** @hidden */ protected _canDragY: boolean = true;

    /** @hidden */
    get _canDrag() { return (this._canDragX || this._canDragY) }


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
    }

    /** @hidden */
    _doEvent(e: MouseEvent | TouchEvent, x = 0, y = 0, over: any, enter: boolean): CvsBaseControl {
        let absPos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0) { // Thumb
                    this.isActive = true;
                    // this._clickAllowed = true; // false if mouse moves
                    this.isOver = true;
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                this.isActive = false;
                this.isOver = false;
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    CLOG('stuff to do')
                }
                this.isOver = (this == over.control);
                this.invalidateBuffer();
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }



    /** @hidden */
    _updateControlVisual(): void { // CvsSlider
        let cs = this._scheme || this._gui.scheme();

        const OPAQUE = cs['C_1'];
        const HIGHLIGHT = cs['C_6'];

        let uib = this._uiBfr;

        uib.push();
        uib.clear();
        if (this._opaque) {
            uib.noStroke(); uib.fill(OPAQUE);
            uib.rect(0, 0, this._w, this._h, ...this._c);
        }

        uib.noStroke();
        if (this._isOver) {
            uib.strokeWeight(2);
            uib.stroke(HIGHLIGHT);
        }
        // Update pick buffer before restoring
        this._updateRectControlPB();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */
    _updateSliderPickBuffer(ty: number, tw: number, tH: number, tbX: number, tbSize: number) {
        tbX = Math.round(tbX)
        let c = this._gui.pickColor(this);
        let pkb = this._pkBfr;
        pkb.push();
        pkb.clear();
        pkb.noStroke();
        // Now translate to track left edge - track centre
        pkb.translate(10, ty);
        // Track
        // pkb.fill(c.r, c.g, c.b + 5);
        // pkb.rect(0, -tH / 2, tw, tH, ...this._c);
        // pkb.fill(c.r, c.g, c.b + 6);
        // pkb.rect(0, -tH / 2, tbX, tH, ...this._c);
        // Thumb
        pkb.fill(c.r, c.g, c.b);
        pkb.rect(tbX - tbSize / 2, -tbSize / 2, tbSize, tbSize); //, ...this._c);
        pkb.pop();
    }

    /** @hidden */
    _minControlSize() {
        return { w: this._w, h: 20 };
    }

}

// Object.assign(CvsPanel.prototype, NoTooltip);