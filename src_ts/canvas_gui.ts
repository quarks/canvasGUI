import p5 from "../libraries/p5.min.js";
export { GUI };
export { CvsPane, CvsPaneEast, CvsPaneNorth, CvsPaneSouth, CvsPaneWest };
export { CvsBaseControl, CvsBufferedControl, CvsScroller, CvsTooltip, CvsOptionGroup };
export { CvsOption, CvsCheckbox, CvsSlider, CvsRanger, CvsButton, CvsLabel };
export { CvsViewer, CvsText, CvsTextIcon };
export { __Position, __Box, __Range, __EventInfo, __Overlap, __Scheme };

// Uncomment the above export statements 
// --- When using TypeDoc
// comment them out
// --- when transpiling ts>js


/** <p>Defines a color scheme</p> @hidden */
interface __Scheme {
  WHITE: string;
  BLACK: string;
  CLEAR: string;
}

/**
 * <p>Core class for cGUI library </p>
 * <p>Use an instance of GUI to control all aspects of your gui.</p>
 * <ul>
 * <li>Create the UI controls e.g. buttons, sliders</li>
 * <li>Provides 7 color schemes for the controls</li>
 * </ul>
 * 
 * @author Peter Lager
 * @copyright 2022
 * @license MIT
 * @version 0.0.1 alpha
 * 
 */
class GUI {
  /** @hidden */ private _renderer: any;
  /** @hidden */  public _p: p5;
  /** @hidden */ private _is3D: boolean;
  /** @hidden */ private _controls: Map<string, CvsBaseControl>;
  /** @hidden */ private _ctrls: Array<CvsBaseControl>;
  /** @hidden */ private _corners: Array<number>;
  /** @hidden */ private _optionGroups: Map<string, CvsOptionGroup>;
  /** @hidden */ private _textSize: number;
  /** @hidden */ private _tipTextSize: number;
  /** @hidden */ public _panesEast: Array<CvsPane>;
  /** @hidden */ public _panesSouth: Array<CvsPane>;
  /** @hidden */ public _panesWest: Array<CvsPane>;
  /** @hidden */ public _panesNorth: Array<CvsPane>;

  /** @hidden */ private _schemes: Array<any>;
  /** @hidden */ private _scheme: any;

  /** 
   * Create a GUI object to create and manage the GUI controls for
   * an HTML canvaas.
   * 
   * @hidden
   * @param p5c the renderer
   * @param p the sketch instance
   */
  private constructor(p5c: p5.Renderer, p: p5 = p5.instance) {
    this._renderer = p5c;
    this._p = p;
    this._is3D = false; // set when initialsing mouse event hadlers
    this._controls = new Map(); // registered controls
    this._ctrls = []; // controls in render order
    this._corners = [4, 4, 4, 4];
    this._optionGroups = new Map();
    this._textSize = 12;
    this._tipTextSize = 10;
    // Side panes
    this._panesEast = [];
    this._panesSouth = [];
    this._panesWest = [];
    this._panesNorth = [];
    // Colour schemes
    this._initColorSchemes();
    // Event handlers for canvas
    this._initMouseEventHandlers(p5c);
  }

