// /**
//  * This class supports a single line text entry field.
//  * 
//  * The user must ensure that the field is wide enough for the maximum
//  * length of text expected. This control stops accepting input if it is
//  * likely to exceed the control width.
//  * 
//  * The left/right arrow keys move the text insertion point within the 
//  * text. Used in combination with the shift key enables part or all of 
//  * the text to be selected.
//  * 
//  * If no text is selected then the arrows keys can move off the current
//  * control to another. This only works if each textfield has a unique 
//  * index number.
//  * 
//  * If the control has the index value 'idx' then the next control depends
//  * on the arrow key pressed -
//  * left : idx - 1
//  * right : idx + 1
//  * up : idx - 1000
//  * down : idx + 1000
//  * 
//  * No other controls can be used while a textfield control is active. Pressing
//  * 'Enter' or attempting to move to a non-existant textfield deactivates the 
//  * current text field.
//  * 
//  * The user can provide their own validation function which is checked when
//  * the control is deativated.
//  * 
//  * @since 0.9.3
//  */
// class CvsTextfield extends CvsText {

//     protected _linkIndex: number;
//     protected _linkOffset = 0;
//     protected _prevCsrIdx = 0;
//     protected _currCsrIdx = 0;
//     protected _textInvalid = false;
//     protected _cursorOn = false;
//     protected _clock: number;
//     protected _validation: Function;

//     /** @hidden */
//     constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
//         super(gui, name, x || 0, y || 0, w || 80, h || 16);
//         this.textAlign(this._p.LEFT);
//         this._c = [0, 0, 0, 0];
//     }

//     /**
//      * The index number must be unique for all textfields.
//      * 
//      * @param idx the index number to use
//      * @returns this control
//      */
//     index(idx: number, deltaIndex?: number) {
//         if (Number.isFinite(idx)) {
//             if (Number.isFinite(deltaIndex)) this._linkOffset = deltaIndex;
//             this._linkIndex = idx;
//             if (!this._gui._links)
//                 this._gui._links = new Map();
//             this._gui._links.set(idx, this);
//         }
//         return this;
//     }

//     /**
//      * Gets or sets the current text.
//      * Any EOL characters are stripped out of the string. If necessary the
//      * string length will be reduced until will fit inside the textfiel.
//      * If a validation function has been set then the string will be 
//      * validated.
//      * 
//      * @param t a string representing text to display
//      * @returns this control for setter
//      */
//     text(t?: string): string | CvsTextfield {
//         // getter
//         if (t == null || t == undefined)
//             return this._getLine();
//         //setter
//         this._textInvalid = false;
//         t = t.toString().replaceAll(' \n', ' ');
//         t = t.toString().replaceAll('\n ', ' ');
//         t = t.toString().replaceAll('\n', ' ');
//         while (this._buffer.textWidth(t) >= this._maxTextWidthPixels()) {
//             t = t.substring(0, t.length - 1);
//         }
//         this._lines[0] = t;
//         //this._lines = [t];
//         this.validate();
//         this.invalidateBuffer();
//         return this;
//     }

//     /**
//      * Deletes the index number.
//      * @returns this control
//      */
//     noIndex() {
//         if (Number.isFinite(this._linkIndex) && !this._gui._links)
//             this._gui._links.delete(this._linkIndex);
//         this._linkIndex = undefined;
//         return this;
//     }

//     /**
//      * @returns true if the text has passed validation
//      */
//     isValid(): boolean {
//         return !this._textInvalid;
//     }

//     /**
//      * Clears the validity flag irrespective of whether the text is
//      * valid or not.
//      * @returns this control
//      */
//     clearValid() {
//         if (this._textInvalid) {
//             this._textInvalid = false;
//             this.invalidateBuffer();
//         }
//         return this;
//     }
//     /**
//      * Uesr provide a validation function for this textfield
//      * @param vfunc the validation function
//      * @returns this control
//      */
//     validation(vfunc: Function) {
//         this._validation = vfunc;
//         return this;
//     }

//     /**
//      * Force the control to validate
//      * @returns this control
//      */
//     validate(): CvsTextfield {
//         this._validate();
//         return this;
//     }

//     /**
//      * Validate the text
//      * @hidden
//      */
//     _validate(): void {
//         if (this._validation) {
//             let line = this._getLine();
//             let r = this._validation(line);
//             if (Array.isArray(r) && r.length > 0) {
//                 this._textInvalid = !Boolean(r[0]);
//                 // If formatted text is provided and it fits the textfield accept it
//                 if (r[1]) // Validator has returned formatted text
//                     // See if it fits textfield
//                     if (this._buffer.textWidth(r[1]) < this._maxTextWidthPixels())
//                         this._lines[0] = r[1];
//                     //this._lines = [r[1]];
//                     //this.text(r[1]);
//                     else
//                         this._textInvalid = true;
//             }
//         }
//     }

