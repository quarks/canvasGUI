const CANVAS_GUI_VERSION: string = '!!VERSION!!';

/**
 * <h2>Core class for the canvasGUI library </h2>
 * 
 * <p>To make use of canvasGUI the user requires a GUI controller and the 
 * global method <br>&nbsp;&nbsp;&nbsp;<code>createGUI(id, display)</code>
 * <br>must be used to create it.</p>
 * 
 * <p>The first parameter (<code>id</code>) is a unique string identifier for
 * the gui. If the string is empty then a random id will be generated GUI.</p>
 * 
 * <p>The second parameter (<code>display</code>) must be the one of the 
 * following :</p>
 * <ul>
 * <li>an existing HTML canvas element</li>
 * <li>the id of an existing HTML canvas element</li>
 * <li>if using p5js it will be the value returned by the <code>createCanvas()'</code>
 * method executed in the <code>setup()'</code> function.</li>
 * </ul>
 * 
 * <p>Any other value will result the program being terminated with an 
 * error</p>
 */
class GUI {
  /** canvasGUI version */
  static VERSION = '!!VERSION!!';
  // Remember all GUIs created are accessible using gui's unique string
  // identifier.
  /** @hidden */ private static _guis: Map<string, GUI> = new Map();
  // Vertices used in shader program to reneder gui over WebGL2 canvas
  /** @hidden */ private static VERTS
    = new Float32Array([-1, -1, 0, -1, 1, 0, 1, 1, 0, 1, -1, 0]);
  // Instance 
  /** @hidden */ public _uid: string;

  // Prevent duplicate event handlers
  /** @hidden */ private _touchListenersCreated = false;
  /** @hidden */ private _mouseListenersCreated = false;
  /** @hidden */ private _keyListenersCreated = false;

  // Hide / disable GUI
  /** @hidden */ private _visible = true;
  /** @hidden */ private _enabled = true;

  // Drawing canvas
  /** @hidden */ private _canvas: HTMLCanvasElement;
  /** @hidden */ private _canvasContext: any;
  /** @hidden */ private _is3D = false;
  /** @hidden */ private _mode: string;
  /** @hidden */ private _showUI: Function;
  /** @hidden */ private _guiShader: WebGLProgram;
  /** @hidden */ private _pr: number;

  // Controls
  /** @hidden */ private _controls: Map<string, CvsControl> = new Map();
  /** @hidden */ private _ctrls: Array<CvsControl> = [];
  /** @hidden */ public _corners: Array<number> = [4, 4, 4, 4];
  /** @hidden */ private _optionGroups: Map<string, CvsOptionGroup> = new Map();
  /** @hidden */ public _tSize: number = 12;
  /** @hidden */ public _tFace: string = 'sans-serif';
  /** @hidden */ public _tStyle: string = 'normal';
  /** @hidden */ public _iSize: number = 14;
  /** @hidden */ private _tipTextSize: number = 10;
  /** @hidden */ public _panesEast: Array<CvsPane> = [];
  /** @hidden */ public _panesSouth: Array<CvsPane> = [];
  /** @hidden */ public _panesWest: Array<CvsPane> = [];
  /** @hidden */ public _panesNorth: Array<CvsPane> = [];
  /** @hidden */ private _tabsInvalid: boolean = false;
  /** @hidden */ public _tabMinHeight: number = 16;

  // Attributes
  /** @hidden */ private _schemes: Array<any>;
  /** @hidden */ public _scheme: ColorScheme;
  /** @hidden */ public _links: Map<number, CvsTextField>;
  /** @hidden */ public _clipboard: string = '';

  // Tooltip times
  /** @hidden */ public _show_time: number = TT_SHOW_TIME;
  /** @hidden */ public _repeat_time: number = TT_REPEAT_TIME;

  /** @hidden */ protected _uiBuffer: OffscreenCanvas;
  /** @hidden */ protected _uiContext: OffscreenCanvasRenderingContext2D;
  /** @hidden */ protected _pkBuffer: OffscreenCanvas;
  /** @hidden */ protected _pkContext: OffscreenCanvasRenderingContext2D;

  // The number of permitted colors per object (must be a power of 2)
  // An object can use any color value from NEXT_COLOR to
  // NEXT_COLOR + COLOR_STEP - 1
  /** @hidden */ protected _COLOR_STEP: number;
  /** @hidden */ protected _PART_MASK: number;
  /** @hidden */ protected _COLOR_MASK: number;
  // The next base color to be assigned when an object is registered
  /** @hidden */ protected _NEXT_COLOR: number; // this._COLOR_STEP;
  /** @hidden */ protected _color2control = new Map(); // Map the base pick color to the object
  /** @hidden */ protected _control2color = new Map(); // Find the colour for a given object

  // Event handling
  /** @hidden */ public _currOver: CvsControl;
  /** @hidden */ public _prevOver: CvsControl;
  /** @hidden */ public _activeCtrl: CvsControl;
  /** @hidden */ public _activePart: number;

  // Mouse position
  /** @hidden */ public _mouseX: number;
  /** @hidden */ public _mouseY: number;

