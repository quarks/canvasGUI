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
 * <p>This class provides most of the core functionality for the canvasGUI 
 * controls.</p>
 */
abstract class CvsBaseControl {

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
    /** @hidden */ protected _corners: Array<number>;
    /** @hidden */ protected _dragging: boolean;
    /** @hidden */ protected _isOver: boolean = false;
    /** @hidden */ protected _active: boolean = false;
    /** @hidden */ protected _alpha: number = 255;
    /** @hidden */ protected _clickAllowed: boolean = false;
    /** @hidden */ protected _opaque: boolean = true;
    /** @hidden */ protected _scheme: ColorScheme;
    /** @hidden */ protected _bufferInvalid: boolean = true;
    /** @hidden */ protected _tooltip: CvsTooltip = undefined;


    /** 
     * <p>The event handler for this control. Although it is permitted to set this
     * property directly it is recommended that the <code>setAction(...)</code>
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
    get type() { return this.constructor.name.substring(3); };

    /**
     * <p>This is true if the control can respond to UI events else false.</p>
     * <p>Use <code>enable()</code> and <code>disable()</code> to enable and disable it.</p>
     */
    get isEnabled() { return this._enabled; }

    /** 
     * <p>This is true if the control background is opaque else false.</p>
     * <p>Use <code>opaque()</code> and <code>transparent()</code> display / hide the background.</p>
     */
    get isOpaque() { return this._opaque; }

    /** 
     * <p>This is true if the control is visible else false.</p>
     * <p>Use <code>hide()</code> and <code>show()</code> to set visibility.</p>
     */
    get isVisible() { return this._visible; }

    /**
     * A control becomes active when the mouse button is pressed over it.
     * This method has little practical use except when debugging.
     * @returns true if this control is expecting more mouse events
     * @hidden
     */
    get isActive() { return this._active }

    /** @hidden */
    get isOver() { return this._isOver }
    /** @hidden */
    set isOver(b) {
        if (b != this._isOver) {
            this._isOver = b;
            this.invalidateBuffer();
        }
    }

    /** @hidden */
    get CNRS(): Array<number> { return this._corners || this._gui._corners; }
    /** @hidden */
    get SCHEME(): ColorScheme { return this._scheme || this._gui._scheme; }


    /**
     * Move this control to an absolute position.
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
     * Move this control relative to current position.
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
     * any ancestors.</p>
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
     * <p>If the name of a valid color scheme is provided then it will use it
     * to display the control, non-existant scheme names will be ignored. In 
     * both cases this control is returned.</p>
     * <p>If there is no parameter it returns the name of the current color 
     * scheme used by this control.</p>
     * @param name the color scheme name e.g. 'blue'
     * @param cascade if true propogate scheme to all child controls.
     * @returns this control or the control's color scheme
     */
    scheme(name?: string, cascade?: boolean): ColorScheme | CvsBaseControl {
        if (name) {  // setter
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
    corners(...c: any): Array<number> | CvsBaseControl {
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
     * <p>Remove a child control from this one so that it stays in same screen position.</p>
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
    setAction(event_handler: Function) {
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
    orient(dir: string = 'east'): CvsBaseControl {
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
    tooltip(tiptext: string) {
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
    tipTextSize(tsize?: number) {
        if (this._tooltip && tsize && tsize > 0)
            this._tooltip.textSize(tsize);
        return this;
    }

    /**
     * <p>Enables this control.</p>
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
     * <p>Disables this control.</p>
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
     * <p>Make this control visible.</p>
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
     * <p>Make this control invisible.</p>
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
     * <p>Makes the controls background opaque. The actual color depends 
     * on the controls color scheme.</p>
     * <p>The second parameter, alpha, is optional and controls the level 
     * of opaqueness from 0 - transparent to 255 - fully opaque 
     * (efault value).</p>
     * 
     * @param alpha alpha value for controls background color.
     * @returns this control
     */
    opaque(alpha: number = 255): CvsBaseControl {
        this._alpha = Math.floor((alpha < 0 ? 0 : alpha > 255 ? 255 : alpha));
        this._opaque = true;
        this.invalidateBuffer();
        return this;
    }

    /**
     * <p>Makes the controls background fully transparent.</p>
     * @returns this control
     */
    transparent(): CvsBaseControl {
        this._opaque = false;
        this.invalidateBuffer();
        return this;
    }

    /** @hidden */
    orientation(): OrientNorth | OrientSouth | OrientEast | OrientWest {
        return this._orientation;
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

}
