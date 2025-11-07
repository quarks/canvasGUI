 /**
 * @preserve canvasGUI    (c) Peter Lager  2025
 * @license MIT
 * @version 2.0.0
 */
const CANVAS_GUI_VERSION = '2.0.0';
const [CLOG, CWARN, CERROR, CASSERT, CCLEAR] = [console.log, console.warn, console.error, console.assert, console.clear];
const DELTA_Z = 64, PANEL_Z = 2048, PANE_Z = 4096;
const TT_SHOW_TIME = 1600, TT_REPEAT_TIME = 10000;
const FONTS = new Set(['arial', 'verdana', 'tahoma', 'trebuchet ms',
    'times new roman', 'georgia', 'courier new', 'brush script mt',
    'impact', 'serif', 'sans-serif', 'monospace']);
const IS_VALID_FONT = function (fontname) {
    return FONTS.has(fontname);
};
const MEASURE_TEXT = function (text, cvs, font, style, size) {
    cvs.push();
    cvs.textAlign('left');
    cvs.textFont(font);
    cvs.textStyle(style);
    cvs.textSize(size);
    let m = cvs.drawingContext.measureText(text);
    cvs.pop();
    return {
        left: m.actualBoundingBoxLeft,
        right: m.actualBoundingBoxRight,
        tw: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
        fw: m.width,
        ascent: m.actualBoundingBoxAscent,
        descent: m.actualBoundingBoxDescent
    };
};
/**
 * <p>Core class for the canvasGUI library </p>
 * <p>Use an instance of GUI (the controller) to control all aspects of your gui.</p>
 * <ul>
 * <li>Create the UI controls e.g. buttons, sliders</li>
 * <li>Provides 9 color schemes for the controls</li>
 * </ul>
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
    constructor(p5c, p = p5.instance) {
        // Prevent duplicate event handlers
        /** @hidden */ this._touchListenersCreated = false;
        /** @hidden */ this._mouseListenersCreated = false;
        /** @hidden */ this._keyListenersCreated = false;
        // Hide / disable GUI
        /** @hidden */ this._visible = true;
        /** @hidden */ this._enabled = true;
        // Tooltip times
        /** @hidden */ this._show_time = TT_SHOW_TIME;
        /** @hidden */ this._repeat_time = TT_REPEAT_TIME;
        this._renderer = p5c;
        this._canvas = p5c.canvas;
        // GUI creation
        this._target = document.getElementById(p5c.canvas.id); // for keyboard events
        this._p = p; // p5 instance
        this._controls = new Map(); // registered controls
        this._ctrls = []; // controls in render order
        this._corners = [4, 4, 4, 4];
        this._optionGroups = new Map();
        // Text attributes
        this._textSize = 12;
        this._textFont = 'sans-serif';
        this._textStyle = 'normal';
        this._tipTextSize = 10;
        // Pick buffer
        this._COLOR_STEP = 8;
        this._PART_MASK = this._COLOR_STEP - 1;
        this._COLOR_MASK = 0x00FFFFFF ^ this._PART_MASK;
        this._NEXT_COLOR = this._COLOR_STEP;
        this._colorKey = new Map();
        this._ctrlKey = new Map();
        // Side panes
        this._panesEast = [];
        this._panesSouth = [];
        this._panesWest = [];
        this._panesNorth = [];
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
        this._drawHud = p5c.GL ? this._drawHudWEBGL : this._drawHudP2D;
        // Prepare buffers
        this._validateGuiBuffers();
        // Camera method depends on major version of p5js
        this._getCamera = Number(p.VERSION.split('.')[0]) == 1
            ? function () { return this._renderer._curCamera; } // V1
            : function () { return this._renderer.states.curCamera; }; // V2
    }
    /**
     * Make sure we have an overlay buffer and a pick buffer of the correct size
     * @hidden
     */
    _validateGuiBuffers() {
        let p = this._p;
        if (!this._hud || this._hud.width != p.width || this._hud.height != p.height) {
            this._hud = p.createGraphics(p.width, p.height);
            this._hud.pixelDensity(window.devicePixelRatio);
            this._hud.clear();
            this._pickbuffer = p.createGraphics(p.width, p.height);
            this._pickbuffer.pixelDensity(window.devicePixelRatio);
            this._pickbuffer.clear();
        }
    }
    // ##################################################################
    // ###### ++++++++++++++++++++++++++++++++++++++++++++++++++++ ######
    // ######         Factory methods to create controls          #######
    // ###### ++++++++++++++++++++++++++++++++++++++++++++++++++++ ######
    // ##################################################################
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
    ranger(id, x, y, w, h) {
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
    button(id, x, y, w, h) {
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
    textfield(id, x, y, w, h) {
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
    checkbox(id, x, y, w, h) {
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
    option(id, x, y, w, h) {
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
    label(id, x, y, w, h) {
        return this.addControl(new CvsLabel(this, id, x, y, w, h), false);
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
    viewer(id, x, y, w, h) {
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
    joystick(id, x, y, w, h) {
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
    knob(id, x, y, w, h) {
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
    __scroller(id, x, y, w, h) {
        return this.addControl(new CvsScroller(this, id, x, y, w, h), true);
    }
    /**
     * Description placeholder
     * @param {string} id
     * @returns {CvsTooltip}
     * @hidden
     */
    __tooltip(id) {
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
        return this.addControl(ctrl, false);
    }
    // ######           End of control factory methods             ######
    // ###### ++++++++++++++++++++++++++++++++++++++++++++++++++++ ######
    // ##################################################################
    /**
     * @returns true if this gui can respond to mouse/key events
     */
    get isEnabled() { return this._enabled; }
    /**
     * @returns true if gui rendering is allowed
     */
    get isVisible() { return this._visible; }
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
     * Returns the name of this GUI. If the GUI is not named then
     * the returned value is undefined.
     *
     * @returns the name of this gui or undefined
     */
    name() {
        return this._uid;
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
        let canvas = this._canvas;
        canvas.addEventListener('focusout', (e) => { this._processFocusEvent(e); });
        canvas.addEventListener('focusin', (e) => { this._processFocusEvent(e); });
    }
    /** @hidden */
    _addMouseEventHandlers() {
        if (!this._mouseListenersCreated) {
            let canvas = this._canvas;
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
            this._target.setAttribute('tabindex', '0');
            this._target.focus();
            this._target.addEventListener('keydown', (e) => { this._processKeyEvent(e); return false; });
            this._target.addEventListener('keyup', (e) => { this._processKeyEvent(e); return false; });
            this._keyListenersCreated = true;
        }
    }
    /** @hidden */
    _addTouchEventHandlers() {
        if (!this._touchListenersCreated) {
            let canvas = this._canvas;
            // Add touch events
            canvas.addEventListener('touchstart', (e) => { this._processTouchEvent(e); });
            canvas.addEventListener('touchend', (e) => { this._processTouchEvent(e); });
            canvas.addEventListener('touchmove', (e) => { this._processTouchEvent(e); });
            canvas.addEventListener('touchcancel', (e) => { this._processTouchEvent(e); });
            this._touchListenersCreated = true;
        }
    }
    // ===============================================================================
    //     V2 event handlers
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
        // Ignore mouse / touch events while we have an active textfield
        if (this._activeCtrl instanceof CvsTextField)
            return;
        let over = this.getPicked(x, y);
        this._currOver = over.control;
        // Determine if we have entered current over control
        let enter = this._currOver && this._currOver != this._prevOver;
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
        // Paas the event if the active control is a CvsTextField
        if (this._visible && this._enabled && this._activeCtrl instanceof CvsTextField) {
            this._activeCtrl = this._activeCtrl._doKeyEvent(e);
        }
    }
    /** @hidden */
    _processFocusEvent(e) {
        switch (e.type) {
            case 'focusout':
                console.log(`Focus out ${this._activeCtrl?.id}`);
                if (this._activeCtrl instanceof CvsTextField) {
                    this._activeCtrl._deactivate();
                    this._activeCtrl = null;
                }
                break;
            case 'focusin':
                console.log(`Focus in ${this._activeCtrl?.id}`);
                break;
        }
    }
    //     End of V2 event handlers
    // ===============================================================================
    /**
     * <p>Get the control given it's unique name.</p>
     * @param id unique ID for the control to find
     * @returns  get the associated control
     */
    $(id) {
        return (typeof id === "string") ? this._controls.get(id) : id;
    }
    /**
     * <p>Adds a child control to this gui.</p>
     * @param control the child control to add
     * @returns the control just added
     * @hidden
     */
    addControl(control, pickable = false) {
        CASSERT(!this._controls.has(control.id), `Control '${control.id}' already exists and will be replaced.`);
        // Map control by ID
        this._controls.set(control.id, control);
        // Now find render order
        this._ctrls = [...this._controls.values()];
        this.setRenderOrder();
        if (pickable)
            this.register(control);
        return control;
    }
    /**
     * Sorts the controls so that they are rendered in order of their z
     * value (low z --> high z)
     * @hidden
     */
    setRenderOrder() {
        this._ctrls.sort((a, b) => { return a.z - b.z; });
    }
    /**
     * Add an object so it can be detected using this pick buffer.
     * @param control the object to add
     * @hidden
     */
    register(control) {
        if (control && !this._ctrlKey.has(control)) {
            this._ctrlKey.set(control, this._NEXT_COLOR);
            this._colorKey.set(this._NEXT_COLOR, control);
            this._NEXT_COLOR += this._COLOR_STEP;
        }
    }
    /**
     * Remove this object so it can't be detected using this pick buffer.
     * @param control the object to remove
     * @hidden
     */
    deregister(control) {
        if (control && this._ctrlKey.has(control)) {
            let pc = this._ctrlKey.get(control);
            this._ctrlKey.delete(control);
            this._colorKey.delete(pc);
        }
    }
    /**
     * @hidden
     * @param control the control we need the pick color for
     * @returns the associated pick color numeric value (rgb)
     */
    pickColor(control) {
        if (this._ctrlKey.has(control)) {
            let pc = this._ctrlKey.get(control);
            return { r: (pc >> 16) & 0xFF, g: (pc >> 8) & 0xFF, b: pc & 0xFF, };
        }
        return undefined;
    }
    /**
     * Display the buffer in a canvas element with the given id.
     * If there is no element with this id or if it is not a canvas element
     * a canvas element will be created and appended to the body section.
     *
     * @param cvsID the id of a canvas element
     */
    showBuffer(cvsID, bfr = this._pickbuffer) {
        let ele = document.getElementById(cvsID);
        if (!ele) {
            ele = document.createElement('canvas');
            ele.setAttribute('id', cvsID);
            document.getElementsByTagName('body')[0].append(ele);
        }
        ele.setAttribute('width', `${bfr.width}`);
        ele.setAttribute('height', `${bfr.height}`);
        ele.setAttribute('padding', '3px');
        ele.style.border = '2px solid #000000';
        if (ele instanceof HTMLCanvasElement) {
            let dpr = window.devicePixelRatio;
            let [src, sw, sh] = [bfr.canvas, bfr.width * dpr, bfr.height * dpr];
            let ctx = ele.getContext('2d'), cvs = ctx.canvas;
            ctx.drawImage(src, 0, 0, sw, sh, 0, 0, cvs.width, cvs.height);
        }
    }
    /**
     * List the controls created so far
     * @hidden
     */
    listControls() {
        CLOG("--------------------   List of controls   --------------------");
        this._ctrls.forEach(c => {
            let id = `${c.id}                               `.substring(0, 15);
            let ctype = `${c.constructor.name}                   `.substring(0, 15);
            let z = `Z: ${c.z}      `.substring(0, 10);
            let pc = `Color key: ${this._ctrlKey.get(c)}`;
            CLOG(id + ctype + z + pc);
        });
        CLOG('--------------------------------------------------------------');
    }
    /**
     * <p>Gets the option group associated with a given name.</p>
     * @param name the name of the oprion group
     * @returns the option group
     * @hidden
     */
    getOptionGroup(name) {
        if (!this._optionGroups.has(name))
            this._optionGroups.set(name, new CvsOptionGroup(name));
        return this._optionGroups.get(name);
    }
    /**
     * <p>Sets or gets the global text size.</p>
     * <p>If no parameter is passed then the global text size is returned
     * otherwise it returns this gui.</p>
     * @param gts new global text size
     * @returns the global text size or this gui
     */
    textSize(gts) {
        if (!Number.isFinite(gts))
            return this._textSize;
        this._textSize = gts;
        // Update visual for all controls
        this._controls.forEach((c) => { c.invalidateBuffer(); });
        return this;
    }
    /**
     * <p>Sets or gets the global text font.</p>
     * <p>If the parameter is a true-type-font <em>or</em> the name of a system
     * font it will be used as the global font and this gui will be returned.</p>
     * <p>Recognised font names are :-</p>
     * <pre>
     * 'arial'             'verdana'   'tahoma'        'trebuchet ms'
     * 'times new roman'   'georgia'   'courier new'   'brush script mt'
     * 'impact'            'serif'     'sans-serif'    'monospace'
     * </pre>
     * <p>Invalid fonts are ignored and the global font is unchanged.</p>
     * <p>If no parameter is passed then the current font is returned.</p>
     * @param gtf A true-type-font or the name (case-insensitive) of a
     * valid system font.
     * @returns this gui
     */
    textFont(gtf) {
        if (!gtf)
            return this._textFont; // getter
        if (gtf instanceof p5.Font)
            this._textFont = gtf;
        else if (IS_VALID_FONT(gtf.toLowerCase()))
            this._textFont = gtf;
        else
            CWARN(`The font '${gtf}' was not recognized so will be ignored!`);
        return this;
    }
    /**
     * <p>Sets or gets the global text style.</p>
     * <p>The 4 recognised font styles are :-</p>
     * <pre>
     * NORMAL    BOLD   ITALIC   BOLDITALIC
     * </pre>
     * <p>Unrecognized styles are ignored and the global style is unchanged.</p>
     * <p>If no parameter is passed then the current style is returned.</p>
     * @param gty the font style to use.
     * @returns this gui
     */
    textStyle(gty) {
        if (!gty)
            return this._textStyle; // getter
        gty = gty.toLowerCase();
        switch (gty) {
            case 'normal':
            case 'bold':
            case 'italic':
            case 'bold italic':
                this._textStyle = gty;
                break;
            default:
                CWARN(`The text style '${gty}' was not recognized so will be ignored!`);
        }
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
    corners(c) {
        if (Array.isArray(c) && c.length == 4)
            this._corners = [...c];
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
     * Close all side panes
     * Replaces _closeAll
     * @hidden
     */
    _closePanes() {
        for (let pane of this._panesEast)
            pane.close();
        for (let pane of this._panesWest)
            pane.close();
        for (let pane of this._panesSouth)
            pane.close();
        for (let pane of this._panesNorth)
            pane.close();
    }
    /**
     * Hide all side panes. This will also close any pane that is open.<br>
     */
    hidePanes() {
        this._closePanes();
        for (let pane of this._panesEast)
            pane.hide();
        for (let pane of this._panesWest)
            pane.hide();
        for (let pane of this._panesSouth)
            pane.hide();
        for (let pane of this._panesNorth)
            pane.hide();
    }
    /**
     * Show all pane tabs. All panes will be shown closed.
     */
    showPanes() {
        for (let pane of this._panesEast)
            pane.show();
        for (let pane of this._panesWest)
            pane.show();
        for (let pane of this._panesSouth)
            pane.show();
        for (let pane of this._panesNorth)
            pane.show();
    }
    /**
     * Reposition all tabs attached to East side
     * @hidden
     */
    validateTabsEast() {
        let panes = this._panesEast, n = panes.length;
        // Find length of tabs
        let sum = 2 * (n - 1);
        panes.forEach(p => (sum += p.tab()._w));
        // Now find start position for the first tab
        let pos = (this.canvasHeight() - sum) / 2;
        for (let i = 0; i < n; i++) {
            let pane = panes[i], tab = pane.tab();
            let x = -tab._h, y = pos;
            pos += tab._w + 2;
            tab._x = x;
            tab._y = y;
        }
    }
    /**
     * Reposition all tabs attached to West side
     * @hidden
     */
    validateTabsWest() {
        let panes = this._panesWest;
        let n = panes.length;
        // Find length of tabs
        let sum = 2 * (n - 1);
        panes.forEach(p => (sum += p.tab()._w));
        // Now find start position for the first tab
        let pos = (this.canvasHeight() - sum) / 2;
        for (let i = 0; i < n; i++) {
            let pane = panes[i], tab = pane.tab();
            let x = pane.depth(), y = pos;
            pos += tab._w + 2;
            tab._x = x;
            tab._y = y;
        }
    }
    /**
     * Reposition all tabs attached to South side
     * @hidden
     */
    validateTabsSouth() {
        let panes = this._panesSouth;
        let n = panes.length;
        // Find length of tabs
        let sum = 2 * (n - 1);
        panes.forEach(p => (sum += p.tab()._w));
        // Now find start position for the first tab
        let pos = (this.canvasWidth() - sum) / 2;
        for (let i = 0; i < n; i++) {
            let pane = panes[i], tab = pane.tab();
            let x = pos, y = -tab._h;
            pos += tab._w + 2;
            tab._x = x;
            tab._y = y;
        }
    }
    /**
     * Reposition all tabs attached to North side
     * @hidden
     */
    validateTabsNorth() {
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
    /** @hidden */
    _initColorSchemes() {
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
     * <p>Set or get an existing global color scheme.</p>
     * @param schemename color scheme to set
     * @returns this gui instance
     */
    scheme(schemename) {
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
            CERROR(`'${schemename}' is not a valid color scheme`);
        return this;
    }
    /**
     * <p>Get a copy of the named color scheme.</p>
     * @param schemename the name of the color scheme
     * @returns the color scheme or undefined if it doesn't exist
     * @hidden
     */
    _getScheme(schemename) {
        if (schemename && this._schemes[schemename])
            return Object.assign({}, this._schemes[schemename]);
        CWARN(`Unable to retrieve color scheme '${schemename}'`);
        return undefined;
    }
    /**
     * <p>Adds a new color scheme to those already available. It does not replace an
     * existing scheme.</p>
     * @param schemename the name of the color scheme
     * @param scheme  the color scheme
     * @returns this gui instance
     */
    addScheme(schemename, scheme) {
        if (typeof schemename === 'string' && !scheme) {
            if (!this._schemes[schemename])
                this._schemes[schemename] = scheme;
            else
                CERROR(`Cannot add scheme '${schemename}' because it already exists.'`);
        }
        return this;
    }
    /**
     * The main draw method.
     * @hidden
     */
    draw() {
        this._hud.clear();
        this._pickbuffer.clear();
        if (this._visible) {
            this._p.push();
            for (let c of this._ctrls)
                if (!c.getParent())
                    c._draw(this._hud, this._pickbuffer);
            this._p.pop();
            this._drawHud();
        }
    }
    /**
     * The V2 P2D draw method
     * @hidden
     */
    _drawHudP2D() {
        this._p.push();
        this._p.image(this._hud, 0, 0); // Display GUI controls
        this._p.pop();
    }
    /**
     * The V1 WEBGL draw method
     * @hidden
     */
    _drawHudWEBGL() {
        this._p.push();
        let renderer = this._renderer, gl = renderer.drawingContext;
        let w = renderer.width, h = renderer.height, d = Number.MAX_VALUE;
        gl.flush();
        let mvMatrix = renderer.uMVMatrix.copy();
        let pMatrix = renderer.uPMatrix.copy();
        // Now prepare renderer for standard 2D output to draw GUI
        gl.disable(gl.DEPTH_TEST);
        renderer.resetMatrix();
        this._getCamera().ortho(0, w, -h, 0, -d, d);
        this._p.image(this._hud, 0, 0); // Display GUI controls
        gl.flush();
        renderer.uMVMatrix.set(mvMatrix);
        renderer.uPMatrix.set(pMatrix);
        gl.enable(gl.DEPTH_TEST);
        this._p.pop();
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
        let pkb = this._pickbuffer;
        let result = { control: null, part: -1 };
        if (x >= 0 && x < pkb.width && y >= 0 && y < pkb.height) {
            let c = pkb.get().get(x, y); // [r, g, b, a]
            let rgb = (c[0] << 16) + (c[1] << 8) + c[2]; // rgb vlaue
            let ctl_col = rgb & this._COLOR_MASK;
            result.control = this._colorKey.get(ctl_col);
            result.part = rgb & this._PART_MASK;
        }
        return result;
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
     * <p>Returns a named GUI controller.</p>
     * <p>If an exisiting GUI has the same name it will be returned, otherwise
     * a new GUI will be created and returned</p>
     * <p>If the name parameter is not of type 'string' or an empty string then
     * the returned value is undefined.</p>
     *
     *
     * @param name unique name for the GUI
     * @param p5c the renderer - the display canvas
     * @param p the processing instance (required in Instance mode)
     * @returns a GUI controller existing or new GUI with the given name.
     */
    static create(name, p5c, p = p5.instance) {
        GUI.ANNOUNCE_CANVAS_GUI();
        if (GUI._guis.has(name)) {
            CWARN(`You already have a  GUI called '${name} it will not be replaced`);
            return GUI._guis.get(name);
        }
        // Need to create a GUI for this canvas
        let gui = new GUI(p5c, p);
        GUI._guis.set(name, gui);
        return gui;
    }
    /**
   * <p>Get the GUI with the given name. If no such GUI exists then the
   * function returns undefined. </p>
   * <p>The global function getGUI(...) is an alternative method that
   * accepts the same parameters performs exactly the same task.</p>
   * @param name the name of the GUI to get
   * @returns the matching GUI controller or undefined if not found.
   */
    static $$(name) {
        return GUI._guis.get(name);
    }
}
/** canvasGUI version */
GUI.VERSION = '2.0.0';
// Every GUI must have a unique string identifier.
/** @hidden */ GUI._guis = new Map();
/**
 * <p>Returns a named GUI controller.</p>
 * <p>If an exisiting GUI has the same name it will be returned, otherwise
 * a new GUI will be created and returned</p>
 * <p>If the name parameter is not of type 'string' or an empty string then
 * the returned value is undefined.</p>
 * <p>The global function createGUI(...) is an alternative method that
 * accepts the same parameters performs exactly the same task.</p>
 * @param name unique name for the GUI
 * @param p5c the renderer - the display canvas
 * @param p the processing instance (required in Instance mode)
 * @returns a GUI controller existing or new GUI with the given name.
 */
const createGUI = function (name, p5c, p = p5.instance) {
    return GUI.create(name, p5c, p);
};
/**
 * <p>Get the GUI with the given name. If no such GUI exists then the
 * function returns undefined. </p>
 * @param name the name of the GUI to get
 * @returns the matching GUI controller or undefined if not found.
 */
const getGUI = function (name) {
    return GUI.$$(name);
};
//# sourceMappingURL=canvas_gui.js.map
class BaseScheme {
    constructor() {
        this._greyTints();
    }
    _color(hue) {
        this[`C_0`] = `hsb(${hue}, 10%, 100%)`;
        this[`C_1`] = `hsb(${hue}, 20%, 100%)`;
        this[`C_2`] = `hsb(${hue}, 30%, 100%)`;
        this[`C_3`] = `hsb(${hue}, 40%, 100%)`;
        this[`C_4`] = `hsb(${hue}, 60%, 100%)`;
        this[`C_5`] = `hsb(${hue}, 70%, 90%)`;
        this[`C_6`] = `hsb(${hue}, 80%, 80%)`;
        this[`C_7`] = `hsb(${hue}, 90%, 75%)`;
        this[`C_8`] = `hsb(${hue}, 90%, 50%)`;
        this[`C_9`] = `hsb(${hue}, 90%, 40%)`;
    }
    _mono(low, high) {
        let cn = 0;
        for (let i = 0; i < 10; i++) {
            let grey = Math.floor(low + (high - low) * i / 10);
            this[`C_${cn++}`] = `rgb(${grey}, ${grey}, ${grey})`;
        }
    }
    _grey(theme) {
        let grey = [100, 80, 70, 60, 50, 40, 30, 20, 10, 0];
        if (theme === 'dark')
            grey.reverse();
        for (let i = 0; i < grey.length; i++)
            this[`G_${i}`] = `hsb(0,0%,${grey[i]}%)`;
    }
    _greyTints() {
        let alpha = [0.05, 0.075, 0.1, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7];
        for (let i = 0; i < alpha.length; i++)
            this[`T_${i}`] = `rgba(0,0,0,${alpha[i]})`;
    }
    _whiteTints() {
        let alpha = [0.25, 0.35, 0.4, 0.45, 0.5, 0.6, 0.7, 0.8, 0.9];
        for (let i = 0; i < alpha.length; i++)
            this[`T_${i}`] = `rgba(255,255,255,${alpha[i]})`;
    }
}
class RedScheme extends BaseScheme {
    constructor() {
        super();
        this._color(0);
        this._grey('light');
    }
}
class OrangeScheme extends BaseScheme {
    constructor() {
        super();
        this._color(30);
        this._grey('light');
    }
}
class YellowScheme extends BaseScheme {
    constructor() {
        super();
        this._color(60);
        this._grey('light');
    }
}
class GreenScheme extends BaseScheme {
    constructor() {
        super();
        this._color(120);
        this._grey('light');
    }
}
class CyanScheme extends BaseScheme {
    constructor() {
        super();
        this._color(180);
        this._grey('light');
    }
}
class BlueScheme extends BaseScheme {
    constructor() {
        super();
        this._color(224);
        this._grey('light');
    }
}
class PurpleScheme extends BaseScheme {
    constructor() {
        super();
        this._color(300);
        this._grey('light');
    }
}
class LightScheme extends BaseScheme {
    constructor() {
        super();
        this._mono(254, 0);
        this._grey('light');
    }
}
class DarkScheme extends BaseScheme {
    constructor() {
        super();
        this._mono(0, 254);
        this._grey('dark');
        this._whiteTints(); // Override dark tints
    }
}
//# sourceMappingURL=colorschemes.js.map
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
    getTransform(w, h) {
        return { tx: 0, ty: w, rot: 1.5 * Math.PI };
    }
    xy(x, y, w, h) {
        return [w - y, x, h, w];
    }
    wh(w, h) {
        return [h, w];
    }
}
class OrientSouth {
    getTransform(w, h) {
        return { tx: h, ty: 0, rot: 0.5 * Math.PI };
    }
    xy(x, y, w, h) {
        return [y, h - x, h, w];
    }
    wh(w, h) {
        return [h, w];
    }
}
class OrientEast {
    getTransform(w, h) {
        return { tx: 0, ty: 0, rot: 0 };
    }
    xy(x, y, w, h) {
        return [x, y, w, h];
    }
    wh(w, h) {
        return [w, h];
    }
}
class OrientWest {
    getTransform(w, h) {
        return { tx: w, ty: h, rot: Math.PI };
    }
    xy(x, y, w, h) {
        return [w - x, h - y, w, h];
    }
    wh(w, h) {
        return [w, h];
    }
}
//# sourceMappingURL=orientations.js.map
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
        /** @hidden */ this._active = false;
        /** @hidden */ this._clickAllowed = false;
        /** @hidden */ this._opaque = true;
        /** @hidden */ this._bufferInvalid = true;
        /**
         * <p>The event handler for this control. Although it is permitted to set
         * this property directly it is recommended that the <code>setAction(...)</code>
         * method is used to define the event handler actions.</p>
         * @hidden
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
    get type() { return this.constructor.name.substring(3); }
    ;
    /**
     * <p>Use <code>enable()</code> and <code>disable()</code> to enable and disable it.</p>
     * @returns true if the control is enabled else false
     */
    get isEnabled() { return this._enabled; }
    /**
     * @returns true if this control is visible
     */
    get isVisible() { return this._visible; }
    /**
     * A control becomes active when the mouse button is pressed over it.
     * This method has little practical use except when debugging.
     * @returns true if this control is expecting more mouse events
     * @hidden
     */
    get isActive() { return this._active; }
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
        return this._scheme;
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
     * @param event_handler  the function to handle this conytrol's events.
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
    /** @hidden */
    orientation() {
        return this._orientation;
    }
    /** @hidden */
    _minControlSize() { return null; }
    /** @hidden */
    _updateControlVisual() { }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) { return this; }
    /** @hidden */
    _doKeyEvent(e) { return this; }
    /**
     * @param uib ui overlay buffer
     * @param pkb picker buffer
     * @hidden
     */
    _draw(uib = null, pkb = null) { }
    /** @hidden */
    _eq(a, b) {
        return Math.abs(a - b) < 0.001;
    }
    /** @hidden */
    _neq(a, b) {
        return Math.abs(a - b) >= 0.001;
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
// const NoOrient = {
//     /** This control does not support changing orientation */
//     orient(dir: string): CvsBaseControl {
//         CWARN(`Orientation cannot be changed for controls of type '${this.type}'.`);
//         return this;
//         // // Hide these methods from typeDoc
//         // /** @hidden */ orient(dir) { return this }
//     }
// }
// const NoParent = {
//     /** This control does not support changing orientation */
//     parent(parent: CvsBaseControl | string, rx?: number, ry?: number): CvsBaseControl {
//         CWARN(`Controls of type '${this.type}' cannot have a parent.`);
//         return this;
//     },
//     leaveParent(): CvsBaseControl {
//         CWARN(`Controls of type '${this.type}' cannot have a parent.`);
//         return this;
//     }
//     // // Hide these methods from typeDoc
//     // /** @hidden */ parent(parent, rx, ry){ return this }
//     // /** @hidden */ leaveParent(){ return this }
// }
// /** @hidden */
// const NoTooltip = {
//     /** @hidden */
//     tooltip(tiptext: string): CvsBaseControl {
//         CWARN(`Controls of type '${this.type}' cannot have tooltips.`);
//         return this;
//     },
//     /** @hidden */
//     tipTextSize(gtts: number): CvsBaseControl {
//         CWARN(`Controls of type '${this.type}' cannot have tooltips.`);
//         return this;
//     }
//     // // Hide these methods from typeDoc
//     // /** @hidden */ tooltip(tiptext){ return this }
//     // /** @hidden */ tipTextSize(gtts) { return this }
// }
// /** @hidden */
// const FixedBackground = {
//     /** @hidden */
//     transparent(): CvsBaseControl {
//         CWARN(`Controls of type '${this.type}' do not support the 'transparent' method.`);
//         return this;
//     },
//     opaque(): CvsBaseControl {
//         CWARN(`Controls of type '${this.type}' do not support the 'opaque' method.`);
//         return this;
//     }
//     // // Hide these methods from typeDoc
//     // /** @hidden */ transparent(){ return this }
//     // /** @hidden */ opaque() { return this }
// }
//# sourceMappingURL=basecontrol.js.map
/*
##############################################################################
 CvsBufferedControl
 This is the base class for all visual controls that require a graphic buffer
 ##############################################################################
 */
/**
 * <p>This is the base class for all visual controls that require a graphic buffer.</p>
 * @hidden
 */
class CvsBufferedControl extends CvsBaseControl {
    /**
     * CvsBufferedControl class
     * @hidden
     * @param {GUI} gui
     * @param id unique id for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui, id, x, y, w, h) {
        super(gui, id, x, y, w, h);
        /** @hidden */ this._tooltip = undefined;
        /** @hidden */ this._isOver = false;
        this._validateControlBuffers();
    }
    /** @hidden */
    get isOver() { return this._isOver; }
    /** @hidden */
    set isOver(b) {
        if (b != this._isOver) {
            this._isOver = b;
            this.invalidateBuffer();
        }
    }
    /**
     * Make sure we have a ui buffer and a pick buffer of the correct size
     * for this control.
     * @hidden
     */
    _validateControlBuffers() {
        if (!this._uiBfr || this._uiBfr.width != this._w || this._uiBfr.height != this._h) {
            this._uiBfr = this._p.createGraphics(this._w, this._h);
            this._uiBfr.pixelDensity(2);
            this._uiBfr.clear();
            this._pkBfr = this._p.createGraphics(this._w, this._h);
            this._pkBfr.pixelDensity(1);
            this._pkBfr.clear();
        }
    }
    /**
     * <p>This method ensures we have a buffer of the correct size for the control</p>
     * @hidden
     */
    _validateBuffer() {
        let b = this._uiBfr;
        if (b.width != this._w || b.height != this._h) {
            this._uiBfr = this._p.createGraphics(this._w, this._h);
            this.invalidateBuffer(); // Force a redraw of the buffer
        }
        if (this._bufferInvalid) {
            this._updateControlVisual();
            this._bufferInvalid = false;
        }
    }
    /**
     * Update rectangular controls using full buffer i.e.
     * Button, Option, Checkbox, Textfield
     * @hidden
     */
    _updateRectControlPB() {
        let pkb = this._pkBfr;
        pkb.clear();
        let c = this._gui.pickColor(this);
        pkb.noStroke();
        pkb.fill(c.r, c.g, c.b);
        pkb.rect(1, 1, this._w - 1, this._h - 1, ...this._c);
    }
    /**
     *
     * @param uib ui overlay buffer
     * @param pkb picker buffer
     * @hidden
     */
    _draw(uib, pkb) {
        this._validateBuffer();
        uib.push();
        uib.translate(this._x, this._y);
        if (this._visible) {
            let tr = this._orientation.getTransform(this._w, this._h);
            uib.translate(tr.tx, tr.ty);
            uib.rotate(tr.rot);
            uib.image(this._uiBfr, 0, 0);
            // Draw pick buffer image if enabled
            if (this._enabled) {
                pkb.drawingContext.setTransform(uib.drawingContext.getTransform());
                pkb.image(this._pkBfr, 0, 0);
            }
        }
        // Display children
        for (let c of this._children)
            if (c._visible)
                c._draw(uib, pkb);
        uib.pop();
    }
    /** @hidden */
    _disable_hightlight(b, cs, x, y, w, h) {
        b.fill(cs['T_5']);
        b.noStroke();
        b.rect(x, y, w, h, ...this._c);
    }
    /**
     * <p>Shrink the control to fit contents.</p>
     * <p>To shrink on one dimension only pass either 'w' (width) or 'h'
     * (height) to indicate which dimmension to shrink</p>
     * @param dim the dimension to shrink
     * @returns this control
     */
    shrink(dim) {
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
        this._validateControlBuffers();
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Set or get the corner radii used for this control</p>
     * @param c an array of 4 corner radii
     * @returns an array with the 4 corner radii
     */
    corners(c) {
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
    tooltip(tiptext) {
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
     * Sets the size of the text to use in the tooltip
     * @param {number} tsize text size for this tooltip
     */
    tipTextSize(tsize) {
        if (this._tooltip && tsize && tsize > 0)
            this._tooltip.textSize(tsize);
        return this;
    }
}
//# sourceMappingURL=bufferedcontrol.js.map
/**
 * <p>This class represents a horizontal slider with a draggable thumb to
 * define a value within user defined limits.</p>
 * <p>Major and minor tick marks can be added to the bar and supports
 * stick-to-ticks if wanted.</p>
 */
class CvsSlider extends CvsBufferedControl {
    /**
     * @hidden
     * @param gui the gui controller
     * @param name unique name for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui, name, x, y, w, h) {
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
    limits(l0, l1) {
        if (Number.isFinite(l0) && Number.isFinite(l1)) {
            this._limit0 = l0;
            this._limit1 = l1;
        }
        return this;
    }
    /**
     * Checks whether a value is between the lower and upper limits for this
     * control. It allows the user to prevalidate a value before attempting
     * to change the control's value.
     * @param value value to test
     * @returns true if the value lies within the control's limits else false
     */
    isInsideLimits(value) {
        return (Number.isFinite(value)
            && (value - this._limit0) * (value - this._limit1) <= 0);
    }
    /**
     * <p>The track can be divided up into a number of domains separated with major ticks. The
     * major domains and be further divided into subdomains separated with minor ticks. If the
     * final parameter is true then values returned by the slider are consrained to the
     * tick values.</p>
     * @param {number} major the number of major domains on the track
     * @param {number} minor the number of minor domains  between major ticks
     * @param {boolean} stick2ticks slider value is constrainged to tick values
     * @returns {CvsBaseControl} this slider object
     */
    ticks(major, minor, stick2ticks) {
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
    value(value) {
        if (Number.isFinite(value)) {
            if ((value - this._limit0) * (value - this._limit1) <= 0) {
                this.invalidateBuffer();
                this._t01 = this._norm01(value);
                // CLOG(`Slider setting value to ${value} _norm01 ${this._t01}  v2t ${this._v2t(value)}`)
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
    _t2v(t) {
        return this._limit0 + t * (this._limit1 - this._limit0);
    }
    /**
     * <p>Converts parametic value to user value</p>
     * @hidden
     * @param v value
     * @returns the correspoding parametric value
     */
    _v2t(v) {
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
    _norm01(v, l0 = this._limit0, l1 = this._limit1) {
        return this._p.map(v, l0, l1, 0, 1, true);
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let absPos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0) { // Thumb
                    this._active = true;
                    this.isOver = true;
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                this.action({ source: this, p5Event: e, value: this.value(), final: true });
                this._active = false;
                this.isOver = false;
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    let t01 = this._norm01(mx - 10, 0, this._uiBfr.width - 20);
                    if (this._s2ticks)
                        t01 = this._nearestTickT(t01);
                    if (this._t01 != t01) {
                        this._t01 = t01;
                        this.action({ source: this, p5Event: e, value: this.value(), final: false });
                    }
                }
                this.isOver = (this == over.control && over.part == 0);
                this._tooltip?._updateState(enter);
                this.invalidateBuffer();
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /**
     * For a given value p01 find the value at the nearest tick
     * @hidden
     */
    _nearestTickT(p01) {
        let nbrTicks = this._minorTicks > 0
            ? this._minorTicks * this._majorTicks : this._majorTicks;
        return (nbrTicks > 0) ? Math.round(p01 * nbrTicks) / nbrTicks : p01;
    }
    /** @hidden */
    _updateControlVisual() {
        let cs = this._scheme || this._gui.scheme();
        const OPAQUE = cs['C_3'];
        const TICKS = cs['G_7'];
        const UNUSED_TRACK = cs['G_3'];
        const USED_TRACK = cs['G_1'];
        const HIGHLIGHT = cs['C_9'];
        const THUMB = cs['C_6'];
        let uib = this._uiBfr;
        let tw = uib.width - 20, tH = 8, tbSize = 12;
        let ty = Math.round(uib.height / 2);
        let majT = 10, minT = 7;
        uib.push();
        uib.clear();
        if (this._opaque) {
            uib.noStroke();
            uib.fill(OPAQUE);
            uib.rect(0, 0, this._w, this._h, ...this._c);
        }
        // Now translate to track left edge - track centre
        uib.translate(10, ty);
        // Now draw ticks
        uib.stroke(TICKS);
        uib.strokeWeight(1);
        let dT, n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            dT = tw / n;
            for (let i = 0; i <= n; i++) { // minor ticks
                let tickX = i * dT;
                uib.line(tickX, -minT, tickX, minT);
            }
        }
        n = this._majorTicks;
        if (n >= 2) {
            dT = tw / n;
            for (let i = 0; i <= n; i++) { // major ticks
                let tickX = i * dT;
                uib.line(tickX, -majT, tickX, majT);
            }
        }
        // draw unused track
        uib.fill(UNUSED_TRACK);
        uib.rect(0, -tH / 2, tw, tH);
        // draw used track
        let tbX = tw * this._t01;
        uib.fill(USED_TRACK);
        uib.rect(0, -tH / 2, tbX, tH, ...this._c);
        // Draw thumb
        uib.fill(THUMB);
        uib.noStroke();
        if (this._isOver) {
            uib.strokeWeight(2);
            uib.stroke(HIGHLIGHT);
        }
        uib.rect(tbX - tbSize / 2, -tbSize / 2, tbSize, tbSize, ...this._c);
        if (!this._enabled)
            this._disable_hightlight(uib, cs, -10, -this._h / 2, this._w, this._h);
        this._updateSliderPickBuffer(ty, tw, tH, tbX, tbSize);
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _updateSliderPickBuffer(ty, tw, tH, tbX, tbSize) {
        tbX = Math.round(tbX);
        let c = this._gui.pickColor(this);
        let pkb = this._pkBfr;
        pkb.push();
        pkb.clear();
        pkb.noStroke();
        // Now translate to track left edge - track centre
        pkb.translate(10, ty);
        // pkb.rect(-10, pkb.width, -ty, pkb.height); //, ...this._c);
        // Track
        pkb.fill(c.r, c.g, c.b + 5);
        pkb.rect(0, -tH / 2, tw, tH, ...this._c);
        pkb.fill(c.r, c.g, c.b + 6);
        pkb.rect(0, -tH / 2, tbX, tH, ...this._c);
        // Thumb
        pkb.fill(c.r, c.g, c.b);
        pkb.rect(tbX - tbSize / 2, -tbSize / 2, tbSize, tbSize); //, ...this._c);
        pkb.pop();
    }
    /** @hidden */
    _minControlSize() {
        return { w: this._w, h: 20 };
    }
}
//# sourceMappingURL=slider.js.map
/**
 * <p>This class represents a slider with 2 draggable thumbs to
 * define a value within user defined limits.</p>
 * <p>Major and minor tick marks can be added to the bar and supports
 * stick-to-ticks if wanted.</p>
 */
class CvsRanger extends CvsSlider {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 100, h || 20);
        /** @hidden */ this._t = [0.25, 0.75];
        /** @hidden */ this._tIdx = -1;
        this._t = [0.25, 0.75];
        this._tIdx = -1;
        this._limit0 = 0;
        this._limit1 = 1;
        this._opaque = false;
    }
    /**
     * <p>Sets or gets the low and high thumb values for this control. If both parameters
     * are within limits of the ranger then they are accepted and the thumbs are moved to
     * the correct position.</p>
     * <p>If either of the parameters are invalid then they are ignored and the method
     * returns the current range low and high values.</p>
     * @param v0 low value
     * @param v1 high value
     * @returns this control or the low/high values
     */
    range(v0, v1) {
        if (Number.isFinite(v0) && Number.isFinite(v1)) { // If two numbers then
            let t0 = this._norm01(Math.min(v0, v1));
            let t1 = this._norm01(Math.max(v0, v1));
            if (t0 >= 0 && t0 <= 1 && t1 >= 0 && t1 <= 1) {
                this._bufferInvalid = (this._t[0] != t0) || (this._t[1] != t1);
                this._t[0] = t0;
                this._t[1] = t1;
                return this;
            }
        }
        // Invalid parameters
        return { low: this._t2v(this._t[0]), high: this._t2v(this._t[1]) };
    }
    /**
     * @returns the low value of the range
     */
    low() {
        return this._t2v(this._t[0]);
    }
    /**
     * @returns the high value of the range
     */
    high() {
        return this._t2v(this._t[1]);
    }
    /** @hidden */
    value(v) { return this; }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let absPos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0 || over.part == 1) { // A thumb
                    this._active = true;
                    this._tIdx = over.part; // Which thumb is the mouse over
                    this.isOver = true;
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    let t0 = Math.min(this._t[0], this._t[1]);
                    let t1 = Math.max(this._t[0], this._t[1]);
                    this._t[0] = t0;
                    this._t[1] = t1;
                    this._tIdx = -1;
                    this.action({
                        source: this, p5Event: e, low: this._t2v(t0), high: this._t2v(t1), final: true
                    });
                    this._active = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    let t01 = this._norm01(mx - 10, 0, this._uiBfr.width - 20);
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
                }
                this.isOver = (this == over.control && (over.part == 0 || over.part == 1));
                this._tooltip?._updateState(enter);
                this.invalidateBuffer();
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /** @hidden */
    _updateControlVisual() {
        let cs = this._scheme || this._gui.scheme();
        const OPAQUE = cs['C_3'];
        const TICKS = cs['G_7'];
        const UNUSED_TRACK = cs['G_3'];
        const USED_TRACK = cs['G_1'];
        const HIGHLIGHT = cs['C_9'];
        const THUMB = cs['C_6'];
        let uib = this._uiBfr;
        let tw = uib.width - 20, tH = 8, tbSize = 12;
        let ty = Math.round(uib.height / 2);
        let majT = 10, minT = 7;
        uib.push();
        uib.clear();
        // Background
        if (this._opaque) {
            uib.noStroke();
            uib.fill(OPAQUE);
            uib.rect(0, 0, this._w, this._h, ...this._c);
        }
        // Now translate to track left edge - track centre
        uib.translate(10, ty);
        // Now draw ticks
        uib.stroke(TICKS);
        uib.strokeWeight(1);
        let dT, n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            dT = tw / n;
            for (let i = 0; i <= n; i++) { // minor ticks
                let tickX = i * dT;
                uib.line(tickX, -minT, tickX, minT);
            }
        }
        n = this._majorTicks;
        if (n >= 2) {
            dT = tw / this._majorTicks;
            for (let i = 0; i <= n; i++) { // major ticks
                let tickX = i * dT;
                uib.line(tickX, -majT, tickX, majT);
            }
        }
        // draw unused track
        uib.fill(UNUSED_TRACK);
        uib.rect(0, -tH / 2, tw, tH);
        // draw used track
        let tx0 = tw * Math.min(this._t[0], this._t[1]);
        let tx1 = tw * Math.max(this._t[0], this._t[1]);
        uib.fill(USED_TRACK);
        uib.rect(tx0, -tH / 2, tx1 - tx0, tH, ...this._c);
        // Draw thumbs
        for (let tnbr = 0; tnbr < 2; tnbr++) {
            uib.fill(THUMB);
            uib.noStroke();
            if ((this.isActive || this.isOver) && tnbr == this._tIdx) {
                uib.strokeWeight(2);
                uib.stroke(HIGHLIGHT);
            }
            uib.rect(this._t[tnbr] * tw - tbSize / 2, -tbSize / 2, tbSize, tbSize, ...this._c);
        }
        if (!this._enabled)
            this._disable_hightlight(uib, cs, -10, -this._h / 2, this._w, this._h);
        this._updateRangerPickBuffer(ty, tw, tH, tx0, tx1, tbSize);
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _updateRangerPickBuffer(ty, tw, tH, tx0, tx1, tbSize) {
        tx0 = Math.round(tx0);
        tx1 = Math.round(tx1);
        let c = this._gui.pickColor(this);
        let pkb = this._pkBfr;
        pkb.push();
        pkb.clear();
        pkb.noStroke();
        // Now translate to track left edge - track centre
        pkb.translate(10, ty);
        // Track
        pkb.fill(c.r, c.g, c.b + 5);
        pkb.rect(0, -tH / 2, tw, tH, ...this._c);
        pkb.fill(c.r, c.g, c.b + 6);
        pkb.rect(tx0, -tH / 2, tx1 - tx0, tH, ...this._c);
        // Thumb
        pkb.fill(c.r, c.g, c.b);
        pkb.rect(tx0 - tbSize / 2, -tbSize / 2, tbSize, tbSize); //, ...this._c);
        pkb.fill(c.r, c.g, c.b + 1);
        pkb.rect(tx1 - tbSize / 2, -tbSize / 2, tbSize, tbSize); //, ...this._c);
        pkb.pop();
    }
}
//# sourceMappingURL=ranger.js.map
/**
 * </p>The base class for any control that displays text as part of its
 * visual interface</p>
 * @hidden
 */
class CvsText extends CvsBufferedControl {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
        /** @hidden */ this._lines = [];
        /** @hidden */ this._textSize = undefined;
        /** @hidden */ this._textAlign = this._p.CENTER;
        /** @hidden */ this._tbox = { w: 0, h: 0 };
        /** @hidden */ this._gap = 2;
    }
    /**
     * <p>Gets or sets the current text.</p>
     * <p>Processing constants are used to define the alignment.</p>
     * @param t the text to display
     * @param align LEFT, CENTER or RIGHT
     * @returns this control or the existing text
     */
    text(t, align) {
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
        this._w = Math.max(this._w, s.w);
        this._h = Math.max(this._h, s.h);
        this._validateControlBuffers();
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Sets or gets the text font for this control.</p>
     * <p>If the parameter is true-type-font <em>or</em> the name of a system
     * font it will be used as the local font and this control will be
     * returned.</p>
     * <p>Recognised font names are :-</p>
     * <pre>
     * 'arial'             'verdana'   'tahoma'        'trebuchet ms'
     * 'times new roman'   'georgia'   'courier new'   'brush script mt'
     * 'impact'            'serif'     'sans-serif'    'monospace'
     * </pre>
     * <p>Invalid fonts are ignored and the local font is unchanged.</p>
     * <p>If no parameter is passed then the current local font is
     * returned.</p>
     * @param ltf A true-type-font or the name (case-insensitive) of a
     * valid system font.
     * @returns this control
     */
    textFont(ltf) {
        if (!ltf)
            return this._gui.textFont(); // getter
        if (ltf instanceof p5.Font)
            this._textFont = ltf;
        else if (IS_VALID_FONT(ltf.toLowerCase()))
            this._textFont = ltf;
        else
            CWARN(`The font '${ltf}' is not a recognized so will be ignored!`);
        return this;
    }
    /**
     * <p>Sets or gets the local text style.</p>
     * <p>The 4 recognised font styles are :-</p>
     * <pre>
     * NORMAL    BOLD   ITALIC   BOLDITALIC
     * </pre>
     * <p>Unrecognized styles are ignored and the local style is unchanged.</p>
     * <p>If no parameter is passed then the current style is returned.</p>
     * @param gty the font style to use.
     * @returns this control
     */
    textStyle(gty) {
        if (!gty)
            return this._textStyle; // getter
        gty = gty.toLowerCase();
        switch (gty) {
            case 'normal':
            case 'bold':
            case 'italic':
            case 'bold italic':
                this._textStyle = gty;
                break;
            default:
                CWARN(`The text style '${gty}' was not recognized so will be ignored!`);
        }
        return this;
    }
    /**
     * <p>Sets the text alignment.</p>
     * <p>Processing constants are used to define the text alignment.</p>
     * @param align LEFT, CENTER or RIGHT
     * @returns this control
     */
    textAlign(align) {
        if (align && (align == this._p.LEFT || align == this._p.CENTER || align == this._p.RIGHT)) {
            this._textAlign = align;
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * <p>Renoves any text that the control might use to display itself.</p>
     * @returns this control
     */
    noText() {
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
    textSize(lts) {
        let ts = this._textSize || this._gui.textSize();
        // getter
        if (!Number.isFinite(lts))
            return ts;
        // setter
        lts = Number(lts);
        if (lts != ts) {
            this._textSize = lts;
            // If necessary expand the control to surrond text
            let s = this._minControlSize();
            this._w = Math.max(this._w, s.w);
            this._h = Math.max(this._h, s.h);
            this._validateControlBuffers();
            this.invalidateBuffer();
        }
        return this;
    }
    /** @hidden */
    _minControlSize() {
        let b = this._uiBfr;
        let lines = this._lines;
        let ts = this._textSize || this._gui.textSize();
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
        // Calculate minimum length and height of are to hold
        // multiple lines of text
        if (lines.length > 0) {
            if (!b)
                this._validateBuffer();
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
 * @hidden
 */
class CvsTextIcon extends CvsText {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
        this._icon = undefined;
        this._iconAlign = this._p.LEFT;
    }
    /**
     * <p>Gets or sets the icon and its alignment relative to any text in the control.</p>
     * <p>Processing constants are used to define the icon alignment.</p>
     * @param icon the icon to use for this control
     * @param align LEFT or RIGHT
     * @returns this control or the current icon
     */
    icon(icon, align) {
        // getter
        if (!icon)
            return this._icon;
        //setter    
        this._icon = icon;
        if (align && (align == this._p.LEFT || align == this._p.RIGHT))
            this._iconAlign = align;
        // If necessary expand the control to surrond text and icon 
        let s = this._minControlSize();
        this._w = Math.max(this._w, s.w);
        this._h = Math.max(this._h, s.h);
        this._validateControlBuffers();
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Sets the icon alignment relative to the text.</p>
     * <p>Processing constants are used to define the text alignment.</p>
     * @param align LEFT or RIGHT
     * @returns this control
     */
    iconAlign(align) {
        if (align && (align == this._p.LEFT || align == this._p.RIGHT)) {
            this._iconAlign = align;
            // If necessary expand the control to surrond text and icon 
            let s = this._minControlSize();
            this._w = Math.max(this._w, s.w);
            this._h = Math.max(this._h, s.h);
            this._validateControlBuffers();
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
        let b = this._uiBfr;
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
            if (!b)
                this._validateBuffer();
            b.textSize(ts);
            tbox.w = ts + lines.map(t => b.textWidth(t)).reduce((x, y) => (x > y) ? x : y);
            tbox.h = (lines.length - 1) * b.textLeading() + b.textAscent() + b.textDescent();
            gap += this._gap;
        }
        sw += tbox.w + gap;
        sh = Math.max(this._tbox.h, sh) + gap;
        return { w: Math.ceil(sw), h: Math.ceil(sh) };
    }
}
/**
 * <p>Simple label with text and / or icon</p>
 */
class CvsLabel extends CvsTextIcon {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 60, h || 16);
    }
    /** @hidden */ tooltip(tiptext) { return this; }
    /** @hidden */ tipTextSize(gtts) { return this; }
    /** @hidden */ setAction(event_handler) { return this; }
    /** @hidden */
    _updateControlVisual() {
        let ts = this._textSize || this._gui.textSize();
        let tf = this._textFont || this._gui.textFont();
        let ty = this._textStyle || this._gui.textStyle();
        let cs = this._scheme || this._gui.scheme();
        let p = this._p;
        let icon = this._icon, iA = this._iconAlign, tA = this._textAlign;
        let lines = this._lines, gap = this._gap;
        const OPAQUE = cs['C_3'], FORE = cs['C_8'];
        let uib = this._uiBfr;
        uib.push();
        uib.clear();
        uib.textFont(tf);
        uib.textStyle(ty);
        // Background
        if (this._opaque) {
            uib.noStroke();
            uib.fill(OPAQUE);
            uib.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (icon) {
            let px = 0, py;
            switch (iA) {
                case p.LEFT:
                    px = gap;
                    break;
                case p.RIGHT:
                    px = this._w - icon.width - gap;
                    break;
            }
            if (lines.length == 0) // no text so center icon
                px = (this._w - icon.width) / 2;
            py = (this._h - icon.height + gap) / 2;
            uib.image(this._icon, px, py);
        }
        if (lines.length > 0) {
            uib.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            if (icon && iA == p.LEFT)
                x0 += icon.width;
            if (icon && iA == p.RIGHT)
                x1 -= icon.width;
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = uib.textAscent() + (this._h - th) / 2;
            uib.fill(FORE);
            for (let line of lines) {
                switch (tA) {
                    case p.LEFT:
                        sx = x0;
                        break;
                    case p.CENTER:
                        sx = x0 + (tw - uib.textWidth(line)) / 2;
                        break;
                    case p.RIGHT:
                        sx = x1 - uib.textWidth(line) - gap;
                        break;
                }
                uib.text(line, sx, py);
                py += uib.textLeading();
            }
        }
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }
}
//# sourceMappingURL=texticon.js.map
/**
 * <p>This class is to create simple buttons with text and / or icons on its face.</p>
 */
class CvsButton extends CvsTextIcon {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
    }
    /** @hidden */
    _updateControlVisual() {
        let ts = this._textSize || this._gui.textSize();
        let cs = this._scheme || this._gui.scheme();
        let iA = this._iconAlign, tA = this._textAlign;
        let icon = this._icon, lines = this._lines, gap = this._gap;
        const BACK = cs['C_3'], FORE = cs['C_8'], HIGHLIGHT = cs['C_9'];
        let uib = this._uiBfr;
        uib.push();
        uib.clear();
        if (this._opaque) {
            uib.noStroke();
            uib.fill(BACK);
            uib.rect(1, 1, this._w - 1, this._h - 1, ...this._c);
        }
        if (icon) {
            let px = 0, py;
            switch (iA) {
                case this._p.LEFT:
                    px = gap;
                    break;
                case this._p.RIGHT:
                    px = this._w - icon.width - gap;
                    break;
            }
            if (lines.length == 0)
                px = (this._w - icon.width) / 2; // no text
            py = (this._h - icon.height) / 2;
            uib.image(this._icon, px, py);
        }
        if (lines.length > 0) {
            uib.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            if (icon && iA == this._p.LEFT)
                x0 += icon.width;
            if (icon && iA == this._p.RIGHT)
                x1 -= icon.width;
            let tw = x1 - x0, th = this._tbox.h;
            let py = uib.textAscent() + (this._h - th) / 2;
            uib.fill(FORE);
            for (let line of lines) {
                switch (tA) {
                    case this._p.LEFT:
                        sx = x0;
                        break;
                    case this._p.CENTER:
                        sx = x0 + (tw - uib.textWidth(line)) / 2;
                        break;
                    case this._p.RIGHT:
                        sx = x1 - uib.textWidth(line) - gap;
                        break;
                }
                uib.text(line, sx, py);
                py += uib.textLeading();
            }
        }
        // Mouse over add border highlight
        if (this._isOver) {
            uib.stroke(HIGHLIGHT);
            uib.strokeWeight(2);
            uib.noFill();
            uib.rect(1, 1, this._w - 2, this._h - 2, ...this._c);
        }
        // Control disabled highlight
        if (!this._enabled)
            this._disable_hightlight(uib, cs, 0, 0, this._w, this._h);
        // Update pick buffer before restoring
        this._updateRectControlPB();
        uib.pop();
        // The last line in this method should be
        this._bufferInvalid = false;
        // but if this is a pane-tab then must validate the tabs
        if (this._parent instanceof CvsPane)
            this._parent.validateTabs();
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this._clickAllowed = true; // false if mouse moves
                this.isOver = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    if (this._clickAllowed)
                        this.action({ source: this, p5Event: e });
                    this._active = false;
                    this._clickAllowed = false;
                    this.isOver = false;
                }
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                this.isOver = (this == over.control);
                this._tooltip?._updateState(enter);
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
}
//# sourceMappingURL=button.js.map
/**
 * <p>A tooltip is a simply text hint that appears near to a control with the
 * mouse over it.</p>
 * <p>The tooltip's relative position to the control is automatically set to
 * make sure it is visible inside the canvas area.</p>
 * @hidden
 */
class CvsTooltip extends CvsText {
    /** @hidden */
    constructor(gui, name) {
        super(gui, name);
        this._gap = 1;
        this._visible = false;
    }
    /**
     * <p>Sets the text to be displayed in the tooltip.</p>
     * <p>Processing constants are used to define the alignment.</p>
     * @param t the text to display
     * @returns this control
     */
    text(t) {
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
    /** @hidden */
    show(cascade) { return this; }
    /** @hidden */
    hide(cascade) { return this; }
    /** @hidden */
    _updateState(enter) {
        if (enter && !this._active) {
            this._active = true;
            this._visible = true;
            setTimeout(() => { this._visible = false; }, this._gui._show_time);
            setTimeout(() => { this._active = false; }, this._gui._repeat_time);
        }
    }
    /** @hidden */
    _validatePosition() {
        let p = this._parent;
        let { x: px, y: py } = p.getAbsXY();
        let [pw, ph] = p.orientation().wh(p.w, p.h);
        this._x = 0, this._y = -this._h;
        if (py + this._y < 0)
            this._y += this._h + ph;
        if (px + this._x + this._w > this._gui.canvasWidth())
            this._x -= this._w - pw;
    }
    /** @hidden */
    _updateControlVisual() {
        let ts = this._textSize || this._gui.tipTextSize();
        let cs = this._parent.scheme() || this._gui.scheme();
        let lines = this._lines, gap = this._gap;
        const BACK = cs['C_3'], FORE = cs['C_9'];
        let uib = this._uiBfr;
        uib.push();
        uib.clear();
        // Backkground
        uib.stroke(FORE);
        uib.fill(BACK);
        uib.rect(0, 0, this._w - 1, this._h - 1);
        uib.fill(FORE).noStroke();
        if (lines.length > 0) {
            uib.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = uib.textAscent() + (this._h - th) / 2;
            for (let line of lines) {
                sx = x0 + (tw - uib.textWidth(line)) / 2;
                uib.text(line, sx, py);
                py += uib.textLeading();
            }
        }
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _minControlSize() {
        let b = this._uiBfr;
        let lines = this._lines;
        let ts = this._textSize || this._gui.tipTextSize();
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
        // Calculate minimum length and height of are to hold
        // multiple lines of text
        if (lines.length > 0) {
            if (!b)
                this._validateBuffer();
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
//# sourceMappingURL=tooltip.js.map
/*
 ##############################################################################
 CvsScroller
 This class represents a simple scrollbar. Although it can be used as a
 distinct control it is more likely to be used as part of a larger control
 such as CvsViewer.
 ##############################################################################
 */
/**
 * <p>The scroller is used to scroll thorugh an object larger than the
 * display area.</p>
 * @hidden
 */
class CvsScroller extends CvsBufferedControl {
    /** @hidden */
    constructor(gui, name, x = 0, y = 0, w = 100, h = 20) {
        super(gui, name, x, y, w, h);
        // All values are in the range 0-1
        /** @hidden */ this._value = 0.5;
        /** @hidden */ this._dvalue = 0.5;
        /** @hidden */ this._used = 0.1;
        /** @hidden */ this._s_value = 0.5;
        /** @hidden */ this._s_dvalue = 0.5;
        /** @hidden */ this._s_mx = 0.5;
        /** @hidden */ this._minV = this._used / 2;
        /** @hidden */ this._maxV = 1 - this._used / 2;
        /** @hidden */ this._inset = 2;
        /** @hidden */ this._trackHeight = 8;
        /** @hidden */ this._thumbHeight = 12;
        /** @hidden */ this._minThumbWidth = 10;
        this._trackWidth = w - 2 * this._inset;
        this._c = gui.corners();
        this._opaque = false;
    }
    /**
     * Update the scroller from an external source.
     *
     * @param value The scroller position (0-1)
     * @param used The amount 'used' by the source
     */
    update(value, used) {
        // If a used value is available then use it
        if (Number.isFinite(used) && used !== this._used) {
            this._used = used;
            this._minV = this._used / 2;
            this._maxV = 1 - this._used / 2;
            this.invalidateBuffer();
        }
        if (Number.isFinite(value) && value !== this._value) {
            value = this._p.constrain(value, 0, 1);
            let dv = value, u2 = this._used / 2;
            if (value < u2)
                dv = u2;
            else if (value > 1 - u2)
                dv = 1 - u2;
            if (this._value != value || this._dvalue != dv) {
                this._value = value;
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
    _doEvent(e, x = 0, y = 0, over, enter) {
        let [mx, my, w, h] = this._orientation.xy(x - this._x, y - this._y, this.w, this.h);
        let [tw, halfUsed] = [this._trackWidth, this._used / 2];
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0) { // Thumb
                    this._active = true;
                    this._s_value = this._value;
                    this._s_mx = mx;
                    this.isOver = true;
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                this.action({ source: this, p5Event: e, value: this._value, used: this._used, final: true });
                this._active = false;
                this.isOver = false;
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    let newValue = this._s_value + (mx - this._s_mx) / tw;
                    if (newValue - halfUsed >= 0 && newValue + halfUsed <= 1) {
                        this.update(newValue);
                        this.action({ source: this, p5Event: e, value: this._value, used: this._used, final: false });
                    }
                    this.isOver = (this == over.control);
                    this.invalidateBuffer();
                }
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /** @hidden */
    _updateControlVisual() {
        let cs = this._scheme || this._gui.scheme();
        const OPAQUE = cs['C_3'];
        const BORDER = cs['G_8'];
        const UNUSED_TRACK = cs['G_3'];
        const HIGHLIGHT = cs['C_9'];
        const THUMB = cs['C_5'];
        let [w, h, inset, used] = [this._w, this._h, this._inset, this._used];
        let [tx0, tx1] = [inset, w - inset];
        let [tw, th] = [this._trackWidth, this._trackHeight];
        let tbW = Math.max(used * tw, this._minThumbWidth);
        let tbH = this._thumbHeight;
        let tx = this._dvalue * this._trackWidth;
        let uib = this._uiBfr;
        uib.push();
        uib.clear();
        if (this._opaque) {
            uib.noStroke();
            uib.fill(OPAQUE);
            uib.rect(0, 0, w, h, ...this._c);
        }
        // Now translate to track left edge - track centre
        uib.translate(inset, this._uiBfr.height / 2);
        // draw track
        uib.fill(UNUSED_TRACK);
        uib.stroke(BORDER);
        uib.strokeWeight(1);
        uib.rect(0, -th / 2, tw, th);
        // Draw thumb
        uib.fill(THUMB);
        uib.noStroke();
        if (this.isActive || this.isOver) {
            uib.strokeWeight(2);
            uib.stroke(HIGHLIGHT);
        }
        uib.rect(tx - tbW / 2, -tbH / 2, tbW, tbH, ...this._c);
        if (!this._enabled)
            this._disable_hightlight(uib, cs, 0, -h / 2, w - 20, h);
        this._updateScrollerPickBuffer(tx - tbW / 2, -tbH / 2, tbW, tbH);
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _updateScrollerPickBuffer(tbX, tby, tbw, tbh) {
        let c = this._gui.pickColor(this);
        let pkb = this._pkBfr;
        pkb.push();
        pkb.clear();
        pkb.noStroke();
        pkb.fill(c.r, c.g, c.b);
        // Now translate to track left edge - track centre
        pkb.translate(this._inset, this._pkBfr.height / 2);
        pkb.rect(Math.round(tbX), Math.round(tby), tbw, tbh);
        pkb.pop();
    }
    /** @hidden */
    _minControlSize() {
        return { w: this._w, h: 20 };
    }
}
// Object.assign(CvsScroller.prototype, NoTooltip);
//# sourceMappingURL=scroller.js.map
/**
 * <p>The option group manages a group of option buttons where only one can
 * be selected at any time.</p>
 * <p>The user should <i>not</i> create instances of this class because the library
 * will make them when needed.</p>
 * @hidden
 */
class CvsOptionGroup {
    /** @hidden */
    constructor(name) {
        this._name = name;
        this._group = new Set();
    }
    /**
     * Add an option to this group.
     * @hidden
     */
    add(option) {
        // If this option is selected then deselect all the existing options in group
        if (option.isSelected())
            for (let opt of this._group)
                opt._deselect();
        this._group.add(option);
    }
    /**
     * Remove an option to this group
     * @hidden
     */
    remove(option) {
        this._group.delete(option);
    }
    /**
     * @hidden
     * @returns the currently selected option which will be deselected
     */
    _prev() {
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
 ##############################################################################
 */
/**
 * This class represents an option button (aka radio button). These are usually
 * grouped together so that only one can be selected at a time.
 */
class CvsOption extends CvsText {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
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
    iconAlign(align) {
        if (!align)
            return this._iconAlign;
        if (align == this._p.LEFT || align == this._p.RIGHT) {
            this._iconAlign = align;
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * <p>Select this option, replacing the previos selection.</p>
     * @returns this control
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
    group(optGroupName) {
        this._optGroup = this._gui.getOptionGroup(optGroupName);
        this._optGroup.add(this);
        return this;
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this._clickAllowed = true; // false if mouse moves
                this.isOver = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    if (this._clickAllowed && !this._selected) {
                        if (this._optGroup) {
                            // If we have an opt group then use it to replace 
                            // old selection with this one
                            this.select();
                            this.action({ source: this, p5Event: e, selected: true });
                        }
                    }
                }
                this._active = false;
                this._clickAllowed = false;
                this.isOver = false;
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                this.isOver = (this == over.control);
                this._tooltip?._updateState(enter);
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /** @hidden */
    _updateControlVisual() {
        let ts = this._textSize || this._gui.textSize();
        let cs = this._scheme || this._gui.scheme();
        let p = this._p;
        let isize = p.constrain(Number(ts) * 0.7, 12, 16);
        let iA = this._iconAlign, tA = this._textAlign;
        let lines = this._lines, gap = this._gap;
        const BACK = cs['C_3'], FORE = cs['C_8'], ICON_BG = cs['G_0'];
        const ICON_FG = cs['G_9'], HIGHLIGHT = cs['C_9'];
        let uib = this._uiBfr;
        uib.push();
        uib.clear();
        // If opaque
        if (this._opaque) {
            uib.noStroke();
            uib.fill(BACK);
            uib.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Start with circle
        uib.push();
        let px = (iA == p.RIGHT) ? this._w - gap - isize / 2 : gap + isize / 2;
        uib.translate(px, uib.height / 2);
        uib.stroke(ICON_FG);
        uib.fill(ICON_BG);
        uib.strokeWeight(1.5);
        uib.ellipse(0, 0, isize, isize);
        if (this._selected) {
            uib.fill(ICON_FG);
            uib.noStroke();
            uib.ellipse(0, 0, isize / 2, isize / 2);
        }
        uib.pop();
        if (lines.length > 0) {
            uib.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            if (iA == p.LEFT)
                x0 += isize + gap;
            if (iA == p.RIGHT)
                x1 -= isize + gap;
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = uib.textAscent() + (this._h - th) / 2;
            uib.fill(FORE);
            for (let line of lines) {
                switch (tA) {
                    case p.LEFT:
                        sx = x0;
                        break;
                    case p.CENTER:
                        sx = x0 + (tw - uib.textWidth(line)) / 2;
                        break;
                    case p.RIGHT:
                        sx = x1 - uib.textWidth(line) - gap;
                        break;
                }
                uib.text(line, sx, py);
                py += uib.textLeading();
            }
        }
        // Mouse over control
        if (this.isOver) {
            uib.stroke(HIGHLIGHT);
            uib.strokeWeight(2);
            uib.noFill();
            uib.rect(1, 1, this._w - 2, this._h - 2, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (!this._enabled)
            this._disable_hightlight(uib, cs, 0, 0, this._w, this._h);
        this._updateRectControlPB();
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _minControlSize() {
        let b = this._uiBfr;
        let lines = this._lines;
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
        let ts = this._textSize || this._gui.textSize();
        let isize = this._p.constrain(Number(ts) * 0.7, 12, 16);
        // Calculate minimum length and height of are to hold
        // multiple lines of text
        if (lines.length > 0) {
            if (!b)
                this._validateBuffer();
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
//# sourceMappingURL=option.js.map
/**
 * This class supports simple true-false checkbox
 */
class CvsCheckbox extends CvsText {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
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
    iconAlign(align) {
        if (!align)
            return this._iconAlign;
        if (align == this._p.LEFT || align == this._p.RIGHT) {
            this._iconAlign = align;
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * <p>Select this checkbox making it 'true'</p>
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
     * <p>Deelect this checkbox making it 'false'</p>
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
     * Get the state of the checkbox.
     * @returns true if this checkbox is selecd
     */
    isSelected() {
        return this._selected;
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                // will be set to false if the mouse is dragged
                this._clickAllowed = true;
                this.isOver = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    if (this._clickAllowed) {
                        this._selected = !this._selected;
                        this.action({ source: this, p5Event: e, selected: this._selected });
                    }
                }
                this._active = false;
                this._clickAllowed = false;
                this.isOver = false;
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                this.isOver = (this == over.control);
                this._tooltip?._updateState(enter);
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /** @hidden */
    _updateControlVisual() {
        let ts = this._textSize || this._gui.textSize();
        let cs = this._scheme || this._gui.scheme();
        let p = this._p;
        let isize = p.constrain(Number(ts) * 0.7, 12, 16);
        let iA = this._iconAlign, tA = this._textAlign;
        let lines = this._lines, gap = this._gap;
        const BACK = cs['C_3'], FORE = cs['C_8'], ICON_BG = cs['G_0'];
        const ICON_FG = cs['G_9'], HIGHLIGHT = cs['C_9'];
        let uib = this._uiBfr;
        uib.push();
        uib.clear();
        if (this._opaque) {
            uib.noStroke();
            uib.fill(BACK);
            uib.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Start with box and tick
        uib.push();
        let px = (iA == p.RIGHT) ? this._w - gap - isize / 2 : gap + isize / 2;
        uib.translate(px, uib.height / 2);
        uib.stroke(ICON_FG);
        uib.fill(ICON_BG);
        uib.strokeWeight(1.5);
        uib.rect(-isize / 2, -isize / 2, isize, isize, 3);
        if (this._selected) {
            uib.strokeWeight(2.5);
            uib.line(-0.281 * isize, 0, -0.188 * isize, 0.313 * isize);
            uib.line(0.270 * isize, -0.27 * isize, -0.188 * isize, 0.313 * isize);
        }
        uib.pop();
        if (lines.length > 0) {
            uib.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            if (iA == p.LEFT)
                x0 += isize + gap;
            if (iA == p.RIGHT)
                x1 -= isize + gap;
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = uib.textAscent() + (this._h - th) / 2;
            uib.fill(FORE);
            for (let line of lines) {
                switch (tA) {
                    case p.LEFT:
                        sx = x0;
                        break;
                    case p.CENTER:
                        sx = x0 + (tw - uib.textWidth(line)) / 2;
                        break;
                    case p.RIGHT:
                        sx = x1 - uib.textWidth(line) - gap;
                        break;
                }
                uib.text(line, sx, py);
                py += uib.textLeading();
            }
        }
        // Mouse over control
        if (this._isOver) {
            uib.stroke(HIGHLIGHT);
            uib.strokeWeight(2);
            uib.noFill();
            uib.rect(1, 1, this._w - 2, this._h - 2, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (!this._enabled)
            this._disable_hightlight(uib, cs, 0, 0, this._w, this._h);
        // Update pick buffer before restoring
        this._updateRectControlPB();
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _minControlSize() {
        let b = this._uiBfr;
        let lines = this._lines;
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
        let ts = this._textSize || this._gui.textSize();
        let isize = this._p.constrain(Number(ts) * 0.7, 12, 16);
        // Calculate minimum length and height of are to hold
        // multiple lines of text
        if (lines.length > 0) {
            if (!b)
                this._validateBuffer();
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
//# sourceMappingURL=checkbox.js.map
/**
 * <p>This control is used to scroll and zoom on an image.</p>
 * <p>When the mouse moves over the control scrollbars will appear (if needed)
 * inside the bottom and right-hand-side edges of the view. When the mouse is
 * near the centre a slider will appear which can be used to change the scale.</p>
 *
 * <p>This control also supports layers where multiple images can be layered
 * to make the final visual.</p>
 *
 */
class CvsViewer extends CvsBufferedControl {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h);
        /** @hidden */ this._layers = [];
        /** @hidden */ this._hidden = new Set();
        // Layer width and height (pixels)
        /** @hidden */ this._lw = 0;
        /** @hidden */ this._lh = 0;
        /** @hidden */ this._wcx = 0;
        /** @hidden */ this._wcy = 0;
        /** @hidden */ this._wscale = 1;
        /** @hidden */ this._usedX = 0;
        /** @hidden */ this._usedY = 0;
        /** @hidden */ this._scalerZone = { x0: 0, y0: 0, x1: 0, y1: 0 };
        // this._value, used: this._used,
        /** @hidden */ this._frameWeight = 0;
        this._c = [0, 0, 0, 0];
        this._scrH = gui.__scroller(this._id + "-scrH", 4, h - 24, w - 28, 20).hide()
            .setAction((info) => {
            this.view(info.value * this._lw, this._wcy);
            this.invalidateBuffer();
        });
        this._scrV = gui.__scroller(this._id + "-scrV", w - 24, 4, h - 28, 20).orient('south').hide()
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
    scaler(v, l0, l1) {
        if (Number.isFinite(v) && Number.isFinite(l0) && Number.isFinite(l1)) {
            let low = Math.min(l0, l1);
            let high = Math.max(l0, l1);
            let value = this._p.constrain(v, low, high);
            // If we don't have a scaler then create it
            if (!this._scaler) {
                let [w, h] = [this._w, this._h];
                let sclrX = 0.25 * w, sclrY = 0.5 * h - 10;
                let sclrW = 0.5 * w, sclrH = 20;
                this._scaler = this._gui.slider(this._id + "-scaler", sclrX, sclrY, sclrW, sclrH)
                    .hide()
                    .setAction((info) => {
                    this._wscale = info.value;
                    this.invalidateBuffer();
                });
                this.addChild(this._scaler);
                this._scalerZone = {
                    x0: 0.15 * w, y0: 0.4 * h - 10,
                    x1: 0.85 * w, y1: 0.6 * h + 10
                };
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
    scale(v) {
        if (!Number.isFinite(v)) // no parameters
            return this._wscale;
        if (this._scaler)
            this._scaler.value(v);
        this._wscale = v;
        this.view(this._wcx, this._wcy, this._wscale);
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>The current status is an object with 3 fields <code>\{ cX, cY, scale \}</code>
     * where -</p>
     * <ul>
     * <li><code>cX, cY</code> is the position in the image that correseponds to the view center and</li>
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
    hideLayer(n) {
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
    showLayer(n) {
        if (Number.isInteger(n))
            if (n >= 0 && n < this._layers.length && this._hidden.has(n)) {
                this._hidden.delete(n);
                this.invalidateBuffer();
            }
        return this;
    }
    /**
    Sets the view of the image to be displayed. If you enter values outside the
    image or ar scale value outside scaler limts they will be constrained to legal
    action on the viewer to report back changes to the view centre and/or scale
    attributes.
    */
    view(wcx, wcy, wscale) {
        if (Number.isFinite(wcx) && Number.isFinite(wcy)) {
            if (this._neq(this._wcx, wcx) || this._neq(this._wcy, wcy)) {
                this._wcx = this._p.constrain(wcx, 0, this._lw);
                this._wcy = this._p.constrain(wcy, 0, this._lh);
                this._scrH.update(wcx / this._lw);
                this._scrV.update(wcy / this._lh);
                this.invalidateBuffer();
            }
            if (this._neq(this._wscale, wscale)) {
                this._wscale = wscale;
                if (this._scaler)
                    this._scaler.value(wscale);
                this.invalidateBuffer();
            }
            this.action({
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
    layers(img) {
        this._layers = Array.isArray(img) ? Array.from(img) : [img];
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
    /**
     * Sets the stroke weight to use for the frame. If not provided
     * or &lt;0 then no frame is drawn.
     * @param sw the stroke weight for the frame
     * @returns this control
     */
    frame(sw = 0) {
        this._frameWeight = sw < 0 ? 0 : sw;
        return this;
    }
    /** @hidden */
    shrink(dim) {
        console.warn("Cannot 'shrink' a viewer");
        return this;
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let absPos = this.getAbsXY();
        let [mx, my, cw, ch] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        this.isOver = (mx >= 0 && mx <= cw && my >= 0 && my <= ch);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this.isOver = true;
                this._dragging = true;
                // Remember starting values
                this._mx0 = this._pmx = mx;
                this._my0 = this._pmy = my;
                this._dcx = this._wcx;
                this._dcy = this._wcy;
                this._scrH.show();
                this._scrV.show();
                this.invalidateBuffer();
                break;
            case 'mouseout':
                this._scrH.hide();
                this._scrV.hide();
            case 'mouseup':
            case 'touchend':
                this.action({
                    source: this, p5Event: undefined,
                    cX: this._wcx, cY: this._wcy, scale: this._wscale
                });
                this._active = false;
                this._dragging = false;
                this.isOver = false;
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isOver) {
                    if (this._dragging) {
                        this._scaler?.hide();
                        this._validateMouseDrag(this._dcx + (this._mx0 - mx) / this._wscale, this._dcy + (this._my0 - my) / this._wscale);
                        this.invalidateBuffer();
                    }
                    else if (this._scaler) {
                        let a = this._scalerZone;
                        let v = mx >= a.x0 && mx <= a.x1 && my >= a.y0 && my <= a.y1;
                        if (v)
                            this._scaler.show();
                        else
                            this._scaler.hide();
                    }
                    this._scrH.show();
                    this._scrV.show();
                }
                else {
                    this._scrH.hide();
                    this._scrV.hide();
                }
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isOver ? this : null;
    }
    /** @hidden */
    _validateMouseDrag(ncx, ncy) {
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
            if (left < 0)
                ncx -= left;
            else
                ncx += this._lw - right;
        if (pinnedV || top < 0 && bottom > this._lh) // vertical
            ncy = this._lh / 2;
        else if (this._xor(top < 0, bottom > this._lh))
            if (top < 0)
                ncy -= top;
            else
                ncy += this._lh - bottom;
        this.view(ncx, ncy);
        this.invalidateBuffer();
    }
    /** @hidden */
    _updateControlVisual() {
        let cs = this._scheme || this._gui.scheme();
        let p = this._p;
        let [ws, wcx, wcy] = [this._wscale, this._wcx, this._wcy];
        let [w, h, lw, lh] = [this._w, this._h, this._lw, this._lh];
        const OPAQUE = cs['C_2'];
        const FRAME = cs['C_7'];
        let uib = this._uiBfr;
        uib.push();
        if (this._opaque)
            uib.background(OPAQUE);
        else
            uib.clear();
        // Get corners of requested view
        let ww2 = Math.round(0.5 * w / ws);
        let wh2 = Math.round(0.5 * h / ws);
        let o = this._overlap(0, 0, lw, lh, // image corners
        wcx - ww2, wcy - wh2, wcx + ww2, wcy + wh2); // world corners
        let [ox, oy] = [Math.round(o.offsetX * ws), Math.round(o.offsetY * ws)];
        let [ow, oh] = [Math.round(o.width * ws), Math.round(o.height * ws)];
        // If we have an offset then calculate the view image 
        if (o.valid) { // Calculate display offset
            for (let i = 0, len = this._layers.length; i < len; i++) {
                if (!this._hidden.has(i) && this._layers[i]) {
                    // Get view image and adjust for scale
                    let view = this._layers[i].get(o.left, o.top, o.width, o.height);
                    if (Math.abs(ws - 1) > 0.01)
                        view.resize(ow, oh);
                    uib.image(view, o.offsetX * ws, o.offsetY * ws, view.width, view.height);
                }
            }
        }
        if (this._frameWeight > 0) {
            uib.noFill();
            uib.stroke(FRAME);
            uib.strokeWeight(this._frameWeight);
            uib.rect(0, 0, uib.width, uib.height);
        }
        this._updateViewerPickBuffer(ox, oy, ow, oh);
        uib.pop();
    }
    /** @hidden */
    _updateViewerPickBuffer(x, y, w, h) {
        let c = this._gui.pickColor(this);
        let pkb = this._pkBfr;
        pkb.push();
        pkb.clear();
        pkb.noStroke();
        pkb.fill(c.r, c.g, c.b);
        pkb.rect(x, y, w, h);
        pkb.pop();
    }
    /**
     * <p>the 'a' parameters represent the image size i.e. [0, 0, image_width, imgaeHeight]
     * and 'b' the view area taking into account scaling.</p>
     * @hidden
     */
    _overlap(ax0, ay0, ax1, ay1, bx0, by0, bx1, by1) {
        let topA = Math.min(ay0, ay1);
        let botA = Math.max(ay0, ay1);
        let leftA = Math.min(ax0, ax1);
        let rightA = Math.max(ax0, ax1); // image edges
        let topB = Math.min(by0, by1);
        let botB = Math.max(by0, by1);
        let leftB = Math.min(bx0, bx1);
        let rightB = Math.max(bx0, bx1); // world edges
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
        return {
            valid: true,
            left: leftO, right: rightO, top: topO, bottom: botO,
            width: width, height: height,
            offsetX: offsetX, offsetY: offsetY,
        };
    }
    /** @hidden */
    _xor(a, b) {
        return (a || b) && !(a && b);
    }
    /** @hidden */
    _minControlSize() {
        return { w: this._w, h: this._h };
    }
    // Hide these methods from typeDoc
    /** @hidden */ orient(dir) { return this; }
    /** @hidden */ tooltip(tiptext) { return this; }
    /** @hidden */ tipTextSize(tsize) { return this; }
}
// Object.assign(CvsViewer.prototype, NoOrient);
// Object.assign(CvsViewer.prototype, NoTooltip);
//# sourceMappingURL=viewer.js.map
/**
 * This class supports a single line text entry field.
 *
 * The left/right arrow keys move the text insertion point within the
 * text. Used in combination with the shift key it enables part or all
 * of the text to be selected.
 *
 * If no text is selected then the arrows keys can move off the current
 * control to another. This only works if each textfield has a unique
 * index number (&gt0;).
 *
 * If the control has the index value 'idx' then the next control depends
 * on the arrow key pressed - <br>
 * left : idx - 1 <br>
 * right : idx + 1 <br>
 * up : idx - offset <br>
 * down : idx + offset <br>
 *
 * The offset value is set when initialising the idx value with the
 * <code>index(idx, deltaIndex)</code> method.
 *
 * No other controls can be used while a textfield control is active. Pressing
 * 'Enter' or attempting to move to a non-existant textfield deactivates the
 * current textfield.
 *
 * The user can provide their own validation function which is checked when
 * the control is deativated.
 *
 */
class CvsTextField extends CvsText {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
        /** @hidden */ this._nextActive = null;
        /** @hidden */ this._linkOffset = 0;
        /** @hidden */ this._prevCsrIdx = 0;
        /** @hidden */ this._currCsrIdx = 0;
        /** @hidden */ this._textInvalid = false;
        /** @hidden */ this._cursorOn = false;
        this.textAlign(this._p.LEFT);
        this._c = [0, 0, 0, 0];
    }
    /**
     * Set a unique index number for this text field.
     *
     * @param idx unique index number
     * @param deltaIndex relative link when using up/down arrow keys
     * @returns this control
     */
    index(idx, deltaIndex) {
        if (Number.isFinite(idx)) {
            if (Number.isFinite(deltaIndex))
                this._linkOffset = deltaIndex;
            this._linkIndex = idx;
            if (!this._gui._links)
                this._gui._links = new Map();
            this._gui._links.set(idx, this);
        }
        return this;
    }
    /**
     * Gets or sets the current text.
     * Any EOL characters are stripped out of the string. If necessary the
     * string length will be reduced until it will fit inside the textfield.
     * If a validation function has been set then the string will be
     * validated.
     *
     * @param t a string representing text to display
     * @returns this control for setter
     */
    text(t) {
        // getter
        // if (t == null || t == undefined) return this._getLine();
        if (!t)
            return this._getLine();
        //setter
        this._textInvalid = false;
        this._lines = [t.toString().replaceAll('\n', ' ')];
        this._validate();
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Sets or gets the text size.</p>
     * @param lts the text size to use
     * @returns this control or the current text size
     */
    textSize(lts) {
        let ts = this._textSize || this._gui.textSize();
        // getter
        if (!Number.isFinite(lts))
            return ts;
        // setter
        lts = Number(lts);
        if (lts != ts) {
            this._textSize = lts;
            this.invalidateBuffer();
        }
        return this;
    }
    /** @hidden */
    textAlign(align) { return this; }
    /** @hidden */
    noText() { return this; }
    /**
     * Removes the link index from this textfield. After this it will not be possible
     * to move focus to this textfield using the keyboard arrows.
     * @returns this control
     */
    noIndex() {
        if (Number.isFinite(this._linkIndex) && !this._gui._links)
            this._gui._links.delete(this._linkIndex);
        this._linkIndex = undefined;
        return this;
    }
    /**
     * If there is no validation function then this will always return true.
     * @returns true if the text has passed validation
     */
    isValid() {
        return !this._textInvalid;
    }
    /**
     * If there is no text then this method will always return false. If there
     * is some text then this method returns the same as the
     * <code>isValid()</code> method.
     *
     * @returns true if there is some text and it passed any validation function
     */
    hasValidText() {
        return !this._textInvalid && this._lines.length > 0 && this._lines[0].length > 0;
    }
    /**
     * If the text is invalid this method it clears the validity effectively making
     * the text valid.
     * @returns this control
     */
    clearValid() {
        if (this._textInvalid) {
            this._textInvalid = false;
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * Set the validation function to be used for this control.
     *
     * The function is created by the user and should return an array of
     * two elements e.g. <code>[valid, valid-text]</code>
     *
     * <code>valid</code> is a boolean indicating if the text is valid and<br>
     * <code>valid-text</code> can be the original text or amended in some way.
     *
     * For instance a textfield used for getting a persons name will be valid
     * if there are 2 or more words and the valid-text will be the name
     * but with the first letter of each word being capatilised.
     *
     * @param vfunc the validation function
     * @returns this control
     */
    validation(vfunc) {
        this._validation = vfunc;
        return this;
    }
    /**
     * Validate the text
     * @hidden
     */
    _validate() {
        if (this._validation) {
            let line = this._getLine();
            let r = this._validation(line);
            if (Array.isArray(r) && r.length > 0) {
                this._textInvalid = !Boolean(r[0]);
                // Validator has returned formatted text?
                if (r[1])
                    this._lines[0] = r[1];
            }
        }
        else {
            this._textInvalid = false;
        }
    }
    /**
     * Deactivate this control
     * @hidden
     */
    _deactivate() {
        this._active = false;
        this.isOver = false;
        this._cursorOn = false;
        this._validate();
        this._prevCsrIdx = this._currCsrIdx = this._getLine().length;
        if (this._textInvalid)
            this._prevCsrIdx = 0;
        this.invalidateBuffer();
        this._nextActive = null;
    }
    /**
     * Activate this control to receive keyboard events. Occurs if the user
     * clicks on the control or is 'tabbed' into the control.
     * @hidden
     */
    _activate(selectAll = false) {
        this._active = true;
        this._cursorOn = true;
        // Set cursor flashing while active
        setTimeout(() => this._flashCursor(), 550);
        this.invalidateBuffer();
        this._nextActive = this;
    }
    /** @hidden */
    _flashCursor() {
        if (this._active) {
            this._cursorOn = !this._cursorOn;
            setTimeout(() => this._flashCursor(), 550);
        }
        else
            this._cursorOn = false;
        this.invalidateBuffer();
    }
    /**
     * Called when this control passes focus to a new control.
     * @param idx the index for the control to be activated
     * @hidden
     */
    _activateNext(offset) {
        let links = this._gui._links, ctrl = null;
        if (links) {
            let idx = this._linkIndex;
            do {
                idx += offset;
                ctrl = links.get(idx);
            } while (ctrl && (!ctrl.isEnabled || !ctrl.isVisible));
            ctrl?._activate();
            this._nextActive = ctrl;
            this.invalidateBuffer();
        }
    }
    /**
     * We are only interested in the first line of text
     * @hidden
     */
    _getLine() {
        return (this._lines.length > 0 ? this._lines[0].toString() : '');
    }
    /**
     * Calculates and returns the pixel length for a given
     * character position.
     * @hidden
     */
    _cursorX(buff, line, idx) {
        return !idx || idx == 0 ? 0 : buff.textWidth(line.substring(0, idx));
    }
    /** @hidden */
    _doKeyEvent(e) {
        this._nextActive = this;
        let line = this._getLine(); // get text
        let hasSelection = this._prevCsrIdx != this._currCsrIdx;
        let tabLeft = Boolean(this._linkIndex && !hasSelection && this._currCsrIdx == 0);
        let tabRight = Boolean(this._linkIndex && !hasSelection && this._currCsrIdx >= line.length);
        if (e.type == 'keydown') {
            // Visible character
            if (e.key.length == 1) {
                if (this._prevCsrIdx != this._currCsrIdx) {
                    line = this._removeSelectedText(line);
                }
                // Add new character provided it is short enough to display safely
                line = line.substring(0, this._currCsrIdx) + e.key + line.substring(this._currCsrIdx);
                // if (this._uiBfr.textWidth(line) < mtw) {
                this._currCsrIdx++;
                this._prevCsrIdx++;
                this._lines[0] = line;
                // }
                this.invalidateBuffer();
            }
            switch (e.key) {
                case 'ArrowLeft':
                    if (tabLeft) {
                        this._deactivate();
                        this._activateNext(-1);
                        this.action({ source: this, p5Event: e, value: this._getLine(), valid: !this._textInvalid });
                    }
                    else {
                        if (this._currCsrIdx > 0) {
                            if (!e.shiftKey && hasSelection)
                                this._currCsrIdx = Math.min(this._currCsrIdx, this._prevCsrIdx);
                            else
                                this._currCsrIdx--;
                            if (!e.shiftKey)
                                this._prevCsrIdx = this._currCsrIdx;
                        }
                    }
                    break;
                case 'ArrowRight':
                    if (tabRight) {
                        this._deactivate();
                        this._activateNext(1);
                        this.action({ source: this, p5Event: e, value: this._getLine(), valid: !this._textInvalid });
                    }
                    else {
                        if (this._currCsrIdx <= line.length) {
                            if (!e.shiftKey && hasSelection)
                                this._currCsrIdx = Math.max(this._currCsrIdx, this._prevCsrIdx);
                            else
                                this._currCsrIdx++;
                            if (!e.shiftKey)
                                this._prevCsrIdx = this._currCsrIdx;
                        }
                    }
                    break;
                case 'ArrowUp':
                    if (!hasSelection) {
                        if (this._linkOffset !== 0) {
                            this._deactivate();
                            this._activateNext(-this._linkOffset);
                        }
                        this.action({ source: this, p5Event: e, value: this._getLine(), valid: !this._textInvalid });
                    }
                    break;
                case 'ArrowDown':
                    if (!hasSelection) {
                        if (this._linkOffset !== 0) {
                            this._deactivate();
                            this._activateNext(this._linkOffset);
                        }
                        this.action({ source: this, p5Event: e, value: this._getLine(), valid: !this._textInvalid });
                    }
                    break;
                case 'Enter':
                    this._deactivate();
                    this.action({ source: this, p5Event: e, value: this._getLine(), valid: !this._textInvalid });
                    break;
                case 'Backspace':
                    if (this._prevCsrIdx != this._currCsrIdx) {
                        line = this._removeSelectedText(line);
                    }
                    else { // Delete character to left
                        if (this._currCsrIdx > 0) {
                            line = line.substring(0, this._currCsrIdx - 1) + line.substring(this._currCsrIdx);
                            this._currCsrIdx--;
                            this._prevCsrIdx = this._currCsrIdx;
                        }
                    }
                    this._lines[0] = line;
                    break;
                case 'Delete':
                    if (this._prevCsrIdx != this._currCsrIdx) {
                        line = this._removeSelectedText(line);
                    }
                    else { // Delete character to right
                        if (this._currCsrIdx < line.length) {
                            line = line.substring(0, this._currCsrIdx) + line.substring(this._currCsrIdx + 1);
                        }
                    }
                    this._lines[0] = line;
                    break;
                default:
            }
            this.invalidateBuffer();
        } // End of key down
        return this._nextActive;
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._activate();
                break;
            case 'mousemove':
            case 'touchmove':
                this.isOver = (this == over.control);
                this._tooltip?._updateState(enter);
                this.invalidateBuffer();
                break;
        }
        return this._nextActive;
    }
    /**
     * Remove any user selected text
     * @hidden
     */
    _removeSelectedText(line) {
        let p0 = Math.min(this._prevCsrIdx, this._currCsrIdx);
        let p1 = Math.max(this._prevCsrIdx, this._currCsrIdx);
        this._prevCsrIdx = this._currCsrIdx = p0;
        return line.substring(0, p0) + line.substring(p1);
    }
    /** @hidden */
    _updateControlVisual() {
        function csrX(idx) {
            if (!idx || idx == 0)
                return 0;
            else
                return MEASURE_TEXT(line.substring(0, idx), uib, tf, ty, ts).fw;
        }
        let ts = Number(this._textSize || this._gui.textSize());
        let tf = this._textFont || this._gui.textFont();
        let ty = this._textStyle || this._gui.textStyle();
        let cs = this._scheme || this._gui.scheme();
        let line = this._getLine();
        let tiv = this._textInvalid;
        let sx = 4 + Math.max(this._c[0], this._c[3]);
        let ex = this._w - (4 + Math.max(this._c[1], this._c[2]));
        const CURSOR = cs['G_9'], HIGHLIGHT = cs['C_9'], SELECT = cs['C_3'];
        // Prepare buffer
        let uib = this._uiBfr;
        uib.clear();
        uib.push();
        uib.textFont(tf);
        uib.textStyle(ty);
        uib.textSize(ts);
        // Draw background based on whether active or not
        let BACK = cs['C_1'], FORE = cs['C_9'];
        if (!this.isActive) { // Colors depend on whether text is valid
            BACK = tiv ? cs['C_9'] : cs['C_1'];
            FORE = tiv ? cs['C_3'] : cs['C_9'];
            uib.fill(BACK);
        }
        else
            uib.fill(cs['G_0']);
        uib.stroke(FORE);
        uib.strokeWeight(2);
        uib.rect(1, 1, this._w - 2, this._h - 2, ...this._c);
        // Draw text and cursor
        uib.push();
        uib.beginClip();
        uib.rect(sx, 1.5, ex - sx, this._h - 3);
        uib.endClip();
        uib.fill(BACK);
        let cx = csrX(this._currCsrIdx); // cursor pixel position
        // If active display any selection
        if (this.isActive) {
            // If tx > 0 then the cursor is outside visible area
            // so move it
            let tx = cx - (ex - sx);
            if (tx > 0)
                uib.translate(-tx, 0);
            // Show any selected text
            if (this._currCsrIdx != this._prevCsrIdx) {
                let px = csrX(this._prevCsrIdx);
                let cx0 = sx + Math.min(px, cx), cx1 = Math.abs(px - cx);
                uib.noStroke();
                uib.fill(SELECT);
                uib.rect(cx0, 1.5, cx1, this._h - 3, ...this._c);
            }
        }
        uib.textSize(ts);
        uib.textAlign(this._p.LEFT, this._p.TOP);
        uib.noStroke();
        uib.fill(FORE);
        uib.text(line, sx, (this._h - ts) / 2);
        // Draw cursor
        if (this._active && this._cursorOn) {
            uib.stroke(CURSOR);
            uib.strokeWeight(1.75);
            uib.line(sx + cx, 4, sx + cx, this._h - 5);
        }
        uib.pop();
        // Mouse over control highlight
        if (this.isOver) {
            uib.stroke(HIGHLIGHT);
            uib.strokeWeight(2.5);
            uib.noFill();
            uib.rect(1, 1, this._w - 2, this._h - 2, ...this._c);
        }
        // Control disabled highlight
        if (!this._enabled)
            this._disable_hightlight(uib, cs, 0, 0, this._w, this._h);
        this._updateRectControlPB();
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }
}
//# sourceMappingURL=textfield.js.map
/**
 * <p>This class simulates a multi-mode joystick. Each of the three possible
 * modes apply different constraints to the range of movement allowed they
 * are -.</p>
 * <p><code>'X0'</code> : can move in any direction (360&deg;). This is the default value.<br>
 * <code>'X4'</code> : constrained to the 4 main compass directions
 * (N, E, S, W).<br>
 * <code>'X8'</code> : constrained to the 8 main compass directions
 * (N, NE, E, SE, S, SW, W, NW).</p>
 *
 * <p>To handle events use the <code>setAction</code> method to specify
 * the action-method that will be used to process action-info objects
 * created when the joystick is moved.</p>
 * <p>The action-info object has several very useful fields that describes
 * the state of the joystick, they include -</p>
 * <p>
 * <ul>
 * <li><code>dir</code></li>
 * <p>An integer that indicates the direction the stick is pushed. The values
 * returned depend on the current mode -</p>
 * <pre>
 * <b>Direction values for X4 and X8 modes</b>
 *      5   6   7
 *       \  |  /
 *        \ | /
 *    4 --- <b>Z</b> --- 0       <b>Z</b> is the dead zone.
 *        / | \
 *       /  |  \          If control is in mode 'X0' or the joystick
 *      3   2   1         position is in the dead zone the the value is -1
 * </pre>
 * <p><code>'X0'</code> : always -1<br>
 * <code>'X4'</code> : 0, 2, 4 or 6<br>
 * <code>'X8'</code> : 0, 1, 2, 3, 4, 5, 6 or 7</p>
 *
 * <li><code>dead</code></li>
 * <p>If the stick is in the dead zone which surrounds the stick's
 * rest state then this value will be <code>true</code>.</p>
 *
 * <li><code>mag</code></li>
 * <p>The magnitude is in range &ge; 0 and &le; 1 representing
 * the distance the stick has been pushed.</p>
 *
 * <li><code>angle</code>
 * <p>The angle is in range &ge; 0 and &lt; 2&pi;
 * representing the angle the stick makes to the poistive x axis in the
 * clockwise direction. In modes X4 and X8 the angles will be constrained to
 * the permitted directions.</p>
 *
 * <li><code>final</code></li>
 * <p>This is <code>false</code> if the stick is still being moved and
 * <code>true</code> if the stick has been released.</p>
 * </ul>
 * <p>When the joystick is released it will return back to its rest state
 * i.e. centered.</p>
 */
class CvsJoystick extends CvsBufferedControl {
    /**
      * @hidden
      * @param gui the gui controller
      * @param name unique name for this control
      * @param x left-hand pixel position
      * @param y top pixel position
      * @param w width
      * @param h height
      */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 40, h || 40);
        this._size = Math.min(w, h);
        this._pr0 = 0.05 * this._size;
        this._pr1 = 0.40 * this._size;
        this._tSize = Math.max(0.075 * this._size, 6);
        this._mode = 'X0';
        this._mag = 0;
        this._ang = 0;
        this._opaque = false;
        this._tmrID = undefined;
    }
    /**
     * The mode defines the constraints applied to movement of the joystick. There are three
     * permitted modes -<p>
     * <ul>
     * <li>'X0' : can move in any direction (360&deg;). This is the default value.</li>
     * <li>'X4' : constrained to the 4 main compass directions (N, E, S, W).</li>
     * <li>'X8' : constrained to the 8 main compass directions (N, NE, E, SE, S, SW, W, NW).</li>
     * </ul>
     * <p>Any other value will be silently ignored.</p>
     * @param m either 'X0', 'X4' or 'X8'
     * @returns this control
     */
    mode(m) {
        if (!m)
            return this._mode;
        m = m.toUpperCase();
        switch (m) {
            case 'X0':
            case 'X4':
            case 'X8':
                if (this._mode != m) {
                    this._mode = m;
                    this.invalidateBuffer();
                }
        }
        return this;
    }
    /**
     * Set the thumb size.
     * @param ts the diameter of the thumb
     * @returns this control
     */
    thumbSize(ts) {
        this._tSize = ts;
        return this;
    }
    /**
     * Converts the polar position to cartesian cooordinates.
     * @hidden
     */
    _getThumbXY() {
        return [this._mag * Math.cos(this._ang), this._mag * Math.sin(this._ang)];
    }
    /**
     * Validates the mouse / touch position based on joystick size and mode.
     * @hidden
     */
    _validateThumbPosition(x, y) {
        let mag = this._p.constrain(Math.sqrt(x * x + y * y), 0, this._pr1);
        let ang = Math.atan2(y, x);
        ang += ang < 0 ? 2 * Math.PI : 0;
        let dead = mag <= this._pr0;
        let dir = -1, da;
        switch (this._mode) {
            case 'X4':
                da = Math.PI / 2;
                dir = Math.floor((ang + da / 2) / da) % 4;
                ang = da * dir;
                dir *= 2;
                break;
            case 'X8':
                da = Math.PI / 4;
                dir = Math.floor((ang + da / 2) / da) % 8;
                ang = da * dir;
                break;
        }
        [this._mag, this._ang, this._dir, this._dead] = [mag, ang, dir, dead];
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        /** @hidden */
        function getValue(source, event, fini) {
            let mag = (source._mag - source._pr0) / (source._pr1 - source._pr0);
            return {
                source: source, p5Event: event, final: fini, mag: mag,
                angle: source._ang, dir: source._dir, dead: source._dead,
            };
        }
        let [mx, my, w, h] = this._orientation.xy(x - this._x, y - this._y, this.w, this.h);
        mx -= w / 2;
        my -= h / 2; // Make relative to joystick centre
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this.isOver = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                this._validateThumbPosition(mx, my);
                this.action(getValue(this, e, true));
                this._active = false;
                this.invalidateBuffer();
                if (!this._tmrID)
                    this._tmrID = setInterval(() => {
                        this._mag -= 0.07 * this._size;
                        if (this._mag <= 0) {
                            clearInterval(this._tmrID);
                            this._tmrID = undefined;
                            this._mag = 0;
                        }
                        this.invalidateBuffer();
                    }, 25);
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    this._validateThumbPosition(mx, my);
                    this.action(getValue(this, e, false));
                }
                this.isOver = (this == over.control);
                this._tooltip?._updateState(enter);
                this.invalidateBuffer();
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /** @hidden */
    _updateControlVisual() {
        let cs = this._scheme || this._gui.scheme();
        let [tx, ty] = [this._mag * Math.cos(this._ang), this._mag * Math.sin(this._ang)];
        const OPAQUE = cs['C_3'];
        const DIAL_FACE = cs['C_1'];
        const DIAL_TINT = cs['T_0'];
        const DIAL_BORDER = cs['C_9'];
        const THUMB_STROKE = cs['C_9'];
        const THUMB_OFF = cs['C_4'];
        const THUMB_OVER = cs['C_6'];
        const ROD = cs['C_7'];
        const MARKERS = cs['C_8'];
        const DEAD_ZONE = cs['T_5'];
        let uib = this._uiBfr;
        uib.push();
        uib.clear();
        if (this._opaque) {
            uib.noStroke();
            uib.fill(OPAQUE);
            uib.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        uib.translate(uib.width / 2, uib.height / 2);
        // dial face background
        uib.noStroke();
        uib.fill(DIAL_FACE);
        uib.ellipse(0, 0, this._pr1 * 2, this._pr1 * 2);
        // dial face highlight
        let s = 0, e = 0.26 * this._size, da = 0;
        uib.fill(DIAL_TINT);
        uib.noStroke(); //b.stroke(DIAL_TINT); b.strokeWeight(2);
        uib.ellipse(0, 0, e * 2, e * 2);
        uib.ellipse(0, 0, e * 1.25, e * 1.25);
        // Dial face markers
        uib.stroke(MARKERS);
        switch (this._mode) {
            case 'X0':
                s = this._pr1;
                e = 0.33 * this._size;
                da = Math.PI / 8;
                uib.push();
                uib.strokeWeight(0.75);
                e = 0.3 * this._size;
                for (let i = 0; i < 16; i++) {
                    uib.line(s, 0, e, 0);
                    uib.rotate(da);
                }
                uib.pop();
                break;
            case 'X8':
                s = this._pr0;
                e = 0.33 * this._size;
                da = Math.PI / 4;
                uib.push();
                uib.strokeWeight(1);
                for (let i = 0; i < 8; i++) {
                    uib.line(s, 0, e, 0);
                    uib.rotate(da);
                }
                uib.pop();
            case 'X4':
                s = this._pr0;
                e = this._pr1;
                da = Math.PI / 2;
                uib.push();
                uib.strokeWeight(1.5);
                for (let i = 0; i < 4; i++) {
                    uib.line(s, 0, e, 0);
                    uib.rotate(da);
                }
                uib.pop();
                break;
        }
        // Dial border
        uib.stroke(DIAL_BORDER);
        uib.strokeWeight(Math.max(3, 0.025 * this._size));
        uib.noFill();
        uib.ellipse(0, 0, this._pr1 * 2, this._pr1 * 2);
        // Dead zone
        uib.fill(DEAD_ZONE);
        uib.noStroke();
        uib.ellipse(0, 0, this._pr0 * 2, this._pr0 * 2);
        // Stick                                                                                    
        uib.stroke(ROD);
        uib.strokeWeight(this._size * 0.05);
        uib.line(0, 0, tx, ty);
        // Thumb
        uib.strokeWeight(2);
        uib.stroke(THUMB_STROKE);
        if (this.isActive || this.isOver)
            uib.fill(THUMB_OVER);
        else
            uib.fill(THUMB_OFF);
        uib.ellipse(tx, ty, this._tSize * 2, this._tSize * 2);
        this._updateJoystickPickBuffer(tx, ty, this._tSize);
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _updateJoystickPickBuffer(tx, ty, tSize) {
        let c = this._gui.pickColor(this);
        let pkb = this._pkBfr;
        pkb.push();
        pkb.clear();
        pkb.translate(pkb.width / 2, pkb.height / 2);
        pkb.noStroke();
        pkb.fill(c.r, c.g, c.b);
        pkb.ellipse(tx, ty, tSize * 2, tSize * 2);
        pkb.pop();
    }
}
//# sourceMappingURL=joystick.js.map
/**
 * <p>This class represents a turnable knob with a surrounding status track
 * (optional). Three modes are available to rotate the knob.</p>
 * <p>Major and minor tick marks can be added to the status track and
 * supports stick-to-ticks if wanted. </p>
 * @since 1.1.0
 */
class CvsKnob extends CvsSlider {
    /**
     * @hidden
     * @param gui the gui controller
     * @param name unique name for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 40, h || 40);
        // Mouse / touch mode
        /** @hidden */ this._mode = CvsKnob.X_MODE;
        /** @hidden */ this._sensitivity = 0.005;
        this._size = Math.min(w, h);
        this._turnArc = 2 * Math.PI; // Full turn of 360 degrees
        this._gapPos = 0.5 * Math.PI; // South
        this._tw = 0;
        this._kRad = 0.5 * this._size;
        this._gRad = this._kRad - 4;
        this._opaque = true;
    }
    /**
     * <p>Sets the interaction mode for rotating the knob.</p>
     * <ul>
     * <li><code>'x'</code> : dragging left and right turns the knob anticlockwise and clockwise respectively.</li>
     * <li><code>'y'</code> : dragging down and up turns the knob anticlockwise and clockwise respectively.</li>
     * <li><code>'a'</code> : dragging in a circular motion round the knob center turns the knob to face the drag point.</li>
     * </ul>
     * <p>Rotation is constrained within the maximum turn angle for this knob.</p>
     * <p>Any other parameter value is ignored and the mode is unchanged.</p>
     *
     * @param mode 'x', 'y' or 'a'
     * @returns this control
     */
    mode(mode) {
        switch (mode) {
            case 'x':
                this._mode = CvsKnob.X_MODE;
                break;
            case 'y':
                this._mode = CvsKnob.Y_MODE;
                break;
            case 'a':
                this._mode = CvsKnob.A_MODE;
                break;
        }
        return this;
    }
    /**
     * <p>Only applies to modes 'x' and 'y'. It controls how far the knob
     * rotates for a given drag distance.</p>
     * <p>The drag distance needed to rotate the knob by the maximum turn
     * angle is the reciprocal of the parameter value i.e. <code>1.0 / sens</code>.</p>
     * <p>The default value is 0.005 which equates to a drag distance of 200 pixels
     * and the minimum permitted value is 0.0025 (400 pixels).</p>
     *
     * @param svty &ge;0.0025
     * @returns this control
     */
    sensitivity(svty) {
        if (svty != 0) {
            let sgn = svty < 0 ? -1 : 1;
            let mag = Math.abs(svty);
            this._sensitivity = sgn * (mag < 0.0025 ? 0.0025 : mag);
        }
        return this;
    }
    /**
     * <p>Sets the width of the track surrounding the central knob-grip. The
     * value will be constrained so the minimum width is 6 pixels upto
     * the radius of the knob.</p>
     * <p>The track is used to display current value bar as well as any user
     * specified ticks.</p>
     *
     * @param tw the width of the value track
     * @returns this control
     */
    track(tw) {
        tw = this._p.constrain(tw, 6, this._kRad);
        this._gRad = this._kRad - tw;
        this._tw = tw;
        this.invalidateBuffer();
        return this;
    }
    /**
     * <p>Sets the maximum angle the knob can be turned in degrees. Angles
     * outside the range &gt;0&deg; and &le;360&deg; will be ignored and
     * the current turn angle is unchanged.</p>
     * @param ang max.turn angle &gt;0 and &le;360 degrees
     * @returns this control
     */
    turnAngle(ang) {
        if (ang > 0 && ang <= 360) {
            this._turnArc = this._p.radians(ang);
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * <p>If the turn angle is &lt 360&deg; then there will be an 'unused'
     * section of track. This is called the gap and this method sets the
     * position of the gap center effectively rotating the whole knob.</p>
     * <p>The angle is 0&deg; along positive x-axis and increases clockwise.
     * The default value is 90&deg; which means the gap center is facing
     * south.</p>
     *
     * @param ang must be in the range &ge; 0 and &le; 360
     * @returns this control
     */
    gap(ang) {
        if (ang >= 0 && ang <= 360) {
            this._gapPos = this._p.radians(ang);
            this.invalidateBuffer();
        }
        return this;
    }
    /**
     * Converts XY position to a parmetric value in the range
     * 0 and 1 inclusive.
     *
     * @hidden
     */
    _tFromXY(x, y) {
        function fixAngle(a) {
            return a < 0 ? a + 2 * Math.PI : a;
        }
        let t = this._t01, under = false, over = false;
        switch (this._mode) {
            case CvsKnob.X_MODE:
                t = this._t01 + (x - this._prevX) * this._sensitivity;
                under = (t < 0);
                over = (t > 1);
                t = this._p.constrain(t, 0, 1);
                break;
            case CvsKnob.Y_MODE:
                t = this._t01 - (y - this._prevY) * this._sensitivity;
                under = (t < 0);
                over = (t > 1);
                t = this._p.constrain(t, 0, 1);
                break;
            case CvsKnob.A_MODE:
                let low = Math.PI - this._turnArc / 2;
                let high = 2 * Math.PI - low;
                let ang = fixAngle(Math.atan2(y, x));
                ang = fixAngle(ang - this._gapPos);
                under = ang < low;
                over = ang > high;
                t = this._p.map(ang, low, high, 0, 1, true);
                break;
        }
        return { t: t, under: under, over: over };
    }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let [mx, my, w, h] = this._orientation.xy(x - this._x, y - this._y, this.w, this.h);
        mx -= w / 2;
        my -= h / 2; // Make relative to knob centre
        let next;
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._prevX = mx;
                this._prevY = my;
                this._active = true;
                this.isOver = true;
                this.invalidateBuffer();
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                next = this._tFromXY(mx, my);
                this._t01 = this._s2ticks ? this._nearestTickT(next.t) : next.t;
                this.action({ source: this, p5Event: e, value: this.value(), final: true });
                this._active = false;
                this.invalidateBuffer();
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive) {
                    next = this._tFromXY(mx, my);
                    let t01 = this._s2ticks ? this._nearestTickT(next.t) : next.t;
                    if (this._t01 != t01) {
                        this._prevX = mx;
                        this._prevY = my;
                        this._t01 = t01;
                        this.action({ source: this, p5Event: e, value: this.value(), final: false });
                    }
                }
                this.isOver = (this == over.control);
                this._tooltip?._updateState(enter);
                this.invalidateBuffer();
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /** @hidden */
    _updateControlVisual() {
        let cs = this._scheme || this._gui.scheme();
        const OPAQUE = cs['C_3'];
        const GRIP_OFF = cs['C_7'], GRIP_STROKE = cs['C_8'];
        const MARKER = cs['C_3'];
        const HIGHLIGHT = cs['C_9'];
        const TRACK_BACK = cs['C_3'], TRACK_ARC = cs['C_1'];
        const TICKS = cs['G_8'];
        const USED_TRACK = cs['G_2'], UNUSED_TRACK = cs['T_1'];
        let uib = this._uiBfr;
        uib.clear();
        if (this._opaque) {
            uib.noStroke();
            uib.fill(OPAQUE);
            uib.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        let arc = this._turnArc, gap = 2 * Math.PI - arc, lowA = gap / 2;
        let rOut = this._kRad, rIn = this._gRad;
        let dOut = 2 * rOut, dIn = 2 * rIn;
        uib.push();
        uib.translate(uib.width / 2, uib.height / 2);
        uib.rotate(this._gapPos + lowA);
        // Draw full background and track arc
        uib.noStroke();
        uib.fill(TRACK_BACK);
        uib.ellipse(0, 0, dOut, dOut);
        uib.fill(TRACK_ARC);
        uib.arc(0, 0, dOut, dOut, 0, this._turnArc);
        // Draw ticks? 
        let n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            let b0 = this._tw, b1 = 0.65 * b0;
            uib.stroke(TICKS);
            let da = arc / n;
            uib.push();
            {
                uib.strokeWeight(0.9);
                // minor ticks
                for (let i = 0; i <= n; i++) {
                    uib.line(rIn, 0, rIn + b1, 0);
                    uib.rotate(da);
                }
            }
            uib.pop();
            n = this._majorTicks;
            if (n >= 2) {
                let da = arc / n;
                uib.push();
                {
                    uib.strokeWeight(1);
                    // major ticks
                    for (let i = 0; i <= n; i++) {
                        uib.line(rIn, 0, rIn + b0, 0);
                        uib.rotate(da);
                    }
                }
                uib.pop();
            }
            // Unused track
            uib.noStroke();
            uib.fill(UNUSED_TRACK);
            uib.arc(0, 0, dIn + b0, dIn + b0, 0, arc);
            // Unused track
            uib.fill(USED_TRACK);
            uib.arc(0, 0, dIn + b0, dIn + b0, 0, this._t01 * arc);
        }
        // Grip section
        uib.stroke(GRIP_STROKE);
        uib.strokeWeight(1.5);
        uib.fill(GRIP_OFF);
        uib.ellipse(0, 0, dIn, dIn);
        // Grip arrow marker
        uib.push();
        {
            uib.rotate(this._t01 * arc);
            let ms = 0.2 * rIn;
            uib.fill(MARKER);
            uib.noStroke();
            uib.beginShape();
            uib.vertex(-ms, 0);
            uib.vertex(0, -ms);
            uib.vertex(rIn, 0);
            uib.vertex(0, ms);
            uib.endShape(this._p.CLOSE);
        }
        uib.pop();
        // Is over highlight?
        if (this.isOver) {
            uib.noFill();
            uib.stroke(HIGHLIGHT);
            uib.strokeWeight(3);
            uib.arc(0, 0, 2 * this._kRad, 2 * this._kRad, 0, arc);
        }
        this._updateKnobPickBuffer(dOut);
        uib.pop();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _updateKnobPickBuffer(dOut) {
        let c = this._gui.pickColor(this);
        let pkb = this._pkBfr;
        pkb.push();
        pkb.clear();
        pkb.translate(pkb.width / 2, pkb.height / 2);
        pkb.noStroke();
        pkb.fill(c.r, c.g, c.b);
        pkb.ellipse(0, 0, dOut, dOut);
        pkb.pop();
    }
    /** @hidden */
    _minControlSize() {
        return { w: this._size, h: this._size };
    }
}
/** @hidden */ CvsKnob.X_MODE = 1;
/** @hidden */ CvsKnob.Y_MODE = 2;
/** @hidden */ CvsKnob.A_MODE = 3;
//# sourceMappingURL=knob.js.map
/**
 * <p>This class represents a draggable panel that can be used to hold other
 * controls.</p>
 * <p>On creation the panel -</p>
 * <ol>
 * <li>has an opaque background (this is required for dragging).</li>
 * <li>can be dragged in both X and Y directions.</li>
 * <li>is constrained so the entire panel stays within the display area.</li>
 * </ol>
 * <p>If the background is transparent then the panel cannot be dragged.
 * Panel movement can limited using the <code>draggable()</code> and
 * <code>constrain()</code> methods.</p>
 * <p>It is recommended that the panel width and height should not exceed
 * that of the display area (i.e. canvas).</p>
 */
class CvsPanel extends CvsBufferedControl {
    /**
     * @hidden
     * @param gui the gui controller
     * @param name unique name for this control
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 100, h || 100);
        /** @hidden */ this._canDragX = true;
        /** @hidden */ this._canDragY = true;
        /** @hidden */ this._constrainX = true;
        /** @hidden */ this._constrainY = true;
        this._c = [0, 0, 0, 0];
        this._opaque = true;
        this._z = PANEL_Z;
    }
    /**
     * Horizontal and vertical movement can be restricted based on the
     * actual parameters.
     * @param allowX allow horizontal movement if true
     * @param allowY allow vertical movement if true
     * @returns this control
     */
    draggable(allowX = true, allowY = true) {
        this._canDragX = allowX;
        this._canDragY = allowY;
        return this;
    }
    /**
     * Panel position can be constrained horizontally and vertically so that
     * it fits within the outside the display area.
     * @param limitX
     * @param limitY
     * @returns this control
     */
    constrain(limitX = true, limitY = true) {
        this._constrainX = limitX;
        this._constrainY = limitY;
        return this;
    }
    /** true if the panel can be dragged else false. */
    get isDraggable() { return this._opaque && (this._canDragX || this._canDragY); }
    /** @hidden */
    get canDragX() { return this._canDragX; }
    /** @hidden */
    get canDragY() { return this._canDragY; }
    /** @hidden */
    _doEvent(e, x = 0, y = 0, over, enter) {
        let absPos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(x - absPos.x, y - absPos.y, this._w, this._h);
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (over.part == 0 && (this._canDragX || this._canDragY)) {
                    this._active = true;
                    this.isOver = true;
                    this._dragData = [mx, my];
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    this._active = false;
                    this.isOver = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this.isActive && (this._canDragX || this._canDragY)) {
                    let [msx, msy] = this._dragData;
                    let nx = this._x + (this._canDragX ? mx - msx : 0);
                    let ny = this._y + (this._canDragY ? my - msy : 0);
                    let [pw, ph] = [this._p.width, this._p.height];
                    let [cw, ch] = [this._w, this._h];
                    if (this._constrainX && cw <= pw) {
                        if (nx < 0)
                            nx = 0;
                        else if (nx > pw - cw)
                            nx = pw - cw;
                    }
                    if (this._constrainY && ch <= ph) {
                        if (ny < 0)
                            ny = 0;
                        else if (ny > ph - ch)
                            ny = ph - ch;
                    }
                    this.moveTo(nx, ny);
                }
                this.isOver = (this == over.control);
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /** @hidden */
    _updateControlVisual() {
        let cs = this._scheme || this._gui.scheme();
        const OPAQUE = cs['C_0'];
        const HIGHLIGHT = cs['C_3'];
        let uib = this._uiBfr;
        uib.push();
        uib.clear();
        uib.strokeWeight(3);
        uib.noStroke();
        uib.noFill();
        if (this._opaque)
            uib.fill(OPAQUE);
        if (this.isOver)
            uib.stroke(HIGHLIGHT);
        uib.rect(0, 0, this._w, this._h);
        // Update pick buffer before restoring
        this._updatePanelControlPB();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /**
     * Update rectangular controls using full buffer i.e.
     * Button, Option, Checkbox, Textfield
     * @hidden
     */
    _updatePanelControlPB() {
        let pkb = this._pkBfr;
        pkb.clear();
        pkb.noStroke();
        pkb.noFill();
        let c = this._gui.pickColor(this);
        if (this._opaque)
            pkb.fill(c.r, c.g, c.b);
        pkb.rect(1, 1, this._w - 1, this._h - 1);
    }
    /** @hidden */
    _minControlSize() {
        return { w: this._w, h: this._h };
    }
    // Hide these methods from typeDoc
    /** @hidden */ parent(parent, rx, ry) { return this; }
    /** @hidden */ leaveParent() { return this; }
    /** @hidden */ tooltip(tiptext) { return this; }
    /** @hidden */ tipTextSize(gtts) { return this; }
    /** @hidden */ transparent() { return this; }
    /** @hidden */ opaque() { return this; }
}
// Object.assign(CvsPanel.prototype, NoParent);
// Object.assign(CvsPanel.prototype, NoTooltip);
//# sourceMappingURL=panel.js.map
/*
##############################################################################
 CvsPane
 This is the base class side panes
 ##############################################################################
 */
class CvsPane extends CvsBaseControl {
    /** @hidden */
    constructor(gui, id, x, y, w, h) {
        super(gui, id, x, y, w, h);
        /** @hidden */ this._background = 'rgba(0,0,0,0.6)';
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
        this._cornerRadius = 5;
        this._status = 'closed';
        this._timer = 0;
        this._z = PANE_Z;
    }
    /**
     * <p>Get the 'depth' the pane will intrude into the canvas when open.</p>
     * @returns the depth
     */
    depth() {
        return this._depth;
    }
    /**
     * <p>Sets the pane background color to use when open. There are 2 predined option ...</p>
     * <ol>
     * <li>'dark' semi transparent black background  : 'rgba(0,0,0,0.6)'</li>
     * <li>'light' semi transparent white background  : 'rgba(255,255,255,0.6)'</li>
     * </ol>
     * <p>Alternatively the user can provide any valid CSS color specification but if
     * invalid the results are unpredicatable and likely to cause the sketch to fail.</p>
     *
     * @param rgba 'light', 'dark' or valid CSS color specification
     * @returns this control
     */
    background(rgba) {
        switch (rgba) {
            case 'dark':
                this._background = 'rgba(0,0,0,0.6)';
                break;
            case 'light':
                this._background = 'rgba(255,255,255,0.6)';
                break;
            default:
                this._background = rgba;
        }
        return this;
    }
    /**
     * <p>Close this pane</p>
     * @returns this control
     */
    close() {
        switch (this._status) {
            case "opening": // Stop existing timer
                clearInterval(this._timer);
            case "open": // now add closing timer
                this._timer = setInterval(() => { this._closing(); }, CvsPane._dI);
                this._status = 'closing';
                this.action({ source: this, p5Event: undefined, state: 'closed' });
                break;
        }
        return this;
    }
    /** true if the pane is closed else false.*/
    get isClosed() { return this._status == 'closed'; }
    /** true if the pane is closing else false.*/
    get isClosing() { return this._status == 'closing'; }
    /**
     * <p>Close this pane</p>
     * @returns this control
     */
    open() {
        switch (this._status) {
            case "closing": // Stop existing timer
                clearInterval(this._timer);
            case "closed": // now add opening timer
                this._gui._closePanes();
                this._timer = setInterval(() => { this._opening(); }, CvsPane._dI);
                this._status = 'opening';
                this.action({ source: this, p5Event: undefined, state: 'open' });
                break;
        }
    }
    /** true if the pane is open else false.*/
    get isOpen() { return this._status == 'open'; }
    /** true if the pane is opening else false.*/
    get isOpening() { return this._status == 'opening'; }
    /** @hidden */
    _tabAction(ta) {
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
    _draw(uib, pkb) {
        uib.push();
        uib.translate(this._x, this._y);
        pkb.push();
        pkb.drawingContext.setTransform(uib.drawingContext.getTransform());
        if (this._visible && this._tabstate != 'closed') {
            uib.noStroke();
            uib.fill(this._background);
            uib.rect(0, 0, this._w, this._h);
            pkb.noStroke();
            pkb.fill('white');
            pkb.rect(0, 0, this._w, this._h);
            for (let c of this._children)
                if (c._visible)
                    c._draw(uib, pkb);
        }
        pkb.pop();
        uib.pop();
    }
    /**
     * <p>Sets the current text.</p>
     * <p>Processing constants are used to define the alignment.</p>
     * @param t the text toset
     * @param align LEFT, CENTER or RIGHT
     * @returns this control
     */
    text(t, align) {
        this.tab().text(t, align);
        return this;
    }
    /**
     * <p>Removes the text from the pane tab.</p>
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
    icon(i, align) {
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
     * @param ts the text size to use
     * @returns this control
     */
    textSize(ts) {
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
    shrink(dim) {
        return this.tab().shrink();
    }
    /**
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
    _minControlSize() {
        return { w: this._w, h: this._h };
    }
    // Hide these methods from typeDoc
    /** @hidden */ orient(dir) { return this; }
    /** @hidden */ parent(parent, rx, ry) { return this; }
    /** @hidden */ leaveParent() { return this; }
    /** @hidden */ transparent() { return this; }
    /** @hidden */ opaque() { return this; }
    /** @hidden */ tooltip(tiptext) { return this; }
    /** @hidden */ tipTextSize(gtts) { return this; }
}
// Deltas used in controlling opening and closing speeds
/** @hidden */ CvsPane._dI = 50; // Interval time (20)
/** @hidden */ CvsPane._dC = 60; // Close speed px/sec :: was (40)
/** @hidden */ CvsPane._dO = 40; // Open speed px/sec :: was (20)
/** @hidden */ CvsPane._wExtra = 20;
/** @hidden */ CvsPane._tabID = 1;
// Object.assign(CvsPane.prototype, NoOrient);
// Object.assign(CvsPane.prototype, NoParent);
// Object.assign(CvsPane.prototype, FixedBackground);
// Object.assign(CvsPane.prototype, NoTooltip);
/** @hidden */
class CvsPaneNorth extends CvsPane {
    constructor(gui, id, depth) {
        super(gui, id, 0, -depth, gui.canvasWidth(), depth);
        this._depth = depth;
        this._status = 'closed'; // closing opening open
        // Make the tab button 
        let tab = this._tab = this._gui.button('Tab ' + CvsPane._tabID++);
        tab.text(tab.id).setAction(this._tabAction);
        let s = tab._minControlSize();
        tab._w = s.w + CvsPane._wExtra;
        tab._c = [0, 0, this._cornerRadius, this._cornerRadius];
        this.addChild(tab);
        gui._panesNorth.push(this);
        this._gui.validateTabsNorth();
    }
    _opening() {
        let py = this._y + CvsPane._dO;
        if (py > 0) { // See if open
            py = 0;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._y = py;
    }
    _closing() {
        let py = this._y - CvsPane._dC;
        if (py < -this._depth) { // See if closed
            py = -this._depth;
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
    constructor(gui, id, depth) {
        super(gui, id, 0, gui.canvasHeight(), gui.canvasWidth(), depth);
        this._depth = depth;
        this._status = 'closed'; // closing opening open
        // Make the tab button 
        let tab = this._tab = this._gui.button('Tab ' + CvsPane._tabID++);
        tab.text(tab.id).setAction(this._tabAction);
        let s = tab._minControlSize();
        tab._w = s.w + CvsPane._wExtra;
        tab._c = [this._cornerRadius, this._cornerRadius, 0, 0];
        this.addChild(tab);
        // Add this pane control to those on East side
        this._gui._panesSouth.push(this);
        this._gui.validateTabsSouth();
    }
    _opening() {
        let py = this._y - CvsPane._dO;
        if (py < this._gui.canvasHeight() - this._depth) { // See if open
            py = this._gui.canvasHeight() - this._depth;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._y = py;
    }
    _closing() {
        let py = this._y + CvsPane._dC;
        if (py > this._gui.canvasHeight()) { // See if closed
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
    constructor(gui, id, depth) {
        super(gui, id, gui.canvasWidth(), 0, depth, gui.canvasHeight());
        this._depth = depth;
        this._status = 'closed'; // closing opening open
        // Make the tab button 
        let tab = this._tab = this._gui.button('Tab ' + CvsPane._tabID++);
        tab.text(tab.id)
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
    _opening() {
        let px = this._x - CvsPane._dO;
        if (px < this._gui.canvasWidth() - this._depth) { // See if open
            px = this._gui.canvasWidth() - this._depth;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._x = px;
    }
    _closing() {
        let px = this._x + CvsPane._dC;
        if (px > this._gui.canvasWidth()) { // See if closed
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
    constructor(gui, name, depth) {
        super(gui, name, -depth, 0, depth, gui.canvasHeight());
        this._depth = depth;
        this._status = 'closed'; // closing opening open
        // Make the tab button 
        let tab = this._tab = this._gui.button('Tab ' + CvsPane._tabID++);
        tab.text(tab.id)
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
    _opening() {
        let px = this._x + CvsPane._dO;
        if (px > 0) { // See if open
            px = 0;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._x = px;
    }
    _closing() {
        let px = this._x - CvsPane._dC;
        if (px < -this._depth) { // See if closed
            px = -this._depth;
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
//# sourceMappingURL=panes.js.map
/**
 * <p>This class represents a rectangular grid layout of cells that can be
 * used to specify the position and size of canvasGUI controls. </p>
 * <p>The grid layout enables the user to</p>
 * <ul>
 * <li>Define the overall size and position of the grid in pixels.</li>
 * <li>Define the number and relative width of the columns.</li>
 * <li>Define the number and relative height of the rows.</li>
 * <li>Position controls within the grid</li>
 * <li>Allow controls to span multiple columns and/or rows</li>
 * </ul>
 * <p>The methds <code>cols</code>, <code>rows</code> and <code>cells</code>
 * are used to set the number and/or the relative cell size within the grid
 * area. Passing integers to these methods will create cells of equal widths
 * and equal
 * heights.</p>
 * <p>To have columns of different widths or rows with different heights then
 * the parameter must be an array of numbers, the array length represents the
 * number of cells and the array values represent their relative sizes.</p>
 * <p>An example will make this clearer, consider the following code</p>
 * <p><code>grid.cols([10, 24, 16]).rows(4); </code><br>
 * <code>grid.size([10, 24, 16], 4); </code></p>
 * <p>Both lines perform the same action by specifying a grid of 3 variable
 * width columns and 4 equal height rows. The row height in pixels will be
 * the 0.25 x the grid area height.</p>
 * <p>To caluclate the column widths divide each array element by the sum of
 * all the array values. Calculating and dividing by the sum (50) creates. If
 * we do that the array elements becomes <code>[0.2, 0.48, 0.32]</code> and
 * to find the column pixel widths, simply multiply these values by grid area
 * width.</p>
 */
class GridLayout {
    /**
     * <p>Instantiates a grid layout for a given pixel position and size in
     * the display area. All parameters values are rounded to the nearest
     * integer.</p>
     *
     * @param x left edge position
     * @param y top edge position
     * @param w grid width
     * @param h grid height
     * @hidden
     */
    constructor(x, y, w, h) {
        /** @hidden */ this._x = 0;
        /** @hidden */ this._y = 0;
        /** @hidden */ this._w = 0;
        /** @hidden */ this._h = 0;
        /** @hidden */ this._ix = 2;
        /** @hidden */ this._iy = 2;
        this._x = Math.round(x);
        this._y = Math.round(y);
        this._w = Math.round(w);
        this._h = Math.round(h);
        this._ix = 2;
        this._iy = 2;
        this._cx = [0, 1];
        this._cy = [0, 1];
    }
    /** Get the left position of the grid */
    get x() { return this._x; }
    /** Get the top edge position of the grid */
    get y() { return this._y; }
    /** Get the grid's width in pixels */
    get w() { return this._w; }
    /** Get the grid's height in pixels */
    get h() { return this._h; }
    /** the number of columns in the grid */
    get nbrCols() { return this._cx.length - 1; }
    /** the number of rows in the grid */
    get nbrRows() { return this._cy.length - 1; }
    /**
     * Internal pixel boundary values for the columns.
     * (relative to top-left position of the grid)
     */
    get intPxlCols() { return this._cx.map(v => Math.round(v * this._w)); }
    /**
     * External (display) pixel boundary values for the columns.
     * (includes top-left position of the grid)
     */
    get extPxlCols() { return this._cx.map(v => this._x + Math.round(v * this._w)); }
    /** Normalised internal boundary values for the columns. */
    get normCols() { return [...this._cx]; }
    /**
     * Internal pixel boundary values for the rows.
     * (relative to top-left position of the grid)
     */
    get intPxlRows() { return this._cy.map(v => Math.round(v * this._h)); }
    /**
     * External (display) pixel boundary values for the rows.
     * (includes top-left position of the grid)
     */
    get extPxlRows() { return this._cy.map(v => this._y + Math.round(v * this._h)); }
    /** Normalised internal boundary values for the rows. */
    get normRows() { return [...this._cy]; }
    /**
     * Reposition the grid
     * @param x left edge position to use
     * @param y top edge position to use
     * @returns this grid
     */
    xy(x, y) {
        this._x = Math.round(x);
        this._y = Math.round(y);
        return this;
    }
    /**
     * Resize the grid
     * @param w new grid width
     * @param h new grid height
     * @returns this grid
     */
    wh(w, h) {
        this._w = Math.round(w);
        this._h = Math.round(h);
        return this;
    }
    /**
     * <p>Set the number and relative widths of the horizontal cells.</p>
     *
     * @param n number or an array containing relative widths
     * @returns this grid
     */
    cols(n) {
        let values = this._makeNormArray(n);
        if (values.length > 0)
            this._cx = values;
        return this;
    }
    /**
     * <p>Set the number and relative heights of the vertical cells.</p>
     *
     * @param n number or an array containing relative heights
     * @returns this grid
     */
    rows(n) {
        let values = this._makeNormArray(n);
        if (values.length > 0)
            this._cy = values;
        return this;
    }
    /**
     * <p>Set the number and relative sizes of the cells in both horizontal
     * and vertical dimensions.</p>
     *
     * @param nc number or an array containing relative widths
     * @param nr number or an array containing relative height
     * @returns this grid
     */
    size(nc, nr) {
        this.cols(nc);
        this.rows(nr);
        return this;
    }
    /**
     * <p>Get the position and size for the control that fits the specified
     * cells taking into account the insets which provide a clear border
     * between the control and the cell boundary.</p>
     * <p>The top-left cell number is [0, 0]</p>
     * @param px horizontal cell number
     * @param py vertical cell number
     * @param pw number of horizontal cells to span
     * @param ph number of vertical cells to span
     * @returns the array [x, y, w, h]
     */
    cell(px, py, pw = 1, ph = 1) {
        return this._calcRect(px, py, pw, ph, this._ix, this._iy);
    }
    /**
     * <p>Get the position and size for the specified cells ignoring insets.
     * This can be used to define rectangles that surround groups of
     * controls.<p>
     * <p>The top-left cell number is [0, 0]</p>
     * @param px horizontal cell number
     * @param py vertical cell number
     * @param pw number of hrizontal cells to span
     * @param ph number of vertical cells to span
     * @returns the array [x, y, w, h]
     */
    border(px, py, pw = 1, ph = 1) {
        return this._calcRect(px, py, pw, ph);
    }
    /**
     * <p>The gap (pixels) between the cell border and the control.</p>
     * @param hinset horizontal inset
     * @param vinset vertical inset
     * @returns this grid
     */
    insets(hinset = 2, vinset = 2) {
        this._ix = Math.round(hinset);
        this._iy = Math.round(vinset);
        return this;
    }
    /** @hidden */
    _calcRect(px, py, pw, ph, insetX = 0, insetY = 0) {
        [px, py, pw, ph] = this._validateCellPositions(px, py, pw, ph);
        let x = Math.round(this._cx[px] * this._w + this._x + insetX);
        let w = Math.round((this._cx[px + pw] - this._cx[px]) * this._w - 2 * insetX);
        let y = Math.round(this._cy[py] * this._h + this._y + insetY);
        let h = Math.round((this._cy[py + ph] - this._cy[py]) * this._h - 2 * insetY);
        return [x, y, w, h];
    }
    /** @hidden */
    _validateCellPositions(px, py, pw = 1, ph = 1) {
        function constrain(v, n0, n1) {
            return v < n0 ? n0 : v > n1 ? n1 : v;
        }
        px = constrain(px, 0, this._cx.length - 2);
        py = constrain(py, 0, this._cy.length - 2);
        pw = constrain(pw, 1, this._cx.length - px - 1);
        ph = constrain(ph, 1, this._cy.length - py - 1);
        return [px, py, pw, ph];
    }
    /** @hidden */
    _makeNormArray(n) {
        let size = [], pos = [0];
        if (Array.isArray(n)) {
            if (n.length > 0) {
                let sum = 0;
                n.forEach(v => sum += v);
                n.forEach(v => size.push(v / sum));
            }
        }
        else {
            for (let i = 0; i < n; i++)
                size.push(1 / n);
        }
        let sum = 0;
        size.forEach(v => pos.push((sum += v)));
        return pos;
    }
}
//# sourceMappingURL=grid.js.map
