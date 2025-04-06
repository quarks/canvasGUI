/** <p>Object type  \{ x: number; y: number; \} </p> */
interface __Position { x: number; y: number; }
/** <p>Object type  \{ w: number; h: number; \} </p> @hidden */
interface __Box { w: number; h: number; }
/** <p>Object type  \{ low: number; high: number; \} </p>  */
interface __Range { low: number; high: number; }
/** <p>Defines the event information sent to the event handler.</p> @hidden */
//interface __EventInfo { source: CvsBaseControl; type: string; }
/** <p>Defines an overlap</p> @hidden */
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
    /** @hidden */ protected _parent: CvsBaseControl | CvsPane;
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
    /** @hidden */ protected _scheme: __Scheme = undefined;
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
     * @param id 
     * @param cascade 
     * @returns this control or the control's color scheme
     */
    scheme(id?: string, cascade?: boolean): CvsBaseControl | __Scheme {
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
                //control.xy(pos.x, pos.y);
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
     * A control becomes active when the mous btton is pressed over it.
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
    _minControlSize(): __Box { return null; }

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
        b.fill(cs['TINT_4']);
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


/*
##############################################################################
 CvsBufferedControl
 This is the base class for all visual controls that require a graphic buffer
 ##############################################################################
 */

/**
 * <p>This is the base class for all visual controls that require a graphic buffer.</p>
 */
abstract class CvsBufferedControl extends CvsBaseControl {

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
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x, y, w, h);
        this._buffer = this._p.createGraphics(this._w, this._h);
        this._tooltip = undefined;
    }

    /**
     * <p>Set or get the corner radii used for this control</p>
     * @param c an array of 4 corner radii
     * @returns an array with the 4 corner radii
     */
    corners(c: Array<number>): Array<number> | CvsBaseControl {
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
    tooltip(tiptext: string, duration: number) {
        let tt = this._gui.__tooltip(this._name + '.tooltip')
            .text(tiptext)
            .showTime(duration || 1600)
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
    tipTextSize(tsize?: number) {
        if (this._tooltip && tsize && tsize > 0)
            this._tooltip.textSize(tsize);
        return this;
    }

}

/**
 * <p>This class represents a horizontal slider with a draggable thumb to 
 * define a value within user defined limits.</p>
 * <p>Major and minor tick marks can be added to the bar and supports 
 * stick-to-ticks if wanted.</p>
 */
class CvsSlider extends CvsBufferedControl {
    protected _t01: number;
    protected _limit0: number;
    protected _limit1: number;
    protected _majorTicks: number;
    protected _minorTicks: number;
    protected _s2ticks: boolean;

    /**
     * @hidden
     * @param gui the gui controller
     * @param name unique name for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x || 0, y || 0, w || 100, h || 20);
        this._t01 = 0.5;
        this._limit0 = 0;
        this._limit1 = 1;
        this._majorTicks = 0;
        this._minorTicks = 0;
        this._s2ticks = false;
        this._opaque = false;
    }

    /**
     * Set the lower and upper limits for the slider
     *
     * @param l0 lower limit
     * @param l1 upper limit
     * @returns this slider object
     */
    limits(l0: number, l1: number): CvsSlider {
        if (Number.isFinite(l0) && Number.isFinite(l1)) {
            this._limit0 = l0;
            this._limit1 = l1;
        }
        return this;
    }

    /**
     * 
     * @param value scale value to test
     * @returns true if the value lies within the slider's limits else false
     */
    isValid(value: number): boolean {
        return (Number.isFinite(value)
            && (value - this._limit0) * (value - this._limit1) <= 0);
    }

    /**
     * <p>The track can be divided up into a number of domains separated with major ticks. The
     * major domains and be further divided into subdomains separated with minor ticks. If the
     * final parameter is true then values retqurned by the slider are consrained to the 
     * tick values.</p>
     * @param {number} major the number of major domains on the track
     * @param {number} minor the number of minor domains  between major ticks
     * @param {boolean} stick2ticks slider value is constrainged to tick values
     * @returns {CvsBaseControl} this slider object
     */
    ticks(major: number, minor: number, stick2ticks?: boolean): CvsBaseControl {
        this._majorTicks = major;
        this._minorTicks = minor;
        this._s2ticks = Boolean(stick2ticks);
        return this;
    }

    /**
     * If the parameter value is withing the slider limits it will move the thumb
     * to the appropriate position. If no parameter is passed or is outside the 
     * limits this methods returns the current slider value.
     * @param value the selected value to be set 
     * @returns the current value or this slider object
     */
    value(value?: number): CvsBaseControl | number {
        if (Number.isFinite(value)) {
            if ((value - this._limit0) * (value - this._limit1) <= 0) {
                this.invalidateBuffer();
                this._t01 = this._norm01(value);
                return this;
            }
        }
        return this._t2v(this._t01);
    }

    /**
     * <p>Converts parametic value to user value</p>
     * @hidden
     * @param t parametric value
     * @returns the correspoding value
     */
    protected _t2v(t: number): number {
        return this._limit0 + t * (this._limit1 - this._limit0);
    }

    /**
     * <p>Converts parametic value to user value</p>
     * @hidden
     * @param v value
     * @returns the correspoding parametric value
     */
    protected _v2t(v: number): number {
        return (v - this._limit0) / (this._limit1 - this._limit0);
    }

    /**
     * <p>get the parametic value t for a given value, whwre v can be any value
     * and not constrained to the slider limits. The result is constrained to the
     * range &ge;0 and &lt;1</p>
     * @hidden
     * @param v user value
     * @param l0 lower limit
     * @param l1 upper limit
     * @returns parametric value in range &ge;0 and &lt;1
     */
    _norm01(v: number, l0 = this._limit0, l1 = this._limit1): number {
        return this._p.constrain(this._p.map(v, l0, l1, 0, 1), 0, 1);
    }

    /**
     * <p>See if the position [px, py] is over the control.</p> 
     * @hidden
     * @param px horizontal position
     * @param py vertical position
     * @param tol tolerance in pixels
     * @returns 0 if not over the control of &ge;1
     */
    _whereOver(px: number, py: number, tol = 8): number {
        px -= 10; // Adjust mouse to start of track
        let ty = this._buffer.height / 2;
        let tx = this._t01 * (this._buffer.width - 20);
        if (Math.abs(tx - px) <= tol && Math.abs(py - ty) <= tol) {
            return 1;
        }
        return 0;
    }

    /** @hidden */
    _handleMouse(e: MouseEvent) { //    CvsSlider
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x;
        let my = this._p.mouseY - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x; my = r.y;
        this._pover = this._over;                 // Store previous mouse over state
        this._over = this._whereOver(mx, my);     // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx);
        return false;
    }

    /** @hidden */
    _handleTouch(e: TouchEvent) {
        e.preventDefault();
        let pos = this.getAbsXY();
        const rect = this._gui._canvas.getBoundingClientRect();
        const t = e.changedTouches[0];
        let mx = t.clientX - rect.left - pos.x;
        let my = t.clientY - rect.top - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x; my = r.y;
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my, 20); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx);
    }

    /** @hidden */
    _processEvent(e: any, ...info) {
        let mx = info[0];
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (this._over > 0) {
                    this._active = true;
                    this.invalidateBuffer();
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this._active) {
                    this.action({ source: this, p5Event: e, value: this.value(), final: true });
                    this._active = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this._active) {
                    let t01 = this._norm01(mx - 10, 0, this._buffer.width - 20);
                    if (this._s2ticks)
                        t01 = this._nearestTickT(t01);
                    if (this._t01 != t01) {
                        this._t01 = t01;
                        this.action({ source: this, p5Event: e, value: this.value(), final: false });
                    }
                    this.invalidateBuffer();
                }
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
    }
    /** 
     * For a given value p01 find the value at the nearest tick
     * @hidden 
     */
    _nearestTickT(p01: number): number {
        let nbrTicks = this._minorTicks > 0
            ? this._minorTicks * this._majorTicks : this._majorTicks;
        return (nbrTicks > 0) ? Math.round(p01 * nbrTicks) / nbrTicks : p01;
    }

    /** @hidden */
    _updateControlVisual(): void { // CvsSlider
        let b = this._buffer;
        let cs = this._scheme || this._gui.scheme();
        let tw = b.width - 20, trackW = 8, thumbSize = 12, majorT = 10, minorT = 7;

        const OPAQUE = cs['COLOR_3'];
        const TICKS = cs['GREY_9'];
        const UNUSED_TRACK = cs['GREY_6'];
        const USED_TRACK = cs['GREY_1'];
        const HIGHLIGHT = cs['COLOR_14'];
        const THUMB = cs['COLOR_10'];

        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke(); b.fill(OPAQUE);
            b.rect(0, 0, this._w, this._h,
                this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Now translate to track left edge - track centre
        b.translate(10, b.height / 2);
        // Now draw ticks
        b.stroke(TICKS); b.strokeWeight(1);
        let n: number, dT: number;
        n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            dT = tw / n;
            for (let i = 0; i <= n; i++) { // minor ticks
                let tx = i * dT;
                b.line(tx, -minorT, tx, minorT);
            }
        }
        n = this._majorTicks;
        if (n >= 2) {
            dT = tw / n; //this._majorTicks
            for (let i = 0; i <= n; i++) {  // major ticks
                let tx = i * dT;
                b.line(tx, -majorT, tx, majorT);
            }
        }
        // draw unused track
        b.fill(UNUSED_TRACK);
        b.rect(0, -trackW / 2, tw, trackW);
        // draw used track
        let tx = tw * this._t01;
        b.fill(USED_TRACK);
        b.rect(0, -trackW / 2, tx, trackW,
            this._c[0], this._c[1], this._c[2], this._c[3]);
        // Draw thumb
        b.fill(THUMB);
        b.noStroke();
        if (this._active || this._over > 0) {
            b.strokeWeight(2);
            b.stroke(HIGHLIGHT);
        }
        b.rect(tx - thumbSize / 2, -thumbSize / 2, thumbSize, thumbSize,
            this._c[0], this._c[1], this._c[2], this._c[3]);
        if (!this._enabled) this._disable_hightlight(b, cs, 0, -this._h / 2, this._w - 20, this._h);
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */
    _minControlSize() {
        return { w: this._w, h: 20 };
    }

}


