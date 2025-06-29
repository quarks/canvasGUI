/**
 * <p>A tooltip is a simply text hint that appears near to a control with the 
 * mouse over it.</p>
 * 
 * <p>The tooltip's relative position to thr dontrol is automatically set to 
 * make sure it is visible inside the canvas area.</p>
 * @hidden
 */
class CvsTooltip extends CvsText {

    /** @hidden */ protected _gap: number;
    /** @hidden */ protected _showTime: number;

    /** @hidden */
    constructor(gui: GUI, name: string) {
        super(gui, name);
        this._gap = 1;
        this._visible = false;
        this._showTime = 0;
    }

    /**
       * <p>Sets the text to be displayed in the tooltip.</p>
       * <p>Processing constants are used to define the alignment.</p>
       * @param t the text to display
       * @returns this control
       */
    text(t: string) {
        if (Array.isArray(t))
            this._lines = t;
        else {
            let lines = t.toString().split('\n');
            this._lines = [];
            for (let line of lines)
                this._lines.push(line);
        }
        // If necessary expand the control to surround text
        let s = this._minControlSize();
        this._w = Math.max(this._w, s.w);
        this._h = Math.max(this._h, s.h);
        this.invalidateBuffer();
        return this;
    }

    /**
     * <p>Set the time to display the tooltip
     * @param duration display time in ms
     * @returns this control
     */
    showTime(duration: number) {
        this._showTime = duration;
        return this;
    }

    /** @hidden */
    _updateState(owner: CvsBufferedControl, prevOver: number, currOver: number) {
        if (owner.isVisible() && prevOver != currOver)
            if (currOver > 0) {
                this.show();
                setTimeout(() => { this.hide() }, this._showTime);
            }
    }

    /** @hidden */
    _validatePosition() {
        let p = this._parent;
        let pp = p.getAbsXY(), px = pp.x, py = pp.y;
        let pa = p.orientation().wh(p.w(), p.h()), ph = pa.h;
        // Start tip in default location
        this._x = 0, this._y = -this._h;
        if (py + this._y < 0)
            this._y += this._h + ph;
        if (px + this._x + this._w > this._gui.canvasWidth())
            this._x -= this._w - pa.w;
    }

    /** @hidden */
    _updateControlVisual() { // CvsTooltip
        let ts = this._textSize || this._gui.tipTextSize();
        let cs = this._parent.scheme() || this._gui.scheme();
        let b = this._buffer;
        let lines = this._lines;
        let gap = this._gap;

        const BACK = cs['C_3'];
        const FORE = cs['C_9'];

        b.push();
        b.clear();
        // Backkground
        b.stroke(FORE); b.fill(BACK);
        b.rect(0, 0, this._w - 1, this._h - 1);

        b.fill(FORE).noStroke();
        if (lines.length > 0) {
            b.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = b.textAscent() + (this._h - th) / 2;

            for (let line of lines) {
                sx = x0 + (tw - b.textWidth(line)) / 2;
                b.text(line, sx, py);
                py += b.textLeading();
            }
        }
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */
    _minControlSize() {
        let b = this._buffer;
        let lines = this._lines;
        let ts = this._textSize || this._gui.tipTextSize();
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
        // Calculate minimum length and height of are to hold
        // multiple lines of text
        if (lines.length > 0) {
            if (!b) this._validateBuffer();
            b.textSize(ts);
            tbox.w = ts + lines.map(t => b.textWidth(t)).reduce((x, y) => (x > y) ? x : y);
            tbox.h = (lines.length - 1) * b.textLeading() + b.textAscent() + b.textDescent();
            gap += this._gap;
        }
        sw += tbox.w + gap;
        sh = Math.max(tbox.h, sh) + 2 * gap;
        return { w: sw, h: sh };
    }

}