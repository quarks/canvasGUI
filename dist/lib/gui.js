 /**
 * @preserve canvasGUI    (c) Peter Lager  2025
 * @license MIT
 * @version 1.1.1
 */
const CANVAS_GUI_VERSION = '1.1.1';
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
    /**
     * Create a GUI object to create and manage the GUI controls for
     * an HTML canvas.
     *
     * @hidden
     * @param p5c the renderer
     * @param p the sketch instance
     */
    constructor(p5c, p = p5.instance) {
        /** @hidden */ this._touchEventsEnabled = false; // 0.9.5
        /** @hidden */ this._mouseEventsEnabled = false; // 0.9.4
        /** @hidden */ this._keyEventsEnabled = false;
        /** @hidden */ this._eventsAllowed = true;
        /** @hidden */ this._visible = true;
        /** @hidden */ this._enabled = true;
        this._renderer = p5c;
        this._canvas = p5c.canvas;
        this._target = document.getElementById(p5c.canvas.id); // for keyboard events
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
        // Camera method depends on major version of p5js since 1.1.1
        this._getCamera = Number(p.VERSION.split('.')[0]) == 1
            ? function () { return this._renderer._curCamera; } // V1
            : function () { return this._renderer.states.curCamera; }; // V2
    }
    // ##################################################################
    // ######     Factory methods to create controls and layouts  #######
    /**
    * Create a slider control
    * @param name unique name for this control
    * @param x left-hand pixel position
    * @param y top pixel position
    * @param w width
    * @param h height
    * @returns slider control
    */
    slider(name, x, y, w, h) {
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
    ranger(name, x, y, w, h) {
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
    button(name, x, y, w, h) {
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
    textfield(name, x, y, w, h) {
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
    checkbox(name, x, y, w, h) {
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
    option(name, x, y, w, h) {
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
    label(name, x, y, w, h) {
        return this.addControl(new CvsLabel(this, name, x, y, w, h));
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
    viewer(name, x, y, w, h) {
        return this.addControl(new CvsViewer(this, name, x, y, w, h));
    }
    /**
    * Create a joystick
    * @param name unique name for this control
    * @param x left-hand pixel position
    * @param y top pixel position
    * @param w width
    * @param h height
    * @returns a joystick control
    */
    joystick(name, x, y, w, h) {
        return this.addControl(new CvsJoystick(this, name, x, y, w, h));
    }
    /**
    * Create a joystick
    * @param name unique name for this control
    * @param x left-hand pixel position
    * @param y top pixel position
    * @param w width
    * @param h height
    * @returns a joystick control
    */
    knob(name, x, y, w, h) {
        return this.addControl(new CvsKnob(this, name, x, y, w, h));
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
    __scroller(name, x, y, w, h) {
        return this.addControl(new CvsScroller(this, name, x, y, w, h));
    }
    /**
     * @hidden
     * @param name auto generated unique name from parent control
     * @returns tooltip control
     */
    __tooltip(name) {
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
    pane(name, location, depth) {
        let ctrl;
        switch (location) {
            case 'north':
                ctrl = new CvsPaneNorth(this, name, depth);
                break;
            case 'south':
                ctrl = new CvsPaneSouth(this, name, depth);
                break;
            case 'west':
                ctrl = new CvsPaneWest(this, name, depth);
                break;
            case 'east':
            default: ctrl = new CvsPaneEast(this, name, depth);
        }
        return this.addControl(ctrl);
    }
    /**
     * Get a grid layout for a given pixel position and size in the display area.
     * Initially the grid repreents a single cell but the number and size of
     * horizontal and vertical cells should be set before creating the controls.
     * @since 1.1.0
     * @param x left edge position
     * @param y top edge position
     * @param w grid width
     * @param h grid height
     * @returns the grid layout
     */
    grid(x, y, w, h) {
        return new GridLayout(x, y, w, h);
    }
    // ###########        End of factory methods             ############
    // ##################################################################
    /**
     * Returns the name of this GUI. If the GUI is not named then
     * the returned value is undefined.
     *
     * @returns the name of this gui or undefined
     */
    name() {
        return this._name;
    }
    /**
     * Render any controls for this gui
     * @returns this gui
     * @since 0.9.3
     */
    show() {
        this._visible = true;
        return this;
    }
    /**
     * Do not render any controls for this gui
     * @returns this gui
     * @since 0.9.3
     */
    hide() {
        this._visible = false;
        return this;
    }
    /**
     * @returns true if gui rendering is allowed
     * @returns this gui
     * @since 0.9.3
     */
    isVisible() {
        return this._visible;
    }
    /**
     * Enable mouse/key event handling for this gui
     * @returns this gui
     * @since 0.9.3
     */
    enable() {
        this._enabled = true;
        return this;
    }
    /**
     * Disable mouse/key event handling for this gui
     * @returns this gui
     * @since 0.9.3
     */
    disable() {
        this._enabled = false;
        return this;
    }
    /**
     * @returns true if this gui can respond to mouse/key events
     * @since 0.9.3
     */
    isEnabled() {
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
    _addFocusHandlers() {
        let canvas = this._canvas;
        canvas.addEventListener('focusout', (e) => { this._handleFocusEvents(e); });
        canvas.addEventListener('focusin', (e) => { this._handleFocusEvents(e); });
    }
    _addMouseEventHandlers() {
        if (!this._mouseEventsEnabled) {
            let canvas = this._canvas;
            // Add mouse events
            canvas.addEventListener('mousemove', (e) => { this._handleMouseEvents(e); });
            canvas.addEventListener('mousedown', (e) => { this._handleMouseEvents(e); });
            canvas.addEventListener('mouseup', (e) => { this._handleMouseEvents(e); });
            canvas.addEventListener('wheel', (e) => { this._handleMouseEvents(e); });
            // Leave and enter canvas
            canvas.addEventListener('mouseout', (e) => { this._handleMouseEvents(e); });
            canvas.addEventListener('mouseenter', (e) => { this._handleMouseEvents(e); });
            this._mouseEventsEnabled = true;
        }
    }
    _addKeyEventHandlers() {
        if (!this._keyEventsEnabled) {
            this._target.setAttribute('tabindex', '0');
            this._target.focus();
            this._target.addEventListener('keydown', (e) => { this._handleKeyEvents(e); return false; });
            this._target.addEventListener('keyup', (e) => { this._handleKeyEvents(e); return false; });
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
        // Find the currently active control and pass the event to it
        if (this._eventsAllowed && this._enabled && this.isVisible()) {
            let activeControl;
            for (let c of this._ctrls) {
                activeControl = undefined;
                if (c.isActive()) {
                    activeControl = c;
                    c._handleTouch(e);
                    break;
                }
            }
            // If no active control then pass the event to each enabled control in turn
            if (activeControl == undefined) {
                for (let c of this._ctrls)
                    if (c.isEnabled() && c.isVisible()) // 0.9.3 introduces visibility condition
                        c._handleTouch(e);
            }
        }
    }
    _handleFocusEvents(e) {
        switch (e.type) {
            case 'focusout':
                // Deactivate any textfields(s) - stop the flashing cursor
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
    _handleKeyEvents(e) {
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
    _handleMouseEvents(e) {
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
                    if (c.isEnabled() && c.isVisible()) // 0.9.3 introduces visibility condition
                        c._handleMouse(e);
            }
        }
        return false;
    }
    // Select draw method based on P2D or WEBGL renderer
    _selectDrawMethod() {
        this._is3D = this._renderer.GL != undefined && this._renderer.GL != null;
        this.draw = this._is3D ? this._drawControlsWEBGL : this._drawControlsP2D;
    }
    // -----------------------------------------------------------------------
    /**
     * <p>Get the control given it's unique name.</p>
     * @param name control's unique name for this control
     * @returns  get the associated control
    */
    $(name) {
        return (typeof name === "string") ? this._controls.get(name) : name;
    }
    /**
     * <p>Adds a child control to this one.</p>
     * @param control the child control to add
     * @returns the control just added
     */
    addControl(control) {
        console.assert(!this._controls.has(control.name()), `Control '${control.name()}' already exists and will be replaced.`);
        this._controls.set(control.name(), control);
        // Now find render order
        this._ctrls = [...this._controls.values()];
        this._ctrls.sort((a, b) => { return a.z() - b.z(); });
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
    getOptionGroup(name) {
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
    textSize(gts) {
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
     * Replaces hideAll
     * @since 0.9.3
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
     * Replaces showAll
     * @since 0.9.3
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
    validateTabsWest() {
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
    validateTabsSouth() {
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
            console.error(`'${schemename}' is not a valid color scheme`);
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
        console.warn(`Unable to retrieve color scheme '${schemename}'`);
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
            this._getCamera().ortho(0, w, -h, 0, -d, d);
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
    /**
     * @hidden
     */
    static announce() {
        if (!GUI._announced) {
            console.log('================================================');
            console.log(`  canvasGUI (${CANVAS_GUI_VERSION})   \u00A9 2025 Peter Lager`);
            console.log('================================================');
            GUI._announced = true;
        }
    }
    /**
     * <p>Returns a GUI controller for a given canvas element.</p>
     * <p>If a GUI has already been created for this canvas it will be returned,
     * otherwise a new GUI will be created and returned</p>
     * <p>A canvas can have more than one GUI associated with it but in that case
     * each GUI must have a unique name.</p>
     *
     *
     * @param p5c the renderer - the display canvas
     * @param p the processing instance (required in Instance mode)
     * @returns a GUI controller
     */
    static get(p5c, p = p5.instance) {
        GUI.announce();
        if (GUI._guis.has(p5c))
            return GUI._guis.get(p5c);
        // Need to create a GUI for this canvas
        let gui = new GUI(p5c, p);
        GUI._guis.set(p5c, gui);
        return gui;
    }
    /**
     * <p>Returns a named GUI controller.</p>
     * <p>If an exisiting GUI has the same name it will be returned, otherwise
     * a new GUI will be created and returned</p>
     * <p>If the name parameter is not of type 'string' or an empty string then
     * the returned value is undefined.</p>
     *
     * @param name unique name for the GUI
     * @param p5c the renderer - the display canvas
     * @param p the processing instance (required in Instance mode)
     * @returns a GUI controller if valid name provided
     */
    static getNamed(name, p5c, p = p5.instance) {
        GUI.announce();
        if (typeof name === 'string' && name.length > 0) {
            if (GUI._guis.has(name))
                return GUI._guis.get(name);
            // Need to create a GUI for this canvas
            let gui = new GUI(p5c, p);
            gui._name = name;
            GUI._guis.set(name, gui);
            return gui;
        }
        return undefined;
    }
    /**
     * <p>Returns a previously created GUI controller for a given canvas
     * or name. </p>
     * @param key associated canvas or GUI name
     * @returns  a matching GUI controller or undefined if not found
     */
    static find(key) {
        return GUI._guis.get(key);
    }
}
// ##################################################################################
// ##################################################################################
// Class methods and attributes
// ##################################################################################
// ##################################################################################
GUI._guis = new Map();
GUI._announced = false;
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
    _renderP2D(p, w, h, buffer) {
        p.push();
        p.translate(0, w);
        p.rotate(1.5 * Math.PI);
        p.image(buffer, 0, 0);
        p.pop();
    }
    _renderWEBGL(p, w, h, buffer) {
        p.noStroke();
        p.textureMode(p.NORMAL);
        p.texture(buffer);
        p.beginShape(p.TRIANGLE_STRIP);
        p.vertex(0, 0, 0, 1, 0);
        p.vertex(0, w, 0, 0, 0);
        p.vertex(h, 0, 0, 1, 1);
        p.vertex(h, w, 0, 0, 1);
        p.endShape();
    }
    xy(x, y, w, h) {
        return [w - y, x, h, w];
    }
    wh(w, h) {
        return [h, w];
    }
}
class OrientSouth {
    _renderP2D(p, w, h, buffer) {
        p.push();
        p.translate(h, 0);
        p.rotate(Math.PI / 2);
        p.image(buffer, 0, 0);
        p.pop();
    }
    _renderWEBGL(p, w, h, buffer) {
        p.textureMode(p.NORMAL);
        p.texture(buffer);
        p.beginShape(p.TRIANGLE_STRIP);
        p.vertex(0, 0, 0, 0, 1);
        p.vertex(0, w, 0, 1, 1);
        p.vertex(h, 0, 0, 0, 0);
        p.vertex(h, w, 0, 1, 0);
        p.endShape();
    }
    xy(x, y, w, h) {
        return [y, h - x, h, w];
    }
    wh(w, h) {
        return [h, w];
    }
}
class OrientEast {
    _renderP2D(p, w, h, buffer) {
        p.push();
        p.translate(0, 0);
        p.rotate(0);
        p.image(buffer, 0, 0);
        p.pop();
    }
    _renderWEBGL(p, w, h, buffer) {
        p.textureMode(p.NORMAL);
        p.texture(buffer);
        p.beginShape(p.TRIANGLE_STRIP);
        p.vertex(0, 0, 0, 0, 0);
        p.vertex(0, h, 0, 0, 1);
        p.vertex(w, 0, 0, 1, 0);
        p.vertex(w, h, 0, 1, 1);
        p.endShape();
    }
    xy(x, y, w, h) {
        return [x, y, w, h];
    }
    wh(w, h) {
        // return { 'w': w, 'h': h };
        return [w, h];
    }
}
class OrientWest {
    _renderP2D(p, w, h, buffer) {
        p.push();
        p.translate(w, h);
        p.rotate(Math.PI);
        p.image(buffer, 0, 0);
        p.pop();
    }
    _renderWEBGL(p, w, h, buffer) {
        p.textureMode(p.NORMAL);
        p.texture(buffer);
        p.beginShape(p.TRIANGLE_STRIP);
        p.vertex(0, 0, 0, 1, 1);
        p.vertex(0, h, 0, 1, 0);
        p.vertex(w, 0, 0, 0, 1);
        p.vertex(w, h, 0, 0, 0);
        p.endShape();
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
 This is the base class for controls and panes that don't require a buffer
 ##############################################################################
 */
/**
 * <p>Base class for all controls</p>
 * <p>It provides most of the functionality for the controls</p>
 */
class CvsBaseControl {
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
    constructor(gui, name, x, y, w, h) {
        /** @hidden */ this._children = [];
        /** @hidden */ this._visible = true;
        /** @hidden */ this._enabled = true;
        /** @hidden */ this._Z = 0;
        /** @hidden */ this._x = 0;
        /** @hidden */ this._y = 0;
        /** @hidden */ this._w = 0;
        /** @hidden */ this._h = 0;
        /** @hidden */ this._over = 0;
        /** @hidden */ this._pover = 0;
        /** @hidden */ this._clickAllowed = false;
        /** @hidden */ this._active = false;
        /** @hidden */ this._opaque = true;
        /** @hidden */ this._bufferInvalid = true;
        /** <p>The event handler for this control. Although it is permitted to set
         * this property directly it is recommended that the <code>setAction(...)</code>
         * method is used to define the event handler actions.</p>
         */
        this.action = function () { };
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
    ;
    /**
     *
     * @returns the unique identier for this control
     */
    name() {
        return this._name;
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
    parent(p, rx, ry) {
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
    addChild(c, rx, ry) {
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
        return this;
    }
    /**
     * <p>Remove this control from its parent</p>
     * @returns this control
     */
    leaveParent() {
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
    setAction(event_handler) {
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
     * A control becomes active when the mouse btton is pressed over it.
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
    enable(cascade) {
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
        this.invalidateBuffer();
        return this;
    }
    /**
     * If control has significant rounded corners then take them
     * into consideration
     * @since 0.9.4
     * @hidden
     */
    _whereOver(px, py, tol = 0) {
        const R = 5;
        if (px > 0 && px < this._w && py > 0 && py < this._h) {
            if (this._c[0] > R) { // top left
                let dx = px - this._c[0];
                let dy = py - this._c[0];
                let off = dx < 0 && dy < 0 && dx * dx + dy * dy > this._c[0] * this._c[0];
                if (off)
                    return 0;
            }
            if (this._c[1] > R) { // top right
                let dx = px - (this._w - this._c[1]);
                let dy = py - this._c[1];
                let off = dx > 0 && dy < 0 && dx * dx + dy * dy > this._c[1] * this._c[1];
                if (off)
                    return 0;
            }
            if (this._c[2] > R) { // bottom right
                let dx = px - (this._w - this._c[2]);
                let dy = py - (this._h - this._c[2]);
                let off = dx > 0 && dy > 0 && dx * dx + dy * dy > this._c[2] * this._c[2];
                if (off)
                    return 0;
            }
            if (this._c[3] > R) { // bottom left
                let dx = px - this._c[3];
                let dy = py - (this._h - this._c[3]);
                let off = dx < 0 && dy > 0 && dx * dx + dy * dy > this._c[3] * this._c[3];
                if (off)
                    return 0;
            }
            return 1;
        }
        return 0;
    }
    /** @hidden */
    _minControlSize() { return null; }
    /** @hidden */
    _updateControlVisual() { }
    /** @hidden */
    _handleMouse(e) { return true; }
    ;
    /** @hidden */
    _handleKey(e) { return true; }
    ;
    /** @hidden */
    _handleTouch(e) { }
    /** @hidden */
    _processEvent(e, ...info) { }
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
            if (c._visible)
                c._renderWEBGL();
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
            if (c._visible)
                c._renderP2D();
        p.pop();
    }
    /** @hidden */
    _disable_hightlight(b, cs, x, y, w, h) {
        b.fill(cs['T_5']);
        b.noStroke();
        b.rect(x, y, w, h, this._c[0], this._c[1], this._c[2], this._c[3]);
    }
    /** @hidden */
    _eq(a, b) {
        return Math.abs(a - b) < 0.001;
    }
    /** @hidden */
    _neq(a, b) {
        return Math.abs(a - b) >= 0.001;
    }
    /** @hidden */
    z() {
        return this._Z;
    }
    /** @hidden */
    x() {
        return this._x;
    }
    /** @hidden */
    y() {
        return this._y;
    }
    /** @hidden */
    w() {
        return this._w;
    }
    /** @hidden */
    h() {
        return this._h;
    }
    /** @hidden */
    over() {
        return this._over;
    }
    /** @hidden */
    pover() {
        return this._pover;
    }
    /** @hidden */
    orientation() {
        return this._orientation;
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
/**
 * Mixin for initialising mouse event data
 * @hidden
 */
const processMouse = {
    /** @hidden */
    _handleMouse(e) {
        let pos = this.getAbsXY();
        let [mx, my, w, h] = this._orientation.xy(this._p.mouseX - pos.x, this._p.mouseY - pos.y, this._w, this._h);
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip)
            this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx, my, w, h);
        return false;
    }
};
/**
 * Mixin for initialising touch event data
 * @hidden
 */
const processTouch = {
    /** @hidden */
    _handleTouch(e) {
        e.preventDefault();
        let pos = this.getAbsXY();
        const rect = this._gui._canvas.getBoundingClientRect();
        const t = e.changedTouches[0];
        let [mx, my, w, h] = this._orientation.xy(t.clientX - rect.left - pos.x, t.clientY - rect.top - pos.y, this._w, this._h);
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my, 5); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip)
            this._tooltip._updateState(this, this._pover, this._over);
        this._processEvent(e, mx, my, w, h);
    }
};
//# sourceMappingURL=basecontrol.js.map
/*
##############################################################################
 CvsBufferedControl
 This is the base class for all visual controls that require a graphic buffer
 ##############################################################################
 */
/**
 * <p>This is the base class for all visual controls that require a graphic buffer.</p>
 */
class CvsBufferedControl extends CvsBaseControl {
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
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h);
        this._buffer = this._p.createGraphics(this._w, this._h);
        this._tooltip = undefined;
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
    tooltip(tiptext, duration = 1600) {
        let tt = this._gui.__tooltip(this._name + '.tooltip')
            .text(tiptext)
            .showTime(duration)
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
     *
     * @param value scale value to test
     * @returns true if the value lies within the slider's limits else false
     */
    isValid(value) {
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
    _whereOver(px, py, tol = 8) {
        px -= 10; // Adjust mouse to start of track
        let ty = this._buffer.height / 2;
        let tx = this._t01 * (this._buffer.width - 20);
        return (Math.abs(tx - px) <= tol && Math.abs(ty - py) <= tol)
            ? 1 : 0;
    }
    /** @hidden */
    _processEvent(e, ...info) {
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
    _nearestTickT(p01) {
        let nbrTicks = this._minorTicks > 0
            ? this._minorTicks * this._majorTicks : this._majorTicks;
        return (nbrTicks > 0) ? Math.round(p01 * nbrTicks) / nbrTicks : p01;
    }
    /** @hidden */
    _updateControlVisual() {
        let b = this._buffer;
        let cs = this._scheme || this._gui.scheme();
        let tw = b.width - 20, trackW = 8, thumbSize = 12, majorT = 10, minorT = 7;
        const OPAQUE = cs['C_3'];
        const TICKS = cs['G_7'];
        const UNUSED_TRACK = cs['G_3'];
        const USED_TRACK = cs['G_1'];
        const HIGHLIGHT = cs['C_9'];
        const THUMB = cs['C_6'];
        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke();
            b.fill(OPAQUE);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Now translate to track left edge - track centre
        b.translate(10, b.height / 2);
        // Now draw ticks
        b.stroke(TICKS);
        b.strokeWeight(1);
        let dT, n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            dT = tw / n;
            for (let i = 0; i <= n; i++) { // minor ticks
                let tx = i * dT;
                b.line(tx, -minorT, tx, minorT);
            }
        }
        n = this._majorTicks;
        if (n >= 2) {
            dT = tw / n;
            for (let i = 0; i <= n; i++) { // major ticks
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
        b.rect(0, -trackW / 2, tx, trackW, this._c[0], this._c[1], this._c[2], this._c[3]);
        // Draw thumb
        b.fill(THUMB);
        b.noStroke();
        if (this._active || this._over > 0) {
            b.strokeWeight(2);
            b.stroke(HIGHLIGHT);
        }
        b.rect(tx - thumbSize / 2, -thumbSize / 2, thumbSize, thumbSize, this._c[0], this._c[1], this._c[2], this._c[3]);
        if (!this._enabled)
            this._disable_hightlight(b, cs, 0, -this._h / 2, this._w - 20, this._h);
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
Object.assign(CvsSlider.prototype, processMouse, processTouch);
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
     * <p>Sets or gets the low and high values for this control. If both parameters
     * and within the rangers limits then they are used to set the low and high
     * values of the ranger and move the thumbs to the correct postion.</p>
     * <p>If one or both parameters are invalid then they are ignored and the method
     * returns the current range low and high values.</p>
     * @param v0 low value
     * @param v1 high value
     * @returns this control or the low/high values
     */
    range(v0, v1) {
        // if (!v0 || !v1)
        //   return { low: this._t2v(this._t[0]), high: this._t2v(this._t[1]) };
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
    value(v) {
        console.warn('Ranger controls require 2 values - use range(v0, v1) instead');
        return undefined;
    }
    /** @hidden */
    _whereOver(px, py, tol = 8) {
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
        return 0;
    }
    /** @hidden */
    _processEvent(e, ...info) {
        let mx = info[0];
        this._tIdx = this._active ? this._tIdx : this._over - 1;
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (this._over > 0) {
                    this._active = true;
                    this._tIdx = this._over - 1; // Which thumb is the mouse over
                    this.invalidateBuffer();
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this._active) {
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
    _updateControlVisual() {
        let b = this._buffer;
        let cs = this._scheme || this._gui.scheme();
        let tw = b.width - 20;
        let trackW = 8, thumbSize = 12, majorT = 10, minorT = 7;
        const OPAQUE = cs['C_3'];
        const TICKS = cs['G_7'];
        const UNUSED_TRACK = cs['G_3'];
        const USED_TRACK = cs['G_1'];
        const HIGHLIGHT = cs['C_9'];
        const THUMB = cs['C_6'];
        b.push();
        b.clear();
        // Background
        if (this._opaque) {
            b.noStroke();
            b.fill(OPAQUE);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Now translate to track left edge - track centre
        b.translate(10, b.height / 2);
        // Now draw ticks
        b.stroke(TICKS);
        b.strokeWeight(1);
        let dT, n = this._majorTicks * this._minorTicks;
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
            for (let i = 0; i <= n; i++) { // major ticks
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
        b.rect(tx0, -trackW / 2, tx1 - tx0, trackW, this._c[0], this._c[1], this._c[2], this._c[3]);
        // Draw thumb
        for (let tnbr = 0; tnbr < 2; tnbr++) {
            b.fill(THUMB);
            b.noStroke();
            if ((this._active || this._over > 0) && tnbr == this._tIdx) {
                b.strokeWeight(2);
                b.stroke(HIGHLIGHT);
            }
            b.rect(this._t[tnbr] * tw - thumbSize / 2, -thumbSize / 2, thumbSize, thumbSize, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (!this._enabled)
            this._disable_hightlight(b, cs, 0, -this._h / 2, this._w - 20, this._h);
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }
}
Object.assign(CvsRanger.prototype, processMouse, processTouch);
//# sourceMappingURL=ranger.js.map
/**
 * </p>The base class for any control that displays text as part of its
 * visual interface</p>
 *
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
        this.invalidateBuffer();
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
     * <p>Renoves any text that the control might use ti  display itself.</p>
     *
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
 *
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
     * @param i the icon to use for this control
     * @param align LEFT or RIGHT
     * @returns this control or the current icon
     */
    icon(i, align) {
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
    iconAlign(align) {
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
            if (!b)
                this._validateBuffer();
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
 * <p>Simple label with text and / or icon</p>
 */
class CvsLabel extends CvsTextIcon {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 60, h || 16);
    }
    /** @hidden */
    _updateControlVisual() {
        let ts = this._textSize || this._gui.textSize();
        let cs = this._scheme || this._gui.scheme();
        let b = this._buffer;
        let p = this._p;
        let icon = this._icon;
        let iconAlign = this._iconAlign;
        let textAlign = this._textAlign;
        let lines = this._lines;
        let gap = this._gap;
        const OPAQUE = cs['C_3'];
        const FORE = cs['C_8'];
        b.push();
        b.clear();
        // Background
        if (this._opaque) {
            b.noStroke();
            b.fill(OPAQUE);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (icon) {
            let px = 0, py;
            switch (iconAlign) {
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
            b.image(this._icon, px, py);
        }
        if (lines.length > 0) {
            b.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            if (icon && iconAlign == p.LEFT)
                x0 += icon.width;
            if (icon && iconAlign == p.RIGHT)
                x1 -= icon.width;
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = b.textAscent() + (this._h - th) / 2;
            b.fill(FORE);
            for (let line of lines) {
                switch (textAlign) {
                    case p.LEFT:
                        sx = x0;
                        break;
                    case p.CENTER:
                        sx = x0 + (tw - b.textWidth(line)) / 2;
                        break;
                    case p.RIGHT:
                        sx = x1 - b.textWidth(line) - gap;
                        break;
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
        let b = this._buffer;
        let icon = this._icon;
        let iconAlign = this._iconAlign;
        let textAlign = this._textAlign;
        let lines = this._lines;
        let gap = this._gap;
        const BACK = cs['C_3'];
        const FORE = cs['C_8'];
        const HIGHLIGHT = cs['C_9'];
        b.push();
        b.clear();
        // Backkground
        if (this._opaque) {
            b.noStroke();
            b.fill(BACK);
            b.rect(1, 1, this._w - 1, this._h - 1, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (icon) {
            let px = 0, py;
            switch (iconAlign) {
                case this._p.LEFT:
                    px = gap;
                    break;
                case this._p.RIGHT:
                    px = this._w - icon.width - gap;
                    break;
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
            if (icon && iconAlign == this._p.LEFT)
                x0 += icon.width;
            if (icon && iconAlign == this._p.RIGHT)
                x1 -= icon.width;
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = b.textAscent() + (this._h - th) / 2;
            b.fill(FORE);
            for (let line of lines) {
                switch (textAlign) {
                    case this._p.LEFT:
                        sx = x0;
                        break;
                    case this._p.CENTER:
                        sx = x0 + (tw - b.textWidth(line)) / 2;
                        break;
                    case this._p.RIGHT:
                        sx = x1 - b.textWidth(line) - gap;
                        break;
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
            b.rect(1, 1, this._w - 2, this._h - 2, this._c[0], this._c[1], this._c[2], this._c[3]);
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
    _processEvent(e, ...info) {
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
Object.assign(CvsButton.prototype, processMouse, processTouch);
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
        this._showTime = 0;
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
    /**
     * <p>Set the time to display the tooltip
     * @param duration display time in ms
     * @returns this control
     */
    showTime(duration) {
        this._showTime = duration;
        return this;
    }
    /** @hidden */
    _updateState(owner, prevOver, currOver) {
        if (owner.isVisible() && prevOver != currOver)
            if (currOver > 0) {
                this.show();
                setTimeout(() => { this.hide(); }, this._showTime);
            }
    }
    // /** @hidden */
    // _validatePosition() {
    //     let p = this._parent;
    //     let pp = p.getAbsXY(), px = pp.x, py = pp.y;
    //     let pa = p.orientation().wh(p.w(), p.h()), ph = pa.h;
    //     // Start tip in default location
    //     this._x = 0, this._y = -this._h;
    //     if (py + this._y < 0)
    //         this._y += this._h + ph;
    //     if (px + this._x + this._w > this._gui.canvasWidth())
    //         this._x -= this._w - pa.w;
    // }
    /** @hidden */
    _validatePosition() {
        let p = this._parent;
        let { x: px, y: py } = p.getAbsXY();
        let [pw, ph] = p.orientation().wh(p.w(), p.h());
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
        let b = this._buffer;
        let lines = this._lines;
        let gap = this._gap;
        const BACK = cs['C_3'];
        const FORE = cs['C_9'];
        b.push();
        b.clear();
        // Backkground
        b.stroke(FORE);
        b.fill(BACK);
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
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 100, h || 20);
        /** @hidden */ this._value = 0.5;
        /** @hidden */ this._dvalue = 0.5;
        /** @hidden */ this._used = 0.1;
        /** @hidden */ this._s_value = 0.5;
        /** @hidden */ this._s_dvalue = 0.5;
        /** @hidden */ this._s_mx = 0.5;
        /** @hidden */ this._minV = this._used / 2;
        /** @hidden */ this._maxV = 1 - this._used / 2;
        /** @hidden */ this._BORDER = 10;
        /** @hidden */ this._THEIGHT = 8;
        /** @hidden */ this._THUMB_HEIGHT = 12;
        /** @hidden */ this._MIN_THUMB_WIDTH = 10;
        this._TLENGTH = this._w - 3 * this._BORDER;
        this._c = gui.corners();
        this._opaque = false;
    }
    update(v, u) {
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
            if (v < u2)
                dv = u2;
            else if (v > 1 - u2)
                dv = 1 - u2;
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
    _whereOver(px, py, tol = 20) {
        let tx = this._BORDER + this._dvalue * this._TLENGTH;
        let ty = this._h / 2;
        let thumbSizeX = Math.max(this._used * this._TLENGTH, this._MIN_THUMB_WIDTH);
        if (Math.abs(tx - px) <= thumbSizeX / 2 && Math.abs(ty - py) <= tol / 2) {
            return 1;
        }
        return 0;
    }
    /** @hidden */
    _processEvent(e, ...info) {
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
    _updateControlVisual() {
        let b = this._buffer;
        let cs = this._scheme || this._gui.scheme();
        let thumbSizeX = Math.max(this._used * this._TLENGTH, this._MIN_THUMB_WIDTH), thumbSizeY = this._THUMB_HEIGHT;
        let tx = this._dvalue * this._TLENGTH;
        const OPAQUE = cs['C_3'];
        const TICKS = cs['G_8'];
        const UNUSED_TRACK = cs['G_3'];
        const HIGHLIGHT = cs['C_9'];
        const THUMB = cs['C_5'];
        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke();
            b.fill(OPAQUE);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
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
        b.rect(tx - thumbSizeX / 2, -thumbSizeY / 2, thumbSizeX, thumbSizeY, this._c[0], this._c[1], this._c[2], this._c[3]);
        if (!this._enabled)
            this._disable_hightlight(b, cs, 0, -this._h / 2, this._w - 20, this._h);
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
Object.assign(CvsScroller.prototype, processMouse, processTouch);
//# sourceMappingURL=scroller.js.map
/**
 * <p>The option group manages a group of option buttons where only one can
 * be selected at any time.</p>
 * <p>The user should <i>not</i> create instances of this class because the library
 * will make them when needed.</p>
 */
class CvsOptionGroup {
    /** @hidden */
    constructor(name) {
        this._name = name;
        this._group = new Set();
    }
    /**
     * Add an option to this group
     * @hidden
     */
    add(option) {
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
 This class represents an option button (aka radio button). These are usually
 grouped together so that only one can be selected at a time.
 ##############################################################################
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
    group(optGroupName) {
        this._optGroup = this._gui.getOptionGroup(optGroupName);
        this._optGroup.add(this);
        return this;
    }
    /** @hidden */
    _processEvent(e, ...info) {
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
    _updateControlVisual() {
        let ts = this._textSize || this._gui.textSize();
        let cs = this._scheme || this._gui.scheme();
        let b = this._buffer;
        let p = this._p;
        let iconAlign = this._iconAlign;
        let isize = p.constrain(Number(ts) * 0.7, 12, 16);
        let textAlign = this._textAlign;
        let lines = this._lines;
        let gap = this._gap;
        const BACK = cs['C_3'];
        const FORE = cs['C_8'];
        const ICON_BG = cs['G_0'];
        const ICON_FG = cs['G_9'];
        const HIGHLIGHT = cs['C_9'];
        b.push();
        b.clear();
        // If opaque
        if (this._opaque) {
            b.noStroke();
            b.fill(BACK);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Start with circle
        b.push();
        let px = (iconAlign == p.RIGHT) ? this._w - gap - isize / 2 : gap + isize / 2;
        b.translate(px, b.height / 2);
        b.stroke(ICON_FG);
        b.fill(ICON_BG);
        b.strokeWeight(1.5);
        b.ellipse(0, 0, isize, isize);
        if (this._selected) {
            b.fill(ICON_FG);
            b.noStroke();
            b.ellipse(0, 0, isize / 2, isize / 2);
        }
        b.pop();
        if (lines.length > 0) {
            b.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            if (iconAlign == p.LEFT)
                x0 += isize + gap;
            if (iconAlign == p.RIGHT)
                x1 -= isize + gap;
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = b.textAscent() + (this._h - th) / 2;
            b.fill(FORE);
            for (let line of lines) {
                switch (textAlign) {
                    case p.LEFT:
                        sx = x0;
                        break;
                    case p.CENTER:
                        sx = x0 + (tw - b.textWidth(line)) / 2;
                        break;
                    case p.RIGHT:
                        sx = x1 - b.textWidth(line) - gap;
                        break;
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
            b.rect(1, 1, this._w - 2, this._h - 2, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (!this._enabled)
            this._disable_hightlight(b, cs, 0, 0, this._w, this._h);
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _minControlSize() {
        let b = this._buffer;
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
Object.assign(CvsOption.prototype, processMouse, processTouch);
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
    _processEvent(e, ...info) {
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
    _updateControlVisual() {
        let ts = this._textSize || this._gui.textSize();
        let cs = this._scheme || this._gui.scheme();
        let b = this._buffer;
        let iconAlign = this._iconAlign;
        let isize = this._p.constrain(Number(ts) * 0.7, 12, 16);
        let textAlign = this._textAlign;
        let lines = this._lines;
        let gap = this._gap;
        const BACK = cs['C_3'];
        const FORE = cs['C_8'];
        const ICON_BG = cs['G_0'];
        const ICON_FG = cs['G_9'];
        const HIGHLIGHT = cs['C_9'];
        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke();
            b.fill(BACK);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Start with box and tick
        b.push();
        let px = (iconAlign == this._p.RIGHT) ? this._w - gap - isize / 2 : gap + isize / 2;
        b.translate(px, b.height / 2);
        b.stroke(ICON_FG);
        b.fill(ICON_BG);
        b.strokeWeight(1.5);
        b.rect(-isize / 2, -isize / 2, isize, isize, 3);
        if (this._selected) {
            b.strokeWeight(2.5);
            b.line(-0.281 * isize, 0, -0.188 * isize, 0.313 * isize);
            b.line(0.270 * isize, -0.27 * isize, -0.188 * isize, 0.313 * isize);
        }
        b.pop();
        if (lines.length > 0) {
            b.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
            // Determine extent of text area
            if (iconAlign == this._p.LEFT)
                x0 += isize + gap;
            if (iconAlign == this._p.RIGHT)
                x1 -= isize + gap;
            let tw = x1 - x0;
            let th = this._tbox.h;
            let py = b.textAscent() + (this._h - th) / 2;
            b.fill(FORE);
            for (let line of lines) {
                switch (textAlign) {
                    case this._p.LEFT:
                        sx = x0;
                        break;
                    case this._p.CENTER:
                        sx = x0 + (tw - b.textWidth(line)) / 2;
                        break;
                    case this._p.RIGHT:
                        sx = x1 - b.textWidth(line) - gap;
                        break;
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
            b.rect(1, 1, this._w - 2, this._h - 2, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (!this._enabled)
            this._disable_hightlight(b, cs, 0, 0, this._w, this._h);
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _minControlSize() {
        let b = this._buffer;
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
Object.assign(CvsCheckbox.prototype, processMouse, processTouch);
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
        /** @hidden */ this._lw = 0;
        /** @hidden */ this._lh = 0;
        /** @hidden */ this._wcx = 0;
        /** @hidden */ this._wcy = 0;
        /** @hidden */ this._wscale = 1;
        /** @hidden */ this._usedX = 0;
        /** @hidden */ this._usedY = 0;
        /** @hidden */ this._o = { valid: false };
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
    scaler(v, l0, l1) {
        if (Number.isFinite(v) && Number.isFinite(l0) && Number.isFinite(l1)) {
            let low = Math.min(l0, l1);
            let high = Math.max(l0, l1);
            let value = this._p.constrain(v, low, high);
            // If we don't have a scaler then create it
            if (!this._scaler) {
                this._scaler = this._gui.slider(this._name + "-scaler", 0.25 * this._w, 0.5 * this._h - 10, 0.5 * this._w, 20)
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
    _whereOver(px, py) {
        if (px > this._w - 20 && px < this._w && py > 0 && py < this._h - 20)
            return 3; // over vertical scroller
        if (px > 0 && px < this._w - 20 && py > this._h - 20 && py < this._h)
            return 3; // over horizontal scroller
        let w = this._w, w0 = 0.2 * w, w1 = 0.8 * w;
        let h = this._h, h0 = 0.35 * h, h1 = 0.65 * h;
        if (this._scaler && px > w0 && px < w1 && py > h0 && py < h1)
            return 2; //over slider make visible area
        if (px > 0 && px < w && py > 0 && py < h)
            return 1;
        return 0;
    }
    /** @hidden */
    _handleMouse(e) {
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x;
        let my = this._p.mouseY - pos.y;
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip)
            this._tooltip._updateState(this, this._pover, this._over);
        // Hide scaler unless mouse is close to centre
        if (this._scaler)
            this._over == 2 ? this._scaler.show() : this._scaler.hide();
        if (this._over >= 1) {
            this._scrH.getUsed() < 1 ? this._scrH.show() : this._scrH.hide();
            this._scrV.getUsed() < 1 ? this._scrV.show() : this._scrV.hide();
        }
        else {
            this._scrH.hide();
            this._scrV.hide();
        }
        this._processEvent(e, mx, my);
        return false;
    }
    /** @hidden */
    _handleTouch(e) {
        e.preventDefault();
        let pos = this.getAbsXY();
        const rect = this._gui._canvas.getBoundingClientRect();
        const t = e.changedTouches[0];
        let mx = t.clientX - rect.left - pos.x;
        let my = t.clientY - rect.top - pos.y;
        this._pover = this._over; // Store previous mouse over state
        this._over = this._whereOver(mx, my); // Store current mouse over state
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip)
            this._tooltip._updateState(this, this._pover, this._over);
        // Hide scaler unless mouse is close to centre
        if (this._scaler)
            this._over == 2 ? this._scaler.show() : this._scaler.hide();
        if (this._over >= 1) {
            this._scrH.getUsed() < 1 ? this._scrH.show() : this._scrH.hide();
            this._scrV.getUsed() < 1 ? this._scrV.show() : this._scrV.hide();
        }
        else {
            this._scrH.hide();
            this._scrV.hide();
        }
        this._processEvent(e, mx, my);
    }
    /** @hidden */
    _processEvent(e, ...info) {
        let mx = info[0], my = info[1];
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
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
                this._scrH.hide();
                this._scrV.hide();
                if (this._active) {
                    this._over = 0;
                    this._clickAllowed = false;
                }
            case 'mouseup':
            case 'touchend':
                if (this._active) {
                    this._dragging = false;
                    this._active = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this._active && this._dragging) {
                    if (this._scaler)
                        this._scaler.hide();
                    this._validateMouseDrag(this._dcx + (this._mx0 - mx) / this._wscale, this._dcy + (this._my0 - my) / this._wscale);
                }
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
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
    _xor(a, b) {
        return (a || b) && !(a && b);
    }
    /** @hidden */
    _updateControlVisual() {
        let b = this._buffer;
        let cs = this._scheme || this._gui.scheme();
        b.background(cs['G_7']);
        let wscale = this._wscale;
        let wcx = this._wcx;
        let wcy = this._wcy;
        // Get corners of requested view
        let ww2 = Math.round(0.5 * this._w / wscale);
        let wh2 = Math.round(0.5 * this._h / wscale);
        this._o = this._overlap(0, 0, this._lw, this._lh, // image corners
        wcx - ww2, wcy - wh2, wcx + ww2, wcy + wh2); // world corners
        // If we have an offset then calculate the view image 
        if (this._o.valid) {
            let o = this._o;
            // Calculate display offset
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
    shrink(dim) {
        console.warn("Cannot change 'shrink' a viewer");
        return this;
    }
    /** @hidden */
    orient(dir) {
        console.warn(`Cannot change orientation of a viewer to ${dir}`);
        return this;
    }
    /** @hidden */
    _minControlSize() {
        return { w: this._w, h: this._h };
    }
}
//# sourceMappingURL=viewer.js.map
/**
 * This class supports a single line text entry field.
 *
 * The user must ensure that the field is wide enough for the maximum
 * length of text expected. This control stops accepting input if it is
 * likely to exceed the control width.
 *
 * The left/right arrow keys move the text insertion point within the
 * text. Used in combination with the shift key enables part or all of
 * the text to be selected.
 *
 * If no text is selected then the arrows keys can move off the current
 * control to another. This only works if each textfield has a unique
 * index number.
 *
 * If the control has the index value 'idx' then the next control depends
 * on the arrow key pressed - <br>
 * left : idx - 1 <br>
 * right : idx + 1 <br>
 * up : idx - offset <br>
 * down : idx + offset <br>
 *
 * The offset value is set when initialising the idx value with the
 * <code>index(idx, deltaIndex</code> method.)
 *
 * No other controls can be used while a textfield control is active. Pressing
 * 'Enter' or attempting to move to a non-existant textfield deactivates the
 * current text field.
 *
 * The user can provide their own validation function which is checked when
 * the control is deativated.
 *
 * @since 0.9.3
 */
class CvsTextField extends CvsText {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
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
     * string length will be reduced until will fit inside the textfiel.
     * If a validation function has been set then the string will be
     * validated.
     *
     * @param t a string representing text to display
     * @returns this control for setter
     */
    text(t) {
        // getter
        if (t == null || t == undefined)
            return this._getLine();
        //setter
        this._textInvalid = false;
        t = t.toString().replaceAll('\n', ' ');
        while (t.length > 0 && this._buffer.textWidth(t) >= this._maxTextWidthPixels()) {
            t = t.substring(0, t.length - 1);
        }
        this._lines = [t];
        this.validate();
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
    /**
     * Deletes the index number.
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
     * is some text then this method returns the same as the isValid() method.
     *
     * @returns true if there is some text and it passed any validation function
     */
    hasValidText() {
        return !this._textInvalid && this._lines.length > 0 && this._lines[0].length > 0;
    }
    /**
     * Clears the validity flag irrespective of whether the text is
     * valid or not.
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
     * Uesr provide a validation function for this textfield
     * @param vfunc the validation function
     * @returns this control
     */
    validation(vfunc) {
        this._validation = vfunc;
        return this;
    }
    /**
     * Force the control to validate
     * @returns this control
     */
    validate() {
        this._validate();
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
                // If formatted text is provided and it fits the textfield accept it
                if (r[1]) // Validator has returned formatted text
                    // See if it fits textfield
                    if (this._buffer.textWidth(r[1]) < this._maxTextWidthPixels())
                        this._lines[0] = r[1];
                    else
                        this._textInvalid = true;
            }
        }
    }
    /**
     * Activate this control to receive keyboard events. Occurs if the user
     * clicks on the control or is 'tabbed' into the control.
     * @hidden
     */
    _activate(selectAll = false) {
        this._active = true;
        let line = this._getLine();
        this._currCsrIdx = line.length;
        this._prevCsrIdx = selectAll || this._textInvalid ? 0 : line.length;
        this._cursorOn = true;
        this._clock = setInterval(() => {
            this._cursorOn = !this._cursorOn;
            this.invalidateBuffer();
        }, 550);
        this.invalidateBuffer();
    }
    /**
     * Called when this control passes focus to a new control.
     * @param idx the index for the control to be activated
     */
    _activateNext(offset) {
        this._deactivate();
        this._validate();
        let links = this._gui._links;
        if (links) {
            let idx = this._linkIndex, ctrl;
            do {
                idx += offset;
                ctrl = links.get(idx);
            } while (ctrl && (!ctrl.isEnabled() || !ctrl.isVisible()));
            ctrl?._activate();
        }
    }
    /**
     * Deactivate this control
     * @hidden
     */
    _deactivate() {
        this._active = false;
        this._cursorOn = false;
        clearInterval(this._clock);
        this.invalidateBuffer();
    }
    /**
     * We are only interested in the first line of text
     * @hidden
     */
    _getLine() {
        return this._lines.length > 0 ? this._lines[0] : '';
    }
    /**
     * Calculates and returns the pixel length for a given
     * character position.
     * @hidden
     */
    _cursorX(buff, line, idx) {
        return idx == 0 ? 0 : buff.textWidth(line.substring(0, idx));
    }
    /** @hidden */
    _processEvent(e, ...info) {
        switch (e.type) {
            case 'mousedown':
                if (this._over > 0)
                    this._activate();
                break;
        }
    }
    /** @hidden */
    _maxTextWidthPixels() {
        let ts = Number(this._textSize || this._gui.textSize());
        return this._w - (2 * this._gap) - ts / 2; // maximun text width in pixels
    }
    /** @hidden */
    _handleKey(e) {
        // let ts = Number(this._textSize || this._gui.textSize());
        let mtw = this._maxTextWidthPixels(); // maximun text width in pixels
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
                // Add new character provided it is hort enough to dosplay safely
                line = line.substring(0, this._currCsrIdx) + e.key + line.substring(this._currCsrIdx);
                if (this._buffer.textWidth(line) < mtw) {
                    this._currCsrIdx++;
                    this._prevCsrIdx++;
                    this._lines[0] = line;
                }
                this.invalidateBuffer();
                return true;
            }
            switch (e.key) {
                case 'ArrowLeft':
                    if (tabLeft) {
                        this._activateNext(-1);
                        this.action({ source: this, p5Event: e, value: line });
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
                        this._activateNext(1);
                        this.action({ source: this, p5Event: e, value: line });
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
                        if (this._linkOffset !== 0)
                            this._activateNext(-this._linkOffset);
                        this.action({ source: this, p5Event: e, value: line });
                    }
                    break;
                case 'ArrowDown':
                    if (!hasSelection) {
                        if (this._linkOffset !== 0)
                            this._activateNext(this._linkOffset);
                        this.action({ source: this, p5Event: e, value: line });
                    }
                    break;
                case 'Enter':
                    this._deactivate();
                    this._validate();
                    this.action({ source: this, p5Event: e, value: line });
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
            return false;
        }
        return true;
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
        let ts = Number(this._textSize || this._gui.textSize());
        let cs = this._scheme || this._gui.scheme();
        let b = this._buffer;
        b.textSize(ts);
        let line = this._lines.length > 0 ? this._lines[0] : '';
        let tiv = this._textInvalid;
        let sx = 2 * this._gap;
        let BACK = cs['C_1'];
        let FORE = cs['C_9'];
        const CURSOR = cs['G_9'];
        const HIGHLIGHT = cs['C_9'];
        const SELECT = cs['C_3'];
        b.push();
        b.background(cs['G_0']); // white background
        b.noStroke();
        if (!this._active) { // Colors depend on whether text is valid
            BACK = tiv ? cs['C_9'] : cs['C_1'];
            FORE = tiv ? cs['C_3'] : cs['C_9'];
            b.stroke(FORE);
            b.strokeWeight(1.5);
            b.fill(BACK);
            b.rect(0, 0, this._w, this._h);
        }
        else { // Active so display any selection
            if (this._currCsrIdx != this._prevCsrIdx) {
                let px = this._cursorX(b, line, this._prevCsrIdx);
                let cx = this._cursorX(b, line, this._currCsrIdx);
                b.noStroke();
                b.fill(SELECT);
                let cx0 = sx + Math.min(px, cx), cx1 = Math.abs(px - cx);
                b.rect(cx0, 1, cx1, this._h - 2);
            }
        }
        b.fill(BACK);
        // Draw text
        b.textSize(ts);
        b.textAlign(this._p.LEFT, this._p.TOP);
        b.noStroke();
        b.fill(FORE);
        b.text(line, sx, (this._h - ts) / 2);
        // Draw cursor
        if (this._activate && this._cursorOn) {
            let cx = this._cursorX(b, line, this._currCsrIdx);
            b.stroke(CURSOR);
            b.strokeWeight(1.5);
            b.line(sx + cx, 4, sx + cx, this._h - 5);
        }
        // Mouse over highlight
        if (this._over > 0) {
            b.stroke(HIGHLIGHT);
            b.strokeWeight(2);
            b.noFill();
            b.rect(1, 1, this._w - 2, this._h - 2, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        // Control disabled highlight
        if (!this._enabled)
            this._disable_hightlight(b, cs, 0, 0, this._w, this._h);
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }
}
Object.assign(CvsTextField.prototype, processMouse, processTouch);
//# sourceMappingURL=textfield.js.map
/**
 * <p>This class simulates a multi-mode joystick. Each of the three possible
 * modes apply different constraints to the range of movement allowed they
 * are -.</p>
 * <p><code>'X0'</code> : can move in any direction (360&deg;).<br>
 * <code>'X4'</code> : constrained to the 4 main compass directions
 * (N, E, S, W).<br>
 * <code>'X8'</code> : constrained to the 8 main compass directions
 * (N, NE, E, SE, S, SW, W, NW).</p>
 *
 * <p>To handle events use the <code>setAction</code> method to specify
 * the action-method that will be used to process action-info objects
 * created when the joystick is moved.</p>
 * <p>The action-info object has several very useful fields dthat describes
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
 * <li><code>mag</code> : has a value in range &ge; 0 and &le; 1 representing
 * the distance the stick has been pushed.</li>
 *
 * <li><code>angle</code> : has a value in range &ge; 0 and &lt; 2&pi;
 * representing the angle the stick makes to the poistive x axis in the
 * clockwise direction. In modes X4 and X8 the angles will be constrained to
 * the permitted directions.</li>
 *
 * <li><code>final</code> : has the value <code>false</code> if the stick is
 * still being moved and <code>false</code> if the stick has been released.</li>
 * </ul>
 * <p>When the joystick is released it will return back to its rest state
 * i.e. centered.</p>
 * @since 1.1.0
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
    mode(m) {
        if (!m)
            return this._mode;
        m = m.toUpperCase();
        (m);
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
     * <p>See if the position [px, py] is over the control.</p>
     * @hidden
     * @param px horizontal position
     * @param py vertical position
     * @param tol tolerance in pixels
     * @returns 0 if not over the control of &ge;1
     */
    _whereOver(px, py, tol = this._tSize) {
        // adjust position to centre of knob
        px -= this._w / 2;
        py -= this._h / 2;
        let [tx, ty] = this._getThumbXY();
        return (Math.abs(tx - px) <= tol && Math.abs(ty - py) <= tol)
            ? 1 : 0;
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
    _processEvent(e, ...info) {
        /** @hidden */
        function getValue(source, event, fini) {
            let mag = (source._mag - source._pr0) / (source._pr1 - source._pr0);
            return {
                source: source, p5Event: event, final: fini, mag: mag,
                angle: source._ang, dir: source._dir, dead: source._dead,
            };
        }
        let mx = info[0], my = info[1];
        mx -= this._w / 2;
        my -= this._h / 2;
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
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this._active) {
                    this._validateThumbPosition(mx, my);
                    this.action(getValue(this, e, false));
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
    _updateControlVisual() {
        let b = this._buffer;
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
        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke();
            b.fill(OPAQUE);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        b.translate(b.width / 2, b.height / 2);
        // dial face background
        b.noStroke();
        b.fill(DIAL_FACE);
        b.ellipse(0, 0, this._pr1 * 2, this._pr1 * 2);
        // dial face highlight
        let s = 0, e = 0.26 * this._size, da = 0;
        b.fill(DIAL_TINT);
        b.noStroke(); //b.stroke(DIAL_TINT); b.strokeWeight(2);
        b.ellipse(0, 0, e * 2, e * 2);
        b.ellipse(0, 0, e * 1.25, e * 1.25);
        // Dial face markers
        b.stroke(MARKERS);
        switch (this._mode) {
            case 'X0':
                s = this._pr1;
                e = 0.33 * this._size;
                da = Math.PI / 8;
                b.push();
                b.strokeWeight(0.75);
                e = 0.3 * this._size;
                for (let i = 0; i < 16; i++) {
                    b.line(s, 0, e, 0);
                    b.rotate(da);
                }
                b.pop();
                break;
            case 'X8':
                s = this._pr0;
                e = 0.33 * this._size;
                da = Math.PI / 4;
                b.push();
                b.strokeWeight(1);
                for (let i = 0; i < 8; i++) {
                    b.line(s, 0, e, 0);
                    b.rotate(da);
                }
                b.pop();
            case 'X4':
                s = this._pr0;
                e = this._pr1;
                da = Math.PI / 2;
                b.push();
                b.strokeWeight(1.5);
                for (let i = 0; i < 4; i++) {
                    b.line(s, 0, e, 0);
                    b.rotate(da);
                }
                b.pop();
                break;
        }
        // Dial border
        b.stroke(DIAL_BORDER);
        b.strokeWeight(Math.max(3, 0.025 * this._size));
        b.noFill();
        b.ellipse(0, 0, this._pr1 * 2, this._pr1 * 2);
        // Dead zone
        b.fill(DEAD_ZONE);
        b.noStroke();
        b.ellipse(0, 0, this._pr0 * 2, this._pr0 * 2);
        // Stick                                                                                    
        b.stroke(ROD);
        b.strokeWeight(this._size * 0.05);
        b.line(0, 0, tx, ty);
        // Thumb
        b.strokeWeight(2);
        b.stroke(THUMB_STROKE);
        if (this._active || this._over > 0)
            b.fill(THUMB_OVER);
        else
            b.fill(THUMB_OFF);
        b.ellipse(tx, ty, this._tSize * 2, this._tSize * 2);
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }
}
Object.assign(CvsJoystick.prototype, processMouse, processTouch);
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
        let constrain = this._p.constrain;
        let t = this._t01, under = false, over = false;
        switch (this._mode) {
            case CvsKnob.X_MODE:
                t = this._t01 + (x - this._prevX) * this._sensitivity;
                under = t < 0;
                over = t > 1;
                t = constrain(t, 0, 1);
                break;
            case CvsKnob.Y_MODE:
                t = this._t01 - (y - this._prevY) * this._sensitivity;
                under = t < 0;
                over = t > 1;
                t = constrain(t, 0, 1);
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
    _processEvent(e, ...info) {
        let [mx, my] = info;
        mx -= this._w / 2;
        my -= this._h / 2; // Make relative to knob centre
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                if (this._over > 0) {
                    this._prevX = mx;
                    this._prevY = my;
                    this._active = true;
                    this.invalidateBuffer();
                }
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this._active) {
                    let next = this._tFromXY(mx, my);
                    this._t01 = this._s2ticks ? this._nearestTickT(next.t) : next.t;
                    this.action({ source: this, p5Event: e, value: this.value(), final: true });
                    this._active = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
            case 'touchmove':
                if (this._active) {
                    let next = this._tFromXY(mx, my);
                    let t01 = this._s2ticks ? this._nearestTickT(next.t) : next.t;
                    if (this._t01 != t01) {
                        this._prevX = mx;
                        this._prevY = my;
                        this._t01 = t01;
                        this.action({ source: this, p5Event: e, value: this.value(), final: false });
                        this.invalidateBuffer();
                    }
                }
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
    }
    /**
     * <p>See if the position [px, py] is over the control.</p>
     * @hidden
     * @param px horizontal position
     * @param py vertical position
     * @param tol knob radius tolerance in pixels
     * @returns 1 if over any part of the knob otherwise return 0
     */
    _whereOver(px, py, tol = 0) {
        // adjust position to centre of knob
        px -= this._w / 2;
        py -= this._h / 2;
        let d2 = px * px + py * py;
        let rt = this._kRad + tol;
        return d2 <= rt * rt ? 1 : 0;
    }
    /** @hidden */
    _updateControlVisual() {
        let b = this._buffer;
        let cs = this._scheme || this._gui.scheme();
        const OPAQUE = cs['C_3'];
        const GRIP_OFF = cs['C_7'], GRIP_STROKE = cs['C_8'];
        const MARKER = cs['C_3'];
        const HIGHLIGHT = cs['C_9'];
        const TRACK_BACK = cs['C_3'], TRACK_ARC = cs['C_1'];
        const TICKS = cs['G_8'];
        const USED_TRACK = cs['G_2'], UNUSED_TRACK = cs['T_1'];
        b.clear();
        if (this._opaque) {
            b.noStroke();
            b.fill(OPAQUE);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        let arc = this._turnArc, gap = 2 * Math.PI - arc, lowA = gap / 2;
        let rOut = this._kRad, rIn = this._gRad;
        let dOut = 2 * rOut, dIn = 2 * rIn;
        b.push();
        b.translate(b.width / 2, b.height / 2);
        b.rotate(this._gapPos + lowA);
        // Draw full background and track arc
        b.noStroke();
        b.fill(TRACK_BACK);
        b.ellipse(0, 0, dOut, dOut);
        b.fill(TRACK_ARC);
        b.arc(0, 0, dOut, dOut, 0, this._turnArc);
        // Draw ticks? 
        let n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            let b0 = this._tw, b1 = 0.65 * b0;
            b.stroke(TICKS);
            let da = arc / n;
            b.push();
            {
                b.strokeWeight(0.9);
                // minor ticks
                for (let i = 0; i <= n; i++) {
                    b.line(rIn, 0, rIn + b1, 0);
                    b.rotate(da);
                }
            }
            b.pop();
            n = this._majorTicks;
            if (n >= 2) {
                let da = arc / n;
                b.push();
                {
                    b.strokeWeight(1);
                    // major ticks
                    for (let i = 0; i <= n; i++) {
                        b.line(rIn, 0, rIn + b0, 0);
                        b.rotate(da);
                    }
                }
                b.pop();
            }
            // Unused track
            b.noStroke();
            b.fill(UNUSED_TRACK);
            b.arc(0, 0, dIn + b0, dIn + b0, 0, arc);
            // Unused track
            b.fill(USED_TRACK);
            b.arc(0, 0, dIn + b0, dIn + b0, 0, this._t01 * arc);
        }
        // Grip section
        b.stroke(GRIP_STROKE);
        b.strokeWeight(1.5);
        b.fill(GRIP_OFF);
        b.ellipse(0, 0, dIn, dIn);
        // Grip arrow marker
        b.push();
        {
            b.rotate(this._t01 * arc);
            let ms = 0.2 * rIn;
            b.fill(MARKER);
            b.noStroke();
            b.beginShape();
            b.vertex(-ms, 0);
            b.vertex(0, -ms);
            b.vertex(rIn, 0);
            b.vertex(0, ms);
            b.endShape(this._p.CLOSE);
        }
        b.pop();
        // Is over highlight?
        if (this._over || this._active) {
            b.noFill();
            b.stroke(HIGHLIGHT);
            b.strokeWeight(3);
            b.arc(0, 0, 2 * this._kRad, 2 * this._kRad, 0, arc);
        }
        b.pop();
        b.updatePixels();
        // last line in this method should be
        this._bufferInvalid = false;
    }
    /** @hidden */
    _minControlSize() {
        return { w: this._size, h: this._size };
    }
}
/** @hidden */ CvsKnob.X_MODE = 1;
/** @hidden */ CvsKnob.Y_MODE = 2;
/** @hidden */ CvsKnob.A_MODE = 3;
Object.assign(CvsKnob.prototype, processMouse, processTouch);
//# sourceMappingURL=knob.js.map
/*
##############################################################################
 CvsPane
 This is the base class side panes
 ##############################################################################
 */
class CvsPane extends CvsBaseControl {
    /** @hidden */
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h);
        /** @hidden */ this._background = 'rgba(0,0,0,0.6)';
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
        this._cornerRadius = 5;
        this._status = 'closed';
        this._timer = 0;
        this._Z = 128;
    }
    /** @hidden */
    parent(p, rx, ry) {
        console.warn('Panes cannot have a parent');
        return undefined;
    }
    /** @hidden */
    leaveParent() {
        console.warn('Panes cannot have a parent');
        return undefined;
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
    /**
     *
     * @returns true if the pane is closed else false
     */
    isClosed() {
        return this._status == 'closed';
    }
    /**
     *
     * @returns true if the pane is closinging else false
     */
    isClosing() {
        return this._status == 'closing';
    }
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
    /**
     *
     * @returns true if the pane is open else false
     */
    isOpen() {
        return this._status == 'open';
    }
    /**
     *
     * @returns true if the pane is opening else false
     */
    isOpening() {
        return this._status == 'opening';
    }
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
    _renderWEBGL() {
        let p = this._p;
        p.push();
        p.translate(this._x, this._y);
        if (this._visible && this._tabstate != 'closed') {
            p.noStroke();
            p.fill(this._background);
            p.beginShape(p.TRIANGLE_STRIP);
            p.vertex(0, 0);
            p.vertex(0, this._h);
            p.vertex(this._w, 0);
            p.vertex(this._w, this._h);
            p.endShape();
        }
        for (let c of this._children)
            if (c._visible)
                c._renderWEBGL();
        p.pop();
    }
    /** @hidden */
    _renderP2D() {
        let p = this._p;
        p.push();
        p.translate(this._x, this._y);
        if (this._visible && this._tabstate != 'closed') {
            p.noStroke();
            p.fill(this._background);
            p.rect(0, 0, this._w, this._h);
        }
        for (let c of this._children)
            if (c._visible)
                c._renderP2D();
        p.pop();
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
     * A control becomes active when the mous btton is pressed over it.
     * This method has little practical use except when debugging.
     * @hidden
     * @returns true if this control is expecting more mouse events
     */
    isActive() {
        return this.tab()._active;
    }
    /** @hidden */
    opaque(dim) {
        console.warn("This method is not applicable to a pane");
        return this;
    }
    /** @hidden */
    transparent(dim) {
        console.warn("This methis is not applicable to a pane");
        return this;
    }
    /** @hidden */
    orient(dir) {
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
    _minControlSize() {
        return { w: this._w, h: this._h };
    }
}
// Deltas used in controlling opening and closing speeds
/** @hidden */ CvsPane._dI = 50; // Interval time (20)
/** @hidden */ CvsPane._dC = 60; // Close speed px/sec :: was (40)
/** @hidden */ CvsPane._dO = 40; // Open speed px/sec :: was (20)
/** @hidden */ CvsPane._wExtra = 20;
/** @hidden */ CvsPane._tabID = 1;
/** @hidden */
class CvsPaneNorth extends CvsPane {
    constructor(gui, name, depth) {
        super(gui, name, 0, -depth, gui.canvasWidth(), depth);
        this._depth = depth;
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
    constructor(gui, name, depth) {
        super(gui, name, 0, gui.canvasHeight(), gui.canvasWidth(), depth);
        this._depth = depth;
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
    constructor(gui, name, depth) {
        super(gui, name, gui.canvasWidth(), 0, depth, gui.canvasHeight());
        this._depth = depth;
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
 *
 * @since 1.1.0
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
