import * as vec3 from "../lib/gl-matrix/vec3.js";
import * as mat4 from "../lib/gl-matrix/mat4.js";

import {loadGLSL, initShaderProgram} from "./utils/glsl.mjs";
import {loadTexture} from "./utils/texture.mjs";
import {Controller} from "./controller.mjs";
import {Camera} from "./camera.mjs";

// https://developer.mozilla.org/fr/docs/Web/API/WebGL_API/Tutorial

// TODO https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection

class Game {
    constructor(canvas, gl) {
        this.paused = false;

        // TODO
        this.cubeRotation = 0.0; // en radians
    }

    /**
     * Initialize the game.
     * @param canvas the canvas in which to draw
     * @param gl the webgl context of the canvas
     */
    async init(canvas, gl) {
        this.canvas = canvas;
        this.gl = gl;

        this.controller = new Controller(this.canvas);
        this.controller.keyboard.map("right", "ArrowRight");
        this.controller.keyboard.map("up", "ArrowUp");
        this.controller.keyboard.map("left", "ArrowLeft");
        this.controller.keyboard.map("down", "ArrowDown");
        this.controller.keyboard.map("pause", "p");

        //this.controller.mouse.lock();


        // if color
        //const vsSource = await loadGLSL("./shaders/color_vertex_shader.glsl");
        //const fsSource = await loadGLSL("./shaders/color_fragment_shader.glsl");

        const vsSource = await loadGLSL("./shaders/texture_vertex_shader.glsl");
        const fsSource = await loadGLSL("./shaders/texture_fragment_shader.glsl");

        // Initialize a shader program
        const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

        // Collect all the info needed to use the shader program.
        // Look up which attribute our shader program is using
        // for aVertexPosition and look up uniform locations.
        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                //vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
                textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
                uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
            }
        };

        const projectionMatrix = mat4.create();
        // matrix returned, fov en radian, aspect = canvas width/height, near, far
        mat4.perspective(projectionMatrix, 45 * Math.PI / 180,
            gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);
        const cam_pos = vec3.fromValues(0.0, 0.0, 3.0); // Z = +3.0
        const cam_target = vec3.create(); // (0.0, 0.0, 0.0) to origin
        const cam_vert = vec3.fromValues(0.0, 1.0, 0.0); // Y axis
        this.camera = new Camera(projectionMatrix, cam_pos, cam_target, cam_vert);

        this.buffers = initBuffers(gl); // temporaire TODO

        this.texture = loadTexture(gl, './textures/dice.png'); // TODO
    }

    /**
     * Start the game.
     * Call it once the game has finished initializing.
     */
    start() {
        this.last = 0.0; // last time the game logic was called, in seconds
        requestAnimationFrame(this.logic.bind(this));
    }

    /**
     * Run the game logic once, which consist of update+render.
     * Executed as a callback of requestAnimationFrame, do not call it directly.
     * @param now the total time since creation, in millis
     */
    logic(now) {
        now *= 0.001; // to second
        let dt = now - this.last;
        this.last = now;

        this.update(dt);
        this.render(this.gl);

        // rappel à la prochaine frame d'animation, boucle.
        // bind afin de lui attacher le contexte = cette instance, sinon il se perd lors de l'appel
        requestAnimationFrame(this.logic.bind(this));
    }

    /**
     * Update the game's elements.
     * Do not call it directly.
     * @param dt time elapsed since the last update, in seconds
     */
    update(dt) {
        if(this.controller.keyboard["pause"]){
            this.paused = !this.paused;
            this.controller.keyboard["pause"] = false; // simulate a "key pressed" behaviour

            if(this.paused){
                this.controller.mouse.was_locked = this.controller.mouse.locked;
                this.controller.mouse.free();
            } else {
                if(this.controller.mouse.was_locked){
                    this.controller.mouse.lock();
                }
            }
        }

        if(this.paused){
            return;
        }

        // Séparer right/left - up/down afin de pouvoir aller dans plusieurs directions en même temps

        if(this.controller.keyboard["right"]){
            let temp = vec3.create();
            this.camera.translate(vec3.scale(temp, this.camera.side, 0.1));
        } else if(this.controller.keyboard["left"]){
            let temp = vec3.create();
            this.camera.translate(vec3.scale(temp, this.camera.side, -0.1));
        }

        if(this.controller.keyboard["up"]){
            let temp = vec3.create();
            this.camera.translate(vec3.scale(temp, this.camera.forward, 0.1));
        } else if(this.controller.keyboard["down"]){
            let temp = vec3.create();
            this.camera.translate(vec3.scale(temp, this.camera.forward, -0.1));
        }

        this.cubeRotation += dt;
    }

    /**
     * Render the game.
     * Do not call it directly.
     * @param gl the webgl context of the canvas */
    render(gl) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // couleur d'effacement
        gl.clearDepth(1.0); // tout effacer
        gl.enable(gl.DEPTH_TEST); // activer le test de profondeur
        gl.depthFunc(gl.LEQUAL); // les choses proches cachent les choses lointaines

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // efface le tampon de couleur et de profondeur

        const projectionMatrix = this.camera.projMat;
        let modelViewMatrix = this.camera.look();

        const saved_modelViewMatrix = mat4.clone(modelViewMatrix);

        // dest, src, translation
        mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);
        // dest, src, angle, axe
        mat4.rotate(modelViewMatrix, modelViewMatrix, this.cubeRotation, [0, 0, 1]); // Z axis
        mat4.rotate(modelViewMatrix, modelViewMatrix, this.cubeRotation * 0.7, [0, 1, 0]); // X axis

        // TODO
        // Indiquer à WebGL comment extraire les positions à partir du tampon des
        // positions pour les mettre dans l'attribut vertexPosition.
        {
            const numComponents = 3;  // extraire 3 valeurs par itération (2 si 2d, 3 si 3d)
            const type = gl.FLOAT;    // les données dans le tampon sont des flottants 32bit
            const normalize = false;  // ne pas normaliser
            const stride = 0;         // combien d'octets à extraire entre un jeu de valeurs et le suivant
                                      // 0 = utiliser le type et numComponents ci-dessus
            const offset = 0;         // démarrer à partir de combien d'octets dans le tampon
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
            gl.vertexAttribPointer(
                this.programInfo.attribLocations.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                this.programInfo.attribLocations.vertexPosition);
        }

        // Tell WebGL how to pull out the colors from the color buffer
        // into the vertexColor attribute.
        /*{
            const numComponents = 4;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
            gl.vertexAttribPointer(this.programInfo.attribLocations.vertexColor, numComponents, type, normalize, stride, offset);
            gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);
        }*/

        // Indiquer à WebGL comment extraire les coordonnées de texture du tampon
        {
            const numComponents = 2;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.textureCoord);
            gl.vertexAttribPointer(
                this.programInfo.attribLocations.textureCoord,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                this.programInfo.attribLocations.textureCoord);
        }

        // Tell WebGL which indices to use to index the vertices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);

        // Utiliser notre programme pour dessiner
        gl.useProgram(this.programInfo.program);

        gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        // Indiquer à WebGL que nous voulons affecter l'unité de texture 0
        gl.activeTexture(gl.TEXTURE0);
        // Lier la texture à l'unité de texture 0
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        // Indiquer au shader que nous avons lié la texture à l'unité de texture 0
        gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);

        {
            const vertexCount = 36;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }

        modelViewMatrix = saved_modelViewMatrix;
        // continue rendering other objects ...
    }
}

