/*
##############################################################################
ORIENTATIONS
These four classes allows the used to orientate any visual control (except
side panes) in one of the four cardinal compass directions. The default
direction is east i.e. left-to-right.

The position supplied when creating a control represents the top-left corner
of the control irrespective of the orientation specified.
##############################################################################
*/
class OrientNorth {
    getTransform(w, h) {
        return { tx: 0, ty: w, rot: 1.5 * Math.PI };
    }
    xy(x, y, w, h) {
        return [w - y, x, h, w];
    }
    wh(w, h) {
        return [h, w];
    }
}
class OrientSouth {
    getTransform(w, h) {
        return { tx: h, ty: 0, rot: 0.5 * Math.PI };
    }
    xy(x, y, w, h) {
        return [y, h - x, h, w];
    }
    wh(w, h) {
        return [h, w];
    }
}
class OrientEast {
    getTransform(w, h) {
        return { tx: 0, ty: 0, rot: 0 };
    }
    xy(x, y, w, h) {
        return [x, y, w, h];
    }
    wh(w, h) {
        return [w, h];
    }
}
class OrientWest {
    getTransform(w, h) {
        return { tx: w, ty: h, rot: Math.PI };
    }
    xy(x, y, w, h) {
        return [w - x, h - y, w, h];
    }
    wh(w, h) {
        return [w, h];
    }
}
//# sourceMappingURL=orientations.js.map