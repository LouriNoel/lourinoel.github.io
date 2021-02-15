// Charge une texture.
// L'initialise à une texture par défaut en attendant que le chargement soit terminé.
export function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // texture temporaire le temps que le chargement soit terminé
    const width = 2;
    const height = 2;
    const pixels = new Uint8Array([
        255,   0, 255, 255,
          0,   0,   0, 255,
          0,   0,   0, 255,
        255,   0, 255, 255]);
    // cible, level, internalFormat, width, height, border, srcFormat, srcType, pixels
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    const image = new Image();
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // WebGL1 : spécificités selon dimensions puissances de 2 ou non.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D); // générer des mipmaps
        } else {
            // Désactiver les mips et activer la répétition de la texture
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    image.src = url;

    return texture;
}

// Renvoie true si l'entier est une puissance de 2
function isPowerOf2(s) {
    return (s & (s - 1)) === 0;
}
