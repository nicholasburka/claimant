import { createStore } from 'vuex'
//import fs from 'fs'
import testData from "../../data/AaronBrekke/Aaron697_Brekke496_2fa15bc7-8866-461a-9000-f739e425860a";

function nameString(resource) {
  let nameObj = resource.name[0];
  let name = "";
  if (nameObj.prefix) {
      name += nameObj.prefix + " " + nameObj.given + " " + nameObj.family;
  }
  return name;
}

export default createStore({
  state: {
    currentClient: "",
    clientDataLoaded: false,
    claims: [],
    records: [],
    providers: []
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
    setClient(state, data) {
      state.currentClient = data.currentClient;
      state.allRecords = data.allRecords;
      state.allRecordsById = data.allRecordsById;
      state.claims = data.claims;
      state.records = data.records;
      state.providers = data.providers;
      state.encounters = data.encounters;
      state.client = data.client;
      state.organizations = data.organizations;
      //add refs to the provider's organization within the provider record
      state.providers.map((p) => {
        //console.log("new p " + p.fullUrl);
        let encounterMatch = state.encounters.filter((e) => {
          console.log("e");
          console.log(e);
          console.log(e.resource.participant[0].individual.reference);
          console.log(p.fullUrl);
          console.log(e.resource.participant[0].individual.reference === p.fullUrl);
          return e.resource.participant[0].individual.reference === p.fullUrl
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
    }
  },
  actions: {
    async loadTestClientFromDisk({state, commit}) {
      let name = "AaronBrekke";
      //let filename = "Aaron697_Brekke496_2fa15bc7-8866-461a-9000-f739e425860a.json";
      //let res = await fs.readFile('../../data/' + name + "/" + filename);
      console.log("test data");
      console.log(testData);
      let recs = await testData.entry;
      let recsById = {};
      recs.map((rec) => recsById[rec.fullUrl] = rec.resource);
      console.log("read client data");
      console.log(recs);
      console.log("recs by id: ");
      console.log(recsById);
      //console.log(res);
      let client = recs.filter((rec) => rec.resource.resourceType === "Patient")[0];
      console.log("client");
      console.log(client);
      //make an array of all resource types (non-repeating)
      //make a dict where they're all sorted into their resource type
      commit('setClient', {
        name,
        allRecords: recs,
        allRecordsById: recsById,
        client,
        currentClient: nameString(client.resource),
        claims: recs.filter((rec) => rec.resource.resourceType === "ExplanationOfBenefit"),
        providers: recs.filter((rec) => ["Provider", "Practitioner", "CareTeam"].indexOf(rec.resource.resourceType) >= 0),
        organizations: recs.filter((rec) => rec.resource.resourceType === "Organization"),
        encounters: recs.filter((rec) => rec.resource.resourceType === "Encounter"),
        records: recs.filter((rec) => ["ExplanationOfBenefit", "Provider", "Practitioner", "Organization", "CareTeam", "Encounter"].indexOf(rec.resource.resourceType) === -1)
      });

      console.log(state.claims);
      console.log(state.records);
      console.log(state.providers);
    }
  },
  modules: {
  }
})
