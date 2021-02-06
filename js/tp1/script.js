class LoadingCircle {
	// x,y : position du centre
	// r1,r2 : rayon inférieur/supérieur
	// c1,c2 : couleur de fond/du trait
	constructor(x, y, r1, r2, c1, c2){
		this.x = x;
		this.y = y;
		this.r1 = r1;
		this.r2 = r2;
		this.c1 = c1;
		this.c2 = c2;
		
		this.ratio = 0; // taux de complétion, entre 0.0 et 1.0
	}
	
	setRatio(ratio){
		this.ratio = ratio;
	}
	
	draw(ctx){
		let a = this.ratio * 2.0*Math.PI;
		
		ctx.fillStyle = this.c2;
		ctx.beginPath();
			ctx.moveTo(this.x + this.r1, this.y);
			ctx.lineTo(this.x + this.r2, this.y);
			ctx.arc(this.x, this.y, this.r2, 0, a);
			
			let x2 = this.x + this.r1 * Math.cos(a);
			let y2 = this.y + this.r1 * Math.sin(a);
			
			ctx.lineTo(x2, y2);
			ctx.arc(this.x, this.y, this.r1, a, 0, true);
			ctx.fill();
		ctx.closePath();
	}
}

var THICKNESS = 5;
var CANVAS_BACKGROUND_COLOR = 'white';
var LOADING_CIRCLE_COLOR = 'black';

var canvas;
var ctx;
var loading_circle;

var BUTTON_UP_IMAGES = ['js/tp1/button/play.png', 'js/tp1/button/pause.png', 'js/tp1/button/stop.png'];
var BUTTON_DOWN_IMAGES = ['js/tp1/button/play-down.png', 'js/tp1/button/pause-down.png', 'js/tp1/button/stop-down.png'];
var buttons = []; // 0: play, 1: pause, 2: stop
var activated_button = -1; // index du dernier bouton pressé

var sanesss;

var audio;
var can_play = false;

// point d'entrée, initialisation
function main(){
	canvas = document.getElementById('dance-floor');
	ctx = canvas.getContext('2d');
	
	let w = canvas.width;
	let h = canvas.height;
	let r2 = 0.75 * (w/2.0);
	if(r2 < THICKNESS){
		throw new Error("Le canvas est trop petit.");
	}
	
	loading_circle = new LoadingCircle(w/2.0, h/2.0, r2-THICKNESS, r2, CANVAS_BACKGROUND_COLOR, LOADING_CIRCLE_COLOR);
	
	buttons.push(document.getElementById('fight'));
	buttons[0].onclick = play;
	buttons.push(document.getElementById('act'));
	buttons[1].onclick = pause;
	buttons.push(document.getElementById('mercy'));
	buttons[2].onclick = stop;
	
	saness = document.getElementById('saness');
	
	audio = new Audio("js/tp1/mogolovonio.mp3");
	audio.addEventListener("timeupdate", logic);
	
	audio.addEventListener("can_playthrough", event => can_play = true);
}

function logic(){
	update();
	render();
}

function update(){
	loading_circle.setRatio(audio.currentTime / audio.duration);
}

function render(){
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = CANVAS_BACKGROUND_COLOR;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	loading_circle.draw(ctx);
}

function play(){
	/*if(!can_play){
		alert("La musique n'a pas assez chargé.");
		return;
	}*/
	
	setButtonDownImage(0);
	audio.play();console.log("play");
}

function pause(){
	if(activated_button === -1){
		return;
	}
	
	setButtonDownImage(1);
	audio.pause();
}

function stop(){
	if(activated_button === -1){
		return;
	}
	
	setButtonDownImage(2);
	audio.pause();
	audio.currentTime = 0.0;
}

function setButtonDownImage(i){
	if(activated_button === -1){
		buttons.forEach((butt, k) => {
			butt.firstChild.style = 'visibility: hidden;';
			butt.style = 'background: url(' + BUTTON_UP_IMAGES[k] + ') center no-repeat; background-size: 100% 100%;';
			
			document.getElementById('last-corridor').style = '';
		});
	}
	else {
		buttons[activated_button].style = 'background: url(' + BUTTON_UP_IMAGES[activated_button] + ') center no-repeat; background-size: 100% 100%;';
	}
	
	activated_button = i;
	buttons[i].style = 'background: url(' + BUTTON_DOWN_IMAGES[i] + ') center no-repeat; background-size: 100% 100%;';
}
