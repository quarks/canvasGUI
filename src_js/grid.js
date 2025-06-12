// This file contains code for a future update to canvasGUI and simplifies 
// arranging controls in a grid like fashion.
/**
 * Get a grid layout for a given pixel position and size in the display area.
 * Initially the grid repreents a single cell but the number and size of
 * horizontal and vertical cells should be set before creating the controls.
 * @param {*} x left edge position
 * @param {*} y top edge position
 * @param {*} w grid width
 * @param {*} h grid height
 * @returns the grid layout
 */
// function createGrid(x, y, w, h) {
//     return new GridLayout(x, y, w, h);
// }
/**
 * This class is used to define a flexible grid layout of cells that can be
 * used to specify the position and size of canvasGUI controls used in a
 * sketch.
 *
 *
 */
class GridLayout {
    /**
     * Create a grid layout for a given pixel position and size in the
     * display area.
     * Once included in the canvasGUI library the user will not instantiate
     * this class directly but rather in the same way as the controls.
     *
     * @param {*} x left edge position
     * @param {*} y top edge position
     * @param {*} w grid width
     * @param {*} h grid height
     */
    constructor(x, y, w, h) {
        /** @hidden */ this.x = 0;
        /** @hidden */ this.y = 0;
        /** @hidden */ this.w = 0;
        /** @hidden */ this.h = 0;
        /** @hidden */ this.ix = 2;
        /** @hidden */ this.iy = 2;
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
     * Set the number and relative widths of the horizontal cells.
     *
     * @param {*} n number or an array containing relative widths
     * @returns this grid
     */
    cols(n) {
        let values = this._makeNormArray(n);
        if (values.length > 0)
            this.cx = values;
        return this;
    }
    /**
     * Set the number and relative heights of the vertical cells.
     *
     * @param {*} n number or an array containing relative heights
     * @returns this grid
     */
    rows(n) {
        let values = this._makeNormArray(n);
        if (values.length > 0)
            this.cy = values;
        return this;
    }
    /**
     * Set the number and relative sizes of the cells in both horizontal
     * and vertical dimensions.
     * @param {*} nc number or an array containing relative widths
     * @param {*} nr number or an array containing relative height
     * @returns this grid
     */
    cells(nc, nr) {
        this.cols(nc);
        this.rows(nr);
        return this;
    }
    /**
     * Get the position and size for the control for the specified cells taking
     * into account the insets which provide spacing between the cells.
     * @param {*} px horizontal cell number
     * @param {*} py vertical cell number
     * @param {*} pw number of hrizontal cells to span
     * @param {*} ph number of vertical cells to span
     * @returns this grid
     */
    cell(px, py, pw = 1, ph = 1) {
        return this._calcRect(px, py, pw, ph, this.ix, this.iy);
    }
    /**
     * Get the position and size for the specified cells ignoring insets.
     * This can be used to define rectangles that surround groups of controls.
     * @param {*} px horizontal cell number
     * @param {*} py vertical cell number
     * @param {*} pw number of hrizontal cells to span
     * @param {*} ph number of vertical cells to span
     * @returns this grid
     */
    border(px, py, pw = 1, ph = 1) {
        return this._calcRect(px, py, pw, ph);
    }
    /**
     *
     * @param {*} hinset horizontal inset
     * @param {*} vinset vertical inset
     * @returns this grid
     */
    insets(hinset = 2, vinset = 2) {
        this.ix = Math.round(hinset);
        this.iy = Math.round(vinset);
        return this;
    }
    _calcRect(px, py, pw, ph, insetX = 0, insetY = 0) {
        [px, py, pw, ph] = this._validateCellPositions(px, py, pw, ph);
        let x = Math.round(this.cx[px] * this.w + this.x + insetX);
        let w = Math.round((this.cx[px + pw] - this.cx[px]) * this.w - 2 * insetX);
        let y = Math.round(this.cy[py] * this.h + this.y + insetY);
        let h = Math.round((this.cy[py + ph] - this.cy[py]) * this.h - 2 * insetY);
        return [x, y, w, h];
    }
    _validateCellPositions(px, py, pw = 1, ph = 1) {
        px = constrain(px, 0, this.cx.length - 2);
        py = constrain(py, 0, this.cy.length - 2);
        pw = constrain(pw, 1, this.cx.length - px - 1);
        ph = constrain(ph, 1, this.cy.length - py - 1);
        return [px, py, pw, ph];
    }
    _makeNormArray(n) {
        let size = [], pos = [0];
        if (Array.isArray(n)) {
            if (n.length > 0) {
                let sum = 0;
                n.forEach(v => sum += v);
                n.forEach(v => size.push(v / sum));
            }
        }
        else {
            for (let i = 0; i < n; i++)
                size.push(1 / n);
        }
        let sum = 0;
        size.forEach(v => pos.push((sum += v)));
        return pos;
    }
}
//# sourceMappingURL=grid.js.map