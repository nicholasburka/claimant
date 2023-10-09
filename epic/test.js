const fs = require('fs');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { v1: uuidv1, v4: uuidv4 } = require('uuid');

const Fhir = require('fhir').Fhir;
const FhirVersions = require('fhir').Versions;
const ParseConformance = require('fhir').ParseConformance; 
//Epic Test API uses Conformance type XML
//line 1 of resp : <Conformance xmlns="http://hl7.org/fhir">

const testApiBaseUrl = "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/STU3";
const apiType = "stu3"; //node js package 'fhir' parser only supports stu3, r4, r5
const apiUrl = testApiBaseUrl;
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

//make call to epic api
//what data did you get

//name: carrot-case name
//json: a json obj
function saveJsonToFile(name, json) {
	fs.writeFileSync('./' + name + '.json', json);
}

//following steps in https://fhir.epic.com/Documentation?docId=oauth2
async function apiMetadata(apiUrl) {
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
	console.log(json);
	//save json to file
	saveJsonToFile('metadata-resp', json);
}

//using the backend services method
async function getAuthToken(apiUrl) {
	//create JWT
	const privateKey = fs.readFileSync('privatekey.pem');
	const publicKey = fs.readFileSync('publickey509.pem');
	const pubKeyHash = Buffer.from(publicKey).toString('base64');
	const alg = 'RS256';

	const reqUrl = 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token';

	const header = {
		alg,
		typ: 'JWT',
		kid: pubKeyHash
	}

	const payload = {
		iss: 'a549aa91-5eec-4d46-8803-336485929aed', //Epic non-prod client_id
		sub: 'a549aa91-5eec-4d46-8803-336485929aed', //Epic non-prod client_id
		aud: reqUrl,
		jti: uuidv1(),
		exp: Math.floor((Date.now() + (3* 60 * 1000)) / 1000) // current time + 5 minutes, in seconds
	}
//1695272506338
//1583524102
//1695272412935
//1695272463591
//1695272706
	console.log(uuidv4());
	console.log(Math.floor((Date.now() + (3 * 60 * 1000)) / 1000));
	console.log(Math.floor((Date.now() / 1000)));

	const headerEncoded = Buffer.from(JSON.stringify(header)).toString('base64');
	const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64')
	const toSign = headerEncoded + '.' + payloadEncoded;
	//console.log(toSign);
	console.log(toSign.length);

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
			'Content-Type': 'application/x-www-formencoded;'
		},
		body: formBody
	});

	console.log(resp);

	const respJson = await resp.json();
	saveJsonToFile('resp-', JSON.stringify(resp));
	console.log(respJson);
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

/**
 * 
 * */
async function fetchPatientById(apiUrl, patientId) {
	const url = apiUrl + 'Patient/' + patientId;
	console.log('hello')
	console.log(url);
	//use Patient.Read API https://fhir.epic.com/Specifications?api=29
	return await fetch(apiUrl + 'Patient/' + patientId);
}

/*const data = fetchPatientById(apiUrl, testId).then((res) => {
	console.log(res);
	res.json().then((data) => {console.log(data)});
})*/
//console.log(data)

//apiMetadata(apiUrl);
getAuthToken(apiUrl);

//getting 401 unauthorized => need OAuth 2.0 flow