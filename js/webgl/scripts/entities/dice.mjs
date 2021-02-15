import {Entity} from "./entity.mjs";

import {loadTexture} from "../utils/texture.mjs";
import {Spritesheet} from "../utils/spritesheet.mjs";

export class Dice extends Entity {
    constructor() {
        super();

        this.model = Dice.model;
        this.texture = Dice.spritesheet.texture;
    }

    static Init(gl) {
        if(Dice.spritesheet === undefined){
            const texture = loadTexture(gl, './textures/dice.png');
            Dice.spritesheet = new Spritesheet(texture, 4, 2);

            Dice.model = initBuffers(gl, Dice.spritesheet);
        }
    }
}

// TODO
function initBuffers(gl, spritesheet) {
    // Create a buffer for the square's positions.
    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Create an array of positions for the square.
    const k = 1.0;
    const positions = [
        // Face avant
        -k, -k,  k,
        k, -k,  k,
        k,  k,  k,
        -k,  k,  k,

        // Face arrière
        -k, -k, -k,
        -k,  k, -k,
        k,  k, -k,
        k, -k, -k,

        // Face supérieure
        -k,  k, -k,
        -k,  k,  k,
        k,  k,  k,
        k,  k, -k,

        // Face inférieure
        -k, -k, -k,
        k, -k, -k,
        k, -k,  k,
        -k, -k,  k,

        // Face droite
        k, -k, -k,
        k,  k, -k,
        k,  k,  k,
        k, -k,  k,

        // Face gauche
        -k, -k, -k,
        -k, -k,  k,
        -k,  k,  k,
        -k,  k, -k
    ];

    // Pass the list of positions into WebGL to build the shape.
    // We do this by creating a Float32Array from the JavaScript array,
    // then use it to fill the current buffer.

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    /*
    // Now set up the colors for the faces / vertices

    const faceColors = [
        [1.0,  1.0,  1.0,  1.0],    // Face avant : blanc
        [1.0,  0.0,  0.0,  1.0],    // Face arrière : rouge
        [0.0,  1.0,  0.0,  1.0],    // Face supérieure : vert
        [0.0,  0.0,  1.0,  1.0],    // Face infiérieure : bleu
        [1.0,  1.0,  0.0,  1.0],    // Face droite : jaune
        [1.0,  0.0,  1.0,  1.0]     // Face gauche : violet
    ];

    // Conversion du tableau des couleurs en une table pour tous les sommets
    let colors = [];
    for (let j=0; j<faceColors.length; j++) {
        const c = faceColors[j];

        // Répéter chaque couleur quatre fois pour les quatre sommets d'une face
        colors = colors.concat(c, c, c, c);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    */

    // texture

    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

    const textureCoordinates = [].concat(
        spritesheet.getTileTexCoords(1), // front
        spritesheet.getTileTexCoords(6), // back
        spritesheet.getTileTexCoords(3), // top
        spritesheet.getTileTexCoords(4), // bottom
        spritesheet.getTileTexCoords(2), // right
        spritesheet.getTileTexCoords(5), // left
    );

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);


    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // Ce tableau définit chaque face comme deux triangles, en utilisant les
    // indices dans le tableau des sommets pour spécifier la position de chaque
    // triangle.

    const indices = [
        0,  1,  2,      0,  2,  3,    // avant
        4,  5,  6,      4,  6,  7,    // arrière
        8,  9,  10,     8,  10, 11,   // haut
        12, 13, 14,     12, 14, 15,   // bas
        16, 17, 18,     16, 18, 19,   // droite
        20, 21, 22,     20, 22, 23,   // gauche
    ];

    // Envoyer maintenant le tableau des éléments à GL

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        //color: colorBuffer,
        textureCoord: textureCoordBuffer,
        indices: indexBuffer,
    };
}
