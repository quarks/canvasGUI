/* <p>Object type  \{ x: number; y: number; \}  </p> @hidden */
interface __Position { x: number; y: number; }

/* <p>Object type  \{ w: number; h: number; \} </p> @hidden */
interface __Box { w: number; h: number; }

/* <p>Defines an overlap</p> @hidden */
interface __Overlap {
    valid: boolean;
    left?: number; right?: number; top?: number, bottom?: number,
    width?: number; height?: number; offsetX?: number; offsetY?: number;
}

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

    /** @hidden */
    static NORTH = new OrientNorth();
    /** @hidden */
    static SOUTH = new OrientSouth();
    /** @hidden */
    static EAST = new OrientEast();
    /** @hidden */
    static WEST = new OrientWest();

    /** @hidden */ protected _gui: GUI;
    /** @hidden */ protected _p: p5;
    /** @hidden */ protected _name: string;
    /** @hidden */ protected _children: Array<any> = [];
    /** @hidden */ protected _parent: CvsBaseControl;
    /** @hidden */ protected _visible: boolean = true;
    /** @hidden */ protected _enabled: boolean = true;
    /** @hidden */ protected _Z: number = 0;
    /** @hidden */ protected _x: number = 0;
    /** @hidden */ protected _y: number = 0;
    /** @hidden */ protected _w: number = 0;
    /** @hidden */ protected _h: number = 0;
    /** @hidden */ protected _orientation: OrientNorth | OrientSouth | OrientEast | OrientWest;
    /** @hidden */ protected _dragging: boolean;
    /** @hidden */ protected _buffer: p5.Renderer;
    /** @hidden */ protected _over: number = 0;
    /** @hidden */ protected _pover: number = 0;
    /** @hidden */ protected _clickAllowed: boolean = false;
    /** @hidden */ protected _c: Array<number>;
    /** @hidden */ protected _active: boolean = false;
    /** @hidden */ protected _opaque: boolean = true;;
    /** @hidden */ protected _tooltip: CvsTooltip;
    /** @hidden */ protected _scheme: BaseScheme;
    /** @hidden */ protected _bufferInvalid: boolean = true;

    /** <p>The event handler for this control. Although it is permitted to set 
     * this property directly it is recommended that the <code>setAction(...)</code>
     * method is used to define the event handler actions.</p> 
     */
    action: Function = function () { };

    /**
     * CvsBaseControl class
     * @hidden
     * @param gui
     * @param name unique name for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        this._gui = gui;
        this._p = this._gui._p;
        this._name = name;
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
        this._parent = undefined;
        this._visible = true;
        this._enabled = true;
        this._scheme = undefined;
        this._orientation = CvsBaseControl.EAST;
        this._dragging = false; // is mouse being dragged on active control
        this._c = gui.corners(undefined);
    }

    /**
     * 
     * @returns the unique identier for this control
     */
    name(): string {
        return this._name;
    }

    /**
     * <p>Calculates the absolute position on the canvas taking into account
     * any ancestors</p>
     * @returns the actual position in the canvas
     * @hidden
     */
    getAbsXY(): __Position {
        if (!this._parent) {
            return { x: this._x, y: this._y };
        } else {
            let pos = this._parent.getAbsXY();
            pos.x += this._x; pos.y += this._y;
            return pos;
        }
    }

    /**
     * <p>Sets or gets the color scheme used by this control.</p>
     * @param id the color scheme id e.g. 'blue'
     * @param cascade if true propogate scheme to all child controls.
     * @returns this control or the control's color scheme
     */
    scheme(id?: string, cascade?: boolean): any {
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
     * <p>Adds this control to another control which becomes its parent</p>
     * @param p is the parental control or its name
     * @param rx x position relative to parent
     * @param ry  y position relative to parent
     * @returns this control
     */
    parent(p: CvsBaseControl | string, rx?: number, ry?: number): CvsBaseControl {
        let parent = this._gui.$(p);
        parent.addChild(this, rx, ry);
        return this;
    }

    /**
     * <p>Add a child to this control using its relative position [rx, ry].
     * If rx and ry are not provided then it uses the values set in the child.</p> 
     * @param c is the actual control or its name
     * @returns this control
     */
    addChild(c: CvsBaseControl | string, rx?: number, ry?: number): any {
        let control = this._gui.$(c);
        rx = !Number.isFinite(rx) ? control._x : Number(rx);
        ry = !Number.isFinite(ry) ? control._y : Number(ry);
        // See if the control already has a parent and it is not remove
        // from its parent.
        if (!control._parent) {
            control.leaveParent();
        }
        // Position and add parent to control control
        control._x = rx;
        control._y = ry;
        control._parent = this;
        this._children.push(control);
        return this;
    }

    /**
     * <p>Remove a child control from this one so that it stays in same screen position</p>
     * @param c the control to remove or its name
     * @returns this control
     */
    removeChild(c: CvsBaseControl | string) {
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
        return this;
    }


    /**
     * <p>Remove this control from its parent</p>
     * @returns this control
     */
    leaveParent(): CvsBaseControl {
        if (this._parent)
            this._parent.removeChild(this);
        return this;
    }

    /**
     * 
     * @returns this controls parent
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
    setAction(event_handler: Function) {
        if (typeof event_handler === 'function') {
            this.action = event_handler;
        }
        else {
            console.error(`The action for '$(this._name)' must be a function definition`);
        }
        return this;
    }

    /**
     * <p>Specify the orientation to show this control</p>
     * @param dir 'north', 'south', 'east' or 'west'
     * @returns this control
     */
    orient(dir: string): CvsBaseControl {
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
    enable(cascade?: boolean): CvsBaseControl {
        if (!this._enabled) {
            this._enabled = true;
            this.invalidateBuffer();
        }
        // this.invalidateBuffer(); // removed 0.9.3
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
    disable(cascade?: boolean): CvsBaseControl {
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
    show(cascade?: boolean): CvsBaseControl {
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
    hide(cascade?: boolean): CvsBaseControl {
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
    opaque(): CvsBaseControl {
        this._opaque = true;
        return this;
    }

    /**
     * <p>Makes the controls background fully transparent.</p>
     * @returns this control
     */
    transparent(): CvsBaseControl {
        this._opaque = false;
        return this;
    }

    /**
     * <p>Shrink the control to fit contents.</p>
     * <p>To shrink on one dimension only pass either 'w' (width) or 'h' 
     * (height) to indicate which dimmension to shrink</p>
     * @param dim the dimension to shrink 
     * @returns this control
     */
    shrink(dim?: string): CvsBaseControl {
        let s = this._minControlSize();
        switch (dim) {
            case 'w':
                this._w = s.w;
                break;
            case 'h':
                this._h = s.h;
                break;
            default:
                this._w = s.w;
                this._h = s.h;
        }
        this.invalidateBuffer();
        return this;
    }

    /** 
     * If control has significant rounded corners then take them 
     * into consideration 
     * @since 0.9.4
     * @hidden
     */
    _whereOver(px: number, py: number, tol = 0): number {
        const R = 5;
        if (px > 0 && px < this._w && py > 0 && py < this._h) {
            if (this._c[0] > R) {  // top left
                let dx = px - this._c[0];
                let dy = py - this._c[0];
                let off = dx < 0 && dy < 0 && dx * dx + dy * dy > this._c[0] * this._c[0];
                if (off) return 0;
            }
            if (this._c[1] > R) {  // top right
                let dx = px - (this._w - this._c[1]);
                let dy = py - this._c[1];
                let off = dx > 0 && dy < 0 && dx * dx + dy * dy > this._c[1] * this._c[1];
                if (off) return 0;
            }
            if (this._c[2] > R) {  // bottom right
                let dx = px - (this._w - this._c[2]);
                let dy = py - (this._h - this._c[2]);
                let off = dx > 0 && dy > 0 && dx * dx + dy * dy > this._c[2] * this._c[2];
                if (off) return 0;
            }
            if (this._c[3] > R) {  // bottom left
                let dx = px - this._c[3];
                let dy = py - (this._h - this._c[3]);
                let off = dx < 0 && dy > 0 && dx * dx + dy * dy > this._c[3] * this._c[3];
                if (off) return 0;
            }
            return 1;
        }
        return 0;
    }

    /** @hidden */
    _minControlSize() { return null; }

    /** @hidden */
    _updateControlVisual(): void { }

    /** @hidden */
    _handleMouse(e: MouseEvent): boolean { return true; };

    /** @hidden */
    _handleKey(e: KeyboardEvent): boolean { return true; };

    /** @hidden */
    _handleTouch(e: TouchEvent) { }

    /** @hidden */
    _processEvent(e: any, ...info) { }

    /**
     * <p>This method ensures we have a buffer of the correct size for the control</p>
     * @hidden
     */
    _validateBuffer() {
        let b = this._buffer;
        if (b.width != this._w || b.height != this._h) {
            this._buffer = this._p.createGraphics(this._w, this._h);
            this.invalidateBuffer(); // Force a redraw of the buffer
        }
        if (this._bufferInvalid) {
            this._updateControlVisual();
            this._bufferInvalid = false;
        }
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

    /** @hidden */
    _renderWEBGL() {
        this._validateBuffer();
        let p = this._p;
        p.push();
        p.noStroke(); // Fix for p5.js 1.6.0
        p.translate(this._x, this._y);
        if (this._visible)
            this._orientation._renderWEBGL(p, this._w, this._h, this._buffer);
        // Display children
        for (let c of this._children)
            if (c._visible) c._renderWEBGL();
        p.pop();
    }

    /** @hidden */
    _renderP2D() {
        this._validateBuffer();
        let p = this._p;
        p.push();
        p.translate(this._x, this._y);
        if (this._visible)
            this._orientation._renderP2D(p, this._w, this._h, this._buffer);
        // Display children
        for (let c of this._children)
            if (c._visible) c._renderP2D();
        p.pop();
    }

    /** @hidden */
    protected _disable_hightlight(b, cs, x, y, w, h) {
        b.fill(cs['T_5']);
        b.noStroke();
        b.rect(x, y, w, h, this._c[0], this._c[1], this._c[2], this._c[3]);
    }

    /** @hidden */
    _eq(a: number, b: number): boolean {
        return Math.abs(a - b) < 0.001;
    }

    /** @hidden */
    _neq(a: number, b: number): boolean {
        return Math.abs(a - b) >= 0.001;
    }

    /** @hidden */
    z(): number {
        return this._Z;
    }

    /** @hidden */
    x(): number {
        return this._x;
    }

    /** @hidden */
    y(): number {
        return this._y;
    }

    /** @hidden */
    w(): number {
        return this._w;
    }

    /** @hidden */
    h(): number {
        return this._h;
    }

    /** @hidden */
    over(): number {
        return this._over;
    }

    /** @hidden */
    pover(): number {
        return this._pover;
    }

    /** @hidden */
    orientation(): OrientNorth | OrientSouth | OrientEast | OrientWest {
        return this._orientation;
    }

}


/** 
 * Mixin for initialising mouse event data
 * @hidden
 */
const processMouse = {
    /** @hidden */
    _handleMouse(e: MouseEvent) { //    CvsSlider
        let pos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(
            this._p.mouseX - pos.x, this._p.mouseY - pos.y, this._w, this._h);
        this._pover = this._over;                 // Store previous mouse over state
        this._over = this._whereOver(mx, my);     // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx, my, w, h);
        return false;
    }
}

/** 
 * Mixin for initialising touch event data
 * @hidden
 */
const processTouch = {
    /** @hidden */
    _handleTouch(e: TouchEvent) {
        e.preventDefault();
        let pos = this.getAbsXY();
        const rect = this._gui._canvas.getBoundingClientRect();
        const t = e.changedTouches[0];
        let [mx, my, w, h] = this._orientation.xy(
            t.clientX - rect.left - pos.x, t.clientY - rect.top - pos.y,
            this._w, this._h);
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my, 5); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx, my, w, h);
    }
}