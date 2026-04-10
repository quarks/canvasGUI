/**
 * <p>This is the base class for controls and panes that don't require an
 * offscreen buffer.</p>
 */
class CvsControl extends CvsPin {
    /**
     * CvsControl class
     * @hidden
     * @param gui
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui, id, x, y, w, h, pickable) {
        super(gui, id, x, y);
        /** @hidden */ this._w = 0;
        /** @hidden */ this._h = 0;
        /** @hidden */ this._isOver = false;
        /** @hidden */ this._active = false;
        /** @hidden */ this._alpha = 255;
        /** @hidden */ this._clickAllowed = false;
        /** @hidden */ this._opaque = true;
        /** @hidden */ this._tooltip = undefined;
        /**
         * <p>The event handler for this control. Although it is permitted to set this
         * property directly it is recommended that the <code>setAction(...)</code>
         * method is used to define the event handler actions.</p>
         * @hidden
         */
        this.action = function () { };
        this._w = Math.round(w);
        this._h = Math.round(h);
        this._visible = true;
        this._enabled = true;
        this._scheme = undefined;
        this._orientation = CvsControl.EAST;
        this._dragging = false; // is mouse being dragged on active control
        if (pickable)
            this._gui.registerPickable(this);
    }
    /** @hidden */
    get w() { return this._w; }
    /** @hidden */
    set w(v) { this._w = Math.round(v); }
    /** @hidden */
    get h() { return this._h; }
    /** @hidden */
    set h(v) { this._h = Math.round(v); }
    /**
     * <p>This is true if the control background is opaque else false.</p>
     * <p>Use <code>opaque()</code> and <code>transparent()</code> display / hide the background.</p>
     */
    get isOpaque() { return this._opaque; }
    /**
     * A control becomes active when the mouse button is pressed over it.
     * This method has little practical use except when debugging.
     * @returns true if this control is expecting more mouse events
     * @hidden
     */
    get isActive() { return this._active; }
    /** @hidden */
    get over() { return this._isOver; }
    /** @hidden */
    set over(b) {
        if (b != this._isOver) {
            this._isOver = b;
            this.invalidateBuffer();
        }
    }
    /** @hidden */
    get CNRS() { return this._corners || this._gui._corners; }
    /** @hidden */
    get SCHEME() { return this._scheme || this._gui._scheme; }
    /**
     * <p>If the name of a valid color scheme is provided then it will use it
     * to display the control, non-existant scheme names will be ignored. In
     * both cases this control is returned.</p>
     * <p>If there is no parameter it returns the name of the current color
     * scheme used by this control.</p>
     * @param name the color scheme name e.g. 'blue'
     * @param cascade if true propogate scheme to all child controls.
     * @returns this control or the control's color scheme
     */
    scheme(name, cascade) {
        if (name) { // setter
            let next_scheme = this._gui.getScheme(name);
            if (next_scheme && this._scheme != next_scheme) {
                this._scheme = next_scheme;
                this.invalidateBuffer();
                if (cascade)
                    for (let c of this._children)
                        c.scheme(name, cascade);
            }
            return this;
        }
        return this._scheme;
    }
    /**
     * <p>Get or set the corner radii used for this control.</p>
     * <p>To set the radii the parameters must be one of the following</p>
     * <ul>
     * <li>an array of 4 numbers.</li>
     * <li>a comma seperated list of 4 numbers.</li>
     * <li>a single number to be used for all 4 radii.</li>
     * </ul>
     * <p>If no parameter is passed or does not match one of the above then an
     * array of the currently used radii values.</p>
     *
     * @param c valid radii combination
     * @returns an array of the currently used radii values
     */
    corners(...c) {
        switch (c.length) {
            case 0: // Getter
                return [...this.CNRS];
            case 4:
                this._corners = [...c];
                break;
            case 1:
                if (Array.isArray(c[0]) && c[0].length == 4)
                    this._corners = [...c[0]];
                else
                    this._corners = [c[0], c[0], c[0], c[0]];
                break;
        }
        return this;
    }
    /**
     * <p>This sets the event handler to be used when this control fires
     * an event. The parameter can take one of three forms:</p>
     * <ol>
     * <li>Arrow function definition</li>
     * <li>Anonymous function definition</li>
     * <li>Named function declaration</li>
     * </ol>
     *
     * @param event_handler  the function to handle this control's events.
     * @returns this control
     */
    setAction(event_handler) {
        if (typeof event_handler === 'function')
            this.action = event_handler;
        else
            console.error(`The action for '$(this._id)' must be a function definition`);
        return this;
    }
    /**
     * <p>Sets this controls display orientation to one of the four cardinal
     * compass points. An invalid parameter will set the orientation to 'east'
     * which is the default value.</p>
     * @param dir 'north', 'south', 'east' or 'west'
     * @returns this control
     */
    orient(dir = 'east') {
        dir = dir.toString().toLowerCase();
        switch (dir) {
            case 'north':
                this._orientation = CvsControl.NORTH;
                break;
            case 'south':
                this._orientation = CvsControl.SOUTH;
                break;
            case 'west':
                this._orientation = CvsControl.WEST;
                break;
            case 'east':
            default:
                this._orientation = CvsControl.EAST;
        }
        return this;
    }
    /**
     * Create a tooltip for this control.
     *
     * @param tiptext the text to appear in the tooltip
     * @returns this control
     */
    tooltip(tiptext) {
        let tt = this._gui.__tooltip(this._id + '.tooltip')
            .text(tiptext);
        this.addChild(tt);
        if (tt instanceof CvsTooltip) {
            tt._validatePosition();
            this._tooltip = tt;
        }
        return this;
    }
    /**
     * Sets the size of the text to use in the tooltip.
     * @param {number} tsize text size for this tooltip
     */
    tipTextSize(tsize) {
        if (this._tooltip && tsize && tsize > 0)
            this._tooltip.textSize(tsize);
        return this;
    }
    /**
     * <p>Enables this control.</p>
     * @param cascade if true enable child controls
     * @returns this control
     */
    enable(cascade) {
        if (!this._enabled) {
            this._enabled = true;
            this.invalidateBuffer();
        }
        if (cascade)
            for (let c of this._children)
                c.enable(cascade);
        return this;
    }
    /**
     * <p>Disables this control.</p>
     * @param cascade if true disable child controls
     * @returns this control
     */
    disable(cascade) {
        if (this._enabled) {
            this._enabled = false;
            this.invalidateBuffer();
        }
        if (cascade)
            for (let c of this._children)
                c.disable(cascade);
        return this;
    }
    /**
     * <p>Make this control visible.</p>
     * @param cascade if true then show any children
     * @returns this control
     */
    show(cascade) {
        this._visible = true;
        if (cascade)
            for (let c of this._children)
                c.show(true);
        return this;
    }
    /**
     * <p>Make this control invisible.</p>
     * @param cascade if true hide any children
     * @returns this control
     */
    hide(cascade) {
        this._visible = false;
        if (cascade)
            for (let c of this._children)
                c.hide(cascade);
        return this;
    }
    /**
     * <p>Makes the controls background opaque. The actual color depends
     * on the controls color scheme.</p>
     * <p>The second parameter, alpha, is optional and controls the level
     * of opaqueness from 0 - transparent to 255 - fully opaque
     * (default value).</p>
     *
     * @param alpha alpha value for controls background color.
     * @returns this control
     */
    opaque(alpha = 255) {
        this._alpha = Math.floor((alpha < 0 ? 0 : alpha > 255 ? 255 : alpha));
        this._opaque = true;
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Makes the controls background fully transparent.</p>
     * @returns this control
     */
    transparent() {
        this._opaque = false;
        this.invalidateBuffer();
        return this;
    }
    /** @hidden */
    orientation() {
        return this._orientation;
    }
    /** @hidden */
    _updateControlVisual() { }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) { return this; }
    /** @hidden */
    _doKeyEvent(e) { return this; }
    /**
     * @param uic ui overlay buffer drawing context
     * @param pkc picker buffer drawing context
     * @hidden
     */
    _draw(uic, pkc) { }
}
/** @hidden */
CvsControl.NORTH = new OrientNorth();
/** @hidden */
CvsControl.SOUTH = new OrientSouth();
/** @hidden */
CvsControl.EAST = new OrientEast();
/** @hidden */
CvsControl.WEST = new OrientWest();
//# sourceMappingURL=control.js.map