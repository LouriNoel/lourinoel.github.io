// FRAGMENT SHADER

// version 100 obligatoire avec WebGL
#version 100

varying lowp vec4 vColor;

// Exécuté à chaque pixel de la forme à dessiner, après traitement par le vertex shader.
// Détermine la couleur du pixel.
void main() {
    // Each fragment receives the interpolated color based on its position
    // relative to the vertex positions
    gl_FragColor = vColor;
}
