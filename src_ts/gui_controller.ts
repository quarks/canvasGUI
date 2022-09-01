import { p5 } from "../libraries/p5.min.js";
import { GPane, GPaneEast, GPaneNorth, GPaneSouth, GPaneWest } from "./gui_controls";
import { GObject, GScroller, GTooltip, GOptionGroup, GOption, GCheckbox } from "./gui_controls";
import { GSlider, GRanger, GButton, GLabel, GViewer } from "./gui_controls";
export { GUI };

// Comment out any import and export statements above before transpiling to 
// Javascript. Otherwise it creates JS modules that don't work with the 
// Processing IDE

/*
ISC License

Copyright 2022 Peter Lager

Permission to use, copy, modify, and/or distribute this software for any purpose 
with or without fee is hereby granted, provided that the above copyright notice 
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH 
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY 
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, 
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM 
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR 
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR 
PERFORMANCE OF THIS SOFTWARE.
*/

/**
 * <p>Core class for cGUI library </p>
 * <p>Use an instance of GUI to control all aspects of your gui</p>
 * <ul>
 * <li>Create the UI controls e.g. buttons, sliders</li>
 * <li>Provides 7 color schemes for the controls</li>
 * </ul>
 * 
 * @author Peter Lager
 * @copyright 2022
 * @license ISC
 * @version 0.0.1
 * 
 */
