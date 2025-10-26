class MD2model {
    constructor(num_xyz, points, states, cmds, gl_verts, texture) {
        this.scale = 1;
        this.interpol = 0;
        this.anim_speed = 4 / 1000;
        this.repeats = 0;
        this.num_xyz = num_xyz;
        this.points = points;
        this.states = states;
        this.cmds = cmds;
        this.gl_verts = gl_verts;
        this.texture = texture;
        // Start with the first frame of first state
        this.setState([...this.states.keys()][0], 0);
        this.render = this.renderTexture;
    }
    /**
     * This is speed that the animation moves through the state's frames. It
     * is measured in frames/second. The time to display a single animation loop
     * would be the = number of frames / animation speed
     *
     * @param anim_speed the animation speed
     */
    setAnimSpeed(anim_speed) {
        this.anim_speed = anim_speed / 1000;
        return this;
    }
    /**
     * Set the animation sequence for this model.
     * @param name name of the animation sequence
     * @param repeats the number of repeats for this sequence (default = 1)
     */
    setState(name, repeats = 1) {
        this.repeats = repeats;
        this.cState = this.states.get(name);
        this.cFrame = this.cState.startFrame;
        this.nFrame = this.cState.startFrame == this.cState.endFrame ?
            this.cFrame : this.cFrame + 1;
        this.interpol = 0;
        return this;
    }
    /**
     * Sets the drawing scale for rendering
     * @param scale the drawing scale to use
     * @returns this model instance
     */
    setScale(scale) {
        this.scale = scale;
        return this;
    }
    /**
     * Sets the texture to use with this model
     * @param texture the texture to use
     * @returns this model instance
     */
    setTexture(texture) {
        this.texture = texture;
        return this;
    }
    /**
     * @returns the names for all the animation sequences
     */
    getAnimStateNames() {
        return [...this.states.keys()];
    }
    /**
     * The calculates the bounding for all key frames using the coordinates
     * in the model file.
     * @returns the bounding box for this model
     */
    getBoundingBox(animStateName = '') {
        // If we don't have this state then use all points
        if (!this.states.has(animStateName))
            return this._bbImpl(this.points);
        let state = this.states.get(animStateName);
        let start = state.startFrame * this.num_xyz;
        let end = (state.endFrame + 1) * this.num_xyz;
        let array = this.points.slice(start, end);
        return this._bbImpl(array);
    }
    /**
     * The calculates the bounding for all key frames using the coordinates
     * in the model file after scaling
     * @returns the bounding box for this model
     */
    getScaledBoundingBox(animStateName = '') {
        // If we don't have this state then use all points
        if (!this.states.has(animStateName))
            return this._bbImpl(this.points, this.scale);
        let state = this.states.get(animStateName);
        let start = state.startFrame * this.num_xyz;
        let end = (state.endFrame + 1) * this.num_xyz;
        let array = this.points.slice(start, end);
        return this._bbImpl(array, this.scale);
    }
    _bbImpl(sa, s = 1) {
        let xs = sa.map(p => p.x()).sort((a, b) => a - b);
        let ys = sa.map(p => p.y()).sort((a, b) => a - b);
        let zs = sa.map(p => p.z()).sort((a, b) => a - b);
        return {
            'minX': s * xs[0], 'maxX': s * xs[xs.length - 1],
            'minY': s * ys[0], 'maxY': s * ys[ys.length - 1],
            'minZ': s * zs[0], 'maxZ': s * zs[zs.length - 1]
        };
    }
    /**
     * Update the model animation
     * @param elapsed_time_ms elapsed time since last update
     */
    update(elapsed_time_ms) {
        if (this.repeats > 0) {
            this.interpol += elapsed_time_ms * this.anim_speed;
            if (this.interpol >= 1) {
                while (this.interpol >= 1)
                    this.interpol--;
                // Advance current frame and inc next frame
                this.cFrame = this.nFrame;
                this.nFrame++;
                // If the next frame is out of state set it back to the begining
                if (this.nFrame > this.cState.endFrame) {
                    this.nFrame = this.cState.startFrame;
                    if (--this.repeats == 0) {
                        this.interpol = 0;
                        this.nFrame = this.cState.startFrame;
                    }
                }
            }
        }
    }
    /**
     * If you need multiple instance of this model then make one model with
     * makeMD2model method and then make copies of it using this method.
     * This is the most efficient (in time and memroy) way to have multiple
     * instances of the same model.
     *
     * @param same_state if true copy the current state as well.
     * @returns a copy of this model as a new instance
     */
    copy(same_state = false) {
        let m = new MD2model(this.num_xyz, this.points, this.states, this.cmds, this.gl_verts, this.texture);
        if (same_state) {
            m.cState = this.cState;
            m.nFrame = this.nFrame;
            m.scale = this.scale;
            m.interpol = this.interpol;
            m.anim_speed = this.anim_speed;
            m.repeats = this.repeats;
        }
        return m;
    }
    /**
     * This method is replaced depending on whether we are displaying a
     * wireframe or not
     * @param p
     */
    render(p = p5.instance) { }
    /**
     * Render this model using the texture
     * @param p drawing context
     */
    renderTexture(p = p5.instance) {
        p.push();
        p.fill(255);
        p.textureMode(p.NORMAL);
        let vpos = 0;
        let cfIdx = this.cFrame * this.num_xyz;
        let nfIdx = this.nFrame * this.num_xyz;
        for (let i = 0; i < this.cmds.length; i++) {
            let cmd = this.cmds[i];
            p.beginShape(cmd < 0 ? p.TRIANGLE_FAN : p.TRIANGLE_STRIP);
            cmd = Math.abs(cmd);
            p.texture(this.texture);
            for (let j = 0; j < cmd; j++) {
                let gl_vertex = this.gl_verts[vpos];
                let cp = this.points[cfIdx + gl_vertex.idx];
                let np = this.points[nfIdx + gl_vertex.idx];
                let x = cp.x() + this.interpol * (np.x() - cp.x());
                let y = cp.y() + this.interpol * (np.y() - cp.y());
                let z = cp.z() + this.interpol * (np.z() - cp.z());
                let s = gl_vertex.s;
                let t = gl_vertex.t;
                p.vertex(this.scale * x, this.scale * y, this.scale * z, s, t);
                vpos++;
            }
            p.endShape();
        }
        p.pop();
    }
    /**
     * Render this model using as an open wireframe
     * @param p drawing context
     */
    renderWireframe(p = p5.instance) {
        p.push();
        let vpos = 0;
        let cfIdx = this.cFrame * this.num_xyz;
        let nfIdx = this.nFrame * this.num_xyz;
        p.noFill();
        p.stroke(0);
        p.strokeWeight(1.1);
        for (let i = 0; i < this.cmds.length; i++) {
            let cmd = this.cmds[i];
            p.beginShape(cmd < 0 ? p.TRIANGLE_FAN : p.TRIANGLE_STRIP);
            // // This next line helps differentiate strips and fans
            // p.fill(cmd < 0 ? p.color(255,255,200):p.color(255,200,255));
            cmd = Math.abs(cmd);
            for (let j = 0; j < cmd; j++) {
                let gl_vertex = this.gl_verts[vpos];
                let cp = this.points[cfIdx + gl_vertex.idx];
                let np = this.points[nfIdx + gl_vertex.idx];
                let x = cp.x() + this.interpol * (np.x() - cp.x());
                let y = cp.y() + this.interpol * (np.y() - cp.y());
                let z = cp.z() + this.interpol * (np.z() - cp.z());
                p.vertex(this.scale * x, this.scale * y, this.scale * z);
                vpos++;
            }
            p.endShape();
        }
        p.pop();
    }
}