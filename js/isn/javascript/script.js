/*global Phaser*/

/*
 * Fonction anonyme exécutée dès le chargement du script.
 * Permet d'encapsuler son code et éviter ainsi qu'il soit global.
 */
(function () {
    "use strict";// Rend le code sûr en n'acceptant pas certaines erreurs.

    /*
     * Touches de contrôle du joueur.
     *
     * goUp : Quand pressée, le joueur va en haut.
     * goLeft : Quand pressée, le joueur va à gauche.
     * goDown : Quand pressée, le joueur va en bas.
     * goRight : Quand pressée, le joueur va à droite.
     * shoot : Quand pressée, le joueur tire en se servant de son arme.
     *
     * storageName : nom sous lequel est sauvegardé la propriété 'key' dans le localStorage.
     * key : keycode de la touche, définit par Phaser.
     */
    var goUp = {storageName: 'goUp', key: Phaser.Keyboard.Z};
    var goLeft = {storageName: 'goLeft', key: Phaser.Keyboard.Q};
    var goDown = {storageName: 'goDown', key: Phaser.Keyboard.S};
    var goRight = {storageName: 'goRight', key: Phaser.Keyboard.D};
    var shoot = {storageName: 'shoot', key: Phaser.Keyboard.ENTER};

    /*
     * Fonction anonyme éxécutée au chargement pour initialiser les touches depuis le localStorage.
     */
    (function () {
        // Récupération depuis le localStorage. JSON.parse() convertit la donnée (initialement une chaîne de caractères) en un objet interprétable par javascript (le même que lorsqu'on l'a sauvegardé plus tôt).
        var goUpKey = JSON.parse(localStorage.getItem(goUp.storageName));
        if (goUpKey !== null) {// Si la donnée existait bien dans le localStorage.
            goUp.key = goUpKey;// La touche est initialisée à nouveau avec la bonne valeur.
        }

        var goLeftKey = JSON.parse(localStorage.getItem(goLeft.storageName));

        if (goLeftKey !== null) {
            goLeft.key = goLeftKey;
        }

        var goDownKey = JSON.parse(localStorage.getItem(goDown.storageName));

        if (goDownKey !== null) {
            goDown.key = goDownKey;
        }

        var goRightKey = JSON.parse(localStorage.getItem(goRight.storageName));

        if (goRightKey !== null) {
            goRight.key = goRightKey;
        }

        var shootKey = JSON.parse(localStorage.getItem(shoot.storageName));

        if (shootKey !== null) {
            shoot.key = shootKey;
        }
    }());

    var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'content');

    /*
     * Retourne le nom de la touche associée au keycode passé en paramètre.
     * Ce nom est celui utilisé par Phaser.
     *
     * paramètres :
     * keycode : nombre entier positif étant le keycode d'une touche clavier de Phaser.
     *
     * retourne :
     * Le nom associé au keycode.
     */
    function keycodeToString(keycode) {
        var name;
        for (name in Phaser.KeyCode) {//Pour chaque propriété 'name' énumérable de Phaser.KeyCode, exécuter ce qui suit. (les propriétés peuvent être vues ici comme les clés d'un tableau associatif)
            if (keycode === Phaser.KeyCode[name]) {// Si la propriété 'name' a la valeur recherchée.
                return name;
            }
        }
    }

    //////////////////////////
    //
    // ButtonText
    //
    //////////////////////////

    var styleButton = {font: 'bold 20px Arial', fill: '#FFFFFF', stroke: '#000000', strokeThickness: 5, align: 'center'};
    var buttonClickSound;

    /*
     * Constructeur de ButtonText.
     *
     * Un ButtonText est une extension de Phaser.Button pour laquelle on peut modifier le texte.
     * Cela permet de ne pas avoir une image pour chaque bouton, avec un texte sur l'image elle même.
     *
     * Le texte a une hauteur et une largeur indépendante de celles du bouton, pouvant être définie dans son style.
     *
     * paramètres :
     * game, x, y, textureKey, callback, callbackContext, overFrame, outFrame, downFrame, upFrame : voir la documentation de Phaser.Button . ('textureKey' est le même paramètre que 'key' dans la documentation)
     * w, h : nombre entier positif représentant respectivement la largeur et la hauteur (width, height) du bouton.
     * text : chaîne de caractères affichée par dessus l'image du bouton. Ce texte est utilisé à chaque frame du bouton (over, out, down, up).
     * style : chaîne de caractères représentant le style du texte. Contient la police, la couleur, s'il est centré...
     */
    function ButtonText(game, x, y, w, h, textureKey, text, style, callback, callbackContext, overFrame, outFrame, downFrame, upFrame) {
        Phaser.Button.call(this, game, x, y, textureKey, callback, callbackContext, overFrame, outFrame, downFrame, upFrame);//Héritage. Appel du constructeur parent.

        this.anchor.setTo(0.5, 0.5);//Centre la texture du bouton sur les coordonnées (x,y).
        this.setDownSound(buttonClickSound);

        this.text = new Phaser.Text(game, 0, 0, text, style);//Le texte est aux coordonées (0,0) car il sera lié au bouton. Ses coordonnées seront donc relatives à celles du bouton.
        this.text.anchor.setTo(0.5, 0.5);
        this.addChild(this.text);//Lie le texte au bouton.

        this.width = w;
        this.height = h;

        var texture = game.cache.getImage(textureKey);//Récupère l'image désignée par textureKey.

        //Calcul de l'échelle du texte.
        var textScaleX = texture.width / this.width;
        var textScaleY = (texture.height / 3) / this.height;//Divisé par 3 car la texture est un spritesheet contenant 3 images pour le bouton alignées sur la hauteur.

        this.text.scale.setTo(textScaleX, textScaleY);//Modifie l'échelle du texte : il est ainsi redimensionné de telle sorte qu'il ait la taille définie dans 'style', peu importe les dimensions du bouton.

        game.add.existing(this);//Déclare à Phaser que ce bouton existe. Le texte existe aussi car il y est lié.
    }

    ButtonText.prototype = Object.create(Phaser.Button.prototype);//Héritage. Surcharge de prototype.

    ButtonText.prototype.constructor = ButtonText;//Héritage. Redéfinition du constructeur.

    //Surcharge de la méthode revive() pour mettre la frame 'out' par défaut et éviter un bug lors du passage entre les menus.
    ButtonText.prototype.revive = function (health) {
        Phaser.Button.prototype.revive.call(this, health);

        this.changeStateFrame('Out');
    };

    //////////////////////////
    //
    // ButtonKey
    //
    //////////////////////////

    /*
     * Constructeur de ButtonKey.
     *
     * Un ButtonKey est une extension de ButtonText spécifique aux boutons qui changent les touches du joueur.
     *
     * paramètres :
     * game, x, y, textureKey, overFrame, outFrame, downFrame, upFrame : voir la documentation de Phaser.Button . ('textureKey' est le même paramètre que 'key' dans la documentation)
     * w, h, style : voir si dessus ButtonText.
     * text : voir ButtonText. Cependant, ce n'est qu'une partie du texte qui sera affiché : il ne doit pas contenir le nom d'une touche.
     * keyRef : copie d'une référence à une touche, pouvant ainsi être modifiée par le bouton.
     */
    function ButtonKey(game, x, y, w, h, textureKey, text, style, keyRef, overFrame, outFrame, downFrame, upFrame) {
        ButtonText.call(this, game, x, y, w, h, textureKey, text, style, this.clicked, this, overFrame, outFrame, downFrame, upFrame);

        this.basicString = text;//Texte complémentaire à afficher à gauche du nom de la touche.
        this.keyRef = keyRef;
        this.text.text = this.basicString + keycodeToString(this.keyRef.key);//La chaîne de caractères du Phaser.Text vaut celle passée en paramètre plus le nom de la touche.
    }

    ButtonKey.prototype = Object.create(ButtonText.prototype);

    ButtonKey.prototype.constructor = ButtonKey;

    /*
     * Fonction de callback appelée lors de l'appui d'une touche de la souris (clic gauche ou droit), si le bouton a été préalablement appuyé.
     * Désélectionne le bouton.
     */
    ButtonKey.prototype.abort = function () {
        this.text.text = this.basicString + keycodeToString(this.keyRef.key);//Remet le texte affiché à la normale (sans les astérisques).

        // On n'a plus besoin des callbacks : on les enlève et remet le contexte initial.
        game.input.keyboard.callbackContext = Phaser.Keyboard;
        game.input.keyboard.onDownCallback = null;
        game.input.mouse.callbackContext = game;
        game.input.mouse.mouseDownCallback = null;
    };

    /*
     * Fonction de callback appelée lors de l'appui d'une touche clavier, si le bouton à été préalablement appuyé.
     *
     * paramètres :
     * event : Evènement clavier contenant, entre autres, le keycode de la touche appuyée.
     */
    ButtonKey.prototype.changeKey = function (event) {
        this.keyRef.key = event.keyCode;//Change le keycode, et donc la touche à appuyer pour effectuer l'action.
        this.text.text = this.basicString + keycodeToString(this.keyRef.key);//Mise à jour du nom.

        //Elimination des callbacks.
        game.input.keyboard.callbackContext = Phaser.Keyboard;
        game.input.keyboard.onDownCallback = null;
        game.input.mouse.callbackContext = game;
        game.input.mouse.mouseDownCallback = null;

        localStorage.setItem(this.keyRef.storageName, JSON.stringify(this.keyRef.key));// Stocke le nouveau keycode de la touche dans le localStorage.
    };

    /*
     * Fonction appelée lorsque le bouton est cliqué (définie comme callback lors du passage en paramètre au constructeur parent).
     */
    ButtonKey.prototype.clicked = function () {
        this.text.text = this.basicString + "*" + keycodeToString(this.keyRef.key) + "*";// Modifie le texte affiché de sorte que le joueur sache qu'il peut maintenant modifier la touche.

        //Ajoute des callbacks claviers et souris, l'un pour récupérer la prochaine touche appuyée, l'autre pour désélectionner le bouton et annuler le changement de touche.
        game.input.keyboard.addCallbacks(this, this.changeKey, null, null);
        game.input.mouse.callbackContext = this;
        game.input.mouse.mouseDownCallback = this.abort;
    };

    //////////////////////////
    //
    // CommunicationEngine
    //
    //////////////////////////

    var soldier;// Image animée du soldat qui nous parle.

    /*
     * Constructeur de CommunicationEngine.
     *
     * Un CommunicationEngine est l'appareil permettant au joueur de communiquer avec le reste des troupes.
     * Ces fonctions et variables sont rassemblées dans une classe pour être, à mon sens, plus simple à gérer.
     *
     * Il affiche le texte passé en paramètre de la fonction write() lettre par lettre, en faisant une pause
     * entre chaque ligne. (pour écrire sur deux lignes, écrire le charactère \n dans une seule chaîne de caractères)
     * Dans un même temps, il affiche une image à côté de ce texte.
     *
     * paramètres :
     * x, y : Position à laquelle l'affichage sera fait.
     * style : Le style à appliquer au texte.
     */
    function CommunicationEngine(x, y, style) {
        this.event;// Evènement bouclé de phaser qui correspond à l'écriture du texte.
        this.text = game.add.text(x, y, "", style);
        this.textCollectionToWrite = [];// Tableau de chaînes de caractères à écrire.
        this.lineIndex = 0;// Index de la ligne actuellement écrite dans 'textCollectionToWrite'.
        this.waitUntilNextLineCounter = 0;//Compte à rebours entre l'affichage de chaque chaîne.
        this.charIndex = 0;// Index de la lettre à écrire de la ligne.
        this.finished = true;// false : en train d'écrire. true : n'écrit pas = a fini d'écrire.
    }

    /*
     * Fonction appelée pour écrire du texte. Appeler cette fonction alors que du texte est déjà en train
     * de s'afficher ne posera pas de problème : le nouveau texte sera affiché après le premier.
     *
     * paramètres :
     * textCollectionToWrite : tableau de chaînes de caractères à écrire une à une.
     */
    CommunicationEngine.prototype.write = function (textCollectionToWrite) {
        this.textCollectionToWrite = this.textCollectionToWrite.concat(textCollectionToWrite);// Fusionne les deux tableaux.

        if (this.finished) {// Si il n'est pas en train d'écrire, on crée un nouvel évènement. Sinon, rien est fait puisque l'évènement en cours s'occupera aussi du nouveau texte.

            //paramètre 1 : temps en millisecondes entre chaque appel de la fonction callback.
            //paramètre 2 : fonction callback à appeler en boucle.
            //paramètre 3 : contexte d'appel de la fonction callback.
            this.event = game.time.events.loop(50, this.displayChar, this);

            this.finished = false;
            soldier.revive();
            soldier.animations.play('speak', 7, true);
        }
    };

    /*
     * Fonction qui boucle (ne pas appeller soi-même) qui affiche les lettres du texte une à une.
     */
    CommunicationEngine.prototype.displayChar = function () {
        if (this.waitUntilNextLineCounter == 0) {// Si on ne doit pas attendre pour afficher la ligne actuelle.
            this.text.text += this.textCollectionToWrite[this.lineIndex].charAt(this.charIndex);// Ajoute un seul caractère (affichage lettre par lettre).

            this.charIndex += 1;

            // S'il n'y a plus de caractère à écrire dans cette chaîne, on passe à la suivante dans un certain temps.
            if (this.charIndex >= this.textCollectionToWrite[this.lineIndex].length) {
                this.lineIndex += 1;
                this.charIndex = 0;
                this.waitUntilNextLineCounter = 60;
            }
        } else {
            this.waitUntilNextLineCounter -= 1;

            if (this.waitUntilNextLineCounter == 0) {//Juste avant d'afficher une nouvelle ligne, on fait ce qui suit :
                this.text.text = '';// On efface le texte affiché.

                if (this.lineIndex >= this.textCollectionToWrite.length) {//S'il n'y a plus de ligne à afficher, on reset les propriétés de l'objet...
                    this.textCollectionToWrite = [];
                    this.lineIndex = 0;
                    this.finished = true;
                    soldier.kill();
                    game.time.events.remove(this.event);// Et on supprime l'évènement bouclé.
                }
            }
        }
    };

    //////////////////////////
    //
    // Menu
    //
    //////////////////////////

    /*
     * Constructeur de Menu.
     *
     * Un Menu rassemble différents éléments. (pouvant être par exemple des buttons)
     * En quittant un menu, tous les éléments qu'il contient ne seront plus pris en compte par Phaser, et donc ne seront plus affichés.
     */
    function Menu() {
        this.elements = [];
    }

    /*
     * Ajoute un élément au menu.
     *
     * paramètres :
     * element : l'élément à rajouter au menu.
     */
    Menu.prototype.add = function (element) {
        element.kill();// Est tué immédiatement pour ne pas être affiché.
        this.elements.push(element);
    };

    /*
     * Démarre le menu. Active tous ses éléments. (du point de vue de Phaser, les fait revivre)
     */
    Menu.prototype.start = function () {
        this.elements.forEach(function (element) {
            element.revive();
        });
    };

    /*
     * Quitte le menu. Désactive tous ses éléments. (du point de vue de Phaser, les fait mourir)
     */
    Menu.prototype.quit = function () {
        this.elements.forEach(function (element) {
            element.kill();
        });
    };

    //////////////////////////
    //
    // MenuManager
    //
    //////////////////////////

    /*
     * Constructeur de MenuManager.
     *
     * Un MenuManager met en relation différents menus, de manière à n'afficher que l'un d'entre-eux.
     * Il facilite aussi le passage d'un menu à l'autre.
     */
    function MenuManager() {
        this.menus = [];
        this.currentMenuId = 0;//Index dans le tableau 'menus' du menu actuellement affiché. Il s'agit de l'identifiant de ce menu.
    }

    /*
     * Ajoute un menu.
     *
     * paramètres :
     * menu : le menu à ajouter.
     *
     * retourne :
     * L'identifiant du menu ajouté.
     */
    MenuManager.prototype.add = function (menu) {
        this.menus.push(menu);
        return this.menus.length - 1;
    };

    /*
     * Change de menu.
     * L'ancien menu est désactivé tandis que le nouveau (désigné par l'identifiant donné) est activé.
     *
     * paramètres :
     * id : L'identifiant du nouveau menu à être affiché.
     */
    MenuManager.prototype.changeTo = function (id) {
        this.menus[this.currentMenuId].quit();
        this.currentMenuId = id;
        this.menus[this.currentMenuId].start();
    };

    //////////////////////////
    //
    // Wave
    //
    //////////////////////////

    /*
     * Constructeur de Wave.
     *
     * Une Wave est une phase d'un niveau (Level).
     * Cet objet rassemble différentes fonctions pour gérer plus facilement le déroulement du jeu.
     *
     * paramètres :
     * startFunc : Fonction appelée par le Level au commencement de la Wave.
     * updateFunc : Fonction appelée par le Level à chacune de ses mises à jours.
     * quitFunc : Fonction appelée par le Level pour quitter la Wave.
     */
    function Wave(startFunc, updateFunc, quitFunc) {
        this.start = startFunc;
        this.update = updateFunc;
        this.quit = quitFunc;
    }

    //////////////////////////
    //
    // Level
    //
    //////////////////////////

    /*
     * Constructeur de Level.
     *
     * Un Level est composé de différentes vagues d'ennemis successives.
     * Par extension, ces vagues désignent des phases de jeu successives, qui
     * ne font pas forcément apparaître des ennemis.
     */
    function Level() {
        this.waves = [];
        this.currentWaveId = 0;
        this.preWaveId = 0;// Id de la vague précédente.
    }

    /*
     * Ajoute une vague au niveau et retourne son identifiant.
     *
     * paramètres :
     * wave : La vague à rajouter.
     *
     * retourne :
     * L'identifiant de la vague ajoutée.
     */
    Level.prototype.add = function (wave) {
        this.waves.push(wave);
        return this.waves.length - 1;
    };

    /*
     * Met à jour le niveau, plus spécifiquement la vague actuellement affichée.
     */
    Level.prototype.update = function () {
        this.waves[this.currentWaveId].update();
    };

    /*
     * Passe à la vague dont l'identifiant est passé en paramètre.
     * Si aucun identifiant est passé en paramètre, passe à la vague suivante de manière automatique est se basant sur l'ordre dans lequel on a ajouté les vagues.
     *
     * paramètres :
     * wave : paramètre optionnel étant l'identifiant de la prochaine vague.
     */
    Level.prototype.nextWave = function (waveId) {
        this.waves[this.currentWaveId].quit();

        this.preWaveId = this.currentWaveId;

        if (waveId !== undefined && waveId !== null) {// Si le paramètre Id a été passé en paramètre :
            this.currentWaveId = waveId;
        } else {
            this.currentWaveId += 1;
        }

        this.waves[this.currentWaveId].start();
    };

    //////////////////////////
    //
    // loadState
    //
    //////////////////////////

    // Variables liés aux musiques.
    var musicIntro;
    var musicLevel;
    var musicBoss;

    var roar;// cri du boss

    /*
     * loadState est l'état du jeu correspondant au chargement des ressources.
     */
    var loadState = {};

    /*
     * Chargement de toutes les ressources du jeu.
     */
    loadState.preload = function () {
		game.load.audio('musicIntro', 'assets/audio/intro-Turrican2-the_final_fight-theme.mp3');
        game.load.audio('musicLevel', 'assets/audio/level-Turrican2-the_final_challenge.mp3');
        game.load.audio('musicBoss', 'assets/audio/boss-Turrican2-hi_GI_Joe!.mp3');
        game.load.audio('button_click', 'assets/audio/button_click.mp3');
        game.load.audio('roar', 'assets/audio/roar.mp3');

        game.load.image('background', 'assets/textures/background.png');
        game.load.spritesheet('button', 'assets/textures/gui/button.png', 256, 64);// Paramètre 2 et 3 : dimensions d'une sous-image (ici un sprite).

        game.load.image('game over', 'assets/textures/game_over.png');
        game.load.image('win', 'assets/textures/win.png');
        game.load.image('background game over', 'assets/textures/background_game_over.png');

        game.load.spritesheet('vaisseau', 'assets/textures/sprites/player.png', 128, 27);
        game.load.image('bullet', 'assets/textures/sprites/blue_laser.png');
        game.load.image('bulletEnemies', 'assets/textures/sprites/red_laser.png');
        game.load.spritesheet('soldier', 'assets/textures/sprites/soldier.png', 128, 128);
        game.load.spritesheet('cervolant', 'assets/textures/sprites/cervolant.png', 64, 32);
        game.load.image('bonus', 'assets/textures/sprites/cristaldevie.png');
        game.load.image('heartIhm', 'assets/textures/sprites/conteneurcoeur.png');
        game.load.spritesheet('explosion', 'assets/textures/sprites/cervolant_parts.png', 32, 32);
        game.load.spritesheet('bulletBoss', 'assets/textures/sprites/bulletBoss.png', 32, 32);
    };

    /*
     * Initialisation des variables liées au son.
     * Cela est fait ici et pas dans menuState ou playState pour ne pas être recréées à chaque changement de state.
     */
    loadState.create = function () {
        buttonClickSound = game.add.audio('button_click');

        musicIntro = game.add.audio('musicIntro');
        musicIntro.loop = true;//permet de faire tourner la musique en boucle
        musicLevel = game.add.audio('musicLevel');
        musicLevel.loop = true;
        musicBoss = game.add.audio('musicBoss');
        musicBoss.loop = true;

        roar = game.add.audio('roar');

        game.state.start('menu');//On passe immédiatement à l'état du menu principal.
    };

    game.state.add('load', loadState);

    //////////////////////////
    //
    // menuState
    //
    //////////////////////////

    /*
     * menuState est l'état du jeu correspondant au menu principal.
     */
    var menuState = {};

    /*
     * Crée le menu principal et ses éléments
     */
    menuState.create = function () {

        //coupe toute les musiques et lance la musique du menu
        musicLevel.stop();
        musicBoss.stop();
        musicIntro.play();

        this.background = game.add.tileSprite(0, 0, game.width, game.height, 'background');
        this.background.tilePosition.x = 300;

        this.menuManager = new MenuManager();

        // Création des sous menus.

        this.menuIndex = new Menu();
        var menuIndexId = this.menuManager.add(this.menuIndex);

        this.menuOption = new Menu();
        var menuOptionId = this.menuManager.add(this.menuOption);

        //Bouton 'Play' du menu Index.
        var buttonIndPlay = new ButtonText(game, game.world.centerX, game.height / 3, 250, 80, 'button', 'Play', styleButton,
                                           function () {
                                               game.state.start('play');// Commencer à jouer.
                                           },
                                           this, 1, 0, 2);

        this.menuIndex.add(buttonIndPlay);

        //Bouton 'Options' du menu Index.
        var buttonIndOptions = new ButtonText(game, game.world.centerX, game.height * 2 / 3, 250, 80, 'button', 'Options', styleButton,
                                              function () {
                                                  this.menuManager.changeTo(menuOptionId);// Se rendre au menu d'options.
                                              },
                                              this, 1, 0, 2);

        this.menuIndex.add(buttonIndOptions);

        // Création des éléments de menuOption.

        //Bouton 'Aller en haut' du menu Option.
        var buttonOptGoUp = new ButtonKey(game, game.world.centerX, game.height / 4, game.width / 3 - 10, 80, 'button', 'Aller en haut : ', styleButton, goUp, 1, 0, 2);
        this.menuOption.add(buttonOptGoUp);

        //Bouton 'Aller à gauche' du menu Option.
        var buttonOptGoLeft = new ButtonKey(game, game.world.centerX / 3, game.height / 4 + 90, game.width / 3 - 10, 80, 'button', 'Aller à gauche : ', styleButton, goLeft, 1, 0, 2);
        this.menuOption.add(buttonOptGoLeft);

        //Bouton 'Aller en bas' du menu Option.
        var buttonOptGoDown = new ButtonKey(game, game.world.centerX, game.height / 4 + 90, game.width / 3 - 10, 80, 'button', 'Aller en bas : ', styleButton, goDown, 1, 0, 2);
        this.menuOption.add(buttonOptGoDown);

        //Bouton 'Aller à droite' du menu Option.
        var buttonOptGoRight = new ButtonKey(game, game.world.centerX + game.world.centerX * 2 / 3, game.height / 4 + 90, game.width / 3 - 10, 80, 'button', 'Aller à droite : ', styleButton, goRight, 1, 0, 2);
        this.menuOption.add(buttonOptGoRight);

        //Bouton 'Tirer' du menu Option.
        var buttonOptShoot = new ButtonKey(game, game.world.centerX, game.height / 4 + 180, game.width / 3 - 10, 80, 'button', 'Tirer : ', styleButton, shoot, 1, 0, 2);
        this.menuOption.add(buttonOptShoot);

        //Bouton 'Retour' du menu Option.
        var buttonOptReturn = new ButtonText(game, game.world.centerX, game.height * 3 / 4, 250, 80, 'button', 'Retour', styleButton,
                                             function () {
                                                 this.menuManager.changeTo(menuIndexId);// Retourner au menu principal.
                                             },
                                             this, 1, 0, 2);
        this.menuOption.add(buttonOptReturn);

        this.menuIndex.start();// On commence au menu Index.
    };

    /*
     * Affichage complémentaire de l'état du jeu, n'étant pas géré automatiquement par Phaser.
     * Ici utilisé pour rappeler au joueur les touches qu'il devra utiliser.
     */
    menuState.render = function () {
        game.debug.text('-- Touches --', 610, 20);

        game.debug.text('haut : ' + keycodeToString(goUp.key), 610, 40);
        game.debug.text('gauche : ' + keycodeToString(goLeft.key), 610, 60);
        game.debug.text('bas : ' + keycodeToString(goDown.key), 610, 80);
        game.debug.text('droite : ' + keycodeToString(goRight.key), 610, 100);
        game.debug.text('tirer : ' + keycodeToString(shoot.key), 610, 120);
    };

    game.state.add('menu', menuState);//Ajoute l'état du menu principal au jeu.

    //////////////////////////
    //
    // playState
    //
    //////////////////////////

    //création des variables

    var level;

    var communicationEngine;// Objet s'occupant d'afficher le texte et l'image du soldat.

    var city;// image de fond

    //Pas besoin de MenuManager pour l'écran de Game Over ou de Win car il n'y a qu'un seul menu à gérer.
    //Ces écrans sont gérés comme des vagues.
    var menuGameOver;
    var waveGameOverId;
    var menuWin;
    var waveSoldierId;//Identifiant de la première vague.

    var poolEnemies;
    var bulletsEnemies;
    var bulletTimeEnemies = 0;
    var explosion;

    var boss;
    //roar est rassemblée avec les variables de musiques.
    var bulletsBoss;
    var healthBoss;
    var bulletTimeBoss = 0;
    var cooldownBulletBoss;
    var spawn75;
    var spawn50;
    var spawn25;
    var spawn10;

    var vaisseau;
    var speed_vaisseau = 200;
    var healthPlayer = 5;
    var poolLifeIhm;// Groupe des coeurs affichés signifiant la vie du joueur.
    var damageTime = 0;
    var score = 0;
    var bullets;
    var bulletTime = 0;

    var bonus;

    /*
     * playState est l'état du jeu correspondant au jeu en lui même, c'est à dire quand le joueur joue un niveau.
     */
    var playState = {};

    /*
     * Crée l'état du jeu.
     */
    playState.create = function () {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        //stoppe les musiques et lance celle des niveaux normaux
        musicIntro.stop();
        musicBoss.stop();
        musicLevel.play();

        city = game.add.tileSprite(0, 0, game.width, game.height, 'background');

        menuGameOver = new Menu();

        var backgroundGameOver = game.add.tileSprite(0, 0, 800, 600, 'background game over');
        backgroundGameOver.tilePosition.x = -200;
        menuGameOver.add(backgroundGameOver);

        var buttonGameOverReset = new ButtonText(game, game.world.centerX, 200, 250, 80, 'button', 'Recommencer', styleButton,
                                                 function () {
                                                     score = 0;
                                                     level.nextWave(waveSoldierId);// Recommence à la première vague : celle du soldat.
                                                 },
                                                 this, 1, 0, 2);

        menuGameOver.add(buttonGameOverReset);

        var buttonGameOverCheckpoint = new ButtonText(game, game.world.centerX, 320, 250, 80, 'button', 'Checkpoint', styleButton,
                                                      function () {
                                                          level.nextWave(level.preWaveId);// Recommence à la vague où le joueur est mort.
                                                      },
                                                      this, 1, 0, 2);

        menuGameOver.add(buttonGameOverCheckpoint);

        var buttonGameOverQuit = new ButtonText(game, game.world.centerX, 450, 350, 80, 'button', 'Retour au menu principal', styleButton,
                                                function () {
                                                    score = 0;
                                                    game.state.start('menu');// Retour au menu principal.
                                                },
                                                this, 1, 0, 2);

        menuGameOver.add(buttonGameOverQuit);

        // Image disant 'Game Over'.
        var spriteGameOver = game.add.sprite(game.world.centerX, game.height / 6, 'game over');
        spriteGameOver.anchor.setTo(0.5, 0.5);
        menuGameOver.add(spriteGameOver);

        menuWin = new Menu();
        var buttonWinQuit = new ButtonText(game, game.world.centerX, 450, 350, 80, 'button', 'Retour au menu principal', styleButton,
                                           function () {
                                               score = 0;
                                               game.state.start('menu');
                                           },
                                           this, 1, 0, 2);

        menuWin.add(buttonWinQuit);

        // Image disant 'You Win'.
        var spriteWin = game.add.sprite(game.world.centerX, game.height / 6, 'win');
        spriteWin.anchor.setTo(0.5, 0.5);
        spriteWin.scale.setTo(2, 2);
        menuWin.add(spriteWin);

        vaisseau = game.add.sprite(200, 200, 'vaisseau');//création de l'image du vaisseau
        game.physics.enable(vaisseau, Phaser.Physics.ARCADE);//applique les caractéristiques de la physique établie auparavant
        vaisseau.anchor.setTo(0.5, 0.5);//centre les coordonnées du vaisseau au centre de l'image de celui-ci
        vaisseau.body.collideWorldBounds = true;
        vaisseau.animations.add('youFly', [1, 2]);//création de l'animation du vaisseau pour ses déplacements

        poolLifeIhm = game.add.group();
        var i;
        var forHeart;
        for (i = 0; i < 5; i += 1) {
            forHeart = game.add.sprite(10 + i * 32, 10, 'heartIhm');// Aligne les coeurs.
            forHeart.scale.setTo(2, 2);
            forHeart.smoothed = false;// Désactive l'anti-aliasing dû à l'agrandissement.
            forHeart.life = i + 1;// Identifiant du coeur. +1 car i vaut entre 0 et 4.
            poolLifeIhm.add(forHeart);
        }

        //caractéristiques et création du bonus de vie
        bonus = game.add.sprite(0, 0, 'bonus');
        game.physics.enable(bonus, Phaser.Physics.ARCADE);
        bonus.anchor.setTo(0.5, 0.5);
        bonus.scale.setTo(1.5, 1.5);
        bonus.body.outOfBoundsKill = true;
        bonus.body.checkWorldBounds = true;
        bonus.kill();//on le supprime pour pouvoir le rappeler plus facilement au bon moment

        //caractéristiques et création des balles du joueur
        bullets = game.add.group();//création du groupe bullets
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;
        bullets.createMultiple(30, 'bullet');//création de 30 objets dans ce groupe (il ne peut donc y avoir que 30 de nos balles à la fois)
        bullets.setAll('anchor.x', 0.5);
        bullets.setAll('anchor.y', 1);
        bullets.setAll('outOfBoundsKill', true);
        bullets.setAll('checkWorldBounds', true);

        //caractéristiques et création des balles des ennemis
        bulletsEnemies = game.add.group();
        bulletsEnemies.enableBody = true;
        bulletsEnemies.physicsBodyType = Phaser.Physics.ARCADE;
        bulletsEnemies.createMultiple(30, 'bulletEnemies');
        bulletsEnemies.setAll('anchor.x', 0.5);
        bulletsEnemies.setAll('anchor.y', 1);
        bulletsEnemies.setAll('outOfBoundsKill', true);
        bulletsEnemies.setAll('checkWorldBounds', true);

        //caractéristiques et création des ennemis
        poolEnemies = game.add.group();//création du groupe
        poolEnemies.enableBody = true;
        poolEnemies.physicsBodyType = Phaser.Physics.ARCADE;
        //création des 30 ennemis de façon indépendante, ce qui permet par la suite de leur attribuer un identifiant positif correct.
        var j;
        var forEnemy;
        for (j = 0; j < 30; j += 1) {
            forEnemy = game.add.sprite(0, 0, 'cervolant');
            forEnemy.kill();
            forEnemy.id = -j;//création de leurs identifiants temporaires
            poolEnemies.add(forEnemy);//association de chaque 'enemy' au groupe 'poolEnemies'
        }
        poolEnemies.setAll('anchor.x', 0);
        poolEnemies.setAll('anchor.y', 0.5);
        poolEnemies.callAll('animations.add', 'animations', 'flyEnemies', [0, 1, 2, 1], 7, true);//création de leurs animations de vol
        poolEnemies.callAll('animations.play', 'animations', 'flyEnemies');
        poolEnemies.setAll('outOfBoundsKill', true);
        poolEnemies.setAll('checkWorldBounds', true);

        //création de l'animation d'explosion des ennemis à leur mort
        explosion = game.add.group();
        explosion.createMultiple(20, 'explosion');
        explosion.setAll('anchor.x', -0.1);
        explosion.setAll('anchor.y', 0.5);
        explosion.callAll('animations.add', 'animations', 'explode', [0, 1, 2]);

        //caractéristiques et création du boss
        boss = game.add.sprite(400, 300, 'cervolant');
        game.physics.enable(boss, Phaser.Physics.ARCADE);
        boss.scale.setTo(16, 16);
        boss.smoothed = false;
        boss.anchor.setTo(0, 0.5);
        boss.body.setSize(300, 450, 200, -10);
        boss.kill();
        boss.animations.add('bossFly', [0, 1, 2, 1], 7, true);
        boss.animations.play('bossFly');

        //caractéristiques et création des balles du boss
        bulletsBoss = game.add.group();
        bulletsBoss.enableBody = true;
        bulletsBoss.physicsBodyType = Phaser.Physics.ARCADE;
        bulletsBoss.createMultiple(20, 'bulletBoss');
        bulletsBoss.setAll('anchor.x', 0.5);
        bulletsBoss.setAll('anchor.y', 0.5);
        bulletsBoss.callAll('animations.add', 'animations', 'bulletAnim', [0, 1, 2, 1], 7, true);
        bulletsBoss.callAll('animations.play', 'animations', 'bulletAnim');
        bulletsBoss.setAll('outOfBoundsKill', true);
        bulletsBoss.setAll('checkWorldBounds', true);

        // Création de ce qui concerne l'affichage du texte du soldat.
        communicationEngine = new CommunicationEngine(200, 492, {font: 'bold 20px Arial', fill: '#FFFFFF', stroke: '#000000', strokeThickness: 5});
        soldier = game.add.sprite(20, 450, 'soldier');
        soldier.animations.add('speak', [0, 1, 2, 3, 2, 1]);
        soldier.kill();

        level = new Level();
        waveGameOverId = level.add(new Wave(waveGameOverStart, function () {}, waveGameOverQuit));// En premier pour ne pas la débuter par erreur lors de l'enchaînement automatique des vagues.
        waveSoldierId = level.add(new Wave(waveSoldierStart, waveSoldierUpdate, function () {}));

        level.add(new Wave(waveStart1, waveUpdate, function () {}));
        level.add(new Wave(waveStart2, waveUpdate, function () {}));
        level.add(new Wave(waveStart3, waveUpdate, function () {}));
        level.add(new Wave(waveStart4, waveUpdate, function () {}));

        level.add(new Wave(waveSoldier2Start, waveSoldierUpdate, function () {}));
        level.add(new Wave(waveBossStart, waveBossUpdate, function () {}));

        level.add(new Wave(waveWinStart, function () {}, function () {}));

        level.nextWave(waveSoldierId);// La première vague est celle du soldat.
    };

    /*
     * Mise à jour de l'état du jeu.
     */
    playState.update = function () {
        //gestion des collisions devant être vérifiée à chaque vague
        game.physics.arcade.overlap(poolEnemies, bullets, collisionEnemiesBullets, null, this);
        game.physics.arcade.overlap(vaisseau, bulletsEnemies, collisionVaisseauBullets, null, this);
        game.physics.arcade.overlap(vaisseau, poolEnemies, collisionVaisseauEnemies, null, this);
        game.physics.arcade.overlap(vaisseau, bonus, collisionVaisseauBonus, null, this);

        if (vaisseau.alive) {
            //passe à la vague de game over si le joueur n'a plus de vie
            if (healthPlayer <= 0) {
                level.nextWave(waveGameOverId);
            }

            movement_vaisseau(speed_vaisseau);//fonction des mouvements du joueur
            city.tilePosition.x = city.tilePosition.x - 3;//défilement de l'image de fond
        }

        level.update();// Update du niveau, et donc de la vague courante.
    };

    // Fonction de rendu secondaire de playState.
    playState.render = function () {
        game.debug.text('Score : ' + score, 10, 60);

        // Si le boss est en vie, on affiche sa vie.
        if (boss.alive) {
            game.debug.text("Vie de l'Empereur : " + healthBoss, 575, 20);
        }
    };

    // fonctions

    //fonction de déplacement du joueur en fonction des touches
    function movement_vaisseau(speed_vaisseau) {
        vaisseau.body.velocity.x = 0;
        vaisseau.body.velocity.y = 0;
        if (game.input.keyboard.isDown(goDown.key)) {//vérifie si la touche est pressée
            vaisseau.body.velocity.y = speed_vaisseau;//déplace le vaisseau
        }
        if (game.input.keyboard.isDown(goUp.key)) {
            vaisseau.body.velocity.y = -speed_vaisseau;
        }
        if (game.input.keyboard.isDown(goLeft.key)) {
            vaisseau.body.velocity.x = -speed_vaisseau;
        }
        if (game.input.keyboard.isDown(goRight.key)) {
            vaisseau.body.velocity.x = speed_vaisseau;
        }

        if (vaisseau.body.velocity.x == 0 && vaisseau.body.velocity.y == 0) {
            vaisseau.animations.stop('youFly');//si le vaisseau est à l'arrêt, stoppe l'animation de déplacement
            vaisseau.frame = 0;// affiche l'image du vaisseau à l'arrêt
        } else {
            vaisseau.animations.play('youFly', 7, true);    //sinon joue l'animation
        }

        if (game.input.keyboard.isDown(shoot.key)) {
            shoot_bullet();//tire les balles
        }
    }

    //fonction de tir
    function shoot_bullet() {
        if (game.time.now > bulletTime) {//si le temps d'attente entre les balles est passé
            var bullet = bullets.getFirstExists(false);//on choisit une balle qui n'existe pas (n'est pas actuellement utilisée)

            if (bullet) {
                bullet.reset(vaisseau.x + 60, vaisseau.y);//la balle apparaît devant le vaisseau
                bullet.body.velocity.x = 400;//vitesse de la balle
                bulletTime = game.time.now + 200;//réinitialisation du temps à attendre
            }
        }
    }

    //fonction du tir des ennemis
    function enemyShoot() {
        if (game.time.now > bulletTimeEnemies) {
            var bullet = bulletsEnemies.getFirstExists(false);

            if (bullet) {
                //créé une liste des ennemis en vie
                var aliveEnemies = [];
                poolEnemies.forEachAlive(function(cervolant) {
                    aliveEnemies.push(cervolant);
                });

                // Si il y a au moins un ennemi en vie :
                if (aliveEnemies.length != 0) {
                    var random = game.rnd.integerInRange(0, aliveEnemies.length - 1);//choisit un ennemi au hasard
                    var bulletX = aliveEnemies[random].body.x - 10;
                    var bulletY = aliveEnemies[random].body.y + 16;

                    bullet.reset(bulletX, bulletY);//création de la balle devant l'ennemi
                    bullet.body.velocity.x = -400;
                    bulletTimeEnemies = game.time.now + (1000 / aliveEnemies.length);//il y a une balle de tirée toutes les 1000ms divisé par le nombre d'ennemis
                }
            }
        }
    }

    //fonctions de collision

    //collision entre un ennemi et une balle du joueur
    function collisionEnemiesBullets(enemy, bullet) {
        bullet.kill();//tue la balle
        enemy.kill();//tue l'ennemi
        score = score + 100;
        //affiche l'animation d'explosion
        var explo = explosion.getFirstExists(false);
        if (explo) {
            explo.reset(enemy.x, enemy.y);
            explo.animations.play('explode', 7, false, true);
        }
    }

    //collision entre le vaisseau et une balle ennemie
    function collisionVaisseauBullets(player, bullet) {
        bullet.kill();
        takeDamage(1);//cette fonction gère les dégâts reçus
    }

    //collision entre le boss et une balle du joueur
    function collisionBossBullet(boss, bullet) {
        bullet.kill();
        healthBoss = healthBoss - 1;
    }

    //collision entre le vaisseau et un ennemi
    function collisionVaisseauEnemies(player, enemy) {
        takeDamage(1);
    }

    //collision entre le vaisseau et le boss
    function collisionVaisseauBoss(player, boss) {
        takeDamage(1);
    }

    //collision entre le vaisseau et une balle du boss
    function collisionVaisseauBulletBoss(player, bulletBoss) {
        takeDamage(1);
        bulletBoss.kill();
    }

    //fonction des dégâts reçus
    function takeDamage(damage) {
        if (game.time.now > damageTime) {//si on ne s'est pas pris de dégât depuis 1s (frames d'invulnérabilités)
            var i;
            for (i = 0; i < damage; i += 1) {
                //Exemple avec damage = 1 : i ne vaudra que 0 et donc le coeur sélectionné aura un identifiant correspondant à la vie du joueur : ça sera celui tout à droite.
                var heart = poolLifeIhm.iterate('life', healthPlayer - i, Phaser.Group.RETURN_CHILD);

                if (heart !== null) {
                    heart.kill();
                }
            }

            healthPlayer = healthPlayer - damage;
            score = score - 50 * damage;//perte de 50 points par dégât
            damageTime = game.time.now + 1000;//temps d'invulnérabilité
            vaisseau.alpha = 0.5;//transparence du vaisseau
            game.time.events.add(Phaser.Timer.SECOND, function ()
                                 {
                                     vaisseau.alpha = 1;
                                 }, this);//après la fin du temps d'invulnérabilité, le vaisseau redevient opaque
        }
    }

    //fonction de soin
    function healPlayer(heal) {
        var preHealth = healthPlayer;
        healthPlayer = healthPlayer + heal;
        if (healthPlayer > 5) {
            healthPlayer = 5;
        }

        var i;
        var forHeart;
        for (i = preHealth; i < healthPlayer; i += 1) {
            //Exemple : le joueur avait 4 vies, il en a maintenant 5. i ne vaudra que 4 et on affichera le coeur d'identifiant 4+1 = 5.
            forHeart = poolLifeIhm.iterate('life', i + 1, Phaser.Group.RETURN_CHILD);

            if (forHeart !== null) {
                forHeart.revive();
            }
        }
    }

    //collision entre le vaisseau et le bonus de vie
    function collisionVaisseauBonus(player, bonus) {
        bonus.kill();
        healPlayer(5);
    }

    /****  WAVE GAME OVER  ****/

    /*
     * Ecran de Game Over qui apparaît lorsque le joueur est mort.
     * Il affiche pour cela un menu créé dans playState.create()
     */
    function waveGameOverStart() {
        //Tue absolument tout ce qui pourrait rester à l'écran.
        poolEnemies.callAll("kill", null);
        bulletsEnemies.callAll("kill", null);
        boss.kill();
        bulletsBoss.callAll('kill', null);
        vaisseau.kill();
        bullets.callAll("kill", null);
        bonus.kill();

        score = score - 500;

        menuGameOver.start();
    }

    /*
     * Quand cet écran est quitté, ça fait réapparaître le joueur en (200,200) avec toute sa vie.
     *
     * remarque : si le joueur décide de retourner au menu principal, ceci n'est pas appelé.
     */
    function waveGameOverQuit() {
        vaisseau.revive();
        vaisseau.x = 200;
        vaisseau.y = 200;
        healPlayer(5);
        menuGameOver.quit();
    }

    /****  WAVE WIN  ****/

    /*
     * Ecran de fin qui apparaît lorsque le joueur gagne (il a battu le boss).
     * Il affiche pour cela un menu créé dans playState.create()
     */
    function waveWinStart() {
        musicBoss.stop();
        musicLevel.play();

        //Tue tous ce qui concerne les ennemis
        poolEnemies.callAll('kill', null);
        bulletsEnemies.callAll('kill', null);
        bulletsBoss.callAll('kill', null);

        score = score + 2000;

        menuWin.start();
    }

    /****  WAVE SOLDIER  ****/

    // Fonction de commencement de la vague du premier discours du soldat.
    function waveSoldierStart() {
        communicationEngine.write(['Sergent !\nLes cervolants nous attaquent !', 'Vite !\nVous devez sauver notre ville !', "TUEZ LES JUSQU'AU DERNIER !!!"]);

        if (musicBoss.isPlaying) {
            musicBoss.stop();
            musicLevel.play();
        }
    }

    function waveSoldier2Start() {//second discours du soldat
        communicationEngine.write(["Attention sergent !\nL'empereur des cervolants arrive !","Il vient mener l'assaut final.",'Arrêtez le vite !!!']);
        
        if (!musicBoss.isPlaying) {
            musicLevel.stop();
            musicBoss.play();
        }
    }

    // Fonction de mise à jour des vagues des discours du soldat.
    function waveSoldierUpdate() {
        if (communicationEngine.finished) {
            level.nextWave();
        }
    }

    //fonction servant à l'apparition des ennemis
    function spawnEnemy (x, y, id) {//on utilise en argument leurs positions et leurs identifiants

        var enemy = poolEnemies.getFirstExists(false);//on choisit le premier ennemi qui n'est pas utilisé
        if (enemy) {
            enemy.reset(x, y);//on le fait réaparaître aux coordonnées voulues
        }
        var cervolant = poolEnemies.iterate('id', enemy.id, Phaser.Group.RETURN_CHILD);
        cervolant.id = id;//on lui donne un identifiant (un identifiant par ennemi)
    }

    //fonction associant les identifiants et les déplacement des ennemis
    function idEffect (id, speedx, xa, xb, speedy, ya, yb) {
        var cervolant = poolEnemies.iterate('id', id, Phaser.Group.RETURN_CHILD);
        if (cervolant !== null)
        {
            //on leur donne leur vitesse s'ils sont immobiles
            if (!(cervolant.body.velocity.y == speedy) && !(cervolant.body.velocity.y == -speedy))
            {
                cervolant.body.velocity.y = speedy;
            }
            if (!(cervolant.body.velocity.x == speedx) && !(cervolant.body.velocity.x == -speedx))
            {
                cervolant.body.velocity.x = speedx;
            }

            //on les fait se déplacer entre les bornes ya et yb
            if (cervolant.body.y < ya)
            {
                cervolant.body.velocity.y = speedy;
            }
            else if (cervolant.body.y > yb)
            {
                cervolant.body.velocity.y = -speedy;
            }

            //on les fait se déplacer entre les bornes xa et xb
            if (cervolant.body.x < xa)
            {
                cervolant.body.velocity.x = speedx;
            }
            else if (cervolant.body.x > xb)
            {
                cervolant.body.velocity.x = -speedx;
            }
        }
    }

    //fonction de création de la première vague
    function waveStart1() {

        spawnEnemy(650, 250, 2);//utilise la fonction d'apparition d'ennemis
        spawnEnemy(600, 300, 1);
        spawnEnemy(650, 350, 3);

    }

    //fonction de création de la deuxième vague
    function waveStart2() {

        spawnEnemy(725, 125, 0);//4 ici liste des identifiants qu'ils auraient eu s'ils avaient eu un mouvement
        spawnEnemy(675, 150, 0);//5
        spawnEnemy(725, 175, 0);//6

        spawnEnemy(650, 275, 0);//7
        spawnEnemy(600, 300, 0);//8
        spawnEnemy(650, 325, 0);//9

        spawnEnemy(725, 425, 0);//10
        spawnEnemy(675, 450, 0);//11
        spawnEnemy(725, 475, 0);//12

    }

    //fonction de création de la troisième vague
    function waveStart3() {

        spawnEnemy(750, 100, 13);
        spawnEnemy(750, 200, 14);
        spawnEnemy(750, 300, 15);
        spawnEnemy(750, 400, 16);
        spawnEnemy(750, 500, 17);

        spawnEnemy(700, 150, 18);
        spawnEnemy(700, 300, 19);
        spawnEnemy(700, 450, 20);

    }

    //fonction de création de la quatrième vague
    function waveStart4() {
        spawnEnemy(675, 300, 21);
        spawnEnemy(725, 265, 22);
        spawnEnemy(725, 335, 23);
        spawnEnemy(760, 300, 24);

        //apparition du bonus de vie
        bonus.reset(750, 300);
        bonus.body.velocity.x = -50;
    }

    //fonction d'actualisation des vagues d'ennemis
    function waveUpdate() {
        //passage à la prochaine vague s'il n'y a plus d'ennemis
        var enemy = poolEnemies.getFirstExists(true);
        if(enemy === null) {
            level.nextWave();
        } else {
            enemyShoot();//les ennemis tirent
        }

        idEffect(1, 0, 0, 0, 50, 50, 550);//application des mouvements aux identifiants
        idEffect(2, 50, 500, 750, 0, 0, 0);
        idEffect(3, 50, 500, 750, 0, 0, 0);

        idEffect(13, 30, 500, 500, 20, 5, 100);
        idEffect(14, 20, 600, 600, 0, 0, 0);
        idEffect(15, 20, 650, 650, 20, 200, 300);
        idEffect(16, 20, 600, 600, 0, 0, 0);
        idEffect(17, 20, 500, 500, 20, 500, 595);

        idEffect(18, 20, 525, 525, 0, 0, 0);
        idEffect(19, 20, 500, 500, 0, 0, 0);
        idEffect(20, 20, 525, 525, 0, 0, 0);

        idEffect(21, 50, -100, 100, 0, 0, 0);
        idEffect(22, 50, -100, 100, 0, 0, 0);
        idEffect(23, 50, -100, 100, 0, 0, 0);
        idEffect(24, 50, -100, 100, 0, 0, 0);

    }

    //vague du boss
    function waveBossStart() {
        boss.reset(400, 300);

        //réinitialisation des variables
        healthBoss = 100;//vie du boss
        cooldownBulletBoss = 800;//temps entre chaque tir du boss
        spawn75 = true;//variable servant à ne faire qu'une fois chaque apparition d'ennemis
        spawn50 = true;
        spawn25 = true;
        spawn10 = true;
        roar.play();//cri du boss à l'apparition
    }

    //actualisation de la vague du boss
    function waveBossUpdate() {
        game.physics.arcade.overlap(vaisseau, boss, collisionVaisseauBoss, null, this);
        game.physics.arcade.overlap(vaisseau, bulletsBoss, collisionVaisseauBulletBoss, null, this);
        game.physics.arcade.overlap(boss, bullets, collisionBossBullet, null, this);

        //fait tirer les ennemis
        var enemy = poolEnemies.getFirstExists(true);
        if (enemy) {
            enemyShoot();
        }

        //apparition d'ennemis quand le boss a 75 points de vie
        if (healthBoss == 75 && spawn75) {
            spawnEnemy(500, 100, 0);//101
            spawnEnemy(500, 500, 0);//102
            spawn75 = false;//change la variable pour éviter de refaire cette apparition (le boss peut toujours avoir 75 points de vie à la prochaine mise à jour du jeu)
        }

        //apparition d'ennemis quand le boss a 50 points de vie
        if (healthBoss == 50 && spawn50) {
            spawnEnemy(500, 100, 0);//103
            spawnEnemy(450, 300, 104);//104
            spawnEnemy(500, 500, 0);//105
            spawn50 = false;
        }

        //apparition d'ennemis quand le boss a 25 points de vie et augmentation de sa vitesse de tir
        if (healthBoss == 25 && spawn25) {
            spawnEnemy(500, 100, 106);//106
            spawnEnemy(450, 300, 0);//107
            spawnEnemy(500, 500, 108);//108
            spawn25 = false;
            cooldownBulletBoss = 600;//augmente sa vitesse de tir
        }

        //apparition d'ennemis quand le boss a 10 points de vie
        if (healthBoss == 10 && spawn10) {
            spawnEnemy(500, 100, 109);//109
            spawnEnemy(450, 200, 110);//110
            spawnEnemy(450, 400, 111);//111
            spawnEnemy(500, 500, 112);//112
            spawn10 = false;
        }

        //vérifie si le boss est mort
        if (healthBoss <= 0) {
            boss.kill();//tue le boss
            roar.play();//cri du boss
            level.nextWave();//passe à la prochaine vague (c'est à dire l'écran de Win)
        }

        //tir du boss
        if (game.time.now > bulletTimeBoss) {
            var bullet = bulletsBoss.getFirstExists(false);

            if (bullet) {
                bullet.reset(boss.x + 180, boss.y - 30);
                game.physics.arcade.moveToObject(bullet, vaisseau, 300);//vise le joueur
                bulletTimeBoss = game.time.now + cooldownBulletBoss;
            }
        }
    }

    game.state.add('play', playState);

    game.state.start('load');//Commence le jeu à l'état de chargement des ressources.

}());
