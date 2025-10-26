/*
Finite State Machine

*/
// DO NOT EDIT THIS FUNCTION
function doEvent(mode, type, event) {
    switch (type) {
        case 'mouseMoved':
        case 'mouseDragged':
        case 'mousePressed':
        case 'mouseReleased':
        case 'mouseClicked':
        case 'doubleClicked':
        case 'mouseWheel':
        case 'keyPressed':
        case 'keyReleased':
        case 'keyTyped':
        case 'keyisDown':
            if (mode[type]) console.log(`${type} event in mode ${mode.name}`);
            mode[type]?.(event);
            break;
        default:
            console.error(`Event type '${type}' is not recognised`);
    }

}

// DO NOT EDIT THIS FUNCTION
function changeMode(m, delay = 20) {
    setTimeout(() => {
        console.log(`Change mode to ${m.name}`);
        mode?.leave();
        m.enter();
        mode = m;
    }, delay);
}
