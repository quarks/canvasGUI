const SPLASH = {
    name: 'SPLASH',

    display: function () {
        background(32);
        fill(0, 255, 0); textSize(24);
        text('Demonstrates the use of a FSM (finite state machine) to create a multi part / mode / state sketch.', 0, 0, width, height);
        fill(240); textSize(20);
        text('Click mouse to continue ', 0, height - 30, width, 30);
    },

    enter: function () {
        counter = 0;
        textAlign(CENTER, CENTER);
    },

    leave: function () {
    },

    mouseClicked: function () {
        changeMode(RANGE);
    },

};
