

/**
 * canvasGUI library constants and utiliy functions.
 */

/** @hidden */
const [CLOG, CWARN, CERROR, CASSERT, CCLEAR] =
    [console.log, console.warn, console.error, console.assert, console.clear];

const DELTA_Z = 64, PANEL_Z = 2048, PANE_Z = 4096;

/** @hidden */
const TT_SHOW_TIME = 1600, TT_REPEAT_TIME = 10000;

/** @hidden */
const FONTS = new Set(['arial', 'verdana', 'tahoma', 'trebuchet ms',
    'times new roman', 'georgia', 'courier new', 'brush script mt',
    'impact', 'serif', 'sans-serif', 'monospace']);

/** @hidden */
const IS_VALID_FONT = function (fontname: string) {
    return FONTS.has(fontname);
}

/** @hidden */
const MEASURE_TEXT = function (text: string, cvs: p5.Renderer, font, style, size) {
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
}

/** @hidden */
const fixAngle2Pi = function (a: number): number {
    const TAU = 2 * Math.PI;
    while (a < 0) a += TAU;
    return a % TAU;
}

/** @hidden */
const fixAngle360 = function (a: number): number {
    while (a < 0) a += 360;
    return a % 360;
}



// Mixins
/** @hidden */
const NoOrient = {
    /** This control does not support changing orientation */
    orient(dir: string): CvsBaseControl {
        CWARN(`Orientation cannot be changed for controls of type '${this.type}'.`);
        return this;
        // // Hide these methods from typeDoc
        // /** @hidden */ orient(dir) { return this }
    }
}

/** @hidden */
const NoParent = {
    /** This control does not support changing orientation */
    parent(parent: CvsBaseControl | string, rx?: number, ry?: number): CvsBaseControl {
        CWARN(`Controls of type '${this.type}' cannot have a parent.`);
        return this;
    },
    leaveParent(): CvsBaseControl {
        CWARN(`Controls of type '${this.type}' cannot have a parent.`);
        return this;
    }
    // // Hide these methods from typeDoc
    // /** @hidden */ parent(parent, rx, ry){ return this }
    // /** @hidden */ leaveParent(){ return this }
}

/** @hidden */
const NoTooltip = {
    /** @hidden */
    tooltip(tiptext: string): CvsBaseControl {
        CWARN(`Controls of type '${this.type}' cannot have tooltips.`);
        return this;
    },
    /** @hidden */
    tipTextSize(gtts: number): CvsBaseControl {
        CWARN(`Controls of type '${this.type}' cannot have tooltips.`);
        return this;
    }
    // // Hide these methods from typeDoc
    // /** @hidden */ tooltip(tiptext){ return this }
    // /** @hidden */ tipTextSize(gtts) { return this }
}

/** @hidden */
const FixedBackground = {
    /** @hidden */
    transparent(): CvsBaseControl {
        CWARN(`Controls of type '${this.type}' do not support the 'transparent' method.`);
        return this;
    },
    opaque(alpha = 255): CvsBaseControl {
        CWARN(`Controls of type '${this.type}' do not support the 'opaque' method.`);
        return this;
    }
    // // Hide these methods from typeDoc
    // /** @hidden */ transparent(){ return this }
    // /** @hidden */ opaque() { return this }
}

/** @hidden */
const NoCorners = {
    /** @hidden */
    corners(...c: any): CvsBaseControl {
        CWARN(`Controls of type '${this.type}' have fixed corners.`);
        return this;
    },

    // // Hide these methods from typeDoc
    // /** @hidden */ corners(c){ return this }
}
