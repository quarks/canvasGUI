// Store existing call
HTMLCanvasElement.prototype["_getContext"] = HTMLCanvasElement.prototype.getContext;
// Store context type
HTMLCanvasElement.prototype["._contextType"] = null;
// Register getContext wrapper method
HTMLCanvasElement.prototype.getContext = function (type) {
    this._contextType = type;
    return this._getContext(type);
};
// Return the context type. If no context type has bee set return null
HTMLCanvasElement.prototype["hasContext"] = function () {
    return this._contextType;
};
class Foo {
    constructor() {
    }
}
//# sourceMappingURL=z-test.js.map