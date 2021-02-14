// FRAGMENT SHADER

// version 100 obligatoire avec WebGL
#version 100

varying highp vec2 vTextureCoord;

uniform sampler2D uSampler;

// Exécuté à chaque pixel de la forme à dessiner, après traitement par le vertex shader.
// Détermine la couleur du pixel.
void main() {
    gl_FragColor = texture2D(uSampler, vTextureCoord);
}
