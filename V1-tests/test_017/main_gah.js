
let md_gah = function (p) {

    p.preload = function () {
        p.gah_data = p.loadBytes('models/gah/gah.md2');
        p.gah_tex = p.loadImage('models/gah/gah.png');
        p.gah_wep_data = p.loadBytes('models/gah/gah_weapon.md2');
        p.gah_wep_tex = p.loadImage('models/gah/gah_weapon.png');
        p.speed = p.loadImage('speed.png');
        p.rot_arrow = p.loadImage('rot_arrow.png');
        p.scale_down = p.loadImage('scale_down.png');
        p.scale_up = p.loadImage('scale_up.png');
    }

    p.setup = function () {
        const gahCanvas = p.createCanvas(600, 440, p.WEBGL);
        gahCanvas.parent('gah');
        // Make and initialise model for rendering
        p.angY = -Math.PI / 3;
        p.scale = 4;
        p.anim_speed = 5;
        p.stateName = 'stand';
        p.gah = makeMD2model(p.gah_data, p.gah_tex, mapXYZp5js);
        p.gah_wep = makeMD2model(p.gah_wep_data, p.gah_wep_tex, mapXYZp5js);
        p.gah = makeMD2model(p.gah_data, p.gah_tex, mapXYZp5js);
        p.gah_wep = makeMD2model(p.gah_wep_data, p.gah_wep_tex, mapXYZp5js);
        p.gah.setState(p.stateName, 10000).setAnimSpeed(4).setScale(4);
        p.gah_wep.setState(p.stateName, 10000).setAnimSpeed(4).setScale(4);
        // Make canvas GUI interface
        p.gui = GUI.getNamed('gahGUI', gahCanvas, p);
        p.makeGUI(p.gui);
        // Prepare base for model to stand on
        p.prepareBase();
        // Initialise timer
        p.time = p.millis();
    }

    p.prepareBase = function () {
        // Get base levels for each gah state
        p.baseLevel = [];
        for (let name of p.gah.getAnimStateNames())
            p.baseLevel[name] = p.gah.getBoundingBox(name).maxY;
        p.baseY = p.baseLevel[p.stateName];
        // Now create vetices for base
        let br = 160, nbrSides = 12, da = 2 * Math.PI / (nbrSides - 1);
        p.base = []; p.base.push(p.createVector(0, 0, 0));
        for (let i = 0; i < nbrSides; i++)
            p.base.push(p.createVector(br * Math.cos(i * da), 0, br * Math.sin(i * da)));
    }

    p.drawBase = function () {
        p.fill(190); p.stroke(216); p.strokeWeight(1.1);
        let baseLevel = p.baseY * p.scale;
        p.beginShape(p.TRIANGLES);
        for (let i = 1; i < p.base.length - 1; i++) {
            let v1 = p.base[i], v2 = p.base[i + 1];
            p.vertex(0, baseLevel, 0);
            p.vertex(v1.x * p.scale, baseLevel, v1.z * p.scale);
            p.vertex(v2.x * p.scale, baseLevel, v2.z * p.scale);
        }
        p.endShape(p.CLOSE);
    }

    p.draw = function () {
        let etime = p.millis() - p.time;
        p.time += etime;

        p.background(210, 200, 255);
        p.rotateY(p.angY);
        p.noStroke();
        p.gah.update(etime);
        p.gah_wep.update(etime);
        p.gah.render(p);
        if (p.stateName.indexOf('death') < 0) // do not render gun when dying
            p.gah_wep.render(p);
        p.drawBase();
        p.gui.draw();
    }

    p.makeGUI = function (gui) {
        let w = p.width;
        let h = p.height;
        gui.scheme('yellow').textSize(14);
        let names = p.gah.getAnimStateNames();
        let py = (h - names.length * 21.5) / 2;
        for (let i = 0; i < names.length; i++) {
            gui.option(names[i], 0, py + i * 21.5, 80, 20).text(names[i]).group('animations')
                .setAction((info) => {
                    p.stateName = info.source.name();
                    p.gah.setState(info.source.name(), 10000);
                    p.gah_wep.setState(info.source.name(), 10000);
                    p.baseY = p.baseLevel[info.source.name()];
                });
        }
        p.gui.$(p.stateName).select();
        gui.slider('rotation', 90, h - 30, w - 200, 30).limits(-Math.PI, Math.PI).value(p.angY)
            .opaque().ticks(6, 3).setAction((info) => { p.angY = info.value });
        gui.slider('speed', 90, h - 60, w - 200, 30).limits(1, 10).value(p.anim_speed).opaque()
            .ticks(9).setAction((info) => {
                p.anim_speed = info.value;
                p.gah.setAnimSpeed(p.anim_speed);
                p.gah_wep.setAnimSpeed(p.anim_speed);
            });
        gui.slider('scale', w - 40, 40, h - 80, 40).orient('north').limits(2, 8).value(p.scale)
            .opaque().ticks(6).setAction((info) => {
                p.scale = info.value;
                p.gah.setScale(p.scale);
                p.gah_wep.setScale(p.scale);
            });
        gui.label('scale+ icon', w - 40, 0, 40, 40).icon(p.scale_up);
        gui.label('scale- icon', w - 40, h - 40, 40, 40).icon(p.scale_down);
        gui.label('rot icon', w - 110, h - 30, 60, 30).icon(p.rot_arrow);
        gui.label('speed icon', w - 110, h - 60, 60, 30).icon(p.speed);
    }
}

const sk_gah = new p5(md_gah);


