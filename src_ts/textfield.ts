
/**
 * This class supports a single line text entry field.
 * 
 * The left/right arrow keys move the text-insertion-point within the 
 * text. Used in combination with the shift key it enables part or all 
 * of the text to be selected. The entire text can be selected with the
 * Ctrl+A or Cmd+A keys.
 * 
 * Selected text can be copied with the Ctrl+C or Cmd+C keys and pasted at
 * the current text-insertion-point with the Ctrl+V or Cmd+V keys. The 
 * Ctrl+X or Cmd+X keys will cut (and copy) the selected text.
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
    /** @hidden */ protected _linkIndex: number = undefined;
    /** @hidden */ protected _linkOffset = 0;
    /** @hidden */ protected _prevCsrIdx = 0;
    /** @hidden */ protected _currCsrIdx = 0;
    /** @hidden */ protected _line: string = '';
    /** @hidden */ protected _cursorOn = false;
    /** @hidden */ protected _validation: Function;
    /** @hidden */ protected _inputInvalid: boolean = false;


    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
        this.textAlign("left", "top");
        this.invalidateBuffer();
    }

    // Clipboard
    /** @hidden */ get snip(): string { return this._gui._clipboard }
    /** @hidden */ set snip(txt: string) { this._gui._clipboard = txt }

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
     * Removes the link index from this textfield. After this it will not be possible 
     * to move focus to this textfield using the keyboard arrows.
     * @returns this control
     */
    noIndex() {
        if (Number.isFinite(this._linkIndex))
            this._gui._links?.delete(this._linkIndex);
        this._linkIndex = undefined;
        return this;
    }

    /**
     * Gets or sets the current text.
     * Any EOL characters are stripped out of the string. If necessary the
     * string length will be reduced until it will fit inside the textfield.
     * If a validation function has been set then the string will be 
     * validated.
     * 
     * @param text a string representing text to display
     * @returns this control for setter
     */
    text(text?: string): string | CvsTextField {
        if (text == null || text == undefined) // getter
            return this._line;
        this.invalidateText();
        this.invalidateBuffer();
        this._line = this._delEOL(text);
        this._performValidation();
        return this;
    }

    /** @hidden */
    textAlign(alignW?: string, alignH?: string) { return this; }

    /** @hidden */
    noText(): CvsControl { return this; }

    /**
     * True if the text has passed validation. If there is no validation 
     * function this is always true.
     */
    get isValid(): boolean { return !this._validation || !this._inputInvalid; }

    /**
     * True if there is some text and it has been accepted by a validation 
     * function. If there is no text then this will be false.</p> 
     */
    get hasValidText(): boolean {
        return this._line.length > 0 && !this._inputInvalid;
    }

    /**
     * <p>If the text is invalid this method sets the text as being valid and 
     * changes the visual appearance accordingly. This will remain in effect 
     * until the next time the text is validated.</p>
     * @returns this control
     */
    setTextValid() {
        if (this._inputInvalid) {
            this._inputInvalid = false;
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
     * <code>valid</code> is a boolean indicating if the text entered is valid and<br> 
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
    _performValidation(): void {
        this._inputInvalid = true; // Assume it is valid
        if (this._validation) {
            CLOG(`Applying validation`)
            let r = this._validation(this._line);
            if (Array.isArray(r) && r.length > 0) {
                this._inputInvalid = !Boolean(r[0]);
                // Validator has returned formatted text?
                if (r[1]) this._line = this._delEOL(r[1]);
            }
        }
    }

    /**
     * Deactivate this control.
     * @hidden
     */
    _deactivate() {
        this._active = false;
        this.over = false;
        this._cursorOn = false;
        this._performValidation();
        this._prevCsrIdx = this._currCsrIdx = this._line.length;
        if (this._inputInvalid) this._prevCsrIdx = 0;
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
            } while (ctrl && (!ctrl.isEnabled || !ctrl.isVisible));
            ctrl?._activate();
            this._nextActive = ctrl;
            this.invalidateBuffer();
        }
    }

    /**
     * Calculates the pixel length for a given character position.
     * @hidden
     */
    _cursorX(idx = 0): number {
        return idx == 0
            ? 0
            : this._textMetrics(this._line.substring(0, idx)).fWidth;
    }

    /** @hidden */
    _doEvent(e: MouseEvent | TouchEvent, x = 0, y = 0, over: any, enter: boolean): CvsControl {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._activate();
                break;
            case 'mousemove':
            case 'touchmove':
                this.over = (this == over.control);
                this._tooltip?._updateState(enter);
                this.invalidateBuffer();
                break;
        }
        return this._nextActive;
    }

    /** @hidden */
    _doKeyEvent(e: KeyboardEvent) {
        this._nextActive = this;
        let hasSelection = this._prevCsrIdx != this._currCsrIdx;
        let tabLeft = Boolean(this._linkIndex && !hasSelection && this._currCsrIdx == 0);
        let tabRight = Boolean(this._linkIndex && !hasSelection && this._currCsrIdx >= this._line.length);
        if (e.type == 'keydown') {
            if (e.key.length == 1) { // single character key
                // If the control or meta key has been pressed then perform 
                // appropraite selected text action'
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 'a': // select all
                            this._prevCsrIdx = 0;
                            this._currCsrIdx = this._line.length;
                            break;
                        case 'c': // copy selected text
                            if (hasSelection)
                                this.snip = this._line.substring(this._prevCsrIdx, this._currCsrIdx);
                            break;
                        case 'v': //paste copied text
                            if (hasSelection)
                                this._line = this._delSelected(this._line);
                            if (this.snip.length > 0)
                                this._line = this._insChar(this.snip, this._line, this._currCsrIdx);
                            this._currCsrIdx += this.snip.length;
                            this._prevCsrIdx = this._currCsrIdx;
                            break;
                        case 'x': // delete selected text
                            if (hasSelection) {
                                this.snip = this._line.substring(this._prevCsrIdx, this._currCsrIdx);
                                this._line = this._delSelected(this._line);
                                this._prevCsrIdx = this._currCsrIdx = Math.min(this._currCsrIdx, this._prevCsrIdx);
                            }
                    }
                }
                else {
                    if (hasSelection)
                        this._line = this._delSelected(this._line);
                    this._line = this._insChar(e.key, this._line, this._currCsrIdx);
                    this._currCsrIdx++; this._prevCsrIdx++;
                    this.invalidateBuffer();
                }
            }
            switch (e.key) {
                case 'ArrowLeft':
                    if (tabLeft) {
                        this._deactivate();
                        this._activateNext(-1);
                        this.action({ source: this, event: e, value: this._line, valid: !this._inputInvalid });
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
                        this.action({ source: this, event: e, value: this._line, valid: !this._inputInvalid });
                    }
                    else {
                        if (this._currCsrIdx <= this._line.length) {
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
                        if (this._linkOffset) {
                            this._deactivate();
                            this._activateNext(-this._linkOffset);
                        }
                        this.action({ source: this, event: e, value: this._line, valid: !this._inputInvalid });
                    }
                    break;
                case 'ArrowDown':
                    if (!hasSelection) {
                        if (this._linkOffset) {
                            this._deactivate();
                            this._activateNext(this._linkOffset);
                        }
                        this.action({ source: this, event: e, value: this._line, valid: !this._inputInvalid });
                    }
                    break;
                case 'Enter':
                    this._deactivate();
                    this.action({ source: this, event: e, value: this._line, valid: !this._inputInvalid });
                    break;
                case 'Backspace':
                    if (this._prevCsrIdx != this._currCsrIdx) {
                        this._line = this._delSelected(this._line);
                    }
                    else { // Delete character to left
                        if (this._currCsrIdx > 0) {
                            this._line = this._delChar(this._line, this._currCsrIdx - 1);
                            this._currCsrIdx--;
                            this._prevCsrIdx = this._currCsrIdx;
                        }
                    }
                    break;
                case 'Delete':
                    if (this._prevCsrIdx != this._currCsrIdx) {
                        this._line = this._delSelected(this._line);
                    }
                    else { // Delete character to right
                        if (this._currCsrIdx < this._line.length)
                            this._line = this._delChar(this._line, this._currCsrIdx);
                    }
                    break;
                default:
            }
            this.invalidateBuffer();
        } // End of key down
        return this._nextActive;
    }

    /** @hidden */
    _delEOL(line: string): string {
        line = String(line);
        return line.replaceAll('\n', ' ');
    }

    /** @hidden */
    _delChar(line: string, pos: number) {
        line = String(line);
        return line.substring(0, pos) + line.substring(pos + 1);
    }

    /** @hidden */
    _insChar(chars: string, line: string, pos: number) {
        line = String(line);
        return line.substring(0, pos) + chars + line.substring(pos);
    }

    /**
     * Remove any user selected text
     * @hidden 
     */
    _delSelected(line: string) {
        line = String(line);
        let p0 = Math.min(this._prevCsrIdx, this._currCsrIdx);
        let p1 = Math.max(this._prevCsrIdx, this._currCsrIdx);
        this._prevCsrIdx = this._currCsrIdx = p0;
        return line.substring(0, p0) + line.substring(p1);
    }

    /** @hidden */
    _updateControlVisual() { // CvsTextField
        const cs = this.SCHEME;
        const cnrs = this.CNRS;
        const [isetH, isetV] = [Math.max(...cnrs) + ISET_H, 2 * ISET_V];
        const [taX, taY, taW, taH] =
            [isetH, isetV, this._w - 2 * isetH, this._h - 2 * isetV];
        const CURSOR = cs.G$(9);
        const SELECT = cs.C$(3);
        const LIGHT = cs.C$(1);
        const DARK = cs.C$(9);
        const ACTIVE_BACK = cs.G$(0);
        let FORE = DARK;

        // Prepare buffer
        let uic = this._uicContext;
        uic.save();
        uic.clearRect(0, 0, this._w, this._h);
        uic.font = this._cssFont;
        uic.textBaseline = 'top';

        // Draw background based on whether active or not
        if (this.isActive) {
            uic.fillStyle = ACTIVE_BACK;
            uic.strokeStyle = DARK;
        }
        else { // Control is inactive so colors depend on text validity
            if (!this._inputInvalid) {
                uic.fillStyle = LIGHT;
                uic.strokeStyle = DARK;
            }
            else {
                uic.fillStyle = DARK;
                uic.strokeStyle = LIGHT;
                FORE = LIGHT;
            }
        }
        uic.lineWidth = 2;
        uic.beginPath();
        uic.roundRect(1, 1, this._w - 2, this._h - 2, cnrs);
        uic.fill();
        uic.stroke();

        // Clip to textArea
        uic.save();
        uic.beginPath();
        uic.rect(taX - 2, taY, taW + 4, taH);
        uic.clip();

        // Current cursor pixel position
        const cx = this._cursorX(this._currCsrIdx);

        // If active display any selection area
        if (this.isActive) {
            const offsetX = cx - taW;
            // If tx > 0 then cursor is outside visible area
            if (offsetX > 0) uic.translate(-offsetX, 0);
            // Show any selected text
            if (this._currCsrIdx != this._prevCsrIdx) {
                const px = this._cursorX(this._prevCsrIdx);
                const cx0 = taX + Math.min(px, cx), cx1 = Math.abs(px - cx);
                uic.fillStyle = SELECT;
                uic.fillRect(cx0, 1.5, cx1, this._h - 3);
            }
        }
        if (this._line.length > 0) {
            uic.fillStyle = FORE;
            const tm = this._textMetrics(this._line);
            const fh = tm.fHeight;
            uic.fillText(this._line, taX, taY + (taH - fh) / 2);
        }

        // Draw cursor
        if (this._active && this._cursorOn) {
            uic.fillStyle = CURSOR;
            uic.fillRect(taX + cx - 0.9, 0, 1.8, this._h);
        }
        uic.restore(); // Clipping ends

        // Mouse over control highlight
        if (this.over) {
            uic.strokeStyle = FORE;
            uic.lineWidth = 3;
            uic.beginPath();
            uic.roundRect(1.5, 1.5, this._w - 3, this._h - 3, cnrs);
            uic.stroke();
        }
        // Control disabled highlight
        if (!this._enabled)
            this._disable_highlight(cs, 0, 0, this._w, this._h);
        this._updatePickBuffer();
        uic.restore();
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

    /** @hidden */ orient(a) { return this.warn$('orient'); }
}


Object.assign(CvsTextField.prototype, PICKABLE);