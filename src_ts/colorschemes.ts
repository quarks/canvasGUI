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

    _colors(h: number, s0: number = 40, s1: number = 70, b: number = 100) {
        let cn = 0, i: number;
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
