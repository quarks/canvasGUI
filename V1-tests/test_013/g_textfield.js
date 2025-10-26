let gui, img;

function setup() {
    let p5canvas = createCanvas(600, 300);
    p5canvas.parent('sketch');
    gui = GUI.get(p5canvas);

    gui.slider(`sdr`, 50, height - 50, width - 100, 30);
    gui.button('btn', 40, 30, 80, 20).text('Button');
    gui.textSize(18);

    let n = 0;
    for (let i = 0; i < 20; i++) {
        let x = i % 4, y = Math.floor(i / 4);
        gui.textfield('ns' + n++, 10 + 150 * x, 60 + y * 30, 130, 20)
            .textSize(16)
            .index(n, 4)
            .validation(v0)
            .setAction((info) => {
                console.log('EVENT:', info.source._linkIndex, info.value)
            })
    }
    gui.$('ns9').text('Peter Lager')
    // gui.$('ns14').text('Peter Lager')
    gui.$('ns14').scheme('red').textSize(8).text('Peter Lager')
    gui.$('ns13').disable()
    gui.$('ns10').disable()
    // console.log(gui.$('ns8').hasValidText());

}

function v0(text) {
    if (!text || text.length == 0)
        return [true];
    if (text.length > 6)
        return [true, text.toUpperCase()];
    return [false];
}

function draw() {

    push();
    background(190);
    pop();
    gui.draw();
}