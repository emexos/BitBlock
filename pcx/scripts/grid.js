export class Cell {
    constructor() {
        this.type = 'wall';
        this.orientation = 0;
    }
}

export function initGrid(rows, cols) {
    return Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => new Cell())
    );
}
