class BaseScheme {
    constructor(name = 'color scheme name') {
        this._colors = [];
        this._greys = [];
        this._tints = [];
        this._name = 'color scheme name';
        this._name = name;
        this._tints = [
            [0, 0, 0, 13], [0, 0, 0, 19], [0, 0, 0, 26], [0, 0, 0, 64],
            [0, 0, 0, 77], [0, 0, 0, 102], [0, 0, 0, 128], [0, 0, 0, 153],
            [0, 0, 0, 179]
        ];
        this._greys = [
            [255, 255, 255], [204, 204, 204], [179, 179, 179], [153, 153, 153],
            [128, 128, 128], [102, 102, 102], [77, 77, 77], [51, 51, 51],
            [26, 26, 26], [0, 0, 0]
        ];
    }
    get name() { return this._name; }
    /**
     * Creates a duplicate objcet from this color scheme;
     * @returns a copy of this scheme
     */
    copy() {
        return Object.assign(new BaseScheme(), this);
    }
    C(n, alpha = 255) {
        alpha = Math.floor((alpha < 0 ? 0 : alpha > 255 ? 255 : alpha));
        return [...this._colors[n], alpha];
    }
    G(n, alpha = 255) {
        alpha = Math.floor((alpha < 0 ? 0 : alpha > 255 ? 255 : alpha));
        return [...this._greys[n], alpha];
    }
    T(n) { return this._tints[n]; }
}
class BlueScheme extends BaseScheme {
    constructor() {
        super('blue');
        this._colors = [
            [230, 236, 255], [204, 218, 255], [179, 199, 255], [153, 180, 255],
            [102, 143, 255], [69, 112, 230], [41, 84, 204], [19, 65, 191],
            [15, 52, 153], [10, 35, 102]
        ];
    }
}
class GreenScheme extends BaseScheme {
    constructor() {
        super('green');
        this._colors = [
            [230, 255, 230], [204, 255, 204], [179, 255, 179], [153, 255, 153],
            [102, 255, 102], [69, 230, 69], [41, 204, 41], [19, 191, 19],
            [15, 153, 15], [10, 102, 10]
        ];
    }
}
class RedScheme extends BaseScheme {
    constructor() {
        super('red');
        this._colors = [
            [255, 230, 230], [255, 204, 204], [255, 179, 179], [255, 153, 153],
            [255, 102, 102], [230, 69, 69], [204, 41, 41], [191, 19, 19],
            [153, 15, 15], [102, 10, 10]
        ];
    }
}
class CyanScheme extends BaseScheme {
    constructor() {
        super('cyan');
        this._colors = [
            [230, 255, 255], [204, 255, 255], [179, 255, 255], [153, 255, 255],
            [102, 255, 255], [69, 230, 230], [41, 204, 204], [19, 191, 191],
            [15, 153, 153], [10, 102, 102]
        ];
    }
}
class YellowScheme extends BaseScheme {
    constructor() {
        super('yellow');
        this._colors = [
            [255, 255, 230], [255, 255, 204], [255, 255, 179], [255, 255, 153],
            [255, 255, 102], [230, 230, 69], [204, 204, 41], [191, 191, 19],
            [153, 153, 15], [102, 102, 10]
        ];
    }
}
class PurpleScheme extends BaseScheme {
    constructor() {
        super('purple');
        this._colors = [
            [255, 230, 255], [255, 204, 255], [255, 179, 255], [255, 153, 255],
            [255, 102, 255], [230, 69, 230], [204, 41, 204], [191, 19, 191],
            [153, 15, 153], [102, 10, 102]
        ];
    }
}
class OrangeScheme extends BaseScheme {
    constructor() {
        super('orange');
        this._colors = [
            [255, 242, 230], [255, 230, 204], [255, 217, 179], [255, 204, 153],
            [255, 179, 102], [230, 149, 69], [204, 122, 41], [191, 105, 19],
            [153, 84, 15], [102, 56, 10]
        ];
    }
}
class LightScheme extends BaseScheme {
    constructor() {
        super('light');
        this._colors = [
            [254, 254, 254], [228, 228, 228], [203, 203, 203], [177, 177, 177],
            [152, 152, 152], [127, 127, 127], [101, 101, 101], [76, 76, 76],
            [50, 50, 50], [25, 25, 25]
        ];
    }
}
class DarkScheme extends BaseScheme {
    constructor() {
        super('dark');
        this._colors = [
            [0, 0, 0], [25, 25, 25], [50, 50, 50], [76, 76, 76],
            [101, 101, 101], [127, 127, 127], [152, 152, 152], [177, 177, 177],
            [203, 203, 203], [228, 228, 228]
        ];
        this._tints = [
            [102, 102, 102, 160], [131, 131, 131, 172], [145, 145, 145, 179],
            [158, 158, 158, 185], [170, 170, 170, 192], [191, 191, 191, 204],
            [210, 210, 210, 217], [226, 226, 226, 230], [241, 241, 241, 243]
        ];
        this._greys = this._greys.reverse();
    }
}
//# sourceMappingURL=colorschemes.js.map