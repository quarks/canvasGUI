/* <p>Object type  \{ x: number; y: number; \}  </p> @hidden */
// interface __Position { x: number; y: number; }
/* <p>Object type  \{ w: number; h: number; \} </p> @hidden */
// interface __Box { w: number; h: number; }
/* <p>Object type  \{ w: number; h: number; \} </p> @hidden */
// interface __Line { txt: string, x: number, y: number, w: number }
/* <p>Defines an overlap</p> @hidden */
// interface __Overlap {
//     valid: boolean;
//     left: number; right: number; top: number, bottom: number,
//     width: number; height: number; offsetX: number; offsetY: number;
// }
// // Source - https://stackoverflow.com/a/26983095
// // Posted by user1693593, modified by community. 
// // See post 'Timeline' for change history
// // Retrieved 2026-02-06, License - CC BY-SA 3.0
// // Store original code 
// HTMLCanvasElement.prototype._getContext = HTMLCanvasElement.prototype.getContext;
// // Store context type 
// HTMLCanvasElement.prototype._contextType = '';
// // Register getContext wrapper method 
// HTMLCanvasElement.prototype.getContext = function (type) {
//     this._contextType = type;
//     return this._getContext(type);
// };
// // Return the context type used 
// HTMLCanvasElement.prototype.hasContext = function () {
//     return this._contextType;
// };
//# sourceMappingURL=interfaces.js.map