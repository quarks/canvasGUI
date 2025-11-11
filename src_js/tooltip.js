/**
 * <p>A tooltip is a simply text hint that appears near to a control with the
 * mouse over it.</p>
 * <p>The tooltip's relative position to the control is automatically set to
 * make sure it is visible inside the canvas area.</p>
 * @hidden
 */
class CvsTooltip extends CvsText {
    /** @hidden */
    constructor(gui, name) {
        super(gui, name);
        this._gap = 1;
        this._visible = false;
    }
    /**
     * <p>Sets the text to be displayed in the tooltip.</p>
     * <p>Processing constants are used to define the alignment.</p>
     * @param t the text to display
     * @returns this control
     */
    text(t) {
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
    /** @hidden */
    show(cascade) { return this; }
    /** @hidden */
    hide(cascade) { return this; }
    /** @hidden */
    _updateState(enter) {
        if (enter && !this._active) {
            this._active = true;
            this._visible = true;
            setTimeout(() => { this._visible = false; }, this._gui._show_time);
            setTimeout(() => { this._active = false; }, this._gui._repeat_time);
        }
    }
    /** @hidden */
    _validatePosition() {
        let p = this._parent;
        let { x: px, y: py } = p.getAbsXY();
        let [pw, ph] = p.orientation().wh(p.w, p.h);
        this._x = 0, this._y = -this._h;
        if (py + this._y < 0)
            this._y += this._h + ph;
        if (px + this._x + this._w > this._gui.canvasWidth())
            this._x -= this._w - pw;
    }
    /** @hidden */
    _updateControlVisual() {
        let ts = this._textSize || this._gui.tipTextSize();
        let cs = this._parent.scheme() || this._gui.scheme();
        let lines = this._lines, gap = this._gap;
        const BACK = cs.C(3);
        const FORE = cs.C(9);
        let uib = this._uiBfr;
        uib.push();
        uib.clear();
        // Backkground
        uib.stroke(...FORE);
        uib.fill(...BACK);
        uib.rect(0, 0, this._w - 1, this._h - 1);
        uib.fill(...FORE).noStroke();
        if (lines.length > 0) {
            uib.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = uib.textAscent() + (this._h - th) / 2;
            for (let line of lines) {
                sx = x0 + (tw - uib.textWidth(line)) / 2;
                uib.text(line, sx, py);
                py += uib.textLeading();
            }
        }
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _minControlSize() {
        let b = this._uiBfr;
        let lines = this._lines;
        let ts = this._textSize || this._gui.tipTextSize();
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
        // Calculate minimum length and height of are to hold
        // multiple lines of text
        if (lines.length > 0) {
            if (!b)
                this._validateBuffer();
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
//# sourceMappingURL=tooltip.js.map