/**
 * <p>This class represents a rectangular grid layout of cells that can be 
 * used to specify the position and size of canvasGUI controls. </p> 
 * <p>The grid layout enables the user to</p>
 * <ul>
 * <li>Define the overall size and position of the grid in pixels.</li>
 * <li>Define the number and relative width of the columns.</li>
 * <li>Define the number and relative height of the rows.</li>
 * <li>Position controls within the grid</li>
 * <li>Allow controls to span multiple columns and/or rows</li> 
 * </ul>
 * <p>The methds <code>cols</code>, <code>rows</code> and <code>cells</code>
 * are used to set the number and/or the relative cell size within the grid
 * area. Passing integers to these methods will create cells of equal widths 
 * and equal 
 * heights.</p>
 * <p>To have columns of different widths or rows with different heights then
 * the parameter must be an array of numbers, the array length represents the
 * number of cells and the array values represent their relative sizes.</p>
 * <p>An example will make this clearer, consider the following code</p>
 * <p><code>grid.cols([10, 24, 16]).rows(4); </code><br>
 * <code>grid.size([10, 24, 16], 4); </code></p>
 * <p>Both lines perform the same action by specifying a grid of 3 variable
 * width columns and 4 equal height rows. The row height in pixels will be
 * the 0.25 x the grid area height.</p>
 * <p>To caluclate the column widths divide each array element by the sum of
 * all the array values. Calculating and dividing by the sum (50) creates. If
 * we do that the array elements becomes <code>[0.2, 0.48, 0.32]</code> and
 * to find the column pixel widths, simply multiply these values by grid area 
 * width.</p>
 * 
 * @since 1.1.0
 */
class GridLayout {

    /** @hidden */ protected _x: number = 0;
    /** @hidden */ protected _y: number = 0;
    /** @hidden */ protected _w: number = 0;
    /** @hidden */ protected _h: number = 0;
    /** @hidden */ protected _ix: number = 2;
    /** @hidden */ protected _iy: number = 2;
    /** @hidden */ protected _cx: Array<number>
    /** @hidden */ protected _cy: Array<number>

    /**
     * <p>Instantiates a grid layout for a given pixel position and size in  
     * the display area. All parameters values are rounded to the nearest 
     * integer.</p>
     * 
     * @param x left edge position
     * @param y top edge position 
     * @param w grid width
     * @param h grid height
     * @hidden
     */
    constructor(x: number, y: number, w: number, h: number) {
        this._x = Math.round(x);
        this._y = Math.round(y);
        this._w = Math.round(w);
        this._h = Math.round(h);
        this._ix = 2;
        this._iy = 2;
        this._cx = [0, 1];
        this._cy = [0, 1];
    }

    /** Get the left position of the grid */
    get x() { return this._x; }

    /** Get the top edge position of the grid */
    get y() { return this._y; }

    /** Get the grid's width in pixels */
    get w() { return this._w; }

    /** Get the grid's height in pixels */
    get h() { return this._h; }

    /** the number of columns in the grid */
    get nbrCols() { return this._cx.length - 1; }

    /** the number of rows in the grid */
    get nbrRows() { return this._cy.length - 1; }

    /**
     * Reposition the grid
     * @param x left edge position to use
     * @param y top edge position to use
     * @returns this grid
     */
    xy(x: number, y: number) {
        this._x = Math.round(x);
        this._y = Math.round(y);
        return this;
    }

    /**
     * Resize the grid
     * @param w new grid width
     * @param h new grid height
     * @returns this grid
     */
    wh(w: number, h: number) {
        this._w = Math.round(w);
        this._h = Math.round(h);
        return this;
    }

    /**
     * <p>Set the number and relative widths of the horizontal cells.</p>
     * 
     * @param n number or an array containing relative widths
     * @returns this grid
     */
    cols(n: number | Array<number>) {
        let values = this._makeNormArray(n);
        if (values.length > 0) this._cx = values;
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
        if (values.length > 0) this._cy = values;
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
    size(nc: number | Array<number>, nr: number | Array<number>) {
        this.cols(nc);
        this.rows(nr);
        return this;
    }

    /**
     * <p>Get the position and size for the control that fits the specified
     * cells taking into account the insets which provide a clear border
     * between the control and the cell boundary.</p>
     * <p>The top-left cell number is [0, 0]</p>
     * @param px horizontal cell number
     * @param py vertical cell number
     * @param pw number of horizontal cells to span
     * @param ph number of vertical cells to span
     * @returns the array [x, y, w, h]
     */
    cell(px: number, py: number, pw = 1, ph = 1) {
        return this._calcRect(px, py, pw, ph, this._ix, this._iy);
    }

    /**
     * <p>Get the position and size for the specified cells ignoring insets.
     * This can be used to define rectangles that surround groups of 
     * controls.<p>
     * <p>The top-left cell number is [0, 0]</p>
     * @param px horizontal cell number
     * @param py vertical cell number
     * @param pw number of hrizontal cells to span
     * @param ph number of vertical cells to span
     * @returns the array [x, y, w, h]
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
        this._ix = Math.round(hinset);
        this._iy = Math.round(vinset);
        return this;
    }



    /** @hidden */
    _calcRect(px: number, py: number, pw: number, ph: number, insetX = 0, insetY = 0) {
        [px, py, pw, ph] = this._validateCellPositions(px, py, pw, ph);
        let x = Math.round(this._cx[px] * this._w + this._x + insetX);
        let w = Math.round((this._cx[px + pw] - this._cx[px]) * this._w - 2 * insetX);
        let y = Math.round(this._cy[py] * this._h + this._y + insetY);
        let h = Math.round((this._cy[py + ph] - this._cy[py]) * this._h - 2 * insetY);
        return [x, y, w, h];
    }

    /** @hidden */
    _validateCellPositions(px: number, py: number, pw = 1, ph = 1) {
        function constrain(v: number, n0: number, n1: number) {
            return v < n0 ? n0 : v > n1 ? n1 : v;
        }
        px = constrain(px, 0, this._cx.length - 2);
        py = constrain(py, 0, this._cy.length - 2);
        pw = constrain(pw, 1, this._cx.length - px - 1);
        ph = constrain(ph, 1, this._cy.length - py - 1);
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