/**
 * <p>This class represents a slider with 2 draggable thumbs to 
 * define a value within user defined limits.</p>
 * <p>Major and minor tick marks can be added to the bar and supports 
 * stick-to-ticks if wanted.</p>
 */
class CvsRanger extends CvsSlider {

    /** @hidden */ protected _t: Array<number> = [0.25, 0.75];
    /** @hidden */ protected _tIdx: number = -1;

    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x || 0, y || 0, w || 100, h || 20);
        this._t = [0.25, 0.75];
        this._tIdx = -1;
        this._limit0 = 0;
        this._limit1 = 1;
        this._opaque = false;
    }

    /**
     * <p>Sets or gets the low and high values for this control. If both parameters
     * and within the rangers limits then they are used to set the low and high
     * values of the ranger and move the thumbs to the correct postion.</p>
     * <p>If one or both parameters are invalid then they are ignored and the method 
     * returns the current range low and high values.</p>
     * @param v0 low value
     * @param v1 high value
     * @returns this control or the low/high values
     */
    range(v0?: number, v1?: number): CvsBaseControl | __Range {
        // if (!v0 || !v1)
        //   return { low: this._t2v(this._t[0]), high: this._t2v(this._t[1]) };
        if (Number.isFinite(v0) && Number.isFinite(v1)) { // If two numbers then
            let t0 = this._norm01(Math.min(v0, v1));
            let t1 = this._norm01(Math.max(v0, v1));
            if (t0 >= 0 && t0 <= 1 && t1 >= 0 && t1 <= 1) {
                this._bufferInvalid = (this._t[0] != t0) || (this._t[1] != t1);
                this._t[0] = t0; this._t[1] = t1;
                return this;
            }
        }
        // Invalid parameters
        return { low: this._t2v(this._t[0]), high: this._t2v(this._t[1]) };
    }

    /**
     * @returns the low value of the range
     */
    low(): number {
        return this._t2v(this._t[0]);
    }

    /**
     * @returns the high value of the range
     */
    high(): number {
        return this._t2v(this._t[1]);
    }


    /** @hidden */
    value(v?: number): number | CvsBaseControl {
        console.warn('Ranger controls require 2 values - use range(v0, v1) instead');
        return undefined;
    }

    /** @hidden */
    _whereOver(px: number, py: number, tol = 8): number {
        // Check vertical position  
        let ty = this._buffer.height / 2;
        if (Math.abs(py - ty) <= 8) {
            let tw = this._buffer.width - 20;
            let t = this._t;
            px -= 10;
            if (Math.abs(t[0] * tw - px) <= tol)
                return 1;
            if (Math.abs(t[1] * tw - px) <= tol)
                return 2;
        }
        return 0
    }

    /** @hidden */
    _handleMouse(e: MouseEvent) { //    CvsRanger
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x;
        let my = this._p.mouseY - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x; my = r.y;
        this._pover = this._over;                 // Store previous mouse over state
        this._over = this._whereOver(mx, my);     // Store current mouse over state
        // If this control is active remember the thumb that was pressed
        // otherwise check the current position
        this._tIdx = this._active ? this._tIdx : this._over - 1;
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx);
        return false;
    }

    /** @hidden */
    _handleTouch(e: TouchEvent) {
        e.preventDefault();
        let pos = this.getAbsXY();
        const rect = this._gui._canvas.getBoundingClientRect();
        const t = e.changedTouches[0];
        let mx = t.clientX - rect.left - pos.x;
        let my = t.clientY - rect.top - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x; my = r.y;
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my, 20); // Store current mouse over state
        this._tIdx = this._active ? this._tIdx : this._over - 1;
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx);
    }

    /** @hidden */
    _processEvent(e: any, ...info) {
        let mx = info[0];
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (this._over > 0) {
                    this._active = true;
                    this._tIdx = this._over - 1;  // Which thumb is the mouse over
                    this.invalidateBuffer();
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this._active) {
                    let t0 = Math.min(this._t[0], this._t[1]);
                    let t1 = Math.max(this._t[0], this._t[1]);
                    this._t[0] = t0; this._t[1] = t1; this._tIdx = -1;
                    this.action({
                        source: this, p5Event: e, low: this._t2v(t0), high: this._t2v(t1), final: true
                    });
                    this._active = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this._active) {
                    let t01 = this._norm01(mx - 10, 0, this._buffer.width - 20);
                    if (this._s2ticks)
                        t01 = this._nearestTickT(t01);
                    if (this._t[this._tIdx] != t01) {
                        this._t[this._tIdx] = t01;
                        let t0 = Math.min(this._t[0], this._t[1]);
                        let t1 = Math.max(this._t[0], this._t[1]);
                        this.action({
                            source: this, p5Event: e, low: this._t2v(t0), high: this._t2v(t1), final: false
                        });
                    }
                    this.invalidateBuffer();
                }
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
    }
    /** @hidden */
    _updateControlVisual() { // CvsRanger
        let b = this._buffer;
        let cs = this._scheme || this._gui.scheme();
        let tw = b.width - 20;
        let trackW = 8, thumbSize = 12, majorT = 10, minorT = 7;

        const OPAQUE = cs['COLOR_3'];
        const TICKS = cs['GREY_9'];
        const UNUSED_TRACK = cs['GREY_6'];
        const USED_TRACK = cs['GREY_1'];
        const HIGHLIGHT = cs['COLOR_14'];
        const THUMB = cs['COLOR_10'];

        b.push();
        b.clear();
        // Backkground
        if (this._opaque) {
            b.noStroke(); b.fill(OPAQUE);
            b.rect(0, 0, this._w, this._h,
                this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Now translate to track left edge - track centre
        b.translate(10, b.height / 2);
        // Now draw ticks
        b.stroke(TICKS);
        b.strokeWeight(1);
        let n, dT;
        n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            dT = tw / n;
            for (let i = 0; i <= n; i++) { // minor ticks
                let tx = i * dT;
                b.line(tx, -minorT, tx, minorT);
            }
        }
        n = this._majorTicks;
        if (n >= 2) {
            dT = tw / this._majorTicks;
            for (let i = 0; i <= n; i++) {  // major ticks
                let tx = i * dT;
                b.line(tx, -majorT, tx, majorT);
            }
        }
        // draw unused track
        b.fill(UNUSED_TRACK);
        b.rect(0, -trackW / 2, tw, trackW);
        // draw used track
        let tx0 = tw * Math.min(this._t[0], this._t[1]);
        let tx1 = tw * Math.max(this._t[0], this._t[1]);
        b.fill(USED_TRACK);
        b.rect(tx0, -trackW / 2, tx1 - tx0, trackW,
            this._c[0], this._c[1], this._c[2], this._c[3]);
        // Draw thumb
        for (let tnbr = 0; tnbr < 2; tnbr++) {
            b.fill(THUMB);
            b.noStroke();
            if ((this._active || this._over > 0) && tnbr == this._tIdx) {
                b.strokeWeight(2);
                b.stroke(HIGHLIGHT);
            }
            b.rect(this._t[tnbr] * tw - thumbSize / 2, -thumbSize / 2, thumbSize, thumbSize,
                this._c[0], this._c[1], this._c[2], this._c[3]);
        }

        if (!this._enabled) this._disable_hightlight(b, cs, 0, -this._h / 2, this._w - 20, this._h);
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }
}


