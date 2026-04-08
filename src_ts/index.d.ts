export { }

/** @hidden */
declare global {
    interface HTMLCanvasElement {
        _getContext: Function;
        _contextType: string; // 2d or webgl2
        hasContext(): string;
    }
}
