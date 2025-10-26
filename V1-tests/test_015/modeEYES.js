const EYES = {
    name: 'EYES',
    gui: undefined,

    display: function () {
        background(160, 20, 30);
        stroke(0); strokeWeight(2);
        for (let i = 0; i < 2; i++) {
            let ex = (0.4 + 0.2 * i) * width;
            fill(255);
            ellipse(ex, 60, 60, 40);
            fill(0);
            ellipse(ex + this.pupilX * 40, 60, 20, 20)
        }
        fill(200, 40, 60); strokeWeight(1);
        triangle(width / 2, 70, width / 2 - 20, 100, width / 2 + 20, 100);
        fill(255, 255, 0); noStroke(); textSize(20);
        text('Mode selection:   [P] Previous   [N] Next ', 0, height - 30, width, 30);
    },

    enter: function () {
        if (!this.gui) this.createGUI();
        this.gui.startEventHandling();
        textAlign(CENTER, CENTER);
    },

    leave: function () {
        this.gui.stopEventHandling();
    },

    keyTyped: function () {
        if (key == 'p')
            changeMode(RANGE);
        if (key == 'n')
            changeMode(NUMBERS);
    },

    createGUI() {
        this.pupilX = 0;
        let gui = GUI.getNamed('EYES', p5canvas);
        gui.slider('eyes', 100, 130, width - 200, 30).scheme('red')
            .opaque() // make the control background opaque
            .ticks(2, 10) // Make major and minor ticks
            .limits(-0.5, 0.5) // Set the min and max permitted value 
            .setAction((info) => {
                this.pupilX = info.value;
            }
            );
        gui.stopEventHandling();
        this.gui = gui;
    },
};

