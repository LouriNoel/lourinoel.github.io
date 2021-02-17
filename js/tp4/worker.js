var id;

var range;

onmessage = msg => {
	let data = JSON.parse(msg.data);
	
	if(data.header === "id"){
		id = data.id;
	}
	else if(data.header === "launch"){
		range = data.range;
		
		callback();
	}
}

function callback() {
	sendCoords();
	setTimeout(callback, 0.5+Math.floor(1000 * Math.random())); // entre 0.5s et 1.5s : moyenne d'une seconde
}

function sendCoords(){
	let x = Math.floor(range * Math.random());
	let y = Math.floor(range * Math.random());
	
	postMessage(JSON.stringify({"id": id, "x": x, "y": y}));
}
