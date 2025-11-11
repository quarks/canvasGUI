
/**
 * This class supports a single line text entry field.
 * 
 * The left/right arrow keys move the text insertion point within the 
 * text. Used in combination with the shift key it enables part or all 
 * of the text to be selected.
 * 
 * If no text is selected then the arrows keys can move off the current
 * control to another. This only works if each textfield has a unique 
 * index number (&gt0;).
 * 
 * If the control has the index value 'idx' then the next control depends
 * on the arrow key pressed - <br>
 * left : idx - 1 <br>
 * right : idx + 1 <br>
 * up : idx - offset <br>
 * down : idx + offset <br>
 * 
 * The offset value is set when initialising the idx value with the 
 * <code>index(idx, deltaIndex)</code> method.
 * 
 * No other controls can be used while a textfield control is active. Pressing
 * 'Enter' or attempting to move to a non-existant textfield deactivates the 
 * current textfield.
 * 
 * The user can provide their own validation function which is checked when
 * the control is deativated. 
 * 
 */
class CvsTextField extends CvsText {

    /** @hidden */ protected _nextActive = null;
    /** @hidden */ protected _linkIndex: number;
    /** @hidden */ protected _linkOffset = 0;
    /** @hidden */ protected _prevCsrIdx = 0;
    /** @hidden */ protected _currCsrIdx = 0;
    /** @hidden */ protected _textInvalid = false;
    /** @hidden */ protected _cursorOn = false;
    /** @hidden */ protected _validation: Function;

    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
        this.textAlign(this._p.LEFT);
        this._c = [0, 0, 0, 0];
    }

    /**
     * Set a unique index number for this text field.
     * 
     * @param idx unique index number
     * @param deltaIndex relative link when using up/down arrow keys
     * @returns this control
     */
    index(idx: number, deltaIndex?: number) {
        if (Number.isFinite(idx)) {
            if (Number.isFinite(deltaIndex)) this._linkOffset = deltaIndex;
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
     * string length will be reduced until it will fit inside the textfield.
     * If a validation function has been set then the string will be 
     * validated.
     * 
     * @param t a string representing text to display
     * @returns this control for setter
     */
    text(t?: string): string | CvsTextField {
        // getter
        // if (t == null || t == undefined) return this._getLine();
        if (!t) return this._getLine();
        // setter
        this._textInvalid = false;
        this._lines = [t.toString().replaceAll('\n', ' ')];
        this._validate();
        this.invalidateBuffer();
        return this;
    }

    /**
     * <p>Sets or gets the text size.</p>
     * @param lts the text size to use
     * @returns this control or the current text size
     */
    textSize(lts: number) {
        let ts = this._textSize || this._gui.textSize();
        // getter
        if (!Number.isFinite(lts)) return ts;
        // setter
        lts = Number(lts);
        if (lts != ts) {
            this._textSize = lts;
            this.invalidateBuffer();
        }
        return this;
    }

    /** @hidden */
    textAlign(align: string): CvsBaseControl { return this; }

    /** @hidden */
    noText(): CvsBaseControl { return this; }

    /**
     * Removes the link index from this textfield. After this it will not be possible 
     * to move focus to this textfield using the keyboard arrows.
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
    isValid(): boolean {
        return !this._textInvalid;
    }

    /**
     * If there is no text then this method will always return false. If there
     * is some text then this method returns the same as the 
     * <code>isValid()</code> method. 
     * 
     * @returns true if there is some text and it passed any validation function
     */
    hasValidText(): boolean {
        return !this._textInvalid && this._lines.length > 0 && this._lines[0].length > 0;
    }

    /**
     * If the text is invalid this method it clears the validity effectively making
     * the text valid.
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
     * Set the validation function to be used for this control.
     * 
     * The function is created by the user and should return an array of 
     * two elements e.g. <code>[valid, valid-text]</code>
     * 
     * <code>valid</code> is a boolean indicating if the text is valid and<br> 
     * <code>valid-text</code> can be the original text or amended in some way. 
     * 
     * For instance a textfield used for getting a persons name will be valid
     * if there are 2 or more words and the valid-text will be the name
     * but with the first letter of each word being capatilised.
     * 
     * @param vfunc the validation function
     * @returns this control
     */
    validation(vfunc: Function) {
        this._validation = vfunc;
        return this;
    }

    /**
     * Validate the text
     * @hidden
     */
    _validate(): void {
        if (this._validation) {
            let line = this._getLine();
            let r = this._validation(line);
            if (Array.isArray(r) && r.length > 0) {
                this._textInvalid = !Boolean(r[0]);
                // Validator has returned formatted text?
                if (r[1]) this._lines[0] = r[1];
            }
        }
        else {
            this._textInvalid = false;
        }
    }

    /**
     * Deactivate this control
     * @hidden
     */
    _deactivate() {
        this._active = false;
        this.isOver = false;
        this._cursorOn = false;
        this._validate();
        this._prevCsrIdx = this._currCsrIdx = this._getLine().length;
        if (this._textInvalid) this._prevCsrIdx = 0;
        this.invalidateBuffer();
        this._nextActive = null;
    }

    /**
     * Activate this control to receive keyboard events. Occurs if the user
     * clicks on the control or is 'tabbed' into the control.
     * @hidden
     */
    _activate(selectAll: boolean = false) {
        this._active = true;
        this._cursorOn = true;
        // Set cursor flashing while active
        setTimeout(() => this._flashCursor(), 550);
        this.invalidateBuffer();
        this._nextActive = this;
    }

    /** @hidden */
    _flashCursor() {
        if (this._active) {
            this._cursorOn = !this._cursorOn;
            setTimeout(() => this._flashCursor(), 550);
        }
        else
            this._cursorOn = false;
        this.invalidateBuffer();
    }

    /**
     * Called when this control passes focus to a new control.
     * @param idx the index for the control to be activated
     * @hidden
     */
    _activateNext(offset: number) {
        let links = this._gui._links, ctrl = null;
        if (links) {
            let idx = this._linkIndex;
            do {
                idx += offset;
                ctrl = links.get(idx);
            }
            while (ctrl && (!ctrl.isEnabled || !ctrl.isVisible));
            ctrl?._activate();
            this._nextActive = ctrl;
            this.invalidateBuffer();
        }

    }

    /**
     * We are only interested in the first line of text
     * @hidden
     */
    _getLine(): string {
        return (this._lines.length > 0 ? this._lines[0].toString() : '');
    }

    /**
     * Calculates and returns the pixel length for a given
     * character position.
     * @hidden
     */
    _cursorX(buff: p5.Renderer, line: string, idx: number): number {
        return !idx || idx == 0 ? 0 : buff.textWidth(line.substring(0, idx));
    }

    /** @hidden */
    _doKeyEvent(e: KeyboardEvent) {
        this._nextActive = this;
        let line = this._getLine(); // get text
        let hasSelection = this._prevCsrIdx != this._currCsrIdx;
        let tabLeft = Boolean(this._linkIndex && !hasSelection && this._currCsrIdx == 0);
        let tabRight = Boolean(this._linkIndex && !hasSelection && this._currCsrIdx >= line.length);
        if (e.type == 'keydown') {
            if (e.key.length == 1) {    // Visible character
                if (this._prevCsrIdx != this._currCsrIdx)
                    line = this._removeSelectedText(line);
                line = line.substring(0, this._currCsrIdx) + e.key + line.substring(this._currCsrIdx)
                this._currCsrIdx++; this._prevCsrIdx++;
                this._lines[0] = line;
                this.invalidateBuffer();
            }
            switch (e.key) {
                case 'ArrowLeft':
                    if (tabLeft) {
                        this._deactivate();
                        this._activateNext(-1);
                        this.action({ source: this, p5Event: e, value: this._getLine(), valid: !this._textInvalid });
                    }
                    else {
                        if (this._currCsrIdx > 0) {
                            if (!e.shiftKey && hasSelection)
                                this._currCsrIdx = Math.min(this._currCsrIdx, this._prevCsrIdx);
                            else
                                this._currCsrIdx--;
                            if (!e.shiftKey) this._prevCsrIdx = this._currCsrIdx;
                        }
                    }
                    break;
                case 'ArrowRight':
                    if (tabRight) {
                        this._deactivate();
                        this._activateNext(1);
                        this.action({ source: this, p5Event: e, value: this._getLine(), valid: !this._textInvalid });
                    }
                    else {
                        if (this._currCsrIdx <= line.length) {
                            if (!e.shiftKey && hasSelection)
                                this._currCsrIdx = Math.max(this._currCsrIdx, this._prevCsrIdx);
                            else
                                this._currCsrIdx++;
                            if (!e.shiftKey) this._prevCsrIdx = this._currCsrIdx;
                        }
                    }
                    break;
                case 'ArrowUp':
                    if (!hasSelection) {
                        if (this._linkOffset !== 0) {
                            this._deactivate();
                            this._activateNext(-this._linkOffset);
                        }
                        this.action({ source: this, p5Event: e, value: this._getLine(), valid: !this._textInvalid });
                    }
                    break;
                case 'ArrowDown':
                    if (!hasSelection) {
                        if (this._linkOffset !== 0) {
                            this._deactivate();
                            this._activateNext(this._linkOffset);
                        }
                        this.action({ source: this, p5Event: e, value: this._getLine(), valid: !this._textInvalid });
                    }
                    break;
                case 'Enter':
                    this._deactivate();
                    this.action({ source: this, p5Event: e, value: this._getLine(), valid: !this._textInvalid });
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
        } // End of key down
        return this._nextActive;
    }

    /** @hidden */
    _doEvent(e: MouseEvent | TouchEvent, x = 0, y = 0, over: any, enter: boolean): CvsBaseControl {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._activate();
                break;
            case 'mousemove':
            case 'touchmove':
                this.isOver = (this == over.control);
                this._tooltip?._updateState(enter);
                this.invalidateBuffer();
                break;
        }
        return this._nextActive;
    }

    /**
     * Remove any user selected text
     * @hidden 
     */
    _removeSelectedText(line: string) {
        let p0 = Math.min(this._prevCsrIdx, this._currCsrIdx);
        let p1 = Math.max(this._prevCsrIdx, this._currCsrIdx);
        this._prevCsrIdx = this._currCsrIdx = p0;
        return line.substring(0, p0) + line.substring(p1);
    }

    /** @hidden */
    _updateControlVisual() { // CvsTextField
        function csrX(idx: number): number {
            if (!idx || idx == 0)
                return 0;
            else
                return MEASURE_TEXT(line.substring(0, idx), uib, tf, ty, ts).fw;
        }
        let ts = Number(this._textSize || this._gui.textSize());
        let tf = this._textFont || this._gui.textFont();
        let ty = this._textStyle || this._gui.textStyle();
        let cs = this._scheme || this._gui.scheme();
        let line = this._getLine();
        let tiv = this._textInvalid;
        let sx = 4 + Math.max(this._c[0], this._c[3]);
        let ex = this._w - (4 + Math.max(this._c[1], this._c[2]));
        const CURSOR = cs.G(9);
        const HIGHLIGHT = cs.C(9);
        const SELECT = cs.C(3);

        // Prepare buffer
        let uib = this._uiBfr;
        uib.clear();
        uib.push();
        uib.textFont(tf);
        uib.textStyle(ty);
        uib.textSize(ts);
        // Draw background based on whether active or not
        let BACK = cs.C(1), FORE = cs.C(9);
        if (!this.isActive) { // Colors depend on whether text is valid
            BACK = tiv ? cs.C(9) : cs.C(1);
            FORE = tiv ? cs.C(3) : cs.C(9);
            uib.fill(...BACK);
        }
        else
            uib.fill(...cs.G(0));
        uib.stroke(...FORE); uib.strokeWeight(2);
        uib.rect(1, 1, this._w - 2, this._h - 2, ...this._c);

        // Draw text and cursor
        uib.push();
        uib.beginClip();
        uib.rect(sx, 1.5, ex - sx, this._h - 3);
        uib.endClip();
        uib.fill(...BACK);
        let cx = csrX(this._currCsrIdx); // cursor pixel position
        // If active display any selection
        if (this.isActive) {
            // If tx > 0 then the cursor is outside visible area so move it
            let tx = cx - (ex - sx);
            if (tx > 0) uib.translate(-tx, 0);
            // Show any selected text
            if (this._currCsrIdx != this._prevCsrIdx) {
                let px = csrX(this._prevCsrIdx);
                let cx0 = sx + Math.min(px, cx), cx1 = Math.abs(px - cx);
                uib.noStroke(); uib.fill(...SELECT);
                uib.rect(cx0, 1.5, cx1, this._h - 3, ...this._c);
            }
        }
        uib.textSize(ts);
        uib.textAlign(this._p.LEFT, this._p.TOP);
        uib.noStroke(); uib.fill(...FORE);
        uib.text(line, sx, (this._h - ts) / 2);
        // Draw cursor
        if (this._active && this._cursorOn) {
            uib.stroke(...CURSOR); uib.strokeWeight(1.75);
            uib.line(sx + cx, 4, sx + cx, this._h - 5);
        }
        uib.pop();
        // Mouse over control highlight
        if (this.isOver) {
            uib.stroke(...HIGHLIGHT);
            uib.strokeWeight(2.5);
            uib.noFill();
            uib.rect(1, 1, this._w - 2, this._h - 2, ...this._c);
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

