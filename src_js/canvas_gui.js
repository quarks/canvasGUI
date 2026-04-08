const CANVAS_GUI_VERSION = '!!VERSION!!';
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
    /**
     * Create a GUI object to create and manage the GUI controls for
     * an HTML canvas.
     *
     * @hidden
     * @param p5c the renderer
     * @param p the sketch instance
     */
    constructor(id, canvas, pixelRatio, mode) {
        // Prevent duplicate event handlers
        /** @hidden */ this._touchListenersCreated = false;
        /** @hidden */ this._mouseListenersCreated = false;
        /** @hidden */ this._keyListenersCreated = false;
        // Hide / disable GUI
        /** @hidden */ this._visible = true;
        /** @hidden */ this._enabled = true;
        /** @hidden */ this._is3D = false;
        // Controls
        /** @hidden */ this._controls = new Map();
        /** @hidden */ this._ctrls = [];
        /** @hidden */ this._corners = [4, 4, 4, 4];
        /** @hidden */ this._optionGroups = new Map();
        /** @hidden */ this._tSize = 12;
        /** @hidden */ this._tFace = 'sans-serif';
        /** @hidden */ this._tStyle = 'normal';
        /** @hidden */ this._iSize = 14;
        /** @hidden */ this._tipTextSize = 10;
        /** @hidden */ this._panesEast = [];
        /** @hidden */ this._panesSouth = [];
        /** @hidden */ this._panesWest = [];
        /** @hidden */ this._panesNorth = [];
        /** @hidden */ this._tabsInvalid = false;
        /** @hidden */ this._tabMinHeight = 16;
        // Attributes
        /** @hidden */ this._schemes = new Map();
        /** @hidden */ this._clipboard = '';
        // Tooltip times
        /** @hidden */ this._show_time = TT_SHOW_TIME;
        /** @hidden */ this._repeat_time = TT_REPEAT_TIME;
        /** @hidden */ this._color2control = new Map(); // Map the base pick color to the object
        /** @hidden */ this._control2color = new Map(); // Find the colour for a given object
        // Mouse position
        /** @hidden */ this._mouseX = 0;
        /** @hidden */ this._mouseY = 0;
        this._uid = id;
        this._mode = mode;
        this._pr = pixelRatio;
        this._canvas = canvas; // HTMLCanvasElement
        this._canvasContext = // Drawing context for canvas
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
    }
    /** @hidden */
    invalidateTabs() {
        this._tabsInvalid = true;
    }
    /** @hidden */
    _createGuiBuffers(w, h) {
        this._uiBuffer = new OffscreenCanvas(w, h);
        this._uiBuffer.getContext('2d')?.scale(this._pr, this._pr);
        this._pkBuffer = new OffscreenCanvas(w, h);
        this._pkBuffer.getContext('2d');
        this._clearGuiBuffers();
    }
    /**
     * Clear the gui buffers ready for next frame
     * @hidden
     */
    _clearGuiBuffers() {
        const [uib, pkb] = [this._uiBuffer, this._pkBuffer];
        uib.getContext('2d')?.clearRect(0, 0, uib.width, uib.height);
        pkb.getContext('2d')?.clearRect(0, 0, pkb.width, pkb.height);
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
        const uic = this._uiBuffer.getContext('2d');
        const pkc = this._pkBuffer.getContext('2d');
        if (!uic || !pkc)
            return;
        this._validateGuiBuffers();
        this._clearGuiBuffers();
        if (this._visible) {
            for (const c of this._ctrls)
                if (!c.getParent())
                    c._draw(uic, pkc);
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
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._uiBuffer);
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
    /**
     * <p>Create a pin control.</p>
     * <p>The Pin control is a simple place holder for containing child controls
     * relative to each other.</p>
     * @param id
     * @param x
     * @param y
     * @returns
     */
    pin(id, x, y) {
        return new CvsPin(this, id, x, y);
    }
    /**
     * Create a label control
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @param text optional face text
     * @param icon optional face icon
     * @returns a label
     */
    label(id, x, y, w, h, text, icon) {
        const ctrl = new CvsLabel(this, id, x, y, w, h);
        if (text)
            ctrl.text(text);
        if (icon)
            ctrl.icon(icon);
        return ctrl;
    }
    /**
     * Create a button control
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @param text optional face text
     * @param icon optional face icon
     * @returns a button
     */
    button(id, x, y, w, h, text, icon) {
        const ctrl = new CvsButton(this, id, x, y, w, h);
        if (text)
            ctrl.text(text);
        if (icon)
            ctrl.icon(icon);
        return ctrl;
    }
    /**
     * <p>Create an image button control.</p>
     * <p>The button size is determined by the size of the off-button image. If
     * a second image is provided (optional) then it will be used for the
     * over-button state. In the absence of the second image otherwise a border
     * highlight is used.</p>
     *
     * <p>The button hit-zone is any non-transparent pixel if the off-button
     * image of the mask image if provided. Any pixel with an alpha value
     * &ge;128 is considered non-transparent.</p>
     *
     *
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param images array of images for off-button and over-button states
     * @param mask hit zone image
     * @returns image button control
     */
    image(id, x, y, images, mask) {
        const ctrl = new CvsImage(this, id, x, y, cvsGuiCanvas(images), mask);
        ctrl._makePickImage();
        return ctrl;
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
    slider(id, x, y, w, h) {
        return new CvsSlider(this, id, x, y, w, h);
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
    ranger(id, x, y, w, h) {
        return new CvsRanger(this, id, x, y, w, h);
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
    textfield(id, x, y, w, h) {
        this._addKeyEventHandlers();
        return new CvsTextField(this, id, x, y, w, h);
    }
    /**
     * Create a checkbox control
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @param text optional face text
     * @returns a checkbox
     */
    checkbox(id, x, y, w, h, text) {
        const ctrl = new CvsCheckbox(this, id, x, y, w, h);
        if (text)
            ctrl.text(text);
        return ctrl;
    }
    /**
     * Create an option (radio button) control
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @param text optional face text
     * @returns an option button
     */
    option(id, x, y, w, h, text) {
        const ctrl = new CvsOption(this, id, x, y, w, h);
        if (text)
            ctrl.text(text);
        return ctrl;
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
    poster(id, x, y, w, h) {
        return new CvsPoster(this, id, x, y, w, h);
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
    panel(id, x, y, w, h) {
        return new CvsPanel(this, id, x, y, w, h);
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
    viewer(id, x, y, w, h) {
        return new CvsViewer(this, id, x, y, w, h);
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
    joystick(id, x, y, w, h) {
        return new CvsJoystick(this, id, x, y, w, h);
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
    knob(id, x, y, w, h) {
        return new CvsKnob(this, id, x, y, w, h);
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
    __scroller(id, x, y, w, h) {
        return new CvsScroller(this, id, x, y, w, h);
    }
    /**
     * Description placeholder
     * @param {string} id
     * @returns {CvsTooltip}
     * @hidden
     */
    __tooltip(id) {
        return new CvsTooltip(this, id);
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
    pane(id, location, depth) {
        let ctrl;
        depth = Math.round(depth);
        switch (location) {
            case 'north':
                ctrl = new CvsPaneNorth(this, id, depth);
                break;
            case 'south':
                ctrl = new CvsPaneSouth(this, id, depth);
                break;
            case 'west':
                ctrl = new CvsPaneWest(this, id, depth);
                break;
            case 'east':
            default: ctrl = new CvsPaneEast(this, id, depth);
        }
        return ctrl;
    }
    // ######           End of control factory methods             ######
    // ###### ++++++++++++++++++++++++++++++++++++++++++++++++++++ ######
    // ##################################################################
    /** @returns the canvas context type  */
    // get contextType() { return this._canvas["hasContext"]() }
    /** @returns true gui is over a 3D canvas  */
    get is3D() { return this._is3D; }
    /** @returns 'p5js' if using p5.js else returns 'JS' */
    get mode() { return this._mode; }
    /** @returns an array with the names of built-in color schemes */
    get colorSchemeNames() {
        return Array.from(['blue', 'green', 'red', 'cyan', 'yellow', 'purple', 'orange', 'light', 'dark']);
    }
    /** @returns true if this gui can respond to mouse/key events   */
    get isEnabled() { return this._enabled; }
    /** @returns true if gui rendering is allowed   */
    get isVisible() { return this._visible; }
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
    grid(x, y, w, h) {
        return new GridLayout(x, y, w, h);
    }
    /**
     * Returns the unique id for this GUI.
     *
     * @returns GUI id
     */
    id() {
        return this._uid;
    }
    /**
     * <p>Gets or sets the global minimum height for pane tabs.</p>
     * @param th the minimum tab height (must be &ge;10)
     * @returns this gui instance
     */
    tabHeight(th) {
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
    show() {
        this._visible = true;
        return this;
    }
    /**
     * Hides all the controls for this gui
     * @returns this gui
     */
    hide() {
        this._visible = false;
        return this;
    }
    /**
     * Enable mouse/key event handling for this gui
     * @returns this gui
     */
    enable() {
        this._enabled = true;
        return this;
    }
    /**
     * Disable mouse/key event handling for this gui
     * @returns this gui
     */
    disable() {
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
    _addFocusHandlers() {
        const canvas = this._canvas;
        canvas.addEventListener('focusout', (e) => { this._processFocusEvent(e); });
        canvas.addEventListener('focusin', (e) => { this._processFocusEvent(e); });
    }
    /** @hidden */
    _addMouseEventHandlers() {
        if (!this._mouseListenersCreated) {
            const canvas = this._canvas;
            // Add mouse events
            canvas.addEventListener('mousedown', (e) => { this._processMouseEvent(e); });
            canvas.addEventListener('mouseup', (e) => { this._processMouseEvent(e); });
            canvas.addEventListener('mousemove', (e) => { this._processMouseEvent(e); });
            canvas.addEventListener('wheel', (e) => { this._processMouseEvent(e); });
            // Leave and enter canvas
            canvas.addEventListener('mouseout', (e) => { this._processMouseEvent(e); });
            canvas.addEventListener('mouseenter', (e) => { this._processMouseEvent(e); });
            this._mouseListenersCreated = true;
        }
    }
    /** @hidden */
    _addKeyEventHandlers() {
        if (!this._keyListenersCreated) {
            const keyTarget = document.getElementById(this._canvas.id);
            keyTarget?.setAttribute('tabindex', '0');
            keyTarget?.focus();
            keyTarget?.addEventListener('keydown', (e) => { this._processKeyEvent(e); return false; });
            keyTarget?.addEventListener('keyup', (e) => { this._processKeyEvent(e); return false; });
            this._keyListenersCreated = true;
        }
    }
    /** @hidden */
    _addTouchEventHandlers() {
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
    _processMouseEvent(e) {
        if (this._visible && this._enabled) {
            const rect = this._canvas.getBoundingClientRect();
            this._processEvent(e, e.clientX - rect.left, e.clientY - rect.top);
            // e.preventDefault();
        }
    }
    /** @hidden */
    _processTouchEvent(e) {
        if (this._visible && this._enabled) {
            const rect = this._canvas.getBoundingClientRect();
            const te = e.changedTouches[0];
            this._processEvent(e, te.clientX - rect.left, te.clientY - rect.top);
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
    _processEvent(e, x, y) {
        this._mouseX = x;
        this._mouseY = y;
        if (e.type == 'mouseout') {
            if (this._currOver)
                this._currOver.over = false;
            if (this._prevOver)
                this._prevOver.over = false;
        }
        // Ignore mouse / touch events while we have an active textfield
        if (this._activeCtrl instanceof CvsTextField)
            return;
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
    _processKeyEvent(e) {
        // Pass the event if the active control is a CvsTextField
        if (this._visible && this._enabled && this._activeCtrl instanceof CvsTextField)
            this._activeCtrl = this._activeCtrl._doKeyEvent(e);
    }
    /** @hidden */
    _processFocusEvent(e) {
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
    get mouseX() { return this._mouseX; }
    /** @returns mouse y position relative to top-left corner of the canvas */
    get mouseY() { return this._mouseY; }
    //     End of Event handlers
    // ===============================================================================
    /**
     * <p>Get the control given it's unique id.</p>
     * @param id unique ID for the control to find
     * @returns  get the associated control
     */
    $(id) {
        return (typeof id === "string") ? this._controls.get(id) : id;
    }
    registerID(control) {
        CASSERT(!this._controls.has(control.id), `Control '${control.id}' already exists and will be replaced.`);
        // Map control by ID
        this._controls.set(control.id, control);
        // Now find render order
        this._ctrls = [...this._controls.values()];
        this.setRenderOrder();
        return control;
    }
    /**
     * <p>Register a control so it is pickable.</p>
     * <p>If the control has already been registered it will be unchanged.</p>
     *
     * @param control the control to make pickable
     */
    registerPickable(control) {
        if (control && !this._control2color.has(control)) {
            this._control2color.set(control, this._NEXT_COLOR);
            this._color2control.set(this._NEXT_COLOR, control);
            this._NEXT_COLOR += this._COLOR_STEP;
        }
    }
    /**
     * Add an object so it can be detected using this pick buffer.
     * @param control the object to add
     * @hidden
     */
    register(control) {
        if (control && !this._control2color.has(control)) {
            this._control2color.set(control, this._NEXT_COLOR);
            this._color2control.set(this._NEXT_COLOR, control);
            this._NEXT_COLOR += this._COLOR_STEP;
        }
    }
    /**
     * Sorts the controls so that they are rendered in order of their z
     * value (low z --> high z).
     * @hidden
     */
    setRenderOrder() {
        this._ctrls.sort((a, b) => { return a.z - b.z; });
    }
    /**
     * Remove this object so it can't be detected using this pick buffer.
     * @param control the object to remove
     * @hidden
     */
    deregister(control) {
        if (control && this._control2color.has(control)) {
            const pc = this._control2color.get(control);
            this._control2color.delete(control);
            this._color2control.delete(pc);
        }
    }
    /**
     * <p>Get the pick color associated with the control. If the control is
     * pickable it will return an object describing the pick color otherwise
     * it returns the color 'white'</p>
     *
     * @hidden
     * @param control the control we are interested in.
     * @returns the pick color descriptor object
     */
    pickColor(control) {
        if (this._control2color.has(control)) {
            const pc = this._control2color.get(control);
            const [r, g, b] = [(pc >> 16) & 0xFF, (pc >> 8) & 0xFF, pc & 0xFF];
            return { r: r, g: g, b: b, cssColor: `rgb(${r} ${g} ${b})` };
        }
        return { r: 255, g: 255, b: 255, cssColor: 'white' };
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
        if (!ele) { // Create the HTML canvas element if it doesn't exist
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
            ctx?.drawImage(buffer, 0, 0, buffer.width, buffer.height, 0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    }
    /**
     * List the controls and their buffers.
     * @hidden
     */
    listBuffers() {
        CLOG('----------------------   List of Buffers    ---------------------');
        for (let [id, ctrl] of this._controls) {
            const bs = ctrl.bufferStatus;
            const uic = bs.ui ? 'Y' : 'N';
            const pkc = bs.pk ? 'Y' : 'N';
            const pickable = this._control2color.has(ctrl) ? "Y" : "N";
            const id = `${ctrl.type}   ${ctrl.id}  ................................`
                .substring(0, 30);
            CLOG(`${id}    ui: ${uic}     pk: ${pkc}     pickable:${pickable}`);
        }
        CLOG('-----------------------------------------------------------------');
    }
    /**
     * <p>Gets the option group associated with a given name. If the group
     * does not exist create it.</p>
     * @param name the name of the option group
     * @returns the maatching option group
     * @hidden
     */
    getOptionGroup(name) {
        let og = this._optionGroups.get(name);
        if (!og) {
            og = new CvsOptionGroup(name);
            this._optionGroups.set(name, og);
        }
        return og;
    }
    /**
     * Sets the global default icon for checkboxes and option buttons.
     * @param size iscon size (pixels)
     * @returns
     */
    iconSize(size) {
        if (!Number.isFinite(size))
            return this._iSize;
        this._iSize = Math.ceil(size);
        this._ctrls.forEach((c) => {
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
    textSize(tsize) {
        if (!Number.isFinite(tsize))
            return this._tSize;
        this._tSize = Number(tsize);
        // Update visual for all controls
        this._ctrls.forEach((c) => { c.invalidateBuffer(); });
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
    textFont(font) {
        const fface = cvsGuiFont(font);
        if (fface)
            this._tFace = fface;
        else
            CWARN(`'${font?.toString()}' is unrecognized so will be ignored!`);
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
    textStyle(style) {
        if (!style)
            return this._tStyle; // getter
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
    tipTextSize(gtts) {
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
    corners(...c) {
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
        for (const pane of this._panesEast)
            pane.close();
        for (const pane of this._panesWest)
            pane.close();
        for (const pane of this._panesSouth)
            pane.close();
        for (const pane of this._panesNorth)
            pane.close();
    }
    /**
     * Hide all side panes. This will also close any pane that is open.<br>
     */
    hidePanes() {
        this._closePanes();
        for (const pane of this._panesEast)
            pane.hide();
        for (const pane of this._panesWest)
            pane.hide();
        for (const pane of this._panesSouth)
            pane.hide();
        for (const pane of this._panesNorth)
            pane.hide();
    }
    /**
     * Show all pane tabs. All panes will be shown closed.
     */
    showPanes() {
        for (const pane of this._panesEast)
            pane.show();
        for (const pane of this._panesWest)
            pane.show();
        for (const pane of this._panesSouth)
            pane.show();
        for (const pane of this._panesNorth)
            pane.show();
    }
    /**
     * Reposition all tabs attached to East side
     * @hidden
     */
    validateTabsEast() {
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
    validateTabsWest() {
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
    validateTabsSouth() {
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
    validateTabsNorth() {
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
    _initColorSchemes() {
        this._scheme = new BlueScheme();
        this._schemes
            .set('blue', this._scheme)
            .set('green', new GreenScheme())
            .set('red', new RedScheme())
            .set('cyan', new CyanScheme())
            .set('yellow', new YellowScheme())
            .set('purple', new PurpleScheme())
            .set('orange', new OrangeScheme())
            .set('light', new LightScheme())
            .set('dark', new DarkScheme());
    }
    /**
     * <p>Set or get the existing global color scheme.</p>
     * @param csName name of the color scheme to set
     * @returns this gui instance
     */
    scheme(csName) {
        if (!csName) {
            return this._scheme;
        }
        // set global scheme and invalidate any controls using the global scheme
        const scheme = this._schemes.get(csName);
        if (scheme) {
            this._scheme = scheme;
            // Invalidate all controls
            this._ctrls.forEach((c) => c.invalidateBuffer());
        }
        else
            CWARN(`'${csName}' is not a valid color scheme`);
        return this;
    }
    /**
     * <p>Get the named color scheme.</p>
     * @param csName the name of the color scheme
     * @returns the color scheme or undefined if it doesn't exist
     */
    getScheme(csName) {
        const scheme = this._schemes.get(csName);
        if (scheme)
            return scheme;
        CWARN(`Unable to retrieve color scheme '${csName}'`);
        return undefined;
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
     * @param userName a unique name for the user's color scheme.
     * @param srcName the name of an existing color scheme.
     * @returns the new color scheme or null if unable to create it.
     */
    createScheme(userName = '', srcName = '') {
        const srcScheme = this.getScheme(srcName);
        if (!srcScheme) {
            CWARN(`The source scheme '${srcName}', does not exist.`);
            return undefined;
        }
        if (typeof userName !== "string" || userName.length === 0) {
            CWARN(`Inavlid name for the user color scheme.`);
            return undefined;
        }
        return new UserColorScheme(userName, srcScheme);
    }
    /**
     * <p>Adds a new color scheme to those already available. It does not replace an
     * existing scheme.</p>
     * @param scheme  the color scheme
     * @returns this gui instance
     */
    addScheme(scheme) {
        if (!(scheme instanceof ColorScheme)) {
            CWARN(`The parameter is not a valid color scheme so can't be used.`);
        }
        else if (this._schemes.has(scheme.name))
            CERROR(`Cannot add scheme '${scheme.name}' because it already exists.'`);
        else
            this._schemes.set(scheme.name, scheme);
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
    getPicked(x, y) {
        x *= this._pr;
        y *= this._pr;
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
    getPickColor(x, y) {
        const imgData = this._pkBuffer.getContext('2d')?.getImageData(x, y, 1, 1);
        const r = imgData?.data[0] ?? 255;
        const g = imgData?.data[1] ?? 255;
        const b = imgData?.data[2] ?? 255;
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
    static $$(id) {
        return GUI._guis.get(id);
    }
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
    static _create(id, canvas, pr, mode) {
        GUI.ANNOUNCE_CANVAS_GUI();
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
/** canvasGUI version */
GUI.VERSION = '!!VERSION!!';
// Remember all GUIs created are accessible using gui's unique string
// identifier.
/** @hidden */ GUI._guis = new Map();
// Vertices used in shader program to reneder gui over WebGL2 canvas
/** @hidden */ GUI.VERTS = new Float32Array([-1, -1, 0, -1, 1, 0, 1, 1, 0, 1, -1, 0]);
/**
 *
 * <h2>Creates and returns a GUI controller.</h2>
 * <p><b><em>This function must be used when creating a GUI.</em></b></p>
 *
 * <p>If no 'id' is passed to the function canvasGUI will generate a random
 * 'id'. If there is a pre-exisiting gui with the id provided it will be returned
 * instead of creating a new one.</p>
 *
 * <p>The second parameter must be the one of the following :</p>
 * <ul>
 * <li>an existing HTML canvas element</li>
 * <li>the id of an existing HTML canvas element</li>
 * <li>if using p5js then value returned by the <code>createCanvas()'</code>
 * method when executed in the <code>setup()'</code> function.</li>
 * </ul>
 * <p>Any other value will result the program being terminated with an
 * error</p>
 *
 * @param id unique id for the GUI
 * @param display something that identifies the display canvas element.
 * @returns a GUI controller with the given id.
 */
const createGUI = function (id, display) {
    if (arguments.length === 1) {
        display = arguments[0];
        id = `#${Math.floor(1111 + 8888 * Math.random())}`;
        CWARN(`Since no 'id' was provided this GUI will be called '${id}'.`);
    }
    const elt = typeof display === 'string'
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
    throw new Error(`Cannot find the canvas element for the GUI '${id}'`);
};
/**
 * <p>Get the GUI with the given unique id. If no such GUI exists then the
 * function returns undefined. </p>
 * @param id the GUI id
 * @returns the matching GUI controller or undefined if not found.
 */
const getGUI = function (id) {
    return GUI.$$(id);
};
//# sourceMappingURL=canvas_gui.js.map