const PY = 320;

let gui, paper, graph, statusColor;

let startTime, data = [], data_time_id;

// Timer controls
let activeTmr, timers = [];
let scheme = 'purple';

let duration = 5000, leadTime = 500, lagTime = 1000;
let shape = 'bar', nextDir = 'forward', dir, uia = 'ignore';

function setup() {
    const p5canvas = createCanvas(720, 530);
    p5canvas.parent('sketch');
    cursor(CROSS);

    // Resources
    paper = createPaper(width - 20, 120);
    graph = createGraph(width - 20, 120);
    statusColor = getStatusColors();

    // Create the GUI controller for this canvas
    gui = createGUI('my gui', p5canvas);
    populateGUI(gui);

    activeTmr = timers[shape];

    ABOUT(gui, "Timer Control Demonstrator");
}

function draw() {
    background(192);
    noStroke();
    fill(210);
    rect(0, PY, width, height - PY);

    image(graph, 10, 36);
    const s = activeTmr ? activeTmr.status.toUpperCase() : '';
    gui.$('status').text(`Status: ${s}`);

    gui.draw();
    // Delete or comment out the next line to hide the pick buffer.
    // gui.showBuffer();
}

function startTimer() {
    if (activeTmr.status === CvsTimer.IDLE) {
        gui.$('timeout').hide();
        activeTmr = timers[shape];
        dir = nextDir;
        dir == 'forward' ? activeTmr.forward() : activeTmr.reverse();
        activeTmr.uiReaction(uia);
        activeTmr.scheme(scheme);
        data = [];
        activeTmr.start(duration, leadTime, lagTime);
        data_time_id = setInterval(updateGraph, 20);
    }
}

function timeout() {
    gui.$('timeout').show().text(`Executing user-defined action!`);
    let ind = ['A0', 'A1', 'A1', 'A1', 'A1', 'A1', 'A1', 'A0'];
    ind.forEach(c => data.push([1, c]));
    setTimeout(() => gui.$('timeout').hide(), 5000);
}

function updateGraph() {
    const status = activeTmr.status;
    const t = dir == 'forward' ? activeTmr.t : 1 - activeTmr.t;
    if (status !== CvsTimer.IDLE) {
        data.push([t, status]);
        while (data.length >= graph.width)
            data.shift();
        graph.clear();
        graph.image(paper, 0, 0);
        graph.strokeWeight(1);
        graph.noFill();
        const y = graph.height - 10, h = graph.height - 30;
        for (let i = 0, len = data.length; i < len; i++) {
            graph.stroke(statusColor.get(data[i][1]));
            graph.line(i, y, i, y - 10 - data[i][0] * h);
        }
    }
    else {
        clearInterval(data_time_id);
    }
}
