/**
 * The Middle Earth sketch in instance mode
 * @param {*} p 
 */
 let sketch1 = function (p) {

    this.viewer = 0;

    p.preload = function () {
        p.me0 = p.loadImage('data/me_3200_base.png');
        p.me1 = p.loadImage('data/me_3200_places.png');
        p.me2 = p.loadImage('data/me_3200_riversroads.png');
        p.me3 = p.loadImage('data/me_3200_mountains.png');
        p.me4 = p.loadImage('data/me_3200_contourheight.png');
        p.me5 = p.loadImage('data/me_3200_countries.png');
        p.me_title = p.loadImage('data/me_title.png');
    };

    p.setup = function () {
        let p5canvas = p.createCanvas(800, 740);
        //p5canvas.parent('cv1');
        p.gui = GUI.get(p5canvas, p).textSize(16).scheme('red');

        p.viewer = p.gui.viewer('view-0', 30, 40, 710, 500)
            .layers([p.me0, p.me1, p.me2, p.me3, p.me4, p.me5])
            .view(1400, 1290).scale(1.1, 0.2, 3)
            .setAction((info) => {
                //console.log(`${info.source.name()} World centre at ${info.cX}, ${info.cY}  Scale ${info.scale}`);
                p.cX = info.cX; p.cY = info.cY; p.scale = info.scale;
            });
        p.gui.label('legend', 30, 565, 230, 30).text('Show / hide names').textSize(18);
        p.layer1 = p.gui.checkbox('major-countries', 270, 565, 230, 30)
            .text("Major countries").select()
            .setAction((info) => {
                info.selected ? p.viewer.showLayer(5) : p.viewer.hideLayer(5);
            });
        p.layer2 = p.gui.checkbox('minor-countries', 510, 565, 230, 30)
            .text("Minor countries and towns").select()
            .setAction((info) => {
                info.selected ? p.viewer.showLayer(1) : p.viewer.hideLayer(1);
            });
        p.layer3 = p.gui.checkbox('mountains', 30, 600, 230, 30)
            .text("Mountain ranges").select()
            .setAction((info) => {
                info.selected ? p.viewer.showLayer(3) : p.viewer.hideLayer(3);
            });
        p.layer4 = p.gui.checkbox('rivers-roads', 270, 600, 230, 30)
            .text("Rivers and roads").select()
            .setAction((info) => {
                info.selected ? p.viewer.showLayer(2) : p.viewer.hideLayer(2);
            });
        p.layer5 = p.gui.checkbox('contour-heights', 510, 600, 230, 30)
            .text("Contour heights").select()
            .setAction((info) => {
                info.selected ? p.viewer.showLayer(4) : p.viewer.hideLayer(4);
            });

    };

    p.draw = function () {
        p.push();
        p.background(p.me_title);
        p.pop();
        p.gui.draw();
    };

    p.keyTyped = function () {
        if (p.key == ' ')
            console.clear();
        if (p.key == 's') {
            console.log(p.viewer.status());
        }
        if (p.key == 'p') {
            console.log(p.cX, p.cY, p.scale);
        }
    };
};

let p1 = new p5(sketch1);
