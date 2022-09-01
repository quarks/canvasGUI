import p5 from "../libraries/p5.min.js";
import { GUI } from "./gui_controller";
export { GPane, GPaneEast, GPaneNorth, GPaneSouth, GPaneWest };
export { GObject, GControl, GScroller, GTooltip, GOptionGroup };
export { GOption, GCheckbox, GSlider, GRanger, GButton, GLabel };
export { GViewer, GText, GTextIcon };
export { Position, Box, Range, EventInfo, Overlap }


// Comment out any import and export statements above before transpiling to 
// Javascript. Otherwise it creates JS modules that don't work with the 
// Processing IDE

/** <p>Object type  \{ x: number; y: number; \} </p> */
interface Position { x: number; y: number; };
/** <p>Object type  \{ w: number; h: number; \} </p> */
interface Box { w: number; h: number; };
/** <p>Object type  \{ low: number; high: number; \} </p> */
interface Range { low: number; high: number; };
/** <p>Defines the event information sent to the event handler.</p> */
interface EventInfo { source: GObject; type: string; };
/** <p>Defines an overlap</p> */
interface Overlap {
  valid: boolean;
  left?: number; right?: number; top?: number, bottom?: number,
  width?: number; height?: number; offsetX?: number; offsetY?: number;
};

/*
##############################################################################
                            ORIENTATIONS
 These four classes allows the used to orientate any visual control (except 
 side panes) in one of the four cardinal compass directions. The default 
 direction is east i.e. left-to-right.

 The position supplied when creating a control represents the top-left corner
 of the control irrespective of the orientation specified.
 ##############################################################################
 */

class North {

  _renderP2D(p: p5, w: number, h: number, buffer: p5.Renderer) {
    p.push();
    p.translate(0, w);
    p.rotate(1.5 * Math.PI);
    p.image(buffer, 0, 0);
    p.pop();
  }

  _renderWEBGL(p: p5, w: number, h: number, buffer: p5.Renderer) {
    p.textureMode(p.NORMAL);
    p.texture(buffer);
    p.beginShape(p.TRIANGLE_STRIP);
    p.vertex(0, 0, 0, 1, 0);
    p.vertex(0, w, 0, 0, 0);
    p.vertex(h, 0, 0, 1, 1);
    p.vertex(h, w, 0, 0, 1);
    p.endShape();
  }

  xy(x: number, y: number, w: number, h: number) {
    return { 'x': w - y, 'y': x, 'w': h, 'h': w };
  }

  wh(w: number, h: number) {
    return { 'w': h, 'h': w };
  }
}

class South {

  _renderP2D(p: p5, w: number, h: number, buffer: p5.Renderer) {
    p.push();
    p.translate(h, 0);
    p.rotate(Math.PI / 2);
    p.image(buffer, 0, 0);
    p.pop();
  }

  _renderWEBGL(p: p5, w: number, h: number, buffer: p5.Renderer) {
    p.textureMode(p.NORMAL);
    p.texture(buffer);
    p.beginShape(p.TRIANGLE_STRIP);
    p.vertex(0, 0, 0, 0, 1);
    p.vertex(0, w, 0, 1, 1);
    p.vertex(h, 0, 0, 0, 0);
    p.vertex(h, w, 0, 1, 0);
    p.endShape();
  }

  xy(x: number, y: number, w: number, h: number) {
    return { 'x': y, 'y': h - x, 'w': h, 'h': w };
  }

  wh(w: number, h: number) {
    return { 'w': h, 'h': w };
  }
}

class East {

  _renderP2D(p: p5, w: number, h: number, buffer: p5.Renderer) {
    p.push();
    p.translate(0, 0);
    p.rotate(0);
    p.image(buffer, 0, 0);
    p.pop();
  }

  _renderWEBGL(p: p5, w: number, h: number, buffer: p5.Renderer) {
    p.textureMode(p.NORMAL);
    p.texture(buffer);
    p.beginShape(p.TRIANGLE_STRIP);
    p.vertex(0, 0, 0, 0, 0);
    p.vertex(0, h, 0, 0, 1);
    p.vertex(w, 0, 0, 1, 0);
    p.vertex(w, h, 0, 1, 1);
    p.endShape();
  }

  xy(x: number, y: number, w: number, h: number) {
    return { 'x': x, 'y': y, 'w': w, 'h': h };
  }

  wh(w: number, h: number) {
    return { 'w': w, 'h': h };
  }
}

class West {

  _renderP2D(p: p5, w: number, h: number, buffer: p5.Renderer) {
    p.push();
    p.translate(w, h);
    p.rotate(Math.PI);
    p.image(buffer, 0, 0);
    p.pop();
  }

  _renderWEBGL(p: p5, w: number, h: number, buffer: p5.Renderer) {
    p.textureMode(p.NORMAL);
    p.texture(buffer);
    p.beginShape(p.TRIANGLE_STRIP);
    p.vertex(0, 0, 0, 1, 1);
    p.vertex(0, h, 0, 1, 0);
    p.vertex(w, 0, 0, 0, 1);
    p.vertex(w, h, 0, 0, 0);
    p.endShape();
  }

  xy(x: number, y: number, w: number, h: number) {
    return { 'x': w - x, 'y': h - y, 'w': w, 'h': h };
  }

  wh(w: number, h: number) {
    return { 'w': w, 'h': h };
  }
}


/*
##############################################################################
 GObject
 This is the base class for controls and panes that don't require a buffer
 ##############################################################################
 */

/**
 * <p>Base class for all controls</p>
 * <p>It provides most of the functionality for the controls</p>
 */
class GObject {

  /** @hidden */
  static NORTH = new North();
  /** @hidden */
  static SOUTH = new South();
  /** @hidden */
  static EAST = new East();
  /** @hidden */
  static WEST = new West();

  /** @hidden */ protected _gui: GUI;
  /** @hidden */ protected _p: p5;
  /** @hidden */ protected _name: string;
  /** @hidden */ protected _children: Array<any>;
  /** @hidden */ protected _parent: GObject | GPane;
  /** @hidden */ protected _visible: boolean;
  /** @hidden */ protected _enabled: boolean;
  /** @hidden */ protected _Z: number;
  /** @hidden */ protected _x: number = 0;
  /** @hidden */ protected _y: number = 0;
  /** @hidden */ protected _w: number = 0;
  /** @hidden */ protected _h: number = 0;
  /** @hidden */ protected _orientation: North | South | East | West;
  /** @hidden */ protected _dragging: boolean;
  /** @hidden */ protected _buffer: p5.Renderer;
  /** @hidden */ protected _over: number;
  /** @hidden */ protected _pover: number;
  /** @hidden */ protected _clickAllowed: boolean;
  /** @hidden */ protected _c: Array<number>;
  /** @hidden */ protected _active: boolean;
  /** @hidden */ protected _opaque: boolean;
  /** @hidden */ protected _tooltip: GTooltip;
  /** @hidden */ protected _scheme: Array<string>;
  /** @hidden */ protected _bufferInvalid: boolean;
  /** <p>The event handler for this control. Although it is permitted to set 
   * this property directly it is recommended that the <code>setAction(...)</code>
   * method is used to define the event handler actions.</p> 
   */
  action: Function;

  /**
   * 
   * @hidden
   * @param gui
   * @param name unique identifier
   * @param x left-hand pixel position
   * @param y top pixel position
   * @param w width
   * @param h height
   */
  /**
   * Creates an instance of GObject.
   * @date 8/26/2022 - 7:04:37 PM
   *
   * @constructor
   * @param {GUI} gui
   * @param {string} name
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  /**
   * GObject class
   * @hidden
   * @constructor
   * @param {GUI} gui
   * @param {string} name
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
    this._gui = gui;
    this._p = this._gui._p;
    this._name = name;
    this._x = x;
    this._y = y;
    this._w = w;
    this._h = h;
    this._children = [];
    this._parent = undefined;
    this._visible = true;
    this._enabled = true;
    this._scheme = undefined;
    this._Z = 0;
    this._orientation = GObject.EAST;
    this._dragging = false; // is mouse being dragged on active control
    this._bufferInvalid = true;
    this._over = 0;
    this._pover = 0;
    this._clickAllowed = false;
    this._c = gui.corners(undefined);
    this._active = false;
    this._opaque = true;
    this.setAction((info?: EventInfo) => {
      console.warn(`No action set for control '${info?.source._name}`);
    });
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
  getAbsXY(): Position {
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
   * @param ls 
   * @param cascade 
   * @returns this control or the control's color scheme
   */
  scheme(ls?: string, cascade?: boolean): GObject | Array<string> {
    // setter
    if (ls) {
      this._scheme = this._gui.getScheme(ls);
      this._bufferInvalid = true;
      if (cascade)
        for (let c of this._children)
          c.scheme(ls, cascade);
      return this;
    }
    // getter
    return this._scheme;
  }

