// VERTEX SHADER

// version 100 obligatoire avec WebGL
#version 100

// Position du sommet
attribute vec4 aVertexPosition;

attribute vec2 aTextureCoord;

// Matrix 4x4 du model
uniform mat4 uModelViewMatrix;
// Matrix 4x4 de projection
uniform mat4 uProjectionMatrix;

varying highp vec2 vTextureCoord;

// Exécuté pour chaque sommet d'une forme rendue.
// Effectue les transformations sur la position du sommet.
void main() {
    // résultat
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;
}
