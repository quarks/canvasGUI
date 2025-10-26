/**
 * This function takes the MD2 data, texture and an optional mapping function
 * to create an MD2model that can be used in your JS app.
 *
 * @param data the MD2 data file stored as a byte array
 * @param texture the image used to texture the model
 * @param mapXYZ the XYZ coordinate mapping function (optional)
 */
function makeMD2model(data, texture, mapXYZ = mapXYZidentity) {
    // SHow info regarding MD2 model file data
    let showInfo = false;
    // Create the dataview
    let dv = new DataView(data.bytes.buffer, 0, data.bytes.buffer.byteLength);
    // File type and version
    let ident, version;
    // Texture data
    let skinWidth, skinHeight, num_skins;
    // Frame data
    let frameSize;
    // Counts
    let num_xyz; // number of vertices in a key frame
    let num_st;
    let num_tris;
    let num_glcmds;
    let num_frames;
    // Offsets
    let ofs_skins;
    let ofs_st;
    let ofs_tris;
    let ofs_frames;
    let ofs_glcmds;
    let ofs_end;
    // Model data
    let points = [];
    let states = new Map();
    // GL rendering data
    let cmds = [];
    let gl_verts = [];
    /**
     * This creates an array of GL commands which are processed when the
     * model is rendered. Each command has 3 bits of info
     * 1) whether to use TRIANGLE_FAN or TRIANGLE_STRIP
     * 2) the number of vertices to be processed by this command
     * Each vertex together with the texture coordinates to use at that vertex
     * is stored in an array used when rendering the model.
     */
    function getGLcmds() {
        let idx = ofs_glcmds;
        while (idx < ofs_end) {
            let cmd = dv.getInt32(idx, true);
            idx += 4;
            cmds.push(cmd);
            cmd = Math.abs(cmd);
            for (let c = 0; c < cmd; c++) {
                let s = dv.getFloat32(idx, true);
                idx += 4;
                let t = dv.getFloat32(idx, true);
                idx += 4;
                let vIdx = dv.getUint32(idx, true);
                idx += 4;
                gl_verts.push(new GLVertex(s, t, vIdx));
            }
        }
    }
    /**
     * Get all the vertex data for all key frames and identify animation sequences
     */
    function getFrameData() {
        let idx = ofs_frames;
        let fnames = new Array(num_frames);
        for (let fn = 0; fn < num_frames; fn++) {
            let sx = dv.getFloat32(idx, true);
            idx += 4;
            let sy = dv.getFloat32(idx, true);
            idx += 4;
            let sz = dv.getFloat32(idx, true);
            idx += 4;
            let tx = dv.getFloat32(idx, true);
            idx += 4;
            let ty = dv.getFloat32(idx, true);
            idx += 4;
            let tz = dv.getFloat32(idx, true);
            idx += 4;
            fnames[fn] = getString(idx, 16);
            idx += 16;
            for (let p = 0; p < num_xyz; p++) {
                let r = mapXYZ(sx * dv.getUint8(idx++) + tx, sy * dv.getUint8(idx++) + ty, sz * dv.getUint8(idx++) + tz);
                points.push(new Vec3(r[0], r[1], r[2]));
                dv.getUint8(idx++); // normal index not used here so we don't store it
            }
        }
        // Remove trailing numbers from frame names to create state names
        for (let fn = 0; fn < num_frames; fn++)
            fnames[fn] = stripTrailingNumbers(fnames[fn]);
        // Create the model animation states
        let s = 0, name = fnames[0], fn = 0;
        for (fn = 0; fn < num_frames; fn++) {
            if (name !== fnames[fn]) {
                states.set(name, new MD2state(name, s, fn - 1));
                name = fnames[fn];
                s = fn;
            }
        }
        states.set(name, new MD2state(name, s, fn - 1));
    }
    /**
     * Every key frame has a name comprising the animation state name with the frame
     * number (starting at 1 e.g. dir001, die002,  die003 ...).
     * This removes the trailing numbers to get the bare state name (e.g. die002 => die)
     * @param s the key frame name
     * @returns the string without the post-fixed number
     */
    function stripTrailingNumbers(s) {
        let p = s.length - 1;
        while (p > 0 && s.charAt(p) >= '0' && s.charAt(p) <= '9')
            p--;
        return s.slice(0, p + 1);
    }
    /**
     * Get the MD2 header information
     */
    function getHeader() {
        let idx = 0;
        ident = getString(0, 4);
        idx += 4;
        version = dv.getUint32(idx, true);
        idx += 4;
        skinWidth = dv.getUint32(idx, true);
        idx += 4;
        skinHeight = dv.getUint32(idx, true);
        idx += 4;
        frameSize = dv.getUint32(idx, true);
        idx += 4;
        num_skins = dv.getUint32(idx, true);
        idx += 4;
        num_xyz = dv.getUint32(idx, true);
        idx += 4;
        num_st = dv.getUint32(idx, true);
        idx += 4;
        num_tris = dv.getUint32(idx, true);
        idx += 4;
        num_glcmds = dv.getUint32(idx, true);
        idx += 4;
        num_frames = dv.getUint32(idx, true);
        idx += 4;
        // Offsets
        ofs_skins = dv.getUint32(idx, true);
        idx += 4;
        ofs_st = dv.getUint32(idx, true);
        idx += 4;
        ofs_tris = dv.getUint32(idx, true);
        idx += 4;
        ofs_frames = dv.getUint32(idx, true);
        idx += 4;
        ofs_glcmds = dv.getUint32(idx, true);
        idx += 4;
        ofs_end = dv.getUint32(idx, true);
        idx += 4;
    }
    /**
     *  Get a string from the data buffer.
     * Bytes are read from the data buffer until we reach a non-visual character
     * or when the maximum permitted string length is reached.
     * @param startAt
     * @param len
     * @returns
     */
    function getString(startAt, len) {
        let s = '';
        for (let i = 0; i < len; i++) {
            let b = dv.getUint8(startAt + i);
            if (b >= 32)
                s += String.fromCharCode(b);
            else
                break;
        }
        return s;
    }
    getHeader();
    getFrameData();
    getGLcmds();
    if (showInfo) {
        console.log(`Ident: ${ident}  Version: ${version}  Length ${dv.byteLength}`);
        console.log(`Texture  W: ${skinWidth}  H: ${skinHeight}   Number of textures: ${num_skins}`);
        console.log(`Frame size:  ${frameSize}  Nbr of frames ${num_frames}`);
        console.log((`Counts  xyz: ${num_xyz}  st: ${num_st}  triangle: ${num_tris}  gl cmds: ${num_glcmds}`));
        console.log((`Offsets  skins: ${ofs_skins}       st: ${ofs_st}     triangles: ${ofs_tris}   points: ${points.length}`));
        console.log((`         frames: ${ofs_frames}  GL cmds ${ofs_glcmds}  end: ${ofs_end}`));
        console.log((`Animation states: ${states.size}`));
        for (let state of states)
            console.log("  " + state.toString());
        console.log(`Nbr of GL cmds ${cmds.length}   Nbr of GL vertices ${gl_verts.length}`);
        console.log('---------------------------------------------------------');
    }
    return new MD2model(num_xyz, points, states, cmds, gl_verts, texture);
}
/**
 * This class holds information about an animation sequence.
 */
