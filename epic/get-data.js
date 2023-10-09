const fs = require('fs');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { v1: uuidv1, v4: uuidv4 } = require('uuid');

const Fhir = require('fhir').Fhir;
const FhirVersions = require('fhir').Versions;
const ParseConformance = require('fhir').ParseConformance; 
//Epic Test API uses Conformance type XML
//line 1 of resp : <Conformance xmlns="http://hl7.org/fhir">

const apiType = "R4"; //node js package 'fhir' parser only supports stu3, r4, r5
const testApiBaseUrl = "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/"
						+ apiType;
const apiUrl = testApiBaseUrl;
const patientApiDict = {
	"DSTU2": ["Patient", "AllergyIntolerance", "Appointment", "Condition",
		"Consent", "Coverage", "Device", "DeviceRequest", "DeviceUseStatement",
		"DiagnosticReport", "DocumentReference", "Encounter", "Flag", "Goal",
		"Immunization", "List", "MedicationAdministration", "MedicationRequest",
		"MedicationStatement", "NutritionOrder", "Observation", "Procedure"],
	"STU3": ["Patient", "AllergyIntolerance", "Appointment", "Condition", //"Binary",
		"Consent", "Coverage", "Device", "DeviceUseStatement", "DiagnosticReport",
		"DocumentReference", "Encounter", "Flag", "Goal", "Immunization",
		"ImmunizationRecommendation", "MedicationRequest", 
		"MedicationStatement","NutritionOrder", "Observation", "Procedure", 
		"ProcedureRequest"],
	"R4": ["Patient", "AllergyIntolerance", "Appointment", "BodyStructure",
		"CarePlan", "CareTeam", "Communication", "Condition", "Consent",
		"Coverage", "Device", "DeviceRequest", "DeviceUseStatement", 
		"DiagnosticReport", "DocumentReference", "Encounter", "EpisodeOfCare",
		"ExplanationOfBenefit", "FamilyMemberHistory", "Flag", "Goal",
		"Immunization", "List", "MedicationAdministration", "MedicationDispense",
		"NutritionOrder", "Observation", "Procedure", "QuestionnaireResponse",
		"ResearchSubject", "ServiceRequest", "Task"]//Binary API excluded
} //APIs that directly reference patient information. Other API's exist for providers 

const testPatientId = "eq081-VQEgP8drUUqCWzHfw3";

console.log("FhirVersions[apiType]");
console.log(apiType);
console.log(FhirVersions[apiType]);

//build the Conformance XML parser
const newValueSets = JSON.parse(fs.readFileSync('./definitions.json/valuesets.json').toString());
const newTypes = JSON.parse(fs.readFileSync('./definitions.json/profiles-types.json').toString());
const newResources = JSON.parse(fs.readFileSync('./definitions.json/profiles-resources.json').toString());

const parser = new ParseConformance(false, FhirVersions[apiType]); 
parser.parseBundle(newValueSets);
parser.parseBundle(newTypes);
parser.parseBundle(newResources);

const fhir = new Fhir(parser);

var access_token = undefined;

//make call to epic api
//what data did you get

//name: carrot-case name
//json: a json obj
function saveJsonToFile(name, json) {
	fs.writeFileSync('./' + name + '.json', json);
}

/*
two ways to auth using epic api https://fhir.epic.com/Documentation?docId=oauth2

1. EHR method: - needs launch code
2. 

*/

//EHR method step 1
/** 
 * Gets the ___ statement
 * */
async function getApiMetadata(apiUrl) {
	//console.log("**RESPONSE OBJ**");
	const metaResp = await fetch(apiUrl + '/metadata');
	//console.log(metaResp);
	//console.log('**JSON**');
	/*const xml = fhir.objToXml(metaResp);
	console.log(xml);
	const json = fhir.xmlToJson(metaResp);
	console.log(json);*/

	const xml = await metaResp.text();
	//const xmlParsed = fhir.objToXml(xml);
	//console.log(xmlParsed);
	const json = fhir.xmlToJson(xml);
	//console.log(json);
	//save json to file
	saveJsonToFile('metadata-resp', json);
}