  // ##################################################################
  // #########     Factory methods to create controls    ##############
  /**
  * Create a slider control
  * @param name unique identifier
  * @param x left-hand pixel position
  * @param y top pixel position
  * @param w width
  * @param h height
  * @returns slider control
  */
  slider(name: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsSlider(this, name, x, y, w, h));
  }

  /**
  * Create a ranger control
  * @param name unique identifier
  * @param x left-hand pixel position
  * @param y top pixel position
  * @param w width
  * @param h height
  * @returns ranger control
  */
  ranger(name: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsRanger(this, name, x, y, w, h));
  }

  /**
  * Create a button control
  * @param name unique identifier
  * @param x left-hand pixel position
  * @param y top pixel position
  * @param w width
  * @param h height
  * @returns control
  */
  button(name: string, x?: number, y?: number, w?: number, h?: number) {
    return this.addControl(new CvsButton(this, name, x, y, w, h));
  }

  /**
  * Create a checkbox control
  * @param name unique identifier
  * @param x left-hand pixel position
  * @param y top pixel position
  * @param w width
  * @param h height
  * @returns control
  */
  checkbox(name: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsCheckbox(this, name, x, y, w, h));
  }

  /**
  * Create an option (radio button) control
  * @param name 
  * @param x left-hand pixel position
  * @param y top pixel position
  * @param w width
  * @param h height
  * @returns control
  */
  option(name: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsOption(this, name, x, y, w, h));
  }

  /**
  * Create a label control
  * @param name unique identifier
  * @param x left-hand pixel position
  * @param y top pixel position
  * @param w width
  * @param h height
  * @returns button control
  */
  label(name: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsLabel(this, name, x, y, w, h));
  }

  /**
  * Create a scroller control
  * @param name unique identifier
  * @param x left-hand pixel position
  * @param y top pixel position
  * @param w width
  * @param h height
  * @returns scroller control
  */
  __scroller(name: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsScroller(this, name, x, y, w, h));
  }

  /**
  * Create a viewer
  * @param name unique identifier
  * @param x left-hand pixel position
  * @param y top pixel position
  * @param w width
  * @param h height
  * @returns viewer control
  */
  viewer(name: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsViewer(this, name, x, y, w, h));
  }

  /**
   * @hidden
   * @param name auto generated unique identifier
   * @returns tooltip control
   */
  __tooltip(name: string): CvsTooltip {
    return this.addControl(new CvsTooltip(this, name));
  }

  /**
   * Create a side pane. The pane location is either 'north', 'south',
   * 'east' or 'west'
   * @param name unique identifier
   * @param location location for the pane
   * @param size the maximum size the pane expands into the canvas
   * @returns pane control for specified location
   */
  pane(name: string, location: string, size: number): CvsPane {
    let ctrl: CvsPane;
    switch (location) {
      case 'north': ctrl = new CvsPaneNorth(this, name, size); break;
      case 'south': ctrl = new CvsPaneSouth(this, name, size); break;
      case 'west': ctrl = new CvsPaneWest(this, name, size); break;
      case 'east':
      default: ctrl = new CvsPaneEast(this, name, size);
    }
    return this.addControl(ctrl);
  }

  // ###########        End of factory methods             ############
  // ##################################################################

  // -----------------------------------------------------------------------
  // id is a control or the name of a control
  /**
   * <p>Get the control given it's unique identifier.</p>
   * @param id control's unique identifier
   * @returns  get the associated control
   */
  getControl(id: string | CvsBaseControl): CvsBaseControl {
    return (typeof id === "string") ? this._controls.get(id) : id;
  }

  /**
   * <p>Get the control given it's unique identifier.</p>
   * @param id control's unique identifier
   * @returns  get the associated control
  */
  $(id: string | CvsBaseControl): CvsBaseControl {
    return (typeof id === "string") ? this._controls.get(id) : id;
  }

  /**
   * <p>Adds a child control to this one.</p>
   * @param control the child control to add
   * @returns the control just added
   */
  addControl(control) {
    console.assert(!this._controls.has(control._name),
      `Control '${control._name}' already exists and will be replaced.`);
    this._controls.set(control._name, control);
    // Now find render order
    this._ctrls = [...this._controls.values()];
    this._ctrls.sort((a, b) => { return a.z() - b.z() });
    return control;
  }

  /**
   * List the controls created so far
   * @hidden
   */
  listControls() {
    console.log("List of controls");
    for (let c of this._ctrls) {
      console.log(c.name());
    }
    console.log('--------------------------------------------------------------');
  }

  /**
   * <p>Gets the option group associated with a given name.</p>
   * @param name the name of the oprion group
   * @returns the option group
   * @hidden
   */
  getOptionGroup(name: string): CvsOptionGroup {
    if (!this._optionGroups.has(name))
      this._optionGroups.set(name, new CvsOptionGroup(name));
    return this._optionGroups.get(name);
  }
  /**
   * <p>Sets or gets the global text size.</p>
   * <p>If no parameter is passed then the global text size is returned 
   * otherwise it returns this control.</p>
   * @param gts new global text size
   * @returns the global text size or this control
   */
  textSize(gts?: number) {
    if (!Number.isFinite(gts)) {
      return this._textSize;
    }
    this._textSize = gts;
    // Update visual for all controls
    this._controls.forEach((c) => { c.invalidateBuffer(); });
    return this;
  }

  /**
   * Sets or gets the global tip text size.
   * If no parameter is passed then the global tip text size is returned 
   * otherwise it returns this control
   * @param gtts new global tip text size
   * @returns the global tip text size or this control
   */
  tipTextSize(gtts?: number) {
    if (gtts) {
      this._tipTextSize = gtts;
      return this;
    }
    return this._tipTextSize;
  }
  /**
   * <p>Get the width of the HTML canvas tag</p>
   * @returns the width of the canvas
   */
  canvasWidth() {
    return this._renderer.width;
  }

  /**
   * <p>Get the height of the HTML canvas tag</p>
   * @returns the height of the canvas
   */
  canvasHeight() {
    return this._renderer.height;
  }

  /**
   * <p>Set or get the corner radii used for the controls</p>
   * @param c an aaray of 4 corner radii
   * @returns an array with the 4 corner radii
   */
  corners(c?: Array<number>): Array<number> {
    if (Array.isArray(c) && c.length == 4) {
      this._corners = Array.from(c);
    }
    return Array.from(this._corners);
  }
  /**
   * <p>Get the associated HTML canvas tag</p>
   * @hidden
   * @returns the renderer used by this gui
   */
  context() {
    return this._renderer;
  }
  /**
   * <p>Determines whether the renderer is P2D</p>
   * @returns true for WEBGL and false for P2D
   */
  is3D() {
    return this._is3D;
  }
  /**
   * Close all side panes
   * @hidden
   */
  _closeAll() {
    for (let pane of this._panesEast) pane.close();
    for (let pane of this._panesWest) pane.close();
    for (let pane of this._panesSouth) pane.close();
    for (let pane of this._panesNorth) pane.close();
  }
  /**
   * Hide all side panes. This will also close any pane that is open.
   */
  hideAll() {
    this._closeAll();
    for (let pane of this._panesEast) pane.hide();
    for (let pane of this._panesWest) pane.hide();
    for (let pane of this._panesSouth) pane.hide();
    for (let pane of this._panesNorth) pane.hide();
  }

  /**
   * Show all pane tabs. All panes will be shown closed.
   */
  showAll() {
    for (let pane of this._panesEast) pane.show();
    for (let pane of this._panesWest) pane.show();
    for (let pane of this._panesSouth) pane.show();
    for (let pane of this._panesNorth) pane.show();
  }

  /**
   * Reposition all tabs attached to East side 
   * @hidden
   */
  validateTabsEast() { // East
    let panes = this._panesEast, n = panes.length;
    // Find length of tabs
    let sum = 2 * (n - 1);
    panes.forEach(p => (sum += p.tab()._w));
    // Now find start position for the first tab
    let pos = (this.canvasHeight() - sum) / 2;
    for (let i = 0; i < n; i++) {
      let pane = panes[i];
      let tab = pane.tab();
      let x = -tab._h;
      let y = pos;
      pos += tab._w + 2;
      tab._x = x;
      tab._y = y;
    }
  }

  /**
   * Reposition all tabs attached to West side 
   * @hidden
   */
  validateTabsWest() { // West
    let panes = this._panesWest;
    let n = panes.length;
    // Find length of tabs
    let sum = 2 * (n - 1);
    panes.forEach(p => (sum += p.tab()._w));
    // Now find start position for the first tab
    let pos = (this.canvasHeight() - sum) / 2;
    for (let i = 0; i < n; i++) {
      let pane = panes[i];
      let tab = pane.tab();
      let x = pane.size();
      let y = pos;
      pos += tab._w + 2;
      tab._x = x;
      tab._y = y;
    }
  }

  /**
   * Reposition all tabs attached to South side 
   * @hidden
   */
  validateTabsSouth() { // South
    let panes = this._panesSouth;
    let n = panes.length;
    // Find length of tabs
    let sum = 2 * (n - 1);
    panes.forEach(p => (sum += p.tab()._w));
    // Now find start position for the first tab
    let pos = (this.canvasWidth() - sum) / 2;
    for (let i = 0; i < n; i++) {
      let pane = panes[i];
      let tab = pane.tab();
      let x = pos;
      let y = -tab._h;
      pos += tab._w + 2;
      tab._x = x;
      tab._y = y;
    }
  }

  /**
   * Reposition all tabs attached to North side 
   * @hidden
   */
  validateTabsNorth() { // North
    let panes = this._panesNorth, n = panes.length;
    // Find length of tabs
    let sum = 2 * (n - 1);
    panes.forEach(p => (sum += p.tab()._w));
    // Now find start position for the first tab
    let pos = (this.canvasWidth() - sum) / 2;
    for (let i = 0; i < n; i++) {
      let pane = panes[i], tab = pane.tab();
      let x = pos, y = pane.size();
      pos += tab._w + 2;
      tab._x = x;
      tab._y = y;
    }
  }

  private _initColorSchemes() {
    this._schemes = [];
    this._schemes['blue'] = new BlueScheme();
    this._schemes['green'] = new GreenScheme();
    this._schemes['red'] = new RedScheme();
    this._schemes['cyan'] = new CyanScheme();
    this._schemes['yellow'] = new YellowScheme();
    this._schemes['purple'] = new PurpleScheme();
    this._schemes['orange'] = new OrangeScheme();
    this._scheme = this._schemes['blue'];
  }

  /**
     * <p>Set or get an existing global color scheme.</p>
     * @param schemename color scheme to set
     * @returns this gui instance
     */
  scheme(schemename?: string): __Scheme | GUI {
    // get global scheme
    if (!schemename) {
      return this._scheme;
    }
    // set global scheme and invalidate any controls using the global scheme
    if (this._schemes[schemename]) {
      this._scheme = this._schemes[schemename];
      // Update visual for all these using the global color scheme
      this._controls.forEach((c) => {
        if (!c.scheme())
          c.invalidateBuffer();
      });
    }
    else
      console.error(`'${schemename}' is not a valid color scheme`);
    return this;
  }

  /**
   * <p>Get a copy of the named color scheme.</p>
   * @param schemename the color scheme name
   * @returns the color scheme or undefined if it doesn't exist
   */
  getScheme(schemename: string): __Scheme | undefined {
    if (schemename && this._schemes[schemename])
      return Object.assign({}, this._schemes[schemename]);
    console.warn(`Unable to retrieve color scheme '${schemename}'`);
    return undefined;
  }

  /**
   * <p>Adds a new color scheme to those already available. It does not replace an
   * existing scheme.</p>
   * @param schemename the name of the color schmem
   * @param scheme  the color scheme
   * @returns this gui instance
   */
  addScheme(schemename: string, scheme: __Scheme) {
    if (typeof schemename === 'string' && !scheme) {
      if (!this._schemes[schemename])
        this._schemes[schemename] = scheme;
      else
        console.error(`Cannot add scheme '${schemename}' because it already exists.'`);
    }
    return this;
  }

  /**
   * Adds event listeners to the HTML canvas object. It also sets the draw method
   * based on whether the render is WEBGL or P2D
   * @hidden
   * @param p5c p5.Renderer
   */
  private _initMouseEventHandlers(p5c: p5.Renderer) {
    let canvas = p5c.canvas;
    // Add mouse events
    canvas.addEventListener('mousemove', (e) => { this._handleMouseEvents(e) });
    canvas.addEventListener('mousedown', (e) => { this._handleMouseEvents(e) });
    canvas.addEventListener('mouseup', (e) => { this._handleMouseEvents(e) });
    canvas.addEventListener('wheel', (e) => { this._handleMouseEvents(e) });
    // Leave canvas
    canvas.addEventListener('mouseout', (e) => { this._handleMouseEvents(e) });
    // Initialise draw method based on P2D or WEBGL renderer
    this._is3D = p5c.GL != undefined && p5c.GL != null;
    this.draw = this._is3D ? this._drawControlsWEBGL : this._drawControlsP2D;
  }

  /**
   * Called by the mouse event listeners
   * @hidden
   * @param e event
   */
  private _handleMouseEvents(e) {
    // Find the currently active control and pass the evnt to it
    let activeControl = undefined;
    for (let c of this._ctrls) {
      if (c.isActive()) {
        activeControl = c;
        c._handleMouse(e);
        break;
      }
    }
    // If there is no active control pass the event to each enabled control in 
    // turn until one of them consumes the event
    if (activeControl == undefined) {
      for (let c of this._ctrls)
        if (c.isEnabled())
          c._handleMouse(e);
    }
  }

  /**
   * The main draw method.
   * @hidden
   */
  draw() { }

  /**
   * The P2D draw method
   * @hidden
   */
  _drawControlsP2D() {
    this._p.push();
    for (let c of this._ctrls)
      if (!c.getParent())
        c._renderP2D();
    this._p.pop();
  }

  /**
   * The WEBGL draw method
   * @hidden
   */
  _drawControlsWEBGL() {
    this._p.push();
    let renderer = this._renderer;
    let gl = renderer.drawingContext;
    let w = renderer.width, h = renderer.height, d = Number.MAX_VALUE;
    gl.flush();
    let mvMatrix = renderer.uMVMatrix.copy();
    let pMatrix = renderer.uPMatrix.copy();
    // Now prepare renderer for standard 2D output to draw GUI
    gl.disable(gl.DEPTH_TEST);
    renderer.resetMatrix();
    renderer._curCamera.ortho(0, w, -h, 0, -d, d);
    // Draw GUI
    for (let c of this._ctrls)
      if (!c.getParent())
        c._renderWEBGL();
    gl.flush();
    renderer.uMVMatrix.set(mvMatrix);
    renderer.uPMatrix.set(pMatrix);
    gl.enable(gl.DEPTH_TEST);
    this._p.pop();
  }

  // ##################################################################################
  // ##################################################################################
  // Class methods and attributes
  // ##################################################################################
  // ##################################################################################

  /**
   * <p>Creates and returns a GUI controller for a given canvas elelment.</p>
   * @param p5c 
   * @param p 
   * @returns a GUI controller
   */
  static get(p5c: p5.Renderer, p: p5 = p5.instance) {
    GUI.announce();
    if (GUI._guis.has(p)) return GUI._guis.get(p);

    let gui = new GUI(p5c, p);
    GUI._guis.set(p, gui);
    return gui;
  }

  private static _guis = new Map();
  private static _announced = false;

  /**
   * @hidden
   */
  static announce() {
    if (!GUI._announced) {
      console.log('================================================');
      console.log('  canvasGUI (0.0.1)   \u00A9 2022 Peter Lager');
      console.log('================================================');
      GUI._announced = true;
    }
  }

}