  /**
   * <p>Add a child to this control using its relative position [rx, ry]
   * If rx and ry are not provided then it assumes these values are 
   * already set in the child.</p>
   * @param c is the actual control or its name
   * @returns this control
   */
  addChild(c: GObject | string, rx?: number, ry?: number): any {
    let control = this._gui.getControl(c);
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
  removeChild(c: GObject | string) {
    let control = this._gui.getControl(c);
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
   * <p>Adds this control to another control which becomes its parent</p>
   * @param parent the control which will become the parent
   * @param rx x position relative to parent
   * @param ry  y position relative to parent
   * @returns this control
   */
  parent(parent: GObject, rx?: number, ry?: number): GObject {
    if (parent)
      parent.addChild(this, rx, ry);
    return this;
  }

  /**
   * <p>Remove this control from its parent</p>
   * @returns this control
   */
  leaveParent(): GObject {
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
  orient(dir: string): GObject {
    dir = dir.toString().toLowerCase();
    switch (dir) {
      case 'north':
        this._orientation = GObject.NORTH;
        break;
      case 'south':
        this._orientation = GObject.SOUTH;
        break;
      case 'west':
        this._orientation = GObject.WEST;
        break;
      case 'east':
      default:
        this._orientation = GObject.EAST;
        break;

    }
    return this;
  }

  /**
   * 
   * @returns whether this control is active - expecting mouse events
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
   * <p>Enable this control</p>
   * @param cascade if true enable child controls
   * @returns this control
   */
  enable(cascade?: boolean): GObject {
    this._enabled = true;
    if (cascade)
      for (let c of this._children)
        c.enable(cascade);
    return this;
  }

  /**
   * <p>Disable this control</p>
   * @param cascade if true disable child controls
   * @returns this control
   */
  disable(cascade?: boolean): GObject {
    if (this._enabled) {
      this._enabled = false;
      this._bufferInvalid = true;
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
  show(cascade?: boolean): GObject {
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
  hide(cascade?: boolean): GObject {
    this._visible = false;
    if (cascade)
      for (let c of this._children)
        c.hide(cascade);
    return this;
  }

  /**
   * <p>Makes the controls background opaque. The actual color depends
   * on the controls color scheme</p>
   * @returns this control
   */
  opaque(): GObject {
    this._opaque = true;
    return this;
  }

  /**
   * <p>Makes the controls background fully transparent.</p>
   * @returns this control
   */
  transparent(): GObject {
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
  shrink(dim?: string): GObject {
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
    this._bufferInvalid = true;
    return this;
  }

  /** @hidden */
  _whereOver(px: number, py: number): number {
    if (px > 0 && px < this._w && py > 0 && py < this._h) {
      return 1;
    }
    return 0;
  }

  /** @hidden */
  _minControlSize(): Box { return null; }

  /**
   * <p>This method ensures we have a buffer of the correct size for the control</p>
   * @hidden
   */
  _validateBuffer() {
    let b = this._buffer;
    if (b.width != this._w || b.height != this._h) {
      this._buffer = this._p.createGraphics(this._w, this._h);
      this._bufferInvalid = true; // Force a redarw of the buffer
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
    b.fill(cs.black1);
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
  orientation(): North | South | East | West {
    return this._orientation;
  }

  /** @hidden */
  _updateControlVisual(): void { }

  /** @hidden */
  _handleMouse(e: EventInfo): boolean { return true; };

}


/*
##############################################################################
 GControl
 This is the base class for all visual controls that require a graphic buffer
 ##############################################################################
 */

/**
 * <p>This is the base class for all visual controls that require a graphic buffer.</p>
 */
abstract class GControl extends GObject {

  /**
   * GControl class 
   * @hidden
   * @param {GUI} gui
   * @param name unique identifier
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
    if (tt instanceof GTooltip) {
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
class GSlider extends GControl {
  protected _t01: number;
  protected _limit0: number;
  protected _limit1: number;
  protected _majorTicks: number;
  protected _minorTicks: number;
  protected _s2ticks: boolean;

  /**
   * @hidden
   * @param gui the gui controller
   * @param name unique identifier
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
  limits(l0: number, l1: number): GObject {
    if (Number.isFinite(l0) && Number.isFinite(l1)) {
      this._limit0 = l0;
      this._limit1 = l1;
    }
    return this;
  }

  /**
   * <p>Sets the number of major and minor ticks and whether the slider is 
   * constrained to the tick values.</p>
   * @param {number} major the number of major ticks
   * @param {number} minor the number of minor ticks between major ticks
   * @param {boolean} stick2ticks slider value is constrainged to tick values
   * @returns {GObject} this slider object
   */
  ticks(major: number, minor: number, stick2ticks?: boolean): GObject {
    this._majorTicks = major;
    this._minorTicks = minor;
    this._s2ticks = Boolean(stick2ticks);
    return this;
  }

  /**
   * Sets or gets the value for this slider
   * @param v the selected value to be set 
   * @returns the current value or this slider object
   */
  value(v?: number): GObject | number {
    if (Number.isFinite(v)) {
      if ((v - this._limit0) * (v - this._limit1) <= 0) {
        this._bufferInvalid = true;
        this._t01 = this._norm01(v);
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
   * @param t parametric value
   * @returns the correspoding value
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
   * @returns 0 if not over the control of &ge;1
   */
  _whereOver(px: number, py: number): number {
    px -= 10; // Adjust mouse to start of track
    let ty = this._buffer.height / 2;
    let tx = this._t01 * (this._buffer.width - 20);
    if (Math.abs(tx - px) <= 8 && Math.abs(py - ty) <= 8) {
      return 1;
    }
    return 0;
  }

  /** @hidden */
  _handleMouse(e: EventInfo) { //    GSlider
    let eventConsumed: boolean = false;
    let pos = this.getAbsXY();
    let mx = this._p.mouseX - pos.x;
    let my = this._p.mouseY - pos.y;
    let r = this._orientation.xy(mx, my, this._w, this._h);
    mx = r.x;
    my = r.y;
    this._pover = this._over;                 // Store previous mouse over state
    this._over = this._whereOver(mx, my);     // Store current mouse over state
    this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
    if (this._tooltip) this._tooltip._updateState(this._pover, this._over);

    switch (e.type) {
      case 'mousedown':
        if (this._over > 0) {
          this._active = true;
          this._bufferInvalid = true;
        }
        break;
      case 'mouseout':
      case 'mouseup':
        if (this._active) {
          this.action({ source: this, p5Event: e, value: this.value(), final: true });
          this._active = false;
          this._bufferInvalid = true;
          eventConsumed = true;
        }
        break;
      case 'mousemove':
        if (this._active) {
          let t01 = this._norm01(mx - 10, 0, this._buffer.width - 20);
          if (this._s2ticks)
            t01 = this._nearestTickT(t01);
          if (this._t01 != t01) {
            this._t01 = t01;
            this.action({ source: this, p5Event: e, value: this.value(), final: false });
          }
          this._bufferInvalid = true;
        }
        break;
      case 'mouseover':
        break;
      case 'wheel':
        break;
    }
    return eventConsumed;
  }

  /** @hidden */
  _nearestTickT(p01: number): number {
    let nbrTicks = this._minorTicks > 0
      ? this._minorTicks * this._majorTicks : this._majorTicks;
    return (nbrTicks > 0) ? Math.round(p01 * nbrTicks) / nbrTicks : p01;
  }

  /** @hidden */
  _updateControlVisual(): void { // GSlider
    let b = this._buffer;
    let cs = this._scheme || this._gui.scheme();
    let tw = b.width - 20, trackW = 8, thumbSize = 12, majorT = 10, minorT = 7;

    b.push();
    b.clear();
    if (this._opaque) {
      b.noStroke(); b.fill(cs.back7);
      b.rect(0, 0, this._w, this._h,
        this._c[0], this._c[1], this._c[2], this._c[3]);
    }
    // Now translate to track left edge - track centre
    b.translate(10, b.height / 2);
    // Now draw ticks
    b.stroke(cs.track_border); b.strokeWeight(1);
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
    b.fill(cs.track_back);
    b.rect(0, -trackW / 2, tw, trackW);
    // draw used track
    let tx = tw * this._t01;
    b.fill(cs.track_fore);
    b.rect(0, -trackW / 2, tx, trackW,
      this._c[0], this._c[1], this._c[2], this._c[3]);
    // Draw thumb
    b.fill(cs.thumb);
    b.noStroke();
    if (this._active || this._over > 0) {
      b.strokeWeight(2);
      b.stroke(cs.highlight);
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
class GRanger extends GSlider {

  /** @hidden */ protected _t: Array<number>;
  /** @hidden */ protected _tIdx: number;

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
   * <p>Sets or gets the kow and high values for this control</p>
   * @param v0 low value
   * @param v1 high value
   * @returns this control or the low/high values
   */
  range(v0?: number, v1?: number): GObject | Range {
    if (!v0 || !v1)
      return { low: Math.min(v0, v1), high: Math.max(v0, v1) };
    let t0 = this._norm01(v0);
    let t1 = this._norm01(v1);
    this._bufferInvalid = (this._t[0] != t0) || (this._t[1] != t1);
    this._t[0] = Math.min(t0, t1); this._t[1] = Math.max(t0, t1);
    return this;
  }

  /** @hidden */
  value(v?: number): number | GObject {
      console.warn('Ranger controls require 2 values - use range(v0, v1) instead');
      return undefined;
  }

  /** @hidden */
  _whereOver(px: number, py: number): number {
    // Check vertical position  
    let ty = this._buffer.height / 2;
    if (Math.abs(py - ty) <= 8) {
      let tw = this._buffer.width - 20;
      let t = this._t;
      px -= 10;
      if (Math.abs(t[0] * tw - px) <= 8)
        return 1;
      if (Math.abs(t[1] * tw - px) <= 8)
        return 2;
    }
    return 0
  }

  /** @hidden */
  _handleMouse(e: EventInfo) { //    GRanger
    let eventConsumed: boolean = false;
    let pos = this.getAbsXY();
    let mx = this._p.mouseX - pos.x;
    let my = this._p.mouseY - pos.y;
    let r = this._orientation.xy(mx, my, this._w, this._h);
    mx = r.x;
    my = r.y;
    this._pover = this._over;                 // Store previous mouse over state
    this._over = this._whereOver(mx, my);     // Store current mouse over state
    // If this control is active remember the thumb that was pressed
    // otherwise check the current position
    this._tIdx = this._active ? this._tIdx : this._over - 1;

    this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
    if (this._tooltip) this._tooltip._updateState(this._pover, this._over);

    switch (e.type) {
      case 'mousedown':
        if (this._over > 0) {
          this._active = true;
          this._tIdx = this._over - 1;  // Which thumb is the mouse over
          this._bufferInvalid = true;
        }
        break;
      case 'mouseout':
      case 'mouseup':
        if (this._active) {
          let t0 = Math.min(this._t[0], this._t[1]);
          let t1 = Math.max(this._t[0], this._t[1]);
          this._t[0] = t0; this._t[1] = t1; this._tIdx = -1;
          this.action({
            source: this, p5Event: e, low: this._t2v(t0), high: this._t2v(t1), final: true
          });
          this._active = false;
          this._bufferInvalid = true;
          eventConsumed = true;
        }
        break;
      case 'mousemove':
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
          this._bufferInvalid = true;
        }
        break;
      case 'mouseover':
        break;
      case 'wheel':
        break;
    }
    return eventConsumed;
  }

  /** @hidden */
  _updateControlVisual() { // GRanger
    let b = this._buffer;
    let cs = this._scheme || this._gui.scheme();
    let tw = b.width - 20;
    let trackW = 8, thumbSize = 12, majorT = 10, minorT = 7;

    b.push();
    b.clear();
    // Backkground
    if (this._opaque) {
      b.noStroke(); b.fill(cs.back7);
      b.rect(0, 0, this._w, this._h,
        this._c[0], this._c[1], this._c[2], this._c[3]);
    }
    // Now translate to track left edge - track centre
    b.translate(10, b.height / 2);
    // Now draw ticks
    b.stroke(cs.track_border);
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
    b.fill(cs.track_back);
    b.rect(0, -trackW / 2, tw, trackW);
    // draw used track
    let tx0 = tw * Math.min(this._t[0], this._t[1]);
    let tx1 = tw * Math.max(this._t[0], this._t[1]);
    b.fill(cs.track_fore);
    b.rect(tx0, -trackW / 2, tx1 - tx0, trackW,
      this._c[0], this._c[1], this._c[2], this._c[3]);
    // Draw thumb
    for (let tnbr = 0; tnbr < 2; tnbr++) {
      b.fill(cs.thumb);
      b.noStroke();
      if ((this._active || this._over > 0) && tnbr == this._tIdx) {
        b.strokeWeight(2);
        b.stroke(cs.highlight);
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
abstract class GText extends GControl {

  /** @hidden */ protected _lines: Array<string>;
  /** @hidden */ protected _text: string;
  /** @hidden */ protected _textSize: number;
  /** @hidden */ protected _textAlign: number;
  /** @hidden */ protected _tbox: Box;
  /** @hidden */ protected _gap: number;

  /** @hidden */
  constructor(gui: GUI, name: string, x?: number, y?: number, w?: number, h?: number) {
    super(gui, name, x || 0, y || 0, w || 80, h || 16);
    this._lines = [];
    this._textSize = undefined;
    this._textAlign = this._p.CENTER;
    this._tbox = { w: 0, h: 0 };
    this._gap = 2;
  }

  /**
   * <p>Gets or sets the current text.</p>
   * <p>Processing constants are used to define the alignment.</p>
   * @param t the text toset
   * @param align LEFT, CENTER or RIGHT
   * @returns this control or the existing text
   */
  text(t?: string | Array<string>, align?: number) {
    // getter
    if (t == undefined)
      return { text: this._text, icon: undefined };
    //setter
    if (Array.isArray(t))
      this._lines = t;
    else {
      let lines = t.toString().split('\n');
      this._lines = [];
      for (let line of lines)
        this._lines.push(line);
    }
    this.textAlign(align);
    // If necessary expand the control to surround text
    let s = this._minControlSize();
    this._w = Math.max(this._w, s.w);
    this._h = Math.max(this._h, s.h);
    this._bufferInvalid = true;
    return this;
  }

  /**
   * <p>Sets the text alignment.</p>
   * <p>Processing constants are used to define the text alignment.</p>
   * @param align LEFT, CENTER or RIGHT
   * @returns this control
   */
  textAlign(align: number): GObject {
    if (align && (align == this._p.LEFT || align == this._p.CENTER || align == this._p.RIGHT))
      this._textAlign = align;
    return this;
  }

  /**
   * <p>Renoves any text that the control might use ti  display itself.</p>
   * 
   * @returns this control
   */
  noText(): GObject {
    this._lines = [];
    this._textAlign = this._p.CENTER;
    this._tbox = { w: 0, h: 0 };
    return this;
  }

  /**
   * <p>Sets or gets the text size.</p>
   * @param lts the text size to use
   * @returns this control or the current tet size
   */
  textSize(lts: number) {
    lts = Number(lts);
    let ts = this._textSize || this._gui.textSize();
    // getter (use if null, undefined or zero)
    if (Number.isNaN(lts) || lts == 0)
      return ts;
    // setter
    if (lts != ts) {
      this._textSize = lts;
      // If necessary expand the control to surrond text
      let s = this._minControlSize();
      this._w = Math.max(this._w, s.w);
      this._h = Math.max(this._h, s.h);
      this._bufferInvalid = true;
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
      tbox.h = (lines.length - 1) * b.textLeading() + b.textAscent() + b.textDescent();
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
abstract class GTextIcon extends GText {

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
   * @returns this control or the current text/icon
   */
  icon(i: p5.Graphics, align: number) {
    // getter
    if (!i)
      return { text: this._text, icon: this._icon };
    //setter    
    this._icon = i;
    if (align && (align == this._p.LEFT || align == this._p.RIGHT))
      this._iconAlign = align;
    // If necessary expand the control to surrond text and icon 
    let s = this._minControlSize();
    this._w = Math.max(this._w, s.w);
    this._h = Math.max(this._h, s.h);
    this._bufferInvalid = true;
    return this;
  }

  /**
   * 
   * @returns this control
   */
  noIcon() {
    this._icon = undefined;
    this._iconAlign = this._p.LEFT;
    this._bufferInvalid = true;
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
class GButton extends GTextIcon {

  /** @hidden */
  constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
    super(gui, name, x || 0, y || 0, w || 80, h || 16);
  }

  /** @hidden */
  _updateControlVisual() { // GButton
    let ts = this._textSize || this._gui.textSize();
    let cs = this._scheme || this._gui.scheme();
    let b = this._buffer;
    let icon = this._icon;
    let iconAlign = this._iconAlign;
    let textAlign = this._textAlign;
    let lines = this._lines;
    let gap = this._gap;
    b.push();
    b.clear();
    // Backkground
    if (this._opaque) {
      b.noStroke(); b.fill(cs.back);
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
      b.fill(cs.fore);
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
      b.stroke(cs.highlight);
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
    if (this._parent instanceof GPane) // && this._parent.validateTabs)
      this._parent.validateTabs();
  }

  /** @hidden */
  _handleMouse(e: EventInfo) { // button
    let eventConsumed: boolean = false;
    let pos = this.getAbsXY();
    let mx = this._p.mouseX - pos.x;
    let my = this._p.mouseY - pos.y;
    let r = this._orientation.xy(mx, my, this._w, this._h);
    mx = r.x;
    my = r.y;
    this._pover = this._over;                 // Store previous mouse over state
    this._over = this._whereOver(mx, my);     // Store current mouse over state
    this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
    if (this._tooltip) this._tooltip._updateState(this._pover, this._over);

    switch (e.type) {
      case 'mousedown':
        if (this._over > 0) {
          // _clickAllowed is set to false if mouse moves
          this._clickAllowed = true;
          this._dragging = true;
          this._active = true;
          this._bufferInvalid = true;
          eventConsumed = true;
        }
        break;
      case 'mouseout':
      case 'mouseup':
        //console.log(`Mouse up on ${this.name()}  ${this._active}`);
        if (this._active) {
          if (this._clickAllowed) {
            this.action({ source: this, p5Event: e });
          }
          this._over = 0;
          this._clickAllowed = false;
          this._dragging = false;
          this._active = false;
          this._bufferInvalid = true;
          eventConsumed = true;
        }
        break;
      case 'mousemove':
        this._clickAllowed = false;
        break;
      case 'mouseover':
        break;
      case 'wheel':
        break;
    }
    return eventConsumed;
  }
}

/**
 * This class supports simple true-false checkbox
 */
class GCheckbox extends GText {

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
      this._bufferInvalid = true;
    }
    return this;
  }

  /**
   * <p>Make this checkbox true>/p>
   * @returns this control
   */
  select() {
    if (!this._selected) {
      this._selected = true;
      this._bufferInvalid = true;
    }
    return this;
  }

  /**
   * <p>Make this checkbox false>/p>
   * @returns this control
   */
  deselect() {
    if (this._selected) {
      this._selected = false;
      this._bufferInvalid = true;
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
  _handleMouse(e: EventInfo) { // GCheckbox
    let eventConsumed: boolean = false;
    let pos = this.getAbsXY();
    let mx = this._p.mouseX - pos.x;
    let my = this._p.mouseY - pos.y;
    let r = this._orientation.xy(mx, my, this._w, this._h);
    mx = r.x;
    my = r.y;
    this._pover = this._over;                 // Store previous mouse over state
    this._over = this._whereOver(mx, my);     // Store current mouse over state
    this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
    if (this._tooltip) this._tooltip._updateState(this._pover, this._over);

    switch (e.type) {
      case 'mousedown':
        if (this._over > 0) {
          // Use these to see if there is movement between mosuseDown and mouseUp
          this._clickAllowed = true;
          this._dragging = true;
          this._active = true;
          this._bufferInvalid = true;
          eventConsumed = true;
        }
        break;
      case 'mouseout':
      case 'mouseup':
        if (this._active) {
          if (this._clickAllowed) {
            this._selected = !this._selected;
            this.action({ source: this, p5Event: e, selected: this._selected });
          }
          this._over = 0;
          this._clickAllowed = false;
          this._dragging = false;
          this._active = false;
          this._bufferInvalid = true;
          eventConsumed = true;
        }
        break;
      case 'mousemove':
        this._clickAllowed = false;
        break;
      case 'mouseover':
        break;
      case 'wheel':
        break;
    }
    return eventConsumed;
  }

  /** @hidden */
  _updateControlVisual() { //  GCheckbox
    let ts = this._textSize || this._gui.textSize();
    let cs = this._scheme || this._gui.scheme();
    let b = this._buffer;
    //let icon = this._icon;
    let iconAlign = this._iconAlign;
    let isize = this._p.constrain(Number(ts) * 0.7, 12, 16);
    let textAlign = this._textAlign;
    let lines = this._lines;
    let gap = this._gap; b.push();
    b.clear();
    if (this._opaque) {
      b.noStroke(); b.fill(cs.back7);
      b.rect(0, 0, this._w, this._h,
        this._c[0], this._c[1], this._c[2], this._c[3]);
    }
    // Start with box and tick
    b.push();
    let px = (iconAlign == this._p.RIGHT) ? this._w - gap - isize / 2 : gap + isize / 2;
    b.translate(px, b.height / 2);
    b.stroke(cs.fore);
    b.fill(cs.white);
    b.strokeWeight(1.5);

    b.rect(-isize / 2, -isize / 2, isize, isize, 3);
    if (this._selected) {
      b.stroke(cs.fore);
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
      b.fill(cs.fore);
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
      b.stroke(cs.highlight);
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
  _minControlSize() { // GCheckbox
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
class GOptionGroup {
  /** @hidden */ protected _name: string;
  /** @hidden */ protected _group: Set<GOption>;

  /** @hidden */
  constructor(name: string) {
    this._name = name;
    this._group = new Set();
  }


  /** 
   * Add an option to this group
   * @hidden 
   */
  add(option: GOption) {
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
  remove(option: GOption) {
    this._group.delete(option);
  }

  /** 
   * @hidden 
   * @returns the currently selected option which will be deselected
   */
  _prev(): GOption | undefined {
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
 GOption
 This class represents an option button (aka radio button). These are usually
 grouped together so that only one can be selected at a time.
 ##############################################################################
 */
class GOption extends GText {

  /** @hidden */ protected _selected: boolean;
  /** @hidden */ protected _iconAlign: number;
  /** @hidden */ protected _icon: p5.Graphics;
  /** @hidden */ protected _optGroup: GOptionGroup;

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
      this._bufferInvalid = true;
    }
    return this;
  }

  /*
  <p>Replace previous selection with this option</p>
   */
  select() {
    let curr = this._optGroup?._prev();
    if (curr) {
      curr._selected = false;
      curr._bufferInvalid = true;
    }
    this._selected = true;
    this._bufferInvalid = true;
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
  _handleMouse(e: EventInfo) { // GOption
    let eventConsumed: boolean = false;
    let pos = this.getAbsXY();
    let mx = this._p.mouseX - pos.x;
    let my = this._p.mouseY - pos.y;
    let r = this._orientation.xy(mx, my, this._w, this._h);
    mx = r.x;
    my = r.y;
    this._pover = this._over;                 // Store previous mouse over state
    this._over = this._whereOver(mx, my);     // Store current mouse over state
    this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
    if (this._tooltip) this._tooltip._updateState(this._pover, this._over);

    switch (e.type) {
      case 'mousedown':
        if (this._over > 0) {
          // Use these to see if there is movement between mosuseDown and mouseUp
          this._clickAllowed = true;
          this._dragging = true;
          this._active = true;
          this._bufferInvalid = true;
          eventConsumed = true;
        }
        break;
      case 'mouseout':
      case 'mouseup':
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
        this._bufferInvalid = true;
        eventConsumed = true;
        break;
      case 'mousemove':
        this._clickAllowed = false;
        break;
      case 'mouseover':
        break;
      case 'wheel':
        break;
    }
    return eventConsumed;
  }

  /** @hidden */
  _updateControlVisual() { //  GOption
    let ts = this._textSize || this._gui.textSize();
    let cs = this._scheme || this._gui.scheme();
    let b = this._buffer;
    let p = this._p;
    let iconAlign = this._iconAlign;
    let isize = p.constrain(Number(ts) * 0.7, 12, 16);
    let textAlign = this._textAlign;
    let lines = this._lines;
    let gap = this._gap;

    b.push();
    b.clear();
    // If opaque
    if (this._opaque) {
      b.noStroke(); b.fill(cs.back7);
      b.rect(0, 0, this._w, this._h,
        this._c[0], this._c[1], this._c[2], this._c[3]);
    }
    // Start with circle
    b.push();
    let px = (iconAlign == p.RIGHT) ? this._w - gap - isize / 2 : gap + isize / 2;
    b.translate(px, b.height / 2);
    b.stroke(cs.fore);
    b.fill(cs.white);
    b.strokeWeight(1.5);
    b.ellipse(0, 0, isize, isize);
    if (this._selected) {
      b.fill(cs.fore);
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
      b.fill(cs.fore);
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
      b.stroke(cs.highlight);
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
  _minControlSize() { // GOption
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
class GLabel extends GTextIcon {

  /** @hidden */
  constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
    super(gui, name, x || 0, y || 0, w || 60, h || 16);
  }

  /** @hidden */
  _updateControlVisual() { // GLabel
    let ts = this._textSize || this._gui.textSize();
    let cs = this._scheme || this._gui.scheme();
    let b = this._buffer;
    let p = this._p;
    let icon = this._icon;
    let iconAlign = this._iconAlign;
    let textAlign = this._textAlign;
    let lines = this._lines;
    let gap = this._gap;
    b.push();
    b.clear();
    // Backkground
    if (this._opaque) {
      b.noStroke(); b.fill(cs.back7);
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
      b.fill(cs.fore);
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


/*
##############################################################################
 GTooltip
 A box containing some text and/or icon
 ##############################################################################
 */
class GTooltip extends GText {

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
     * @param t the text toset
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
    this._bufferInvalid = true;
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
  _updateState(prevOver: number, currOver: number) {
    if (prevOver != currOver)
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
  _updateControlVisual() { // GTooltip
    let ts = this._textSize || this._gui.tipTextSize();
    let cs = this._scheme || this._gui.scheme();
    let b = this._buffer;
    // let icon = this._icon;
    // let iconAlign = this._iconAlign;
    // let textAlign = this._textAlign;
    let lines = this._lines;
    let gap = this._gap;
    b.push();
    b.clear();
    // Backkground
    b.stroke(cs.ttfore); b.fill(cs.ttback);
    b.rect(0, 0, this._w - 1, this._h - 1);

    b.fill(cs.ttfore).noStroke();
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
 GScroller
 This class represents a simple scrollbar. Although it can be used as a 
 distinct control it is more likely to be used as part of a larger control such as GViewer
 ##############################################################################
 */
/** 
 * <p>The scroller is used to scroll thorugh an object larger than the 
 * display area.</p>
 */
class GScroller extends GControl {

  /** @hidden */ protected _capacity: number;
  /** @hidden */ protected _used: number;
  /** @hidden */ protected _minV: number;
  /** @hidden */ protected _maxV: number;
  /** @hidden */ protected _value: number;
  /** @hidden */ protected _mdelta: number;
  /** @hidden */ protected _mx0: number;
  /** @hidden */ protected _mx1: number;
  /** @hidden */ protected _my0: number;
  /** @hidden */ protected _my1: number;
  /** @hidden */ protected _BORDER: number;
  /** @hidden */ protected _TLENGTH: number;
  /** @hidden */ protected _THEIGHT: number;

  /** @hidden */
  constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
    super(gui, name, x || 0, y || 0, w || 100, h || 20);
    this._updateTrackInfo();
    this._capacity = 1;
    this._used = 0.3;
    this._minV = this._used / 2;
    this._maxV = 1 - this._used / 2;
    this._value = 0.5;
    this._c = gui.corners();
    this._opaque = true;
    this._mdelta = 0;
    this._mx0 = 0; this._mx1 = 0;
    this._my0 = 0; this._my1 = 0;
  }

  /** @hidden */
  _updateTrackInfo() {
    this._BORDER = 10;
    this._TLENGTH = this._w - 2 * this._BORDER;
    this._THEIGHT = 10;
  }

  /**
   * <p>Get or set the position of the thumb center.</p>
   * @param v the thumb centre to set 
   * @returns this control or the thumb position.
   */
  value(v?: number) {
    if (!Number.isFinite(v))
      return this._value * this._capacity;
    let value = v / this._capacity;
    this._validateValue(value);
    return this;
  }

  /**
   * <p>Gets or sets the amount of the scrolled object is visible. This controls
   * the size of the thumb<p>
   * @param u the amount used (&le;capacity)
   * @returns this control or the amount used
   */
  used(u?: number) {
    if (!Number.isFinite(u))
      return this._used * this._capacity;
    let used = u / this._capacity;
    used = this._p.constrain(used, 0, 1);
    //this._bufferInvalid = this._bufferInvalid || Math.abs(used - this._used) > 0.001;
    this._bufferInvalid = this._bufferInvalid || this._neq(used, this._used);
    this._used = used;
    // Update value limits
    this._minV = this._used / 2;
    this._maxV = 1 - this._used / 2;
    this._used >= 1 ? this.hide() : this.show();
    // Validate current value
    this._validateValue(this._value);
    return this;
  }

  /** @hidden */
  _validateValue(value: number) {
    value = this._p.constrain(value, this._minV, this._maxV);
    let changed = value != this._value;
    if (changed) {
      this._value = value;
      this.action({ source: this, value: this.value(), final: true });
      this._bufferInvalid = true;
    }
  }

  /**
   * <p>The capacity of a scroller is determined by the user based on
   * the size of the object to be scrolled through.</p>
   * 
   * @param c the 'capacity' of the scroller
   * @returns this control or the control
   */
  capacity(c: number) {
    if (!Number.isFinite(c))
      return this._capacity;
    this._capacity = c;
    //this._bufferInvalid = this._bufferInvalid || Math.abs(c - this._capacity) > 0.001;
    this._bufferInvalid = this._bufferInvalid || this._neq(c, this._capacity);
    return this;
  }

  /** @hidden */
  _whereOver(px: number, py: number) {
    //let b = this._buffer;
    let tx = this._BORDER + this._value * this._TLENGTH;
    let ty = this._h / 2;
    let thumbSizeX = Math.max(this._used * this._TLENGTH, 12);
    if (Math.abs(tx - px) <= thumbSizeX / 2 && Math.abs(ty - py) <= this._THEIGHT / 2) {
      return 1;
    }
    return 0;
  }

  /** @hidden */
  _handleMouse(e: EventInfo) { //    GScroller
    let eventConsumed: boolean = false;
    let pos = this.getAbsXY();
    let mx = this._p.mouseX - pos.x;
    let my = this._p.mouseY - pos.y;
    let r = this._orientation.xy(mx, my, this._w, this._h);
    mx = r.x;
    my = r.y;
    this._pover = this._over;                 // Store previous mouse over state
    this._over = this._whereOver(mx, my);     // Store current mouse over state
    this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
    if (this._tooltip) this._tooltip._updateState(this._pover, this._over);

    switch (e.type) {
      case 'mousedown':
        if (this._over > 0) {
          this._active = true;
          this._bufferInvalid = true;
          this._mdelta = mx - (this._value * this._TLENGTH + this._BORDER);
        }
        break;
      case 'mouseout':
      case 'mouseup':
        if (this._active) {
          this.action({ source: this, p5Event: e, value: this.value(), final: true });
          this._active = false;
          this._bufferInvalid = true;
          eventConsumed = true;
        }
        break;
      case 'mousemove':
        if (this._active) {
          let nv = (mx - this._mdelta - this._BORDER) / this._TLENGTH;
          nv = this._p.constrain(nv, this._minV, this._maxV);
          this._value = nv;
          this.action({ source: this, p5Event: e, value: this.value(), final: false });
          this._bufferInvalid = true;
        }
        break;
      case 'mouseover':
        break;
      case 'wheel':
        break;
    }
    return eventConsumed;
  }

  /** @hidden */
  _updateControlVisual() { // GScroller
    let b = this._buffer;
    let cs = this._scheme || this._gui.scheme();
    let thumbSizeX = Math.max(this._used * this._TLENGTH, 12), thumbSizeY = 14;
    let tx = this._value * this._TLENGTH;

    b.push();
    b.clear();
    if (this._opaque) {
      b.noStroke(); b.fill(cs.back7);
      b.rect(0, 0, this._w, this._h,
        this._c[0], this._c[1], this._c[2], this._c[3]);
    }
    // Now translate to track left edge - track centre
    b.translate(this._BORDER, b.height / 2);
    // draw track
    b.fill(cs.track_back);
    b.stroke(cs.track_border);
    b.strokeWeight(1);
    b.rect(0, -this._THEIGHT / 2, this._TLENGTH, this._THEIGHT);
    // Draw thumb
    b.fill(cs.thumb);
    b.noStroke();
    if (this._active || this._over > 0) {
      b.strokeWeight(2);
      b.stroke(cs.highlight);
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


/*
 ##############################################################################
 GViewer
 This control is used to scroll and zoom around a bitmap
 image.

 The size of the view area is controlled by the parameters
 w and h but the scrollers  are added to the right hand 
 side and bottom which extends the control size by 20px.
 ##############################################################################
 */
/**
 * <p>This control is used to scroll and zoom on an image.</p>
 * <p>The size of the view area is determined when the control is created but
 * scrollers added to the right and bottom of the view increaing its size
 * by 20px. The scrollers are only visible when they are needed.</p>
 * 
 * <p>THis control also supports layers where multiple images can be layered 
 * to make the final visual.</p>
 * 
 * <p>If you call the method <code>scale()</code> with all three parameters
 * a slider is created so the user can zoom in and out of the image. The
 * slider is only visible when the mouse pointer is near the centre of the 
 * view area.</p>
 */
class GViewer extends GControl {

  /** @hidden */ protected _layers: Array<p5.Graphics>;
  /** @hidden */ protected _hidden: Set<number>;
  /** @hidden */ protected _lw: number;
  /** @hidden */ protected _lh: number;
  /** @hidden */ protected _wcx: number;
  /** @hidden */ protected _wcy: number;
  /** @hidden */ protected _wscale: number;
  /** @hidden */ protected _usedX: number;
  /** @hidden */ protected _usedY: number;
  /** @hidden */ protected _o: Overlap;
  /** @hidden */ protected _scrH: GScroller;
  /** @hidden */ protected _scrV: GScroller;
  /** @hidden */ protected _scaler: GSlider;
  /** @hidden */ protected _wscales: number;
  /** @hidden */ protected _mx0: number;
  /** @hidden */ protected _my0: number;
  /** @hidden */ protected _dcx: number;
  /** @hidden */ protected _dcy: number;
  /** @hidden */ protected _pmx: number;
  /** @hidden */ protected _pmy: number;

  /** @hidden */
  constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
    super(gui, name, x, y, w, h);

    // The images in draw order
    this._layers = [];
    this._hidden = new Set();
    this._lw = 0;
    this._lh = 0;
    // View on world        
    this._wcx = 0;
    this._wcy = 0;
    this._wscale = 0;
    // The amount horizontally and vertically visible 
    this._usedX = 0;
    this._usedY = 0;
    // Overlap
    this._o = { valid: false };

    this._scrH = gui.scroller(this._name + "-scrH", 0, h, w, 20)
      .setAction((info) => {
        this.view(info.value, this._wcy);
        this._bufferInvalid = true;
      });

    this._scrV = gui.scroller(this._name + "-scrV", w, 0, h, 20).orient('south')
      .setAction((info) => {
        this.view(this._wcx, info.value);
        this._bufferInvalid = true;
      });
    this.addChild(this._scrH);
    this.addChild(this._scrV);
  }

  /** 
   * <p>Sets or gets the scale and or scale limits</p>
   * <p>If no parameters are passed the the current scale is returned. A
   * single parameter sets the current scale and three parameter sets the 
   * current scale and the limits for the zoom slider.</p>
   * 
   * @param v the scale to use
   * @param l0 lower scle limit for slider
   * @param l1 upper limit for slider
   * @returns this control or the current scale
   */
  scale(v: number, l0?: number, l1?: number) {
    if (!v && !l0 && !l1) // no parameters
      return this._wscale;
    // Have limits been provided
    if (isFinite(l0) && isFinite(l1)) {
      if (!this._scaler) {
        this._scaler = this._gui.slider(this._name + "-scaler",
          0.25 * this._w, 0.5 * this._h - 10, 0.5 * this._w, 20)
          .hide()
          .limits(l0, l1)
          .value((l0 + l1) / 2)
          .setAction((info) => {
            this.scale(info.value);
            this._bufferInvalid = true;
          });
        this.addChild(this._scaler);
      }
      this._scaler.limits(Math.min(l0, l1), Math.max(l0, l1));
    }
    if (isFinite(v)) { // numeric value provided
      if (this._scaler) this._scaler.value(v);
      this._wscale = v;
      this.view(this._wcx, this._wcy, this._wscales);
    }
    this._bufferInvalid = true;
    return this;
  }

  /**
   * <p>The current status is  an object with 3 fields <code>\{ cX, cY, scale \}</code>
   * where -</p>
   * <ul>
   * <li><code>cx, cy</code> is the position in the image that correseponds to the view center and</li>
   * <li><code>scale</code> is the current scale used to display the image.</li>
   * </ul>
   * @returns the current status
   */
  status() {
    return { cX: this._wcx, cY: this._wcy, scale: this._wscale };
  }

  /**
   * <p>Make this control invisible</p>
   * @returns this control
   */
  hide() {
    return super.hide(true);
  }

  /**
   * <p>Make this control visible</p>
   * @returns this control
   */
  show() {
    return super.show(true);
  }

  /**
   * <p>Make a layer invisible</p>
   * @param n the layer number &ge;0
   * @returns this control
   */
  hideLayer(n: number) {
    if (Number.isInteger(n))
      if (n >= 0 && n < this._layers.length && !this._hidden.has(n)) {
        this._hidden.add(n);
        this._bufferInvalid = true;
      }
    return this;
  }

  /**
   * <p>Make a layer visible</p>
   * @param n the layer number &ge;0
   * @returns this control
   */
  showLayer(n: number) {
    if (Number.isInteger(n))
      if (n >= 0 && n < this._layers.length && this._hidden.has(n)) {
        this._hidden.delete(n);
        this._bufferInvalid = true;
      }
    return this;
  }

  /*
  Any changes in the view should call this method to change the view centre
  and scale attributes so that it can fire action events back to the user
  */
  view(wcx: number, wcy: number, wscale?: number) {
    if (Number.isFinite(wcx) && Number.isFinite(wcy)) {
      if (this._neq(this._wcx, wcx) || this._neq(this._wcy, wcy)) {
        this._wcx = wcx;
        this._wcy = wcy;
        this._scrH.value(wcx);
        this._scrV.value(wcy);
        this._bufferInvalid = true;
      }
      if (this._neq(this._wscale, wscale)) {
        this._wscale = wscale;
        if (this._scaler) this._scaler.value(wscale);
        this._bufferInvalid = true;
      }
      this.action({ // Fire action to the user's sketch
        source: this, p5Event: undefined,
        cX: this._wcx, cY: this._wcy, scale: this._wscale
      });
    }
    return this;
  }

  /**
   * <p>Sets the image(s) to be displayed in this viewer</p>
   * 
   * @param img an image or array of images
   * @returns this control
   */
  layers(img: p5.Graphics | Array<p5.Graphics>) {
    if (Array.isArray(img))
      this._layers = Array.from(img);
    else
      this._layers[0] = img;
    // Make all layers the same size as the first one
    let lw = this._lw = this._layers[0].width;
    let lh = this._lh = this._layers[0].height;
    for (let idx = 1; idx < this._layers[idx]; idx++) {
      let l = this._layers[idx];
      if (l.width != lw || l.height != lh)
        l.resize(lw, lh);
    }
    this._scrH.capacity(lw);
    this._scrV.capacity(lh);
    this._bufferInvalid = true;
    return this;
  }

  /** @hidden */
  _overScaler() {
    return Boolean(this._scaler && this._scaler.over() > 0);
  }

  /** @hidden */
  _handleMouse(e: EventInfo) { // viewer
    let eventConsumed: boolean = false;
    let pos = this.getAbsXY();
    let mx = this._p.mouseX - pos.x;
    let my = this._p.mouseY - pos.y;

    this._pover = this._over;                 // Store previous mouse over state
    this._over = this._whereOver(mx, my);     // Store current mouse over state
    this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
    if (this._tooltip) this._tooltip._updateState(this._pover, this._over);

    // Hide scaler unless mouse is close to centre
    if (this._scaler) this._over > 1 ? this._scaler.show() : this._scaler.hide();

    switch (e.type) {
      case 'mousedown':
        if (this._over > 0) {
          if (!this._overScaler()) {
            // Use these to see if there is movement between mouseDown and mouseUp
            this._clickAllowed = false;
            this._dragging = true;
            this._active = true;
            this._bufferInvalid = true;
            // Remember starting values
            this._mx0 = this._pmx = mx;
            this._my0 = this._pmy = my;
            this._dcx = this._wcx;
            this._dcy = this._wcy;
          }
        }
        break;
      case 'mouseout':
        if (this._active) {
          this._over = 0;
          this._clickAllowed = false;
          this._dragging = false;
          this._active = false;
          this._bufferInvalid = true;
        }
      case 'mouseup':
        if (this._active) {
          this._dragging = false;
          this._active = false;
          this._bufferInvalid = true;
        }
        break;
      case 'mousemove':
        if (this._active && this._dragging) {
          if (this._scaler) this._scaler.hide();
          this._validateMouseDrag(
            this._dcx + (this._mx0 - mx) / this._wscale,
            this._dcy + (this._my0 - my) / this._wscale
          );
        }
        break;
      case 'mouseover':
        break;
      case 'wheel':
        break;
    }
    return eventConsumed;
  }

  /** @hidden */
  _validateMouseDrag(ncx: number, ncy: number) {
    //ncx = Math.round(ncx); ncy = Math.round(ncy);
    let ww2 = Math.round(0.5 * this._w / this._wscale);
    let wh2 = Math.round(0.5 * this._h / this._wscale);
    // See if the current display should be pinned
    let cleft = this._wcx - ww2, cright = this._wcx + ww2;
    let ctop = this._wcy - wh2, cbottom = this._wcy + wh2;
    let pinnedH = (cleft < 0 && cright > this._lw);
    let pinnedV = (ctop < 0 && cbottom > this._lh);
    // Now cosnider the 'new' centre
    let left = ncx - ww2, right = ncx + ww2;
    let top = ncy - wh2, bottom = ncy + wh2;
    if (pinnedH || left < 0 && right > this._lw) // Horizontal
      ncx = this._lw / 2;
    else if (this._xor(left < 0, right > this._lw))
      if (left < 0) ncx -= left; else ncx += this._lw - right;
    if (pinnedV || top < 0 && bottom > this._lh) // vertical
      ncy = this._lh / 2;
    else if (this._xor(top < 0, bottom > this._lh))
      if (top < 0) ncy -= top; else ncy += this._lh - bottom;
    this.view(ncx, ncy);
    this._bufferInvalid = true;
  }

  /** @hidden */
  _xor(a: boolean, b: boolean): boolean {
    return (a || b) && !(a && b);
  }

  /** @hidden */
  _updateControlVisual() { // GViewer
    let b = this._buffer;
    let cs = this._scheme || this._gui.scheme();
    b.background(cs.dark_grey);
    let wscale = this._wscale;
    let wcx = this._wcx;
    let wcy = this._wcy;

    // Get corners of requested view
    let ww2 = Math.round(0.5 * this._w / wscale);
    let wh2 = Math.round(0.5 * this._h / wscale);
    this._o = this._overlap(0, 0, this._lw, this._lh, // image corners
      wcx - ww2, wcy - wh2, wcx + ww2, wcy + wh2);  // world corners
    // If we have an offset then calculate the view image 
    if (this._o.valid) {
      let o = this._o;
      // Calculate display offset
      // let dx: number = o.offsetX * wscale;
      // let dy: number = o.offsetY * wscale;
      let view;
      for (let i = 0, len = this._layers.length; i < len; i++) {
        if (!this._hidden.has(i) && this._layers[i]) {
          // Get view image
          view = this._layers[i].get(o.left, o.top, o.width, o.height);
          // Adjust image for scale
          if (Math.abs(wscale - 1) > 0.01)
            view.resize(Math.round(wscale * o.width), Math.round(wscale * o.height));
          b.image(view, o.offsetX * wscale, o.offsetY * wscale, view.width, view.height);
        }
      }
      this._usedX = view.width / wscale;
      this._scrH.used(this._usedX);
      this._usedY = view.height / wscale;
      this._scrV.used(this._usedY);
    }
  }

  /** 
   * <p>the 'a' parameters represent the image area and 'b' the view area.</p>
   * @hidden 
   */
  _overlap(ax0: number, ay0: number, ax1: number, ay1: number,
    bx0: number, by0: number, bx1: number, by1: number): Overlap {
    let topA = Math.min(ay0, ay1);
    let botA = Math.max(ay0, ay1);
    let leftA = Math.min(ax0, ax1);
    let rightA = Math.max(ax0, ax1);  // image edges
    let topB = Math.min(by0, by1);
    let botB = Math.max(by0, by1);
    let leftB = Math.min(bx0, bx1);
    let rightB = Math.max(bx0, bx1);  // world edges

    if (botA <= topB || botB <= topA || rightA <= leftB || rightB <= leftA)
      return { valid: false };

    let leftO = (leftA < leftB) ? leftB : leftA;
    let rightO = (rightA > rightB) ? rightB : rightA;
    let botO = (botA > botB) ? botB : botA;
    let topO = (topA < topB) ? topB : topA;
    let offsetX = (leftO - leftB);
    let offsetY = (topO - topB);

    return {
      valid: true,
      left: leftO, right: rightO, top: topO, bottom: botO,
      width: rightO - leftO, height: botO - topO,
      offsetX: offsetX, offsetY: offsetY,
    };
  }

  /** @hidden */
  _whereOver(px: number, py: number) {
    let w = this._w, w0 = 0.2 * w, w1 = 0.8 * w;
    let h = this._h, h0 = 0.3 * h, h1 = 0.7 * h;
    if (this._scaler && px > w0 && px < w1 && py > h0 && py < h1)
      return 2;
    if (px > 0 && px < w && py > 0 && py < h) {
      return 1;
    }
    return 0;
  }

  /** @hidden */
  shrink(dim?: string): GObject {
    console.warn("Cannot change 'shrink' a viewer");
    return this;
  }


  /** @hidden */
  orient(dir: string) {
    console.warn(`Cannot change orientation of a viewer to ${dir}`);
    return this;
  }

  /** @hidden */
  _minControlSize(): Box {
    return { w: this._w, h: this._h };
  }

}

/*
##############################################################################
 GPane
 This is the base class side panes
 ##############################################################################
 */
abstract class GPane extends GObject {

  /** @hidden */ protected _cornerRadius: number;
  /** @hidden */ protected _status: string;
  /** @hidden */ protected _timer: number;
  /** @hidden */ protected _tab: GButton;
  /** @hidden */ protected _tabstate: string;
  /** @hidden */ protected _size: number;

  // Deltas used in controlling opening and closing speeds
  /** @hidden */ static _dI = 20;
  /** @hidden */ static _dC = 40;
  /** @hidden */ static _dO = 20;

  /** @hidden */ static _wExtra = 20;
  /** @hidden */ static _tabID = 1;

  /** @hidden */
  constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
    super(gui, name, x, y, w, h);
    this._x = x;
    this._y = y;
    this._w = w;
    this._h = h;
    this._cornerRadius = 5;
    this._status = 'closed';
    this._timer = 0;
    this._Z = 128;
  }

  /**
   * <p>For panes attached to the north or south canvas edges the size is the pane height. 
   * For panes attached to the east and west it is the pane width.</p>
   * @returns the pane size
   */
  size(): number {
    return this._size;
  }

  /**
   * <p>Close this pane</p>
   * @returns this control
   */
  close() {
    switch (this._status) {
      case "opening":   // Stop existing timer
        clearInterval(this._timer);
      case "open": // now add closing timer
        this._timer = setInterval(() => { this._closing() }, GPane._dI);
        this._status = 'closing';
        break;
    }
    return this;
  }

  /**
   * <p>Close this pane</p>
   * @returns this control
   */
  open() {
    switch (this._status) {
      case "closing":   // Stop existing timer
        clearInterval(this._timer);
      case "closed": // now add opening timer
        this._gui._closeAll();
        this._timer = setInterval(() => { this._opening() }, GPane._dI);
        this._status = 'opening';
        break;
    }
  }

  /** @hidden */ abstract _opening(): void;
  /** @hidden */ abstract _closing(): void;
  /** @hidden */ abstract validateTabs(): void;

  /** @hidden */
  protected _tabAction(ta) {
    /*
    This method is called when the tab button is clicked. What 
    happens next depends on the pane status
    */
    let pane = ta.source._parent;
    switch (pane._status) {
      case 'open':
        pane.close();
        break;
      case 'closed': // closed so we want to open it
        pane.open();
        break;
      case 'opening':
        break;
      case 'closing':
        break;
    }
  }

  /** @hidden */
  _renderWEBGL() {
    let p = this._p;
    p.push();
    p.translate(this._x, this._y);
    if (this._visible && this._tabstate != 'closed') {
      let _cs = this._scheme || this._gui.scheme();
      p.noStroke();
      p.fill(_cs.black4);
      p.beginShape(p.TRIANGLE_STRIP);
      p.vertex(0, 0);
      p.vertex(0, this._h);
      p.vertex(this._w, 0);
      p.vertex(this._w, this._h);
      p.endShape();
    }
    for (let c of this._children)
      if (c._visible) c._renderWEBGL();
    p.pop();
  }

  /** @hidden */
  _renderP2D() {
    let p = this._p;
    p.push();
    p.translate(this._x, this._y);
    if (this._visible && this._tabstate != 'closed') {
      let _cs = this._scheme || this._gui.scheme();
      p.noStroke();
      p.fill(_cs.black4);
      p.rect(0, 0, this._w, this._h);
    }
    for (let c of this._children)
      if (c._visible) c._renderP2D();
    p.pop();
  }
  /**
   * <p>Sets the current text.</p>
   * <p>Processing constants are used to define the alignment.</p>
   * @param t the text toset
   * @param align LEFT, CENTER or RIGHT
   * @returns this control
   */
  text(t: string, align?: number) {
    this.tab().text(t, align);
    return this;
  }

  /**
   * <p> Removes the text from the pane tab.</p>
   * @returns this control
   */
  noText() {
    this.tab().noText();
    return this;
  }

  /**
   * <p>Sets the icon and its alignment relative to any text in the control.</p>
   * <p>Processing constants are used to define the icon alignment.</p>
   * @param i the icon to use for this control
   * @param align LEFT or RIGHT
   * @returns this control
   */
  icon(i: p5.PGraphics, align?: number) {
    this.tab().icon(i, align);
    return this;
  }

  /**
   * <p>Removes the icon from the pane tab.</p>
   * @returns this control
   */
  noIcon() {
    this.tab().noIcon();
    return this;
  }

  /**
   * <p>Sets the text size for the pane tab.</p>
   * @param ts the test size to use
   * @returns this control
   */
  textSize(ts?: number) {
    this.tab().textSize(ts);
    return this;
  }

  /**
   * <p>Shrink the pane tab to fit contents.</p>
   * <p>To shrink on one dimension only pass either 'w' (width) or 'h' 
   * (height) to indicate which dimmension to shrink</p>
   * @param dim the dimension to shrink 
   * @returns this control
   */
  shrink(dim?: string) {
    return this.tab().shrink();
  }


  /** @hidden */
  opaque(dim?: string): GObject {
    console.warn("This methis is not applicable to a pane");
    return this;
  }

  /** @hidden */
  transparent(dim?: string): GObject {
    console.warn("This methis is not applicable to a pane");
    return this;
  }

  /** @hidden */
  orient(dir: string) {
    console.warn(`Cannot change orientation of a pane}`);
    return this;
  }
  /**
   * 
   * @returns the tab button
   */
  tab() {
    return this._children[0];
  }

  /**
   * <p>Enables tab opening / closure</p>
   * @returns this control
   */
  enable() {
    this.tab().enable();
    return this;
  }

  /**
   * <p>Disables tab opening / closure</p>
   * @returns this control
   */
  disable() {
    this.close();
    this.tab().disable();
    return this;
  }

  /**
   * <p>Make this control invisible</p>
   * @returns this control
   */
  hide() {
    this.close();
    this.tab().hide();
    return this;
  }

  /**
   * <p>Make this control visible</p>
   * @returns this control
   */
  show() {
    this.tab().show();
    return this;
  }

  /** @hidden */
  _minControlSize(): Box {
    return { w: this._w, h: this._h };
  }
}


/** @hidden */
class GPaneNorth extends GPane {

  constructor(gui: GUI, name: string, size: number) {
    super(gui, name, 0, -size, gui.canvasWidth(), size);
    this._size = size;
    this._status = 'closed'; // closing opening open
    // Make the tab button 
    let tab = this._tab = this._gui.button('Tab ' + GPane._tabID++);
    tab.text(tab._name).setAction(this._tabAction);
    let s = tab._minControlSize();
    tab._w = s.w + GPane._wExtra;
    tab._c = [0, 0, this._cornerRadius, this._cornerRadius];
    this.addChild(tab);
    gui._panesNorth.push(this);
    this._gui.validateTabsNorth();
  }

  _opening() { // North
    let py = this._y + GPane._dO;
    if (py > 0) { // See if open
      py = 0;
      clearInterval(this._timer);
      this._status = 'open';
    }
    this._y = py;
  }

  _closing() { // North
    let py = this._y - GPane._dC;
    if (py < -this._size) {  // See if closed
      py = -this._size;
      clearInterval(this._timer);
      this._status = 'closed';
    }
    this._y = py;
  }

  // Called by GButton if it has updated its size/status
  validateTabs() {
    this._gui.validateTabsNorth();
    return this;
  }

}

/** @hidden */
class GPaneSouth extends GPane {

  constructor(gui: GUI, name: string, size: number) {
    super(gui, name, 0, gui.canvasHeight(), gui.canvasWidth(), size);
    this._size = size;
    this._status = 'closed'; // closing opening open
    // Make the tab button 
    let tab = this._tab = this._gui.button('Tab ' + GPane._tabID++);
    tab.text(tab._name).setAction(this._tabAction);
    let s = tab._minControlSize();
    tab._w = s.w + GPane._wExtra;
    tab._c = [this._cornerRadius, this._cornerRadius, 0, 0];
    this.addChild(tab);
    // Add this pane control to those on East side
    this._gui._panesSouth.push(this);
    this._gui.validateTabsSouth();
  }

  _opening() { // South
    let py = this._y - GPane._dO;
    if (py < this._gui.canvasHeight() - this._size) { // See if open
      py = this._gui.canvasHeight() - this._size;
      clearInterval(this._timer);
      this._status = 'open';
    }
    this._y = py;
  }

  _closing() { // South
    let py = this._y + GPane._dC;
    if (py > this._gui.canvasHeight()) {  // See if closed
      py = this._gui.canvasHeight();
      clearInterval(this._timer);
      this._status = 'closed';
    }
    this._y = py;
  }

  // Called by GButton if it has updated its size/status
  validateTabs() {
    this._gui.validateTabsSouth();
    return this;
  }
}


/** @hidden */
class GPaneEast extends GPane {

  constructor(gui: GUI, name: string, size: number) {
    super(gui, name, gui.canvasWidth(), 0, size, gui.canvasHeight());
    this._size = size;
    this._status = 'closed'; // closing opening open
    // Make the tab button 
    let tab = this._tab = this._gui.button('Tab ' + GPane._tabID++);
    tab.text(tab._name)
      .orient('north')
      .setAction(this._tabAction);
    let s = tab._minControlSize();
    tab._w = s.w + GPane._wExtra;
    tab._c = [this._cornerRadius, this._cornerRadius, 0, 0];
    this.addChild(tab);
    // Add this pane control to those on East side
    this._gui._panesEast.push(this);
    this._gui.validateTabsEast();
  }

  _opening() { // East
    let px = this._x - GPane._dO;
    if (px < this._gui.canvasWidth() - this._size) { // See if open
      px = this._gui.canvasWidth() - this._size;
      clearInterval(this._timer);
      this._status = 'open';
    }
    this._x = px;
  }

  _closing() { // East
    let px = this._x + GPane._dC;
    if (px > this._gui.canvasWidth()) {  // See if closed
      px = this._gui.canvasWidth();
      clearInterval(this._timer);
      this._status = 'closed';
    }
    this._x = px;
  }

  // Called by GButton if it has updated its size/status
  validateTabs() {
    this._gui.validateTabsEast();
    return this;
  }

}

/** @hidden */
class GPaneWest extends GPane {

  constructor(gui: GUI, name: string, size: number) {
    super(gui, name, -size, 0, size, gui.canvasHeight());
    this._size = size;
    this._status = 'closed'; // closing opening open
    // Make the tab button 
    let tab = this._tab = this._gui.button('Tab ' + GPane._tabID++);
    tab.text(tab._name)
      .orient('south')
      .setAction(this._tabAction);
    let s = tab._minControlSize();
    tab._w = s.w + GPane._wExtra;
    tab._c = [this._cornerRadius, this._cornerRadius, 0, 0];
    this.addChild(tab);
    // Add this pane control to those on East side
    this._gui._panesWest.push(this);
    this._gui.validateTabsWest();
  }

  _opening() { // West
    let px = this._x + GPane._dO;
    if (px > 0) { // See if open
      px = 0;
      clearInterval(this._timer);
      this._status = 'open';
    }
    this._x = px;
  }

  _closing() { // West
    let px = this._x - GPane._dC;
    if (px < -this._size) {  // See if closed
      px = -this._size;
      clearInterval(this._timer);
      this._status = 'closed';
    }
    this._x = px;
  }

  // Called by GButton if it has updated its size/status
  validateTabs() {
    this._gui.validateTabsWest();
    return this;
  }

}


