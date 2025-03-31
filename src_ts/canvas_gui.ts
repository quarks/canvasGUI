const CANVAS_GUI_VERSION: string = '!!VERSION!!';

/** <p>Defines a color scheme</p>  */
interface __Scheme {
  WHITE: string;
  BLACK: string;
  CLEAR: string;
}

/**
 * <p>Core class for the canvasGUI library </p>
 * <p>Use an instance of GUI (the controller) to control all aspects of your gui.</p>
 * <ul>
 * <li>Create the UI controls e.g. buttons, sliders</li>
 * <li>Provides 7 color schemes for the controls</li>
 * </ul>
 * 
 */
class GUI {
  /** @hidden */ private _renderer: any;
  /** @hidden */ public _p: p5;
  /** @hidden */ private _is3D: boolean;
  /** @hidden */ public _name: string;

  /** @hidden */ private _touchEventsEnabled = false; // 0.9.5
  /** @hidden */ private _mouseEventsEnabled = false;  // 0.9.4
  /** @hidden */ private _keyEventsEnabled = false;
  /** @hidden */ private _eventsAllowed = true;
  /** @hidden */ public _target: HTMLElement;
  /** @hidden */ public _canvas: HTMLElement;

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
  /** @hidden */ public _links: Map<number, CvsTextField>;

  /** @hidden */ private _visible = true;
  /** @hidden */ private _enabled = true;

  /** 
   * Create a GUI object to create and manage the GUI controls for
   * an HTML canvas.
   * 
   * @hidden
   * @param p5c the renderer
   * @param p the sketch instance
   */
  private constructor(p5c: p5.Renderer, p: p5 = p5.instance) {
    this._renderer = p5c;
    this._canvas = p5c.canvas;
    this._target = document.getElementById(p5c.canvas.id);  // for keyboard events
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

    // Event handlers for canvas
    this._initColorSchemes();
    this._addFocusHandlers();
    this._addMouseEventHandlers();
    this._addTouchEventHandlers();

    // Choose 2D / 3D rendering methods
    this._selectDrawMethod();
  }

  // ##################################################################
  // #########     Factory methods to create controls    ##############
  /**
  * Create a slider control
  * @param name unique name for this control
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
  * @param name unique name for this control
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
  * @param name unique name for this control
  * @param x left-hand pixel position
  * @param y top pixel position
  * @param w width
  * @param h height
  * @returns a button
  */
  button(name: string, x?: number, y?: number, w?: number, h?: number) {
    return this.addControl(new CvsButton(this, name, x, y, w, h));
  }

  /**
  * Create a single line text input control
  * @param name unique name for this control
  * @param x left-hand pixel position
  * @param y top pixel position
  * @param w width
  * @param h height
  * @returns a textfield
  */
  textfield(name: string, x?: number, y?: number, w?: number, h?: number) {
    this._addKeyEventHandlers();
    return this.addControl(new CvsTextField(this, name, x, y, w, h));
  }

