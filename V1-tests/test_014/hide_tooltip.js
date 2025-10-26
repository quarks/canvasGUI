let gui;

function setup() {
    let p5canvas = createCanvas(600, 300);
    p5canvas.parent('sketch');

    gui = GUI.get(p5canvas);
    gui.textSize(14);
    gui.button('btn0', 60, 50, 200, 80).text('Dummy').tooltip('Click me')
        .setAction((info) => {
            console.log(info.source._children)
        })

    gui.checkbox('cbxShow', 320, 50, 200, 30).text('Show button').select()
        .setAction((info) => {
            if (info.selected)
                gui.$('btn0').show();
            else
                gui.$('btn0').hide(true);
        });
    gui.checkbox('cbxEnable', 320, 90, 200, 30).text('Enable button').select()
        .setAction((info) => {
            if (info.selected)
                gui.$('btn0').enable();
            else
                gui.$('btn0').disable();
        });
}

function draw() {
    background(200, 220, 220);

    gui.draw();

}