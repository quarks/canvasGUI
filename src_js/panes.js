/*
##############################################################################
 CvsPane
 This is the base class side panes
 ##############################################################################
 */
/**
 * <h2>An offscreen placeholder for other controls</h>
 * <p>Panes are controls that can slide into and out the display area along
 * with any other controls placed on them.</p>
 * <p>Panes are <i>attached</i> to one of the 4 display sides with only a tab
 * visible. Clicking on the tab will cause the pane to slide into the display
 * area. Clicking on the pane background or on it's tab will close the
 * pane.</p>
 * <p>Only one pane can be open at a time, so opening a second pane will close
 * any open pane.</p>
 * <p>This control is useful for freeing up the dsplay area for other
 * purposes.</p>
 */
class CvsPane extends CvsControl {
    /** @hidden */
    constructor(gui, id, x, y, w, h) {
        super(gui, id, x, y, w, h, true);
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
        this._cnrRad = 8;
        this._status = 'closed';
        this._timer = 0;
        this._z = PANE_Z;
    }
    /**
     * Get the tab button.
     * @hidden
     */
    get TAB() { return this._children[0]; }
    /** @hidden */
    get HEIGHT() { return this._tabMinHeight ?? this._gui._tabMinHeight; }
    /**
     * <p>Gets or sets the global minimum height for pane tabs.</p>
     * @param th the minimum tab height (must be &ge;10)
     * @returns this gui instance
     */
    tabHeight(th) {
        if (th === undefined || !Number.isFinite(th))
            return this._tabMinHeight;
        if (th >= 10) {
            this._tabMinHeight = th;
            this.TAB.shrink(1, this.HEIGHT);
            this.TAB.invalidateBuffer();
            this._gui.invalidateTabs();
        }
        return this;
    }
    createTabButton(orient, corners) {
        if (this._children.length === 0) {
            const tabid = `Tab ${CvsPane._TAB_ID++}`;
            const tab = this._gui.button(tabid, 0, 0, 80, this.HEIGHT);
            tab.corners(corners);
            tab.orient(orient);
            tab.text(tab.id);
            tab.setAction(this._tabAction);
            this._gui.invalidateTabs();
            this.addChild(tab);
        }
    }
    /**
     * <p>Get the 'depth' the pane will intrude into the canvas when open.</p>
     * @returns the depth
     */
    depth() {
        return this._depth;
    }
    /**
     * <p>Close this pane.</p>
     * @returns this control
     */
    close() {
        switch (this._status) {
            case "opening": // Stop existing timer
                clearInterval(this._timer);
            case "open": // now add closing timer
                this._timer = setInterval(() => { this._closing(); }, CvsPane._dI);
                this._status = 'closing';
                this.action({ source: this, event: undefined, state: 'closed' });
                break;
        }
        return this;
    }
    /** True if the pane is closed else false. */
    get isClosed() { return this._status == 'closed'; }
    /** True if the pane is closing else false. */
    get isClosing() { return this._status == 'closing'; }
    /**
     * <p>Open this pane.</p>
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
                this.action({ source: this, event: undefined, state: 'open' });
                break;
        }
    }
    /** True if the pane is open else false.*/
    get isOpen() { return this._status == 'open'; }
    /** true if the pane is opening else false.*/
    get isOpening() { return this._status == 'opening'; }
    /**
     * <p>Sets or gets the color scheme used by the pane's tab and the
     * translucent background. Controls on the pane are not affected.</p>
     * @param name the color scheme name e.g. 'blue'
     * @returns this pane or its color scheme
     */
    scheme(name) {
        let result = this.TAB.scheme(name, false);
        return (result instanceof ColorScheme) ? result : this;
    }
    /**
     * <p>Sets the current text.</p>
     * <p>Processing constants are used to define the alignment.</p>
     * @param t the text toset
     * @returns this control
     */
    text(t) {
        this.TAB.text(t);
        this.TAB.shrink(1, this.HEIGHT);
        this._gui.invalidateTabs();
        return this;
    }
    /**
     * <p>Removes the text from the pane tab.</p>
     * @returns this control
     */
    noText() {
        this.TAB.noText();
        this.TAB.shrink(1, this.HEIGHT);
        this._gui.invalidateTabs();
        return this;
    }
    /**
     * <p>Sets the icon and its alignment relative to any text in the control.</p>
     * <p>Processing constants are used to define the icon alignment.</p>
     * @param i the icon to use for this control
     * @param alignH 'left', 'right' or 'center'
     * @param alignV 'top', 'bottom' or 'center'
     * @returns this control
     */
    icon(i, alignH, alignV) {
        this.TAB.icon(i, alignH, alignV);
        this.TAB.shrink(1, this.HEIGHT);
        this._gui.invalidateTabs();
        return this;
    }
    /**
     * <p>Removes the icon from the pane tab.</p>
     * @returns this control
     */
    noIcon() {
        this.TAB.noIcon();
        this.TAB.shrink(1, this.HEIGHT);
        this._gui.invalidateTabs();
        return this;
    }
    /**
     * <p>Sets the text font for the pane tab.</p>
     * @param font the text font to use
     * @returns this control
     */
    textFont(font) {
        this.TAB.textFont(font);
        this.TAB.shrink(1, this.HEIGHT);
        this._gui.invalidateTabs();
        return this;
    }
    /**
     * <p>Sets the text style for the pane tab.</p>
     * @param style the text style to use
     * @returns this control
     */
    textStyle(style, slant) {
        this.TAB.textStyle(style, slant);
        this.TAB.shrink(1, this.HEIGHT);
        this._gui.invalidateTabs();
        return this;
    }
    /**
     * <p>Sets the text size for the pane tab.</p>
     * @param ts the text size to use
     * @returns this control
     */
    textSize(ts) {
        this.TAB.textSize(ts);
        this.TAB.shrink(1, this.HEIGHT);
        this._gui.invalidateTabs();
        return this;
    }
    /**
     * <p>Enables tab opening / closure</p>
     * @returns this control
     */
    enable() {
        this.TAB.enable();
        return this;
    }
    /**
     * <p>Disables tab opening / closure</p>
     * @returns this control
     */
    disable() {
        this.close();
        this.TAB.disable();
        return this;
    }
    /**
     * <p>Make this control invisible</p>
     * @returns this control
     */
    hide() {
        this.close();
        this.TAB.hide();
        return this;
    }
    /**
     * <p>Make this control visible</p>
     * @returns this control
     */
    show() {
        this.TAB.show();
        return this;
    }
    /** @hidden */
    _tabAction(ta) {
        // This method is called when the tab button is clicked. What 
        // happens next depends on the pane status
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
    _doEvent(e, x = 0, y = 0, over, enter) {
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                this._active = true;
                this._clickAllowed = true;
                this.over = true;
                break;
            case 'mouseout':
            case 'mouseup':
            case 'touchend':
                if (this.isActive) {
                    if (this._clickAllowed) {
                        this.close();
                    }
                    this._active = false;
                    this._clickAllowed = false;
                    this.over = false;
                }
                break;
            case 'mousemove':
            case 'touchmove':
                this._clickAllowed = false;
                this.over = (this == over.control);
                break;
            case 'mouseover':
                break;
            case 'wheel':
                break;
        }
        return this.isActive ? this : null;
    }
    /** @hidden */
    _draw(guiCtx, pkCtx) {
        let cs = (this.TAB.scheme() || this._gui.scheme());
        const BACKGROUND = cs.C$(9, 208);
        let c = this._gui.pickColor(this);
        guiCtx.save();
        guiCtx.translate(this._x, this._y);
        pkCtx.save();
        pkCtx.setTransform(guiCtx.getTransform());
        if (this._visible) {
            guiCtx.fillStyle = BACKGROUND;
            guiCtx.fillRect(0, 0, this._w, this._h);
            pkCtx.fillStyle = c.cssColor;
            pkCtx.fillRect(0, 0, this._w, this._h);
            for (let c of this._children)
                if (c._visible)
                    c._draw(guiCtx, pkCtx);
        }
        pkCtx.restore();
        guiCtx.restore();
    }
    // Hide these methods from typeDoc
    /** @hidden */ orient(a) { return this.warn$('orient'); }
    /** @hidden */ parent(a, b, c) { return this.warn$('parent'); }
    /** @hidden */ leaveParent() { return this.warn$('leaveParent'); }
    /** @hidden */ transparent() { return this.warn$('tansparent'); }
    /** @hidden */ opaque() { return this.warn$('opaque'); }
    /** @hidden */ tooltip(a) { return this.warn$('tooltip'); }
    /** @hidden */ tipTextSize(a) { return this.warn$('tipTextSize'); }
    /** @hidden */ corners(a) { return this.warn$('corners'); }
    /** @hidden */ shrink(a, b) { return this.warn$('shrink'); }
    /** @hidden */ moveBy(a, b) { return this.warn$('moveBy'); }
    /** @hidden */ moveTo(a, b) { return this.warn$('moveTo'); }
}
// Deltas used in controlling opening and closing speeds
/** @hidden */ CvsPane._dI = 50; // Interval time (50)
/** @hidden */ CvsPane._dC = 60; // Close speed px/sec
/** @hidden */ CvsPane._dO = 40; // Open speed px/sec
/** @hidden */ CvsPane._TAB_ID = 1;
/** @hidden */
class CvsPaneNorth extends CvsPane {
    constructor(gui, id, depth) {
        super(gui, id, 0, -depth, gui.canvasWidth, depth);
        this._depth = depth;
        this.createTabButton('east', [0, 0, this._cnrRad, this._cnrRad]);
        gui._panesNorth.push(this);
        this._gui.invalidateTabs();
    }
    /**
     * North
     * @param tabPos the postion when shut
     * @param cvsWidth the width of the display canvas
     * @param cvsHeight the height of the display canvas
     * @hidden
     */
    _updateLocation(tabPos, cvsWidth, cvsHeight) {
        this._y = -this._depth;
        this._w = cvsWidth;
        this.TAB.y = this._depth;
        this.TAB.x = tabPos;
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
}
/** @hidden */
class CvsPaneSouth extends CvsPane {
    constructor(gui, id, depth) {
        super(gui, id, 0, gui.canvasHeight, gui.canvasWidth, depth);
        this._depth = depth;
        this.createTabButton('east', [this._cnrRad, this._cnrRad, 0, 0]);
        this._gui._panesSouth.push(this);
        this._gui.invalidateTabs();
    }
    /**
     * South
     * @param tabPos the postion when shut
     * @param cvsWidth the width of the display canvas
     * @param cvsHeight the height of the display canvas
     * @hidden
     */
    _updateLocation(tabPos, cvsWidth, cvsHeight) {
        this._y = cvsHeight;
        this._w = cvsWidth;
        this.TAB.y = -this.TAB._h;
        this.TAB.x = tabPos;
    }
    _opening() {
        let py = this._y - CvsPane._dO;
        if (py < this._gui.canvasHeight - this._depth) { // See if open
            py = this._gui.canvasHeight - this._depth;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._y = py;
    }
    _closing() {
        let py = this._y + CvsPane._dC;
        if (py > this._gui.canvasHeight) { // See if closed
            py = this._gui.canvasHeight;
            clearInterval(this._timer);
            this._status = 'closed';
        }
        this._y = py;
    }
}
/** @hidden */
class CvsPaneEast extends CvsPane {
    constructor(gui, id, depth) {
        super(gui, id, gui.canvasWidth, 0, depth, gui.canvasHeight);
        this._depth = depth;
        this.createTabButton('north', [this._cnrRad, this._cnrRad, 0, 0]);
        this._gui._panesEast.push(this);
        this._gui.invalidateTabs();
    }
    /**
     * East
     * @param tabPos the postion when shut
     * @param cvsWidth the width of the display canvas
     * @param cvsHeight the height of the display canvas
     * @hidden
     */
    _updateLocation(tabPos, cvsWidth, cvsHeight) {
        this._x = cvsWidth;
        this._h = cvsHeight;
        this.TAB.x = -this.TAB.h;
        this.TAB.y = tabPos;
    }
    _opening() {
        let px = this._x - CvsPane._dO;
        if (px < this._gui.canvasWidth - this._depth) { // See if open
            px = this._gui.canvasWidth - this._depth;
            clearInterval(this._timer);
            this._status = 'open';
        }
        this._x = px;
    }
    _closing() {
        let px = this._x + CvsPane._dC;
        if (px > this._gui.canvasWidth) { // See if closed
            px = this._gui.canvasWidth;
            clearInterval(this._timer);
            this._status = 'closed';
        }
        this._x = px;
    }
}
/** @hidden */
class CvsPaneWest extends CvsPane {
    constructor(gui, name, depth) {
        super(gui, name, -depth, 0, depth, gui.canvasHeight);
        this._depth = depth;
        this.createTabButton('south', [this._cnrRad, this._cnrRad, 0, 0]);
        this._gui._panesWest.push(this);
        this._gui.validateTabsWest();
    }
    /**
     * Weat
     * @param tabPos the postion when shut
     * @param cvsWidth the width of the display canvas
     * @param cvsHeight the height of the display canvas
     * @hidden
     */
    _updateLocation(tabPos, cvsWidth, cvsHeight) {
        this._x = -this._depth;
        this._h = cvsHeight;
        this.TAB.x = this._depth;
        this.TAB.y = tabPos;
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
}
//# sourceMappingURL=panes.js.map