  /**
  * Create a checkbox control
  * @param name unique name for this control
  * @param x left-hand pixel position
  * @param y top pixel position
  * @param w width
  * @param h height
  * @returns a checkbox
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
  * @returns an option button
  */
  option(name: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsOption(this, name, x, y, w, h));
  }

  /**
  * Create a label control
  * @param name unique name for this control
  * @param x left-hand pixel position
  * @param y top pixel position
  * @param w width
  * @param h height
  * @returns a label
  */
  label(name: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsLabel(this, name, x, y, w, h));
  }

  /**
  * Create a scroller control
  * @param name unique name for this control
  * @param x left-hand pixel position
  * @param y top pixel position
  * @param w width
  * @param h height
  * @returns scroller control
  * @hidden
  */
  __scroller(name: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsScroller(this, name, x, y, w, h));
  }

  /**
  * Create a viewer
  * @param name unique name for this control
  * @param x left-hand pixel position
  * @param y top pixel position
  * @param w width
  * @param h height
  * @returns an image viewer
  */
  viewer(name: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsViewer(this, name, x, y, w, h));
  }

  /**
   * @hidden
   * @param name auto generated unique name from parent control
   * @returns tooltip control
   */
  __tooltip(name: string): CvsTooltip {
    return this.addControl(new CvsTooltip(this, name));
  }

  /**
   * Create a side pane. The pane location is either 'north', 'south',
   * 'east' or 'west'.
   * 
   * The pane will fill the whole width/height of the canvas depending on its 
   * position. The user controls how far the pane extends into the canvas when 
   * open.
   * @param name unique name for this control
   * @param location the pane position ('north', 'south', 'east' or 'west')
   * @param depth the maximum depth the pane expands into the canvas
   * @returns a side pane
   */
  pane(name: string, location: string, depth: number): CvsPane {
    let ctrl: CvsPane;
    switch (location) {
      case 'north': ctrl = new CvsPaneNorth(this, name, depth); break;
      case 'south': ctrl = new CvsPaneSouth(this, name, depth); break;
      case 'west': ctrl = new CvsPaneWest(this, name, depth); break;
      case 'east':
      default: ctrl = new CvsPaneEast(this, name, depth);
    }
    return this.addControl(ctrl);
  }

  // ###########        End of factory methods             ############
  // ##################################################################

  /**
   * Render any controls for this gui
   * @returns this gui
   * @since 0.9.3
   */
  show(): GUI {
    this._visible = true;
    return this;
  }

  /**
   * Do not render any controls for this gui
   * @returns this gui
   * @since 0.9.3
   */
  hide(): GUI {
    this._visible = false;
    return this;
  }
  /**
   * @returns true if gui rendering is allowed
   * @returns this gui
   * @since 0.9.3
   */
  isVisible(): boolean {
    return this._visible;
  }

  /**
   * Enable mouse/key event handling for this gui
   * @returns this gui
   * @since 0.9.3
   */
  enable(): GUI {
    this._enabled = true;
    return this;
  }

  /** 
   * Disable mouse/key event handling for this gui
   * @returns this gui
   * @since 0.9.3
   */
  disable(): GUI {
    this._enabled = false;
    return this;
  }

  /**
   * @returns true if this gui can respond to mouse/key events
   * @since 0.9.3
   */
  isEnabled(): boolean {
    return this._enabled;
  }

  /**
  * Stop handling mouse and key events
  * @since 0.9.4
  */
  stopEventHandling() {
    this._eventsAllowed = false;
  }

  /**
  * Start handling mouse and key events
  * @since 0.9.4
  */
  startEventHandling() {
    this._eventsAllowed = true;
  }

  /**
  * Adds event listeners to the HTML canvas object. It also sets the draw method
  * based on whether the render is WEBGL or P2D
  * @hidden
  */

  private _addFocusHandlers() {
    let canvas = this._canvas;
    canvas.addEventListener('focusout', (e) => { this._handleFocusEvents(e); });
    canvas.addEventListener('focusin', (e) => { this._handleFocusEvents(e); });
  }

  private _addMouseEventHandlers() {
    if (!this._mouseEventsEnabled) {
      let canvas = this._canvas;
      // Add mouse events
      canvas.addEventListener('mousemove', (e) => { this._handleMouseEvents(e) });
      canvas.addEventListener('mousedown', (e) => { this._handleMouseEvents(e) });
      canvas.addEventListener('mouseup', (e) => { this._handleMouseEvents(e) });
      canvas.addEventListener('wheel', (e) => { this._handleMouseEvents(e) });
      // Leave canvas
      canvas.addEventListener('mouseout', (e) => { this._handleMouseEvents(e) });
      canvas.addEventListener('mouseenter', (e) => { this._handleMouseEvents(e); });
      this._mouseEventsEnabled = true;
    }
  }

  private _addKeyEventHandlers() {
    if (!this._keyEventsEnabled) {
      this._target.setAttribute('tabindex', '0');
      this._target.focus();
      this._target.addEventListener('keydown', (e) => { this._handleKeyEvents(e); return false });
      this._target.addEventListener('keyup', (e) => { this._handleKeyEvents(e); return false });
      this._keyEventsEnabled = true;
    }
  }

  _addTouchEventHandlers() {
    if (!this._touchEventsEnabled) {
      let canvas = this._canvas;
      // Add mouse events
      canvas.addEventListener('touchstart', (e) => { this._handleTouchEvents(e); });
      canvas.addEventListener('touchend', (e) => { this._handleTouchEvents(e); });
      canvas.addEventListener('touchcancel', (e) => { this._handleTouchEvents(e); });
      canvas.addEventListener('touchmove', (e) => { this._handleTouchEvents(e); });
      this._touchEventsEnabled = true;
    }
  }

  /**
   * Called by the mouse event listeners
   * @hidden
   * @param e event
   */
  _handleTouchEvents(e) {
    e.preventDefault();
    // Find the currently active control and pass the event to it
    if (this._eventsAllowed && this._enabled && this.isVisible()) {
      let activeControl;
      for (let c of this._ctrls) {
        if (c.isActive()) {
          if (c['_handleTouch']) {
            activeControl = c;
            c._handleTouch(e);
          }
          else {
            activeControl = undefined;
          }
          break;
        }
      }
      // If no active control then pass the event to each enabled control in turn
      if (activeControl == undefined) {
        for (let c of this._ctrls)
          if (c.isEnabled() && c.isVisible()) // 0.9.3 introduces visibility condition
            c['_handleTouch']?.(e);
      }
    }
    return false;
  }

  private _handleFocusEvents(e: FocusEvent) {
    switch (e.type) {
      case 'focusout':
        // Deactivate any textfiles(s) - stop the flashing cursor
        for (let c of this._ctrls)
          if (c.isActive()) {
            c['_deactivate']?.();
            c['validate']?.();
          }
        break;
      case 'focusin':
        break;
    }
  }

  /**
   * Called by the key event listeners
   * @hidden
   * @param e event
   */
  private _handleKeyEvents(e: KeyboardEvent) {
    // Find the currently active control and pass the event to it
    if (this._eventsAllowed && this._enabled && this.isVisible()) {
      for (let c of this._ctrls) {
        if (c.isActive()) {
          c._handleKey(e);
          break;
        }
      }
    }
    return false;
  }

  /**
   * Called by the mouse event listeners
   * @hidden
   * @param e event
   */
  private _handleMouseEvents(e: MouseEvent) {
    // Find the currently active control and pass the event to it
    if (this._eventsAllowed && this._enabled && this.isVisible()) {
      let activeControl;
      for (let c of this._ctrls) {
        if (c.isActive()) {
          activeControl = c;
          c._handleMouse(e);
          break;
        }
      }
      // If no active control then pass the event to each enabled control in turn
      if (activeControl == undefined) {
        for (let c of this._ctrls)
          if (c.isEnabled() && c.isVisible())  // 0.9.3 introduces visibility condition
            c._handleMouse(e);
      }
    }
    return false;
  }

  // Select draw method based on P2D or WEBGL renderer
  private _selectDrawMethod() {
    this._is3D = this._renderer.GL != undefined && this._renderer.GL != null;
    this.draw = this._is3D ? this._drawControlsWEBGL : this._drawControlsP2D;
  }

  // -----------------------------------------------------------------------

  /**
   * <p>Get the control given it's unique name.</p>
   * @param name control's unique name for this control
   * @returns  get the associated control
  */
  $(name: string | CvsBaseControl): CvsBaseControl {
    return (typeof name === "string") ? this._controls.get(name) : name;
  }

  /**
   * <p>Adds a child control to this one.</p>
   * @param control the child control to add
   * @returns the control just added
   */
  addControl(control) {
    console.assert(!this._controls.has(control.name()),
      `Control '${control.name()}' already exists and will be replaced.`);
    this._controls.set(control.name(), control);
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
   * @param c an array of 4 corner radii
   * @returns an array with the 4 corner radii
   */
  corners(c?: Array<number>): Array<number> {
    if (Array.isArray(c) && c.length == 4) {
      this._corners = [...c];
    }
    return [...this._corners];
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
   * <p>Is this a 3D renderer?</p>
   * @returns true for WEBGL and false for P2D
   */
  is3D() {
    return this._is3D;
  }
  /**
   * Close all side panes
   * Replaces _closeAll
   * @since 0.9.3
   * @hidden
   */
  _closePanes() {
    for (let pane of this._panesEast) pane.close();
    for (let pane of this._panesWest) pane.close();
    for (let pane of this._panesSouth) pane.close();
    for (let pane of this._panesNorth) pane.close();
  }

  /**
   * Hide all side panes. This will also close any pane that is open.
  * Replaces hideAll
   * @since 0.9.3  */
  hidePanes() {
    this._closePanes();
    for (let pane of this._panesEast) pane.hide();
    for (let pane of this._panesWest) pane.hide();
    for (let pane of this._panesSouth) pane.hide();
    for (let pane of this._panesNorth) pane.hide();
  }

  /**
   * Show all pane tabs. All panes will be shown closed.
   * Replaces showAll
   * @since 0.9.3
   */
  showPanes() {
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
      let x = pane.depth();
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
      let x = pos, y = pane.depth();
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
   * @param schemename the name of the color scheme
   * @returns the color scheme or undefined if it doesn't exist
   * @hidden
   */
  _getScheme(schemename: string): __Scheme | undefined {
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
   * The main draw method.
   * @hidden
   */
  draw() { }

  /**
   * The P2D draw method
   * @hidden
   */
  _drawControlsP2D() {
    if (this._visible) {
      this._p.push();
      for (let c of this._ctrls)
        if (!c.getParent())
          c._renderP2D();
      this._p.pop();
    }
  }

  /**
   * The WEBGL draw method
   * @hidden
   */
  _drawControlsWEBGL() {
    if (this._visible) {
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
  }

  // ##################################################################################
  // ##################################################################################
  // Class methods and attributes
  // ##################################################################################
  // ##################################################################################

  private static _guis = {};  //new Map();
  private static _announced = false;

  /**
   * @hidden
   */
  static announce() {
    if (!GUI._announced) {
      console.log('================================================');
      console.log(`  canvasGUI (${CANVAS_GUI_VERSION})   \u00A9 2023 Peter Lager`);
      console.log('================================================');
      GUI._announced = true;
    }
  }

  /**
   * <p>Creates and returns a GUI controller for a given canvas element.</p>
   * @param p5c 
   * @param p 
   * @returns a GUI controller
   */
  static get(p5c: p5.Renderer, p: p5 = p5.instance) {
    GUI.announce();
    if (GUI._guis[p]) return GUI._guis[p];
    let gui = new GUI(p5c, p);
    gui._name = p5c.toString();
    GUI._guis[p] = gui;
    return gui;
  }

  /**
   * <p>Creates and returns a named GUI controller.</p>
   * <p>Added in V0.9.4</p>
   * @param name unique name for the gui
   * @param p5c 
   * @param p 
   * @returns  a GUI controller
   */
  static getNamed(name: any, p5c: p5.Renderer, p: p5 = p5.instance) {
    GUI.announce();
    if (GUI._guis[name]) return GUI._guis[name];
    let gui = new GUI(p5c, p);
    gui._name = p5c.toString();
    GUI._guis[name] = gui;
    return gui;
  }
}
