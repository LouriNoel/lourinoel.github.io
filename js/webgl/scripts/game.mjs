import * as vec3 from "../lib/gl-matrix/vec3.js";
import * as mat4 from "../lib/gl-matrix/mat4.js";

import {loadGLSL, initShaderProgram} from "./utils/glsl.mjs";
import {loadTexture} from "./utils/texture.mjs";
import {Spritesheet} from "./utils/spritesheet.mjs";
import {Controller} from "./controller.mjs";
import {Camera} from "./camera.mjs";
import {Dice} from "./entities/dice.mjs";

// https://developer.mozilla.org/fr/docs/Web/API/WebGL_API/Tutorial

// TODO https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection

class Game {
    constructor(canvas, gl) {
        this.paused = false;
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
        const cam_pos = vec3.fromValues(0.0, 0.0, 9.0); // Z = +9.0
        const cam_target = vec3.create(); // (0.0, 0.0, 0.0) to origin
        const cam_vert = vec3.fromValues(0.0, 1.0, 0.0); // Y axis
        this.camera = new Camera(projectionMatrix, cam_pos, cam_target, cam_vert);

        Dice.Init(gl);
        this.dice = new Dice();
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

        this.dice.rotate([0.0, 0.7*dt, dt]);
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

        this.dice.draw(gl, this.programInfo, projectionMatrix, modelViewMatrix);

        modelViewMatrix = saved_modelViewMatrix;
        // continue rendering other objects ...
    }
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
