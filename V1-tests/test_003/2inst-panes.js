

let sketch1 = function (p) {

    p.preload = function () {
        p.bug = p.loadImage('data/bug6.png');
    }
    p.setup = function () {
        p5canvas = p.createCanvas(480, 280, p.WEBGL);
        p5canvas.parent('cv1');

        p.gui = GUI.get(p5canvas, p);
        p.gui.scheme('dark')
        // p.gui2 = GUI.get(p5canvas, p, 'test');

        // console.log(p5canvas instanceof p5.Renderer)
        // console.log(GUI.find(p5canvas))
        // console.log(p instanceof p5)
        // console.log(p.VERSION)
        // East
        p.gui.pane('east_1', 'east', 80).text('East 1');
        p.gui.pane('east_2', 'east', 80).text('East 2');
        p.gui.pane('east_3', 'east', 80).text('East 2');
        // West
        p.gui.pane('west_1', 'west', 80).text('West 1');
        p.gui.pane('west_2', 'west', 80).text('West 2');
        p.gui.pane('west_3', 'west', 80).text('West 3');
        // South
        p.gui.pane('south_1', 'south', 80).text('South 1');
        p.gui.pane('south_2', 'south', 80).text('South 2');
        p.gui.pane('south_3', 'south', 80).text('South 3');
        // North
        p.gui.pane('north_1', 'north', 80).text('North 1');
        p.gui.pane('north_2', 'north', 80).text('North 2');
        p.gui.pane('north_3', 'north', 80).text('North 3');
        p.reset();
    }

    p.draw = function () {
        p.push();
        p.background(255, 160, 64);
        p.pos.add(p.v);
        if (p.gui.is3D()) {
            if (p.pos.x < -p.width / 2) p.v.x = Math.abs(p.v.x);
            if (p.pos.x > p.width / 2) p.v.x = -Math.abs(p.v.x);
            if (p.pos.y < -p.height / 2) p.v.y = Math.abs(p.v.y);
            if (p.pos.y > p.height / 2) p.v.y = -Math.abs(p.v.y);
        }
        else {
            if (p.pos.x < 0) p.v.x = Math.abs(p.v.x);
            if (p.pos.x > p.width) p.v.x = -Math.abs(p.v.x);
            if (p.pos.y < 0) p.v.y = Math.abs(p.v.y);
            if (p.pos.y > p.height) p.v.y = -Math.abs(p.v.y);
        }
        p.noStroke();
        p.fill(50, 50, 220);
        p.ellipse(p.pos.x, p.pos.y, 40, 40);

        p.pop();
        p.gui.draw();
    }

    p.reset = function () {
        p.pos = p.createVector(p.width / 2, p.height / 2);
        let a = p.random(Math.PI / 4) + Math.PI / 8 + Math.floor(4 * Math.random()) * Math.PI / 2;
        p.v = p.createVector(Math.cos(a), Math.sin(a), 0);
        p.speed = 1.5 + 3 * Math.random();
        p.v.mult(p.speed);
    }
}

let sketch2 = function (p) {

    p.setup = function () {
        p5canvas = p.createCanvas(300, 300, p.WEBGL);
        p5canvas.parent('cv2');
        p.gui = GUI.get(p5canvas, p);
        // East
        p.gui.pane('east_1', 'east', 80).text('East 1');
        p.gui.pane('east_2', 'east', 80).text('East 2');
        p.gui.pane('east_3', 'east', 80).text('East 2');
        // West
        p.gui.pane('west_1', 'west', 80).text('West 1');
        p.gui.pane('west_2', 'west', 80).text('West 2');
        p.gui.pane('west_3', 'west', 80).text('West 3');
        // South
        p.gui.pane('south_1', 'south', 80).text('South 1');
        p.gui.pane('south_2', 'south', 80).text('South 2');
        p.gui.pane('south_3', 'south', 80).text('South 3');
        // North
        p.gui.pane('north_1', 'north', 80).text('North 1');
        p.gui.pane('north_2', 'north', 80).text('North 2');
        p.gui.pane('north_3', 'north', 80).text('North 3');
        p.reset();
    }

    p.draw = function () {
        p.push();
        p.background(160, 240, 64);
        p.pos.add(p.v);
        if (p.gui.is3D()) {
            if (p.pos.x < -p.width / 2) p.v.x = Math.abs(p.v.x);
            if (p.pos.x > p.width / 2) p.v.x = -Math.abs(p.v.x);
            if (p.pos.y < -p.height / 2) p.v.y = Math.abs(p.v.y);
            if (p.pos.y > p.height / 2) p.v.y = -Math.abs(p.v.y);
        }
        else {
            if (p.pos.x < 0) p.v.x = Math.abs(p.v.x);
            if (p.pos.x > p.width) p.v.x = -Math.abs(p.v.x);
            if (p.pos.y < 0) p.v.y = Math.abs(p.v.y);
            if (p.pos.y > p.height) p.v.y = -Math.abs(p.v.y);
        }
        p.noStroke();
        p.fill(220, 50, 220);
        p.ellipse(p.pos.x, p.pos.y, 40, 40);

        p.pop();
        p.gui.draw();
    }

    p.reset = function () {
        p.pos = p.createVector(p.width / 2, p.height / 2);
        let a = p.random(Math.PI / 4) + Math.PI / 8 + Math.floor(4 * Math.random()) * Math.PI / 2;
        p.v = p.createVector(Math.cos(a), Math.sin(a), 0);
        p.speed = 1.5 + 3 * Math.random();
        p.v.mult(p.speed);
    }
}

let p1 = new p5(sketch1);
setInterval(p1.reset, 10000);
let p2 = new p5(sketch2);
setInterval(p2.reset, 10000);