class BaseScheme {
  constructor() {
    this['WHITE'] = 'rgb(255, 255, 255)';
    this['BLACK'] = 'rgb(0, 0, 0)';
    this['CLEAR'] = 'rgba(0, 0, 0, 0)';
    for (let i = 0; i < 10; i++) {
      this[`GREY_${i}`] = `hsb(0,0%,${90 - i * 6}%)`;
    }
    for (let i = 0; i < 10; i++) {
      this[`TINT_${i}`] = `rgba(10,0,0,${i * 0.1})`;
    }
  }

  _colors(h: number, s0: number = 40, s1: number = 70, b: number = 100) {
    let cn = 0, i: number;
    for (i = 0; i <= 4; ++i) {
      this[`COLOR_${cn++}`] = `hsba(${h}, ${s0}%, ${b}%, ${0.6 + i * 0.1})`;
    }
    for (let i = 0; i <= 3; ++i) {
      this[`COLOR_${cn++}`] = `hsb(${h}, ${s0}%, ${100 - i * 10}%)`;
    }
    for (let i = 0; i <= 5; ++i) {
      this[`COLOR_${cn++}`] = `hsb(${h}, ${s1}%, ${100 - i * 12}%)`;
    }
  }

}

class BlueScheme extends BaseScheme {
  constructor() {
    super();
    this._colors(240);
  }
}

