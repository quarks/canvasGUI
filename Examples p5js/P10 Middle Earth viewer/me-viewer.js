
async function setup() {
    const p5canvas = createCanvas(800, 700, P2D);
    p5canvas.parent('sketch');
    cursor(CROSS);
    is3d = p5canvas.GL;
    bgd = await loadImage('./assets/me_title.png');
    me0 = await loadImage('./assets/me_3200_base.png');
    me1 = await loadImage('./assets/me_3200_places.png');
    me2 = await loadImage('./assets/me_3200_riversroads.png');
    me3 = await loadImage('./assets/me_3200_mountains.png');
    me4 = await loadImage('./assets/me_3200_contourheight.png');
    me5 = await loadImage('./assets/me_3200_countries.png');
    eye0 = await loadImage('./assets/eye0.png');
    eye1 = await loadImage('./assets/eye1.png');
    gui = createGUI('me map', p5canvas);

    populateGUI(gui);
}

function populateGUI(gui) {
    gui.textSize(16)
        .scheme('yellow');
    // Middle Earth viewer
    gui.viewer('me viewer', 20, 20, 760, 500)
        .layers([me0, me1, me2, me3, me4, me5])
        .view(1400, 1290).scaler(1.1, 0.21, 3)
        .setAction((info) => {
            let [id, cX, cY, scale] =
                [info.source.id, info.cX, info.cY, info.scale];
            // console.log(`${id} World centre at ${cX}, ${cY}  Scale ${scale}`);
        });

    // Layer visibility controls
    gui.label('legend', 20, 530, 240, 34)
        .textSize(18)
        .textStyle(BOLD)
        .text('MAP FEATURES');

    gui.checkbox('major-countries', 280, 530, 240, 34)
        .text("Major countries")
        .icons([eye0, eye1])
        .select()
        .setAction((info) => layerVisibility(info.selected, 5));

    gui.checkbox('minor-countries', 540, 530, 240, 34)
        .text("Minor countries & towns")
        .icons([eye0, eye1])
        .select()
        .setAction((info) => layerVisibility(info.selected, 1));

    gui.checkbox('mountains', 20, 576, 240, 34)
        .text("Mountain ranges")
        .icons([eye0, eye1])
        .select()
        .setAction((info) => layerVisibility(info.selected, 3));

    gui.checkbox('rivers-roads', 280, 576, 240, 34)
        .text("Rivers & roads")
        .icons([eye0, eye1])
        .select()
        .setAction((info) => layerVisibility(info.selected, 2));

    gui.checkbox('contour-heights', 540, 576, 240, 34)
        .text("Contour heights")
        .icons([eye0, eye1])
        .select()
        .setAction((info) => layerVisibility(info.selected, 4));
}

function layerVisibility(visible, nbr) {
    let v = gui.$('me viewer');
    visible ? v.showLayer(nbr) : v.hideLayer(nbr);
}

function draw() {
    image(bgd, 0, 0);

    gui.draw();
    // Delete or comment out the next line to hide the pick buffer.
    // gui.showBuffer();
}
