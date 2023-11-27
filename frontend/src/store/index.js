import { createStore } from 'vuex'
//import fs from 'fs'
import testData from "../../data/AaronBrekke/Aaron697_Brekke496_2fa15bc7-8866-461a-9000-f739e425860a";
import {toRaw} from 'vue'


//const blueBookMusculoskeletalUrl = "./musculoskeletal.txt"
//****TODO retrieve local storage
//will get local storage
//but need to have server receive data
//local server? not for prod 

function nameString(resource) {
  let nameObj = resource.name[0];
  let name = "";
  if (nameObj.prefix) {
      name += nameObj.prefix + " " + nameObj.given + " " + nameObj.family;
  }
  return name;
}

function searchAllLeafsForStr(resource, str) {
  console.log(resource);
  console.log(str);
}

function getAllRefsWithinResource(resource) {
  //onsole.log("get al refs");
  let refs = [];
  if (typeof(resource) === "string") {
    if (resource.substring(0,4) === "urn:") {
      console.log("found urn");
      return [resource];
    }
    //console.log(refs);
    return refs;
  } else if (Array.isArray(resource)) {
    resource.forEach((el) => {
      refs = refs.concat(getAllRefsWithinResource(el));
    })
    return refs;
  } else if (typeof(resource) === "object") {
    //console.log("iterable");
    let arrNodes = Object.keys(resource).map((key) => resource[key]);
    if (arrNodes.length === 0) {
      console.log("arr nodes === 0");
      //console.log(arrNodes);
      return refs;
    } else {
      arrNodes.forEach((n) => {
        //console.log(n);
        refs = refs.concat(getAllRefsWithinResource(n));
      })
      //console.log("returning foreach refs");
      //console.log(refs);
      return refs;
    }
  } else {
    return refs;
  }
  //https://stackoverflow.com/questions/46576420/getting-leaf-values-from-any-kind-of-objects
    
  
  //need to go recursively
  //iterate thru all chilren
  //if array, foreach
  //if obj, iterate through keys
  //can use iterable?
  //if obj[key] === 
  //if first four letters === uurn
  //add to array
  //return array
}

function mapAllRefsInRecs(recs) {
  recs.map((rec) => rec['refs'] = getAllRefsWithinResource(rec));
  console.log(recs);
  let refRecs = recs.filter((el) => el.refs.length > 0);
  console.log("num of recs with refs: " + refRecs.length);
  let recsById = {};
  recs.map((rec) => recsById[rec.fullUrl] = rec.resource);
  recs.map((rec) => rec.refUrls = rec.refs);
  recs.map((rec) => rec.refs = rec.refs.filter((ref) => ref !== rec.fullUrl));
  recs.map((rec) => rec.refs = [... new Set(rec.refs)]);
  recs.map((rec) => rec.refs = rec.refs.map((ref) => recsById[ref]));
  return {recs, recsById};
}

/*function getPatientResourceFromBundle(bundle) {
  let patientRecs = bundle.entry.filter((obj) => obj.resource.resourceType.toLowerCase() === "patient");
  if (patientRecs[0]) {
    return patientRecs[0];
  } else if (!patientRecs || patientRecs.length === 0) {
    throw new Error("no patient record found");
  } else {
    return patientRecs; //assume that somehow this can happen
    //and that that means patientRecs actually has type record
    //(not real)
  }
}*/

