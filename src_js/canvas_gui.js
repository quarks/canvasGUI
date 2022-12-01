const CANVAS_GUI_VERSION = '0.9.2';
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
    static announce() {
        if (!GUI._announced) {
            console.log('================================================');
            console.log(`  canvasGUI (${CANVAS_GUI_VERSION})   \u00A9 2022 Peter Lager`);
            console.log('================================================');
            GUI._announced = true;
        }
    }
    slider(name, x, y, w, h) {
        return this.addControl(new CvsSlider(this, name, x, y, w, h));
    }
    ranger(name, x, y, w, h) {
        return this.addControl(new CvsRanger(this, name, x, y, w, h));
    }
    button(name, x, y, w, h) {
        return this.addControl(new CvsButton(this, name, x, y, w, h));
    }
    checkbox(name, x, y, w, h) {
        return this.addControl(new CvsCheckbox(this, name, x, y, w, h));
    }
    option(name, x, y, w, h) {
        return this.addControl(new CvsOption(this, name, x, y, w, h));
    }
    label(name, x, y, w, h) {
        return this.addControl(new CvsLabel(this, name, x, y, w, h));
    }
    __scroller(name, x, y, w, h) {
        return this.addControl(new CvsScroller(this, name, x, y, w, h));
    }
    viewer(name, x, y, w, h) {
        return this.addControl(new CvsViewer(this, name, x, y, w, h));
    }
    __tooltip(name) {
        return this.addControl(new CvsTooltip(this, name));
    }
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
    $(name) {
        return (typeof name === "string") ? this._controls.get(name) : name;
    }
    addControl(control) {
        console.assert(!this._controls.has(control.name()), `Control '${control.name()}' already exists and will be replaced.`);
        this._controls.set(control.name(), control);
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
            this._optionGroups.set(name, new CvsOptionGroup(name));
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
            let x = pane.depth();
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
    _getScheme(schemename) {
        if (schemename && this._schemes[schemename])
            return Object.assign({}, this._schemes[schemename]);
        console.warn(`Unable to retrieve color scheme '${schemename}'`);
        return undefined;
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
}
GUI._guis = new Map();
GUI._announced = false;
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
    _colors(h, s0 = 40, s1 = 70, b = 100) {
        let cn = 0, i;
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
class OrientNorth {
    _renderP2D(p, w, h, buffer) {
        p.push();
        p.translate(0, w);
        p.rotate(1.5 * Math.PI);
        p.image(buffer, 0, 0);
        p.pop();
    }
    _renderWEBGL(p, w, h, buffer) {
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
        return { 'x': w - y, 'y': x, 'w': h, 'h': w };
    }
    wh(w, h) {
        return { 'w': h, 'h': w };
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
        return { 'x': y, 'y': h - x, 'w': h, 'h': w };
    }
    wh(w, h) {
        return { 'w': h, 'h': w };
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
        return { 'x': x, 'y': y, 'w': w, 'h': h };
    }
    wh(w, h) {
        return { 'w': w, 'h': h };
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
        return { 'x': w - x, 'y': h - y, 'w': w, 'h': h };
    }
    wh(w, h) {
        return { 'w': w, 'h': h };
    }
}
class CvsBaseControl {
    constructor(gui, name, x, y, w, h) {
        this._children = [];
        this._visible = true;
        this._enabled = true;
        this._Z = 0;
        this._x = 0;
        this._y = 0;
        this._w = 0;
        this._h = 0;
        this._over = 0;
        this._pover = 0;
        this._clickAllowed = false;
        this._active = false;
        this._opaque = true;
        this._scheme = undefined;
        this._bufferInvalid = true;
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
        this._dragging = false;
        this._c = gui.corners(undefined);
    }
    ;
    name() {
        return this._name;
    }
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
    scheme(id, cascade) {
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
    parent(p, rx, ry) {
        let parent = this._gui.$(p);
        parent.addChild(this, rx, ry);
        return this;
    }
    addChild(c, rx, ry) {
        let control = this._gui.$(c);
        rx = !Number.isFinite(rx) ? control._x : Number(rx);
        ry = !Number.isFinite(ry) ? control._y : Number(ry);
        if (!control._parent) {
            control.leaveParent();
        }
        control._x = rx;
        control._y = ry;
        control._parent = this;
        this._children.push(control);
        return this;
    }
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
    leaveParent() {
        if (this._parent)
            this._parent.removeChild(this);
        return this;
    }
    getParent() {
        return this._parent;
    }
    setAction(event_handler) {
        if (typeof event_handler === 'function') {
            this.action = event_handler;
        }
        else {
            console.error(`The action for '$(this._name)' must be a function definition`);
        }
        return this;
    }
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
    isActive() {
        return this._active;
    }
    isEnabled() {
        return this._enabled;
    }
    enable(cascade) {
        if (!this._enabled) {
            this._enabled = true;
            this.invalidateBuffer();
        }
        this.invalidateBuffer();
        if (cascade)
            for (let c of this._children)
                c.enable(cascade);
        return this;
    }
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
    show(cascade) {
        this._visible = true;
        if (cascade)
            for (let c of this._children)
                c.show(cascade);
        return this;
    }
    hide(cascade) {
        this._visible = false;
        if (cascade)
            for (let c of this._children)
                c.hide(cascade);
        return this;
    }
    opaque() {
        this._opaque = true;
        return this;
    }
    transparent() {
        this._opaque = false;
        return this;
    }
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
    _whereOver(px, py) {
        if (px > 0 && px < this._w && py > 0 && py < this._h) {
            return 1;
        }
        return 0;
    }
    _minControlSize() { return null; }
    _validateBuffer() {
        let b = this._buffer;
        if (b.width != this._w || b.height != this._h) {
            this._buffer = this._p.createGraphics(this._w, this._h);
            this.invalidateBuffer();
        }
        if (this._bufferInvalid) {
            this._updateControlVisual();
            this._bufferInvalid = false;
        }
    }
    invalidateBuffer() {
        this._bufferInvalid = true;
        return this;
    }
    _renderWEBGL() {
        this._validateBuffer();
        let p = this._p;
        p.push();
        p.translate(this._x, this._y);
        if (this._visible)
            this._orientation._renderWEBGL(p, this._w, this._h, this._buffer);
        for (let c of this._children)
            if (c._visible)
                c._renderWEBGL();
        p.pop();
    }
    _renderP2D() {
        this._validateBuffer();
        let p = this._p;
        p.push();
        p.translate(this._x, this._y);
        if (this._visible)
            this._orientation._renderP2D(p, this._w, this._h, this._buffer);
        for (let c of this._children)
            if (c._visible)
                c._renderP2D();
        p.pop();
    }
    _disable_hightlight(b, cs, x, y, w, h) {
        b.fill(cs['TINT_4']);
        b.noStroke();
        b.rect(x, y, w, h, this._c[0], this._c[1], this._c[2], this._c[3]);
    }
    _eq(a, b) {
        return Math.abs(a - b) < 0.001;
    }
    _neq(a, b) {
        return Math.abs(a - b) >= 0.001;
    }
    z() {
        return this._Z;
    }
    x() {
        return this._x;
    }
    y() {
        return this._y;
    }
    w() {
        return this._w;
    }
    h() {
        return this._h;
    }
    over() {
        return this._over;
    }
    pover() {
        return this._pover;
    }
    orientation() {
        return this._orientation;
    }
    _updateControlVisual() { }
    _handleMouse(e) { return true; }
    ;
}
CvsBaseControl.NORTH = new OrientNorth();
CvsBaseControl.SOUTH = new OrientSouth();
CvsBaseControl.EAST = new OrientEast();
CvsBaseControl.WEST = new OrientWest();
class CvsBufferedControl extends CvsBaseControl {
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h);
        this._buffer = this._p.createGraphics(this._w, this._h);
        this._tooltip = undefined;
    }
    tooltip(tiptext, duration) {
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
    tipTextSize(tsize) {
        if (this._tooltip && tsize && tsize > 0)
            this._tooltip.textSize(tsize);
        return this;
    }
}
class CvsSlider extends CvsBufferedControl {
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
    limits(l0, l1) {
        if (Number.isFinite(l0) && Number.isFinite(l1)) {
            this._limit0 = l0;
            this._limit1 = l1;
        }
        return this;
    }
    isValid(value) {
        return (Number.isFinite(value)
            && (value - this._limit0) * (value - this._limit1) <= 0);
    }
    ticks(major, minor, stick2ticks) {
        this._majorTicks = major;
        this._minorTicks = minor;
        this._s2ticks = Boolean(stick2ticks);
        return this;
    }
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
    _t2v(t) {
        return this._limit0 + t * (this._limit1 - this._limit0);
    }
    _v2t(v) {
        return (v - this._limit0) / (this._limit1 - this._limit0);
    }
    _norm01(v, l0 = this._limit0, l1 = this._limit1) {
        return this._p.constrain(this._p.map(v, l0, l1, 0, 1), 0, 1);
    }
    _whereOver(px, py) {
        px -= 10;
        let ty = this._buffer.height / 2;
        let tx = this._t01 * (this._buffer.width - 20);
        if (Math.abs(tx - px) <= 8 && Math.abs(py - ty) <= 8) {
            return 1;
        }
        return 0;
    }
    _handleMouse(e) {
        let eventConsumed = false;
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x;
        let my = this._p.mouseY - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x;
        my = r.y;
        this._pover = this._over;
        this._over = this._whereOver(mx, my);
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip)
            this._tooltip._updateState(this._pover, this._over);
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
    _nearestTickT(p01) {
        let nbrTicks = this._minorTicks > 0
            ? this._minorTicks * this._majorTicks : this._majorTicks;
        return (nbrTicks > 0) ? Math.round(p01 * nbrTicks) / nbrTicks : p01;
    }
    _updateControlVisual() {
        let b = this._buffer;
        let cs = this._scheme || this._gui.scheme();
        let tw = b.width - 20, trackW = 8, thumbSize = 12, majorT = 10, minorT = 7;
        const OPAQUE = cs['COLOR_3'];
        const TICKS = cs['GREY_9'];
        const UNUSED_TRACK = cs['GREY_6'];
        const USED_TRACK = cs['GREY_1'];
        const HIGHLIGHT = cs['COLOR_14'];
        const THUMB = cs['COLOR_10'];
        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke();
            b.fill(OPAQUE);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        b.translate(10, b.height / 2);
        b.stroke(TICKS);
        b.strokeWeight(1);
        let n, dT;
        n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            dT = tw / n;
            for (let i = 0; i <= n; i++) {
                let tx = i * dT;
                b.line(tx, -minorT, tx, minorT);
            }
        }
        n = this._majorTicks;
        if (n >= 2) {
            dT = tw / n;
            for (let i = 0; i <= n; i++) {
                let tx = i * dT;
                b.line(tx, -majorT, tx, majorT);
            }
        }
        b.fill(UNUSED_TRACK);
        b.rect(0, -trackW / 2, tw, trackW);
        let tx = tw * this._t01;
        b.fill(USED_TRACK);
        b.rect(0, -trackW / 2, tx, trackW, this._c[0], this._c[1], this._c[2], this._c[3]);
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
        this._bufferInvalid = false;
    }
    _minControlSize() {
        return { w: this._w, h: 20 };
    }
}
class CvsRanger extends CvsSlider {
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 100, h || 20);
        this._t = [0.25, 0.75];
        this._tIdx = -1;
        this._t = [0.25, 0.75];
        this._tIdx = -1;
        this._limit0 = 0;
        this._limit1 = 1;
        this._opaque = false;
    }
    range(v0, v1) {
        if (Number.isFinite(v0) && Number.isFinite(v1)) {
            let t0 = this._norm01(Math.min(v0, v1));
            let t1 = this._norm01(Math.max(v0, v1));
            if (t0 >= 0 && t0 <= 1 && t1 >= 0 && t1 <= 1) {
                this._bufferInvalid = (this._t[0] != t0) || (this._t[1] != t1);
                this._t[0] = t0;
                this._t[1] = t1;
                return this;
            }
        }
        return { low: this._t2v(this._t[0]), high: this._t2v(this._t[1]) };
    }
    low() {
        return this._t2v(this._t[0]);
    }
    high() {
        return this._t2v(this._t[1]);
    }
    value(v) {
        console.warn('Ranger controls require 2 values - use range(v0, v1) instead');
        return undefined;
    }
    _whereOver(px, py) {
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
        return 0;
    }
    _handleMouse(e) {
        let eventConsumed = false;
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x;
        let my = this._p.mouseY - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x;
        my = r.y;
        this._pover = this._over;
        this._over = this._whereOver(mx, my);
        this._tIdx = this._active ? this._tIdx : this._over - 1;
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip)
            this._tooltip._updateState(this._pover, this._over);
        switch (e.type) {
            case 'mousedown':
                if (this._over > 0) {
                    this._active = true;
                    this._tIdx = this._over - 1;
                    this.invalidateBuffer();
                }
                break;
            case 'mouseout':
            case 'mouseup':
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
    _updateControlVisual() {
        let b = this._buffer;
        let cs = this._scheme || this._gui.scheme();
        let tw = b.width - 20;
        let trackW = 8, thumbSize = 12, majorT = 10, minorT = 7;
        const OPAQUE = cs['COLOR_3'];
        const TICKS = cs['GREY_9'];
        const UNUSED_TRACK = cs['GREY_6'];
        const USED_TRACK = cs['GREY_1'];
        const HIGHLIGHT = cs['COLOR_14'];
        const THUMB = cs['COLOR_10'];
        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke();
            b.fill(OPAQUE);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        b.translate(10, b.height / 2);
        b.stroke(TICKS);
        b.strokeWeight(1);
        let n, dT;
        n = this._majorTicks * this._minorTicks;
        if (n >= 2) {
            dT = tw / n;
            for (let i = 0; i <= n; i++) {
                let tx = i * dT;
                b.line(tx, -minorT, tx, minorT);
            }
        }
        n = this._majorTicks;
        if (n >= 2) {
            dT = tw / this._majorTicks;
            for (let i = 0; i <= n; i++) {
                let tx = i * dT;
                b.line(tx, -majorT, tx, majorT);
            }
        }
        b.fill(UNUSED_TRACK);
        b.rect(0, -trackW / 2, tw, trackW);
        let tx0 = tw * Math.min(this._t[0], this._t[1]);
        let tx1 = tw * Math.max(this._t[0], this._t[1]);
        b.fill(USED_TRACK);
        b.rect(tx0, -trackW / 2, tx1 - tx0, trackW, this._c[0], this._c[1], this._c[2], this._c[3]);
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
        this._bufferInvalid = false;
    }
}
class CvsText extends CvsBufferedControl {
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
        this._lines = [];
        this._textSize = undefined;
        this._textAlign = this._p.CENTER;
        this._tbox = { w: 0, h: 0 };
        this._gap = 2;
    }
    text(t, align) {
        if (!t)
            return this._lines.join('\n');
        if (Array.isArray(t))
            this._lines = t.map(x => x.toString());
        else {
            let lines = t.toString().split('\n');
            this._lines = lines.map(x => x.toString());
        }
        this.textAlign(align);
        let s = this._minControlSize();
        this._w = Math.max(this._w, s.w);
        this._h = Math.max(this._h, s.h);
        this.invalidateBuffer();
        return this;
    }
    textAlign(align) {
        if (align && (align == this._p.LEFT || align == this._p.CENTER || align == this._p.RIGHT)) {
            this._textAlign = align;
            this.invalidateBuffer();
        }
        return this;
    }
    noText() {
        this._lines = [];
        this._tbox = { w: 0, h: 0 };
        this.invalidateBuffer();
        return this;
    }
    textSize(lts) {
        lts = Number(lts);
        let ts = this._textSize || this._gui.textSize();
        if (Number.isNaN(lts) || lts == 0)
            return ts;
        if (lts != ts) {
            this._textSize = lts;
            let s = this._minControlSize();
            this._w = Math.max(this._w, s.w);
            this._h = Math.max(this._h, s.h);
            this.invalidateBuffer();
        }
        return this;
    }
    _minControlSize() {
        let b = this._buffer;
        let lines = this._lines;
        let ts = this._textSize || this._gui.textSize();
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
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
class CvsTextIcon extends CvsText {
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
        this._icon = undefined;
        this._iconAlign = this._p.LEFT;
    }
    icon(i, align) {
        if (!i)
            return this._icon;
        this._icon = i;
        if (align && (align == this._p.LEFT || align == this._p.RIGHT))
            this._iconAlign = align;
        let s = this._minControlSize();
        this._w = Math.max(this._w, s.w);
        this._h = Math.max(this._h, s.h);
        this.invalidateBuffer();
        return this;
    }
    iconAlign(align) {
        if (align && (align == this._p.LEFT || align == this._p.RIGHT)) {
            this._iconAlign = align;
            let s = this._minControlSize();
            this._w = Math.max(this._w, s.w);
            this._h = Math.max(this._h, s.h);
            this.invalidateBuffer();
        }
        return this;
    }
    noIcon() {
        if (this._icon) {
            this._icon = undefined;
            this.invalidateBuffer();
        }
        return this;
    }
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
class CvsButton extends CvsTextIcon {
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
    }
    _updateControlVisual() {
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
            if (lines.length == 0)
                px = (this._w - icon.width) / 2;
            py = (this._h - icon.height) / 2;
            b.image(this._icon, px, py);
        }
        if (lines.length > 0) {
            b.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
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
        this._bufferInvalid = false;
        if (this._parent instanceof CvsPane)
            this._parent.validateTabs();
    }
    _handleMouse(e) {
        let eventConsumed = false;
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x;
        let my = this._p.mouseY - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x;
        my = r.y;
        this._pover = this._over;
        this._over = this._whereOver(mx, my);
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip)
            this._tooltip._updateState(this._pover, this._over);
        switch (e.type) {
            case 'mousedown':
                if (this._over > 0) {
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
class CvsCheckbox extends CvsText {
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 18);
        this._selected = false;
        this._iconAlign = this._p.LEFT;
        this._textAlign = this._p.LEFT;
    }
    iconAlign(align) {
        if (!align)
            return this._iconAlign;
        if (align == this._p.LEFT || align == this._p.RIGHT) {
            this._iconAlign = align;
            this.invalidateBuffer();
        }
        return this;
    }
    select() {
        if (!this._selected) {
            this._selected = true;
            this.invalidateBuffer();
        }
        return this;
    }
    deselect() {
        if (this._selected) {
            this._selected = false;
            this.invalidateBuffer();
        }
        return this;
    }
    isSelected() {
        return this._selected;
    }
    _handleMouse(e) {
        let eventConsumed = false;
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x;
        let my = this._p.mouseY - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x;
        my = r.y;
        this._pover = this._over;
        this._over = this._whereOver(mx, my);
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip)
            this._tooltip._updateState(this._pover, this._over);
        switch (e.type) {
            case 'mousedown':
                if (this._over > 0) {
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
    _updateControlVisual() {
        let ts = this._textSize || this._gui.textSize();
        let cs = this._scheme || this._gui.scheme();
        let b = this._buffer;
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
            b.noStroke();
            b.fill(BACK);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
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
        this._bufferInvalid = false;
    }
    _minControlSize() {
        let b = this._buffer;
        let lines = this._lines;
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
        let ts = this._textSize || this._gui.textSize();
        let isize = this._p.constrain(Number(ts) * 0.7, 12, 16);
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
class CvsOptionGroup {
    constructor(name) {
        this._name = name;
        this._group = new Set();
    }
    add(option) {
        if (option.isSelected()) {
            for (let opt of this._group) {
                opt._deselect();
            }
        }
        this._group.add(option);
    }
    remove(option) {
        this._group.delete(option);
    }
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
class CvsOption extends CvsText {
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 100, h || 18);
        this._selected = false;
        this._optGroup = null;
        this._iconAlign = this._p.LEFT;
        this._textAlign = this._p.LEFT;
    }
    iconAlign(align) {
        if (!align)
            return this._iconAlign;
        if (align == this._p.LEFT || align == this._p.RIGHT) {
            this._iconAlign = align;
            this.invalidateBuffer();
        }
        return this;
    }
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
    _deselect() {
        this._selected = false;
        return this;
    }
    isSelected() {
        return this._selected;
    }
    group(optGroupName) {
        this._optGroup = this._gui.getOptionGroup(optGroupName);
        this._optGroup.add(this);
        return this;
    }
    _handleMouse(e) {
        let eventConsumed = false;
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x;
        let my = this._p.mouseY - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x;
        my = r.y;
        this._pover = this._over;
        this._over = this._whereOver(mx, my);
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip)
            this._tooltip._updateState(this._pover, this._over);
        switch (e.type) {
            case 'mousedown':
                if (this._over > 0) {
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
        let BACK = cs['COLOR_3'];
        let FORE = cs['COLOR_13'];
        let HIGHLIGHT = cs['COLOR_14'];
        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke();
            b.fill(BACK);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
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
        this._bufferInvalid = false;
    }
    _minControlSize() {
        let b = this._buffer;
        let lines = this._lines;
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
        let ts = this._textSize || this._gui.textSize();
        let isize = this._p.constrain(Number(ts) * 0.7, 12, 16);
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
class CvsLabel extends CvsTextIcon {
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 60, h || 16);
    }
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
        let OPAQUE = cs['COLOR_4'];
        let FORE = cs['COLOR_13'];
        b.push();
        b.clear();
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
            if (lines.length == 0)
                px = (this._w - icon.width) / 2;
            py = (this._h - icon.height + gap) / 2;
            b.image(this._icon, px, py);
        }
        if (lines.length > 0) {
            b.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
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
        this._bufferInvalid = false;
    }
}
class CvsTooltip extends CvsText {
    constructor(gui, name) {
        super(gui, name);
        this._gap = 1;
        this._visible = false;
        this._showTime = 0;
    }
    text(t) {
        if (Array.isArray(t))
            this._lines = t;
        else {
            let lines = t.toString().split('\n');
            this._lines = [];
            for (let line of lines)
                this._lines.push(line);
        }
        let s = this._minControlSize();
        this._w = Math.max(this._w, s.w);
        this._h = Math.max(this._h, s.h);
        this.invalidateBuffer();
        return this;
    }
    showTime(duration) {
        this._showTime = duration;
        return this;
    }
    _updateState(prevOver, currOver) {
        if (prevOver != currOver)
            if (currOver > 0) {
                this.show();
                setTimeout(() => { this.hide(); }, this._showTime);
            }
    }
    _validatePosition() {
        let p = this._parent;
        let pp = p.getAbsXY(), px = pp.x, py = pp.y;
        let pa = p.orientation().wh(p.w(), p.h()), ph = pa.h;
        this._x = 0, this._y = -this._h;
        if (py + this._y < 0)
            this._y += this._h + ph;
        if (px + this._x + this._w > this._gui.canvasWidth())
            this._x -= this._w - pa.w;
    }
    _updateControlVisual() {
        let ts = this._textSize || this._gui.tipTextSize();
        let cs = this._scheme || this._gui.scheme();
        let b = this._buffer;
        let lines = this._lines;
        let gap = this._gap;
        let BACK = cs['COLOR_4'];
        let FORE = cs['COLOR_13'];
        b.push();
        b.clear();
        b.stroke(FORE);
        b.fill(BACK);
        b.rect(0, 0, this._w - 1, this._h - 1);
        b.fill(FORE).noStroke();
        if (lines.length > 0) {
            b.textSize(ts);
            let x0 = gap, x1 = this._w - gap, sx = 0;
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
        this._bufferInvalid = false;
    }
    _minControlSize() {
        let b = this._buffer;
        let lines = this._lines;
        let ts = this._textSize || this._gui.tipTextSize();
        let tbox = this._tbox;
        let sw = 0, sh = 0, gap = this._gap;
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
class CvsScroller extends CvsBufferedControl {
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 100, h || 20);
        this._value = 0.5;
        this._dvalue = 0.5;
        this._used = 0.1;
        this._s_value = 0.5;
        this._s_dvalue = 0.5;
        this._s_mx = 0.5;
        this._minV = this._used / 2;
        this._maxV = 1 - this._used / 2;
        this._BORDER = 10;
        this._THEIGHT = 8;
        this._THUMB_HEIGHT = 12;
        this._MIN_THUMB_WIDTH = 10;
        this._TLENGTH = this._w - 3 * this._BORDER;
        this._c = gui.corners();
        this._opaque = false;
    }
    update(v, u) {
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
    _whereOver(px, py) {
        let tx = this._BORDER + this._dvalue * this._TLENGTH;
        let ty = this._h / 2;
        let thumbSizeX = Math.max(this._used * this._TLENGTH, this._MIN_THUMB_WIDTH);
        if (Math.abs(tx - px) <= thumbSizeX / 2 && Math.abs(ty - py) <= this._THUMB_HEIGHT / 2) {
            return 1;
        }
        return 0;
    }
    _handleMouse(e) {
        let eventConsumed = false;
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x;
        let my = this._p.mouseY - pos.y;
        let r = this._orientation.xy(mx, my, this._w, this._h);
        mx = r.x;
        my = r.y;
        this._pover = this._over;
        this._over = this._whereOver(mx, my);
        if (this._pover != this._over)
            this.invalidateBuffer();
        if (this._tooltip)
            this._tooltip._updateState(this._pover, this._over);
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
    _updateControlVisual() {
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
            b.noStroke();
            b.fill(OPAQUE);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        b.translate(this._BORDER, b.height / 2);
        b.fill(UNUSED_TRACK);
        b.stroke(TICKS);
        b.strokeWeight(1);
        b.rect(0, -this._THEIGHT / 2, this._TLENGTH, this._THEIGHT);
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
        this._bufferInvalid = false;
    }
    _minControlSize() {
        return { w: this._w, h: 20 };
    }
}
class CvsViewer extends CvsBufferedControl {
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h);
        this._layers = [];
        this._hidden = new Set();
        this._lw = 0;
        this._lh = 0;
        this._wcx = 0;
        this._wcy = 0;
        this._wscale = 1;
        this._usedX = 0;
        this._usedY = 0;
        this._o = { valid: false };
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
    scaler(v, l0, l1) {
        if (Number.isFinite(v) && Number.isFinite(l0) && Number.isFinite(l1)) {
            let low = Math.min(l0, l1);
            let high = Math.max(l0, l1);
            let value = this._p.constrain(v, low, high);
            if (!this._scaler) {
                this._scaler = this._gui.slider(this._name + "-scaler", 0.25 * this._w, 0.5 * this._h - 10, 0.5 * this._w, 20)
                    .hide()
                    .setAction((info) => {
                    this.scale(info.value);
                    this.invalidateBuffer();
                });
                this.addChild(this._scaler);
            }
            this._scaler.limits(low, high);
            this._scaler.value(value);
            this._wscale = value;
            if (this._lw > 0 && this._lh > 0) {
                this._wcx = this._lw * this._scrH.getValue();
                this._wcy = this._lh * this._scrV.getValue();
                this.invalidateBuffer();
            }
        }
        return this;
    }
    scale(v) {
        if (!Number.isFinite(v))
            return this._wscale;
        if (this._scaler)
            this._scaler.value(v);
        this._wscale = v;
        this.view(this._wcx, this._wcy, this._wscale);
        this.invalidateBuffer();
        return this;
    }
    status() {
        return { cX: this._wcx, cY: this._wcy, scale: this._wscale };
    }
    hide() {
        return super.hide(true);
    }
    show() {
        return super.show(true);
    }
    hideLayer(n) {
        if (Number.isInteger(n))
            if (n >= 0 && n < this._layers.length && !this._hidden.has(n)) {
                this._hidden.add(n);
                this.invalidateBuffer();
            }
        return this;
    }
    showLayer(n) {
        if (Number.isInteger(n))
            if (n >= 0 && n < this._layers.length && this._hidden.has(n)) {
                this._hidden.delete(n);
                this.invalidateBuffer();
            }
        return this;
    }
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
    layers(img) {
        if (Array.isArray(img))
            this._layers = Array.from(img);
        else
            this._layers[0] = img;
        let lw = this._lw = this._layers[0].width;
        let lh = this._lh = this._layers[0].height;
        for (let idx = 1; idx < this._layers[idx]; idx++) {
            let l = this._layers[idx];
            if (l.width != lw || l.height != lh)
                l.resize(lw, lh);
        }
        this._wcx = this._scrH.getValue() * this._lw;
        this._wcy = this._scrV.getValue() * this._lh;
        this.invalidateBuffer();
        return this;
    }
    _handleMouse(e) {
        let eventConsumed = false;
        let pos = this.getAbsXY();
        let mx = this._p.mouseX - pos.x;
        let my = this._p.mouseY - pos.y;
        this._pover = this._over;
        this._over = this._whereOver(mx, my);
        this._bufferInvalid = this._bufferInvalid || (this._pover != this._over);
        if (this._tooltip)
            this._tooltip._updateState(this._pover, this._over);
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
        switch (e.type) {
            case 'mousedown':
                if (this._over == 1) {
                    this._clickAllowed = false;
                    this._dragging = true;
                    this._active = true;
                    this.invalidateBuffer();
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
                if (this._active) {
                    this._dragging = false;
                    this._active = false;
                    this.invalidateBuffer();
                }
                break;
            case 'mousemove':
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
        return eventConsumed;
    }
    _validateMouseDrag(ncx, ncy) {
        let ww2 = Math.round(0.5 * this._w / this._wscale);
        let wh2 = Math.round(0.5 * this._h / this._wscale);
        let cleft = this._wcx - ww2, cright = this._wcx + ww2;
        let ctop = this._wcy - wh2, cbottom = this._wcy + wh2;
        let pinnedH = (cleft < 0 && cright > this._lw);
        let pinnedV = (ctop < 0 && cbottom > this._lh);
        let left = ncx - ww2, right = ncx + ww2;
        let top = ncy - wh2, bottom = ncy + wh2;
        if (pinnedH || left < 0 && right > this._lw)
            ncx = this._lw / 2;
        else if (this._xor(left < 0, right > this._lw))
            if (left < 0)
                ncx -= left;
            else
                ncx += this._lw - right;
        if (pinnedV || top < 0 && bottom > this._lh)
            ncy = this._lh / 2;
        else if (this._xor(top < 0, bottom > this._lh))
            if (top < 0)
                ncy -= top;
            else
                ncy += this._lh - bottom;
        this.view(ncx, ncy);
        this.invalidateBuffer();
    }
    _xor(a, b) {
        return (a || b) && !(a && b);
    }
    _updateControlVisual() {
        let b = this._buffer;
        let cs = this._scheme || this._gui.scheme();
        b.background(cs['GREY_5']);
        let wscale = this._wscale;
        let wcx = this._wcx;
        let wcy = this._wcy;
        let ww2 = Math.round(0.5 * this._w / wscale);
        let wh2 = Math.round(0.5 * this._h / wscale);
        this._o = this._overlap(0, 0, this._lw, this._lh, wcx - ww2, wcy - wh2, wcx + ww2, wcy + wh2);
        if (this._o.valid) {
            let o = this._o;
            let view;
            for (let i = 0, len = this._layers.length; i < len; i++) {
                if (!this._hidden.has(i) && this._layers[i]) {
                    view = this._layers[i].get(o.left, o.top, o.width, o.height);
                    if (Math.abs(wscale - 1) > 0.01)
                        view.resize(Math.round(wscale * o.width), Math.round(wscale * o.height));
                    b.image(view, o.offsetX * wscale, o.offsetY * wscale, view.width, view.height);
                }
            }
        }
    }
    _overlap(ax0, ay0, ax1, ay1, bx0, by0, bx1, by1) {
        let topA = Math.min(ay0, ay1);
        let botA = Math.max(ay0, ay1);
        let leftA = Math.min(ax0, ax1);
        let rightA = Math.max(ax0, ax1);
        let topB = Math.min(by0, by1);
        let botB = Math.max(by0, by1);
        let leftB = Math.min(bx0, bx1);
        let rightB = Math.max(bx0, bx1);
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
        this._scrH.update(undefined, width / this._lw);
        this._scrV.update(undefined, height / this._lh);
        return {
            valid: true,
            left: leftO, right: rightO, top: topO, bottom: botO,
            width: width, height: height,
            offsetX: offsetX, offsetY: offsetY,
        };
    }
    _whereOver(px, py) {
        if (px > this._w - 20 && px < this._w && py > 0 && py < this._h - 20)
            return 3;
        if (px > 0 && px < this._w - 20 && py > this._h - 20 && py < this._h)
            return 3;
        let w = this._w, w0 = 0.2 * w, w1 = 0.8 * w;
        let h = this._h, h0 = 0.35 * h, h1 = 0.65 * h;
        if (this._scaler && px > w0 && px < w1 && py > h0 && py < h1)
            return 2;
        if (px > 0 && px < w && py > 0 && py < h)
            return 1;
        return 0;
    }
    shrink(dim) {
        console.warn("Cannot change 'shrink' a viewer");
        return this;
    }
    orient(dir) {
        console.warn(`Cannot change orientation of a viewer to ${dir}`);
        return this;
    }
    _minControlSize() {
        return { w: this._w, h: this._h };
    }
}
class CvsPane extends CvsBaseControl {
    constructor(gui, name, x, y, w, h) {
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
    parent(p, rx, ry) {
        console.warn('Panes cannot have a parent');
        return undefined;
    }
    leaveParent() {
        console.warn('Panes cannot have a parent');
        return undefined;
    }
    depth() {
        return this._depth;
    }
    close() {
        switch (this._status) {
            case "opening":
                clearInterval(this._timer);
            case "open":
                this._timer = setInterval(() => { this._closing(); }, CvsPane._dI);
                this._status = 'closing';
                this.action({ source: this, p5Event: undefined, state: 'closed' });
                break;
        }
        return this;
    }
    isClosed() {
        return this._status == 'closed';
    }
    isClosing() {
        return this._status == 'closing';
    }
    open() {
        switch (this._status) {
            case "closing":
                clearInterval(this._timer);
            case "closed":
                this._gui._closeAll();
                this._timer = setInterval(() => { this._opening(); }, CvsPane._dI);
                this._status = 'opening';
                this.action({ source: this, p5Event: undefined, state: 'open' });
                break;
        }
    }
    isOpen() {
        return this._status == 'open';
    }
    isOpening() {
        return this._status == 'opening';
    }
    _tabAction(ta) {
        let pane = ta.source._parent;
        switch (pane._status) {
            case 'open':
                pane.close();
                break;
            case 'closed':
                pane.open();
                break;
            case 'opening':
                break;
            case 'closing':
                break;
        }
    }
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
            if (c._visible)
                c._renderWEBGL();
        p.pop();
    }
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
            if (c._visible)
                c._renderP2D();
        p.pop();
    }
    text(t, align) {
        this.tab().text(t, align);
        return this;
    }
    noText() {
        this.tab().noText();
        return this;
    }
    icon(i, align) {
        this.tab().icon(i, align);
        return this;
    }
    noIcon() {
        this.tab().noIcon();
        return this;
    }
    textSize(ts) {
        this.tab().textSize(ts);
        return this;
    }
    shrink(dim) {
        return this.tab().shrink();
    }
    isActive() {
        return this.tab()._active;
    }
    opaque(dim) {
        console.warn("This method is not applicable to a pane");
        return this;
    }
    transparent(dim) {
        console.warn("This methis is not applicable to a pane");
        return this;
    }
    orient(dir) {
        console.warn(`Cannot change orientation of a pane}`);
        return this;
    }
    tab() {
        return this._children[0];
    }
    enable() {
        this.tab().enable();
        return this;
    }
    disable() {
        this.close();
        this.tab().disable();
        return this;
    }
    hide() {
        this.close();
        this.tab().hide();
        return this;
    }
    show() {
        this.tab().show();
        return this;
    }
    _minControlSize() {
        return { w: this._w, h: this._h };
    }
}
CvsPane._dI = 20;
CvsPane._dC = 40;
CvsPane._dO = 20;
CvsPane._wExtra = 20;
CvsPane._tabID = 1;
class CvsPaneNorth extends CvsPane {
    constructor(gui, name, depth) {
        super(gui, name, 0, -depth, gui.canvasWidth(), depth);
        this._depth = depth;
        this._status = 'closed';
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
        if (py > 0) {
            py = 0;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._y = py;
    }
    _closing() {
        let py = this._y - CvsPane._dC;
        if (py < -this._depth) {
            py = -this._depth;
            clearInterval(this._timer);
            this._status = 'closed';
        }
        this._y = py;
    }
    validateTabs() {
        this._gui.validateTabsNorth();
        return this;
    }
}
class CvsPaneSouth extends CvsPane {
    constructor(gui, name, depth) {
        super(gui, name, 0, gui.canvasHeight(), gui.canvasWidth(), depth);
        this._depth = depth;
        this._status = 'closed';
        let tab = this._tab = this._gui.button('Tab ' + CvsPane._tabID++);
        tab.text(tab._name).setAction(this._tabAction);
        let s = tab._minControlSize();
        tab._w = s.w + CvsPane._wExtra;
        tab._c = [this._cornerRadius, this._cornerRadius, 0, 0];
        this.addChild(tab);
        this._gui._panesSouth.push(this);
        this._gui.validateTabsSouth();
    }
    _opening() {
        let py = this._y - CvsPane._dO;
        if (py < this._gui.canvasHeight() - this._depth) {
            py = this._gui.canvasHeight() - this._depth;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._y = py;
    }
    _closing() {
        let py = this._y + CvsPane._dC;
        if (py > this._gui.canvasHeight()) {
            py = this._gui.canvasHeight();
            clearInterval(this._timer);
            this._status = 'closed';
        }
        this._y = py;
    }
    validateTabs() {
        this._gui.validateTabsSouth();
        return this;
    }
}
class CvsPaneEast extends CvsPane {
    constructor(gui, name, depth) {
        super(gui, name, gui.canvasWidth(), 0, depth, gui.canvasHeight());
        this._depth = depth;
        this._status = 'closed';
        let tab = this._tab = this._gui.button('Tab ' + CvsPane._tabID++);
        tab.text(tab._name)
            .orient('north')
            .setAction(this._tabAction);
        let s = tab._minControlSize();
        tab._w = s.w + CvsPane._wExtra;
        tab._c = [this._cornerRadius, this._cornerRadius, 0, 0];
        this.addChild(tab);
        this._gui._panesEast.push(this);
        this._gui.validateTabsEast();
    }
    _opening() {
        let px = this._x - CvsPane._dO;
        if (px < this._gui.canvasWidth() - this._depth) {
            px = this._gui.canvasWidth() - this._depth;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._x = px;
    }
    _closing() {
        let px = this._x + CvsPane._dC;
        if (px > this._gui.canvasWidth()) {
            px = this._gui.canvasWidth();
            clearInterval(this._timer);
            this._status = 'closed';
        }
        this._x = px;
    }
    validateTabs() {
        this._gui.validateTabsEast();
        return this;
    }
}
class CvsPaneWest extends CvsPane {
    constructor(gui, name, depth) {
        super(gui, name, -depth, 0, depth, gui.canvasHeight());
        this._depth = depth;
        this._status = 'closed';
        let tab = this._tab = this._gui.button('Tab ' + CvsPane._tabID++);
        tab.text(tab._name)
            .orient('south')
            .setAction(this._tabAction);
        let s = tab._minControlSize();
        tab._w = s.w + CvsPane._wExtra;
        tab._c = [this._cornerRadius, this._cornerRadius, 0, 0];
        this.addChild(tab);
        this._gui._panesWest.push(this);
        this._gui.validateTabsWest();
    }
    _opening() {
        let px = this._x + CvsPane._dO;
        if (px > 0) {
            px = 0;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._x = px;
    }
    _closing() {
        let px = this._x - CvsPane._dC;
        if (px < -this._depth) {
            px = -this._depth;
            clearInterval(this._timer);
            this._status = 'closed';
        }
        this._x = px;
    }
    validateTabs() {
        this._gui.validateTabsWest();
        return this;
    }
}
//# sourceMappingURL=canvas_gui.js.map