const CANVAS_GUI_VERSION = '!!VERSION!!';
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
GUI.VERSION = '!!VERSION!!';
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