const f2 = Intl.NumberFormat(undefined, {
    minimumIntegerDigits: 2,
}).format;

let canvas, ctx, raf, gui, width, height, dcX = 220, dcY = 60;
let dgfont, watch, sprites;

let am = '', time = '';
let delay = 200, spIdx = 0, nextSprite;

async function setup() {
    canvas = document.getElementById('sketch');
    [width, height] = [canvas.width, canvas.height];
    // Must get the context (2d or WEBGL2) before creating the GUI
    ctx = canvas.getContext('2d');

    // Load fonts and images
    dgfont = await loadFont('DIGIFACE', './assets/digiface.ttf');
    watch = await loadImage('./assets/watch-sprites.png');

    // Create sprites
    sprites = makeSprites(watch, 7, 4);
    // Create and populate GUI
    gui = createGUI('My GUI', 'sketch');
    ABOUT(gui, "Loading images and fonts");
    populateGUI(gui);

    nextSprite = MILLIS() + delay;
    raf = window.requestAnimationFrame(draw);
}

function draw() {
    ctx.save();
    ctx.fillStyle = 'lightskyblue';
    ctx.fillRect(0, 0, width, height);
    // Draw sprite
    if (MILLIS() > nextSprite) {
        spIdx = (spIdx + 1) % sprites.length;
        nextSprite = MILLIS() + delay;
    }
    ctx.drawImage(sprites[spIdx], 0, 50, 240, 240);
    // Draw clock background
    ctx.beginPath()
    ctx.translate(dcX - 10, dcY - 10);
    ctx.roundRect(0, 0, 276, 116, [10, 10, 10, 10]);
    ctx.lineWidth = 3
    ctx.fillStyle = 'floralwhite';
    ctx.strokeStyle = 'black';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // Update clock time
    let [am, time] = getTimeText();
    gui.$('am-pm').text(am);
    gui.$('h:m:s').text(time);
    gui.draw();
    gui.showBuffer();
    raf = window.requestAnimationFrame(draw);
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        const msg = `Could not load image at ${url}`;
        image.onerror = () => reject(new Error(msg));
        image.src = url;
    });
}

function loadFont(family, url) {
    return new Promise((resolve, reject) => {
        url = `url(${url})`;
        const face = new FontFace(family, url);
        face.load().then((font) => {
            document.fonts.add(font);
            resolve(font);
        });
        const msg = `Could not load font at ${url}`;
        face.onerror = () => reject(new Error(msg));
        face.src = url;
    });
}

function populateGUI(g) {
    g.scheme('red')
        .textFont(dgfont)
        .corners(0);

    g.label('h:m:s', dcX, dcY, 300, 100, replaceEntities('00&lowast;00&lowast;00'))
        .transparent()
        .textAlign('left', 'top')
        .textSize(60)
        .corners(0)
    g.label('am-pm', dcX + 10, dcY + 62, 120, 40, 'am')
        .transparent()
        .textAlign('left', 'top')
        .textSize(20)
    g.slider('anim delay', dcX - 10, dcY + 150, 276, 50)
        .scheme('blue')
        .opaque()
        .corners(10)
        .ticks(4, 5)
        .weight(12)
        .limits(500, 20)
        .setAction(info => delay = info.value);
}

function getTimeText() {
    const d = new Date();
    let [hrs, mins, secs] = [d.getHours(), d.getMinutes(), d.getSeconds()];
    let am = hrs < 12 ? 'am' : 'pm';
    hrs %= 12;
    let t = `${f2(hrs)}&lowast;${f2(mins)}&lowast;${f2(secs)}`;
    return [am, replaceEntities(t)];
}

function makeSprites(imgElement, nbrX = 1, nbrY = 1) {
    const [w, h] = [imgElement.width, imgElement.height];
    const [sw, sh] = [Math.floor(w / nbrX), Math.floor(h / nbrY)];
    const ss = new OffscreenCanvas(w, h);
    ss.getContext('2d').drawImage(imgElement, 0, 0);
    const sprites = [];
    for (let y = 0; y < nbrY; y++) {
        for (let x = 0; x < nbrX; x++) {
            const sp = new OffscreenCanvas(sw, sh);
            const sp_ctx = sp.getContext('2d');
            sp_ctx.drawImage(ss, x * sw, y * sh, sw, sh, 0, 0, sw, sh);
            sprites.push(sp);
        }
    }
    return sprites;
}

function ABOUT(gui, title) {
    gui.label('about 1', 0, 0, width, 24)
        .scheme('light').corners(0)
        .textSize(16).textFont('sans-serif')
        .text(title, 'center', 'center')
        .shrink(0, 24);
    const dpr = Number.isInteger(devicePixelRatio)
        ? devicePixelRatio : Math.round(devicePixelRatio * 100) / 100;
    const mode = (gui.mode === 'JS') ? 'XXX' : VERSION;
    const vstr = `p5js: ${mode}   ##   canvasGUI: ${GUI.VERSION}   `
        + `##   Context: '${gui.contextType}'   ##   DPR: ${dpr}`;
    gui.label('about 2', 0, height - 24, width, 24)
        .scheme('light').corners(0)
        .textSize(13).textFont('sans-serif')
        .text(vstr, 'center', 'center');
}
