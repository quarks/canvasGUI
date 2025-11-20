/**
 * The parent class for all color schemes.
 */
class ColorScheme {
    /** @hidden */
    constructor(name = 'color scheme name') {
        /** @hidden */
        this._colors = [];
        /** @hidden */
        this._greys = [];
        /** @hidden */
        this._tints = [];
        /** @hidden */
        this._name = 'color scheme name';
        this._name = name;
        this._tints = [[0, 13], [0, 19], [0, 77], [0, 153]];
        this._greys = [[255], [204], [179], [153], [128], [102], [77], [51], [26], [0]];
    }
    /**
     * <p>Get the name of this color scheme e.g. 'green', 'blue' ... </p>
     */
    get name() { return this._name; }
    /** @hidden */
    set name(v) { CWARN(`Changing the name of a color scheme is not permitted`); }
    /**
     * Returns true if this scheme has been created by the user and false if
     * is one of the canvasGUI library color schemes.
     */
    get isCopy() { return Boolean(this['setColors']); }
    /** @hidden */
    _deepCopyArray2D(a) {
        let b = [];
        a.forEach(v => b.push([...v]));
        return b;
    }
    /**
     * Creates a new color scheme which is a deep copy of this one. The new scheme
     * name will be the same as this one with '-copy' appended
     * @returns a copy copy of this color scheme
     * @hidden
     */
    _copy() {
        let cpy = new ColorScheme(`${this._name}-copy`);
        cpy._tints = this._deepCopyArray2D(this._tints);
        cpy._greys = this._deepCopyArray2D(this._greys);
        cpy._colors = this._deepCopyArray2D(this._colors);
        Object.assign(cpy, COLOR_SCHEME_EDIT);
        return cpy;
    }
    /** @hidden */
    C(n, alpha = 255) {
        alpha = Math.floor((alpha < 0 ? 0 : alpha > 255 ? 255 : alpha));
        return [...this._colors[n], alpha];
    }
    /** @hidden */
    G(n, alpha = 255) {
        alpha = Math.floor((alpha < 0 ? 0 : alpha > 255 ? 255 : alpha));
        return [...this._greys[n], alpha];
    }
    /** @hidden */
    T(n) { return this._tints[n]; }
}
class BlueScheme extends ColorScheme {
    constructor() {
        super('blue');
        this._colors = [
            [230, 236, 255], [204, 218, 255], [179, 199, 255], [153, 180, 255],
            [102, 143, 255], [69, 112, 230], [41, 84, 204], [19, 65, 191],
            [15, 52, 153], [10, 35, 102]
        ];
    }
}
class GreenScheme extends ColorScheme {
    constructor() {
        super('green');
        this._colors = [
            [230, 255, 230], [204, 255, 204], [179, 255, 179], [153, 255, 153],
            [102, 255, 102], [69, 230, 69], [41, 204, 41], [19, 191, 19],
            [12, 80, 12], [8, 64, 8]
        ];
    }
}
class RedScheme extends ColorScheme {
    constructor() {
        super('red');
        this._colors = [
            [255, 230, 230], [255, 204, 204], [255, 179, 179], [255, 153, 153],
            [255, 102, 102], [230, 69, 69], [204, 41, 41], [191, 19, 19],
            [153, 15, 15], [102, 10, 10]
        ];
    }
}
class CyanScheme extends ColorScheme {
    constructor() {
        super('cyan');
        this._colors = [
            [230, 255, 255], [204, 255, 255], [179, 255, 255], [153, 255, 255],
            [102, 255, 255], [69, 230, 230], [41, 204, 204], [19, 191, 191],
            [15, 96, 96], [10, 80, 80]
        ];
    }
}
class YellowScheme extends ColorScheme {
    constructor() {
        super('yellow');
        this._colors = [
            [255, 255, 230], [255, 255, 204], [255, 255, 179], [255, 255, 153],
            [255, 255, 102], [230, 230, 69], [204, 204, 41], [191, 191, 19],
            [96, 96, 15], [80, 80, 10]
        ];
    }
}
class PurpleScheme extends ColorScheme {
    constructor() {
        super('purple');
        this._colors = [
            [255, 230, 255], [255, 204, 255], [255, 179, 255], [255, 153, 255],
            [255, 102, 255], [230, 69, 230], [204, 41, 204], [191, 19, 191],
            [153, 15, 153], [102, 10, 102]
        ];
    }
}
class OrangeScheme extends ColorScheme {
    constructor() {
        super('orange');
        this._colors = [
            [255, 242, 230], [255, 230, 204], [255, 217, 179], [255, 204, 153],
            [255, 179, 102], [230, 149, 69], [204, 122, 41], [191, 105, 19],
            [140, 77, 13], [102, 56, 10]
        ];
    }
}
class LightScheme extends ColorScheme {
    constructor() {
        super('light');
        this._colors = [[254], [228], [203], [177], [152], [127], [101], [76], [50], [25]];
    }
}
class DarkScheme extends ColorScheme {
    constructor() {
        super('dark');
        this._colors = [[0], [25], [50], [76], [101], [127], [152], [177], [203], [228]];
        this._tints = [[102, 160], [131, 172], [191, 204], [226, 230]];
        this._greys = this._greys.reverse();
    }
}
// This mixin is added to any copy of a library color scheme so it can be edited
// to create a user-defined color scheme.
let COLOR_SCHEME_EDIT = {
    /**
     * Get a deep copy of the tints array which can then be edited. Changes to
     * the copy will not change the color scheme unless the matching setter is
     * called.
     */
    getTints() {
        return this._deepCopyArray2D(this._tints);
    },
    /**
     * Get a deep copy of the tints array which can then be edited. Changes to
     * the copy will not change the color scheme unless the matching setter is
     * called.
     */
    getGreys() {
        return this._deepCopyArray2D(this._greys);
    },
    /**
     * Get a deep copy of the colors array which can then be edited. Changes to
     * the copy will not change the color scheme unless the matching setter is
     * called.
     */
    getColors() {
        return this._deepCopyArray2D(this._colors);
    },
    /**
     * <p>Replaces the scheme's tints array.</p>
     * <p>No error checking is performed so invalid parameter values
     * may cause the sketch to crash.</p>
     * @param tints
     */
    setTints(tints) {
        this._tints = tints;
    },
    /**
     * <p>Replaces the scheme's tints array.</p>
     * <p>No error checking is performed so invalid parameter values
     * may cause the sketch to crash.</p>
     * @param greys
     */
    setGreys(greys) {
        this._greys = greys;
    },
    /**
     * <p>Replaces the scheme's colors array.</p>
     * <p>No error checking is performed so invalid parameter values
     * may cause the sketch to crash.</p>
     * @param colors
     */
    setColors(colors) {
        this._colors = colors;
    }
};
//# sourceMappingURL=colorschemes.js.map