//using the backend services method
async function getAuthToken(apiUrl) {
	//create JWT
	const privateKey = fs.readFileSync('privatekey.pem');
	const publicKey = fs.readFileSync('publickey509.pem');
	const pubKeyHash = Buffer.from(publicKey).toString('base64');
	const alg = 'RS384';

	const reqUrl = 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token';

	const header = {
		alg,
		typ: 'JWT'//,
		//kid: pubKeyHash
	}

	const payload = {
		iss: 'a549aa91-5eec-4d46-8803-336485929aed', //Epic non-prod client_id
		sub: 'a549aa91-5eec-4d46-8803-336485929aed', //Epic non-prod client_id
		aud: reqUrl,
		jti: uuidv1(),
		exp: Math.floor((Date.now() + (3* 60 * 1000)) / 1000) // current time + 5 minutes, in seconds
	}
	//console.log(uuidv4());
	//console.log(Math.floor((Date.now() + (3 * 60 * 1000)) / 1000));
	//console.log(Math.floor((Date.now() / 1000)));

	/*const headerEncoded = Buffer.from(JSON.stringify(header)).toString('base64');
	const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64')
	const toSign = headerEncoded + '.' + payloadEncoded;
	//console.log(toSign);
	console.log(toSign.length);*/

	const a_jwt = jwt.sign(payload, privateKey, { algorithm: alg });
	console.log('JWT');
	console.log(a_jwt);

	//https://fhir.epic.com/Documentation?docId=oauth2&section=BackendOAuth2Guide
	const reqBody = {
		grant_type: 'client_credentials',
		client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
		client_assertion: a_jwt
	};
	saveJsonToFile('post-req', JSON.stringify(reqBody));

	console.log("POSTing");
	console.log("API URL: " + reqUrl);
	console.log("REQ BODY: ");
	console.log(reqBody);

	var formBody = [];
	for (var key in reqBody) {
		var encKey = encodeURIComponent(key);
		var encVal = encodeURIComponent(reqBody[key]);
		formBody.push(encKey + "=" + encVal); //https://stackoverflow.com/questions/35325370/how-do-i-post-a-x-www-form-urlencoded-request-using-fetch
	}
	formBody = formBody.join("&");

	const resp = await fetch(reqUrl, {
		method: "POST",
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded;'
		},
		body: formBody
	});

	console.log(resp);

	const respJson = await resp.json();
	saveJsonToFile('access-token', JSON.stringify(resp));
	console.log(respJson);
	access_token = respJson.access_token;
	//console.log(respJson.access_token);
}

async function authApi(apiUrl) {
	//step 3 of https://fhir.epic.com/Documentation?docId=oauth2
	const reqBody = {
		response_type: 'code',
		client_id: 'a549aa91-5eec-4d46-8803-336485929aed',
		redirect_uri: '____',
		scope: "openid",
		launch: "____"
		//other params (usually) not necessary
	}

	//make the fetch request

	//parse the xml

	//console.log and saveToFile
}

function BasicPatientInfo(firstName, lastName, birthDay) {
	this.given = firstName || "";
	this.family = lastName || "";
	this.birthdate = birthDay || "";
	return this;
}

async function getPatientIdByName(apiUrl, patientInfo) {
	if (!access_token) {
		console.log("Not authorized to Epic API");
		return;
	}

	//build request URL
	var url = apiUrl + '/Patient?';
	var first = true;
	for (var key in patientInfo) {
		if (patientInfo[key]) {
			if(!first) {
				url+= "&";
			} else {
				first = false;
			}
			url += key;
			url += "=";
			url += patientInfo[key];
		}	
	}
	console.log("GETting url: " + url);
	console.log("Access token: " + access_token);

	const res = await fetch(url, {
		access_token
	});
	console.log(res);


}

/**
 * 
 * */
async function getPatientById(apiUrl, patient) {
	const url = apiUrl + '/Patient/' + patient.id;
	console.log("GETting Patient url " + url);
	//use Patient.Read API https://fhir.epic.com/Specifications?api=29
	const res = await fetch(url, {
		headers: {
			Authorization: "Bearer " + access_token
		},
		access_token
	});
	console.log(res);
	//const json = await res.json();
	const text = await res.text();
	const json = fhir.xmlToJson(text);
	saveJsonToFile(patient.given + patient.family + "-patient", json);
	console.log(json);
}