function sortRecsIntoTypes(recs) {
  let claims = recs.filter((rec) => rec.resource.resourceType === "ExplanationOfBenefit");
  let providers = recs.filter((rec) => ["Provider", "Practitioner", "CareTeam"].indexOf(rec.resource.resourceType) >= 0);
  let organizations = recs.filter((rec) => rec.resource.resourceType === "Organization");
  let encounters = recs.filter((rec) => rec.resource.resourceType === "Encounter");
  let client = recs.filter((rec) => rec.resource.resourceType === "Patient")[0];
  client.name = nameString(client.resource);
  //**MAP ALL RELEVANT DATES FOR EACH TYPE SO CAN EASILY DISPLAY */
  //patient
  //condition
  //claims (not EoB)
  //observation
  //procedure
  //immunization
  //medicationrequest
  //careplan
  //diagnosticreport
  return {claims, providers, organizations, encounters, client}
}
  const prepositions = ["at", "the", "of", "on", "to", "but", "with", "a", "an", "in", "pt", "ord", "-", "13", "pn", "con", "de", "for", "nos", "and"];
  const medically_unspecific_words = ["terminology", "status", "part", "includes", "less", "first", "pathology", "primary", "type", "history", "general", "disease", "diseases", "human", "procedure", "addition", "additional", "code", "count"];

  function medicalConceptsToWords(medicalConcepts) {
    let uniqueMedicalConceptWordsCount = {};
    medicalConcepts.forEach((concept) => {
      let words = concept.name.split(/[\s,()/]+/).map((word) => word.toLowerCase());
      //filter out two letter words?? *IV*
      words = words.filter((word) => word.length > 2); 
      //filter out medically unspecific words
      words = words.filter((word) => medically_unspecific_words.indexOf(word) < 0);
      words = words.filter((word) => word.indexOf(":") < 0); //filter out phrases like "report:find:pt:bone:nar"
      console.log(words);
      //console.log("analyzing concept");
      //console.log(words);
      //creates a dictionary of every word in every concept
      words.forEach((word) => {
        //skip prepositions
        if (prepositions.indexOf(word) >= 0) {
          return;
        } else {
          if (!uniqueMedicalConceptWordsCount[word]) {
            uniqueMedicalConceptWordsCount[word] = 1;
          } else {
            //how many times does a word appear across
            //all related medical concepts from UMLS search
            //(rough estimate of word => concept area centrality)
            uniqueMedicalConceptWordsCount[word] += 1; 
          }
        }
        }
      )
    })
    let uniqueMedicalConceptsWords = Object.keys(uniqueMedicalConceptWordsCount);
    return {uniqueMedicalConceptWordsCount, uniqueMedicalConceptsWords};
  }

  function analyzeText(recordText, medicalConcepts) {
    let analysisObj = {};
    analysisObj.synonyms = medicalConcepts.map((concept) => {concept.name = concept.name.toLowerCase(); return concept});
    analysisObj.matches = {};
    let uniqueMedicalConceptWords = {};
    medicalConcepts.forEach((concept) => {
      let words = concept.name.split(/[\s,()/]+/).map((word) => word.toLowerCase());
      //filter out two letter words?? *IV*
      words = words.filter((word) => word.length > 2); 
      //filter out medically unspecific words
      words = words.filter((word) => medically_unspecific_words.indexOf(word) < 0);
      words = words.filter((word) => word.indexOf(":") < 0); //filter out phrases like "report:find:pt:bone:nar"
      console.log(words);
      //console.log("analyzing concept");
      //console.log(words);
      //creates a dictionary of every word in every concept
      words.forEach((word) => {
        //skip prepositions
        if (prepositions.indexOf(word) >= 0) {
          return;
        } else {
          if (!uniqueMedicalConceptWords[word]) {
            uniqueMedicalConceptWords[word] = 1;
          } else {
            //how many times does a word appear across
            //all related medical concepts from UMLS search
            //(rough estimate of word => concept area centrality)
            uniqueMedicalConceptWords[word] += 1; 
          }
        }
        //check if that concept word is in the claim text
        //if so, add to array of concepts for that word
        if (recordText.indexOf(word) >= 0) {
          console.log("found " + word);
          if (analysisObj.matches[word]) {
            console.log("old word");
            if (analysisObj.matches[word].indexOf(concept.name)===-1) {
              analysisObj.matches[word].push(concept);
            }
          } else {
            console.log("new word");
            analysisObj.matches[word] = [concept];
          }
        }
      })
    })
    //** could create aggregate search stats across all records combining results from individual record analysis
    analysisObj.uniqueMedicalConceptWordsCount = uniqueMedicalConceptWords;
    //the unique words will be the same for all records - move this to calling function of this function
    analysisObj.uniqueMedicalConceptsWords = Object.keys(uniqueMedicalConceptWords);
    console.log(uniqueMedicalConceptWords);
    console.log("analysis obj: ");
    console.log(analysisObj);
    return analysisObj;
  }

  //medicalConcepts: array of objects with
  //name, relationType, source, and uri
  function analyzeClaim(claim, medicalConcepts) {
    console.log("analyzeClaim: analyzing claim with medicalConcepts");
    //console.log(claim);
    //console.log(medicalConcepts);
    let allClaimText = "";// = claim.//.this + record.that + record. => ""
    if (claim.resource.item[0]) {
      claim.resource.item.forEach((item) => {
        allClaimText += item.productOrService.text + " ";
      })
    } else {
      allClaimText += claim.resource.item.productOrService.text;
    }
    allClaimText = allClaimText.toLowerCase();
    console.log("all claim text:");
    console.log(allClaimText);
    return analyzeText(allClaimText, medicalConcepts);
  }

  function analyzeRecord(record, medicalConcepts) {
    console.log("analyzeRecord: analyzing record with medicalConcepts");
    //console.log(claim);
    //console.log(medicalConcepts);
    let allRecText = JSON.stringify(record.resource).toLowerCase();
    console.log("all rec text:");
    console.log(allRecText);
    return analyzeText(allRecText, medicalConcepts);
  }

  

  async function searchUMLS(seedTerm, partialMatch=false) {
    const base_uri = "https://uts-ws.nlm.nih.gov/rest";
    const apiKey = "a984d90d-8b63-442a-b828-9464631fde4e";
    const apiKeyUrlParam = "&apiKey=" + apiKey;
    console.log("searching for seedterm: " + seedTerm);
    let url = base_uri + "/search/current?" + "string=" + encodeURIComponent(seedTerm)
              + apiKeyUrlParam;
    if (partialMatch) {
        url = url + "&partialSearch=true";
    }
    const res = await fetch(url);
    const json = await res.json();
    return json;
  }