//     /**
//      * Activate this control to receive keyboard events. Occurs if the user
//      * clicks on the control or is 'tabbed' into the control.
//      * @hidden
//      */
//     _activate(selectAll: boolean = false) {
//         this._active = true;
//         let line = this._getLine();
//         this._currCsrIdx = line.length;
//         this._prevCsrIdx = selectAll || this._textInvalid ? 0 : line.length;
//         this._cursorOn = true;
//         this._clock = setInterval(() => {
//             this._cursorOn = !this._cursorOn;
//             this.invalidateBuffer();
//         }, 550);
//         this.invalidateBuffer();
//     }

//     /**
//      * Called when this control passes focus to a new control.
//      * @param idx the index for the control to be activated
//      */
//     _activateNext(offset: number) {
//         this._deactivate();
//         this._validate();
//         let links = this._gui._links;
//         if (links) {
//             let idx = this._linkIndex, ctrl;
//             do {
//                 idx += offset;
//                 ctrl = links.get(idx);
//             }
//             while (ctrl && (!ctrl.isEnabled() || !ctrl.isVisible()));
//             ctrl?._activate();
//         }
//     }

//     /**
//      * Deactivate this control
//      * @hidden
//      */
//     _deactivate() {
//         this._active = false;
//         this._cursorOn = false;
//         clearInterval(this._clock);
//         this.invalidateBuffer();
//     }

//     /**
//      * We are only interested in the first line of text
//      * @hidden
//      */
//     _getLine(): string {
//         return this._lines.length > 0 ? this._lines[0] : '';
//     }

//     /**
//      * Calculates and returns the pixel length for a given
//      * character position.
//      * @hidden
//      */
//     _cursorX(buff: p5.Renderer, line: string, idx: number): number {
//         return idx == 0 ? 0 : buff.textWidth(line.substring(0, idx));
//     }


//     /** @hidden */
//     _handleMouse(e: MouseEvent) { // textfields
//         let eventConsumed = false;
//         let pos = this.getAbsXY();
//         let mx = this._p.mouseX - pos.x;
//         let my = this._p.mouseY - pos.y;
//         let r = this._orientation.xy(mx, my, this._w, this._h);
//         mx = r.x;
//         my = r.y;
//         this._pover = this._over;                 // Store previous mouse over state
//         this._over = this._whereOver(mx, my);     // Store current mouse over state
//         this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
//         if (this._tooltip) this._tooltip._updateState(this._pover, this._over);

//         switch (e.type) {
//             case 'mousedown':
//                 if (this._over > 0) {
//                     this._activate();
//                     eventConsumed = true;
//                 }
//                 break;
//         }
//         return eventConsumed;
//     }

//     /** @hidden */
//     _maxTextWidthPixels() {
//         let ts = Number(this._textSize || this._gui.textSize());
//         return this._w - 2 * this._gap - ts; // maximun text width in pixels
//     }

//     /** @hidden */
//     _handleKey(e: KeyboardEvent) {
//         //let ts = Number(this._textSize || this._gui.textSize());
//         let mtw = this._maxTextWidthPixels(); // maximun text width in pixels
//         let line = this._getLine(); // get text
//         let hasSelection = this._prevCsrIdx != this._currCsrIdx;
//         let tabLeft = Boolean(this._linkIndex && !hasSelection && this._currCsrIdx == 0);
//         let tabRight = Boolean(this._linkIndex && !hasSelection && this._currCsrIdx >= line.length);
//         // console.log(`Has selection ${hasSelection}  ::  Tab left ${tabLeft}  ::  Tab right ${tabRight}`);
//         // console.log(`Curr ${this._currCurrIdx}  ::  Prev ${this._prevCurrIdx}  ::  Line length ${line.length}`);
//         if (e.type == 'keydown') {
//             // Visible character
//             if (e.key.length == 1) {
//                 if (this._prevCsrIdx != this._currCsrIdx) {
//                     line = this._removeSelectedText(line);
//                 }
//                 // Add new character provided it is hort enough to dosplay safely
//                 line = line.substring(0, this._currCsrIdx) + e.key + line.substring(this._currCsrIdx)
//                 if (this._buffer.textWidth(line) < mtw) {
//                     this._currCsrIdx++; this._prevCsrIdx++;
//                     this._lines[0] = line;
//                     //this.text(line);
//                 }
//                 this.invalidateBuffer();
//                 return true; // event consumed
//             }
//             let eventConsumed = true; // assume the event has been consumed
//             switch (e.key) {
//                 case 'ArrowLeft':
//                     if (tabLeft) {
//                         this.action({ source: this, p5Event: e, value: line });
//                         this._activateNext(-1);
//                     }
//                     else {
//                         if (this._currCsrIdx > 0) {
//                             if (!e.shiftKey && hasSelection)
//                                 this._currCsrIdx = Math.min(this._currCsrIdx, this._prevCsrIdx);
//                             else
//                                 this._currCsrIdx--;
//                             if (!e.shiftKey) this._prevCsrIdx = this._currCsrIdx;
//                         }
//                     }
//                     break;
//                 case 'ArrowRight':
//                     if (tabRight) {
//                         this.action({ source: this, p5Event: e, value: line });
//                         this._activateNext(1);
//                     }
//                     else {
//                         if (this._currCsrIdx <= line.length) {
//                             if (!e.shiftKey && hasSelection)
//                                 this._currCsrIdx = Math.max(this._currCsrIdx, this._prevCsrIdx);
//                             else
//                                 this._currCsrIdx++;
//                             if (!e.shiftKey) this._prevCsrIdx = this._currCsrIdx;
//                         }
//                     }
//                     break;
//                 case 'ArrowUp':
//                     if (!hasSelection) {
//                         this.action({ source: this, p5Event: e, value: line });
//                         if (this._linkOffset !== 0) this._activateNext(-this._linkOffset);
//                     }
//                     break;
//                 case 'ArrowDown':
//                     if (!hasSelection) {
//                         this.action({ source: this, p5Event: e, value: line });
//                         if (this._linkOffset !== 0) this._activateNext(this._linkOffset);
//                     }
//                     break;
//                 case 'Enter':
//                     this.action({ source: this, p5Event: e, value: line });
//                     this._deactivate();
//                     this._validate();
//                     break;
//                 case 'Backspace':
//                     if (this._prevCsrIdx != this._currCsrIdx) {
//                         line = this._removeSelectedText(line);
//                     }
//                     else { // Delete character to left
//                         if (this._currCsrIdx > 0) {
//                             line = line.substring(0, this._currCsrIdx - 1) + line.substring(this._currCsrIdx);
//                             this._currCsrIdx--;
//                             this._prevCsrIdx = this._currCsrIdx;
//                         }
//                     }
//                     this._lines[0] = line;
//                     //this.text(line);
//                     break;
//                 case 'Delete':
//                     if (this._prevCsrIdx != this._currCsrIdx) {
//                         line = this._removeSelectedText(line);
//                     }
//                     else { // Delete character to right
//                         if (this._currCsrIdx < line.length) {
//                             line = line.substring(0, this._currCsrIdx) + line.substring(this._currCsrIdx + 1);
//                         }
//                     }
//                     this._lines[0] = line;
//                     //this.text(line);
//                     break;
//                 default:
//                     eventConsumed = false;
//             }
//             this.invalidateBuffer();
//             return eventConsumed;
//         }
//         return true;
//     }