class GreenScheme extends BaseScheme {
  constructor() {
    super();
    this._colors(120);
  }
}

class RedScheme extends BaseScheme {
  constructor() {
    super();
    this._colors(0);
  }
}
class CyanScheme extends BaseScheme {
  constructor() {
    super();
    this._colors(180);
  }
}
class YellowScheme extends BaseScheme {

  constructor() {
    super();
    this._colors(60);
  }
}

class PurpleScheme extends BaseScheme {

  constructor() {
    super();
    this._colors(300);
  }

}

class OrangeScheme extends BaseScheme {

  constructor() {
    super();
    this._colors(30);
  }
}

//=================================================================================================
//=================================================================================================
//=================================================================================================
//=================================================================================================
//                                Controls
//=================================================================================================
//=================================================================================================
//=================================================================================================
//=================================================================================================


/** <p>Object type  \{ x: number; y: number; \} </p> @hidden */
interface __Position { x: number; y: number; }
/** <p>Object type  \{ w: number; h: number; \} </p> @hidden */
interface __Box { w: number; h: number; }
/** <p>Object type  \{ low: number; high: number; \} </p> @hidden */
interface __Range { low: number; high: number; }
/** <p>Defines the event information sent to the event handler.</p> @hidden */
interface __EventInfo { source: CvsBaseControl; type: string; }
/** <p>Defines an overlap</p> @hidden */
interface __Overlap {
  valid: boolean;
  left?: number; right?: number; top?: number, bottom?: number,
  width?: number; height?: number; offsetX?: number; offsetY?: number;
}

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

