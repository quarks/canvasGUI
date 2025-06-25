/*
##############################################################################
 CvsBufferedControl
 This is the base class for all visual controls that require a graphic buffer
 ##############################################################################
 */
/**
 * <p>This is the base class for all visual controls that require a graphic buffer.</p>
 */
class CvsBufferedControl extends CvsBaseControl {
    /**
     * CvsBufferedControl class
     * @hidden
     * @param {GUI} gui
     * @param name unique name for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h);
        this._buffer = this._p.createGraphics(this._w, this._h);
        this._tooltip = undefined;
    }
    /**
     * <p>Set or get the corner radii used for this control</p>
     * @param c an array of 4 corner radii
     * @returns an array with the 4 corner radii
     */
    corners(c) {
        if (Array.isArray(c) && c.length == 4) {
            this._c = [...c];
            return this;
        }
        return [...this._c];
    }
    /**
     * Create a tooltip for this control
     *
     * @param tiptext the text to appear in the tooltip
     * @param duration how long the tip remains visible (milliseconds)
     * @returns this control
     */
    tooltip(tiptext, duration = 1600) {
        let tt = this._gui.__tooltip(this._name + '.tooltip')
            .text(tiptext)
            .showTime(duration)
            .shrink();
        this.addChild(tt);
        if (tt instanceof CvsTooltip) {
            tt._validatePosition();
            this._tooltip = tt;
        }
        return this;
    }
    /**
     * Sets the size of the text to use in the tooltip
     * @param {number} tsize text size for this tooltip
     */
    tipTextSize(tsize) {
        if (this._tooltip && tsize && tsize > 0)
            this._tooltip.textSize(tsize);
        return this;
    }
}
//# sourceMappingURL=bufferedcontrol.js.map