/**
 * </p>The base class for any control that displays text as part of its 
 * visual interface</p>
 * 
 */
abstract class CvsText extends CvsBufferedControl {

    /** @hidden */ protected _lines: Array<string> = [];
    /** @hidden */ protected _textSize: number = undefined;
    /** @hidden */ protected _textAlign: number = this._p.CENTER;
    /** @hidden */ protected _tbox: __Box = { w: 0, h: 0 };
    /** @hidden */ protected _gap: number = 2;

    /** @hidden */
    constructor(gui: GUI, name: string, x?: number, y?: number, w?: number, h?: number) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
    }

    /**
     * <p>Gets or sets the current text.</p>
     * <p>Processing constants are used to define the alignment.</p>
     * @param t the text to display
     * @param align LEFT, CENTER or RIGHT
     * @returns this control or the existing text
     */
    text(t?: string | Array<string>, align?: number): string | CvsBaseControl {
        // getter
        if (t == null || t == undefined)
            return this._lines.join('\n');
        //setter
        if (Array.isArray(t))
            this._lines = t.map(x => x.toString());
        else {
            let lines = t.toString().split('\n');
            this._lines = lines.map(x => x.toString());
        }
        this.textAlign(align);
        // If necessary expand the control to surround text
        let s = this._minControlSize();
        //console.log(`'${this.name()}'   Size: ${this._w} x ${this._y}   Min size: ${s.w} x ${s.h}`)
        this._w = Math.max(this._w, s.w);
        this._h = Math.max(this._h, s.h);
        this.invalidateBuffer();
        return this;
    }

    /**
     * <p>Sets the text alignment.</p>
     * <p>Processing constants are used to define the text alignment.</p>
     * @param align LEFT, CENTER or RIGHT
     * @returns this control
     */
    textAlign(align: number): CvsBaseControl {
        if (align && (align == this._p.LEFT || align == this._p.CENTER || align == this._p.RIGHT)) {
            this._textAlign = align;
            this.invalidateBuffer();
        }
        return this;
    }

    /**
     * <p>Renoves any text that the control might use ti  display itself.</p>
     * 
     * @returns this control
     */
    noText(): CvsBaseControl {
        this._lines = [];
        this._tbox = { w: 0, h: 0 };
        this.invalidateBuffer();
        return this;
    }

    /**
     * <p>Sets or gets the text size.</p>
     * @param lts the text size to use
     * @returns this control or the current text size
     */
    textSize(lts: number) {
        let ts = this._textSize || this._gui.textSize();
        // getter
        if (!Number.isFinite(lts)) return ts;
        // setter
        lts = Number(lts);
        if (lts != ts) {
            this._textSize = lts;
            // If necessary expand the control to surrond text
            let s = this._minControlSize();
            this._w = Math.max(this._w, s.w);
            this._h = Math.max(this._h, s.h);
            this.invalidateBuffer();
        }
        return this;
    }

    /** @hidden */
    _minControlSize() {
        let b = this._buffer;
        let lines = this._lines;
        let ts = this._textSize || this._gui.textSize();
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
        // Calculate minimum length and height of are to hold
        // multiple lines of text
        if (lines.length > 0) {
            if (!b) this._validateBuffer();
            b.textSize(ts);
            tbox.w = ts + lines.map(t => b.textWidth(t)).reduce((x, y) => (x > y) ? x : y);
            tbox.h = (lines.length - 1) * b.textLeading(); // + b.textAscent() + b.textDescent(); fix for 0.9.3
            gap += this._gap;
        }
        sw += tbox.w + gap;
        sh = Math.max(tbox.h, sh) + 2 * gap;
        return { w: sw, h: sh };
    }

}


