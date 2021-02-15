import * as vec3 from "../lib/gl-matrix/vec3.js";
import * as mat4 from "../lib/gl-matrix/mat4.js";

/**
 * Camera for handling the projection matrix and the scene's model matrix.
 * @module camera
 * @author Louri Noël
 */

export class Camera {
    /**
     * Creates a new camera.
     * @param {mat4} proj the projection matrix
     * @param {vec3} pos the camera's position
     * @param {vec3} target the target's position
     * @param {vec3} vert the vertical vector
     */
    constructor(proj, pos, target, vert) {
        this.projMat = proj; // matrice 4x4 de projection

        this.position = pos; // position 3d de la caméra, eye

        // vecteurs 3d partant de la caméra et allant en face, en haut et à droite
        this.vertical = vert; // up
        this.forward = vec3.create();
        this.side = vec3.create();

        // si la position de la cible est fixée (rotation automatique de la caméra pour continuer de la regarder)
        this.targetFixed = false;
        this.target = null; // position 3d de la cible à regarder, center
        this.setTargetPosition(target); // init this.target, this.forward, this.side, (this.vertical)

        this.rotationSpeed = 0.05; // vitesse de rotation de la caméra
        this.pinCursor = false; // si le curseur doit rester au centre du canvas
    }

    /**
     * Get the modelview matrix resulting from a call to mat4.lookAt with the camera's attributes.
     * @return {mat4} the modelview matrix
     */
    lookAt() {
        return mat4.lookAt(mat4.create(), this.position, this.target, this.vertical);
    }

    /**
     * Set the camera's position.
     * @param {vec3} pos the camera's position
     */
    setPosition(pos) {
        let trans = vec3.create();
        vec3.subtract(trans, pos, this.position);

        this.translate(trans);
    }

    /**
     * Translate the camera.
     * @param {vec3} trans translation vector
     */
    translate(trans) {
        vec3.add(this.position, this.position, trans);

        if(this.targetFixed){
            this.setTargetPosition(this.target);
        } else {
            this.setTargetPosition(vec3.add(trans, this.target, trans));
        }
    }

    /**
     * Set the position of the target to look at, and compute the directional vectors.
     * @param target the position of the target
     */
    setTargetPosition(target){
        this.target = target;

        vec3.normalize(this.forward, vec3.subtract(this.forward, this.target, this.position));
        vec3.normalize(this.side, vec3.cross(this.side, this.forward, this.vertical));

        // à commenter pour avoir une caméra entièrement libre
        vec3.scale(this.vertical, vec3.normalize(this.vertical, vec3.cross(this.vertical, this.forward, this.side)), -1.0);
    }
}