class MD2state {
    /**
     *
     * @param name the name of the animation sequence
     * @param startFrame the start frame number
     * @param endFrame the end frame number
     */
    constructor(name, startFrame, endFrame) {
        this.name = name;
        this.startFrame = startFrame;
        this.endFrame = endFrame;
    }
    toString() {
        return ` [${this.name}    starts: ${this.startFrame}    ends: ${this.endFrame}]`;
    }
}
/**
 * This class is used to simplify the rendering of the model by
 * holding the texture coordinates for a vertex together with a
 * pointer to the vertex coordinates.
 */
class GLVertex {
    /**
     * @param s the horizontal texture coordinate
     * @param t the vertical texture coordinate
     * @param index a pointer to the vertex position in the points array
     */
    constructor(s, t, index) {
        this.s = s;
        this.t = t;
        this.idx = index;
    }
    toString() {
        return `Vertex ${this.idx}    s: ${this.s}    t: ${this.t}`;
    }
}
/**
 * This function maps the XYZ coordinates read from the file and maps them to new value.
 * The MD2 file uses the right-handed coordinate system (default in OpenGL) and
 * this mapping does two things
 * 1) Convert to the left-hand coordinate system as used in p5.js
 * 2) Rotates the model so the it faces the +X direction and the up
 *    is in the -Y direction
 * This will simplify its usage in p5.js
 * @param x the x value read from the file
 * @param y the y value read from the file
 * @param z the z value read from the file
 * @returns [x, -z, -y]
 */
function mapXYZp5js(x, y, z) {
    return [x, -z, -y];
}
/**
 * This function maps the XYZ coordinates fread from the file annd maps them to new value.
 * This is the default mapping which leaves the coordinates unchanged.
 *
 * @param x the x value read from the file
 * @param y the y value read from the file
 * @param z the z value read from the file
 * @returns [x, y, z]
 */
function mapXYZidentity(x, y, z) {
    return [x, y, z];
}