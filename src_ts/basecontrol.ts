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
 The base class for controls and panes that don't require a graphics buffer.
 ##############################################################################
 */

/**
 * <p>Base class for all controls</p>
 * <p>It provides most of the functionality for the controls.</p>
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
    /** @hidden */ protected _id: string;
    /** @hidden */ protected _children: Array<any> = [];
    /** @hidden */ protected _parent: CvsBaseControl;
    /** @hidden */ protected _visible: boolean = true;
    /** @hidden */ protected _enabled: boolean = true;
    /** @hidden */ protected _z: number = 0;
    /** @hidden */ protected _x: number = 0;
    /** @hidden */ protected _y: number = 0;
    /** @hidden */ protected _w: number = 0;
    /** @hidden */ protected _h: number = 0;
    /** @hidden */ protected _orientation: OrientNorth | OrientSouth | OrientEast | OrientWest;
    /** @hidden */ protected _dragging: boolean;
    /** @hidden */ protected _over: number = 0;
    /** @hidden */ protected _pover: number = 0;
    /** @hidden */ protected _active: boolean = false;
    /** @hidden */ protected _clickAllowed: boolean = false;
    /** @hidden */ protected _c: Array<number>;
    /** @hidden */ protected _opaque: boolean = true;;
    /** @hidden */ protected _scheme: BaseScheme;
    /** @hidden */ protected _bufferInvalid: boolean = true;

    /** 
     * <p>The event handler for this control. Although it is permitted to set 
     * this property directly it is recommended that the <code>setAction(...)</code>
     * method is used to define the event handler actions.</p> 
     * @hidden
     */
    action: Function = function () { };

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
    constructor(gui: GUI, id: string, x: number, y: number, w: number, h: number) {
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

    /** the unique identifier for this control   */
    get id() { return this._id; }

    /** name of the control type. */
    get type() { return this.constructor.name.substring(3); };

    /**
     * A control becomes active when the mouse button is pressed over it.
     * This method has little practical use except when debugging.
     * @hidden
     * @returns true if this control is expecting more mouse events
     */
    get isActive() { return this._active }
    /** @hidden */
    set isActive(b) { this._active = b }

    /**
     * Move control to an absolute position
     * @param x horizontal position
     * @param y vertical position
     * @returns this control
     */
    moveTo(x: number, y: number) {
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
    moveBy(x: number, y: number) {
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
    parent(parent: CvsBaseControl | string, rx?: number, ry?: number): CvsBaseControl {
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
    addChild(c: CvsBaseControl | string, rx?: number, ry?: number): any {
        let control = this._gui.$(c);
        rx = !Number.isFinite(rx) ? control.x : Number(rx);
        ry = !Number.isFinite(ry) ? control.y : Number(ry);
        // If the control already has a parent remove it ready for new parent.
        if (!control._parent) control.leaveParent();
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
        this._gui.setRenderOrder();
        return this;
    }

    /**
     * <p>Remove this control from its parent</p>
     * @returns this control
     */
    leaveParent(): CvsBaseControl {
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
    setAction(event_handler: Function) {
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

    /** @hidden */
    _minControlSize() { return null; }

    /** @hidden */
    _updateControlVisual(): void { }

    /** @hidden */
    _doEvent(e: MouseEvent | TouchEvent, x = 0, y = 0, over: any, enter: boolean): CvsBaseControl { return this; }

    /** @hidden */
    _doKeyEvent(e: KeyboardEvent) { return this; }

    /**
     * @param uib ui overlay buffer
     * @param pkb picker buffer
     * @hidden
     */
    _draw(uib = null, pkb = null) { }

    /** @hidden */
    _eq(a: number, b: number): boolean {
        return Math.abs(a - b) < 0.001;
    }

    /** @hidden */
    _neq(a: number, b: number): boolean {
        return Math.abs(a - b) >= 0.001;
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

const NoOrient = {
    /** This control does not support changing orientation */
    orient(dir: string): CvsBaseControl {
        CWARN(`Orientation cannot be changed for controls of type '${this.type}'.`);
        return this;
    }
}

const NoParent = {
    /** This control does not support changing orientation */
    parent(parent: CvsBaseControl | string, rx?: number, ry?: number): CvsBaseControl {
        CWARN(`Controls of type '${this.type}' cannot have a parent.`);
        return this;
    }
}

/** @hidden */
const NoTooltip = {
    /** @hidden */
    tooltip(dir: string): CvsBaseControl {
        CWARN(`Controls of type '${this.type}' cannot have tooltips.`);
        return this;
    },
    /** @hidden */
    tipTextSize(dir: string): CvsBaseControl {
        CWARN(`Controls of type '${this.type}' cannot have tooltips.`);
        return this;
    }
}

/** @hidden */
const FixedBackground = {
    /** @hidden */
    orient(dir: string): CvsBaseControl {
        CWARN(`Controls of type '${this.type}' do not support 'transparent' and 'opaque' methods.`);
        return this;
    }
}