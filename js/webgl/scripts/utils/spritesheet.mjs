export class Spritesheet {
    /**
     * Create a new Spritesheet
     * @param texture a texture that is already loaded
     * @param nbColumns the number of columns = of tiles in each row
     * @param nbRows the number of rows = of tiles in each column
     */
    constructor(texture, nbColumns, nbRows) {
        this.texture = texture;

        this.nbColumns = nbColumns;
        this.nbRows = nbRows;

        this.tileW = 1.0 / nbColumns;
        this.tileH = 1.0 / nbRows;
    }

    /**
     * Get the texture coordinates of the given tile.
     * @param i index of the tile
     * @return the tile's texture coords
     */
    getTileTexCoords(i){
        const x = i % this.nbColumns; // float
        const y = Math.floor(i / this.nbColumns); // int
        return [
                x * this.tileW,     y * this.tileH,
            (x+1) * this.tileW,     y * this.tileH,
            (x+1) * this.tileW, (y+1) * this.tileH,
                x * this.tileW, (y+1) * this.tileH];
    }
}
