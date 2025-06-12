/**
 * <p>This class represents a rectangular grid layout of cells that can be 
 * used to specify the position and size of canvasGUI controls. </p> 
 * <p>The grid layout enables the user to</p>
 * <ul>
 * <li>Define the overall size and position of the grid in pixels</li>
 * <li>Define the number and relative size of the horizontal cells (columns)</li>
 * <li>Define the number and relative size of the vertical cells (rows)</li>
 * <li>Position controls within the grid</li>
 * <li>Allow controls to span multiple columns and/or rows</li> 
 * </ul>
 * 
 * @since 1.1.0
 */
class GridLayout {

    /** @hidden */ protected x: number = 0;
    /** @hidden */ protected y: number = 0;
    /** @hidden */ protected w: number = 0;
    /** @hidden */ protected h: number = 0;
    /** @hidden */ protected ix: number = 2;
    /** @hidden */ protected iy: number = 2;
    /** @hidden */ protected cx: Array<number>
    /** @hidden */ protected cy: Array<number>

    /**
     * <p>Instantiates a grid layout for a given pixel position and size in the 
     * display area.</p>
     * 
     * @param x left edge position
     * @param y top edge position 
     * @param w grid width
     * @param h grid height
     * @hidden
     */
    constructor(x: number, y: number, w: number, h: number) {
        this.x = Math.round(x);
        this.y = Math.round(y);
        this.w = Math.round(w);
        this.h = Math.round(h);
        this.ix = 2;
        this.iy = 2;
        this.cx = [0, 1];
        this.cy = [0, 1];
    }

    /**
     * <p>Set the number and relative widths of the horizontal cells.</p>
     * 
     * @param n number or an array containing relative widths
     * @returns this grid
     */
    cols(n: number | Array<number>) {
        let values = this._makeNormArray(n);
        if (values.length > 0) this.cx = values;
        return this;
    }

    /**
     * <p>Set the number and relative heights of the vertical cells.</p>
     * 
     * @param n number or an array containing relative heights
     * @returns this grid
     */
    rows(n: number | Array<number>) {
        let values = this._makeNormArray(n);
        if (values.length > 0) this.cy = values;
        return this;
    }

    /**
     * <p>Set the number and relative sizes of the cells in both horizontal
     * and vertical dimensions.</p>
     * 
     * @param nc number or an array containing relative widths
     * @param nr number or an array containing relative height
     * @returns this grid
     */
    cells(nc: number | Array<number>, nr: number | Array<number>) {
        this.cols(nc);
        this.rows(nr);
        return this;
    }

    /**
     * <p>Get the position and size for the control for the specified cells taking
     * into account the insets which provide spacing between the cells.</p>
     * <p>The top-left cell number is [0, 0]</p>
     * @param px horizontal cell number
     * @param py vertical cell number
     * @param pw number of hrizontal cells to span
     * @param ph number of vertical cells to span
     * @returns this grid
     */
    cell(px: number, py: number, pw = 1, ph = 1) {
        return this._calcRect(px, py, pw, ph, this.ix, this.iy);
    }

    /**
     * <p>Get the position and size for the specified cells ignoring insets.
     * This can be used to define rectangles that surround groups of controls.<p>
     * <p>The top-left cell number is [0, 0]</p>
     * @param px horizontal cell number
     * @param py vertical cell number
     * @param pw number of hrizontal cells to span
     * @param ph number of vertical cells to span
     * @returns this grid
     */
    border(px: number, py: number, pw = 1, ph = 1) {
        return this._calcRect(px, py, pw, ph);
    }

    /**
     * <p>The gap (pixels) between the cell border and the control.</p>
     * @param hinset horizontal inset
     * @param vinset vertical inset
     * @returns this grid
     */
    insets(hinset = 2, vinset = 2) {
        this.ix = Math.round(hinset);
        this.iy = Math.round(vinset);
        return this;
    }

    /** @hidden */
    _calcRect(px: number, py: number, pw: number, ph: number, insetX = 0, insetY = 0) {
        [px, py, pw, ph] = this._validateCellPositions(px, py, pw, ph);
        let x = Math.round(this.cx[px] * this.w + this.x + insetX);
        let w = Math.round((this.cx[px + pw] - this.cx[px]) * this.w - 2 * insetX);
        let y = Math.round(this.cy[py] * this.h + this.y + insetY);
        let h = Math.round((this.cy[py + ph] - this.cy[py]) * this.h - 2 * insetY);
        return [x, y, w, h];
    }

    /** @hidden */
    _validateCellPositions(px: number, py: number, pw = 1, ph = 1) {
        function constrain(v: number, n0: number, n1: number) {
            return v < n0 ? n0 : v > n1 ? n1 : v;
        }
        px = constrain(px, 0, this.cx.length - 2);
        py = constrain(py, 0, this.cy.length - 2);
        pw = constrain(pw, 1, this.cx.length - px - 1);
        ph = constrain(ph, 1, this.cy.length - py - 1);
        return [px, py, pw, ph];
    }

    /** @hidden */
    _makeNormArray(n: number | Array<number>) {
        let size = [], pos = [0];
        if (Array.isArray(n)) {
            if (n.length > 0) {
                let sum = 0; n.forEach(v => sum += v);
                n.forEach(v => size.push(v / sum));
            }
        }
        else {
            for (let i = 0; i < n; i++) size.push(1 / n);
        }
        let sum = 0; size.forEach(v => pos.push((sum += v)));
        return pos;
    }

}
