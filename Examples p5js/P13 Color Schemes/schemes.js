let gui, crab, seaside;

async function setup() {
    const p5canvas = createCanvas(600, 405);
    cursor(HAND);
    crab = await loadImage("./assets/crab.png");
    seaside = await loadImage("./assets/seaside.jpg");
    // Create the GUI controller for this canvas
    gui = createGUI('demoGUI', p5canvas);
    // Change the global rendering options for this GUI
    gui.textSize(16);
    ABOUT(gui, 'Available color schemes to choose from.')
    // Add some controls to the GUI
    populateColorSelectors(gui);
    populateGUI(gui);
}

function draw() {
    push();
    background(180, 200, 200);
    noStroke();
    fill((gui.scheme().name == 'dark') ? 32 : 220)
    rect(0, 0, width - 140, height);
    pop();
    gui.draw();
    // Delete or comment out the next line to hide the pick buffer.
    gui.showBuffer();
}

// These controls override the default gui color scheme
function populateColorSelectors(gui) {
    let schemes = gui.colorSchemeNames;
    for (let i = 0; i < schemes.length; i++) {
        gui.option(schemes[i], 480, 12 + i * 38, 100, 30)
            .scheme(schemes[i])
            .textFont('monospace')
            .textStyle(BOLD)
            .textSize(18)
            .textAlign(CENTER)
            .group('color options')
            .text(schemes[i])
            .setAction((info) => {
                gui.scheme(info.source.id);
                gui.$('heading').text(`Color Scheme:   "${gui.scheme().name}"`);
            });
    }
    // Mark the current gui color scheme as selected 
    gui.$(gui.scheme().name).select();
}

// These controls use the default gui color scheme
function populateGUI(gui) {
    gui.label('heading', 10, 10, 440, 60)
        .textSize(30)
        .text(`Color Scheme:   "${gui.scheme().name}"`)

    gui.button('btnCrab', 10, 80, 200, 60)
        .text("Ahhh... crab legs\n for dinner ! !")
        .textSize(16)
        .icon(crab)
        .tooltip('Very tasty tip')
        .tipTextSize(14)
        .setAction(() => console.log('They were yummy'));

    gui.checkbox('cbx', 220, 80, 230, 26).text('Like some wine with that?');
    gui.option('white wine', 220, 110, 70, 30).group('wine')
        .textAlign(CENTER).textSize(13).text('White').select();
    gui.option('rose wine', 300, 110, 70, 30).group('wine')
        .textAlign(CENTER).textSize(13).text('Rose');
    gui.option('red wine', 380, 110, 70, 30).group('wine')
        .textAlign(CENTER).textSize(13).text('Red');

    gui.textfield('txf', 10, 150, 440, 30)
        .text('Click to edit this text ---  Press ENTER when done.')

    gui.slider('sdr', 10, 190, 210, 26).ticks(5, 2).opaque();
    gui.ranger('rgr', 240, 190, 210, 26).ticks(5, 2).opaque();

    gui.option('X0', 10, 230, 70, 34).group('jsmode').text('X0')
        .textSize(15).iconAlign(RIGHT).textAlign(CENTER)
        .setAction(() => gui.$('jstick').mode('X0'));
    gui.option('X4', 10, 270, 70, 34).group('jsmode').text('X4')
        .textSize(14).iconAlign(RIGHT).textAlign(CENTER)
        .setAction(() => gui.$('jstick').mode('X4'));
    gui.option('X8', 10, 310, 70, 34).group('jsmode').text('X8')
        .textSize(14).iconAlign(RIGHT).textAlign(CENTER).select()
        .setAction(() => gui.$('jstick').mode('X8'));

    gui.joystick('jstick', 90, 230, 114, 114).mode('X8').opaque();

    gui.viewer('picture', 230, 230, 220, 114).layers(seaside)
        .scaler(0.5, 0.42, 1).view(256, 133, 0.5)
}


function ABOUT(gui, title) {
    gui.label('about 1', 0, height - 48, width, 24)
        .scheme('light').corners(0).textSize(16)
        .text(title, 'center', 'center').shrink(0, 24);
    const dpr = Number.isInteger(devicePixelRatio)
        ? devicePixelRatio : Math.round(devicePixelRatio * 100) / 100;
    const mode = (gui.mode === 'JS') ? 'XXX' : VERSION;
    const vstr = `p5js: ${mode}   ##   canvasGUI: ${GUI.VERSION}   `
        + `##   Context: '${gui.contextType}'   ##   DPR: ${dpr}`;
    gui.label('about 2', 0, height - 24, width, 24)
        .scheme('light').corners(0).textSize(13)
        .text(vstr, 'center', 'center');
}
