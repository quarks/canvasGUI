
const NUMBERS = {
    name: 'NUMBERS',
    gui: undefined,

    digits: '',

    display: function () {
        background(220, 220, 255);
        stroke(0, 0, 128); strokeWeight(3);
        line(160, 160, 180, 160);
        line(170, 150, 170, 170);
        line(300, 155, 320, 155);
        line(300, 165, 320, 165);
    },

    enter: function () {
        if (!this.gui) this.createGUI();
        this.gui.startEventHandling();
        textAlign(CENTER, CENTER);
        this.digits = '';
    },

    leave: function () {
        this.gui.stopEventHandling();
    },

    createGUI() {
        // console.log(`Creating GUI for RANGE mode`);
        let gui = GUI.getNamed('NUMBERS', p5canvas)
            .scheme('green').textSize(30);
        gui.textfield('N1', 50, 140, 100, 40).index(1)
            .validation(this.validNumbers);
        gui.textfield('N2', 190, 140, 100, 40).index(2)
            .validation(this.validNumbers);
        gui.textfield('Ans', 330, 140, 100, 40).index(3)
            .validation(this.validAnswer);
        gui.button('restart', (width - 140) / 2, height - 40, 140, 30)
            .textSize(18).text('Restart Sketch').scheme('blue')
            // Allow time for event to propogate before changing mode
            .setAction(() => { setTimeout(() => { console.log('Button click NUMBERS'); changeMode(SPLASH); }, 200) });
        gui.stopEventHandling();
        this.gui = gui;
    },

    validNumbers(text) {
        if (!text || text.length == 0)
            return [true];
        let n = text ? Number(text) : Number.NaN;
        return [(n >= 1 && n <= 99 && Number.isInteger(n))];
    },

    validAnswer(text) {
        if (!text || text.length == 0)
            return [true];
        let n = text ? Number(text) : Number.NaN;
        return [(n >= 1 && Number.isInteger(n))];
    },

}