//     /**
//      * Remove any user selected text
//      * @hidden 
//      */
//     _removeSelectedText(line: string) {
//         let p0 = Math.min(this._prevCsrIdx, this._currCsrIdx);
//         let p1 = Math.max(this._prevCsrIdx, this._currCsrIdx);
//         this._prevCsrIdx = this._currCsrIdx = p0;
//         return line.substring(0, p0) + line.substring(p1);
//     }

//     /** @hidden */
//     _updateControlVisual() { // CvsTextfield
//         let ts = Number(this._textSize || this._gui.textSize());
//         let cs = this._scheme || this._gui.scheme();
//         let b = this._buffer;
//         let line = this._lines.length > 0 ? this._lines[0] : '';
//         let tv = this._textInvalid;
//         let sx = 2 * this._gap;

//         let BACK = cs['COLOR_0'];
//         let FORE = cs['COLOR_14'];
//         let CURSOR = cs['BLACK'];
//         let HIGHLIGHT = cs['COLOR_14'];
//         let SELECT = cs['COLOR_4'];

//         b.push();
//         b.background(cs['WHITE']); // white background
//         b.noStroke();
//         if (!this._active) {
//             BACK = tv ? cs['COLOR_14'] : cs['COLOR_0'];
//             FORE = tv ? cs['COLOR_2'] : cs['COLOR_14'];
//             b.stroke(FORE); b.strokeWeight(1.5); b.fill(BACK);
//             b.rect(0, 0, this._w, this._h);
//         }
//         else {
//             // Active so display any selection
//             if (this._currCsrIdx != this._prevCsrIdx) {
//                 let px = this._cursorX(b, line, this._prevCsrIdx);
//                 let cx = this._cursorX(b, line, this._currCsrIdx);
//                 b.noStroke(); b.fill(SELECT);
//                 let cx0 = sx + Math.min(px, cx), cx1 = Math.abs(px - cx);
//                 b.rect(cx0, 1, cx1, this._h - 2);
//             }
//         }
//         b.fill(BACK);
//         // Draw text
//         b.textAlign(this._p.LEFT, this._p.TOP);
//         b.noStroke(); b.fill(FORE);
//         b.text(line, sx, (this._h - ts) / 2);
//         // Draw cursor
//         if (this._activate && this._cursorOn) {
//             let cx = this._cursorX(b, line, this._currCsrIdx);
//             b.stroke(CURSOR); b.strokeWeight(1.5);
//             b.line(sx + cx, 4, sx + cx, this._h - 5);
//         }
//         // Mouse over highlight
//         if (this._over > 0) {
//             b.stroke(HIGHLIGHT);
//             b.strokeWeight(2);
//             b.noFill();
//             b.rect(1, 1, this._w - 2, this._h - 2,
//                 this._c[0], this._c[1], this._c[2], this._c[3])
//         }
//         // Control disabled highlight
//         if (!this._enabled)
//             this._disable_hightlight(b, cs, 0, 0, this._w, this._h);
//         b.pop();
//         b.updatePixels();
//         // last line in this method should be
//         this._bufferInvalid = false;
//     }
// }
