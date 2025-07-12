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