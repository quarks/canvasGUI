/*
##############################################################################
 CvsBaseControl
 The base class for controls and panes that don't require a graphics buffer.
 ##############################################################################
 */
/**
 * <p>This class provides most of the core functionality for the canvasGUI
 * controls.</p>
 */
class CvsBaseControl {
    /**
     * CvsBaseControl class
     * @hidden
     * @param gui
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui, id, x, y, w, h) {
        /** @hidden */ this._children = [];
        /** @hidden */ this._visible = true;
        /** @hidden */ this._enabled = true;
        /** @hidden */ this._z = 0;
        /** @hidden */ this._x = 0;
        /** @hidden */ this._y = 0;
        /** @hidden */ this._w = 0;
        /** @hidden */ this._h = 0;
        /** @hidden */ this._isOver = false;
        /** @hidden */ this._active = false;
        /** @hidden */ this._alpha = 255;
        /** @hidden */ this._clickAllowed = false;
        /** @hidden */ this._opaque = true;
        /** @hidden */ this._bufferInvalid = true;
        /** @hidden */ this._tooltip = undefined;
        /**
         * <p>The event handler for this control. Although it is permitted to set this
         * property directly it is recommended that the <code>setAction(...)</code>
         * method is used to define the event handler actions.</p>
         * @hidden
         */
        this.action = function () { };
        this._gui = gui;
        this._p = this._gui._p;
        this._id = id;
        this._x = Math.round(x);
        this._y = Math.round(y);
        this._w = Math.round(w);
        this._h = Math.round(h);
        this._parent = undefined;
        this._visible = true;
        this._enabled = true;
        this._scheme = undefined;
        this._orientation = CvsBaseControl.EAST;
        this._dragging = false; // is mouse being dragged on active control
    }
    /** @hidden */
    get x() { return this._x; }
    /** @hidden */
    set x(v) { this._x = Math.round(v); }
    /** @hidden */
    get y() { return this._y; }
    /** @hidden */
    set y(v) { this._y = Math.round(v); }
    /** @hidden */
    get z() { return this._z; }
    /** @hidden */
    set z(v) { this._z = v; }
    /** @hidden */
    get w() { return this._w; }
    /** @hidden */
    set w(v) { this._w = Math.round(v); }
    /** @hidden */
    get h() { return this._h; }
    /** @hidden */
    set h(v) { this._h = Math.round(v); }
    /** The unique identifier for this control.   */
    get id() { return this._id; }
    /**
     * The type name for this control.<br>
     * (type name = class name without the <code>Cvs</code> prefix)
     */
    get type() { return this.constructor.name.substring(3); }
    ;
    /**
     * <p>This is true if the control can respond to UI events else false.</p>
     * <p>Use <code>enable()</code> and <code>disable()</code> to enable and disable it.</p>
     */
    get isEnabled() { return this._enabled; }
    /**
     * <p>This is true if the control is visible else false.</p>
     * <p>Use <code>hide()</code> and <code>show()</code> to control visibility.</p>
     */
    get isVisible() { return this._visible; }
    /**
     * A control becomes active when the mouse button is pressed over it.
     * This method has little practical use except when debugging.
     * @returns true if this control is expecting more mouse events
     * @hidden
     */
    get isActive() { return this._active; }
    /** @hidden */
    get isOver() { return this._isOver; }
    /** @hidden */
    set isOver(b) {
        if (b != this._isOver) {
            this._isOver = b;
            this.invalidateBuffer();
        }
    }
    /**
     * Move this control to an absolute position.
     * @param x horizontal position
     * @param y vertical position
     * @returns this control
     */
    moveTo(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    /**
     * Move this control relative to current position.
     * @param x horizontal distance
     * @param y vertical distance
     * @returns this control
     */
    moveBy(x, y) {
        this.x += x;
        this.y += y;
        return this;
    }
    /**
     * <p>Calculates the absolute position on the canvas taking into account
     * any ancestors.</p>
     * @returns the actual position in the canvas
     * @hidden
     */
    getAbsXY() {
        if (!this._parent) {
            return { x: this._x, y: this._y };
        }
        else {
            let pos = this._parent.getAbsXY();
            pos.x += this._x;
            pos.y += this._y;
            return pos;
        }
    }
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
            let next_scheme = this._gui._getScheme(name);
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
     * <p>Set or get the corner radii used for this control.</p>
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
     * <p>This method will force the control to update its visual appearance
     * when the next frame is rendered.</p>
     * <p><em>It is included in the most unlikely event it is needed.</em></p>
     * @returns this control
     * @hidden
     */
    invalidateBuffer() {
        this._bufferInvalid = true;
        return this;
    }
    /**
     * <p>Adds this control to another control which becomes its parent.</p>
     * @param parent is the parental control or its id
     * @param rx x position relative to parent
     * @param ry  y position relative to parent
     * @returns this control
     */
    parent(parent, rx, ry) {
        let prnt = this._gui.$(parent);
        prnt.addChild(this, rx, ry);
        this.z = prnt.z + DELTA_Z;
        this._gui.setRenderOrder();
        return this;
    }
    /**
     * <p>Add a child to this control using its relative position [rx, ry].
     * If rx and ry are not provided then it uses the values set in the child.</p>
     * @param c is the actual control or its id
     * @returns this control
     */
    addChild(c, rx, ry) {
        let control = this._gui.$(c);
        rx = !Number.isFinite(rx) ? control.x : Number(rx);
        ry = !Number.isFinite(ry) ? control.y : Number(ry);
        // If the control already has a parent remove it ready for new parent.
        if (!control._parent)
            control.leaveParent();
        // Position and add parent to control control
        control.x = rx;
        control.y = ry;
        control._parent = this;
        control.z = this.z + DELTA_Z;
        this._children.push(control);
        this._gui.setRenderOrder();
        return this;
    }
    /**
     * <p>Remove a child control from this one so that it stays in same screen position.</p>
     * @param c the control to remove or its id
     * @returns this control
     */
    removeChild(c) {
        let control = this._gui.$(c);
        for (let i = 0; i < this._children.length; i++) {
            if (control === this._children[i]) {
                let pos = control.getAbsXY();
                control._x = pos.x;
                control._y = pos.y;
                control._parent = null;
                this._children[i] = undefined;
                break;
            }
        }
        this._children = this._children.filter(Boolean);
        this._gui.setRenderOrder();
        return this;
    }
    /**
     * <p>Remove this control from its parent</p>
     * @returns this control
     */
    leaveParent() {
        if (this._parent) {
            this._parent.removeChild(this);
            this.z = 0;
        }
        return this;
    }
    /**
     * @hidden
     */
    getParent() {
        return this._parent;
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
                this._orientation = CvsBaseControl.NORTH;
                break;
            case 'south':
                this._orientation = CvsBaseControl.SOUTH;
                break;
            case 'west':
                this._orientation = CvsBaseControl.WEST;
                break;
            case 'east':
            default:
                this._orientation = CvsBaseControl.EAST;
        }
        return this;
    }
    /**
     * Create a tooltip for this control.
     *
     * @param tiptext the text to appear in the tooltip
     * @param duration how long the tip remains visible (milliseconds)
     * @returns this control
     */
    tooltip(tiptext) {
        let tt = this._gui.__tooltip(this._id + '.tooltip')
            .text(tiptext)
            .shrink();
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
     * @param cascade if true show children
     * @returns this control
     */
    show(cascade) {
        this._visible = true;
        if (cascade)
            for (let c of this._children)
                c.show(cascade);
        return this;
    }
    /**
     * <p>Make this control invisible.</p>
     * @param cascade if true hide children
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
     * (efault value).</p>
     *
     * @param alpha alpha value for controls background color.
     * @returns this control
     */
    opaque(alpha = 255) {
        this._alpha = Math.floor((alpha < 0 ? 0 : alpha > 255 ? 255 : alpha));
        this._opaque = true;
        return this;
    }
    /**
     * <p>Makes the controls background fully transparent.</p>
     * @returns this control
     */
    transparent() {
        this._opaque = false;
        return this;
    }
    /** @hidden */
    orientation() {
        return this._orientation;
    }
    /** @hidden */
    _minControlSize() { return null; }
    /** @hidden */
    _updateControlVisual() { }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) { return this; }
    /** @hidden */
    _doKeyEvent(e) { return this; }
    /**
     * @param uib ui overlay buffer
     * @param pkb picker buffer
     * @hidden
     */
    _draw(uib = null, pkb = null) { }
    /** @hidden */
    _eq(a, b) {
        return Math.abs(a - b) < 0.001;
    }
    /** @hidden */
    _neq(a, b) {
        return Math.abs(a - b) >= 0.001;
    }
}
/** @hidden */
CvsBaseControl.NORTH = new OrientNorth();
/** @hidden */
CvsBaseControl.SOUTH = new OrientSouth();
/** @hidden */
CvsBaseControl.EAST = new OrientEast();
/** @hidden */
CvsBaseControl.WEST = new OrientWest();
// Mixins
/** @hidden */
const NoOrient = {
    /** This control does not support changing orientation */
    orient(dir) {
        CWARN(`Orientation cannot be changed for controls of type '${this.type}'.`);
        return this;
        // // Hide these methods from typeDoc
        // /** @hidden */ orient(dir) { return this }
    }
};
/** @hidden */
const NoParent = {
    /** This control does not support changing orientation */
    parent(parent, rx, ry) {
        CWARN(`Controls of type '${this.type}' cannot have a parent.`);
        return this;
    },
    leaveParent() {
        CWARN(`Controls of type '${this.type}' cannot have a parent.`);
        return this;
    }
    // // Hide these methods from typeDoc
    // /** @hidden */ parent(parent, rx, ry){ return this }
    // /** @hidden */ leaveParent(){ return this }
};
/** @hidden */
const NoTooltip = {
    /** @hidden */
    tooltip(tiptext) {
        CWARN(`Controls of type '${this.type}' cannot have tooltips.`);
        return this;
    },
    /** @hidden */
    tipTextSize(gtts) {
        CWARN(`Controls of type '${this.type}' cannot have tooltips.`);
        return this;
    }
    // // Hide these methods from typeDoc
    // /** @hidden */ tooltip(tiptext){ return this }
    // /** @hidden */ tipTextSize(gtts) { return this }
};
/** @hidden */
const FixedBackground = {
    /** @hidden */
    transparent() {
        CWARN(`Controls of type '${this.type}' do not support the 'transparent' method.`);
        return this;
    },
    opaque(alpha = 255) {
        CWARN(`Controls of type '${this.type}' do not support the 'opaque' method.`);
        return this;
    }
    // // Hide these methods from typeDoc
    // /** @hidden */ transparent(){ return this }
    // /** @hidden */ opaque() { return this }
};
//# sourceMappingURL=basecontrol.js.map