// TODO
function initBuffers(gl) {
    // Create a buffer for the square's positions.
    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Create an array of positions for the square.
    const positions = [
        // Face avant
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Face arrière
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,

        // Face supérieure
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,

        // Face inférieure
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Face droite
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,

        // Face gauche
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0
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

    const textureCoordinates = [
        // Front 1
        0.25, 0.00,
        0.50, 0.00,
        0.50, 0.25,
        0.25, 0.25,
        // Back 6
        0.50, 0.25,
        0.75, 0.25,
        0.75, 0.50,
        0.50, 0.50,
        // Top 3
        0.75, 0.00,
        1.00, 0.00,
        1.00, 0.25,
        0.75, 0.25,
        // Bottom 4
        0.00, 0.25,
        0.25, 0.25,
        0.25, 0.50,
        0.00, 0.50,
        // Right 2
        0.50, 0.00,
        0.75, 0.00,
        0.75, 0.25,
        0.50, 0.25,
        // Left 5
        0.25, 0.25,
        0.50, 0.25,
        0.50, 0.50,
        0.25, 0.50,
    ];

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

function main() {
    const canvas = document.getElementById('canvas');
    const gl = canvas.getContext("webgl");

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    const game = new Game();
    game.init(canvas, gl).then(() => game.start());
}

window.addEventListener("load", main);
