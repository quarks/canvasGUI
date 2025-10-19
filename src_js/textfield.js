/**
 * This class supports a single line text entry field.
 *
 * The user must ensure that the field is wide enough for the maximum
 * length of text expected. This control stops accepting input if it is
 * likely to exceed the control width.
 *
 * The left/right arrow keys move the text insertion point within the
 * text. Used in combination with the shift key enables part or all of
 * the text to be selected.
 *
 * If no text is selected then the arrows keys can move off the current
 * control to another. This only works if each textfield has a unique
 * index number.
 *
 * If the control has the index value 'idx' then the next control depends
 * on the arrow key pressed - <br>
 * left : idx - 1 <br>
 * right : idx + 1 <br>
 * up : idx - offset <br>
 * down : idx + offset <br>
 *
 * The offset value is set when initialising the idx value with the
 * <code>index(idx, deltaIndex</code> method.)
 *
 * No other controls can be used while a textfield control is active. Pressing
 * 'Enter' or attempting to move to a non-existant textfield deactivates the
 * current text field.
 *
 * The user can provide their own validation function which is checked when
 * the control is deativated.
 *
 * @since 0.9.3
 */
class CvsTextField extends CvsText {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
        /** @hidden */ this._linkOffset = 0;
        /** @hidden */ this._prevCsrIdx = 0;
        /** @hidden */ this._currCsrIdx = 0;
        /** @hidden */ this._textInvalid = false;
        /** @hidden */ this._cursorOn = false;
        this.textAlign(this._p.LEFT);
        this._c = [0, 0, 0, 0];
    }
    /**
     * Set a unique index number for this text field.
     *
     *
     * @param idx unique index number
     * @param deltaIndex relative link when using up/down arrow keys
     * @returns this control
     */
    index(idx, deltaIndex) {
        if (Number.isFinite(idx)) {
            if (Number.isFinite(deltaIndex))
                this._linkOffset = deltaIndex;
            this._linkIndex = idx;
            if (!this._gui._links)
                this._gui._links = new Map();
            this._gui._links.set(idx, this);
        }
        return this;
    }
    /**
     * Gets or sets the current text.
     * Any EOL characters are stripped out of the string. If necessary the
     * string length will be reduced until will fit inside the textfiel.
     * If a validation function has been set then the string will be
     * validated.
     *
     * @param t a string representing text to display
     * @returns this control for setter
     */
    text(t) {
        // getter
        if (t == null || t == undefined)
            return this._getLine();
        //setter
        this._textInvalid = false;
        t = t.toString().replaceAll('\n', ' ');
        while (t.length > 0 && this._uiBfr.textWidth(t) >= this._maxTextWidthPixels()) {
            t = t.substring(0, t.length - 1);
        }
        this._lines = [t];
        this.validate();
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Sets or gets the text size.</p>
     * @param lts the text size to use
     * @returns this control or the current text size
     */
    textSize(lts) {
        let ts = this._textSize || this._gui.textSize();
        // getter
        if (!Number.isFinite(lts))
            return ts;
        // setter
        lts = Number(lts);
        if (lts != ts) {
            this._textSize = lts;
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * Deletes the index number.
     * @returns this control
     */
    noIndex() {
        if (Number.isFinite(this._linkIndex) && !this._gui._links)
            this._gui._links.delete(this._linkIndex);
        this._linkIndex = undefined;
        return this;
    }
    /**
     * If there is no validation function then this will always return true.
     * @returns true if the text has passed validation
     */
    isValid() {
        return !this._textInvalid;
    }
    /**
     * If there is no text then this method will always return false. If there
     * is some text then this method returns the same as the isValid() method.
     *
     * @returns true if there is some text and it passed any validation function
     */
    hasValidText() {
        return !this._textInvalid && this._lines.length > 0 && this._lines[0].length > 0;
    }
    /**
     * Clears the validity flag irrespective of whether the text is
     * valid or not.
     * @returns this control
     */
    clearValid() {
        if (this._textInvalid) {
            this._textInvalid = false;
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * Uesr provide a validation function for this textfield
     * @param vfunc the validation function
     * @returns this control
     */
    validation(vfunc) {
        this._validation = vfunc;
        return this;
    }
    /**
     * Force the control to validate
     * @returns this control
     */
    validate() {
        this._validate();
        return this;
    }
    /**
     * Validate the text
     * @hidden
     */
    _validate() {
        if (this._validation) {
            let line = this._getLine();
            let r = this._validation(line);
            if (Array.isArray(r) && r.length > 0) {
                this._textInvalid = !Boolean(r[0]);
                // If formatted text is provided and it fits the textfield accept it
                if (r[1]) // Validator has returned formatted text
                    // See if it fits textfield
                    if (this._uiBfr.textWidth(r[1]) < this._maxTextWidthPixels())
                        this._lines[0] = r[1];
                    else
                        this._textInvalid = true;
            }
        }
    }
    /**
     * Activate this control to receive keyboard events. Occurs if the user
     * clicks on the control or is 'tabbed' into the control.
     * @hidden
     */
    _activate(selectAll = false) {
        this._active = true;
        let line = this._getLine();
        this._currCsrIdx = line.length;
        this._prevCsrIdx = selectAll || this._textInvalid ? 0 : line.length;
        this._cursorOn = true;
        this._clock = setInterval(() => {
            this._cursorOn = !this._cursorOn;
            this.invalidateBuffer();
        }, 550);
        this.invalidateBuffer();
    }
    /**
     * Called when this control passes focus to a new control.
     * @param idx the index for the control to be activated
     */
    _activateNext(offset) {
        this._deactivate();
        this._validate();
        let links = this._gui._links;
        if (links) {
            let idx = this._linkIndex, ctrl;
            do {
                idx += offset;
                ctrl = links.get(idx);
            } while (ctrl && (!ctrl.isEnabled() || !ctrl.isVisible()));
            ctrl?._activate();
        }
    }
    /**
     * Deactivate this control
     * @hidden
     */
    _deactivate() {
        this._active = false;
        this._cursorOn = false;
        clearInterval(this._clock);
        this.invalidateBuffer();
    }
    /**
     * We are only interested in the first line of text
     * @hidden
     */
    _getLine() {
        return this._lines.length > 0 ? this._lines[0] : '';
    }
    /**
     * Calculates and returns the pixel length for a given
     * character position.
     * @hidden
     */
    _cursorX(buff, line, idx) {
        return idx == 0 ? 0 : buff.textWidth(line.substring(0, idx));
    }
    /** @hidden */
    _processEvent(e, ...info) {
        switch (e.type) {
            case 'mousedown':
                if (this._over > 0)
                    this._activate();
                break;
        }
    }
    /** @hidden */
    _maxTextWidthPixels() {
        let ts = Number(this._textSize || this._gui.textSize());
        return this._w - (2 * this._gap) - ts / 2; // maximun text width in pixels
    }
    /** @hidden */
    _handleKey(e) {
        // let ts = Number(this._textSize || this._gui.textSize());
        let mtw = this._maxTextWidthPixels(); // maximun text width in pixels
        let line = this._getLine(); // get text
        let hasSelection = this._prevCsrIdx != this._currCsrIdx;
        let tabLeft = Boolean(this._linkIndex && !hasSelection && this._currCsrIdx == 0);
        let tabRight = Boolean(this._linkIndex && !hasSelection && this._currCsrIdx >= line.length);
        if (e.type == 'keydown') {
            // Visible character
            if (e.key.length == 1) {
                if (this._prevCsrIdx != this._currCsrIdx) {
                    line = this._removeSelectedText(line);
                }
                // Add new character provided it is hort enough to dosplay safely
                line = line.substring(0, this._currCsrIdx) + e.key + line.substring(this._currCsrIdx);
                if (this._uiBfr.textWidth(line) < mtw) {
                    this._currCsrIdx++;
                    this._prevCsrIdx++;
                    this._lines[0] = line;
                }
                this.invalidateBuffer();
                return true;
            }
            switch (e.key) {
                case 'ArrowLeft':
                    if (tabLeft) {
                        this._activateNext(-1);
                        this.action({ source: this, p5Event: e, value: line });
                    }
                    else {
                        if (this._currCsrIdx > 0) {
                            if (!e.shiftKey && hasSelection)
                                this._currCsrIdx = Math.min(this._currCsrIdx, this._prevCsrIdx);
                            else
                                this._currCsrIdx--;
                            if (!e.shiftKey)
                                this._prevCsrIdx = this._currCsrIdx;
                        }
                    }
                    break;
                case 'ArrowRight':
                    if (tabRight) {
                        this._activateNext(1);
                        this.action({ source: this, p5Event: e, value: line });
                    }
                    else {
                        if (this._currCsrIdx <= line.length) {
                            if (!e.shiftKey && hasSelection)
                                this._currCsrIdx = Math.max(this._currCsrIdx, this._prevCsrIdx);
                            else
                                this._currCsrIdx++;
                            if (!e.shiftKey)
                                this._prevCsrIdx = this._currCsrIdx;
                        }
                    }
                    break;
                case 'ArrowUp':
                    if (!hasSelection) {
                        if (this._linkOffset !== 0)
                            this._activateNext(-this._linkOffset);
                        this.action({ source: this, p5Event: e, value: line });
                    }
                    break;
                case 'ArrowDown':
                    if (!hasSelection) {
                        if (this._linkOffset !== 0)
                            this._activateNext(this._linkOffset);
                        this.action({ source: this, p5Event: e, value: line });
                    }
                    break;
                case 'Enter':
                    this._deactivate();
                    this._validate();
                    this.action({ source: this, p5Event: e, value: line });
                    break;
                case 'Backspace':
                    if (this._prevCsrIdx != this._currCsrIdx) {
                        line = this._removeSelectedText(line);
                    }
                    else { // Delete character to left
                        if (this._currCsrIdx > 0) {
                            line = line.substring(0, this._currCsrIdx - 1) + line.substring(this._currCsrIdx);
                            this._currCsrIdx--;
                            this._prevCsrIdx = this._currCsrIdx;
                        }
                    }
                    this._lines[0] = line;
                    break;
                case 'Delete':
                    if (this._prevCsrIdx != this._currCsrIdx) {
                        line = this._removeSelectedText(line);
                    }
                    else { // Delete character to right
                        if (this._currCsrIdx < line.length) {
                            line = line.substring(0, this._currCsrIdx) + line.substring(this._currCsrIdx + 1);
                        }
                    }
                    this._lines[0] = line;
                    break;
                default:
            }
            this.invalidateBuffer();
            return false;
        }
        return true;
    }
    /**
     * Remove any user selected text
     * @hidden
     */
    _removeSelectedText(line) {
        let p0 = Math.min(this._prevCsrIdx, this._currCsrIdx);
        let p1 = Math.max(this._prevCsrIdx, this._currCsrIdx);
        this._prevCsrIdx = this._currCsrIdx = p0;
        return line.substring(0, p0) + line.substring(p1);
    }
    /** @hidden */
    _updateControlVisual() {
        let ts = Number(this._textSize || this._gui.textSize());
        let cs = this._scheme || this._gui.scheme();
        let line = this._lines.length > 0 ? this._lines[0] : '';
        let tiv = this._textInvalid, sx = 2 * this._gap;
        const CURSOR = cs['G_9'], HIGHLIGHT = cs['C_9'], SELECT = cs['C_3'];
        let BACK = cs['C_1'], FORE = cs['C_9'];
        let uib = this._uiBfr;
        uib.push();
        uib.textSize(ts);
        uib.background(cs['G_0']); // white background
        uib.noStroke();
        if (!this._active) { // Colors depend on whether text is valid
            BACK = tiv ? cs['C_9'] : cs['C_1'];
            FORE = tiv ? cs['C_3'] : cs['C_9'];
            uib.stroke(FORE);
            uib.strokeWeight(1.5);
            uib.fill(BACK);
            uib.rect(0, 0, this._w, this._h);
        }
        else { // Active so display any selection
            if (this._currCsrIdx != this._prevCsrIdx) {
                let px = this._cursorX(uib, line, this._prevCsrIdx);
                let cx = this._cursorX(uib, line, this._currCsrIdx);
                uib.noStroke();
                uib.fill(SELECT);
                let cx0 = sx + Math.min(px, cx), cx1 = Math.abs(px - cx);
                uib.rect(cx0, 1, cx1, this._h - 2);
            }
        }
        uib.fill(BACK);
        // Draw text
        uib.textSize(ts);
        uib.textAlign(this._p.LEFT, this._p.TOP);
        uib.noStroke();
        uib.fill(FORE);
        uib.text(line, sx, (this._h - ts) / 2);
        // Draw cursor
        if (this._activate && this._cursorOn) {
            let cx = this._cursorX(uib, line, this._currCsrIdx);
            uib.stroke(CURSOR);
            uib.strokeWeight(1.5);
            uib.line(sx + cx, 4, sx + cx, this._h - 5);
        }
        // Mouse over highlight
        if (this._over > 0) {
            uib.stroke(HIGHLIGHT);
            uib.strokeWeight(2);
            uib.noFill();
            uib.rect(1, 1, this._w - 2, this._h - 2, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Control disabled highlight
        if (!this._enabled)
            this._disable_hightlight(uib, cs, 0, 0, this._w, this._h);
        this._updateRectControlPB();
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }
}
Object.assign(CvsTextField.prototype, processMouse, processTouch);
//# sourceMappingURL=textfield.js.map