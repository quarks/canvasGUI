/**
 * 2D position
 * @hidden
 */
interface __Position { x: number; y: number; }

/**
 * <h2>This is a placeholder for other controls (its children)</h2>
 * 
 * A pin has a position but no visual representation and its children will be
 * shown relative to the pin's xy position.</p>
 */
class CvsPin {

    /** @hidden */ protected _gui: GUI;
    /** @hidden */ protected _id: string;
    /** @hidden */ protected _children: Array<any> = [];
    /** @hidden */ protected _parent: any;


    /** @hidden */ protected _x: number = 0;
    /** @hidden */ protected _y: number = 0;
    /** @hidden */ protected _z: number = 0;

    /** @hidden */ protected _visible: boolean = false;
    /** @hidden */ protected _enabled: boolean = false;

    /** @hidden */ protected _bufferInvalid: boolean = true;

    constructor(gui: GUI, id: string, x: number, y: number) {
        this._gui = gui;
        this._id = id;
        this._x = Math.round(x);
        this._y = Math.round(y);
        this._gui.registerID(this);
    }

    /** The unique identifier for this control.   */
    get id() { return this._id; }

    /** 
     * The type name for this control.<br>
     * (type name = class name without the <code>Cvs</code> prefix)
     */
    get type() { return this.constructor.name.substring(3); };

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

    /**
     * <p>This is true if the control can respond to UI events else false.</p>
     * <p>Use <code>enable()</code> and <code>disable()</code> to enable and disable it.</p>
     */
    get isEnabled() { return this._enabled; }

    /** 
     * <p>This is true if the control is visible else false.</p>
     * <p>Use <code>hide()</code> and <code>show()</code> to set visibility.</p>
     */
    get isVisible() { return this._visible; }

    // /**
    //  * <p>Sets the visibility of this control.</p>
    //  * <p>It is an alternative to using show and hide.</p>
    //  */
    // set visible(v) { this._visible = v }

    // /**
    //  * <p>Gets the visibility of this control.</p>
    //  * <p>It is an alternative to using isVisible.</p>
    //  */
    // get visible() { return this._visible }


    /**
     * Test function to show existing puffers
     * @hidden
     */
    get bufferStatus() { return { ui: false, pk: false } }

    /**
     * Move this control to an absolute position.
     * @param x horizontal position
     * @param y vertical position
     * @returns this control
     */
    moveTo(x: number, y: number) {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Move this control relative to current position.
     * @param x horizontal distance
     * @param y vertical distance
     * @returns this control
     */
    moveBy(x: number, y: number) {
        this.x += x;
        this.y += y;
        return this;
    }

    /**
     * <p>Calculates the absolute position on the canvas taking into account
     * any ancestors.</p>
     * @returns the actual position in the canvas
     * @hidden
     */
    getAbsXY(): __Position {
        if (!this._parent) {
            return { x: this._x, y: this._y };
        } else {
            let pos = this._parent.getAbsXY();
            pos.x += this._x; pos.y += this._y;
            return pos;
        }
    }

    /**
     * <p>Adds this control to another control which becomes its parent.</p>
     * @param parent is the parental control or its id
     * @param rx x position relative to parent
     * @param ry  y position relative to parent
     * @returns this control
     */
    parent(parent: any, rx?: number, ry?: number): CvsPin {
        const prnt = this._gui.$(parent);
        if (prnt) {
            prnt.addChild(this, rx, ry);
            this.z = prnt.z + DELTA_Z;
            this._gui.setRenderOrder();
        }
        return this;
    }

    /**
     * <p>Add a child to this control using its relative position [rx, ry].
     * If rx and ry are not provided then it uses the values set in the child.</p> 
     * @param child is the actual control or its id
     * @returns this control
     */
    addChild(child: any, rx?: number, ry?: number): any {
        const control = this._gui.$(child);
        if (control) {
            rx = !Number.isFinite(rx) ? control.x : Number(rx);
            ry = !Number.isFinite(ry) ? control.y : Number(ry);
            // If the control already has a parent remove it ready for new parent.
            if (!control._parent) control.leaveParent();
            // Position and add parent to control control
            control.x = rx;
            control.y = ry;
            control._parent = this;
            control.z = this.z + DELTA_Z;
            this._children.push(control);
            this._gui.setRenderOrder();
        }
        return this;
    }

    /**
     * <p>Remove a child control from this one so that it stays in same screen position.</p>
     * @param child the control to remove or its id
     * @returns this control
     */
    removeChild(child: any) {
        const control = this._gui.$(child);
        if (control) {
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
        }
        return this;
    }

    /**
     * <p>Remove this control from its parent</p>
     * @returns this control
     */
    leaveParent(): CvsPin {
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
     * <p>Enables this control and all its children.</p>
     * @param cascade if true enable child controls
     * @returns this control
     */
    enable(cascade?: boolean): CvsPin {
        cascade = true;
        if (cascade)
            for (let c of this._children)
                c.enable(cascade);
        return this;
    }

    /**
     * <p>Disables this control and all its children.</p>
     * @param cascade if true disable child controls
     * @returns this control
     */
    disable(cascade?: boolean): CvsPin {
        cascade = true;
        if (cascade)
            for (let c of this._children)
                c.disable(cascade);
        return this;
    }

    /**
     * An alternative to the enable / disable methods.
     * 
     * @param enable true / false
     * @param cascade  true apply to all children
     * @returns this control 
     */
    setEnabled(enable: boolean, cascade?: boolean) {
        if (enable)
            return this.enable(cascade);
        else
            return this.disable(cascade);
    }

    /**
     * <p>Show all the children for this 'pin'.</p>
     * @param cascade always true
     * @returns this control
     */
    show(cascade?: boolean): CvsPin {
        cascade = true;
        if (cascade)
            for (let c of this._children)
                c.show(cascade);
        return this;
    }

    /**
     * <p>Hide all the children for this 'pin'.</p>
     * @param cascade always true
     * @returns this control
     */
    hide(cascade?: boolean): CvsPin {
        cascade = true;
        if (cascade)
            for (let c of this._children)
                c.hide(cascade);
        return this;
    }

    /**
     * An alternative to the show / hide methods.
     * 
     * @param visible true / false
     * @param cascade if true hide children
     * @returns this control 
     */
    setVisible(visible: boolean, cascade?: boolean) {
        if (visible)
            return this.show(cascade);
        else
            return this.hide(cascade);
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

    /** @hidden */
    warn$(method: any): any {
        CWARN(`'${method}' is not supported by '${this.type}' controls.`)
        return this;
    }

    /**
     * @param guiCtx ui overlay buffer drawing context
     * @param pkCtx picker buffer drawing context
     * @hidden
     */
    _draw(guiCtx: OffscreenCanvasRenderingContext2D, pkCtx: OffscreenCanvasRenderingContext2D) {
        guiCtx.save();
        guiCtx.translate(this._x, this._y);
        // Display children
        for (let c of this._children)
            if (c._visible) c._draw(guiCtx, pkCtx);
        guiCtx.restore();
    }

}