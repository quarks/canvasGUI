let gui, _icon, _text, text_align, icon_align;

function preload() {
    _icon = loadImage("./images/crab.png");
}

function setup() {
    let p5canvas = createCanvas(400, 220); p5canvas.parent('sketch_a');
    // Create the GUI controller for this canvas
    gui = GUI.get(p5canvas);
    _text = "Ahhh... crab legs\nlegs for dinner!!";
    text_align = CENTER;
    icon_align = LEFT;
    // The label to configure
    gui.label('crab', 50, 46, 300, 60).text(_text)
        .textSize(20).icon(_icon)
    // Text alignment options
    gui.label('ta_lbl', 50, 120, 120, 20).text('Text Alignment').textSize(15).transparent();

    gui.option('tleft', 50, 150, 120, 18).text('LEFT').group('talign')
        .setAction(function () { text_align = LEFT; alignment() });
    gui.option('tcenter', 50, 170, 120, 18).text('CENTER', CENTER).group('talign').select()
        .setAction(function () { text_align = CENTER; alignment() });
    gui.option('tright', 50, 190, 120, 18).text('RIGHT', RIGHT).group('talign')
        .setAction((info) => { text_align = RIGHT; alignment() });
    // image alignment options
    gui.label('ia_lbl', 220, 120, 120, 20).text('Icon Alignment').textSize(16).transparent();
    gui.option('ileft', 220, 150, 120, 18).text('LEFT').group('ialign').select()
        .setAction((info) => { icon_align = LEFT; alignment() });
    gui.option('iright', 220, 170, 120, 18).text('RIGHT', RIGHT).group('ialign')
        .setAction((info) => { icon_align = RIGHT; alignment() });
    // text/ no text
    gui.checkbox('notext', 50, 20, 120, 20).text('No text').setAction((info) => {
        if (info.selected) {
            gui.$('crab').noText()//.invalidateBuffer();
            gui.$('tleft').disable();
            gui.$('tcenter').disable();
            gui.$('tright').disable();
        }
        else {
            gui.$('crab').text(_text);
            gui.$('tleft').enable();
            gui.$('tcenter').enable();
            gui.$('tright').enable();
        }
    });
    // icon/ no icon
    gui.checkbox('noicon', 220, 20, 120, 20).text('No icon').setAction((info) => {
        if (info.selected) {
            gui.$('crab').noIcon() //.invalidateBuffer();
            gui.$('ileft').disable();
            gui.$('iright').disable();
        }
        else {
            gui.$('crab').icon(_icon);
            gui.$('ileft').enable();
            gui.$('iright').enable();
        }
    });
}

// Apply any changes
function alignment() {
    gui.$('crab').textAlign(text_align).iconAlign(icon_align);
}

function draw() {
    push();
    background(220, 230, 255);

    pop();
    gui.draw();
}