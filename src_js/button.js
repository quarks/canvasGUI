/**
 * <p>This class is to create simple buttons with text and / or icons on its face.</p>
 */
class CvsButton extends CvsTextIcon {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
    }
    /** @hidden */
    _updateControlVisual() {
        let ts = this._textSize || this._gui.textSize();
        let cs = this._scheme || this._gui.scheme();
        let iA = this._iconAlign, tA = this._textAlign;
        let icon = this._icon, lines = this._lines, gap = this._gap;
        const BACK = cs['C_3'], FORE = cs['C_8'], HIGHLIGHT = cs['C_9'];
        let uib = this._uiBfr;
        uib.push();
        uib.clear();
        if (this._opaque) { // Background ?
            uib.noStroke();
            uib.fill(BACK);
            uib.rect(1, 1, this._w - 1, this._h - 1, ...this._c);
        }
        if (icon) {
            let px = 0, py;
            switch (iA) {
                case this._p.LEFT:
                    px = gap;
                    break;
                case this._p.RIGHT:
                    px = this._w - icon.width - gap;
                    break;
            }
            if (lines.length == 0)
                px = (this._w - icon.width) / 2; // no text
            py = (this._h - icon.height) / 2;
            uib.image(this._icon, px, py);
        }
        if (lines.length > 0) {
            uib.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            if (icon && iA == this._p.LEFT)
                x0 += icon.width;
            if (icon && iA == this._p.RIGHT)
                x1 -= icon.width;
            let tw = x1 - x0, th = this._tbox.h;
            let py = uib.textAscent() + (this._h - th) / 2;
            uib.fill(FORE);
            for (let line of lines) {
                switch (tA) {
                    case this._p.LEFT:
                        sx = x0;
                        break;
                    case this._p.CENTER:
                        sx = x0 + (tw - uib.textWidth(line)) / 2;
                        break;
                    case this._p.RIGHT:
                        sx = x1 - uib.textWidth(line) - gap;
                        break;
                }
                uib.text(line, sx, py);
                py += uib.textLeading();
            }
        }
        // Mouse over add border highlight
        if (this._isOver) {
            uib.stroke(HIGHLIGHT);
            uib.strokeWeight(2);
            uib.noFill();
            uib.rect(1, 1, this._w - 2, this._h - 2, ...this._c);
        }
        // Control disabled highlight
        if (!this._enabled)
            this._disable_hightlight(uib, cs, 0, 0, this._w, this._h);
        // Update pick buffer before restoring
        this._updateRectControlPB();
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
        // Finally if this is a Pane tab then must validate the tabs
        if (this._parent instanceof CvsPane)
            this._parent.validateTabs();
    }
    /** @hidden */
    _doEvent(e, x, y, picked) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this._clickAllowed = true; // false if mouse moves
                this._part = picked.part;
                this.isOver = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this._active) {
                    if (this._clickAllowed)
                        this.action({ source: this, p5Event: e });
                    this._active = false;
                    this._clickAllowed = false;
                    this.isOver = false;
                }
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                this.isOver = (this == picked.control);
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this._active ? this : null;
    }
}
//# sourceMappingURL=button.js.map