<template>
    <div>
        <h3>Load Data - {{ client.name }}</h3>
        <!--upload box-->
        <!--new client or attach to client - radio choice-->
        <!--form for new client, dropdown for clients to attach to-->
        <div id="upload div" class="column">
            <p style="margin-top: 0">upload a FHIR R4 JSON file or PDF</p>
            <ul style="margin-top: 0; align-self: left;">
                <li>the app will try to auto-detect if the file is for a new or current client</li>
                <li>the file will be stored in your browser's local storage - only search terms will be transmitted online</li>
            </ul>
             <!--we will only store anonymized metadata about search and analyses that you choose to share to help us build our product.</p>-->
            <input id="fileInput" type="file" class="row" @change="readFile">
            <!-- bulk upload drop box -->
            <!--<button v-on:click="readFile()" id="uploadSubmit" type="button" class="row">Validate File</button>-->
            <h3 v-if="invalidFileType" style="color: red">Invalid file type: not JSON or PDF.</h3>
            <h3 v-if="successfulLoad" style="color: rgb(3, 222, 3)">Loaded file successfully - navigate to Review Data at top of page.</h3>
            <div v-if="validatedFile">
                <h3 v-if="detectedPatientName">Patient: {{ detectedPatientName }}</h3>
                <select v-else>
                    <option>No Client Assigned</option>
                    <option v-on:click="newClientForm()">New Client</option>
                    <option v-for="client in clients" :key="client">{{ client.name }}</option>
                </select>
            </div>
            <div v-if="newClient">Client name: <input type="text" v-model="newClientName"></div>
            <div id="jsonFileDetails">
                <button v-if="uploadedJson && fhirResourceType" v-on:click="loadClient()">Confirm Load FHIR</button>
                <h3 v-if="uploadedJson && fhirResourceType">Detected FHIR Resource of Type: {{ fhirResourceType }} </h3>
                <h3 v-if="numRecords">Record count: {{ numRecords }}</h3>
                <h3 v-if="recordTypes">Record types: {{ recordCounts }}</h3>
                <div>
                    <h3 v-if="uploadedJson" id="fhirNewClient" style="color: blue">New Client: {{ fhirNewClient }}</h3>
                </div>
            </div>
            <div id="pdfFileDetails">
                <h3 v-if="numPages > 0">Page count: {{ numPages }}</h3>
                <button v-on:click="setPdf()" v-if="validatedPdf">Confirm Load PDF for Analysis</button>
            </div>

        </div>
        <!--1up explanation-->
        <!--<div id="1up">
            <p>the below link will route you to the 1up sandbox for the associated provider for your client</p>
            <a>_to be filled in_</a>
        </div>-->
        <!--1up links-->
        <!--1up link => consent page => data to express server => refresh the page in 5 seconds and check if the data's there-->
    </div>
</template>

<script>
import {mapState} from 'vuex'
import stringComparison from 'string-comparison'
//import { thresholdSturges } from 'd3';
//import * as pdf from 'pdfjs-dist'
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import '../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'
//const pdf = require("pdfjs/es5/build/pdf")

//pdf.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function similarNames(name1, name2) {
    return stringComparison.levenshtein.similarity(name1, name2) > .55;
}

