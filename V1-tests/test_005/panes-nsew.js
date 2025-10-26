
let sketch1 = function (p) {

    p.setup = function () {
        let p5canvas = p.createCanvas(360, 280);
        p5canvas.parent('cv1');
        p.gui = GUI.get(p5canvas, p);
        console.log(p5canvas.curCamera)

        p.gui.pane('east_1', 'east', 80).text('East 1').setAction((info) => {
            console.log(info.source.name(), info.state);
        });
        p.gui.pane('west_1', 'west', 80).text('West 1').setAction((info) => {
            console.log(info.source.name(), info.state);
        });
        p.gui.pane('south_1', 'south', 80).text('South 1').setAction((info) => {
            console.log(info.source.name(), info.state);
        });
        p.gui.pane('north_1', 'north', 80).text('North 1').setAction((info) => {
            console.log(info.source.name(), info.state);
        });

    }

    p.draw = function () {
        //console.log(p.gui.$("north_1").isActive());
        p.push();
        p.background(255, 160, 64);


        p.pop();
        p.gui.draw();
    }

}

console.log("Test 005 : Simple Panes");
let p1 = new p5(sketch1);
setInterval(p1.reset, 10000);
