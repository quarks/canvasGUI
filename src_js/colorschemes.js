class BaseScheme {
    constructor() {
        this._tints();
    }
    _color(hue) {
        this[`C_0`] = `hsb(${hue}, 40%, 100%)`;
        this[`C_1`] = `hsb(${hue}, 40%, 90%)`;
        this[`C_2`] = `hsb(${hue}, 40%, 80%)`;
        this[`C_3`] = `hsb(${hue}, 40%, 70%)`;
        this[`C_4`] = `hsb(${hue}, 70%, 100%)`;
        this[`C_5`] = `hsb(${hue}, 70%, 88%)`;
        this[`C_6`] = `hsb(${hue}, 70%, 76%)`;
        this[`C_7`] = `hsb(${hue}, 70%, 64%)`;
        this[`C_8`] = `hsb(${hue}, 70%, 52%)`;
        this[`C_9`] = `hsb(${hue}, 70%, 40%)`;
    }
    _mono(low, high) {
        let cn = 0;
        for (let i = 0; i < 15; i++) {
            let grey = Math.floor(low + (high - low) * i / 14);
            this[`C_${cn++}`] = `rgb(${grey}, ${grey}, ${grey})`;
        }
    }
    _grey(theme) {
        let grey = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];
        if (theme === 'dark')
            grey.reverse();
        for (let i = 0; i < grey.length; i++)
            this[`G_${i}`] = `hsb(0,0%,${grey[i]}%)`;
    }
    _tints() {
        let alpha = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
        for (let i = 0; i < alpha.length; i++)
            this[`T_${i}`] = `rgba(0,0,0,${alpha[i]})`;
    }
}
class RedScheme extends BaseScheme {
    constructor() {
        super();
        this._color(0);
        this._grey('light');
    }
}
class OrangeScheme extends BaseScheme {
    constructor() {
        super();
        this._color(30);
        this._grey('light');
    }
}
class YellowScheme extends BaseScheme {
    constructor() {
        super();
        this._color(60);
        this._grey('light');
    }
}
class GreenScheme extends BaseScheme {
    constructor() {
        super();
        this._color(120);
        this._grey('light');
    }
}
class CyanScheme extends BaseScheme {
    constructor() {
        super();
        this._color(180);
        this._grey('light');
    }
}
class BlueScheme extends BaseScheme {
    constructor() {
        super();
        this._color(224);
        this._grey('light');
    }
}
class PurpleScheme extends BaseScheme {
    constructor() {
        super();
        this._color(300);
        this._grey('light');
    }
}
class LightScheme extends BaseScheme {
    constructor() {
        super();
        this._mono(254, 64);
        this._grey('light');
    }
}
class DarkScheme extends BaseScheme {
    constructor() {
        super();
        this._mono(64, 254);
        this._grey('dark');
    }
}
//# sourceMappingURL=colorschemes.js.map