// VERTEX SHADER

// version 100 obligatoire avec WebGL
#version 100

// Position du sommet
attribute vec4 aVertexPosition;
// Couleur du sommet
attribute vec4 aVertexColor;

// Matrix 4x4 du model
uniform mat4 uModelViewMatrix;
// Matrix 4x4 de projection
uniform mat4 uProjectionMatrix;

// couleur du sommet
varying lowp vec4 vColor;

// Exécuté pour chaque sommet d'une forme rendue.
// Effectue les transformations sur la position du sommet.
void main() {
    // résultat
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;
}