async function getConditionsById(apiUrl, patient) {
	const url = apiUrl + '/Condition?subject=' + patient.id;
	console.log("GETting Condition url " + url);
	const res = await fetch(url, {
		headers: {
			Authorization: "Bearer " + access_token
		},
		access_token
	});

	const text = await res.text();
	const json = fhir.xmlToJson(text);
	console.log(json.identifier);
	saveJsonToFile(patient.given + patient.family + "-condition", json);
	console.log(json);
}

/**
 * Gets a bunch of different API's, specified by
 * @param apiList
 * */
async function getPatientDataById(apiUrl, patient, apiList) {
	console.log("Fetching patient data for patient " + patient.given + " " + patient.family);
	console.log("Patient ID: " + patient.id);
	if (!patient.id) {
		return;
	}
	//const stu3_apis = ["Patient", "Appointment", "Binary", "Condition", "Consent", ""]
	var apiResults = {};
	for (var api of apiList) {
		let url = apiUrl + "/" + api + "?patient=" + patient.id;
		console.log("Fetching current API: " + api);
		console.log(url);
		let res = await fetch(url, {
			headers: {
				Authorization: "Bearer " + access_token
			}
		});
		try {
			let text = await res.text();
			//console.log(text);
			let json = JSON.parse(fhir.xmlToJson(text));
			console.log(json);
			console.log(typeof(json));
			if (json) {
				apiResults[api] = json;
			} else {
				console.log("Could not fetch data for " + api + " API");
			}
		} catch (err) {
			continue;
		}
		
	}
	if (apiResults) {
		//console.log(apiResults);
		saveJsonToFile(patient.given + patient.family + String(apiType), JSON.stringify(apiResults));
	}
	return apiResults;
}

async function requestSpecificEncounter(url, patient) {
	console.log("request encounter");
	let res = await fetch(url, {
		headers: {
			Authorization: "Bearer " + access_token
		}
	});

	console.log(res);

	try {
		let text = await res.text();
		//console.log(text);
		let json = JSON.parse(fhir.xmlToJson(text));
		console.log(json);
		console.log(typeof(json));
		if (json) {
			saveJsonToFile("PatientEncounter" + patient.given + patient.family, JSON.stringify(json));
		} else {
			//console.log("Could not fetch data for " + api + " API");
		}
	} catch (err) {
		
	}
}

//DOES NOT WORK WITH TEST SERVER
async function patientEverything(apiUrl, patient) {
	if (apiType !== "R4" && apiType !== "R5") {
		console.log("Incompatible FHIR api version: need R4 or R5 for patient/{id}/$everything");
		return;
	}
	console.log("patient everything");
	let url = apiUrl + "/Patient/" + patient.id + "/$everything";
	console.log(url);
	let res = await fetch(url, {
		headers: {
			Authorization: "Bearer " + access_token
		}
	});
	let text = await res.text();
	console.log(res);
	console.log(text);
	let json = JSON.parse(fhir.xmlToJson(text));
	console.log(json);
}

/*const data = fetchPatientById(apiUrl, testPatientId).then((res) => {
	console.log(res);
	//res.json().then((data) => {console.log(data)});
})*/
//console.log(data)

async function test() {
	const conformanceStatement = await getApiMetadata(apiUrl);
	const derrickLin = new BasicPatientInfo("Derrick", "Lin");
	derrickLin.id = testPatientId;
	const elijahDavis = new BasicPatientInfo("Elijah", "Davis");
	elijahDavis.id = "egqBHVfQlt4Bw3XGXoxVxHg3";
	const tok = await getAuthToken(apiUrl);
	//const patient = await getPatientIdByName(apiUrl, testPatient);
	const patient = await getPatientById(apiUrl, elijahDavis);
	const cond = await getConditionsById(apiUrl, elijahDavis);
	//const aggregateData = await getPatientDataById(apiUrl, elijahDavis, patientApiDict[apiType])
	//const ev = await patientEverything(apiUrl, elijahDavis);
	const enc = await requestSpecificEncounter("https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/STU3/Encounter/emhwuharfnf8VhCQg97qP7Q3", elijahDavis);
}

test();
//getAuthToken(apiUrl);
//getPatientIdByName(apiUrl, testPatient);


//apiMetadata(apiUrl);
//getAuthToken(apiUrl);

//getting 401 unauthorized => need OAuth 2.0 flow