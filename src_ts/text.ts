/**
 * Defines an line of text, its position and length
 * @hidden
 */
interface __Line { txt: string, x: number, y: number, w: number }

/**
 * </p>The base class for any control that displays text as part of its 
 * visual interface</p>
 * @hidden
 */
abstract class CvsText extends CvsBufferedControl {

    /** @hidden */ protected _tLines: Array<__Line> = [];
    /** @hidden */ protected _tBox: Array<number> = [0, 0];
    /** @hidden */ protected _tAlignH = "center";
    /** @hidden */ protected _tAlignV = "center";
    /** @hidden */ protected _tFace: any;
    /** @hidden */ protected _tSize: any;
    /** @hidden */ protected _tStyle: any;
    /** @hidden */ protected _tSlant = 14;
    /** @hidden */ protected _tArea: Array<number> = [];
    /** @hidden */ protected _fitWH: any;

    /** @hidden */
    get T_SIZE(): number { return this._tSize || this._gui._tSize }
    /** @hidden */
    get T_FACE(): string { return this._tFace || this._gui._tFace }
    /** @hidden */
    get T_STYLE(): string { return this._tStyle || this._gui._tStyle }

    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number, pickable: boolean) {
        super(gui, name, x, y, w, h, pickable);
        this._tArea = [ISET_H, ISET_V, this._w - 2 * ISET_H, this._h - 2 * ISET_V];
    }

    /**
     * <p>Gets or sets the current text.</p>
     * <p>Processing constants are used to define the alignment.</p>
     * @param text the text to display
     * @param alignH 'left', 'right' or 'center'
     * @param alignV 'top', 'bottom' or 'center'
     * @returns this control or the existing text
     */
    text(text?: string | Array<string>, alignH?: string, alignV?: string): string | CvsControl {
        if (text == null || text == undefined) // getter
            return this._tLines.map(line => line.txt).join('\n');
        // Convert first parameter to an array if not already'
        if (!Array.isArray(text)) text = [text];
        this._tLines = [];
        let lines: Array<string> = [];
        // Split any array elements containing newline characters and trim any
        // leading or trailing whitespace.
        text.forEach(t => lines = lines.concat(String(t).split(/\s*\n+\s*/)));
        lines.forEach(v =>
            this._tLines.push({ txt: v.trim(), x: 0, y: 0, w: 0 })
        );
        this.textAlign(alignH, alignV);
        this.invalidateText();
        return this;
    }

    /**
     * <p>If no parameter is passed then the current font family name will be
     * returned.</p>
     * <p>If a parameter is provided it will be accepted if it is one of the  
     * following :-</p>
     * <ul>
     * <li>The font family name of a TTF system font e.g. 'arial', 
     * 'courier new', 'times new roman' ...</li>
     * <li>The name of a logical font e.g. 'serif', 'sans-serif', 
     * 'monospace' ...</li>
     * <li>A font loaded in p5js with the <code>loadFont()</code>
     * function.</li>
     * </ul>
     * <p>Any other parameter value will display a warning and be ignored
     * leaving the font unchanged.</p>
     * 
     * @param font system or logical font, a FontFace object or a p5js 
     * font object.
     * @returns this control
     */
    textFont(font?: string | object) {
        let fface = cvsGuiFont(font);
        if (fface) {
            this._tFace = fface;
            this.invalidateText();
        }
        else
            CWARN(`'${font?.toString()}' is unrecognized so will be ignored!`);
        return this;
    }

    /**
     * <p>Sets or gets the local text style.</p>
     * <p>The following strings are recognised as valid styles :-</p>
     * <pre>
     * 'normal'  'bold'  'thin'  'italic'  
     * 'bold italic'  'thin italic'  'oblique'
     * </pre>
     * <p>It will also accept the 4 p5js constants :-</p>
     * <pre>
     * NORMAL    BOLD   ITALIC   BOLDITALIC
     * </pre>
     * <p>If the 'oblique' style is specified then the parameter 'slant' is
     * the angle (degress) that the font is tilted from the vertical. An angle 
     * of +14&deg; is the equivalent to 'italic' and 'normal' is 0&deg;.</p>
     * <p>Unrecognized styles are ignored and the local style is left 
     * unchanged.</p>
     * <p>If no parameter is passed then the current style is returned.</p>
     * 
     * @param style the font style to use.
     * @param slant the oblique slant angle (degrees)
     * @returns this control
     */
    textStyle(style?: string, slant: number = 0) {
        if (!style)
            return this._tStyle; // getter
        style = _validateTextStyle(style);
        if (style) {
            if (style == 'oblique')
                this._tSlant = slant ? 14 : +slant;
            this._tStyle = style;
            this.invalidateText();
        }
        return this;
    }

    /**
     * <p>Sets the horizontal and vertical text aligment.</p>
     * <p>The following strings are recognised as valid styles :-</p>
     * <pre>
     * Horz:  'left', 'right' or 'center' 
     * Vert:  'top', 'bottom' or 'center'
     * </pre>
     * <p>It will also accept the equivalent p5js constants :-</p>
     * <pre>
     * LEFT  RIGHT  CENTER  TOP  BOTTOM   CENTER     
     * </pre>
     * <p>Unrecognized values are ignored and the text allignment is unchanged.</p>
     * 
     * @param horz 'left', 'right' or 'center'
     * @param vert 'top', 'bottom' or 'center'
     * @returns this control
     */
    textAlign(horz?: string, vert?: string) {
        let a = this._validateAlign(this._tAlignH, this._tAlignV, horz, vert);
        this._tAlignH = a.horz;
        this._tAlignV = a.vert;
        if (a.changed)
            this.invalidateText();
        return this;
    }

    /**
     * <p>Removes any text that the control might use to display itself.</p>
     * @returns this control
     */
    noText(): CvsControl {
        this._tLines = [];
        this._tBox = [0, 0];
        this.invalidateBuffer();
        return this;
    }

    /**
     * <p>Sets or gets the local text size.</p>
     * @param tsize the text size to use
     * @returns this control or the current text size
     */
    textSize(tsize?: number) {
        if (!Number.isFinite(tsize))
            return this.T_SIZE; // getter;
        if (this._tSize != tsize) { // setter
            this._tSize = tsize;
            this.invalidateText();
        }
        return this;
    }

    /**
     * <p>Resize the control to fit the face content (text and/or icon).</p>
     * <p>The parameter values control which dimension(s), width and/or 
     * height, are changed and their minimum.</p>
     * @param rsW if &le;0 then leave the width unchanged otherwise it is the
     *               minimum width allowed after resizing.
     * @param rsH if &le;0 then leave the height unchanged otherwise it is the
     *               minimum height allowed after resizing. 
     * @returns this control
     */
    shrink(rsW = 0, rsH = 0) {
        this._fitWH = [rsW, rsH];
        this.invalidateBuffer();
        return this;
    }

    /**
     * Get the css font descriptor for this control
     * @hidden
     * @readonly
     * @type {*}
     */
    get _cssFont() {
        return cssFont$(this.T_FACE, this.T_SIZE, this.T_STYLE, this._tSlant);
    }

    /**
     * Wrapper for JS <code>measureText()</code> function to summarise
     * the metrics needed form measuring text.
     * 
     * @param {*} str the text to measure
     * @returns summary of text metrics
     * @hidden
     */
    _textMetrics(str: string) {
        const uic = this._uicBuffer.getContext('2d');
        uic!.save();
        uic!.font = this._cssFont;
        let tm = uic!.measureText(str);
        uic!.restore();
        return {
            tWidth: tm.actualBoundingBoxRight + tm.actualBoundingBoxLeft,
            tAscent: tm.actualBoundingBoxAscent,
            tDescent: tm.actualBoundingBoxDescent,
            tHeight: tm.actualBoundingBoxAscent + tm.actualBoundingBoxDescent,
            fWidth: tm.width,
            fAscent: tm.fontBoundingBoxAscent,
            fDescent: tm.fontBoundingBoxDescent,
            fHeight: tm.fontBoundingBoxAscent + tm.fontBoundingBoxDescent,
            left: tm.actualBoundingBoxLeft,
            right: tm.actualBoundingBoxRight,
        };
    }

    /** @hidden */
    _updateFaceElements() {
        this._tArea = this._getUseableFaceRegion();
    }

    /** @hidden */
    _fitToContent() {
        const [fx, fy, fw, fh] = this._getUseableFaceRegion();
        const [nW, nH] = this._fitWH;
        const tW = Math.ceil(this._tBox[0] + 2 * fx);
        const tH = Math.ceil(this._tBox[1] + 2 * fy);
        if (nW > 0)
            this._w = Math.max(tW, nW);
        if (nH > 0)
            this._h = Math.max(tH, nH);
        this._fitWH = [0, 0];
        this.invalidateBuffer();
    }

    /** @hidden */
    _validateAlign(caH: string, caV: string, horz?: string, vert?: string) {
        let changed = false;
        switch (horz) {
            case 'left':
            case 'right':
            case 'center':
                changed = (horz != caH);
                break;
            default:
                horz = caH;
        }
        switch (vert) {
            case 'top':
            case 'bottom':
            case 'center':
                changed = changed || (vert != caV);
                break;
            default:
                vert = caV;
        }
        return { horz: horz, vert: vert, changed: changed };
    }

    /** @hidden */
    _formatText() {
        const para = this._calcTextBox();
        this._tBox = [para.boxW, para.boxH];
        this._textInvalid = false;
    }

    /**
     * Converts raw text data into a form ready for rendering
     * @returns lines and textblock size data
     * @hidden
     */
    _calcTextBox() {
        const uic = this._uicBuffer.getContext('2d');
        uic!.save();
        uic!.font = this._cssFont;
        uic!.textBaseline = 'alphabetic';
        let ln = 0, maxW = 0, maxH = 0, tm: any;
        this._tLines.forEach(line => {
            tm = this._textMetrics(line.txt);
            line.y = ln * tm.fHeight + tm.fAscent;
            line.w = tm.tWidth;
            maxW = Math.max(maxW, line.w);
            ln++;
        });
        // Apply horizontal alignment
        this._tLines.forEach(line => {
            switch (this._tAlignH) {
                case "left":
                    line.x = 0;
                    break;
                case "right":
                    line.x = maxW - line.w;
                    break;
                case "center":
                    line.x = (maxW - line.w) / 2;
                    break;
            }
        });
        maxH = tm ? this._tLines.length * tm.fHeight : 0;
        uic!.restore();
        return { boxW: maxW, boxH: maxH };
    }

    /**
     * Render the text.
     * @param tcolor colour to use for the text
     * @hidden
     */
    _renderTextArea(tcolor: string) {
        const uic = this._uicBuffer.getContext('2d');
        const [tx, ty, tw, th] = [...this._tArea];
        const [bw, bh] = [...this._tBox];
        let px = tx, py = ty;
        switch (this._tAlignH) {
            case "right":
                px += tw - bw;
                break;
            case "center":
                px += (tw - bw) / 2;
                break;
        }
        switch (this._tAlignV) {
            case "bottom":
                py += th - bh;
                break;
            case "center":
                py += (th - bh) / 2;
                break;
        }
        uic!.save();
        uic!.beginPath();
        uic!.rect(tx, ty, tw, th);
        uic!.clip();
        uic!.textBaseline = 'alphabetic';
        uic!.font = this._cssFont;
        uic!.fillStyle = tcolor;
        this._tLines.forEach(line => {
            uic!.fillText(line.txt, line.x + px, line.y + py);
        });
        uic!.restore();
    }
}

