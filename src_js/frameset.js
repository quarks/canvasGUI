/**
 * <p>This class defines the top-left position, width, height and border
 * weight of a rectangular frame to be added to a frameset control.</p>
 *
 * <p>Simply creating a frame does not cause it to be draw, it must be
 * added to a frameset to do that.</p>
 *
 */
class Frame {
    /**
     * Create a frameset control
     * @param x left x position for the frame
     * @param y top y position for the frame
     * @param w frame width
     * @param h frame height
     * @param weight border stroke weight
     * @hidden
     */
    constructor(x = 0, y = 0, w = 0, h = 0, weight = 1) {
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
        this._weight = weight;
    }
    /** left position */
    get x() { return this._x; }
    /** top position */
    get y() { return this._y; }
    /** width */
    get w() { return this._w; }
    /** height */
    get h() { return this._h; }
    /**
     * <p>Gets or sets the current frame weight.</p>
     * <p>If no parameter is passed then the current weight is returned else
     * the weight is updated and this frame is returned.</p>
     * @param weight
     * @returns this frame or current weight
     */
    weight(weight) {
        if (!Number.isFinite(weight))
            return this._weight;
        this._weight = weight;
        return this;
    }
}
/**
 *
 * <p>The frameset is a collection of controls and then display rectangular
 * frames surrounding of one of more controls. Can be used to give a
 * visual guide when organising controls by function.</p>
 * <p>Although it is possible for the user to create the frames manually it
 * is anticipated they will be created using a gridlayout.</>
 *
 */
class CvsFrameSet extends CvsControl {
    constructor(gui, id, x, y) {
        super(gui, id, x, y);
        this._frames = [];
        this._corners = [0, 0, 0, 0];
        this._stroke = undefined;
        this._fill = undefined;
        this._opaque = false;
    }
    /**
     * Add one or more frames to this frameset.
     *
     * @param frames a single or array of frames
     * @returns this control
     */
    addFrames(frames) {
        frames = Array.isArray(frames) ? frames : [frames];
        frames.forEach(f => this._frames.push(f));
        this._setFrameOrder();
        return this;
    }
    /**
     * <p>The color to be used for the frame borders. This overrides the
     * frameset's color scheme.</p>
     * <p>Call the method with no parameter to revert back to the control's
     * color scheme.</p>
     *
     * @param color either css color or p5js p5.Color object
     */
    stroke(color = undefined) {
        this._stroke = undefined;
        if (color)
            this._stroke = cvsGuiColor(color);
    }
    /**
     * <p>The color to be used for the frame backgrounds. This overrides the
     * frameset's color scheme.</p>
     * <p>Call the method with no parameter to revert back to the control's
     * color scheme.</p>
     *
     * @param color either css color or p5js p5.Color object
     */
    fill(color = undefined) {
        this._fill = undefined;
        if (color)
            this._fill = cvsGuiColor(color);
    }
    /** @hidden */
    _setFrameOrder() {
        this._frames.sort((a, b) => { return b.w * b.h - a.w * a.h; });
    }
    /** @hidden */
    _draw(guiCtx, pkCtx) {
        const cs = this.SCHEME;
        const FORE = this._stroke ?? cs.C$(8);
        const BACK = this._fill ?? cs.C$(1);
        guiCtx.save();
        guiCtx.strokeStyle = FORE;
        guiCtx.fillStyle = BACK;
        guiCtx.translate(this._x, this._y);
        if (this._visible) {
            if (this._opaque) {
                this._frames.forEach(frm => {
                    guiCtx.fillRect(frm.x, frm.y, frm.w, frm.h);
                });
            }
            this._frames.forEach(frm => {
                guiCtx.lineWidth = frm.weight();
                guiCtx.strokeRect(frm.x, frm.y, frm.w, frm.h);
            });
            for (let c of this._children)
                if (c._visible)
                    c._draw(guiCtx, pkCtx);
        }
        guiCtx.restore();
    }
    /** @hidden */ orient(a) { return this.warn$('orient'); }
    /** @hidden */ setEnabled() { return this.warn$('setEnabled'); }
    /** @hidden */ enable() { return this.warn$('enable'); }
    /** @hidden */ disable() { return this.warn$('disable'); }
    /** @hidden */ setAction() { return this.warn$('setAction'); }
    /** @hidden */ format() { return this.warn$('format'); }
    /** @hidden */ sortChildren() { return this.warn$('sortChildren'); }
    /** @hidden */ tooltip(a) { return this.warn$('tooltip'); }
    /** @hidden */ tipTextSize(a) { return this.warn$('tipTextSize'); }
    /** @hidden */ corners(a) { return this.warn$('corners'); }
    /** @hidden */ shrink(a, b) { return this.warn$('shrink'); }
}
//# sourceMappingURL=frameset.js.map