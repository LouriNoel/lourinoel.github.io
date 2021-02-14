// Initialise une texture et charge une image.
// Quand le chargement d'une image est terminé, la copie dans la texture.
export function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Du fait que les images doivent être téléchargées depuis l'internet,
    // il peut s'écouler un certain temps avant qu'elles ne soient prêtes.
    // Jusque là, mettre une texture temporaire, de sorte que nous puissions
    // l'utiliser immédiatement. Quand le téléchargement de la page sera terminé,
    // nous mettrons à jour la texture avec le contenu de l'image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 2;
    const height = 2;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixels = new Uint8Array([
        255,   0, 255, 255,
          0,   0,   0, 255,
          0,   0,   0, 255,
        255,   0, 255, 255]);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixels);

    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

        // WebGL1 a des spécifications différentes pour les images puissances de 2
        // par rapport aux images non puissances de 2 ; aussi vérifier si l'image est une
        // puissance de 2 sur chacune de ses dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Oui, c'est une puissance de 2. Générer les mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // Non, ce n'est pas une puissance de 2. Désactiver les mips et définir l'habillage
            // comme "accrocher au bord"
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // repeat texture
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    image.src = url;

    return texture;
}

function isPowerOf2(s) {
    return (s & (s - 1)) === 0;
}