export default {
    computed: {
        ...mapState({
            client: state => state.currentClient,
            oneUpClientId: state => state.oneUpClientId,
            clients: state => state.clients
        })
    },
    data: function() {
        return {
            uploadedJson: undefined, //for boolean checks, but type === {}
            fhirResourceType: "",
            successfulLoad: false,
            invalidFileType: false,
            detectedPatientName: "",
            numPages: 0,
            validatedFile: false,
            validatedPdf: false,
            pdf: undefined, //{}
            fhirNewClient: false
        }
    },
    methods: {
        refreshValidationFlow() {
            this.validatedFile = false;
            this.validatedPdf = false;
            this.uploadedJson = undefined; //{}
            this.successfulLoad = false;
            this.invalidFileType = false;
            this.detectedPatientName = "";
            this.numPages = 0;
            this.pdf = undefined; //{}
            this.fhirNewClient = false; //for FHIR flow only
        },
        checkIffhirNewClient(clientName) {
            //console.log(stringComparison.levenshtein.similarity("Aaron Brekke", "Aaron Brkke")); //~.9
            //console.log(stringComparison.levenshtein.similarity("Aaron435 Brekke50", "Aaron Brekke")); // ~.68
            let threshold = .65;
            let ind = this.clients.findIndex((client) => (stringComparison.levenshtein.similarity(client.name, clientName) > threshold));
            console.log(this.clients);
            console.log(ind);
            return { fhirNewClient: (ind < 0), oldClientIndex: ind };
        },
        async requestData(clientName) {
            let oneUpProviderId = "";
            switch (clientName) {
                case "Donna Dobson": {
                    //go to Veragidm
                    oneUpProviderId = 32;
                    break;
                }
                case "Wilma Smart": {
                    //Cerner
                    oneUpProviderId = 4707;
                    break;
                }
                case "Fhir Jason": {
                    //Epic
                    oneUpProviderId = 4706;
                    break;
                }
                case "BB User": {
                    //Medicare
                    oneUpProviderId = 4748;
                    break;
                }
                /*case "Adult Female" {
                    //eClincalWorks
                    //test environment unavailable per 1up https://docs.1up.health/help-center/Content/en-US/get-started/fhir-test-credentials.html
                }*/
            }
            const reqUrl = `https://api.1up.health/connect/system/clinical/${oneUpProviderId}?client_id=${this.oneUpClientId}&access_token=${this.oneUpAccessToken}`;
            await fetch(reqUrl);
        },
        getPatientNameFromPatientRec(pRec) {
            if (!pRec.resource.name) {
                return "";
            } else 
            //the name entry has cardinality 0..* https://www.hl7.org/fhir/patient.html
            //so account for possibility of array as well as single entry
            if (pRec.resource.name[0]) {
                return pRec.resource.name[0].given + " " + pRec.resource.name[0].family;
            } else { 
                return pRec.resource.name.given + " " + pRec.resource.name.family;
            }
        },
        getPatientNameFromBundle(bundle) {
            let patientRecs = bundle.entry.filter((obj) => obj.resource.resourceType.toLowerCase() === "patient");
            if (patientRecs.length > 1) {
                //check that patients have the same name
                const name = this.getPatientNameFromPatientRec(patientRecs[0]);
                patientRecs.forEach((pat) => {
                    var currName = this.getPatientNameFromPatientRec(pat);
                    if (!currName === name) {
                        if (similarNames(currName, name)) {
                            console.log("**Different name but similar");
                            //**should send to server logs
                        }
                        //check similarity & report differences
                        //**unit test this
                        throw new Error("different patient names within the same bundle: " + name + ", " + currName);
                    }
                })
                return name;
            } else if (patientRecs.length === 0) {
                throw new Error("no patient record found in bundle");
            } else {
                return this.getPatientNameFromPatientRec(patientRecs[0]);
            }
            //check list of clients for patient with that name or similar
        },
        getRecordTypesInBundle(bundle) {
            var recordTypes = [];
            var recordCounts = {}
            bundle.entry.map((obj) => {
                let typ = obj.resource.resourceType; 
                if (recordTypes.indexOf(typ) < 0) {
                    recordTypes.push(typ);
                    recordCounts[typ] = 1;
                } else {
                    recordCounts[typ] += 1;
                }
            });
            return {recordTypes, recordCounts};
        },
        async validatePdf() {

        },
        async readFile() {
            this.refreshValidationFlow();
            this.invalidFileType = false;
            let inputFile = document.querySelector("input").files[0];
            if (inputFile.type !== "application/pdf" && (inputFile.type !== "application/json")) {
                console.log("invalid file type - not PDF or JSON");
                console.log(inputFile.type);
                console.log(typeof(inputFile.type));
                this.invalidFileType = true;
                return;
            }

            if (inputFile.type === "application/json") {
                const fileReader = new FileReader();
                //https://developer.mozilla.org/en-US/docs/Web/API/FileReader/FileReader
                fileReader.onload = (evt) => {
                    console.log("file reader on load");
                    let text = evt.target.result;
                    if (inputFile.type === "application/json") {
                        let json = JSON.parse(text);
                        console.log(json.resourceType);
                        console.log(json);
                        if (json.resourceType) {
                            this.uploadedJson = json;
                            this.fhirResourceType = json.resourceType.toLowerCase();
                            if (this.fhirResourceType === "bundle") {
                                this.detectedPatientName = this.getPatientNameFromBundle(this.uploadedJson);
                                let fhirNewClientCheck = this.checkIffhirNewClient(this.detectedPatientName);
                                this.fhirNewClient = fhirNewClientCheck.fhirNewClient;
                                this.oldClient = this.clients[fhirNewClientCheck.oldClientIndex];
                                //this.newPatient = (this.$store.clients.filter((client) => client.name === this.detectedPatientName).length === 0);
                                this.numRecords = this.uploadedJson.entry.length;
                                let typeObj = this.getRecordTypesInBundle(this.uploadedJson);
                                this.recordTypes = typeObj.recordTypes;
                                this.recordCounts = typeObj.recordCounts;
                                this.validatedFile = true;
                                console.log(this.recordCounts);
                            }
                            //import('js-fhir-validator/r4/js/' + this.fhirResourceType.toLowerCase()).then(res => console.log(res));
                            //could dynamically import a validator function for each

                            //uploaded FHIR could be tested for:
                            //validity according to FHIR specs
                            //ability to analyze
                            //uniqueness of records from other records of same client
                        }
                    } 
                }
                try {
                    fileReader.readAsText(inputFile);
                    /*console.log(fileJson);
                    console.log("resource type");
                    console.log(fileJson.resourceType);*/
                } catch (err) {
                    console.log(err);
                }
            }
            else if (inputFile.type === "application/pdf") {
                const fileReader = new FileReader();
                const data= this;
                fileReader.onload = function(evt) {

                    const typedArr = new Uint8Array(evt.target.result);
                    let docPromise = getDocument(typedArr);
                    console.log(docPromise);
                    
                    docPromise.promise.then(doc => {
                        data.numPages = doc.numPages;
                        console.log(this);
                        console.log(data);
                        console.log("num pages: " + doc.numPages);
                        data.pdf = doc;
                        data.validatedPdf = true;
                        data.validatedFile = true;
                    })

                }

                fileReader.readAsArrayBuffer(inputFile);
                
            }
            
            //fileReader.readAsText(input);
        },
        async loadClient() {
            let loadedSuccessfully = await this.$store.dispatch('loadClientFromUpload', {data: this.uploadedJson, newClient: this.fhirNewClient});
            this.successfulLoad = loadedSuccessfully;
        },
        async setPdf() {
            let loadedSuccessfully = await this.$store.dispatch('loadPdfFromUpload', this.pdf);
            this.successfulLoad = loadedSuccessfully;
        },
        newClientForm() {
            this.newClient = true;
        }
    }
}
</script>

<style>
#fileInput {
    align-self: center;
}
</style>