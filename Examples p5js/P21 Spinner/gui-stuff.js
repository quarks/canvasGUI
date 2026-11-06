function spinnerControls(gui, x, y, scheme) {
    // Information
    gui.label('lbl info', 10, 40, 260, 32, 'Spinner Controls').textSize(20);
    gui.poster('info', 10, 80, 480, 170).text(info).transparent();
    // Timer for top spinner
    gui.timer('tmr15', width - 130, 80, 120, 120)
        .uiReaction('pause')
        .setAction(info => {
            const ev = floor(random(spin15.maxValue + 1));
            gui.$('spin15').rollTo(ev);
        });

    // Start counting
    gui.button('start', 10, y - 100, 140, 90, 'START\nSPINNER')
        .textSize(26)
        .setAction(info => {
            if (spin4.isIdle) {
                spin4.setTo(sValue).countTo(fValue).speed(speed);
                gui.$('activity').text(`Counting from ${sValue} to ${fValue}`);
                info.source.disable();
            }
        });
    // Stop counting
    gui.button('stop', 10, y, 140, 40, 'STOP')
        .textSize(26)
        .setAction(info => {
            if (!spin4.isIdle) {
                spin4.stop();
                gui.$('activity').text('');
                gui.$('start').enable();
            }
        });
    // Show activity string
    gui.label('activity', 160, y, width - 170, 40)
        .scheme('orange').textSize(24);
    // Start value controls
    let grid = gui.grid(x, y + 50, 620, 105);
    grid.size([22, 11, 83], 3);
    const fmt = { scheme: scheme, opaque: undefined };
    const txtFmt = { textStyle: BOLD, textSize: 16 }
    const nbrFmt = { textFont: 'monospace' };

    gui.label('lbl start', ...grid.cell(0, 0, 1, 1), 'Start value')
        .format(txtFmt, fmt);
    gui.label('start value', ...grid.cell(1, 0, 1, 1), sValue)
        .format(txtFmt, nbrFmt, fmt);
    gui.slider('sdr start', ...grid.cell(2, 0, 1, 1)).format(fmt)
        .limits(0, spin4.maxValue).ticks(10, 5).value(sValue)
        .setAction(info => {
            sValue = round(info.value);
            gui.$('start value').text(sValue);
        });

    // Target value controls
    gui.label('lbl final', ...grid.cell(0, 1, 1, 1), 'Target value')
        .format(txtFmt, fmt);
    gui.label('target value', ...grid.cell(1, 1, 1, 1), fValue)
        .format(txtFmt, nbrFmt, fmt);
    gui.slider('sdr final', ...grid.cell(2, 1, 1, 1)).format(fmt)
        .limits(0, spin4.maxValue).ticks(10, 5).value(fValue)
        .setAction(info => {
            fValue = round(info.value);
            gui.$('target value').text(fValue);
        });

    // Speed controls
    gui.label('lbl speed', ...grid.cell(0, 2, 1, 1), 'Speed').format(txtFmt, fmt);
    gui.label('speed', ...grid.cell(1, 2, 1, 1), speed)
        .format(txtFmt, nbrFmt, fmt);
    gui.slider('sdr speed', ...grid.cell(2, 2, 1, 1)).format(fmt)
        .limits(1, 9).ticks(8, 10).value(speed)
        .setAction(info => {
            speed = info.value;
            gui.$('speed').text(speed.toFixed(2));
        });


}

// This is the action function for your the color selectors. Simply modify 
// it to suit the sketch requirements 
function changeScheme(gui, scheme) {
    console.log('-----------------------------------------------------------------------------')
    console.log(`Change color scheme to ${scheme} `)
    spin4.scheme(scheme);
}

function getActionString(info) {
    const [src, type] = [info.source, info.type.toUpperCase()];
    let s;
    switch (type) {
        case 'COUNT':
        case 'ROLL':
            s = `${type}ED from ${info.startValue}  to ${info.endValue}`;
            break;
        case 'UI':
            s = `${type} :: "${src.id}"   `;
            s += `Value: ${info.value}   Reel Idx: ${info.reelIdx}    `;
            s += `Digit: ${info.digit}         Final: ${info.final}`;
            break;
    }
    return s;
}

function schemeSelectors(gui, x, y, scheme = 'blue') {
    // Scheme colour selectors
    grid = gui.grid(x, y, 252, 90);
    grid.size(3, 3);
    fmt = {
        textSize: 12, textStyle: BOLD, iconAlign: RIGHT, group: 'timer colors',
        setAction: (info) => changeScheme(gui, info.source.id),
    }
    let i = 0;
    gui.colorSchemeNames.forEach(scheme => {
        gui.option(scheme, ...grid.cell(i % 3, floor(i / 3), 1, 1), scheme)
            .scheme(scheme)
            .format(fmt);
        i++;
    });
    gui.$(scheme).select();
}

function createSpinners(gui) {
    spin15 = gui.spinner('spin15', width - 360, 40, 350, 32, 15)
        .scheme('blue')
        .gap(6)
        .speed(1.3)
        .setTo(random(1e28))
        .setAction((info) => {
            gui.$('tmr15').start(5800, 100, 100);
        });

    spin4 = gui.spinner('spin4', 100, 300, 320, 90, 4)
        .scheme(scheme)
        .gap(0)
        .speed(2)
        .transparent()
        .setAction((info) => {
            switch (info.type) {
                case 'count':
                    let desc = getActionString(info);
                    gui.$('activity').text(desc);
                    gui.$('start').enable();
                    break;
                case 'ui':
                    sValue = info.value;
                    gui.$('sdr start').value(sValue);
                    gui.$('start value').text(sValue);
                    gui.$('activity').text('');
                    break;
            }
        });
}

function ABOUT(gui, title) {
    gui.label('about 1', 0, 0, width, 24)
        .scheme('light').corners(0).textSize(16)
        .text(title, 'center', 'center')
        .shrink(0, 24);
    const dpr = Number.isInteger(devicePixelRatio)
        ? devicePixelRatio : Math.round(devicePixelRatio * 100) / 100;
    const mode = (gui.mode === 'JS') ? 'XXX' : VERSION;
    const vstr = `p5js: ${mode}   ##   canvasGUI: ${GUI.VERSION} `
        + `##   Context: '${gui.contextType}'   ##   DPR: ${dpr} `;
    gui.label('about 2', 0, height - 24, width, 24)
        .scheme('light').corners(0).textSize(13)
        .text(vstr, 'center', 'center');
}
