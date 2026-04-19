let gui, btn_icon;
let width, height;
let canvas, ctx, raf;

async function setup() {
    canvas = document.getElementById('sketch');
    [width, height] = [canvas.width, canvas.height];
    // Must get the context (2d or WEBGL2) before creating the GUI
    ctx = canvas.getContext('2d');

    // Create the GUI controller for this canvas
    gui = createGUI('my gui', 'sketch');
    ABOUT(gui, "Demo: Checkboxes and Options (radio buttons)");
    populateGUI(gui);
    raf = window.requestAnimationFrame(draw);
}

function draw() {
    ctx.fillStyle = 'rgb(0 180 180)';
    ctx.fillRect(0, 0, width, height);
    gui.draw();
    // Delete or comment out the next line to hide the pick buffer.
    gui.showBuffer();
    raf = window.requestAnimationFrame(draw);
}

function populateGUI(gui) {
    gui.scheme('cyan')
        .textSize(18);
    gui.label('menu', 10, 40, 620, 40)
        .scheme('dark')
        .textSize(30)
        .text("Quarks's Deli");
    // FOOD
    // Food availability?
    gui.checkbox('to eat', 30, 90, 240, 30)
        .scheme('blue')
        .text('Sandwich required')
        .select()
        .setAction((info) => foodRequired(info.selected));
    // food options
    gui.option('ham', 60, 130, 210, 22)
        .group('eatable')
        .text('Ham and tomato')
        .setAction((info) => foodChoice(info));
    gui.option('cheese', 60, 160, 210, 22)
        .group('eatable')
        .text('Cheese and onion')
        .setAction((info) => foodChoice(info));
    gui.option('prawn', 60, 190, 210, 22)
        .group('eatable')
        .text('Prawn mayo')
        .select()
        .setAction((info) => foodChoice(info));
    // food chosen
    gui.label('sandwich', 30, 230, 240, 60)
        .corners(10)
        .scheme('green')
        .text('???');

    // DRINKS
    // drink availability?
    gui.checkbox('to drink', 370, 90, 240, 30)
        .scheme('blue')
        .text('Juice required')
        .select()
        .setAction((info) => drinkRequired(info.selected));
    // drink options
    gui.option('orange', 400, 130, 210, 22)
        .group('drinkable')
        .text('Orange')
        .setAction((info) => drinkChoice(info));
    gui.option('mixedfruit', 400, 160, 210, 22)
        .group('drinkable')
        .text('Mixed fruit')
        .setAction((info) => drinkChoice(info));
    gui.option('cranberry', 400, 190, 210, 22)
        .group('drinkable')
        .text('Cranberry')
        .select()
        .setAction((info) => drinkChoice(info));
    // drink chosen
    gui.label('juice', 370, 230, 240, 60)
        .corners(10)
        .scheme('green')
        .text('???');
}

// Named event handlers for the option buttons
function foodChoice(info) {
    let st = info.source.text();
    gui.$('sandwich').text(`"${st}"\nsandwich chosen`);
}

function drinkChoice(info) {
    let st = info.source.text();
    gui.$('juice').text(`"${st}"\njuice chosen`);
}

// Named event handlers for the checkbox buttons
function foodRequired(required) {
    if (required) {
        gui.$('ham').enable();
        gui.$('cheese').enable();
        gui.$('prawn').enable();
        gui.$('sandwich').show();
    }
    else {
        gui.$('ham').disable();
        gui.$('cheese').disable();
        gui.$('prawn').disable();
        gui.$('sandwich').hide();
    }
}

function drinkRequired(required) {
    if (required) {
        gui.$('orange').enable();
        gui.$('mixedfruit').enable();
        gui.$('cranberry').enable();
        gui.$('juice').show();
    }
    else {
        gui.$('orange').disable();
        gui.$('mixedfruit').disable();
        gui.$('cranberry').disable();
        gui.$('juice').hide();
    }
}

function ABOUT(gui, title) {
    gui.label('about 1', 0, 0, width, 24)
        .scheme('light').corners(0).textSize(16)
        .text(title, 'center', 'center')
        .shrink(0, 24);
    const dpr = Number.isInteger(devicePixelRatio)
        ? devicePixelRatio : Math.round(devicePixelRatio * 100) / 100;
    const mode = (gui.mode === 'JS') ? 'XXX' : VERSION;
    const vstr = `p5js: ${mode}   ##   canvasGUI: ${GUI.VERSION}   `
        + `##   Context: '${gui.contextType}'   ##   DPR: ${dpr}`;
    gui.label('about 2', 0, height - 24, width, 24)
        .scheme('light').corners(0).textSize(13)
        .text(vstr, 'center', 'center');
}
