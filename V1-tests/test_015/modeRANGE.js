let counter = 0;

const RANGE = {
    name: 'RANGE',
    gui: undefined,

    display: function () {
        background(240, 255, 240);
        stroke(0, 140, 0); strokeWeight(2);
        line(this.x0, 30, this.x0, height - 100);
        line(this.x1, 30, this.x1, height - 100);
        noStroke();
        fill('rgba(255,40,40, 0.5)');
        ellipse(this.x0, 100, 40, 40);
        fill('rgba(40,40,255, 0.5)');
        ellipse(this.x1, 100, 40, 40);
    },

    enter: function () {
        if (!this.gui) this.createGUI();
        this.gui.startEventHandling();
        textAlign(CENTER, CENTER);
    },

    leave: function () {
        this.gui.stopEventHandling();
    },

    createGUI() {
        let gui = GUI.getNamed('RANGE', p5canvas)
            .scheme('purple');
        let sw = width - 100, sx = (width - sw) / 2;
        this.x0 = sx + 120; this.x1 = sx + 300;
        gui.ranger('range', sx, 170, sw, 40)
            .limits(sx + 10, sx + sw - 10) // Set the min and max permitted values
            .range(this.x0, this.x1) // Set initial thumb positions
            .setAction((info) => {
                this.x0 = info.low;
                this.x1 = info.high;
            }
            );
        gui.button('continue', (width - 100) / 2, height - 40, 100, 30).textSize(18).text('Next')
            .setAction(() => { changeMode(EYES) });
        gui.stopEventHandling();
        this.gui = gui;

    },
};
