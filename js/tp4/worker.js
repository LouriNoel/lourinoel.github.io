var id;

var intervalID = -1;

var range;

onmessage = msg => {
	let data = JSON.parse(msg.data);
	
	if(data.header === "id"){
		id = data.id;
	}
	else if(data.header === "launch"){
		range = data.range;
		
		let delay = Math.floor(1000 * Math.random());
		
		setTimeout(() => {
			intervalID = setInterval(sendCoords, 1000);
		}, delay);
	}
}

function sendCoords(){
	let x = Math.floor(range * Math.random());
	let y = Math.floor(range * Math.random());
	postMessage('{"id": ' + id + ', "x": ' + x + ', "y": ' + y + '}');
}
