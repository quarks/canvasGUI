// class GreyScheme {
//     constructor() {
//         this._tints(0, 0, 100);
//         this._shades(0, 0);
//         this['WHITE'] = 'rgb(255, 255, 255)';
//         this['BLACK'] = 'rgb(0, 0, 0)';
//     } 

//     _tints(h, s, b) {
//         for (let i = 1; i <= 9; ++i) {
//             this['TINT_' + i] = `hsba(${h}, ${s}%, ${b}%, ${0.65 + i / 30})`;
//         }
//     }
//     _shades(h, s) {
//         for (let i = 1; i <= 9; ++i) {
//             this['SHADE_' + i] = `hsb(${h}, ${s}%, ${100 - i * 5}%)`;
//         }
//     }
// }

// class BlueScheme extends GreyScheme {

//     constructor() {
//         super();
//         this._tints(240, 45, 100);
//         this._shades(240, 45);
//     }

// }

// class GreenScheme extends GreyScheme {

//     constructor() {
//         super();
//         this._tints(120, 45, 100);
//         this._shades(120, 45);
//     }

// }

// class RedScheme extends GreyScheme {

//     constructor() {
//         super();
//         this._tints(0, 45, 100);
//         this._shades(0, 45);
//     }

// }

// class CyanScheme extends GreyScheme {

//     constructor() {
//         super();
//         this._tints(180, 45, 100);
//         this._shades(180, 45);
//     }

// }

// class YellowScheme extends GreyScheme {

//     constructor() {
//         super();
//         this._tints(60, 45, 100);
//         this._shades(60, 45);
//     }

// }

// class PurpleScheme extends GreyScheme {

//     constructor() {
//         super();
//         this._tints(300, 45, 100);
//         this._shades(300, 45);
//     }

// }

// class OrangeScheme extends GreyScheme {

//     constructor() {
//         super();
//         this._tints(30, 55, 100);
//         this._shades(30, 60);
//     }

// }

