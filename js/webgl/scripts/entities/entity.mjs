import * as vec3 from "../../lib/gl-matrix/vec3.js";
import * as quat from "../../lib/gl-matrix/quat.js";
import * as mat4 from "../../lib/gl-matrix/mat4.js";

// quaternions http://www.opengl-tutorial.org/fr/intermediate-tutorials/tutorial-17-quaternions/

export class Entity {
    constructor() {
        this.position = vec3.create(); // (0, 0, 0)
        this.rotation = quat.identity(quat.create()); // (x=0, y=0, z=0, w=1) no rotation
        this.scale = vec3.fromValues(1.0, 1.0, 1.0); // (X, Y, Z)

        this.model = null;
        this.texture = null;
    }

    setPosition(pos){
        this.position = pos;
    }

    translate(trans) {
        vec3.add(this.position, this.position, trans);
    }

    /**
     * Rotate the entity around the specified axis by the given angle.
     * Useful when using a combined axis.
     * @param {vec3} axis the axis around which to rotate, normalized
     * @param angle the angle (in radians) by which to rotate
     */
    rotate(axis, angle) {
        let rot = quat.setAxisAngle(quat.create(), axis, angle);
        quat.multiply(this.rotation, this.rotation, rot);
    }

    rotateX(angle) {
        quat.rotateX(this.rotation, this.rotation, angle);
    }

    rotateY(angle) {
        quat.rotateY(this.rotation, this.rotation, angle);
    }

    rotateZ(angle) {
        quat.rotateZ(this.rotation, this.rotation, angle);
    }

    /**
     * Scale the entity.
     * scale = (1, 1, 1) do nothing because (scale.x *= 1, ..., ...)
     * @param {vec3} scale (x,y,z) vector of amounts to scale, multiply each component
     */
    rescale(scale) {
        vec3.multiply(this.scale, this.scale, scale);
    }

    // TODO quaternion
    draw(gl, programInfo, projectionMatrix, modelViewMatrix) {
        //mat4.fromRotationTranslationScale(modelViewMatrix, this.rotation, this.position, this.scale);

        let wholeMat = mat4.fromRotationTranslation(mat4.create(), this.rotation, this.position);
        mat4.mul(modelViewMatrix, modelViewMatrix, wholeMat);

        /*mat4.translate(modelViewMatrix, modelViewMatrix, this.position);
        let rot = mat4.fromQuat(mat4.create(), this.rotation);
        mat4.mul(modelViewMatrix, modelViewMatrix, rot);
        mat4.scale(modelViewMatrix, modelViewMatrix, this.scale);*/

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
            gl.bindBuffer(gl.ARRAY_BUFFER, this.model.position);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexPosition);
        }

        // Tell WebGL how to pull out the colors from the color buffer
        // into the vertexColor attribute.
        /*{
            const numComponents = 4;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.model.color);
            gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, numComponents, type, normalize, stride, offset);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
        }*/

        // Indiquer à WebGL comment extraire les coordonnées de texture du tampon
        {
            const numComponents = 2;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.model.textureCoord);
            gl.vertexAttribPointer(
                programInfo.attribLocations.textureCoord,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.textureCoord);
        }

        // Tell WebGL which indices to use to index the vertices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.model.indices);

        // Utiliser notre programme pour dessiner
        gl.useProgram(programInfo.program);

        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        // Indiquer à WebGL que nous voulons affecter l'unité de texture 0
        gl.activeTexture(gl.TEXTURE0);
        // Lier la texture à l'unité de texture 0
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        // Indiquer au shader que nous avons lié la texture à l'unité de texture 0
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

        {
            const vertexCount = 36;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
    }
}
