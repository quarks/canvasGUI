let img;

function preload() {
    img = loadImage("./data/seaside.jpg");
}

function setup() {
    let p5canvas = createCanvas(535, 360); p5canvas.parent('paper');
    // Create the GUI controller for this canvas
    gui = GUI.get(p5canvas);
    gui.textSize(18);
    gui.label('isize', 0, height - 60, width, 30).text(`Image size ${img.width}x${img.height}`)
    gui.label('status', 0, height - 30, width, 30)

    gui.viewer('picture', 50, 40, 300, 200).layers(img).transparent()

        .setAction((info) => {
            let cx = round(info.cX), cy = round(info.cY);
            let s = round(info.scale * 1000) / 1000;
            let t = `View centred at [${cx}, ${cy}] and Scale of ${s}`;
            gui.$('status').text(t);
        })
        .scaler(0.25, 0.15, 1).view(500, 452, 0.3)
}

function draw() {
    push();
    background(30, 20, 130);

    pop();
    gui.draw();
}