/**
 * <p>This class enables icons to be added to any text control.</p>
 * 
 */
abstract class CvsTextIcon extends CvsText {

    /** @hidden */ protected _icon: p5.Graphics;
    /** @hidden */ protected _iconAlign: number;

    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
        this._icon = undefined;
        this._iconAlign = this._p.LEFT;
    }

    /**
     * <p>Gets or sets the icon and its alignment relative to any text in the control.</p>
     * <p>Processing constants are used to define the icon alignment.</p>
     * @param i the icon to use for this control
     * @param align LEFT or RIGHT
     * @returns this control or the current icon
     */
    icon(i: p5.Graphics, align?: number): p5.Graphics | CvsBaseControl {
        // getter
        if (!i)
            return this._icon;
        //setter    
        this._icon = i;
        if (align && (align == this._p.LEFT || align == this._p.RIGHT))
            this._iconAlign = align;
        // If necessary expand the control to surrond text and icon 
        let s = this._minControlSize();
        this._w = Math.max(this._w, s.w);
        this._h = Math.max(this._h, s.h);
        this.invalidateBuffer();
        return this;
    }

    /**
     * <p>Sets the icon alignment relative to the text.</p>
     * <p>Processing constants are used to define the text alignment.</p>   
     * @param align LEFT or RIGHT
     * @returns this control
     */
    iconAlign(align: number) {
        if (align && (align == this._p.LEFT || align == this._p.RIGHT)) {
            this._iconAlign = align;
            // If necessary expand the control to surrond text and icon 
            let s = this._minControlSize();
            this._w = Math.max(this._w, s.w);
            this._h = Math.max(this._h, s.h);
            this.invalidateBuffer();
        }
        return this;
    }

    /**
     * 
     * @returns this control
     */
    noIcon() {
        if (this._icon) {
            this._icon = undefined;
            this.invalidateBuffer();
        }
        return this;
    }

    /** @hidden */
    _minControlSize() {
        let b = this._buffer;
        let lines = this._lines;
        let icon = this._icon;
        let ts = this._textSize || this._gui.textSize();
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
        if (icon) {
            sw = icon.width;
            sh = icon.height;
            gap += this._gap;
        }
        // Calculate minimum length and height of are to hold
        // multiple lines of text
        if (lines.length > 0) {
            if (!b) this._validateBuffer();
            b.textSize(ts);
            tbox.w = ts + lines.map(t => b.textWidth(t)).reduce((x, y) => (x > y) ? x : y);
            tbox.h = (lines.length - 1) * b.textLeading() + b.textAscent() + b.textDescent();
            gap += this._gap;
        }
        sw += tbox.w + gap;
        sh = Math.max(this._tbox.h, sh) + gap;
        return { w: sw, h: sh };
    }
}

/**
 * <p>This class is to create simple buttons with text and / or icons on its face.</p>
 */
class CvsButton extends CvsTextIcon {

    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
    }

    /** @hidden */
    _updateControlVisual() { // CvsButton
        let ts = this._textSize || this._gui.textSize();
        let cs = this._scheme || this._gui.scheme();
        let b = this._buffer;
        let icon = this._icon;
        let iconAlign = this._iconAlign;
        let textAlign = this._textAlign;
        let lines = this._lines;
        let gap = this._gap;

        let BACK = cs['COLOR_4'];
        let FORE = cs['COLOR_13'];
        let HIGHLIGHT = cs['COLOR_14'];

        b.push();
        b.clear();
        // Backkground
        if (this._opaque) {
            b.noStroke(); b.fill(BACK);
            b.rect(1, 1, this._w - 1, this._h - 1,
                this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (icon) {
            let px = 0, py;
            switch (iconAlign) {
                case this._p.LEFT: px = gap; break;
                case this._p.RIGHT: px = this._w - icon.width - gap; break;
            }
            if (lines.length == 0) // no text so center icon
                px = (this._w - icon.width) / 2;
            py = (this._h - icon.height) / 2;
            b.image(this._icon, px, py);
        }
        if (lines.length > 0) {
            b.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            if (icon && iconAlign == this._p.LEFT) x0 += icon.width;
            if (icon && iconAlign == this._p.RIGHT) x1 -= icon.width;
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = b.textAscent() + (this._h - th) / 2;
            b.fill(FORE);
            for (let line of lines) {
                switch (textAlign) {
                    case this._p.LEFT: sx = x0; break;
                    case this._p.CENTER: sx = x0 + (tw - b.textWidth(line)) / 2; break;
                    case this._p.RIGHT: sx = x1 - b.textWidth(line) - gap; break;
                }
                b.text(line, sx, py);
                py += b.textLeading();
            }
        }
        // Mouse over highlight
        if (this._over > 0) {
            b.stroke(HIGHLIGHT);
            b.strokeWeight(2);
            b.noFill();
            b.rect(1, 1, this._w - 2, this._h - 2,
                this._c[0], this._c[1], this._c[2], this._c[3])
        }
        // Control disabled highlight
        if (!this._enabled)
            this._disable_hightlight(b, cs, 0, 0, this._w, this._h);
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
        // Finally if this is a Pane tab then we need to validate the tabs
        if (this._parent instanceof CvsPane) // && this._parent.validateTabs)
            this._parent.validateTabs();
    }

    /** @hidden */
    _handleMouse(e: MouseEvent) { // button
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x;
        let my = this._p.mouseY - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x;
        my = r.y;
        this._pover = this._over;                 // Store previous mouse over state
        this._over = this._whereOver(mx, my);     // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e);
        return false;
    }

    /** @hidden */
    _handleTouch(e: TouchEvent) {
        // e.preventDefault();
        let pos = this.getAbsXY();
        const rect = this._gui._canvas.getBoundingClientRect();
        const t = e.changedTouches[0];
        let mx = t.clientX - rect.left - pos.x;
        let my = t.clientY - rect.top - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x; my = r.y;
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e);
    }

    /** @hidden */
    _processEvent(e) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (this._over > 0) {
                    // _clickAllowed is set to false if mouse moves
                    this._clickAllowed = true;
                    this._dragging = true;
                    this._active = true;
                    this.invalidateBuffer();
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this._active) {
                    if (this._clickAllowed) {
                        this.action({ source: this, p5Event: e });
                    }
                    this._over = 0;
                    this._clickAllowed = false;
                    this._dragging = false;
                    this._active = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }

    }

}