class GUI {
    /** @hidden */ private _renderer: any;
    /** @hidden */  public _p: p5;
    /** @hidden */ private _is3D: boolean;
    /** @hidden */ private _controls: Map<string, GObject>;
    /** @hidden */ private _ctrls: Array<GObject>;
    /** @hidden */ private _corners: Array<number>;
    /** @hidden */ private _optionGroups: Map<string, GOptionGroup>;
    /** @hidden */ private _textSize: number;
    /** @hidden */ private _tipTextSize: number;
    /** @hidden */ public _panesEast: Array<GPane>;
    /** @hidden */ public _panesSouth: Array<GPane>;
    /** @hidden */ public _panesWest: Array<GPane>;
    /** @hidden */ public _panesNorth: Array<GPane>;

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
     * Create a scroller control
     * @param name unique identifier
     * @param x left-hand pixel position
     * @param y top pixel position
     * @param w width
     * @param h height
     * @returns scroller control
     */
    scroller(name: string, x: number, y: number, w: number, h: number) {
        return this.addControl(new GScroller(this, name, x, y, w, h));
    }
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
        return this.addControl(new GSlider(this, name, x, y, w, h));
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
        return this.addControl(new GRanger(this, name, x, y, w, h));
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
        return this.addControl(new GButton(this, name, x, y, w, h));
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
        return this.addControl(new GCheckbox(this, name, x, y, w, h));
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
        return this.addControl(new GOption(this, name, x, y, w, h));
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
        return this.addControl(new GLabel(this, name, x, y, w, h));
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
        return this.addControl(new GViewer(this, name, x, y, w, h));
    }
    /**
     * @hidden
     * @param name auto generated unique identifier
     * @returns tooltip control
     */
    __tooltip(name: string): GTooltip {
        return this.addControl(new GTooltip(this, name));
    }
    /**
     * Create a side pane. The pane location is either 'north', 'south',
     * 'east' or 'west'
     * @param name unique identifier
     * @param location location for the pane
     * @param size the maximum size the pane expands into the canvas
     * @returns pane control for specified location
     */
    pane(name: string, location: string, size: number): GPane {
        let ctrl: GPane;
        switch (location) {
            case 'north': ctrl = new GPaneNorth(this, name, size); break;
            case 'south': ctrl = new GPaneSouth(this, name, size); break;
            case 'west': ctrl = new GPaneWest(this, name, size); break;
            case 'east':
            default: ctrl = new GPaneEast(this, name, size);
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
    getControl(id: string | GObject): GObject {
        return (typeof id === "string") ? this._controls.get(id) : id;
    }

    /**
     * <p>Get the control given it's unique identifier.</p>
     * @param id control's unique identifier
     * @returns  get the associated control
    */
    $(id: string | GObject): GObject {
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
            //console.log(!c.parent, c.parent, Boolean(c.parent));
        }
        console.log('--------------------------------------------------------------');
    }

    /**
     * <p>Gets the option group associated with a given name.</p>
     * @param name the name of the oprion group
     * @returns the option group
     * @hidden
     */
    getOptionGroup(name: string): GOptionGroup {
        if (!this._optionGroups.has(name))
            this._optionGroups.set(name, new GOptionGroup(name));
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
        this._schemes['blue'] = Object.assign(Object.assign({}, GUI._baseScheme), GUI._blueScheme);
        this._schemes['green'] = Object.assign(Object.assign({}, GUI._baseScheme), GUI._greenScheme);
        this._schemes['red'] = Object.assign(Object.assign({}, GUI._baseScheme), GUI._redScheme);
        this._schemes['cyan'] = Object.assign(Object.assign({}, GUI._baseScheme), GUI._cyanScheme);
        this._schemes['yellow'] = Object.assign(Object.assign({}, GUI._baseScheme), GUI._yellowScheme);
        this._schemes['purple'] = Object.assign(Object.assign({}, GUI._baseScheme), GUI._purpleScheme);
        this._schemes['orange'] = Object.assign(Object.assign({}, GUI._baseScheme), GUI._orangeScheme);
        this._schemes['dark'] = Object.assign(Object.assign({}, GUI._baseScheme), GUI._darkScheme);
        this._scheme = this._schemes['blue'];
    }

    /**
     * <p>Set or get an existing global color scheme.</p>
     * @param schemename color scheme to set
     * @returns this gui instance
     */
    scheme(schemename?: string) {
        // get global scheme
        if (!schemename) {
            return this._scheme;
        }
        // set global scheme
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
    getScheme(schemename: string): Array<string> | undefined {
        if (schemename && this._schemes[schemename])
            return Object.assign({}, this._schemes[schemename]);
        console.warn(`Unable to retrieve color scheme '${schemename}'`);
        return undefined;
    }

    /**
     * <p>Deletes the named color scheme for the gui if it exists.</p>
     * @param schemename the color scheme name
     * @returns this gui instance
     */
    deleteScheme(schemename: string) {
        if (schemename && this._schemes[schemename]) {
            this._schemes[schemename] = undefined;
            this._schemes = this._schemes.filter(Boolean);
        }
        return this;
    }

    /**
     * <p>Adds a new color scheme to those already available. It does not replace an
     * existing scheme.</p>
     * @param schemename the name of the color schmem
     * @param scheme  the color scheme
     * @returns this gui instance
     */
    addScheme(schemename: string, scheme: any) {
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

    private static _baseScheme = {
        track_back: 'hsb(0, 0%, 75%)',
        track_border: 'hsb(0, 0%, 53%)',

        white: 'rgb(255, 255, 255)',
        white0: 'rgba(255, 255, 255, 0.2)',
        white1: 'rgba(255, 255, 255, 0.3)',
        white2: 'rgba(255, 255, 255, 0.4)',
        white3: 'rgba(255, 255, 255, 0.5)',
        white4: 'rgba(255, 255, 255, 0.6)',
        white5: 'rgba(255, 255, 255, 0.7)',
        white6: 'rgba(255, 255, 255, 0.8)',
        white7: 'rgba(255, 255, 255, 0.9)',
        black: 'rgb(0, 0, 0)',
        black0: 'rgba(0, 0, 0, 0.2)',
        black1: 'rgba(0, 0, 0, 0.3)',
        black2: 'rgba(0, 0, 0, 0.4)',
        black3: 'rgba(0, 0, 0, 0.5)',
        black4: 'rgba(0, 0, 0, 0.6)',
        black5: 'rgba(0, 0, 0, 0.7)',
        black6: 'rgba(0, 0, 0, 0.8)',
        black7: 'rgba(0, 0, 0, 0.9)',
        dark_grey: 'rgb(64, 64, 64)',
        mid_grey: 'rgb(128, 128, 128)',
        light_grey: 'rgb(192, 192, 192)',
        clear: 'rgba(0, 0, 0, 0)',
    };

    private static _blueScheme = {
        back: 'hsb(240, 45%, 100%)',
        back0: 'hsba(240, 45%, 100%, 0.2)',
        back1: 'hsba(240, 45%, 100%, 0.3)',
        back2: 'hsba(240, 45%, 100%, 0.4)',
        back3: 'hsba(240, 45%, 100%, 0.5)',
        back4: 'hsba(240, 45%, 100%, 0.6)',
        back5: 'hsba(240, 45%, 100%, 0.7)',
        back6: 'hsba(240, 45%, 100%, 0.8)',
        back7: 'hsba(240, 45%, 100%, 0.9)',
        fore: 'hsb(240, 100%, 66%)',
        thumb: 'hsb(240, 45%, 85%)',
        track_fore: 'hsb(240, 14%, 100%)',
        highlight: 'hsb(240, 100%, 50%)',
        opaque: 'hsb(240, 45%, 100%)',
        ttfore: 'hsb(240, 100%, 70%)',
        ttback: 'hsb(240, 5%, 100%)',
    };


    private static _greenScheme = {
        back: 'hsb(120, 45%, 90%)',
        back0: 'hsba(120, 45%, 90%, 0.2)',
        back1: 'hsba(120, 45%, 90%, 0.3)',
        back2: 'hsba(120, 45%, 90%, 0.4)',
        back3: 'hsba(120, 45%, 90%, 0.5)',
        back4: 'hsba(120, 45%, 90%, 0.6)',
        back5: 'hsba(120, 45%, 90%, 0.7)',
        back6: 'hsba(120, 45%, 90%, 0.8)',
        back7: 'hsba(120, 45%, 90%, 0.9)',
        fore: 'hsb(120, 90%, 40%)',
        thumb: 'hsb(120, 45%, 80%)',
        track_fore: 'hsb(120, 14%, 100%)',
        highlight: 'hsb(120, 100%, 50%)',
        opaque: 'hsb(120, 45%, 100%)',
        ttfore: 'hsb(120, 100%, 50%)',
        ttback: 'hsb(120, 5%, 100%)',
    };

    private static _redScheme = {
        back: 'hsb(1, 45%, 100%)',
        back0: 'hsba(1, 45%, 100%, 0.2)',
        back1: 'hsba(1, 45%, 100%, 0.3)',
        back2: 'hsba(1, 45%, 100%, 0.4)',
        back3: 'hsba(1, 45%, 100%, 0.5)',
        back4: 'hsba(1, 45%, 100%, 0.6)',
        back5: 'hsba(1, 45%, 100%, 0.7)',
        back6: 'hsba(1, 45%, 100%, 0.8)',
        back7: 'hsba(1, 45%, 100%, 0.9)',
        fore: 'hsb(1, 100%, 66%)',
        thumb: 'hsb(1, 45%, 85%)',
        track_fore: 'hsb(1, 14%, 100%)',
        highlight: 'hsb(1, 100%, 50%)',
        opaque: 'hsb(1, 45%, 100%)',
        ttfore: 'hsb(1, 100%, 70%)',
        ttback: 'hsb(1, 5%, 100%)',
    }

    private static _cyanScheme = {
        back: 'hsb(180, 45%, 100%)',
        back0: 'hsba(180, 45%, 100%, 0.2)',
        back1: 'hsba(180, 45%, 100%, 0.3)',
        back2: 'hsba(180, 45%, 100%, 0.4)',
        back3: 'hsba(180, 45%, 100%, 0.5)',
        back4: 'hsba(180, 45%, 100%, 0.6)',
        back5: 'hsba(180, 45%, 100%, 0.7)',
        back6: 'hsba(180, 45%, 100%, 0.8)',
        back7: 'hsba(180, 45%, 100%, 0.9)',
        fore: 'hsb(180, 100%, 50%)',
        thumb: 'hsb(180, 45%, 85%)',
        track_fore: 'hsb(180, 14%, 100%)',
        highlight: 'hsb(180, 100%, 50%)',
        opaque: 'hsb(180, 45%, 100%)',
        ttfore: 'hsb(180, 100%, 40%)',
        ttback: 'hsb(180, 5%, 100%)',
    };

    private static _yellowScheme = {
        back: 'hsb(60, 45%, 100%)',
        back0: 'hsba(60, 45%, 100%, 0.2)',
        back1: 'hsba(60, 45%, 100%, 0.3)',
        back2: 'hsba(60, 45%, 100%, 0.4)',
        back3: 'hsba(60, 45%, 100%, 0.5)',
        back4: 'hsba(60, 45%, 100%, 0.6)',
        back5: 'hsba(60, 45%, 100%, 0.7)',
        back6: 'hsba(60, 45%, 100%, 0.8)',
        back7: 'hsba(60, 45%, 100%, 0.9)',
        fore: 'hsb(60, 100%, 50%)',
        thumb: 'hsb(60, 70%, 80%)',
        track_back: 'hsb(0, 0%, 75%)',
        track_fore: 'hsb(60, 14%, 100%)',
        track_border: 'hsb(0, 0%, 53%)',
        highlight: 'hsb(60, 100%, 50%)',
        opaque: 'hsb(60, 45%, 100%)',
        ttfore: 'hsb(60, 100%, 40%)',
        ttback: 'hsb(60, 5%, 100%)',
    };

    private static _purpleScheme = {
        back: 'hsb(300, 45%, 100%)',
        back0: 'hsba(300, 45%, 100%, 0.2)',
        back1: 'hsba(300, 45%, 100%, 0.3)',
        back2: 'hsba(300, 45%, 100%, 0.4)',
        back3: 'hsba(300, 45%, 100%, 0.5)',
        back4: 'hsba(300, 45%, 100%, 0.6)',
        back5: 'hsba(300, 45%, 100%, 0.7)',
        back6: 'hsba(300, 45%, 100%, 0.8)',
        back7: 'hsba(300, 45%, 100%, 0.9)',
        fore: 'hsb(300, 100%, 66%)',
        thumb: 'hsb(300, 45%, 85%)',
        track_fore: 'hsb(300, 14%, 100%)',
        highlight: 'hsb(300, 100%, 50%)',
        opaque: 'hsb(300, 45%, 100%)',
        ttfore: 'hsb(300, 100%, 80%)',
        ttback: 'hsb(300, 5%, 100%)',
    };

    private static _orangeScheme = {
        back: 'hsb(30, 60%, 100%)',
        back0: 'hsba(30, 60%, 100%, 0.2)',
        back1: 'hsba(30, 60%, 100%, 0.3)',
        back2: 'hsba(30, 60%, 100%, 0.4)',
        back3: 'hsba(30, 60%, 100%, 0.5)',
        back4: 'hsba(30, 60%, 100%, 0.6)',
        back5: 'hsba(30, 60%, 100%, 0.7)',
        back6: 'hsba(30, 60%, 100%, 0.8)',
        back7: 'hsba(30, 60%, 100%, 0.9)',
        fore: 'hsb(30, 100%, 50%)',
        thumb: 'hsb(30, 45%, 85%)',
        track_fore: 'hsb(30, 14%, 100%)',
        highlight: 'hsb(30, 100%, 50%)',
        opaque: 'hsb(30, 45%, 100%)',
        ttfore: 'hsb(30, 100%, 80%)',
        ttback: 'hsb(30, 5%, 100%)',

    };

    private static _darkScheme = {
        back: 'rgb(64, 64, 64)',
        fore: 'rgb(224, 224, 224)',
        thumb: 'rgb(64, 64, 64)',
        track_fore: 'rgb(124, 124, 124)',
        highlight: 'rgb(250, 250, 250)',
        opaque: 'hsb(1, 45%, 100%)',
    };

}

