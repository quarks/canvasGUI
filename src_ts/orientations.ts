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

    _renderP2D(p: p5, w: number, h: number, buffer: p5.Renderer) {
        p.push();
        p.translate(0, w);
        p.rotate(1.5 * Math.PI);
        p.image(buffer, 0, 0);
        p.pop();
    }

    _renderWEBGL(p: p5, w: number, h: number, buffer: p5.Renderer) {
        p.noStroke();
        p.textureMode(p.NORMAL);
        p.texture(buffer);
        p.beginShape(p.TRIANGLE_STRIP);
        p.vertex(0, 0, 0, 1, 0);
        p.vertex(0, w, 0, 0, 0);
        p.vertex(h, 0, 0, 1, 1);
        p.vertex(h, w, 0, 0, 1);
        p.endShape();
    }

    xy(x: number, y: number, w: number, h: number) {
        return { 'x': w - y, 'y': x, 'w': h, 'h': w };
    }

    wh(w: number, h: number) {
        return { 'w': h, 'h': w };
    }
}

class OrientSouth {

    _renderP2D(p: p5, w: number, h: number, buffer: p5.Renderer) {
        p.push();
        p.translate(h, 0);
        p.rotate(Math.PI / 2);
        p.image(buffer, 0, 0);
        p.pop();
    }

    _renderWEBGL(p: p5, w: number, h: number, buffer: p5.Renderer) {
        p.textureMode(p.NORMAL);
        p.texture(buffer);
        p.beginShape(p.TRIANGLE_STRIP);
        p.vertex(0, 0, 0, 0, 1);
        p.vertex(0, w, 0, 1, 1);
        p.vertex(h, 0, 0, 0, 0);
        p.vertex(h, w, 0, 1, 0);
        p.endShape();
    }

    xy(x: number, y: number, w: number, h: number) {
        return { 'x': y, 'y': h - x, 'w': h, 'h': w };
    }

    wh(w: number, h: number) {
        return { 'w': h, 'h': w };
    }
}

class OrientEast {

    _renderP2D(p: p5, w: number, h: number, buffer: p5.Renderer) {
        p.push();
        p.translate(0, 0);
        p.rotate(0);
        p.image(buffer, 0, 0);
        p.pop();
    }

    _renderWEBGL(p: p5, w: number, h: number, buffer: p5.Renderer) {
        p.textureMode(p.NORMAL);
        p.texture(buffer);
        p.beginShape(p.TRIANGLE_STRIP);
        p.vertex(0, 0, 0, 0, 0);
        p.vertex(0, h, 0, 0, 1);
        p.vertex(w, 0, 0, 1, 0);
        p.vertex(w, h, 0, 1, 1);
        p.endShape();
    }

    xy(x: number, y: number, w: number, h: number) {
        return { 'x': x, 'y': y, 'w': w, 'h': h };
    }

    wh(w: number, h: number) {
        return { 'w': w, 'h': h };
    }
}

class OrientWest {

    _renderP2D(p: p5, w: number, h: number, buffer: p5.Renderer) {
        p.push();
        p.translate(w, h);
        p.rotate(Math.PI);
        p.image(buffer, 0, 0);
        p.pop();
    }

    _renderWEBGL(p: p5, w: number, h: number, buffer: p5.Renderer) {
        p.textureMode(p.NORMAL);
        p.texture(buffer);
        p.beginShape(p.TRIANGLE_STRIP);
        p.vertex(0, 0, 0, 1, 1);
        p.vertex(0, h, 0, 1, 0);
        p.vertex(w, 0, 0, 0, 1);
        p.vertex(w, h, 0, 0, 0);
        p.endShape();
    }

    xy(x: number, y: number, w: number, h: number) {
        return { 'x': w - x, 'y': h - y, 'w': w, 'h': h };
    }

    wh(w: number, h: number) {
        return { 'w': w, 'h': h };
    }
}

