class GUI {
    constructor(p5c, p = p5.instance) {
        this._renderer = p5c;
        this._p = p;
        this._is3D = false;
        this._controls = new Map();
        this._ctrls = [];
        this._corners = [4, 4, 4, 4];
        this._optionGroups = new Map();
        this._textSize = 12;
        this._tipTextSize = 10;
        this._panesEast = [];
        this._panesSouth = [];
        this._panesWest = [];
        this._panesNorth = [];
        this._initColorSchemes();
        this._initMouseEventHandlers(p5c);
    }
    scroller(name, x, y, w, h) {
        return this.addControl(new GScroller(this, name, x, y, w, h));
    }
    slider(name, x, y, w, h) {
        return this.addControl(new GSlider(this, name, x, y, w, h));
    }
    ranger(name, x, y, w, h) {
        return this.addControl(new GRanger(this, name, x, y, w, h));
    }
    button(name, x, y, w, h) {
        return this.addControl(new GButton(this, name, x, y, w, h));
    }
    checkbox(name, x, y, w, h) {
        return this.addControl(new GCheckbox(this, name, x, y, w, h));
    }
    option(name, x, y, w, h) {
        return this.addControl(new GOption(this, name, x, y, w, h));
    }
    label(name, x, y, w, h) {
        return this.addControl(new GLabel(this, name, x, y, w, h));
    }
    viewer(name, x, y, w, h) {
        return this.addControl(new GViewer(this, name, x, y, w, h));
    }
    __tooltip(name) {
        return this.addControl(new GTooltip(this, name));
    }
    pane(name, location, size) {
        let ctrl;
        switch (location) {
            case 'north':
                ctrl = new GPaneNorth(this, name, size);
                break;
            case 'south':
                ctrl = new GPaneSouth(this, name, size);
                break;
            case 'west':
                ctrl = new GPaneWest(this, name, size);
                break;
            case 'east':
            default: ctrl = new GPaneEast(this, name, size);
        }
        return this.addControl(ctrl);
    }
    getControl(id) {
        return (typeof id === "string") ? this._controls.get(id) : id;
    }
    $(id) {
        return (typeof id === "string") ? this._controls.get(id) : id;
    }
    addControl(control) {
        console.assert(!this._controls.has(control._name), `Control '${control._name}' already exists and will be replaced.`);
        this._controls.set(control._name, control);
        this._ctrls = [...this._controls.values()];
        this._ctrls.sort((a, b) => { return a.z() - b.z(); });
        return control;
    }
    listControls() {
        console.log("List of controls");
        for (let c of this._ctrls) {
            console.log(c.name());
        }
        console.log('--------------------------------------------------------------');
    }
    getOptionGroup(name) {
        if (!this._optionGroups.has(name))
            this._optionGroups.set(name, new GOptionGroup(name));
        return this._optionGroups.get(name);
    }
    textSize(gts) {
        if (!Number.isFinite(gts)) {
            return this._textSize;
        }
        this._textSize = gts;
        this._controls.forEach((c) => { c.invalidateBuffer(); });
        return this;
    }
    tipTextSize(gtts) {
        if (gtts) {
            this._tipTextSize = gtts;
            return this;
        }
        return this._tipTextSize;
    }
    canvasWidth() {
        return this._renderer.width;
    }
    canvasHeight() {
        return this._renderer.height;
    }
    corners(c) {
        if (Array.isArray(c) && c.length == 4) {
            this._corners = Array.from(c);
        }
        return Array.from(this._corners);
    }
    context() {
        return this._renderer;
    }
    is3D() {
        return this._is3D;
    }
    _closeAll() {
        for (let pane of this._panesEast)
            pane.close();
        for (let pane of this._panesWest)
            pane.close();
        for (let pane of this._panesSouth)
            pane.close();
        for (let pane of this._panesNorth)
            pane.close();
    }
    hideAll() {
        this._closeAll();
        for (let pane of this._panesEast)
            pane.hide();
        for (let pane of this._panesWest)
            pane.hide();
        for (let pane of this._panesSouth)
            pane.hide();
        for (let pane of this._panesNorth)
            pane.hide();
    }
    showAll() {
        for (let pane of this._panesEast)
            pane.show();
        for (let pane of this._panesWest)
            pane.show();
        for (let pane of this._panesSouth)
            pane.show();
        for (let pane of this._panesNorth)
            pane.show();
    }
    validateTabsEast() {
        let panes = this._panesEast, n = panes.length;
        let sum = 2 * (n - 1);
        panes.forEach(p => (sum += p.tab()._w));
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
    validateTabsWest() {
        let panes = this._panesWest;
        let n = panes.length;
        let sum = 2 * (n - 1);
        panes.forEach(p => (sum += p.tab()._w));
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
    validateTabsSouth() {
        let panes = this._panesSouth;
        let n = panes.length;
        let sum = 2 * (n - 1);
        panes.forEach(p => (sum += p.tab()._w));
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
    validateTabsNorth() {
        let panes = this._panesNorth, n = panes.length;
        let sum = 2 * (n - 1);
        panes.forEach(p => (sum += p.tab()._w));
        let pos = (this.canvasWidth() - sum) / 2;
        for (let i = 0; i < n; i++) {
            let pane = panes[i], tab = pane.tab();
            let x = pos, y = pane.size();
            pos += tab._w + 2;
            tab._x = x;
            tab._y = y;
        }
    }
    _initColorSchemes() {
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
    scheme(schemename) {
        if (!schemename) {
            return this._scheme;
        }
        if (this._schemes[schemename]) {
            this._scheme = this._schemes[schemename];
            this._controls.forEach((c) => {
                if (!c.scheme())
                    c.invalidateBuffer();
            });
        }
        else
            console.error(`'${schemename}' is not a valid color scheme`);
        return this;
    }
    getScheme(schemename) {
        if (schemename && this._schemes[schemename])
            return Object.assign({}, this._schemes[schemename]);
        console.warn(`Unable to retrieve color scheme '${schemename}'`);
        return undefined;
    }
    deleteScheme(schemename) {
        if (schemename && this._schemes[schemename]) {
            this._schemes[schemename] = undefined;
            this._schemes = this._schemes.filter(Boolean);
        }
        return this;
    }
    addScheme(schemename, scheme) {
        if (typeof schemename === 'string' && !scheme) {
            if (!this._schemes[schemename])
                this._schemes[schemename] = scheme;
            else
                console.error(`Cannot add scheme '${schemename}' because it already exists.'`);
        }
        return this;
    }
    _initMouseEventHandlers(p5c) {
        let canvas = p5c.canvas;
        canvas.addEventListener('mousemove', (e) => { this._handleMouseEvents(e); });
        canvas.addEventListener('mousedown', (e) => { this._handleMouseEvents(e); });
        canvas.addEventListener('mouseup', (e) => { this._handleMouseEvents(e); });
        canvas.addEventListener('wheel', (e) => { this._handleMouseEvents(e); });
        canvas.addEventListener('mouseout', (e) => { this._handleMouseEvents(e); });
        this._is3D = p5c.GL != undefined && p5c.GL != null;
        this.draw = this._is3D ? this._drawControlsWEBGL : this._drawControlsP2D;
    }
    _handleMouseEvents(e) {
        let activeControl = undefined;
        for (let c of this._ctrls) {
            if (c.isActive()) {
                activeControl = c;
                c._handleMouse(e);
                break;
            }
        }
        if (activeControl == undefined) {
            for (let c of this._ctrls)
                if (c.isEnabled())
                    c._handleMouse(e);
        }
    }
    draw() { }
    _drawControlsP2D() {
        this._p.push();
        for (let c of this._ctrls)
            if (!c.getParent())
                c._renderP2D();
        this._p.pop();
    }
    _drawControlsWEBGL() {
        this._p.push();
        let renderer = this._renderer;
        let gl = renderer.drawingContext;
        let w = renderer.width, h = renderer.height, d = Number.MAX_VALUE;
        gl.flush();
        let mvMatrix = renderer.uMVMatrix.copy();
        let pMatrix = renderer.uPMatrix.copy();
        gl.disable(gl.DEPTH_TEST);
        renderer.resetMatrix();
        renderer._curCamera.ortho(0, w, -h, 0, -d, d);
        for (let c of this._ctrls)
            if (!c.getParent())
                c._renderWEBGL();
        gl.flush();
        renderer.uMVMatrix.set(mvMatrix);
        renderer.uPMatrix.set(pMatrix);
        gl.enable(gl.DEPTH_TEST);
        this._p.pop();
    }
    static get(p5c, p = p5.instance) {
        GUI.announce();
        if (GUI._guis.has(p))
            return GUI._guis.get(p);
        let gui = new GUI(p5c, p);
        GUI._guis.set(p, gui);
        return gui;
    }
    static announce() {
        if (!GUI._announced) {
            console.log('================================================');
            console.log('  canvasGUI (0.0.1)   \u00A9 2022 Peter Lager');
            console.log('================================================');
            GUI._announced = true;
        }
    }
}
GUI._guis = new Map();
GUI._announced = false;
GUI._baseScheme = {
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
GUI._blueScheme = {
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
GUI._greenScheme = {
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
GUI._redScheme = {
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
};
GUI._cyanScheme = {
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
GUI._yellowScheme = {
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
GUI._purpleScheme = {
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
GUI._orangeScheme = {
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
GUI._darkScheme = {
    back: 'rgb(64, 64, 64)',
    fore: 'rgb(224, 224, 224)',
    thumb: 'rgb(64, 64, 64)',
    track_fore: 'rgb(124, 124, 124)',
    highlight: 'rgb(250, 250, 250)',
    opaque: 'hsb(1, 45%, 100%)',
};
//# sourceMappingURL=gui_controller.js.map