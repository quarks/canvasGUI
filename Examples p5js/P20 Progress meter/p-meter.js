let gui, prg, icon0, v;
const interval = 30, delta = 0.01;

async function setup() {
    let p5canvas = createCanvas(480, 320);
    icon0 = await loadImage('assets/qavatar32.png');
    gui = createGUI('mygui', p5canvas);

    populateGUI(gui);
    v = 0;
}



function draw() {
    background(230);

    gui.draw();
}

function populateGUI(gui) {
    gui.textSize(16);
    // Progress bar
    prg = gui.progress('prg0', 60, 50, 300, 40)
        .textSize(20).textStyle(BOLD);
    prg.icon(icon0);
    prg.iconAlign(LEFT, CENTER);

    // Manual test
    gui.slider('sdr', 10, 10, 300, 30)
        .opaque()
        .ticks(10, 2)
        .value(0)
        .setAction(info => {
            prg.progress(info.value);
            gui.$('lbl').text(info.value.toFixed(3));
        });
    gui.label('lbl', 320, 10, 140, 30).textSize(22);


    // Blank test
    gui.button('blank', 30, 110, 100, 26, 'Blank')
        .textSize(16).textStyle(BOLD)
        .setAction(() => { if (v == 0) setTimeout(blank, interval) });

    // Percent test
    gui.button('100%', 30, 150, 100, 26, '100%')
        .textSize(16).textStyle(BOLD)
        .setAction(() => { if (v == 0) setTimeout(percent, interval) });

    // Task test
    gui.button('task', 30, 190, 100, 26, 'User Task')
        .textSize(16).textStyle(BOLD)
        .setAction(() => { if (v == 0) setTimeout(task, interval) });

}

function blank() {
    v += random(delta);
    prg.progress(v, '');
    if (v < 1)
        setTimeout(blank, interval);
    else {
        v = 0;
        prg.reset();
    }
}

function percent() {
    v += random(delta);
    prg.progress(v, undefined);
    if (v < 1)
        setTimeout(percent, interval);
    else {
        v = 0;
        prg.reset();
    }
}

function task() {
    v += random(delta);
    prg.progress(v, 'LOADING');
    if (v < 1)
        setTimeout(task, interval);
    else {
        v = 0;
        prg.reset();
    }
}
