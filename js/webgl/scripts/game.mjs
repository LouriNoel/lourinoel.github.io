import {loadGLSL, initShaderProgram} from "./utils/glsl.mjs";
import * as mat4 from "../lib/mat4.js";

// https://developer.mozilla.org/fr/docs/Web/API/WebGL_API/Tutorial

class Game {
    constructor(canvas, gl) {
        // TODO
        this.squareRotation = 0.0;
    }

    async init(canvas, gl) {
        this.canvas = canvas;
        this.gl = gl;

        const vsSource = await loadGLSL("./shaders/vertex_shader.glsl");
        const fsSource = await loadGLSL("./shaders/fragment_shader.glsl");

        // Initialize a shader program
        const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

        // Collect all the info needed to use the shader program.
        // Look up which attribute our shader program is using
        // for aVertexPosition and look up uniform locations.
        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            },
        };

        this.buffers = initBuffers(gl); // temporaire TODO
    }

    start() {
        this.last = 0.0; // last time the game logic was called, in seconds
        requestAnimationFrame(this.logic.bind(this));
    }

    // now : total time in millis
    logic(now) {
        now *= 0.001; // to second
        let dt = now - this.last;
        this.last = now;

        // TODO boucle
        this.update(dt);
        this.render(this.gl);

        // rappel à la prochaine frame d'animation, boucle.
        // bind afin de lui attacher le contexte = cette instance, sinon il se perd lors de l'appel
        requestAnimationFrame(this.logic.bind(this));
    }

    update(dt) {
        this.squareRotation += dt;
    }

    render(gl) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // couleur d'effacement
        gl.clearDepth(1.0); // tout effacer
        gl.enable(gl.DEPTH_TEST); // activer le test de profondeur
        gl.depthFunc(gl.LEQUAL); // les choses proches cachent les choses lointaines

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // efface le tampon de couleur et de profondeur

        // Camera
        const projectionMatrix = mat4.create();
        // matrix returned, fov en radian, aspect = canvas width/height, near, far
        mat4.perspective(projectionMatrix,
            45 * Math.PI / 180,
            gl.canvas.clientWidth / gl.canvas.clientHeight,
            0.1, 100.0);

        const modelViewMatrix = mat4.create();

        // dest, src, translation
        mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);
        // dest, src, angle, axe
        mat4.rotate(modelViewMatrix, modelViewMatrix, this.squareRotation, [0, 0, 1]);

        // TODO
        // Indiquer à WebGL comment extraire les positions à partir du tampon des
        // positions pour les mettre dans l'attribut vertexPosition.
        {
            const numComponents = 2;  // extraire 2 valeurs par itération
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
        {
            const numComponents = 4;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
            gl.vertexAttribPointer(
                this.programInfo.attribLocations.vertexColor,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                this.programInfo.attribLocations.vertexColor);
        }

        // Utiliser notre programme pour dessiner
        gl.useProgram(this.programInfo.program);

        gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        {
            const offset = 0;
            const vertexCount = 4;
            gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
        }
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
        1.0,  1.0,
        -1.0,  1.0,
        1.0, -1.0,
        -1.0, -1.0,
    ];

    // Pass the list of positions into WebGL to build the shape.
    // We do this by creating a Float32Array from the JavaScript array,
    // then use it to fill the current buffer.

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Now set up the colors for the vertices

    const colors = [
        1.0,  1.0,  1.0,  1.0,    // white
        1.0,  0.0,  0.0,  1.0,    // red
        0.0,  1.0,  0.0,  1.0,    // green
        0.0,  0.0,  1.0,  1.0,    // blue
    ];

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
    };
}

function main() {
    const canvas = document.getElementById('canvas');
    const gl = canvas.getContext("webgl");

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    let game = new Game();
    game.init(canvas, gl).then(() => game.start());
}

window.addEventListener("load", main);
