class Vec3 {
    /**
     * If no parameters are passed then a zero vector will be created.
     * If the first parameter is a number then the arguments are used to set the
     * attributes. Alternatively you can pass either a Float32Array or a
     * Vec3 as the first parameter
     *
     * @param x x component
     * @param y y component
     * @param z z component
     */
    constructor(x, y = 0, z = 0) {
        this.p = new Float32Array(3); // Default [0,0,0]
        if (x != null && x != undefined) {
            if (typeof x === 'number') { // if no value then we have a zero quaternion
                this.p[0] = x;
                this.p[1] = y;
                this.p[2] = z;
            }
            else if (x.constructor.name === 'Vec3')
                this.p.set(x.p);
            else if (x.constructor.name === 'Float32Array')
                this.p.set(x);
        }
    }
    /**
     * @returns the magnitude of the vector squared
     */
    magSq() {
        return this.p[0] * this.p[0] + this.p[1] * this.p[1] + this.p[2] * this.p[2];
    }
    /**
     * @returns the magnitude of the vector squared
     */
    mag() {
        return Math.sqrt(this.p[0] * this.p[0] + this.p[1] * this.p[1] + this.p[2] * this.p[2]);
    }
    /**
     * Calculate the sum of these vectors
     * @param x x value to add or a Vec3
     * @param y y value to add
     * @param z z vale to add
     * @returns a Vec3 which is the sum of this instance with another vector
     */
    add(x, y = 0, z = 0) {
        if (x != null && x != undefined) {
            if (x.constructor.name === 'Vec3') {
                let v = x;
                x = v.p[0];
                y = v.p[1];
                z = v.p[2];
            }
        }
        return new Vec3(this.p[0] + x, this.p[1] + y, this.p[2] + z);
    }
    /**
     * Calculate the difference bewteen two vectors.
     *
     * @param x x value to subtract or a Vec3
     * @param y y value to subtract
     * @param z z vale to subtract
     * @returns a Vec3 which is the difference between this instance and another vector
     */
    sub(x, y = 0, z = 0) {
        if (x != null && x != undefined) {
            if (x.constructor.name === 'Vec3') {
                let v = x;
                x = v.p[0];
                y = v.p[1];
                z = v.p[2];
            }
        }
        return new Vec3(this.p[0] + x, this.p[1] + y, this.p[2] + z);
    }
    /**
     *
     * @param s the scaler to multiply by
     * @returns a copy of this instance multiplied by the scaler
     */
    mult(s) {
        return new Vec3(this.p[0] * s, this.p[1] * s, this.p[2] * s);
    }
    /**
     *
     * @param s the scaler to divide by
     * @returns a copy of this instance divided by the scaler
     */
    div(s) {
        return new Vec3(this.p[0] / s, this.p[1] / s, this.p[2] / s);
    }
    normalize() {
        let mag = this.mag();
        if (mag < Quaternion.EPSILON)
            throw new Error('Cannot normalise zero magnitude vector');
        return new Vec3(this.p[0] / mag, this.p[1] / mag, this.p[2] / mag);
    }
    /**
     * Build a vector from its azimuthal coordinates.
     * THis version is based on the coordinate system
     * <pre>
     *                          -------------- X
     *                         /|
     *                        / |
     *                       /  |
     *                      /   |
     * (towards viewer)    Z    |
     *                          Y  (above XZ plane)
     * </pre>
     *
     * @param alpha
     *            azimuth (&alpha;) around Y (0 is +X, &pi;/2 is +Z, &pi; is -X
     *            and 3&pi;/2 is -Y)
     * @param delta
     *            elevation (&delta;) above (XZ) plane, from -&pi;/2 to +&pi;/2
     * @see #getAlpha()
     * @see #getDelta()
     */
    static createFromAngles(alpha, delta) {
        let cosDelta = Math.cos(delta);
        return new Vec3(Math.cos(alpha) * cosDelta, Math.sin(delta), Math.sin(alpha) * cosDelta);
    }
    /**
     * Get the azimuth of the vector.
     *
     * @return azimuth (&alpha;) of the vector, between -&pi; and +&pi;
     */
    getAlpha() {
        return Math.atan2(this.p[2], this.p[0]);
    }
    /**
     * Get the elevation of the vector.
     *
     * @return elevation (&delta;) of the vector, between -&pi;/2 and +&pi;/2
     */
    getDelta() {
        return Math.asin(this.p[1] / this.mag());
    }
    /**
     * @returns the x component
     */
    x() {
        return this.p[0];
    }
    /**
         * @returns the y component
         */
    y() {
        return this.p[1];
    }
    /**
     * @returns the z component
     */
    z() {
        return this.p[2];
    }
    /**
     * The user must ensure that the parameter is a finite number.
     * No error checking is performed.
     *
     * @param x the new x coordinate value
     * @returns this instance of Vec3
     */
    setX(x) {
        this.p[0] = x;
        return this;
    }
    /**
     * The user must ensure that the parameter is a finite number.
     * No error checking is performed.
     *
     * @param y the new y coordinate value
     * @returns this instance of Vec3
     */
    setY(y) {
        this.p[1] = y;
        return this;
    }
    /**
     * The user must ensure that the parameter is a finite number.
     * No error checking is performed.
     *
     * @param z the new z coordinate value
     * @returns this instance of Vec3
     */
    setZ(z) {
        this.p[2] = z;
        return this;
    }
    /**
     * The user must ensure that the parameters are all finite numbers.
     * No error checking is performed.
     *
     * @param x
     * @param y
     * @returns this instance of Vec3
     */
    setXY(x, y) {
        this.p[0] = x;
        this.p[1] = y;
        return this;
    }
    /**
      * The user must ensure that the parameters are all finite numbers.
      * No error checking is performed.
      *
      * @param x
      * @param y
      * @returns this instance of Vec3
      */
    setXYZ(x, y, z) {
        this.p[0] = x;
        this.p[1] = y;
        this.p[2] = z;
        return this;
    }
    toString() {
        return `[${this.p[0]}, ${this.p[1]}, ${this.p[2]}]`;
    }
}