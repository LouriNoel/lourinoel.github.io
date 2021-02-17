let edtForm;
let enterurlField;
let submiturlButton;
let forgeturlButton;
let calendarContainer;
let ul;

let db;
const db_name = "agenda";
const itemTable = "item";

// TODO https://stackoverflow.com/questions/41586400/using-indexeddb-asynchronously

function init() {
	edtForm = document.querySelector('#edt-form');
	enterurlField = document.querySelector('#enterurl');
	submiturlButton = document.querySelector('#submiturl');
	forgeturlButton = document.querySelector('#forgeturl');
	calendarContainer = document.querySelector('#calendar_container');
	ul = document.querySelector('#calendar_ul');

	// empêche le form d'être soumis
	edtForm.addEventListener("submit", event => {
		event.preventDefault();
	});

	submiturlButton.addEventListener("click", () => {
		localStorage.setItem("edt_url", enterurlField.value); // store url in web storage
		
		ul.textContent = "";
	
		const url = localStorage.getItem("edt_url");
		if(url) { // if present in web storage
			// TODO for now, from path
			loadTextFromFile(url).then((iCalendarData) => {
				saveCalendarIntoDatabase(iCalendarData); // also display
			});
		}
		else {
			const li = document.createElement("li");
			li.textContent = "Aucun emploi du temps n'est sauvegardé.";
			ul.appendChild(li);
		}
	});

	forgeturlButton.addEventListener("click", () => {
		localStorage.removeItem("edt_url"); // delete url from web storage
		
		let transaction = db.transaction([itemTable], 'readwrite');
		let os = transaction.objectStore(itemTable);
		os.clear();
		
		const li = document.createElement("li");
		li.textContent = "Aucun emploi du temps n'est sauvegardé.";
		ul.appendChild(li);
	});
}

// obj = vevent.getFirstPropertyValue("dtstart" / "dtend")._time
function propertyToDate(prop) {
	const time = prop._time;
	
	let date = new Date();
	date.setYear(time.year);
	date.setMonth(time.month);
	date.setDate(time.day);
	date.setHours(time.hour);
	date.setMinutes(time.minute);
	
	return date;
}

function addVeventToDatabase(db, vevent) {
	const dtstart = propertyToDate(vevent.getFirstPropertyValue("dtstart"));
	const dtend = propertyToDate(vevent.getFirstPropertyValue("dtend"));
	const summary = vevent.getFirstPropertyValue("summary");
	const location_ = vevent.getFirstPropertyValue("location");
	const description = vevent.getFirstPropertyValue("description");
	
	const item = {"dtstart": dtstart, "dtend": dtend, "summary": summary, "location": location_, "description": description};
	
	let transaction = db.transaction([itemTable], 'readwrite');

	transaction.onerror = function() {
		console.log('Transaction not opened due to error');
	};
	
	let os = transaction.objectStore(itemTable);
	
	var request = os.add(item);
	request.onsuccess = function(e) {
		request.id = e.target.result;
	};
	
	transaction.oncomplete = function() { // après ajout
		displayItemById(request.id);
	};
}

// TODO forgetDiv.style.display = 'none'; / 'block'

function displayItemById(id) {
	let os = db.transaction(itemTable).objectStore(itemTable);
	
	var request = os.get(id);
	
	request.onerror = function() {
		console.log('Cannot retrieve item.');
	};
	
	request.onsuccess = function(e) {
		displayItem(id, request.result);
	};
}

function displayItem(id, item) {
	const dtstart = document.createElement("div");
	dtstart.textContent = item.dtstart.toString();
	
	const dtend = document.createElement("div");
	dtend.textContent = item.dtend.toString();
	
	const summary = document.createElement("div");
	summary.textContent = item.summary;
	
	const location_ = document.createElement("div");
	location_.textContent = item["location"];
	
	const description = document.createElement("div");
	description.textContent = item.description;
	
	// create ul here ?
	
	li = document.createElement("li");
	li.setAttribute("id", id);
	li.appendChild(dtstart);
	li.appendChild(dtend);
	li.appendChild(summary);
	li.appendChild(location_);
	li.appendChild(description);
	
	ul.appendChild(li);
}

// success = callback on success
function openDatabase(success) {
	let request = window.indexedDB.open(db_name, 1);
	
	request.onerror = () => {
		console.log('Database failed to open');
	};
	
	request.onsuccess = function() {
		db = request.result;
		success();
		//;
	};
	
	// Spécifie les tables de la BDD si ce n'est pas déjà pas fait
	request.onupgradeneeded = function(e) {
		// Récupère une référence à la BDD ouverte
		db = e.target.result;
		
		// Crée un objectStore pour stocker nos notes (une TABLE)
		// Avec un champ qui s'auto-incrémente comme clé
		if(!db.objectStoreNames.contains(itemTable)) {
			// table
			let os = db.createObjectStore(itemTable, { keyPath: 'id', autoIncrement:true });
			// columns
			os.createIndex("dtstart", "dtstart", { unique: false });
			os.createIndex("dtend", "dtend", { unique: false });
			os.createIndex("summary", "summary", { unique: false });
			os.createIndex("location", "location", { unique: false });
			os.createIndex("description", "description", { unique: false });
		}
		
		console.log('Database setup complete');
	};
}

function saveCalendarIntoDatabase(iCalendarData) {
	const jcalData = ICAL.parse(iCalendarData);
	const vcalendar = new ICAL.Component(jcalData);
	
	openDatabase(() => vcalendar.getAllSubcomponents().forEach(vevent => addVeventToDatabase(db, vevent)));
}

function displayWholeDatabase() {
	let os = db.transaction(itemTable).objectStore(itemTable);
	os.openCursor().onsuccess = function(e) {
		let cursor = e.target.result;
		if(cursor) {
			console.log(cursor.value);
			displayItem(cursor.value.id, cursor.value);
			cursor.continue();
		} else {
			if(!ul.firstChild){ // est vide
				const li = document.createElement("li");
				li.textContent = "Aucun emploi du temps n'est sauvegardé.";
				ul.appendChild(li);
			}
		}
	}
}

async function loadTextFromFile(path) {
	if(path.substring(0,4) === "http"){
		return await window.fetch(path).then(response => {return response;});
	} else {
		return await window.fetch(path).then(response => {return response.text();});
	}
}

function main() {
	init();
	
	/*if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('./sw.js').then(function(reg) {
			// registration worked
			console.log('Registration succeeded. Scope is ' + reg.scope);
		}).catch(function(error) {
			// registration failed
			console.log('Registration failed with ' + error);
		});
	};*/

	openDatabase(() => displayWholeDatabase());
}

document.body.onload = main;
