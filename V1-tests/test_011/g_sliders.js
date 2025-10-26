let gui;


function setup() {
    let p5canvas = createCanvas(600, 260); p5canvas.parent('sketch');
    // Create the GUI controller for this canvas
    gui = GUI.get(p5canvas);
    gui.textSize(10.5);
    // The label to configure
    gui.label('title', 20, 10, 560, 40).text('Sliders and Rangers').textSize(20);

    gui.slider('sdr0', 150, 60, 300, 20).limits(0, 100).value(23).opaque()
        .setAction((info) => {
            gui.$('sdr0v').text(info.value.toString());
        })
    gui.label('sdr0v', 460, 60, 120, 20).text(gui.$('sdr0').value());

    gui.slider('sdr1', 150, 90, 300, 20).limits(0, 100).value(64).ticks(2, 5).opaque()
        .setAction((info) => {
            gui.$('sdr1v').text(info.value.toString());
        })
    gui.label('sdr1v', 460, 90, 120, 20).text(gui.$('sdr1').value());

    gui.slider('sdr2', 150, 120, 300, 20).limits(0, 100).value(87).ticks(10, 2, true).scheme('red')
        .setAction((info) => {
            gui.$('sdr2v').text(info.value.toString());
        })
    gui.label('sdr2v', 460, 120, 120, 20).text(gui.$('sdr2').value()).scheme('red');


    gui.ranger('rgr0', 150, 160, 300, 20).limits(0, 100).range(22, 60)
        .setAction((info) => {
            gui.$('rgr0high').textinfo.high.toString();
            gui.$('rgr0low').text(info.low.toString());
        })
    gui.label('rgr0low', 20, 160, 120, 20).text(gui.$('rgr0').low());
    gui.label('rgr0high', 460, 160, 120, 20).text(gui.$('rgr0').high());

    gui.ranger('rgr1', 150, 190, 300, 20).limits(0, 100).range(40, 77).ticks(5, 5)
        .setAction((info) => {
            gui.$('rgr1high').text('' + info.high.toString());
            gui.$('rgr1low').text('' + info.low.toString());
        })
    gui.label('rgr1low', 20, 190, 120, 20).text(gui.$('rgr1').low());
    gui.label('rgr1high', 460, 190, 120, 20).text(gui.$('rgr1').high());

    gui.ranger('rgr2', 150, 220, 300, 20).limits(0, 100).range(30, 90).scheme('red').ticks(10, 2, true)
        .setAction((info) => {
            gui.$('rgr2high').text(info.high.toString());
            gui.$('rgr2low').text(info.low.toString());
        })
    gui.label('rgr2low', 20, 220, 120, 20).text(gui.$('rgr2').low()).scheme('red');
    gui.label('rgr2high', 460, 220, 120, 20).text(gui.$('rgr2').high()).scheme('red');
}


function draw() {
    push();
    background(220, 230, 255);

    pop();
    gui.draw();
}