class OrientNorth {

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

class OrientSouth {

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

class OrientEast {

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

class OrientWest {

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
  /** @hidden */ protected _children: Array<any>;
  /** @hidden */ protected _parent: CvsBaseControl | CvsPane;
  /** @hidden */ protected _visible: boolean;
  /** @hidden */ protected _enabled: boolean;
  /** @hidden */ protected _Z: number;
  /** @hidden */ protected _x: number = 0;
  /** @hidden */ protected _y: number = 0;
  /** @hidden */ protected _w: number = 0;
  /** @hidden */ protected _h: number = 0;
  /** @hidden */ protected _orientation: OrientNorth | OrientSouth | OrientEast | OrientWest;
  /** @hidden */ protected _dragging: boolean;
  /** @hidden */ protected _buffer: p5.Renderer;
  /** @hidden */ protected _over: number;
  /** @hidden */ protected _pover: number;
  /** @hidden */ protected _clickAllowed: boolean;
  /** @hidden */ protected _c: Array<number>;
  /** @hidden */ protected _active: boolean;
  /** @hidden */ protected _opaque: boolean;
  /** @hidden */ protected _tooltip: CvsTooltip;
  /** @hidden */ protected _scheme: __Scheme;
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
   * Creates an instance of CvsBaseControl.
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
   * CvsBaseControl class
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
    this._orientation = CvsBaseControl.EAST;
    this._dragging = false; // is mouse being dragged on active control
    this._bufferInvalid = true;
    this._over = 0;
    this._pover = 0;
    this._clickAllowed = false;
    this._c = gui.corners(undefined);
    this._active = false;
    this._opaque = true;
    this.setAction((info?: __EventInfo) => {
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
      this._scheme = this._gui.getScheme(id);
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
   * <p>Add a child to this control using its relative position [rx, ry]
   * If rx and ry are not provided then it assumes these values are 
   * already set in the child.</p>
   * @param c is the actual control or its name
   * @returns this control
   */
  addChild(c: CvsBaseControl | string, rx?: number, ry?: number): any {
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
  removeChild(c: CvsBaseControl | string) {
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
  parent(parent: CvsBaseControl, rx?: number, ry?: number): CvsBaseControl {
    if (parent)
      parent.addChild(this, rx, ry);
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
  enable(cascade?: boolean): CvsBaseControl {
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

  /** @hidden */
  _whereOver(px: number, py: number): number {
    if (px > 0 && px < this._w && py > 0 && py < this._h) {
      return 1;
    }
    return 0;
  }

  /** @hidden */
  _minControlSize(): __Box { return null; }

  /**
   * <p>This method ensures we have a buffer of the correct size for the control</p>
   * @hidden
   */
  _validateBuffer() {
    let b = this._buffer;
    if (b.width != this._w || b.height != this._h) {
      this._buffer = this._p.createGraphics(this._w, this._h);
      this.invalidateBuffer(); // Force a redarw of the buffer
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
    b.fill(cs['TINT_7']);
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

  /** @hidden */
  _updateControlVisual(): void { }

  /** @hidden */
  _handleMouse(e: __EventInfo): boolean { return true; };

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
  limits(l0: number, l1: number): CvsSlider {
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
   * @returns {CvsBaseControl} this slider object
   */
  ticks(major: number, minor: number, stick2ticks?: boolean): CvsBaseControl {
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
  value(v?: number): CvsBaseControl | number {
    if (Number.isFinite(v)) {
      if ((v - this._limit0) * (v - this._limit1) <= 0) {
        this.invalidateBuffer();
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
  _handleMouse(e: __EventInfo) { //    CvsSlider
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
          this.invalidateBuffer();
        }
        break;
      case 'mouseout':
      case 'mouseup':
        if (this._active) {
          this.action({ source: this, p5Event: e, value: this.value(), final: true });
          this._active = false;
          this.invalidateBuffer();
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
          this.invalidateBuffer();
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
  _updateControlVisual(): void { // CvsSlider
    let b = this._buffer;
    let cs = this._scheme || this._gui.scheme();
    let tw = b.width - 20, trackW = 8, thumbSize = 12, majorT = 10, minorT = 7;

    const OPAQUE = cs['COLOR_3'];
    const TICKS = cs['GREY_8'];
    const UNUSED_TRACK = cs['GREY_1'];
    const USED_TRACK = cs['GREY_4'];
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
  range(v0?: number, v1?: number): CvsBaseControl | __Range {
    if (!v0 || !v1)
      return { low: Math.min(v0, v1), high: Math.max(v0, v1) };
    let t0 = this._norm01(v0);
    let t1 = this._norm01(v1);
    this._bufferInvalid = (this._t[0] != t0) || (this._t[1] != t1);
    this._t[0] = Math.min(t0, t1); this._t[1] = Math.max(t0, t1);
    return this;
  }

  /** @hidden */
  value(v?: number): number | CvsBaseControl {
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
  _handleMouse(e: __EventInfo) { //    CvsRanger
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
          this.invalidateBuffer();
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
          this.invalidateBuffer();
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
          this.invalidateBuffer();
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
  _updateControlVisual() { // CvsRanger
    let b = this._buffer;
    let cs = this._scheme || this._gui.scheme();
    let tw = b.width - 20;
    let trackW = 8, thumbSize = 12, majorT = 10, minorT = 7;

    const OPAQUE = cs['COLOR_3'];
    const TICKS = cs['GREY_8'];
    const UNUSED_TRACK = cs['GREY_1'];
    const USED_TRACK = cs['GREY_4'];
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

  /** @hidden */ protected _lines: Array<string>;
  /** @hidden */ protected _text: string;
  /** @hidden */ protected _textSize: number;
  /** @hidden */ protected _textAlign: number;
  /** @hidden */ protected _tbox: __Box;
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
    if (align && (align == this._p.LEFT || align == this._p.CENTER || align == this._p.RIGHT))
      this._textAlign = align;
    return this;
  }

  /**
   * <p>Renoves any text that the control might use ti  display itself.</p>
   * 
   * @returns this control
   */
  noText(): CvsBaseControl {
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
    this.invalidateBuffer();
    return this;
  }

  /**
   * 
   * @returns this control
   */
  noIcon() {
    this._icon = undefined;
    this._iconAlign = this._p.LEFT;
    this.invalidateBuffer();
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
  _handleMouse(e: __EventInfo) { // button
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
          this.invalidateBuffer();
          eventConsumed = true;
        }
        break;
      case 'mouseout':
      case 'mouseup':
        if (this._active) {
          if (this._clickAllowed) {
            this.action({ source: this, p5Event: e });
          }
          this._over = 0;
          this._clickAllowed = false;
          this._dragging = false;
          this._active = false;
          this.invalidateBuffer();
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
   * <p>Make this checkbox false>/p>
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
  _handleMouse(e: __EventInfo) { // CvsCheckbox
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
          this.invalidateBuffer();
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
          this.invalidateBuffer();
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
  _handleMouse(e: __EventInfo) { // CvsOption
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
          this.invalidateBuffer();
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
        this.invalidateBuffer();
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


/*
##############################################################################
 CvsTooltip
 A box containing some text and/or icon
 ##############################################################################

 @hidden 
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
  _whereOver(px: number, py: number) {
    let tx = this._BORDER + this._dvalue * this._TLENGTH;
    let ty = this._h / 2;
    let thumbSizeX = Math.max(this._used * this._TLENGTH, this._MIN_THUMB_WIDTH);
    if (Math.abs(tx - px) <= thumbSizeX / 2 && Math.abs(ty - py) <= this._THUMB_HEIGHT / 2) {
      return 1;
    }
    return 0;
  }

  /** @hidden */
  _handleMouse(e: __EventInfo) { //    CvsScroller
    let eventConsumed: boolean = false;
    let pos = this.getAbsXY();
    let mx = this._p.mouseX - pos.x;
    let my = this._p.mouseY - pos.y;
    let r = this._orientation.xy(mx, my, this._w, this._h);
    mx = r.x;
    my = r.y;
    this._pover = this._over;                 // Store previous mouse over state
    this._over = this._whereOver(mx, my);     // Store current mouse over state
    //this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
    if (this._pover != this._over) this.invalidateBuffer();
    if (this._tooltip) this._tooltip._updateState(this._pover, this._over);

    switch (e.type) {
      case 'mousedown':
        if (this._over > 0) {
          this._active = true;
          this._s_value = this._value;
          this._s_mx = mx;
          this.invalidateBuffer();
        }
        break;
      case 'mouseout':
      case 'mouseup':
        if (this._active) {
          this.action({ source: this, p5Event: e, value: this._value, used: this._used, final: true });
          this._active = false;
          this.invalidateBuffer();
          eventConsumed = true;
        }
        break;
      case 'mousemove':
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
    return eventConsumed;
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


/*
 ##############################################################################
 CvsViewer
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
class CvsViewer extends CvsBufferedControl {

  /** @hidden */ protected _layers: Array<p5.Graphics> = [];
  /** @hidden */ protected _hidden: Set<number> = new Set();
  /** @hidden */ protected _lw: number = 0;
  /** @hidden */ protected _lh: number = 0;
  /** @hidden */ protected _wcx: number = 0;
  /** @hidden */ protected _wcy: number = 0;
  /** @hidden */ protected _wscale: number = 1;
  /** @hidden */ protected _usedX: number = 0;
  /** @hidden */ protected _usedY: number = 0;
  /** @hidden */ protected _o: __Overlap = { valid: false };
  /** @hidden */ protected _scrH: CvsScroller;
  /** @hidden */ protected _scrV: CvsScroller;
  /** @hidden */ protected _scaler: CvsSlider;
  /** @hidden */ protected _mx0: number;
  /** @hidden */ protected _my0: number;
  /** @hidden */ protected _dcx: number;
  /** @hidden */ protected _dcy: number;
  /** @hidden */ protected _pmx: number;
  /** @hidden */ protected _pmy: number;

  /** @hidden */
  constructor(gui: GUI, name: string, x: number, y: number, w: number, h: number) {
    super(gui, name, x, y, w, h);

    this._scrH = gui.__scroller(this._name + "-scrH", 0, h - 20, w, 20).hide()
      .setAction((info) => {
        this.view(info.value * this._lw, this._wcy);
        this.invalidateBuffer();
      });

    this._scrV = gui.__scroller(this._name + "-scrV", w - 20, 0, h, 20).orient('south').hide()
      .setAction((info) => {
        this.view(this._wcx, info.value * this._lh);
        this.invalidateBuffer();
      });
    this.addChild(this._scrH);
    this.addChild(this._scrV);
  }

  /**
   * <p>Sets the existing scaler value (if there is no scaler it will be created)
   * and limits. The initial value will be constrained to the limits.</p>
   * @param v the scale to use
   * @param l0 the lowest scale allowed
   * @param l1  the highest scale allowed
   * @returns this control
   */
  scaler(v: number, l0: number, l1: number) {
    if (Number.isFinite(v) && Number.isFinite(l0) && Number.isFinite(l1)) {
      let low = Math.min(l0, l1);
      let high = Math.max(l0, l1);
      let value = this._p.constrain(v, low, high);
      // If we don't have a scaler then create it
      if (!this._scaler) {
        this._scaler = this._gui.slider(this._name + "-scaler",
          0.25 * this._w, 0.5 * this._h - 10, 0.5 * this._w, 20)
          .hide()
          .setAction((info) => {
            this.scale(info.value);
            this.invalidateBuffer();
          });
        this.addChild(this._scaler);
      }
      // Now update the scroller
      this._scaler.limits(low, high);
      this._scaler.value(value);
      this._wscale = value;
      // If we already have layers then update centre position
      if (this._lw > 0 && this._lh > 0) {
        this._wcx = this._lw * this._scrH.getValue();
        this._wcy = this._lh * this._scrV.getValue();
        this.invalidateBuffer();
      }
    }
    return this;
  }


  /** 
   * <p>Sets or gets the scale and or scale limits</p>
   * <p>If no parameters are passed the the current scale is returned. A
   * single parameter sets the current scale and three parameter sets the 
   * current scale and the limits for the zoom slider.</p>
   * 
   * @param v the scale to use
   * @returns this control or the current scale
   */
  scale(v: number) {
    if (!Number.isFinite(v)) // no parameters
      return this._wscale;

    if (this._scaler) this._scaler.value(v);
    this._wscale = v;
    this.view(this._wcx, this._wcy, this._wscale);

    this.invalidateBuffer();
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
        this.invalidateBuffer();
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
        this.invalidateBuffer();
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
        this._scrH.update(wcx / this._lw);
        this._scrV.update(wcy / this._lh);
        this.invalidateBuffer();
      }
      if (this._neq(this._wscale, wscale)) {
        this._wscale = wscale;
        if (this._scaler) this._scaler.value(wscale);
        this.invalidateBuffer();
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
    // Now set the world centre based on scrollers
    this._wcx = this._scrH.getValue() * this._lw;
    this._wcy = this._scrV.getValue() * this._lh;
    this.invalidateBuffer();
    return this;
  }

  /** @hidden */
  _handleMouse(e: __EventInfo) { // viewer
    let eventConsumed: boolean = false;
    let pos = this.getAbsXY();
    let mx = this._p.mouseX - pos.x;
    let my = this._p.mouseY - pos.y;

    this._pover = this._over;                 // Store previous mouse over state
    this._over = this._whereOver(mx, my);     // Store current mouse over state
    this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
    if (this._tooltip) this._tooltip._updateState(this._pover, this._over);

    // Hide scaler unless mouse is close to centre
    if (this._scaler) this._over == 2 ? this._scaler.show() : this._scaler.hide();
    if (this._over >= 1) {
      this._scrH.getUsed() < 1 ? this._scrH.show() : this._scrH.hide();
      this._scrV.getUsed() < 1 ? this._scrV.show() : this._scrV.hide();
    }
    else {
      this._scrH.hide();
      this._scrV.hide();
    }

    switch (e.type) {
      case 'mousedown':
        if (this._over == 1) {
          // Use these to see if there is movement between mouseDown and mouseUp
          this._clickAllowed = false;
          this._dragging = true;
          this._active = true;
          this.invalidateBuffer();
          // Remember starting values
          this._mx0 = this._pmx = mx;
          this._my0 = this._pmy = my;
          this._dcx = this._wcx;
          this._dcy = this._wcy;
        }
        break;
      case 'mouseout':
        if (this._active) {
          this._over = 0;
          this._clickAllowed = false;
          this._dragging = false;
          this._active = false;
          this.invalidateBuffer();
        }
      case 'mouseup':
        if (this._active) {
          this._dragging = false;
          this._active = false;
          this.invalidateBuffer();
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
    this.invalidateBuffer();
  }

  /** @hidden */
  _xor(a: boolean, b: boolean): boolean {
    return (a || b) && !(a && b);
  }

  /** @hidden */
  _updateControlVisual() { // CvsViewer
    let b = this._buffer;
    let cs = this._scheme || this._gui.scheme();
    b.background(cs['GREY_5']);
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
    }
  }

  /** 
   * <p>the 'a' parameters represent the image size i.e. [0, 0, image_width, imgaeHeight]
   * and 'b' the view area taking into account scaling.</p>
   * @hidden 
   */
  _overlap(ax0: number, ay0: number, ax1: number, ay1: number,
    bx0: number, by0: number, bx1: number, by1: number): __Overlap {
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

    let leftO = leftA < leftB ? leftB : leftA;
    let rightO = rightA > rightB ? rightB : rightA;
    let botO = botA > botB ? botB : botA;
    let topO = topA < topB ? topB : topA;
    let width = rightO - leftO;
    let height = botO - topO;
    let offsetX = leftO - leftB;
    let offsetY = topO - topB;
    // Update scrollers
    this._scrH.update(undefined, width / this._lw);
    this._scrV.update(undefined, height / this._lh);

    return { valid: true,
      left: leftO, right: rightO, top: topO, bottom: botO,
      width: width, height: height,
      offsetX: offsetX, offsetY: offsetY,
    };
  }

  /** @hidden */
  _whereOver(px: number, py: number) {
    if (px > this._w - 20 && px < this._w && py > 0 && py < this._h - 20)
      return 3;   // over vertical scroller
    if (px > 0 && px < this._w - 20 && py > this._h - 20 && py < this._h)
      return 3;   // over horizontal scroller
    let w = this._w, w0 = 0.2 * w, w1 = 0.8 * w;
    let h = this._h, h0 = 0.35 * h, h1 = 0.65 * h;
    if (this._scaler && px > w0 && px < w1 && py > h0 && py < h1)
      return 2; //over slider make visible area
    if (px > 0 && px < w && py > 0 && py < h)
      return 1;
    return 0;
  }

  /** @hidden */
  shrink(dim?: string): CvsBaseControl {
    console.warn("Cannot change 'shrink' a viewer");
    return this;
  }


  /** @hidden */
  orient(dir: string) {
    console.warn(`Cannot change orientation of a viewer to ${dir}`);
    return this;
  }

  /** @hidden */
  _minControlSize(): __Box {
    return { w: this._w, h: this._h };
  }
}

/*
##############################################################################
 CvsPane
 This is the base class side panes
 ##############################################################################
 */
abstract class CvsPane extends CvsBaseControl {

  /** @hidden */ protected _cornerRadius: number;
  /** @hidden */ protected _status: string;
  /** @hidden */ protected _timer: number;
  /** @hidden */ protected _tab: CvsButton;
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
        this._timer = setInterval(() => { this._closing() }, CvsPane._dI);
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
        this._timer = setInterval(() => { this._opening() }, CvsPane._dI);
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
      let cs = this._scheme || this._gui.scheme();
      p.noStroke();
      p.fill(cs['TINT_6']);
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
      let cs = this._scheme || this._gui.scheme();
      p.noStroke();
      p.fill(cs['TINT_6']);
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
  opaque(dim?: string): CvsBaseControl {
    console.warn("This methis is not applicable to a pane");
    return this;
  }

  /** @hidden */
  transparent(dim?: string): CvsBaseControl {
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
  _minControlSize(): __Box {
    return { w: this._w, h: this._h };
  }
}


/** @hidden */
class CvsPaneNorth extends CvsPane {

  constructor(gui: GUI, name: string, size: number) {
    super(gui, name, 0, -size, gui.canvasWidth(), size);
    this._size = size;
    this._status = 'closed'; // closing opening open
    // Make the tab button 
    let tab = this._tab = this._gui.button('Tab ' + CvsPane._tabID++);
    tab.text(tab._name).setAction(this._tabAction);
    let s = tab._minControlSize();
    tab._w = s.w + CvsPane._wExtra;
    tab._c = [0, 0, this._cornerRadius, this._cornerRadius];
    this.addChild(tab);
    gui._panesNorth.push(this);
    this._gui.validateTabsNorth();
  }

  _opening() { // North
    let py = this._y + CvsPane._dO;
    if (py > 0) { // See if open
      py = 0;
      clearInterval(this._timer);
      this._status = 'open';
    }
    this._y = py;
  }

  _closing() { // North
    let py = this._y - CvsPane._dC;
    if (py < -this._size) {  // See if closed
      py = -this._size;
      clearInterval(this._timer);
      this._status = 'closed';
    }
    this._y = py;
  }

  // Called by CvsButton if it has updated its size/status
  validateTabs() {
    this._gui.validateTabsNorth();
    return this;
  }

}

/** @hidden */
class CvsPaneSouth extends CvsPane {

  constructor(gui: GUI, name: string, size: number) {
    super(gui, name, 0, gui.canvasHeight(), gui.canvasWidth(), size);
    this._size = size;
    this._status = 'closed'; // closing opening open
    // Make the tab button 
    let tab = this._tab = this._gui.button('Tab ' + CvsPane._tabID++);
    tab.text(tab._name).setAction(this._tabAction);
    let s = tab._minControlSize();
    tab._w = s.w + CvsPane._wExtra;
    tab._c = [this._cornerRadius, this._cornerRadius, 0, 0];
    this.addChild(tab);
    // Add this pane control to those on East side
    this._gui._panesSouth.push(this);
    this._gui.validateTabsSouth();
  }

  _opening() { // South
    let py = this._y - CvsPane._dO;
    if (py < this._gui.canvasHeight() - this._size) { // See if open
      py = this._gui.canvasHeight() - this._size;
      clearInterval(this._timer);
      this._status = 'open';
    }
    this._y = py;
  }

  _closing() { // South
    let py = this._y + CvsPane._dC;
    if (py > this._gui.canvasHeight()) {  // See if closed
      py = this._gui.canvasHeight();
      clearInterval(this._timer);
      this._status = 'closed';
    }
    this._y = py;
  }

  // Called by CvsButton if it has updated its size/status
  validateTabs() {
    this._gui.validateTabsSouth();
    return this;
  }
}


/** @hidden */
class CvsPaneEast extends CvsPane {

  constructor(gui: GUI, name: string, size: number) {
    super(gui, name, gui.canvasWidth(), 0, size, gui.canvasHeight());
    this._size = size;
    this._status = 'closed'; // closing opening open
    // Make the tab button 
    let tab = this._tab = this._gui.button('Tab ' + CvsPane._tabID++);
    tab.text(tab._name)
      .orient('north')
      .setAction(this._tabAction);
    let s = tab._minControlSize();
    tab._w = s.w + CvsPane._wExtra;
    tab._c = [this._cornerRadius, this._cornerRadius, 0, 0];
    this.addChild(tab);
    // Add this pane control to those on East side
    this._gui._panesEast.push(this);
    this._gui.validateTabsEast();
  }

  _opening() { // East
    let px = this._x - CvsPane._dO;
    if (px < this._gui.canvasWidth() - this._size) { // See if open
      px = this._gui.canvasWidth() - this._size;
      clearInterval(this._timer);
      this._status = 'open';
    }
    this._x = px;
  }

  _closing() { // East
    let px = this._x + CvsPane._dC;
    if (px > this._gui.canvasWidth()) {  // See if closed
      px = this._gui.canvasWidth();
      clearInterval(this._timer);
      this._status = 'closed';
    }
    this._x = px;
  }

  // Called by CvsButton if it has updated its size/status
  validateTabs() {
    this._gui.validateTabsEast();
    return this;
  }

}

/** @hidden */
class CvsPaneWest extends CvsPane {

  constructor(gui: GUI, name: string, size: number) {
    super(gui, name, -size, 0, size, gui.canvasHeight());
    this._size = size;
    this._status = 'closed'; // closing opening open
    // Make the tab button 
    let tab = this._tab = this._gui.button('Tab ' + CvsPane._tabID++);
    tab.text(tab._name)
      .orient('south')
      .setAction(this._tabAction);
    let s = tab._minControlSize();
    tab._w = s.w + CvsPane._wExtra;
    tab._c = [this._cornerRadius, this._cornerRadius, 0, 0];
    this.addChild(tab);
    // Add this pane control to those on East side
    this._gui._panesWest.push(this);
    this._gui.validateTabsWest();
  }

  _opening() { // West
    let px = this._x + CvsPane._dO;
    if (px > 0) { // See if open
      px = 0;
      clearInterval(this._timer);
      this._status = 'open';
    }
    this._x = px;
  }

  _closing() { // West
    let px = this._x - CvsPane._dC;
    if (px < -this._size) {  // See if closed
      px = -this._size;
      clearInterval(this._timer);
      this._status = 'closed';
    }
    this._x = px;
  }

  // Called by CvsButton if it has updated its size/status
  validateTabs() {
    this._gui.validateTabsWest();
    return this;
  }

}