/**
 * This class supports simple true-false checkbox
 */
class CvsCheckbox extends CvsText {

    protected _selected: boolean;
    protected _iconAlign: number;
    protected _icon: p5.Graphics;

    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x || 0, y || 0, w || 80, h || 18);
        this._selected = false;
        this._iconAlign = this._p.LEFT;
        this._textAlign = this._p.LEFT;
    }

    /**
     * <p>Gets or sets the icon and alignment relative to any text in the control.</p>
     * <p>Processing constants are used to define the icon alignment.</p>
     * @param align LEFT or RIGHT
     * @returns this control or the current icon alignment
     */
    iconAlign(align?: number) {
        if (!align)
            return this._iconAlign;
        if (align == this._p.LEFT || align == this._p.RIGHT) {
            this._iconAlign = align;
            this.invalidateBuffer();
        }
        return this;
    }

    /**
     * <p>Make this checkbox true</p>
     * @returns this control
     */
    select() {
        if (!this._selected) {
            this._selected = true;
            this.invalidateBuffer();
        }
        return this;
    }

    /**
     * <p>Make this checkbox false</p>
     * @returns this control
     */
    deselect() {
        if (this._selected) {
            this._selected = false;
            this.invalidateBuffer();
        }
        return this;
    }

    /**
     * 
     * @returns true if this checkbox is selecetd
     */
    isSelected() {
        return this._selected;
    }

    /** @hidden */
    _handleMouse(e: MouseEvent) { // CvsCheckbox
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x;
        let my = this._p.mouseY - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x;
        my = r.y;
        this._pover = this._over;                 // Store previous mouse over state
        this._over = this._whereOver(mx, my);     // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e);
        return false;
    }

    /** @hidden */
    _handleTouch(e: TouchEvent) {
        // e.preventDefault();
        let pos = this.getAbsXY();
        const rect = this._gui._canvas.getBoundingClientRect();
        const t = e.changedTouches[0];
        let mx = t.clientX - rect.left - pos.x;
        let my = t.clientY - rect.top - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x; my = r.y;
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e);
    }

    /** @hidden */
    _processEvent(e: any, ...info) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (this._over > 0) {
                    // Use these to see if there is movement between mosuseDown and mouseUp
                    this._clickAllowed = true;
                    this._dragging = true;
                    this._active = true;
                    this.invalidateBuffer();
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this._active) {
                    if (this._clickAllowed) {
                        this._selected = !this._selected;
                        this.action({ source: this, p5Event: e, selected: this._selected });
                    }
                    this._over = 0;
                    this._clickAllowed = false;
                    this._dragging = false;
                    this._active = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }

    }
    /** @hidden */
    _updateControlVisual() { //  CvsCheckbox
        let ts = this._textSize || this._gui.textSize();
        let cs = this._scheme || this._gui.scheme();
        let b = this._buffer;
        //let icon = this._icon;
        let iconAlign = this._iconAlign;
        let isize = this._p.constrain(Number(ts) * 0.7, 12, 16);
        let textAlign = this._textAlign;
        let lines = this._lines;
        let gap = this._gap;

        let BACK = cs['COLOR_3'];
        let FORE = cs['COLOR_13'];
        let HIGHLIGHT = cs['COLOR_14'];

        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke(); b.fill(BACK);
            b.rect(0, 0, this._w, this._h,
                this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Start with box and tick
        b.push();
        let px = (iconAlign == this._p.RIGHT) ? this._w - gap - isize / 2 : gap + isize / 2;
        b.translate(px, b.height / 2);
        b.stroke(FORE);
        b.fill(cs['WHITE']);
        b.strokeWeight(1.5);

        b.rect(-isize / 2, -isize / 2, isize, isize, 3);
        if (this._selected) {
            b.stroke(FORE);
            b.strokeWeight(2.5);
            b.line(-0.281 * isize, 0, -0.188 * isize, 0.313 * isize);
            b.line(0.270 * isize, -0.27 * isize, -0.188 * isize, 0.313 * isize);
        }
        b.pop();
        if (lines.length > 0) {
            b.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            if (iconAlign == this._p.LEFT) x0 += isize + gap;
            if (iconAlign == this._p.RIGHT) x1 -= isize + gap;
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = b.textAscent() + (this._h - th) / 2;
            b.fill(FORE);
            for (let line of lines) {
                switch (textAlign) {
                    case this._p.LEFT: sx = x0; break;
                    case this._p.CENTER: sx = x0 + (tw - b.textWidth(line)) / 2; break;
                    case this._p.RIGHT: sx = x1 - b.textWidth(line) - gap; break;
                }
                b.text(line, sx, py);
                py += b.textLeading();
            }
        }
        // Mouse over control
        if (this._over > 0) {
            b.stroke(HIGHLIGHT);
            b.strokeWeight(2);
            b.noFill();
            b.rect(1, 1, this._w - 2, this._h - 2,
                this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (!this._enabled) this._disable_hightlight(b, cs, 0, 0, this._w, this._h);
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */
    _minControlSize() { // CvsCheckbox
        let b = this._buffer;
        let lines = this._lines;
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
        let ts = this._textSize || this._gui.textSize();
        let isize = this._p.constrain(Number(ts) * 0.7, 12, 16);
        // Calculate minimum length and height of are to hold
        // multiple lines of text
        if (lines.length > 0) {
            if (!b) this._validateBuffer();
            let ts = this._textSize || this._gui.textSize();
            b.textSize(ts);
            tbox.w = ts + lines.map(t => b.textWidth(t)).reduce((x, y) => (x > y) ? x : y);
            tbox.h = (lines.length - 1) * b.textLeading() + b.textAscent() + b.textDescent();
            //gap += this._gap;
        }
        sw += tbox.w + gap + isize;
        sh = Math.max(this._tbox.h, isize + gap) + 2 * gap;
        return { w: sw, h: sh };
    }

}


/**
 * <p>The option group manages a group of option buttons where only one can
 * be selected at any time.</p>
 * <p>The user should <i>not</i> create instances of this class because the library 
 * will make them when needed.</p>
 */
class CvsOptionGroup {
    /** @hidden */ protected _name: string;
    /** @hidden */ protected _group: Set<CvsOption>;

    /** @hidden */
    constructor(name: string) {
        this._name = name;
        this._group = new Set();
    }


    /** 
     * Add an option to this group
     * @hidden 
     */
    add(option: CvsOption) {
        // If this option is selected then deselect all the existing options  in group
        if (option.isSelected()) {
            for (let opt of this._group) {
                opt._deselect();
            }
        }
        this._group.add(option);
    }

    /** 
     * Remove an option to this group
     * @hidden 
     */
    remove(option: CvsOption) {
        this._group.delete(option);
    }

    /** 
     * @hidden 
     * @returns the currently selected option which will be deselected
     */
    _prev(): CvsOption | undefined {
        let prev = undefined;
        for (let opt of this._group)
            if (opt.isSelected()) {
                prev = opt;
                break;
            }
        return prev;
    }
}

/*
 ##############################################################################
 CvsOption
 This class represents an option button (aka radio button). These are usually
 grouped together so that only one can be selected at a time.
 ##############################################################################
 */
class CvsOption extends CvsText {

    /** @hidden */ protected _selected: boolean;
    /** @hidden */ protected _iconAlign: number;
    /** @hidden */ protected _icon: p5.Graphics;
    /** @hidden */ protected _optGroup: CvsOptionGroup;

    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x || 0, y || 0, w || 100, h || 18);
        this._selected = false;
        this._optGroup = null;
        this._iconAlign = this._p.LEFT;
        this._textAlign = this._p.LEFT;
    }

    /**
     * <p>Gets or sets the icon and alignment relative to any text in the control.</p>
     * <p>Processing constants are used to define the icon alignment.</p>
     * @param align LEFT or RIGHT
     * @returns this control or the current icon alignment
     */
    iconAlign(align: number) {
        if (!align)
            return this._iconAlign;
        if (align == this._p.LEFT || align == this._p.RIGHT) {
            this._iconAlign = align;
            this.invalidateBuffer();
        }
        return this;
    }

    /**
     * <p>Make this option true (selected) replacing the previos selection.</p>
     * 
     */
    select() {
        let curr = this._optGroup?._prev();
        if (curr) {
            curr._selected = false;
            curr.invalidateBuffer();
        }
        this._selected = true;
        this.invalidateBuffer();
        return this;
    }

    /** @hidden */
    _deselect() {
        this._selected = false;
        return this;
    }

    /**
     * 
     * @returns true if this option selected else returns false
     */
    isSelected() {
        return this._selected;
    }

    /**
     * <p>Add this option to a named option-group.</p>
     * <p>If the group doesn't exist then it will be created.</p>
     * @returns this control
     */
    group(optGroupName: string) {
        this._optGroup = this._gui.getOptionGroup(optGroupName);
        this._optGroup.add(this);
        return this;
    }

    /** @hidden */
    _handleMouse(e: MouseEvent) { // CvsOption
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x;
        let my = this._p.mouseY - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x; my = r.y;
        this._pover = this._over;                 // Store previous mouse over state
        this._over = this._whereOver(mx, my);     // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e);
        return false;
    }

    /** @hidden */
    _handleTouch(e: TouchEvent) {
        // e.preventDefault();
        let pos = this.getAbsXY();
        const rect = this._gui._canvas.getBoundingClientRect();
        const t = e.changedTouches[0];
        let mx = t.clientX - rect.left - pos.x;
        let my = t.clientY - rect.top - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x; my = r.y;
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e);
    }

    /** @hidden */
    _processEvent(e: any, ...info) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (this._over > 0) {
                    // Use these to see if there is movement between mosuseDown and mouseUp
                    this._clickAllowed = true;
                    this._dragging = true;
                    this._active = true;
                    this.invalidateBuffer();
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this._active) {
                    if (this._clickAllowed && !this._selected) {
                        // If we have an opt group then use it to replace old selection with this one
                        if (this._optGroup) {
                            this.select();
                            this.action({ source: this, p5Event: e, selected: true });
                        }
                    }
                }
                this._over = 0;
                this._clickAllowed = false;
                this._dragging = false;
                this._active = false;
                this.invalidateBuffer();
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
    }

    /** @hidden */
    _updateControlVisual() { //  CvsOption
        let ts = this._textSize || this._gui.textSize();
        let cs = this._scheme || this._gui.scheme();
        let b = this._buffer;
        let p = this._p;
        let iconAlign = this._iconAlign;
        let isize = p.constrain(Number(ts) * 0.7, 12, 16);
        let textAlign = this._textAlign;
        let lines = this._lines;
        let gap = this._gap;

        let BACK = cs['COLOR_3'];
        let FORE = cs['COLOR_13'];
        let HIGHLIGHT = cs['COLOR_14'];

        b.push();
        b.clear();
        // If opaque
        if (this._opaque) {
            b.noStroke(); b.fill(BACK);
            b.rect(0, 0, this._w, this._h,
                this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Start with circle
        b.push();
        let px = (iconAlign == p.RIGHT) ? this._w - gap - isize / 2 : gap + isize / 2;
        b.translate(px, b.height / 2);
        b.stroke(FORE);
        b.fill(cs['WHITE']);
        b.strokeWeight(1.5);
        b.ellipse(0, 0, isize, isize);
        if (this._selected) {
            b.fill(FORE);
            b.noStroke();
            b.ellipse(0, 0, isize / 2, isize / 2);
        }
        b.pop();
        if (lines.length > 0) {
            b.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            if (iconAlign == p.LEFT) x0 += isize + gap;
            if (iconAlign == p.RIGHT) x1 -= isize + gap;
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = b.textAscent() + (this._h - th) / 2;
            b.fill(FORE);
            for (let line of lines) {
                switch (textAlign) {
                    case p.LEFT: sx = x0; break;
                    case p.CENTER: sx = x0 + (tw - b.textWidth(line)) / 2; break;
                    case p.RIGHT: sx = x1 - b.textWidth(line) - gap; break;
                }
                b.text(line, sx, py);
                py += b.textLeading();
            }
        }
        // Mouse over control
        if (this._over > 0) {
            b.stroke(HIGHLIGHT);
            b.strokeWeight(2);
            b.noFill();
            b.rect(1, 1, this._w - 2, this._h - 2,
                this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (!this._enabled) this._disable_hightlight(b, cs, 0, 0, this._w, this._h);
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */
    _minControlSize() { // CvsOption
        let b = this._buffer;
        let lines = this._lines;
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
        let ts = this._textSize || this._gui.textSize();
        let isize = this._p.constrain(Number(ts) * 0.7, 12, 16);
        // Calculate minimum length and height of are to hold
        // multiple lines of text
        if (lines.length > 0) {
            if (!b) this._validateBuffer();
            let ts = this._textSize || this._gui.textSize();
            b.textSize(ts);
            tbox.w = ts + lines.map(t => b.textWidth(t)).reduce((x, y) => (x > y) ? x : y);
            tbox.h = (lines.length - 1) * b.textLeading() + b.textAscent() + b.textDescent();
        }
        sw += tbox.w + gap + isize;
        sh = Math.max(this._tbox.h, isize + gap) + 2 * gap;
        return { w: sw, h: sh };
    }

}

/**
 * <p>Simple label with text and / or icon</p>
 */
class CvsLabel extends CvsTextIcon {

    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x || 0, y || 0, w || 60, h || 16);
    }

    /** @hidden */
    _updateControlVisual() { // CvsLabel
        let ts = this._textSize || this._gui.textSize();
        let cs = this._scheme || this._gui.scheme();
        let b = this._buffer;
        let p = this._p;
        let icon = this._icon;
        let iconAlign = this._iconAlign;
        let textAlign = this._textAlign;
        let lines = this._lines;
        let gap = this._gap;

        let OPAQUE = cs['COLOR_4'];
        let FORE = cs['COLOR_13'];

        b.push();
        b.clear();
        // Background
        if (this._opaque) {
            b.noStroke(); b.fill(OPAQUE);
            b.rect(0, 0, this._w, this._h,
                this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (icon) {
            let px = 0, py;
            switch (iconAlign) {
                case p.LEFT: px = gap; break;
                case p.RIGHT: px = this._w - icon.width - gap; break;
            }
            if (lines.length == 0) // no text so center icon
                px = (this._w - icon.width) / 2;
            py = (this._h - icon.height + gap) / 2;
            b.image(this._icon, px, py);
        }
        if (lines.length > 0) {
            b.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            if (icon && iconAlign == p.LEFT) x0 += icon.width;
            if (icon && iconAlign == p.RIGHT) x1 -= icon.width;
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = b.textAscent() + (this._h - th) / 2;
            b.fill(FORE);
            for (let line of lines) {
                switch (textAlign) {
                    case p.LEFT: sx = x0; break;
                    case p.CENTER: sx = x0 + (tw - b.textWidth(line)) / 2; break;
                    case p.RIGHT: sx = x1 - b.textWidth(line) - gap; break;
                }
                b.text(line, sx, py);
                py += b.textLeading();
            }
        }
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }
}

/**
 * <p>A tooltip is a simply text hint that appears near to a control with the 
 * mouse over it.</p>
 * 
 * <p>The tooltip's relative position to thr dontrol is automatically set to 
 * make sure it is visible inside the canvas area.</p>
 * @hidden
 */
class CvsTooltip extends CvsText {

    /** @hidden */ protected _gap: number;
    /** @hidden */ protected _showTime: number;

    /** @hidden */
    constructor(gui: GUI, name: string) {
        super(gui, name);
        this._gap = 1;
        this._visible = false;
        this._showTime = 0;
    }

    /**
       * <p>Sets the text to be displayed in the tooltip.</p>
       * <p>Processing constants are used to define the alignment.</p>
       * @param t the text to display
       * @returns this control
       */
    text(t: string) {
        if (Array.isArray(t))
            this._lines = t;
        else {
            let lines = t.toString().split('\n');
            this._lines = [];
            for (let line of lines)
                this._lines.push(line);
        }
        // If necessary expand the control to surround text
        let s = this._minControlSize();
        this._w = Math.max(this._w, s.w);
        this._h = Math.max(this._h, s.h);
        this.invalidateBuffer();
        return this;
    }

    /**
     * <p>Set the time to display the tooltip
     * @param duration display time in ms
     * @returns this control
     */
    showTime(duration: number) {
        this._showTime = duration;
        return this;
    }

    /** @hidden */
    _updateState(owner: CvsBufferedControl, prevOver: number, currOver: number) {
        if (owner.isVisible() && prevOver != currOver)
            if (currOver > 0) {
                this.show();
                setTimeout(() => { this.hide() }, this._showTime);
            }
    }

    /** @hidden */
    _validatePosition() {
        let p = this._parent;
        let pp = p.getAbsXY(), px = pp.x, py = pp.y;
        let pa = p.orientation().wh(p.w(), p.h()), ph = pa.h;
        // Start tip in default location
        this._x = 0, this._y = -this._h;
        if (py + this._y < 0)
            this._y += this._h + ph;
        if (px + this._x + this._w > this._gui.canvasWidth())
            this._x -= this._w - pa.w;
    }

    /** @hidden */
    _updateControlVisual() { // CvsTooltip
        let ts = this._textSize || this._gui.tipTextSize();
        let cs = this._scheme || this._gui.scheme();
        let b = this._buffer;
        let lines = this._lines;
        let gap = this._gap;

        let BACK = cs['COLOR_4'];
        let FORE = cs['COLOR_13'];

        b.push();
        b.clear();
        // Backkground
        b.stroke(FORE); b.fill(BACK);
        b.rect(0, 0, this._w - 1, this._h - 1);

        b.fill(FORE).noStroke();
        if (lines.length > 0) {
            b.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = b.textAscent() + (this._h - th) / 2;

            for (let line of lines) {
                sx = x0 + (tw - b.textWidth(line)) / 2;
                b.text(line, sx, py);
                py += b.textLeading();
            }
        }
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */
    _minControlSize() {
        let b = this._buffer;
        let lines = this._lines;
        let ts = this._textSize || this._gui.tipTextSize();
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
        // Calculate minimum length and height of are to hold
        // multiple lines of text
        if (lines.length > 0) {
            if (!b) this._validateBuffer();
            b.textSize(ts);
            tbox.w = ts + lines.map(t => b.textWidth(t)).reduce((x, y) => (x > y) ? x : y);
            tbox.h = (lines.length - 1) * b.textLeading() + b.textAscent() + b.textDescent();
            gap += this._gap;
        }
        sw += tbox.w + gap;
        sh = Math.max(tbox.h, sh) + 2 * gap;
        return { w: sw, h: sh };
    }

}

/*
 ##############################################################################
 CvsScroller
 This class represents a simple scrollbar. Although it can be used as a 
 distinct control it is more likely to be used as part of a larger control such as CvsViewer
 ##############################################################################
 */
/** 
 * <p>The scroller is used to scroll thorugh an object larger than the 
 * display area.</p>
 * @hidden
 */
class CvsScroller extends CvsBufferedControl {

    /** @hidden */ protected _value: number = 0.5;
    /** @hidden */ protected _dvalue: number = 0.5;
    /** @hidden */ protected _used: number = 0.1;

    /** @hidden */ protected _s_value: number = 0.5;
    /** @hidden */ protected _s_dvalue: number = 0.5;
    /** @hidden */ protected _s_mx: number = 0.5;

    /** @hidden */ protected _minV: number = this._used / 2;
    /** @hidden */ protected _maxV: number = 1 - this._used / 2;

    /** @hidden */ protected _BORDER: number = 10;
    /** @hidden */ protected _TLENGTH: number;
    /** @hidden */ protected _THEIGHT: number = 8;
    /** @hidden */ protected _THUMB_HEIGHT: number = 12;
    /** @hidden */ protected _MIN_THUMB_WIDTH: number = 10;


    /** @hidden */
    constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
        super(gui, name, x || 0, y || 0, w || 100, h || 20);
        this._TLENGTH = this._w - 3 * this._BORDER;
        this._c = gui.corners();
        this._opaque = false;
    }

    update(v: number, u?: number) {
        // If a used value is available then set it
        if (Number.isFinite(u) && u !== this._used) {
            this._used = u;
            this._minV = this._used / 2;
            this._maxV = 1 - this._used / 2;
            this.invalidateBuffer();
        }
        if (Number.isFinite(v) && v !== this._value) {
            v = this._p.constrain(v, 0, 1);
            let dv = v, u2 = this._used / 2;
            if (v < u2) dv = u2;
            else if (v > 1 - u2) dv = 1 - u2;
            if (this._value != v || this._dvalue != dv) {
                this._value = v;
                this._dvalue = dv;
                this.invalidateBuffer();
            }
        }
    }

    getValue() {
        return this._value;
    }

    getUsed() {
        return this._used;
    }
    /** @hidden */
    _whereOver(px: number, py: number, tol = 20) {
        let tx = this._BORDER + this._dvalue * this._TLENGTH;
        let ty = this._h / 2;
        let thumbSizeX = Math.max(this._used * this._TLENGTH, this._MIN_THUMB_WIDTH);
        if (Math.abs(tx - px) <= thumbSizeX / 2 && Math.abs(ty - py) <= tol / 2) {
            return 1;
        }
        return 0;
    }


    /** @hidden */
    _handleMouse(e: MouseEvent) { //    CvsScroller
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x;
        let my = this._p.mouseY - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x;
        my = r.y;
        this._pover = this._over;                 // Store previous mouse over state
        this._over = this._whereOver(mx, my, this._THUMB_HEIGHT);     // Store current mouse over state
        if (this._pover != this._over) this.invalidateBuffer();
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx);
        return false;
    }

    /** @hidden */
    _handleTouch(e: TouchEvent) {
        e.preventDefault();
        let pos = this.getAbsXY();
        const rect = this._gui._canvas.getBoundingClientRect();
        const t = e.changedTouches[0];
        let mx = t.clientX - rect.left - pos.x;
        let my = t.clientY - rect.top - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x; my = r.y;
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my, Math.max(this._THUMB_HEIGHT, 20)); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip) this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx);
    }

    /** @hidden */
    _processEvent(e: any, ...info) {
        let mx = info[0];
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (this._over > 0) {
                    this._active = true;
                    this._s_value = this._value;
                    this._s_mx = mx;
                    this.invalidateBuffer();
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this._active) {
                    this.action({ source: this, p5Event: e, value: this._value, used: this._used, final: true });
                    this._active = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this._active) {
                    let delta = (mx - this._s_mx) / this._TLENGTH;
                    this.update(this._s_value + delta);
                    this.action({ source: this, p5Event: e, value: this._value, used: this._used, final: false });
                    this.invalidateBuffer();
                }
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
    }

    /** @hidden */
    _updateControlVisual() { // CvsScroller
        let b = this._buffer;
        let cs = this._scheme || this._gui.scheme();
        let thumbSizeX = Math.max(this._used * this._TLENGTH, this._MIN_THUMB_WIDTH), thumbSizeY = this._THUMB_HEIGHT;
        let tx = this._dvalue * this._TLENGTH;

        const OPAQUE = cs['COLOR_3'];
        const TICKS = cs['GREY_8'];
        const UNUSED_TRACK = cs['GREY_4'];
        const HIGHLIGHT = cs['COLOR_14'];
        const THUMB = cs['COLOR_10'];

        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke(); b.fill(OPAQUE);
            b.rect(0, 0, this._w, this._h,
                this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Now translate to track left edge - track centre
        b.translate(this._BORDER, b.height / 2);
        // draw track
        b.fill(UNUSED_TRACK);
        b.stroke(TICKS);
        b.strokeWeight(1);
        b.rect(0, -this._THEIGHT / 2, this._TLENGTH, this._THEIGHT);
        // Draw thumb
        b.fill(THUMB);
        b.noStroke();
        if (this._active || this._over > 0) {
            b.strokeWeight(2);
            b.stroke(HIGHLIGHT);
        }
        b.rect(tx - thumbSizeX / 2, -thumbSizeY / 2, thumbSizeX, thumbSizeY,
            this._c[0], this._c[1], this._c[2], this._c[3]);
        if (!this._enabled) this._disable_hightlight(b, cs, 0, -this._h / 2, this._w - 20, this._h);
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }

    /** @hidden */
    _minControlSize() {
        return { w: this._w, h: 20 };
    }

}