  /** 
   * Create a GUI object to create and manage the GUI controls for
   * an HTML canvas.
   * 
   * @hidden
   * @param p5c the renderer
   * @param p the sketch instance
   */
  public constructor(id: string, canvas: HTMLCanvasElement, pixelRatio: number, mode: string) {
    this._uid = id;
    this._mode = mode;
    this._pr = pixelRatio;
    this._canvas = canvas;      // HTMLCanvasElement
    this._canvasContext =       // Drawing context for canvas
      this._canvas.getContext(this._canvas["hasContext"]());
    this._is3D = this._canvas["hasContext"]() === 'webgl2';
    if (this._is3D)
      this._guiShader = this._createGuiShaderProgram();
    // Pick buffer
    this._COLOR_STEP = 8;
    this._PART_MASK = this._COLOR_STEP - 1;
    this._COLOR_MASK = 0x00FFFFFF ^ this._PART_MASK;
    this._NEXT_COLOR = this._COLOR_STEP;

    // Create color schemes
    this._initColorSchemes();

    // Event handlers for canvas
    this._addFocusHandlers();
    this._addMouseEventHandlers();
    this._addTouchEventHandlers();
    this._currOver = null;
    this._activeCtrl = null;
    this._activePart = 0;

    // Choose 2D / 3D rendering methods  
    this._showUI = this._is3D ? this._showOverWebGL : this._showOver2d;

    // Create buffers
    this._createGuiBuffers(this._canvas.width, this._canvas.height);

    // CLOG(`GUI ctor    3D? ${this._is3D}   Device Pixel Scale: ${devicePixelRatio}`);
    // CLOG(`  Canvas size:     ${this._canvas.width} x ${this._canvas.height}`);
    // CLOG(`  UI buffer size:  ${this._uiBuffer.width} x ${this._uiBuffer.height}`);
    // CLOG(`  PK buffer size:  ${this._pkBuffer.width} x ${this._pkBuffer.height}`);

  }

  /** @hidden */
  invalidateTabs() {
    this._tabsInvalid = true;
  }

  _createGuiBuffers(w: number, h: number) {
    // CLOG(`Create buffers  ${MILLIS()}`)
    this._uiBuffer = new OffscreenCanvas(w, h);
    this._uiContext = this._uiBuffer.getContext('2d');
    this._uiContext.scale(this._pr, this._pr);
    this._pkBuffer = new OffscreenCanvas(w, h);
    this._pkContext = this._pkBuffer.getContext('2d');
    this._clearGuiBuffers();
  }

  /**
   * Clear the gui buffers ready for next frame
   * @hidden
   */
  _clearGuiBuffers() {
    this._uiContext.clearRect(0, 0, this._uiBuffer.width, this._uiBuffer.height);
    this._pkContext.clearRect(0, 0, this._pkBuffer.width, this._pkBuffer.height);
  }

  /**
   * Make sure we have an overlay buffer and a pick buffer of the correct size.
   * @returns true if the buffers were ressized else false.
   * @hidden
   */
  _validateGuiBuffers() {
    const [w, h] = [this._canvas.width, this._canvas.height];
    if (this._uiBuffer.width != w || this._uiBuffer.height != h) {
      this._createGuiBuffers(w, h);
      this.invalidateTabs();
    }
  }

  /**
   * Draw the controls to the ui buffer then display over the canvas
   * @hidden
   */
  draw() {
    this._validateGuiBuffers();
    this._clearGuiBuffers();
    if (this._visible) {
      for (const c of this._ctrls)
        if (!c.getParent())
          c._draw(this._uiContext, this._pkContext);
      this._showUI();
    }
    if (this._tabsInvalid) {
      this.validateTabsNorth();
      this.validateTabsSouth();
      this.validateTabsEast();
      this.validateTabsWest();
      this._tabsInvalid = false;
    }
  }

  /**
   * Show GUI over a '2d' canvas
   * @hidden
   */
  _showOver2d() {
    this._canvasContext.save();
    this._canvasContext.resetTransform();
    this._canvasContext.drawImage(this._uiBuffer, 0, 0); // Display GUI controls
    this._canvasContext.restore();
  }

  /**
   * Show GUI over a 'webgl2' canvas
   * @hidden
   */
  _showOverWebGL() {
    const gl = this._canvasContext;
    // Create texture from 2D canvas
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
      this._uiBuffer);
    gl.generateMipmap(gl.TEXTURE_2D);

