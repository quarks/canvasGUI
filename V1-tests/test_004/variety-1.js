let sketch1 = function (p) {

    p.preload = function () {
        p.bug = p.loadImage("data/bug5.png");
    }

    p.setup = function () {
        let p5canvas = p.createCanvas(360, 280, p.WEBGL);
        p5canvas.parent('cv1');
        p.gui = GUI.get(p5canvas, p);

        p.gui.button("b1", 10, 10, 100, 30).text("Click Me").orient("north").icon(p.bug)
            .setAction((info) => {
                console.log("b1", info);
            });
        //p.gui.scheme('red');

        p.gui.slider("s1", 100, 30, 200, 30).transparent().ticks(8, 2, true)
            .setAction((info) => {
                console.log("s1", info);
            });

        p.gui.ranger("r1", 100, 70, 200, 30).opaque().ticks(8, 2, true)
            .setAction((info) => {
                console.log("r1", info);
            });

        p.gui.checkbox("cbx1", 320, 20, 100, 20).orient('south').text("Pick me").select()
            .setAction((info) => {
                console.log("cbx1", info);
            });

        t = "Marmite and marmalde\nsandwiches\nmake a wonderful\nsnack"

        t = ['Peter Lager lives in Wales', 'and loves cheese', 'He also likes to play Brdige']

        p.gui.label('lbl0', 120, 140, 60, 20).text(t)
        console.log(p.gui.$('lbl0').text());
        //p.gui.textSize(16);

        p.gui.option("op1", 20, 150, 80, 18).text("Option 1").group('gp1')
        p.gui.option("op2", 20, 175, 80, 18).text("Option 2").group('gp1').select()
        p.gui.option("op3", 20, 200, 80, 18).text("Option 3").group('gp1')
        p.gui.option("op4", 20, 225, 80, 16).text("Option 4").group('gp1')
            .setAction(someAction);
        p.gui.option("op5", 20, 250, 80, 18).text("Option 5").group('gp1')
            .setAction((info) => {
                console.log("op5", info);
            });

        p.reset();
    }

    function someAction(info) {
        //console.log('Selected', a.source.name(), '    Deselected', a.previous.name())
        console.log(info.source.name(), info);
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

console.log("Test 002");
let p1 = new p5(sketch1);
setInterval(p1.reset, 10000);
