;
;
;
;
;
class North {
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
class South {
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
class East {
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
class West {
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
class GObject {
    constructor(gui, name, x, y, w, h) {
        this._x = 0;
        this._y = 0;
        this._w = 0;
        this._h = 0;
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
        this._orientation = GObject.EAST;
        this._dragging = false;
        this._bufferInvalid = true;
        this._over = 0;
        this._pover = 0;
        this._clickAllowed = false;
        this._c = gui.corners(undefined);
        this._active = false;
        this._opaque = true;
        this.setAction((info) => {
            console.warn(`No action set for control '${info === null || info === void 0 ? void 0 : info.source._name}`);
        });
    }
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
    scheme(ls, cascade) {
        if (ls) {
            this._scheme = this._gui.getScheme(ls);
            this._bufferInvalid = true;
            if (cascade)
                for (let c of this._children)
                    c.scheme(ls, cascade);
            return this;
        }
        return this._scheme;
    }
    addChild(c, rx, ry) {
        let control = this._gui.getControl(c);
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
        let control = this._gui.getControl(c);
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
    parent(parent, rx, ry) {
        if (parent)
            parent.addChild(this, rx, ry);
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
                this._orientation = GObject.NORTH;
                break;
            case 'south':
                this._orientation = GObject.SOUTH;
                break;
            case 'west':
                this._orientation = GObject.WEST;
                break;
            case 'east':
            default:
                this._orientation = GObject.EAST;
                break;
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
        this._enabled = true;
        if (cascade)
            for (let c of this._children)
                c.enable(cascade);
        return this;
    }
    disable(cascade) {
        if (this._enabled) {
            this._enabled = false;
            this._bufferInvalid = true;
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
        this._bufferInvalid = true;
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
            this._bufferInvalid = true;
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
        b.fill(cs.black1);
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
GObject.NORTH = new North();
GObject.SOUTH = new South();
GObject.EAST = new East();
GObject.WEST = new West();
class GControl extends GObject {
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
        if (tt instanceof GTooltip) {
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
class GSlider extends GControl {
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
    ticks(major, minor, stick2ticks) {
        this._majorTicks = major;
        this._minorTicks = minor;
        this._s2ticks = Boolean(stick2ticks);
        return this;
    }
    value(v) {
        if (Number.isFinite(v)) {
            if ((v - this._limit0) * (v - this._limit1) <= 0) {
                this._bufferInvalid = true;
                this._t01 = this._norm01(v);
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
                    this._bufferInvalid = true;
                }
                break;
            case 'mouseout':
            case 'mouseup':
                if (this._active) {
                    this.action({ source: this, p5Event: e, value: this.value(), final: true });
                    this._active = false;
                    this._bufferInvalid = true;
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
                    this._bufferInvalid = true;
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
        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke();
            b.fill(cs.back7);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        b.translate(10, b.height / 2);
        b.stroke(cs.track_border);
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
        b.fill(cs.track_back);
        b.rect(0, -trackW / 2, tw, trackW);
        let tx = tw * this._t01;
        b.fill(cs.track_fore);
        b.rect(0, -trackW / 2, tx, trackW, this._c[0], this._c[1], this._c[2], this._c[3]);
        b.fill(cs.thumb);
        b.noStroke();
        if (this._active || this._over > 0) {
            b.strokeWeight(2);
            b.stroke(cs.highlight);
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
class GRanger extends GSlider {
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 100, h || 20);
        this._t = [0.25, 0.75];
        this._tIdx = -1;
        this._limit0 = 0;
        this._limit1 = 1;
        this._opaque = false;
    }
    range(v0, v1) {
        if (!v0 || !v1)
            return { low: Math.min(v0, v1), high: Math.max(v0, v1) };
        let t0 = this._norm01(v0);
        let t1 = this._norm01(v1);
        this._bufferInvalid = (this._t[0] != t0) || (this._t[1] != t1);
        this._t[0] = Math.min(t0, t1);
        this._t[1] = Math.max(t0, t1);
        return this;
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
                    this._bufferInvalid = true;
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
                    this._bufferInvalid = true;
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
                    this._bufferInvalid = true;
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
        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke();
            b.fill(cs.back7);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        b.translate(10, b.height / 2);
        b.stroke(cs.track_border);
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
        b.fill(cs.track_back);
        b.rect(0, -trackW / 2, tw, trackW);
        let tx0 = tw * Math.min(this._t[0], this._t[1]);
        let tx1 = tw * Math.max(this._t[0], this._t[1]);
        b.fill(cs.track_fore);
        b.rect(tx0, -trackW / 2, tx1 - tx0, trackW, this._c[0], this._c[1], this._c[2], this._c[3]);
        for (let tnbr = 0; tnbr < 2; tnbr++) {
            b.fill(cs.thumb);
            b.noStroke();
            if ((this._active || this._over > 0) && tnbr == this._tIdx) {
                b.strokeWeight(2);
                b.stroke(cs.highlight);
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
class GText extends GControl {
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
        this._lines = [];
        this._textSize = undefined;
        this._textAlign = this._p.CENTER;
        this._tbox = { w: 0, h: 0 };
        this._gap = 2;
    }
    text(t, align) {
        if (t == undefined)
            return { text: this._text, icon: undefined };
        if (Array.isArray(t))
            this._lines = t;
        else {
            let lines = t.toString().split('\n');
            this._lines = [];
            for (let line of lines)
                this._lines.push(line);
        }
        this.textAlign(align);
        let s = this._minControlSize();
        this._w = Math.max(this._w, s.w);
        this._h = Math.max(this._h, s.h);
        this._bufferInvalid = true;
        return this;
    }
    textAlign(align) {
        if (align && (align == this._p.LEFT || align == this._p.CENTER || align == this._p.RIGHT))
            this._textAlign = align;
        return this;
    }
    noText() {
        this._lines = [];
        this._textAlign = this._p.CENTER;
        this._tbox = { w: 0, h: 0 };
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
            this._bufferInvalid = true;
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
class GTextIcon extends GText {
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 80, h || 16);
        this._icon = undefined;
        this._iconAlign = this._p.LEFT;
    }
    icon(i, align) {
        if (!i)
            return { text: this._text, icon: this._icon };
        this._icon = i;
        if (align && (align == this._p.LEFT || align == this._p.RIGHT))
            this._iconAlign = align;
        let s = this._minControlSize();
        this._w = Math.max(this._w, s.w);
        this._h = Math.max(this._h, s.h);
        this._bufferInvalid = true;
        return this;
    }
    noIcon() {
        this._icon = undefined;
        this._iconAlign = this._p.LEFT;
        this._bufferInvalid = true;
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
class GButton extends GTextIcon {
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
        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke();
            b.fill(cs.back);
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
            b.fill(cs.fore);
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
            b.stroke(cs.highlight);
            b.strokeWeight(2);
            b.noFill();
            b.rect(1, 1, this._w - 2, this._h - 2, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        if (!this._enabled)
            this._disable_hightlight(b, cs, 0, 0, this._w, this._h);
        b.pop();
        b.updatePixels();
        this._bufferInvalid = false;
        if (this._parent instanceof GPane)
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
                    this._bufferInvalid = true;
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
                    this._bufferInvalid = true;
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
class GCheckbox extends GText {
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
            this._bufferInvalid = true;
        }
        return this;
    }
    select() {
        if (!this._selected) {
            this._selected = true;
            this._bufferInvalid = true;
        }
        return this;
    }
    deselect() {
        if (this._selected) {
            this._selected = false;
            this._bufferInvalid = true;
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
                    this._bufferInvalid = true;
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
                    this._bufferInvalid = true;
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
        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke();
            b.fill(cs.back7);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        b.push();
        let px = (iconAlign == this._p.RIGHT) ? this._w - gap - isize / 2 : gap + isize / 2;
        b.translate(px, b.height / 2);
        b.stroke(cs.fore);
        b.fill(cs.white);
        b.strokeWeight(1.5);
        b.rect(-isize / 2, -isize / 2, isize, isize, 3);
        if (this._selected) {
            b.stroke(cs.fore);
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
            b.fill(cs.fore);
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
            b.stroke(cs.highlight);
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
class GOptionGroup {
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
class GOption extends GText {
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
            this._bufferInvalid = true;
        }
        return this;
    }
    select() {
        var _a;
        let curr = (_a = this._optGroup) === null || _a === void 0 ? void 0 : _a._prev();
        if (curr) {
            curr._selected = false;
            curr._bufferInvalid = true;
        }
        this._selected = true;
        this._bufferInvalid = true;
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
                    this._bufferInvalid = true;
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
                this._bufferInvalid = true;
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
        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke();
            b.fill(cs.back7);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        b.push();
        let px = (iconAlign == p.RIGHT) ? this._w - gap - isize / 2 : gap + isize / 2;
        b.translate(px, b.height / 2);
        b.stroke(cs.fore);
        b.fill(cs.white);
        b.strokeWeight(1.5);
        b.ellipse(0, 0, isize, isize);
        if (this._selected) {
            b.fill(cs.fore);
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
            b.fill(cs.fore);
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
            b.stroke(cs.highlight);
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
class GLabel extends GTextIcon {
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
        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke();
            b.fill(cs.back7);
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
            b.fill(cs.fore);
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
class GTooltip extends GText {
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
        this._bufferInvalid = true;
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
        b.push();
        b.clear();
        b.stroke(cs.ttfore);
        b.fill(cs.ttback);
        b.rect(0, 0, this._w - 1, this._h - 1);
        b.fill(cs.ttfore).noStroke();
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
class GScroller extends GControl {
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x || 0, y || 0, w || 100, h || 20);
        this._updateTrackInfo();
        this._capacity = 1;
        this._used = 0.3;
        this._minV = this._used / 2;
        this._maxV = 1 - this._used / 2;
        this._value = 0.5;
        this._c = gui.corners();
        this._opaque = true;
        this._mdelta = 0;
        this._mx0 = 0;
        this._mx1 = 0;
        this._my0 = 0;
        this._my1 = 0;
    }
    _updateTrackInfo() {
        this._BORDER = 10;
        this._TLENGTH = this._w - 2 * this._BORDER;
        this._THEIGHT = 10;
    }
    value(v) {
        if (!Number.isFinite(v))
            return this._value * this._capacity;
        let value = v / this._capacity;
        this._validateValue(value);
        return this;
    }
    used(u) {
        if (!Number.isFinite(u))
            return this._used * this._capacity;
        let used = u / this._capacity;
        used = this._p.constrain(used, 0, 1);
        this._bufferInvalid = this._bufferInvalid || this._neq(used, this._used);
        this._used = used;
        this._minV = this._used / 2;
        this._maxV = 1 - this._used / 2;
        this._used >= 1 ? this.hide() : this.show();
        this._validateValue(this._value);
        return this;
    }
    _validateValue(value) {
        value = this._p.constrain(value, this._minV, this._maxV);
        let changed = value != this._value;
        if (changed) {
            this._value = value;
            this.action({ source: this, value: this.value(), final: true });
            this._bufferInvalid = true;
        }
    }
    capacity(c) {
        if (!Number.isFinite(c))
            return this._capacity;
        this._capacity = c;
        this._bufferInvalid = this._bufferInvalid || this._neq(c, this._capacity);
        return this;
    }
    _whereOver(px, py) {
        let tx = this._BORDER + this._value * this._TLENGTH;
        let ty = this._h / 2;
        let thumbSizeX = Math.max(this._used * this._TLENGTH, 12);
        if (Math.abs(tx - px) <= thumbSizeX / 2 && Math.abs(ty - py) <= this._THEIGHT / 2) {
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
                    this._bufferInvalid = true;
                    this._mdelta = mx - (this._value * this._TLENGTH + this._BORDER);
                }
                break;
            case 'mouseout':
            case 'mouseup':
                if (this._active) {
                    this.action({ source: this, p5Event: e, value: this.value(), final: true });
                    this._active = false;
                    this._bufferInvalid = true;
                    eventConsumed = true;
                }
                break;
            case 'mousemove':
                if (this._active) {
                    let nv = (mx - this._mdelta - this._BORDER) / this._TLENGTH;
                    nv = this._p.constrain(nv, this._minV, this._maxV);
                    this._value = nv;
                    this.action({ source: this, p5Event: e, value: this.value(), final: false });
                    this._bufferInvalid = true;
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
        let thumbSizeX = Math.max(this._used * this._TLENGTH, 12), thumbSizeY = 14;
        let tx = this._value * this._TLENGTH;
        b.push();
        b.clear();
        if (this._opaque) {
            b.noStroke();
            b.fill(cs.back7);
            b.rect(0, 0, this._w, this._h, this._c[0], this._c[1], this._c[2], this._c[3]);
        }
        b.translate(this._BORDER, b.height / 2);
        b.fill(cs.track_back);
        b.stroke(cs.track_border);
        b.strokeWeight(1);
        b.rect(0, -this._THEIGHT / 2, this._TLENGTH, this._THEIGHT);
        b.fill(cs.thumb);
        b.noStroke();
        if (this._active || this._over > 0) {
            b.strokeWeight(2);
            b.stroke(cs.highlight);
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
class GViewer extends GControl {
    constructor(gui, name, x, y, w, h) {
        super(gui, name, x, y, w, h);
        this._layers = [];
        this._hidden = new Set();
        this._lw = 0;
        this._lh = 0;
        this._wcx = 0;
        this._wcy = 0;
        this._wscale = 0;
        this._usedX = 0;
        this._usedY = 0;
        this._o = { valid: false };
        this._scrH = gui.scroller(this._name + "-scrH", 0, h, w, 20)
            .setAction((info) => {
            this.view(info.value, this._wcy);
            this._bufferInvalid = true;
        });
        this._scrV = gui.scroller(this._name + "-scrV", w, 0, h, 20).orient('south')
            .setAction((info) => {
            this.view(this._wcx, info.value);
            this._bufferInvalid = true;
        });
        this.addChild(this._scrH);
        this.addChild(this._scrV);
    }
    scale(v, l0, l1) {
        if (!v && !l0 && !l1)
            return this._wscale;
        if (isFinite(l0) && isFinite(l1)) {
            if (!this._scaler) {
                this._scaler = this._gui.slider(this._name + "-scaler", 0.25 * this._w, 0.5 * this._h - 10, 0.5 * this._w, 20)
                    .hide()
                    .limits(l0, l1)
                    .value((l0 + l1) / 2)
                    .setAction((info) => {
                    this.scale(info.value);
                    this._bufferInvalid = true;
                });
                this.addChild(this._scaler);
            }
            this._scaler.limits(Math.min(l0, l1), Math.max(l0, l1));
        }
        if (isFinite(v)) {
            if (this._scaler)
                this._scaler.value(v);
            this._wscale = v;
            this.view(this._wcx, this._wcy, this._wscales);
        }
        this._bufferInvalid = true;
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
                this._bufferInvalid = true;
            }
        return this;
    }
    showLayer(n) {
        if (Number.isInteger(n))
            if (n >= 0 && n < this._layers.length && this._hidden.has(n)) {
                this._hidden.delete(n);
                this._bufferInvalid = true;
            }
        return this;
    }
    view(wcx, wcy, wscale) {
        if (Number.isFinite(wcx) && Number.isFinite(wcy)) {
            if (this._neq(this._wcx, wcx) || this._neq(this._wcy, wcy)) {
                this._wcx = wcx;
                this._wcy = wcy;
                this._scrH.value(wcx);
                this._scrV.value(wcy);
                this._bufferInvalid = true;
            }
            if (this._neq(this._wscale, wscale)) {
                this._wscale = wscale;
                if (this._scaler)
                    this._scaler.value(wscale);
                this._bufferInvalid = true;
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
        this._scrH.capacity(lw);
        this._scrV.capacity(lh);
        this._bufferInvalid = true;
        return this;
    }
    _overScaler() {
        return Boolean(this._scaler && this._scaler.over() > 0);
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
            this._over > 1 ? this._scaler.show() : this._scaler.hide();
        switch (e.type) {
            case 'mousedown':
                if (this._over > 0) {
                    if (!this._overScaler()) {
                        this._clickAllowed = false;
                        this._dragging = true;
                        this._active = true;
                        this._bufferInvalid = true;
                        this._mx0 = this._pmx = mx;
                        this._my0 = this._pmy = my;
                        this._dcx = this._wcx;
                        this._dcy = this._wcy;
                    }
                }
                break;
            case 'mouseout':
                if (this._active) {
                    this._over = 0;
                    this._clickAllowed = false;
                    this._dragging = false;
                    this._active = false;
                    this._bufferInvalid = true;
                }
            case 'mouseup':
                if (this._active) {
                    this._dragging = false;
                    this._active = false;
                    this._bufferInvalid = true;
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
        this._bufferInvalid = true;
    }
    _xor(a, b) {
        return (a || b) && !(a && b);
    }
    _updateControlVisual() {
        let b = this._buffer;
        let cs = this._scheme || this._gui.scheme();
        b.background(cs.dark_grey);
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
            this._usedX = view.width / wscale;
            this._scrH.used(this._usedX);
            this._usedY = view.height / wscale;
            this._scrV.used(this._usedY);
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
        let leftO = (leftA < leftB) ? leftB : leftA;
        let rightO = (rightA > rightB) ? rightB : rightA;
        let botO = (botA > botB) ? botB : botA;
        let topO = (topA < topB) ? topB : topA;
        let offsetX = (leftO - leftB);
        let offsetY = (topO - topB);
        return {
            valid: true,
            left: leftO, right: rightO, top: topO, bottom: botO,
            width: rightO - leftO, height: botO - topO,
            offsetX: offsetX, offsetY: offsetY,
        };
    }
    _whereOver(px, py) {
        let w = this._w, w0 = 0.2 * w, w1 = 0.8 * w;
        let h = this._h, h0 = 0.3 * h, h1 = 0.7 * h;
        if (this._scaler && px > w0 && px < w1 && py > h0 && py < h1)
            return 2;
        if (px > 0 && px < w && py > 0 && py < h) {
            return 1;
        }
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
class GPane extends GObject {
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
    size() {
        return this._size;
    }
    close() {
        switch (this._status) {
            case "opening":
                clearInterval(this._timer);
            case "open":
                this._timer = setInterval(() => { this._closing(); }, GPane._dI);
                this._status = 'closing';
                break;
        }
        return this;
    }
    open() {
        switch (this._status) {
            case "closing":
                clearInterval(this._timer);
            case "closed":
                this._gui._closeAll();
                this._timer = setInterval(() => { this._opening(); }, GPane._dI);
                this._status = 'opening';
                break;
        }
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
            let _cs = this._scheme || this._gui.scheme();
            p.noStroke();
            p.fill(_cs.black4);
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
            let _cs = this._scheme || this._gui.scheme();
            p.noStroke();
            p.fill(_cs.black4);
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
    opaque(dim) {
        console.warn("This methis is not applicable to a pane");
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
GPane._dI = 20;
GPane._dC = 40;
GPane._dO = 20;
GPane._wExtra = 20;
GPane._tabID = 1;
class GPaneNorth extends GPane {
    constructor(gui, name, size) {
        super(gui, name, 0, -size, gui.canvasWidth(), size);
        this._size = size;
        this._status = 'closed';
        let tab = this._tab = this._gui.button('Tab ' + GPane._tabID++);
        tab.text(tab._name).setAction(this._tabAction);
        let s = tab._minControlSize();
        tab._w = s.w + GPane._wExtra;
        tab._c = [0, 0, this._cornerRadius, this._cornerRadius];
        this.addChild(tab);
        gui._panesNorth.push(this);
        this._gui.validateTabsNorth();
    }
    _opening() {
        let py = this._y + GPane._dO;
        if (py > 0) {
            py = 0;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._y = py;
    }
    _closing() {
        let py = this._y - GPane._dC;
        if (py < -this._size) {
            py = -this._size;
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
class GPaneSouth extends GPane {
    constructor(gui, name, size) {
        super(gui, name, 0, gui.canvasHeight(), gui.canvasWidth(), size);
        this._size = size;
        this._status = 'closed';
        let tab = this._tab = this._gui.button('Tab ' + GPane._tabID++);
        tab.text(tab._name).setAction(this._tabAction);
        let s = tab._minControlSize();
        tab._w = s.w + GPane._wExtra;
        tab._c = [this._cornerRadius, this._cornerRadius, 0, 0];
        this.addChild(tab);
        this._gui._panesSouth.push(this);
        this._gui.validateTabsSouth();
    }
    _opening() {
        let py = this._y - GPane._dO;
        if (py < this._gui.canvasHeight() - this._size) {
            py = this._gui.canvasHeight() - this._size;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._y = py;
    }
    _closing() {
        let py = this._y + GPane._dC;
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
class GPaneEast extends GPane {
    constructor(gui, name, size) {
        super(gui, name, gui.canvasWidth(), 0, size, gui.canvasHeight());
        this._size = size;
        this._status = 'closed';
        let tab = this._tab = this._gui.button('Tab ' + GPane._tabID++);
        tab.text(tab._name)
            .orient('north')
            .setAction(this._tabAction);
        let s = tab._minControlSize();
        tab._w = s.w + GPane._wExtra;
        tab._c = [this._cornerRadius, this._cornerRadius, 0, 0];
        this.addChild(tab);
        this._gui._panesEast.push(this);
        this._gui.validateTabsEast();
    }
    _opening() {
        let px = this._x - GPane._dO;
        if (px < this._gui.canvasWidth() - this._size) {
            px = this._gui.canvasWidth() - this._size;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._x = px;
    }
    _closing() {
        let px = this._x + GPane._dC;
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
class GPaneWest extends GPane {
    constructor(gui, name, size) {
        super(gui, name, -size, 0, size, gui.canvasHeight());
        this._size = size;
        this._status = 'closed';
        let tab = this._tab = this._gui.button('Tab ' + GPane._tabID++);
        tab.text(tab._name)
            .orient('south')
            .setAction(this._tabAction);
        let s = tab._minControlSize();
        tab._w = s.w + GPane._wExtra;
        tab._c = [this._cornerRadius, this._cornerRadius, 0, 0];
        this.addChild(tab);
        this._gui._panesWest.push(this);
        this._gui.validateTabsWest();
    }
    _opening() {
        let px = this._x + GPane._dO;
        if (px > 0) {
            px = 0;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._x = px;
    }
    _closing() {
        let px = this._x - GPane._dC;
        if (px < -this._size) {
            px = -this._size;
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
//# sourceMappingURL=gui_controls.js.map