    // Create and bind a buffer for the vertices
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, GUI.VERTS, gl.STATIC_DRAW);

    gl.useProgram(this._guiShader);

    // Bind vertex position attribute
    const position = gl.getAttribLocation(this._guiShader, 'aVertexPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);

    // Set the texture sampler uniform
    const uSampler = gl.getUniformLocation(this._guiShader, 'uSampler');
    gl.uniform1i(uSampler, 0);

    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.disable(gl.BLEND);
  }

  /**
   * Create the shader program to overlay a 2D HUD over a 3D canvas
   * @hidden
   */
  _createGuiShaderProgram() {
    const gl = this._canvasContext;

    // Vertex shader program
    const vsSource = `
    precision mediump float;

    uniform vec2 uScale;
    attribute vec3 aVertexPosition;
    varying vec2 vTextureCoord;

    void main(void) {
        gl_Position = vec4(aVertexPosition, 1.0);
        vTextureCoord.x = (1.0 + aVertexPosition.x) * 0.5;
        vTextureCoord.y = (1.0 - aVertexPosition.y) * 0.5;
    }
    `;

    // Fragment shader program
    const fsSource = `
    precision mediump float;

    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;

    void main(void) {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
    `;

    // Compile shaders and link the program
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vsSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fsSource);
    gl.compileShader(fragmentShader);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    return shaderProgram;
  }

  // ##################################################################
  // ###### ++++++++++++++++++++++++++++++++++++++++++++++++++++ ######
  // ######         Factory methods to create controls           ######
  // ###### ++++++++++++++++++++++++++++++++++++++++++++++++++++ ######
  // ##################################################################


  image(id: string, x: number, y: number, image: cvsIcon) {
    const img = cvsGuiCanvas(image);
    return this.addControl(new CvsImage(this, id, x, y, img), false);
  }

  /**
   * Create a slider control
   * @param id unique id for this control
   * @param x left-hand pixel position
   * @param y top pixel position
   * @param w width
   * @param h height
   * @returns slider control
   */
  slider(id: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsSlider(this, id, x, y, w, h), true);
  }

  /**
   * Create a ranger control
   * @param id unique id for this control
   * @param x left-hand pixel position
   * @param y top pixel position
   * @param w width
   * @param h height
   * @returns ranger control
   */
  ranger(id: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsRanger(this, id, x, y, w, h), true);
  }

  /**
   * Create a button control
   * @param id unique id for this control
   * @param x left-hand pixel position
   * @param y top pixel position
   * @param w width
   * @param h height
   * @returns a button
   */
  button(id: string, x?: number, y?: number, w?: number, h?: number) {
    return this.addControl(new CvsButton(this, id, x, y, w, h), true);
  }

  /**
   * Create a single line text input control
   * @param id unique id for this control
   * @param x left-hand pixel position
   * @param y top pixel position
   * @param w width
   * @param h height
   * @returns a textfield
   */
  textfield(id: string, x?: number, y?: number, w?: number, h?: number) {
    this._addKeyEventHandlers();
    return this.addControl(new CvsTextField(this, id, x, y, w, h), true);
  }

  /**
   * Create a checkbox control
   * @param id unique id for this control
   * @param x left-hand pixel position
   * @param y top pixel position
   * @param w width
   * @param h height
   * @returns a checkbox
   */
  checkbox(id: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsCheckbox(this, id, x, y, w, h), true);
  }

  /**
   * Create an option (radio button) control
   * @param id unique id for this control
   * @param x left-hand pixel position
   * @param y top pixel position
   * @param w width
   * @param h height
   * @returns an option button
   */
  option(id: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsOption(this, id, x, y, w, h), true);
  }

  /**
   * Create a label control
   * @param id unique id for this control
   * @param x left-hand pixel position
   * @param y top pixel position
   * @param w width
   * @param h height
   * @returns a label
   */
  label(id: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsLabel(this, id, x, y, w, h), false);
  }

  /**
   * Create a poster control
   * @param id unique id for this control
   * @param x left-hand pixel position
   * @param y top pixel position
   * @param w width
   * @param h height
   * @returns a label
   */
  poster(id: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsPoster(this, id, x, y, w, h), false);
  }

  /**
   * Create a label control
   * @param id unique id for this control
   * @param x left-hand pixel position
   * @param y top pixel position
   * @param w width
   * @param h height
   * @returns a label
   */
  panel(id: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsPanel(this, id, x, y, w, h), true);
  }

  /**
   * Create a viewer control
   * @param id unique id for this control
   * @param x left-hand pixel position
   * @param y top pixel position
   * @param w width
   * @param h height
   * @returns an image viewer
   */
  viewer(id: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsViewer(this, id, x, y, w, h), true);
  }

  /**
   * Create a joystick control
   * @param id unique id for this control
   * @param x left-hand pixel position
   * @param y top pixel position
   * @param w width
   * @param h height
   * @returns a joystick control
   */
  joystick(id: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsJoystick(this, id, x, y, w, h), true);
  }

  /**
   * Create a knob control
   * @param id unique id for this control
   * @param x left-hand pixel position
   * @param y top pixel position
   * @param w width
   * @param h height
   * @returns a knob control
   */
  knob(id: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsKnob(this, id, x, y, w, h), true);
  }

  /**
   * Create a scroller control
   * @param id unique id for this control
   * @param x left-hand pixel position
   * @param y top pixel position
   * @param w width
   * @param h height
   * @returns scroller control
   * @hidden
   */
  __scroller(id: string, x: number, y: number, w: number, h: number) {
    return this.addControl(new CvsScroller(this, id, x, y, w, h), true);
  }

  /**
   * Description placeholder
   * @param {string} id 
   * @returns {CvsTooltip}
   * @hidden
   */
  __tooltip(id: string): CvsTooltip {
    return this.addControl(new CvsTooltip(this, id), false);
  }

  /**
   * Create a side pane. The pane location is either 'north', 'south',
   * 'east' or 'west'.
   * 
   * The pane will fill the whole width/height of the canvas depending on its 
   * position. The user controls how far the pane extends into the canvas when 
   * open.
   * @param id unique id for this control
   * @param location the pane position ('north', 'south', 'east' or 'west')
   * @param depth the maximum depth the pane expands into the canvas
   * @returns a side pane
   */
  pane(id: string, location: string, depth: number): CvsPane {
    let ctrl: CvsPane;
    depth = Math.round(depth);
    switch (location) {
      case 'north': ctrl = new CvsPaneNorth(this, id, depth); break;
      case 'south': ctrl = new CvsPaneSouth(this, id, depth); break;
      case 'west': ctrl = new CvsPaneWest(this, id, depth); break;
      case 'east':
      default: ctrl = new CvsPaneEast(this, id, depth);
    }
    return this.addControl(ctrl, true);
  }

  // ######           End of control factory methods             ######
  // ###### ++++++++++++++++++++++++++++++++++++++++++++++++++++ ######
  // ##################################################################


  /** @returns the canvas context type  */
  get contextType() { return this._canvas["hasContext"]() }

  /** @returns true gui is over a 3D canvas  */
  get is3D() { return this._is3D }

  /** @returns 'p5js' if using p5.js else returns 'JS' */
  get mode() { return this._mode }

  /** @returns an array with the names of built-in color schemes */
  get colorSchemeNames() {
    return Array.from(['blue', 'green', 'red', 'cyan', 'yellow', 'purple', 'orange', 'light', 'dark']);
  }

  /** @returns true if this gui can respond to mouse/key events   */
  get isEnabled(): boolean { return this._enabled; }

  /** @returns true if gui rendering is allowed   */
  get isVisible(): boolean { return this._visible; }

  /** @returns the display width   */
  get canvasWidth() { return this._canvas.width / this._pr; }

  /** @returns the display height   */
  get canvasHeight() { return this._canvas.height / this._pr; }

  /**
   * Get a grid layout for a given pixel position and size in the display area.
   * Initially the grid repreents a single cell but the number and size of
   * horizontal and vertical cells should be set before creating the controls.
   * @param x left edge position
   * @param y top edge position 
   * @param w grid width
   * @param h grid height
   * @returns the grid layout
   */
  grid(x: number, y: number, w: number, h: number) {
    return new GridLayout(x, y, w, h);
  }

  /**
   * Returns the unique id for this GUI.
   * 
   * @returns GUI id
   */
  id(): string {
    return this._uid;
  }

  /**
   * <p>Gets or sets the global minimum height for pane tabs.</p>
   * @param th the minimum tab height (must be &ge;10)
   * @returns this gui instance
   */
  tabHeight(th: number) {
    if (th === undefined || !Number.isFinite(th))
      return this._tabMinHeight;
    if (th >= 10)
      this._tabMinHeight = th;
    return this;
  }

  /**
   * Render any controls for this gui
   * @returns this gui
   */
  show(): GUI {
    this._visible = true;
    return this;
  }

  /**
   * Hides all the controls for this gui
   * @returns this gui
   */
  hide(): GUI {
    this._visible = false;
    return this;
  }

  /**
   * Enable mouse/key event handling for this gui
   * @returns this gui
   */
  enable(): GUI {
    this._enabled = true;
    return this;
  }

  /** 
   * Disable mouse/key event handling for this gui
   * @returns this gui
   */
  disable(): GUI {
    this._enabled = false;
    return this;
  }

  /**
   * Controls how long a tooltip is shown and how long to wait before it can 
   * be shown again. This helps avoid the tip flicking on and off as the mouse
   * moves over the control.
   * 
   * @param show show duration (ms) 
   * @param repeat duration before the tip can be shown again
   * @returns this gui
   */
  tooltipTimes(show = TT_SHOW_TIME, repeat = TT_REPEAT_TIME) {
    this._show_time = show;
    this._repeat_time = repeat;
    return this;
  }

  /**
   * Adds event listeners to the HTML canvas object. It also sets the draw method
   * based on whether the render is WEBGL or P2D
   * @hidden
   */
  private _addFocusHandlers() {
    const canvas = this._canvas;
    canvas.addEventListener('focusout', (e) => { this._processFocusEvent(e); });
    canvas.addEventListener('focusin', (e) => { this._processFocusEvent(e); });
  }

  /** @hidden */
  private _addMouseEventHandlers() {
    if (!this._mouseListenersCreated) {
      const canvas = this._canvas;
      // Add mouse events
      canvas.addEventListener('mousedown', (e) => { this._processMouseEvent(e) });
      canvas.addEventListener('mouseup', (e) => { this._processMouseEvent(e) });
      canvas.addEventListener('mousemove', (e) => { this._processMouseEvent(e) });
      canvas.addEventListener('wheel', (e) => { this._processMouseEvent(e) });
      // Leave and enter canvas
      canvas.addEventListener('mouseout', (e) => { this._processMouseEvent(e) });
      canvas.addEventListener('mouseenter', (e) => { this._processMouseEvent(e); });
      this._mouseListenersCreated = true;
    }
  }

  /** @hidden */
  private _addKeyEventHandlers() {
    if (!this._keyListenersCreated) {
      const keyTarget = document.getElementById(this._canvas.id);
      keyTarget.setAttribute('tabindex', '0');
      keyTarget.focus();
      keyTarget.addEventListener('keydown', (e) => { this._processKeyEvent(e); return false });
      keyTarget.addEventListener('keyup', (e) => { this._processKeyEvent(e); return false });
      this._keyListenersCreated = true;
    }
  }

  /** @hidden */
  private _addTouchEventHandlers() {
    if (!this._touchListenersCreated) {
      const canvas = this._canvas;
      canvas.addEventListener('touchstart', (e) => { this._processTouchEvent(e); });
      canvas.addEventListener('touchend', (e) => { this._processTouchEvent(e); });
      canvas.addEventListener('touchmove', (e) => { this._processTouchEvent(e); });
      canvas.addEventListener('touchcancel', (e) => { this._processTouchEvent(e); });
      this._touchListenersCreated = true;
    }
  }

  // ===============================================================================
  //     Event handlers

  /** @hidden */
  private _processMouseEvent(e: MouseEvent) {
    if (this._visible && this._enabled) {
      const rect = this._canvas.getBoundingClientRect();
      this._processEvent(e, e.clientX - rect.left, e.clientY - rect.top)
      // e.preventDefault();
    }
  }

  /** @hidden */
  private _processTouchEvent(e: TouchEvent) {
    if (this._visible && this._enabled) {
      const rect = this._canvas.getBoundingClientRect();
      const te = e.changedTouches[0];
      this._processEvent(e, te.clientX - rect.left, te.clientY - rect.top)
      // e.preventDefault();
    }
  }

  /**
   * Process mouse and touch events provided the active control is not
   * a textfield.
   * @param e the mouse or touch event
   * @param x the x position in the canvas
   * @param y the y position in the canvas
   * @hidden
   */
  private _processEvent(e: MouseEvent | TouchEvent, x: number, y: number) {
    this._mouseX = x;
    this._mouseY = y;
    if (e.type == 'mouseout') {
      if (this._currOver) this._currOver.over = false;
      if (this._prevOver) this._prevOver.over = false;
    }
    // Ignore mouse / touch events while we have an active textfield
    if (this._activeCtrl instanceof CvsTextField) return;
    const over = this.getPicked(x, y);
    this._currOver = over.control;
    // Determine if we have entered current over control
    const enter = this._currOver && this._currOver != this._prevOver;
    if (this._activeCtrl) {
      this._activeCtrl = this._activeCtrl._doEvent(e, x, y, over, enter);
    }
    else {
      // Check for highlighting as pointer moves over a control
      if (e.type == 'mousemove' || e.type == 'touchmove') {
        this._prevOver?._doEvent(e, x, y, over, false);
        this._currOver?._doEvent(e, x, y, over, enter);
      }
      else {
        // If we are over a control then let it handle the event
        this._activeCtrl = this._currOver?._doEvent(e, x, y, over, enter);
      }
    }
    this._prevOver = this._currOver;
  }

  /**
   * Process the key event if the active control is a CvsTextField
   * @hidden
   * @param e keyboard event
   */
  private _processKeyEvent(e: KeyboardEvent) {
    // Pass the event if the active control is a CvsTextField
    if (this._visible && this._enabled && this._activeCtrl instanceof CvsTextField)
      this._activeCtrl = this._activeCtrl._doKeyEvent(e);
  }

  /** @hidden */
  private _processFocusEvent(e: FocusEvent) {
    // CLOG(`Focus event ${this._activeCtrl?.id}`);
    switch (e.type) {
      case 'focusout':
        if (this._activeCtrl instanceof CvsTextField) {
          this._activeCtrl._deactivate();
          this._activeCtrl = null;
        }
        break;
      case 'focusin':
        break;
    }
  }

  /** @returns mouse x position relative to top-left corner of the canvas */
  get mouseX() { return this._mouseX }
  /** @returns mouse y position relative to top-left corner of the canvas */
  get mouseY() { return this._mouseY }

  //     End of Event handlers
  // ===============================================================================


  /**
   * <p>Get the control given it's unique id.</p>
   * @param id unique ID for the control to find
   * @returns  get the associated control
   */
  $(id: string | CvsControl): CvsControl {
    return (typeof id === "string") ? this._controls.get(id) : id;
  }

  /**
   * <p>Adds a child control to this gui.</p>
   * @param control the child control to add
   * @returns the control just added
   * @hidden
   */
  addControl(control: CvsControl, pickable = false): any {
    CASSERT(!this._controls.has(control.id),
      `Control '${control.id}' already exists and will be replaced.`);
    // Map control by ID
    this._controls.set(control.id, control);
    // Now find render order
    this._ctrls = [...this._controls.values()];
    this.setRenderOrder();
    if (pickable) this.register(control);
    return control;
  }

  /**
   * Sorts the controls so that they are rendered in order of their z
   * value (low z --> high z).
   * @hidden
   */
  setRenderOrder() {
    this._ctrls.sort((a, b) => { return a.z - b.z });
  }

  /**
   * Add an object so it can be detected using this pick buffer.
   * @param control the object to add
   * @hidden
   */
  register(control: CvsControl) {
    if (control && !this._control2color.has(control)) {
      this._control2color.set(control, this._NEXT_COLOR);
      this._color2control.set(this._NEXT_COLOR, control);
      this._NEXT_COLOR += this._COLOR_STEP;
    }
  }

  /**
   * Remove this object so it can't be detected using this pick buffer.
   * @param control the object to remove
   * @hidden
   */
  deregister(control: CvsBufferedControl) {
    if (control && this._control2color.has(control)) {
      const pc = this._control2color.get(control);
      this._control2color.delete(control);
      this._color2control.delete(pc);
    }
  }

  /**
   * @hidden
   * @param control the control we need the pick color for
   * @returns the associated pick color numeric value (rgb)
   */
  pickColor(control) {
    if (this._control2color.has(control)) {
      const pc = this._control2color.get(control);
      const [r, g, b] = [(pc >> 16) & 0xFF, (pc >> 8) & 0xFF, pc & 0xFF];
      return { r: r, g: g, b: b, cssColor: `rgb(${r} ${g} ${b})` };
    }
    return undefined;
  }

  /**
   * Display a 2D buffer in a canvas element with the specified ID.
   * 
   * An existing HTML element with this ID that is not a canvas element this 
   * will be ignored and the buffer will not be displayed.
   * 
   * An exising HTML canvas element with this ID will be used to display the 
   * buffer, if not it will be created and appended to the body section.
   * 
   * @param cvsID the ID (string) of the HTML canvas element to use.
   * @param buffer the 2D canvas to display.
   */
  showBuffer(cvsID, buffer = this._pkBuffer) {
    let ele = document.getElementById(cvsID);
    if (!ele) {    // Create the HTML canvas element if it doesn't exist
      ele = document.createElement('canvas');
      ele.setAttribute('id', cvsID);
      document.getElementsByTagName('body')[0].append(ele);
    }
    if (ele instanceof HTMLCanvasElement) {
      ele.setAttribute('width', `${buffer.width}`);
      ele.setAttribute('height', `${buffer.height}`);
      ele.setAttribute('padding', '3px');
      ele.style.border = '2px solid #FF0000';
      const ctx = ele.getContext('2d');
      ctx.drawImage(buffer, 0, 0, buffer.width, buffer.height,
        0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  }

  /**
   * List the controls created so far
   * @hidden
   */
  listControls() {
    CLOG("--------------------   List of controls   --------------------");
    this._ctrls.forEach(c => {
      const id = `${c.id}                               `.substring(0, 15);
      const ctype = `${c.constructor.name}                   `.substring(0, 15);
      const z = `Z: ${c.z}      `.substring(0, 10);
      const pc = `Color key: ${this._control2color.get(c)}`;
      CLOG(id + ctype + z + pc);
    })
    CLOG('--------------------------------------------------------------');
  }

  /**
   * <p>Gets the option group associated with a given name.</p>
   * @param name the name of the option group
   * @returns the option group
   * @hidden
   */
  getOptionGroup(name: string): CvsOptionGroup {
    if (!this._optionGroups.has(name))
      this._optionGroups.set(name, new CvsOptionGroup(name));
    return this._optionGroups.get(name);
  }

  /**
   * Sets the global default icon for checkboxes and option buttons.
   * @param size iscon size (pixels)
   * @returns 
   */
  iconSize(size: number) {
    if (!Number.isFinite(size)) return this._iSize;
    this._iSize = Math.ceil(size);
    this._controls.forEach((c) => {
      if (c instanceof CvsCheckbox || c instanceof CvsOption)
        c.invalidateBuffer();
    });
    return this;
  }
  /**
   * <p>Sets or gets the global text size.</p>
   * <p>If no parameter is passed then the global text size is returned 
   * otherwise it returns this gui.</p>
   * @param tsize new global text size
   * @returns the global text size or this gui
   */
  textSize(tsize?: number): number | GUI {
    if (!Number.isFinite(tsize)) return this._tSize;
    this._tSize = tsize;
    // Update visual for all controls
    this._controls.forEach((c) => { c.invalidateBuffer(); });
    return this;
  }

  /**
   * <p>If no parameter is passed then the global font family name will be
   * returned.</p>
   * <p>If a parameter is provided it will be accepted if it is one of the 
   * following :-</p>
   * <ul>
   * <li>The font family name of a TTF system font e.g. 'arial', 
   * 'courier new', 'times new roman' ...</li>
   * <li>The name of a logical font e.g. 'serif', 'sans-serif', 
   * 'monospace' ...</li>
   * <li>A font loaded in p5js with the <code>loadFont()</code>
   * function.</li>
   * </ul>
   * <p>Any other parameter value will display a warning and be ignored
   * leaving the font unchanged.</p>
   * 
   * @param font system or logical font, a FontFace object or a p5js 
   * font object.
   * @returns this control
   */
  textFont(font?: string | object) {
    const fface = cvsGuiFont(font);
    if (fface)
      this._tFace = fface;
    else
      CWARN(`'${font.toString()}' is unrecognized so will be ignored!`);
    return this;
  }

  /**
   * <p>Sets or gets the global text style.</p>
   * <p>The following strings are recognised as valid styles :-</p>
   * <pre>
   * 'normal'  'bold'  'thin'  'italic'  
   * 'bold italic'  'thin italic'  'oblique'
   * </pre>
   * <p>It will also accept the 4 p5js constants :-</p>
   * <pre>
   * NORMAL    BOLD   ITALIC   BOLDITALIC
   * </pre>
   * <p>Unrecognized styles are ignored and the global style left
   * unchanged.</p>
   * <p>If no parameter is passed then the current global style is 
   * returned.</p>
   * 
   * @param style the font style to use.
   * @returns this control
   */
  textStyle(style?: string) {
    if (!style) return this._tStyle; // getter
    style = _validateTextStyle(style);
    if (style)
      this._tStyle = style;
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
   * <p>Get or set the default corner radii used in this GUI.</p>
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
  corners(...c: any): Array<number> | GUI {
    switch (c.length) {
      case 0: // Getter
        return [...this._corners];
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
   * Close all side panes (replaces _closeAll)
   * @hidden
   */
  _closePanes() {
    for (const pane of this._panesEast) pane.close();
    for (const pane of this._panesWest) pane.close();
    for (const pane of this._panesSouth) pane.close();
    for (const pane of this._panesNorth) pane.close();
  }

  /**
   * Hide all side panes. This will also close any pane that is open.<br>
   */
  hidePanes() {
    this._closePanes();
    for (const pane of this._panesEast) pane.hide();
    for (const pane of this._panesWest) pane.hide();
    for (const pane of this._panesSouth) pane.hide();
    for (const pane of this._panesNorth) pane.hide();
  }

  /**
   * Show all pane tabs. All panes will be shown closed.
   */
  showPanes() {
    for (const pane of this._panesEast) pane.show();
    for (const pane of this._panesWest) pane.show();
    for (const pane of this._panesSouth) pane.show();
    for (const pane of this._panesNorth) pane.show();
  }

  /**
   * Reposition all tabs attached to East side 
   * @hidden
   */
  validateTabsEast() { // East
    const panes = this._panesEast;
    let sum = panes
      .map(pane => pane.TAB._w)
      .reduce((x, y) => x + y, 2 * (panes.length - 1));
    // Now find start position for the first tab
    let pos = (this.canvasHeight - sum) / 2;
    panes.forEach(pane => {
      pane._updateLocation(pos, this.canvasWidth, this.canvasHeight);
      pos += pane.TAB._w + 2;
    });
  }

  /**
   * Reposition all tabs attached to West side 
   * @hidden
   */
  validateTabsWest() { // West
    const panes = this._panesWest;
    let sum = panes
      .map(pane => pane.TAB._w)
      .reduce((x, y) => x + y, 2 * (panes.length - 1));
    // Now find start position for the first tab
    let pos = (this.canvasHeight - sum) / 2;
    panes.forEach(pane => {
      pane._updateLocation(pos, this.canvasWidth, this.canvasHeight);
      pos += pane.TAB._w + 2;
    });
  }

  /**
   * Reposition all tabs attached to South side 
   * @hidden
   */
  validateTabsSouth() { // South
    const panes = this._panesSouth;
    let sum = panes
      .map(pane => pane.TAB._w)
      .reduce((x, y) => x + y, 2 * (panes.length - 1));
    // Now find start position for the first tab
    let pos = (this.canvasWidth - sum) / 2;
    panes.forEach(pane => {
      pane._updateLocation(pos, this.canvasWidth, this.canvasHeight);
      pos += pane.TAB._w + 2;
    });
  }

  /**
   * Reposition all tabs attached to North side 
   * @hidden
   */
  validateTabsNorth() { // North
    const panes = this._panesNorth;
    let sum = panes
      .map(pane => pane.TAB._w)
      .reduce((x, y) => x + y, 2 * (panes.length - 1));
    // Now find start position for the first tab
    let pos = (this.canvasWidth - sum) / 2;
    panes.forEach(pane => {
      pane._updateLocation(pos, this.canvasWidth, this.canvasHeight);
      pos += pane.TAB._w + 2;
    });
  }

  /** @hidden */
  private _initColorSchemes() {
    this._schemes = [];
    this._schemes['blue'] = new BlueScheme();
    this._schemes['green'] = new GreenScheme();
    this._schemes['red'] = new RedScheme();
    this._schemes['cyan'] = new CyanScheme();
    this._schemes['yellow'] = new YellowScheme();
    this._schemes['purple'] = new PurpleScheme();
    this._schemes['orange'] = new OrangeScheme();
    this._schemes['light'] = new LightScheme();
    this._schemes['dark'] = new DarkScheme();
    this._scheme = this._schemes['blue'];
  }

  /**
   * <p>Set or get the existing global color scheme.</p>
   * @param csName name of the color scheme to set
   * @returns this gui instance
   */
  scheme(csName?: string): any {
    if (!csName) {
      return this._scheme;
    }
    // set global scheme and invalidate any controls using the global scheme
    if (this._schemes[csName]) {
      this._scheme = this._schemes[csName];
      // Update visual for all these using the global color scheme
      this._controls.forEach((c) => {
        if (!c.scheme())
          c.invalidateBuffer();
      });
    }
    else
      CWARN(`'${csName}' is not a valid color scheme`);
    return this;
  }

  /**
   * <p>Get the named color scheme.</p>
   * @param csName the name of the color scheme
   * @returns the color scheme or undefined if it doesn't exist
   * @hidden
   */
  _getScheme(csName: string): ColorScheme | undefined {
    if (csName && this._schemes[csName]) {
      return this._schemes[csName];
    }
    CWARN(`Unable to retrieve color scheme '${csName}'`);
    return null;
  }

  /**
   * <p>This will create a new color scheme from an existing one. The returned 
   * scheme is a deep-copy of the source scheme and should be edited before 
   * adding it to the GUI with  the addScheme(...) method. The name of the 
   * new scheme is specified in the first parameter and cannot be changed later.</p>
   * <p>The method will fail if -</p>
   * <ul>
   * <li>either parameter is not a string of length &gt;0, or</li>
   * <li>destination and source names are equal (case insensitve comparison), or</li>
   * <li>the source scheme does not exist.</li> 
   * </ul>
   * 
   * @param destName a unique name for the new color scheme.
   * @param srcName the name of the source scheme.
   * @returns the new color scheme or null if unable to create it.
   */
  createScheme(destName: string, srcName: string) {
    if (!(typeof destName === "string") || destName.length === 0
      || !(typeof srcName === "string") || srcName.length === 0
      || destName.toLowerCase() == srcName.toLowerCase()) {
      CWARN(`Unable to create color scheme, '${destName}' and '${srcName}' are invalid names.`)
      return null;
    }
    const srcScheme = this._getScheme(srcName);
    if (!srcScheme) {
      CWARN(`Unable to create color scheme because the source scheme, '${srcName}', does not exist.`)
      return null;
    }
    const destScheme = srcScheme._copy();
    destScheme._name = destName;
    return destScheme;
  }

  /**
   * <p>Adds a new color scheme to those already available. It does not replace an
   * existing scheme.</p>
   * @param scheme  the color scheme
   * @returns this gui instance
   */
  addScheme(scheme: ColorScheme): GUI {
    if (!(scheme instanceof ColorScheme))
      CWARN(`The parameter is not a valid color scheme so can't be used.`);
    else if (this._schemes[scheme.name])
      CERROR(`Cannot add scheme '${scheme.name}' because it already exists.'`);
    else
      this._schemes[scheme.name] = scheme;
    return this;
  }

  /**
   * <p>If the [x, y] display position is over a controls pick region then
   * return an object containing the 'control' and the pick region ('part')
   * number.</p>
   * @param x horizontal pixel location
   * @param y vertical pixel location
   * @returns an object containing the control hit and the control part number
   */
  getPicked(x: number, y: number) {
    x *= this._pr; y *= this._pr;
    const pkb = this._pkBuffer;
    const result = { control: null, part: -1 };
    if (x >= 0 && x < pkb.width && y >= 0 && y < pkb.height) {
      const rgb = this.getPickColor(x, y);
      const ctl_col = rgb & this._COLOR_MASK;
      result.control = this._color2control.get(ctl_col);
      result.part = rgb & this._PART_MASK;
    }
    return result;
  }

  getPickColor(x: number, y: number) {
    const imgData = this._pkContext.getImageData(x, y, 1, 1);
    const r = imgData.data[0];
    const g = imgData.data[1];
    const b = imgData.data[2];
    const rgb = (r << 16) + (g << 8) + b;
    return rgb;
  }

  /** @hidden */
  static ANNOUNCE_CANVAS_GUI() {
    if (GUI._guis.size == 0) {
      CLOG('================================================');
      CLOG(`  canvasGUI (${CANVAS_GUI_VERSION})   \u00A9 2025 Peter Lager`);
      CLOG('================================================');
    }
  }

  /**
   * <p>Get the GUI with the given id. If no such GUI exists then the 
   * function returns undefined. </p>
   * <p>The global function getGUI(...) is an alternative method that
   * accepts the same parameters performs exactly the same task.</p>
   * @param id the GUI id 
   * @returns the matching GUI controller or undefined if not found.
   */
  static $$(id: string) {
    return GUI._guis.get(id);
  }

  /**
   * <p>The method  <code>GUI.get</code> has been removed from V2.1 </p>
   * <p>The global method <code>createGUI(...)</code> method <b><i>must</i></b>
   * be used instead.</p>
   * @deprecated
   * @throws an error that will terminate program execution
   */
  // static get(p5c: any, p: any) {
  //   throw new Error(`'GUI.get' method has been removed use createGUI(id, display) instead.`);
  // }

  /**
   * <p>The method  <code>GUI.getNamed</code> has been removed from V2.1 </p>
   * <p>The global method <code>createGUI(...)</code> method <b><i>must</i></b>
   * be used instead.</p>
   * 
   * @throws an error that will terminate program execution
   */
  // static getNamed(id, p5c: any) {
  //   throw new Error(`'GUI.getNamed' method has been removed use createGUI(id, display) instead.`);
  // }

  /**
   * <p>This method has been removed from V2.0 </p>
   * <p>The global method <code>createGUI(...)</code> method <b><i>must</i></b>
   * be used instead.</p>
   * 
   * @deprecated
   * @throws an error that will terminate program execution
   */
  // static create(id, p5c: any) {
  //   throw new Error(`'GUI.create' method has been removed use createGUI(id, display) instead.`);
  // }

  /**
   * <p>After V2.0 this method was marked as private and should not be used.</p> 
   * <p>The global method <code>createGUI(...)</code> method <b><i>must</i></b>
   * be used instead.</p>
   * 
   * @param id unique id for the GUI
   * @param canvas the HTMLCanvasElement or a value that can be used to find
   * the HTMLCanvasElement used for the display
   * @returns a GUI controller existing or new GUI with the given id.
   * @hidden
   */
  static _create(id: any, canvas: HTMLCanvasElement, pr: number, mode: string) {
    GUI.ANNOUNCE_CANVAS_GUI();
    if (typeof id !== 'string' || id.length === 0) {
      id = `#${Math.floor(111111 + 888888 * Math.random())}`;
      CWARN(`Invalid id provided so this GUI will be called '${id}' instead.`)
    }
    if (GUI._guis.has(id)) {
      CWARN(`You already have a GUI called '${id} it will not be replaced.`);
      return GUI._guis.get(id);
    }
    // Need to create a GUI for this canvas
    let gui = new GUI(id, canvas, pr, mode);
    GUI._guis.set(id, gui);
    return gui;
  }
}

/**
 * <p>This function <b><em>must be used</em></b> when creating a GUI.</p>
 * 
 * <p>Creates and returns a named GUI controller. If a GUI with the same id
 * exists then it is returned and a new GUI is not created.</p>
 * 
 * <p>If the first parameter is not a string variable or an empty string a 
 * random id will be generated for the new GUI.</p>
 * 
 * <p>The second parameter must be the one of the following :</p>
 * <ul>
 * <li>an existing HTML canvas element</li>
 * <li>the id of an existing HTML canvas element</li>
 * <li>if using p5js then value returned by the <code>createCanvas()'</code>
 * method executed in the <code>setup()'</code> function.</li>
 * </ul>
 * 
 * <p>Any other value will result the program being terminated with an 
 * error</p>
 * 
 * @param id unique id for the GUI
 * @param display something that identifies the display canvas element.
 * @returns a GUI controller with the given id.
 */
const createGUI = function (id: string, display: any) {
  let elt = typeof display === 'string'
    ? document.getElementById(display)
    : display;
  // The canvas element exists.
  if (elt instanceof HTMLCanvasElement) {
    const is_p5js = elt.className.startsWith('p5Canvas');
    const dp = is_p5js ? devicePixelRatio : 1;
    const mode = is_p5js ? 'p5js' : 'JS';
    return GUI._create(id, elt, dp, mode);
  }
  // See if p5js
  if (typeof display === 'object') {
    const ctor = display.constructor.name;
    if (ctor == 'Renderer2D' || ctor == 'RendererGL')
      return GUI._create(id, display.canvas, devicePixelRatio, 'p5js');
  }
  throw new Error(`Cannot find the canvas element for the GUI '${this._uid}'`);
}

/**
 * <p>Get the GUI with the given unique id. If no such GUI exists then the 
 * function returns undefined. </p>
 * @param id the GUI id
 * @returns the matching GUI controller or undefined if not found.
 */
const getGUI = function (id: string) {
  return GUI.$$(id);
}