/*function testClient(params) {
  this.name = params.name;
  this.dataSource = params.dataSource;
  //this.
}*/
/*
PDF NLP: 
- name detection
- date detection
- type of doc
*/
/** need to make the store abstract over different record types for client, 
 ** and then allow the ClientDataView to allow search over every type of record at once
 */
export default createStore({
  state: {
    repId: "",
    currentClient: {}, //**move all currents into current client */
    clientDataLoaded: false,
    clients: [{
        name: "Aaron Brekke",
        dataUrl: "../../data/AaronBrekke/Aaron697_Brekke496_2fa15bc7-8866-461a-9000-f739e425860a",
        localDataSaved: false,
        hasData: true
      }, {
        name: "Youlanda Hettinger",
        dataUrl: "../../data/YoulandaHettinger/Youlanda785_Hettinger594_7fe3fe78-f363-4c13-95ae-a05df266448a",
        localDataSaved: false,
        hasData: true
      }],
    availableClients: [], //**delete??
    oneUpClientId: "f987107a279a13583cc6feeb0e28ec0c",
    oneUpAccessToken: "",
    claims: [],
    records: [],
    providers: [],
    currentRecords: [],
    currentRecordsType: "all",
    //searchResults: [],
    umlsSearches: {}, //**maps search terms to search results
    searchingUMLS: false,
    currentSearchMedicalSynonyms: [],
    synonymsUniqueWords: [],
    pdf: {},
    pages: []
   //currentConditionHeader: "Musculoskeletal Disorders",
    //condHeaderConcepts: [],
     //match words, add matched words to record, color record if matchedWords
    /*sectionHeaders: ["Category of Impairments, Musculoskeletal", "Disorders of the skeletal spine resulting in compromise of a nerve root(s)",
  "Lumbar spinal stenosis resulting in compromise of the cauda equina ", "Reconstructive surgery or surgical arthrodesis of a major weight-bearing joint",
"Abnormality of a major joint(s) in any extremity", "Pathologic fractures due to any cause", "Amputation due to any cause", "Soft tissue injury or abnormality under continuing surgical management ",
"Non-healing or complex fracture of the femur, tibia, pelvis, or one or more of the talocrural bones ", "Non-healing or complex fracture of an upper extremity "],
*/
    //relevancyString: (currentConditionHeader + " " + sectionHeaders.join(" ")).toLowerCase() 
  },
  getters: {
    findProviderForEOB(state, eob) {
      let providerRef = eob.rsource.provider.reference;
      let providerResource = state.records.filter((rec) => rec.fullUrl === providerRef);
      if (providerResource) {
        console.log("found provider for EOB");
        console.log(providerResource);
      } else {
        console.log("could not find provider for EOB");
        console.log(providerRef);
      }
      return providerResource;
    },
    providerByRef: (state) => (providerRef) => {
      //let providerResource = state.records.filter((rec) => rec.fullUrl === providerRef);
      let providerResource = state.providers.filter((rec) => rec.fullUrl === providerRef);
      if (providerResource.length > 0) {
        console.log("found provider for EOB");
        console.log(providerResource);
        return providerResource[0];
      } else {
        console.log("could not find provider for EOB");
        console.log(providerRef);
      }
      return providerResource;
    },
    referencesToRec: (state) => (recUrl) => {
      return state.allRecords.filter((rec) => rec.refs.indexOf(recUrl) >= 0);
    }
    /*providersMap(state) {
      let pMap = {};
      state.providers.map((p) => {
        pMap[p.fullUrl] = p;
        pMap[p.fullUrl].organizationRef = state.encounters.filter((e) => {
          e.resource.participant[0].individual.reference === p.fullUrl
        })[0].resource.serviceProvider.reference;
        pMap[p.fullUrl].organization = state.organizations.filter((o) => o.fullUrl === pMap[p.fullUrl].organizationRef);
      });
      console.log(pMap);
      console.log(pMap);
      return pMap;
    }*/
    /*recordByUurn(state, uurn) {
      return 
    }*/
  },
  mutations: {
    addClient(state, client) {
      state.clients.push(client);
    },
    setClient(state, data) {
      if (!data.hasData) {
        return;
      } 
      if (data.hasData && data.dataUrl && !data.allRecords) {
        //load
      }
      console.log("setClient mutation with data: ");
      console.log(data);
      state.allRecords = data.allRecords;
      state.allRecordsById = data.allRecordsById;
      state.claims = data.claims;
      if (state.currentRecordsType === 'ExplanationOfBenefit') {
        state.currentRecords = state.claims;
      } else {
        state.currentRecords = state.allRecords;
      }
      state.currentRecords = state.currentRecords.map((rec, ind) => {rec.index = ind + 1; return rec});
      state.records = data.records;
     // state.records = state.records.map((rec, ind) => rec.ind = ind);
      state.providers = data.providers;
      state.encounters = data.encounters;
      state.organizations = data.organizations;
      state.currentRecordsType = 'all';
      //add refs to the provider's organization within the provider record
      state.providers.map((p) => {
        //console.log("new p " + p.fullUrl);
        let encounterMatch = state.encounters.filter((e) => {
          /*console.log("e");
          console.log(e);
          console.log(e.resource.participant[0].individual.reference);
          console.log(p.fullUrl);
          console.log(e.resource.participant[0].individual.reference === p.fullUrl);*/
          if (e.resource.participant) {
            return e.resource.participant[0].individual.reference === p.fullUrl
          } else {
            return false;
          }
          
        });
        //console.log("e");
        console.log(encounterMatch);
        //find an encounter with that provider, and then pull out the reference for that org
        if (encounterMatch && encounterMatch.length > 0) {
          console.log("encounter match");
          console.log(encounterMatch);
          p.encounters = encounterMatch;
          let pOrgRef = encounterMatch[0].resource.serviceProvider.reference;
          //let pOrgName = encounterMatch.resource.serviceProvider.name;
          if (pOrgRef) {
            console.log("found org for provider");
            p.organizationRef = pOrgRef;
            p.organization = state.organizations.filter((o) => o.fullUrl === p.organizationRef);
            if (p.organization[0]) {
              p.organization = p.organization[0];
            }
          }
          /*if (pOrg) {
            console.log("found org for provider");
            p.organizationRef = pOrg.resource.serviceProvider.reference;
            p.organization = state.organizations.filter((o) => o.fullUrl === p.organizationRef);
            console.log(p.organization);
          }*/
        }
        
      });
    },
    setClients(state, clients) {
      state.clients = clients
    },
    setCurrentRecords(state, {recs, recsType}) {
      state.currentRecordsType = recsType;
      state.currentRecords = recs;
    },
    setPdf(state, {pdf, pages}) {
      state.pdf = pdf;
      state.pages = pages;
      state.currentRecords = state.pages;
      console.log("setPdf pages: ");
      console.log(state.pages);
      state.currentRecordsType = "pdf";
    },
    sortBy(state, params) {
      console.log("sortBy");
      console.log(params);
      let toSort = params.toSort;
      console.log('to sort: ' + toSort);
      let sortVar = params.sortVar;
      const sortVarPaths = { //ideally derived dynamically
        'claims': {
          'provider': ['resource', 'provider', 'reference'],
          'date': ['resource', 'item', 'servicedPeriod', 'start']
        },
        'allRecords': {
          'resourceType': ['resource', 'resourceType']
        }
      }//params.sortVarPath;
      let sortVarPath = sortVarPaths[toSort][sortVar];
      function getVarFromObj(obj, varPath) {
        //let v = undefined;
        return varPath.reduce((acc, o, index) => {
          //console.log(acc);
          //console.log(index);
          if (Array.isArray(acc[varPath[index]])) {
            return acc[varPath[index]][0]
          } else {
            return acc[varPath[index]]
          }
        }, obj)
      }
      //test sortBy
      console.log("sort by test: " + (getVarFromObj({'fruit': {
        'name': 'banana'
          }
        }, ['fruit', 'name']) === 'banana'));
      //let theVar = toSort.reduce((acc, el, index) => el[sortVarPath[index]]);
      function varCompare(a, b, sortVarPath) {
        let aVar = getVarFromObj(a, sortVarPath);
        let bVar = getVarFromObj(b, sortVarPath);
        if (aVar < bVar) {
          return -1
        } else if (aVar > bVar) {
          return 1
        } else {
          return 0
        }
      }
      state[toSort] = state[toSort].toSorted((a,b) => varCompare(a,b,sortVarPath));
      state.currentRecords = state[toSort];
      console.log("sorted: ");
      console.log(state[toSort].map((el) => getVarFromObj(el, sortVarPath)));
      /*switch (param) {
        case 'provider':
          //get provider path from each claim
          state.claims = state.claims.sort((a,b) => varCompare(a,b,sortVarPath));
          break;
        case 'date':
          state.claims = state.claims.sort((a,b) => varCompare(a,b,sortVarPath));
          break;
      }*/
    },
    reverse(state, toReverse) {
      state[toReverse] = state[toReverse].reverse();
    },
    dismissSearch(state) {
      //console.log(state.currentRecordsNoSearch);
      //state.currentRecords = state.currentRecordsNoSearch;
      if (state.currentRecordsType === 'all') {
        state.currentRecords = state.allRecords;
      } else if (state.currentRecordsType === "ExplanationOfBenefits") {
        state.currentRecords = state.claims;
      } else if (state.currentRecordsType === "pdf") {
        state.currentRecords = state.pages;
      }
      state.searchingUMLS = false;
      state.synonymsUniqueWords = [];
    },
    searchCurrentRecords(state, {searchStr, currRecType}) {
      state.currentRecordsType = currRecType;
      let searchStrL = searchStr.toLowerCase();
      console.log("searching for " + searchStr);
      console.log(state.currentRecords);
      console.log(state.currentRecords.length);
      /*if (state.currentRecords[0].resource.resourceType === "ExplanationOfBenefits") {
        state.currentRecords = state.currentRecords.filter((rec) => {
          if (rec.resource.item[0]) {
            console.log("multiple items");
            let matches = rec.resource.item.filter((it) => {
              return (it.productOrService.text.toLowerCase().indexOf(searchStrL) >= 0)
            });
            if (matches.length > 0) {
              console.log("match");
              return true;
            } else {
              return false;
            }
          } else {
            console.log("single item");
            console.log(rec.resource.item);
          }
        })
      }*/
      //for each node
      //if its value has indexof search Str
      //store both the match and node path => display the property and its match in UI
      state.currentRecordsNoSearch = state.currentRecords;
      state.currentRecords = state.currentRecords.filter((rec) => {
        return (JSON.stringify(rec).toLowerCase().indexOf(searchStrL) >= 0)
      });
      searchAllLeafsForStr(state.currentRecords[0], searchStr);
      console.log(state.currentRecords.length);
      
    },
    setSearchingUmlsStatus(state, stat) {
      state.searchingUMLS = stat;
    },
    //also filters out records that match
    setSynonyms(state, results) {
      console.log("UMLS search results given in setSynonyms: ");
      console.log(results);
      state.currentSearchMedicalSynonyms = results.synonyms;
      state.synonymsUniqueWords = medicalConceptsToWords(results.synonyms).uniqueMedicalConceptsWords;
      console.log("synonyms");
      console.log(state.currentSearchMedicalSynonyms);
      console.log("current recs");
      console.log(state.currentRecords); //why does arr have len 0 for allRecords currentRecords
      
      //set the search results
      state.currentRecords = state.currentRecords.filter((rec) => {
        var res = {};
        if (state.currentRecordsType === "ExplanationOfBenefit") {
          res = analyzeClaim(rec, results.synonyms);
        } else if (state.currentRecordsType === "all") {
          res = analyzeRecord(rec, results.synonyms);
        } else if (state.currentRecordsType === "pdf") {
          res = analyzeText(rec, results.synonyms);
        }
        console.log(res);

        //**can set the number of matches threshold for a search result
        let filteredMatches = Object.keys(res.matches).filter((key) => {
          return res.matches[key].length >= 1;
        }); //attempt at language preposition filter (e.g. 'y' or 'con')
        if (filteredMatches.length > 0) {
          console.log("Record " + rec.index + " passes filtered matches: ");
          console.log(filteredMatches);
        }
        return (filteredMatches.length > 0);
      });

    }
    /*findRelevancyForCurrentCondition(state) {
      
    }*/
  },
  actions: {
   /*async getAccessTokenOneUp() {
      const authUrl = `https://auth.1updemohealthplan.com/oauth2/authorize/test?client_id=${this.oneUpClientId}&scope=user/*.read&redirect_uri=${redirect_uri}`
    },*/
    async getMedicalSynonyms({commit}, seedTerm) {
      commit('setSearchingUmlsStatus', true);
      console.log("getting syn with seed term: " + seedTerm);
      //should either only get the synonyms or search and change the name
      const apiKey = "a984d90d-8b63-442a-b828-9464631fde4e";
      const apiKeyUrlParam = "?apiKey=" + apiKey;
      let analysisObj = {
        seedTerm,
        synonyms: [{name: seedTerm}]
      }
      let baseConceptResults = await searchUMLS(seedTerm);
      if (baseConceptResults.result.results.length > 0) {
        //get the first concept from the results list of concepts
        let conceptReq = baseConceptResults.result.results[0].uri + apiKeyUrlParam;
        //console.log("requesting concept uri " +conceptReq);
        let conceptRes = await fetch(conceptReq);
        let conceptJson = await conceptRes.json();
        console.log("got results for concept search: ");
        console.log(conceptJson);
        baseConceptResults.result.results[0].data = conceptJson;
        analysisObj.umlsConcept = conceptJson.result.name.toLowerCase();
        console.log("found concept: " + conceptJson.result.name);
        analysisObj.exactMatch = analysisObj.seedTerm === analysisObj.umlsConcept;

        if (conceptJson.result.relationCount > 0) {
          console.log("found related concepts");
          let relReq = conceptJson.result.relations + apiKeyUrlParam;
          let relRes = await fetch(relReq);
          let relJson = await relRes.json();
          baseConceptResults.result.results[0].data.result.relRes = relJson;
          console.log("res res");
          console.log(relJson);
          let cleanRel = relJson.result.map((el) => {
              let cleanEl = {};
              if (el.additionalRelationLabel !== "") {
                  cleanEl.relationType = el.additionalRelationLabel;
              } else {
                  cleanEl.relationType = el.relationLabel;
              }
              cleanEl.name = el.relatedIdName;
              cleanEl.source = el.rootSource;
              cleanEl.uri = el.relatedId;
              return cleanEl;
          });
          baseConceptResults.result.results[0].data.result.cleanRel = cleanRel;
          analysisObj.synonyms = analysisObj.synonyms.concat(cleanRel);

        } else {
          console.log("concept has no related concepts, using original search results");
          baseConceptResults = await searchUMLS(seedTerm, true);
          //needs data cleaning
          analysisObj.synonyms = analysisObj.synonyms.concat(baseConceptResults.result.results);
        }
        //create an array of all unique words ?
        commit('setSynonyms', analysisObj);
        commit('setSearchingUmlsStatus', false);
      } else {
        console.log("COULD NOT FIND ANY CONCEPT WITH THIS SEED TERM");
        commit('setSearchingUmlsStatus', false);
      }
  },
    /*async fetchBlueBookTestCond({commit}) {
      
    },*/
    /*async fetch1upSandbox({commit}) {
      function criteriaTag(data) {
        this.matchPhrase = data.matchPhrase;
        this.sourceBlueBookText = data.sourceBlueBookText;
        this.blueBookEvidenceType = data.blueBookEvidenceType;
        // exactMatch | exactMatchTo
        this.relationshipToBlueBookText = data.relationshipToBlueBookText;
        this.sourceBlueBookRelationshipPath = data.sourceBlueBookRelationshipPath;
        this.parentResource = data.parentResource;
      }
      function TestClient(data) {
        this.name = data.name;
        this.username = data.username;
        this.pw = data.pw;
        this.knownProviders = [];
        this.providersAccessed = [];
        this.relevantRecords = [];
        this.analytics = {};
      }
      const donna = new TestClient({
        name: "Donna Dobson",
        username: "donna.dobson_prounityfhir",
        pw: "Allscripts#1",

      })
      const testUsers = [];
      const testUser = "";
    },*/
    /*async loadDataFromServer({state, commit}) {
      //get bluebook condition text
      //get local test patient data
      //
    },*/
    //checks whether or not the app has saved medical records for an array of clients
    async checkClientsStatus({state, commit}) {
      const clientsToCheck = state.clients.filter((client) => client.status === "awaitingData")
                              .map((client) => client.id);
      const clientStatusUrl = "sandbox.claimant.us/" + state.repId + "/" + clientsToCheck;
      const statusResults = await fetch(clientStatusUrl);
      const statJson = await statusResults.json();
      console.log(statJson);
      //const clientsStats = statJson.
      //const updatedClients = 
      commit('setClients', state.clients);
    },
    async checkClientStatus(clientId) {
      const patientId = clientId;
      const reqUrl = `https://api.1up.health/r4/Patient/${patientId}/$everything`;
      //attach header
      const res = await fetch(reqUrl);
      return res;
    },
    async loadTestClientFrom1up(/*{state, commit},*/) {
      console.log("1up test client req flow");
      //let name = patientName;
      const reqParams = {
        client_id: "f987107a279a13583cc6feeb0e28ec0c",
        redirect_uri: "http://localhost:8080"
      };
      let paramStr = "?"; //convert params object to query string parameters
      Object.keys(reqParams).map((key) => paramStr+= key + "=" + reqParams[key] + "&");

      /*let oauthUrl = "https://auth.1updemohealthplan.com/oauth2/authorize/test";
      let authCodeRes = await fetch(oauthUrl + paramStr);
      console.log(authCodeRes);
      //get access token*/
      //make FHIR server request with content=name
      //load it and return ok
      //in the vue, route to data vue
    },
    async loadTestClientFromDisk({state, commit, dispatch}) {
      //let filename = "Aaron697_Brekke496_2fa15bc7-8866-461a-9000-f739e425860a.json";
      //let res = await fs.readFile('../../data/' + name + "/" + filename);
      console.log("test data");
      console.log(testData);
      let recs = await testData.entry;
      let mappedRecs = mapAllRefsInRecs(recs);
      recs = mappedRecs.recs;
      let recsById = mappedRecs.recsById;
      console.log("read client data");
      console.log(recs);
      console.log("recs by id: ");
      console.log(recsById);
      //console.log(res);
      //let client = recs.filter((rec) => rec.resource.resourceType === "Patient")[0];
      //console.log("client");
      //console.log(client);
      let typedRecs = sortRecsIntoTypes(recs);
      //make an array of all resource types (non-repeating)
      //make a dict where they're all sorted into their resource type
      let currentClient = {
        name: nameString(typedRecs.client.resource),
        allRecords: recs,
        allRecordsById: recsById,
        ...typedRecs,
        hasData: true
      };
      commit('setClient', {
        ...currentClient,
        currentClient
      });

      console.log(state.claims);
      console.log(state.records);
      console.log(state.providers);

      dispatch('loadTestClientFrom1up');
    },
    async loadClientDataFromServer({commit}, client) {
      const serverUrl = "sandbox.claimant.us";
      const requestUrl = serverUrl + "/client?loc=" + encodeURIComponent(client.dataUrl);
      console.log("requesting client data from server: " + requestUrl);
      let serverResp = await fetch(requestUrl);
      console.log(serverResp);
      let clientWithData = {};
      commit('setClient', clientWithData);
    },
    async loadClientDataFromLocalStorage({commit}, client) {
      commit('setClient', client);
    },
    async loadClientFromUpload({commit}, {data, newClient}) {
      let recs = await data.entry;
      let mappedRecs = mapAllRefsInRecs(recs);
      recs = mappedRecs.recs;
      let recsById = mappedRecs.recsById;
      let typedRecs = sortRecsIntoTypes(recs);
      let name = typedRecs.client.name;
      let currentClient = {
          name,
          allRecords: recs,
          allRecordsById: recsById,
          ...typedRecs,
          hasData: true
      };
      if (newClient) {
        commit('addClient', {
          ...currentClient,
          currentClient
        })
      }
      try {
        commit('setClient', currentClient);
        return true;
      } catch (err) {
        console.log("could not setClient with loaded JSON");
        console.log(err);
        return false;
      }
    },
    async loadPdfFromUpload({commit}, pdf) {
      //parse pages
      let pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        //https://github.com/mozilla/pdf.js/blob/master/examples/node/getinfo.mjs
        //https://stackoverflow.com/questions/72738037/can-you-store-and-use-pdfdocumentproxy-pdfpageproxy-objects-from-pdf-js-as-mem
        let pg = await toRaw(pdf).getPage(i);
        //const viewport = pg.getViewport({scale: 1.0});
        let txt = await pg.getTextContent();
        let str = txt.items.map((item) => item.str)
                  .join(" ")
                  .replace(/ {2}/, " ");
        pages.push(str);
        pg.cleanup();
        /*toRaw(pdf).getPage(i).then(function (page) {
          console.log("# Page " + i);
          const viewport = page.getViewport({ scale: 1.0 });
          console.log("Size: " + viewport.width + "x" + viewport.height);
          console.log();
          page
            .getTextContent()
            .then(function (content) {
              // Content contains lots of information about the text layout and
              // styles, but we need only strings at the moment
              const strings = content.items.map(function (item) {
                return item.str;
              });
              console.log("## Text Content");
              //console.log(strings);
              console.log(strings.join(" "));
              let pageStr = strings.join(" ").replace(/ {2}/, " "); //replace 2 spaces with one
              //**need tokenization preprocess to fix spaces within words e.g. "3 rd"
              pages.push(pageStr);
              // Release page resources.
              page.cleanup();
            })
            .then(function () {
              console.log();
            });
        });*/
      } 
      try {
        commit('setPdf', {pdf, pages});
        return true;
      } catch (err) {
        return false;
      }
      
    }
  },
  modules: {
  }
})
