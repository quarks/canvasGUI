/*
##############################################################################
 CvsBaseControl
 This is the base class for controls and panes that don't require a buffer
 ##############################################################################
 */
/**
 * <p>Base class for all controls</p>
 * <p>It provides most of the functionality for the controls</p>
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
        /** @hidden */ this._over = 0;
        /** @hidden */ this._pover = 0;
        /** @hidden */ this._clickAllowed = false;
        /** @hidden */ this._active = false;
        /** @hidden */ this._opaque = true;
        /** @hidden */ this._bufferInvalid = true;
        /** <p>The event handler for this control. Although it is permitted to set
         * this property directly it is recommended that the <code>setAction(...)</code>
         * method is used to define the event handler actions.</p>
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
        this._c = gui.corners(undefined);
    }
    ;
    get x() { return this._x; }
    set x(v) { this._x = Math.round(v); }
    get y() { return this._y; }
    set y(v) { this._y = Math.round(v); }
    /** @hidden */
    get z() { return this._z; }
    /** @hidden */
    set z(v) { this._z = v; }
    get w() { return this._w; }
    set w(v) { this._w = Math.round(v); }
    get h() { return this._h; }
    set h(v) { this._h = Math.round(v); }
    /** the unique identifier for this control   */
    get id() { return this._id; }
    /**
     * Move control to an absolute position
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
     * Move control relative to current position
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
     * any ancestors</p>
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
     * <p>Sets or gets the color scheme used by this control.</p>
     * @param id the color scheme id e.g. 'blue'
     * @param cascade if true propogate scheme to all child controls.
     * @returns this control or the control's color scheme
     */
    scheme(id, cascade) {
        // setter
        if (id) {
            this._scheme = this._gui._getScheme(id);
            this.invalidateBuffer();
            if (cascade)
                for (let c of this._children)
                    c.scheme(id, cascade);
            return this;
        }
        // getter
        return this._scheme;
    }
    /**
     * <p>Invalidates the control's buffer forcing it to validate it on the
     * next frame</p>
     * @returns this control
     */
    invalidateBuffer() {
        this._bufferInvalid = true;
        return this;
    }
    /**
     * <p>Adds this control to another control which becomes its parent</p>
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
     * <p>Remove a child control from this one so that it stays in same screen position</p>
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
     * an event. The parameter can take three forms:</p>
     * <ol>
     * <li>Arrow function definition</li>
     * <li>Anonymous function definition</li>
     * <li>Named function declaration</li>
     * </ol>
     *
     * @param event_handler  the function to handle this controls event
     * @returns this control
     */
    setAction(event_handler) {
        if (typeof event_handler === 'function') {
            this.action = event_handler;
        }
        else {
            console.error(`The action for '$(this._id)' must be a function definition`);
        }
        return this;
    }
    /**
     * <p>Specify the orientation to show this control</p>
     * @param dir 'north', 'south', 'east' or 'west'
     * @returns this control
     */
    orient(dir) {
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
     * A control becomes active when the mouse btton is pressed over it.
     * This method has little practical use except when debugging.
     * @hidden
     * @returns true if this control is expecting more mouse events
     */
    isActive() {
        return this._active;
    }
    /**
     * <p>Use <code>enable()</code> and <code>disable()</code> to enable and disable it.</p>
     * @returns true if the control is enabled else false
     */
    isEnabled() {
        return this._enabled;
    }
    /**
     * <p>Enables this control</p>
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
     * <p>Disables this control</p>
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
     * <p>Make this control visible</p>
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
     * <p>Make this control invisible</p>
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
     * @returns true if this control is visible
     * @since 0.9.3
     */
    isVisible() {
        return this._visible;
    }
    /**
     * <p>Makes the controls background opaque. The actual color depends
     * on the controls color scheme</p>
     * @returns this control
     */
    opaque() {
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
    // /**
    //  * <p>Shrink the control to fit contents.</p>
    //  * <p>To shrink on one dimension only pass either 'w' (width) or 'h' 
    //  * (height) to indicate which dimmension to shrink</p>
    //  * @param dim the dimension to shrink 
    //  * @returns this control
    //  */
    // shrink(dim?: string): CvsBaseControl {
    //     let s = this._minControlSize();
    //     switch (dim) {
    //         case 'w':
    //             this._w = s.w;
    //             break;
    //         case 'h':
    //             this._h = s.h;
    //             break;
    //         default:
    //             this._w = s.w;
    //             this._h = s.h;
    //     }
    //     this.invalidateBuffer();
    //     return this;
    // }
    /**
     * If control has significant rounded corners then take them
     * into consideration
     * @since 0.9.4
     * @hidden
     */
    _whereOver(px, py, tol = 0) {
        const R = 5;
        if (px > 0 && px < this._w && py > 0 && py < this._h) {
            if (this._c[0] > R) { // top left
                let dx = px - this._c[0];
                let dy = py - this._c[0];
                let off = dx < 0 && dy < 0 && dx * dx + dy * dy > this._c[0] * this._c[0];
                if (off)
                    return 0;
            }
            if (this._c[1] > R) { // top right
                let dx = px - (this._w - this._c[1]);
                let dy = py - this._c[1];
                let off = dx > 0 && dy < 0 && dx * dx + dy * dy > this._c[1] * this._c[1];
                if (off)
                    return 0;
            }
            if (this._c[2] > R) { // bottom right
                let dx = px - (this._w - this._c[2]);
                let dy = py - (this._h - this._c[2]);
                let off = dx > 0 && dy > 0 && dx * dx + dy * dy > this._c[2] * this._c[2];
                if (off)
                    return 0;
            }
            if (this._c[3] > R) { // bottom left
                let dx = px - this._c[3];
                let dy = py - (this._h - this._c[3]);
                let off = dx < 0 && dy > 0 && dx * dx + dy * dy > this._c[3] * this._c[3];
                if (off)
                    return 0;
            }
            return 1;
        }
        return 0;
    }
    /** @hidden */
    _minControlSize() { return null; }
    /** @hidden */
    _updateControlVisual() { }
    /** @hidden */
    // _handleMouse(e: MouseEvent): boolean { return false };
    /** @hidden */
    _handleKey(e) { return true; }
    ;
    /** @hidden */
    _handleTouch(e) { }
    /** @hidden */
    _processEvent(e, ...info) { }
    /**
     * @param uib ui overlay buffer
     * @param pkb picker buffer
     */
    _draw(uib, pkb) { }
    /** @hidden */
    _eq(a, b) {
        return Math.abs(a - b) < 0.001;
    }
    /** @hidden */
    _neq(a, b) {
        return Math.abs(a - b) >= 0.001;
    }
    /** @hidden */
    over() {
        return this._over;
    }
    /** @hidden */
    pover() {
        return this._pover;
    }
    /** @hidden */
    orientation() {
        return this._orientation;
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
/**
 * Mixin for initialising mouse event data
 * @hidden
 */
const processMouse = {
    /** @hidden */
    _handleMouse(e) {
        let pos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(this._p.mouseX - pos.x, this._p.mouseY - pos.y, this._w, this._h);
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip)
            this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx, my, w, h);
        return false;
    }
};
/**
 * Mixin for initialising touch event data
 * @hidden
 */
const processTouch = {
    /** @hidden */
    _handleTouch(e) {
        e.preventDefault();
        let pos = this.getAbsXY();
        const rect = this._gui._canvas.getBoundingClientRect();
        const t = e.changedTouches[0];
        let [mx, my, w, h] = this._orientation.xy(t.clientX - rect.left - pos.x, t.clientY - rect.top - pos.y, this._w, this._h);
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my, 5); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip)
            this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx, my, w, h);
    }
};
//# sourceMappingURL=basecontrol.js.map