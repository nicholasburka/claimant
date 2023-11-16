<template>
    
    <div id="container" class="column">
        <div id="client-name">
            <h3 style="margin-bottom: 0">Client: {{ currentClient }}</h3>
            <span style="position: absolute;margin-top: 0; align-text: left; left: 0px;">Num Explanation of Benefits: {{ claims.length }}</span>
        </div>
        <div id="json-popup" class="inactive">
            <code id="json-container"></code>
            <span v-on:click="hideJson()" style="font-size: 24px">X</span>
        </div>
        <div class="row buttons" style="margin-top: 2vh;">
            <span v-on:click="sortByProvider()">sort by provider&nbsp;&nbsp;&nbsp;</span>
            <span v-on:click="sortByDate()">sort by date&nbsp;&nbsp;&nbsp;</span>
            <span v-on:click="reverseClaims()">reverse list</span>
            <input type="text" v-model="search" @keyup.enter="submitSearch(search)"/>
            <button v-on:click="submitSearch(search)">Search</button>
            <button v-on:click="dismissSearch()">Dismiss</button>
            <input type="checkbox" v-model="useUMLS"/>Search with medical synonyms
            <span v-if="searchingUMLS"></span>
        </div>
        <br>
        <div id="all-recs" class="row">
            <div id="claims" class="claims column">
                <div class="claim row" :key="claim" v-for="claim in currentRecords" :id="claim.fullUrl">
                    <div><span v-on:click.self="this.showEob(claim)">EoB {{ claim.index }}: </span>
                        <span v-if="claim.resource.item[0]" v-on:click.self="this.showEob(claim)">{{ claim.resource.item[0].servicedPeriod.start }}</span>
                        <span v-else v-on:click.self="this.showEob(claim)">{{ " " + claim.resource.item.servicedPeriod.start  +", "}}</span>
                        <span class="provider" v-on:click="showProvider(claim.resource.provider.reference)">{{ " " + this.getProvider(claim.resource.provider.reference) + ", "}}</span>
                        <div :id="claim.fullUrl + service" class="service" v-on:click.self="this.showEob(claim)">
                            <div v-if="claim.resource.item[0]">
                                <span style="color:purple" v-on:click.self="this.showEob(claim)">Products/Services claimed: </span>
                                <span v-for="item in claim.resource.item" :key="item" v-on:click.self="this.showEob(claim)">
                                    {{ item.productOrService.text + ", "}}
                                </span>
                            </div>
                            <span v-else v-on:click.self="this.showEob(claim)">{{ claim.resource.item.productOrService.text }}</span>
                        </div>
                        <!--<span style="font-size:5px" :key="item" v-for="item in claim.resource.item">{{ item.servicedPeriod.start + "   "}}</span>-->
                        <!--<code :id="claim.fullUrl + 'json'" class="inactive">{{JSON.stringify(claim)}}</code>
                        -->
                    </div>
                </div>
            </div>
            <!--<div v-if="relatedRecords[0]">
            <div id="related-records"  class="column">
                <div v-for="re in relatedRecords" :key="re">
                    <div v-on:click="displayRecord(re)">
                        {{ re.resourceType }}
                    </div>
                </div>
            </div>
        </div>-->

            <div id="related-records" class="column">
                <div v-if="currentClaim.refs">
                    <br>Found associated records:
                    <ul v-on:click="showRecord(record)" class="record" :key="record" v-for="record in currentClaim.refs" :id="record">
                        <li>
                            <div v-if="record.resourceType === 'ExplanationOfBenefit'"><span style="color: green">EOB</span></div>
                            <div v-else-if="record.resourceType === 'Encounter'"><span style="color: blue">Encounter</span></div>
                            <div v-else><span>{{ record.resourceType }}</span></div>
                        </li>
                        
                        <!--                    
                            //on click, display the json object
                            //on click when dropdown === active, remove the active class
                        -->
                    </ul>
                </div>
            </div>
        </div>
        
    </div>
    
    
    
</template>

<script>
import {mapState} from 'vuex'
import jsonview from '@pgrabovets/json-view'
import d3 from 'd3'
//import Vue from 'vue'


export default {
    computed: {
        ...mapState({
            currentClient: state => state.currentClient,
            clientDataLoaded: state => state.clientDataLoaded,
            claims: state => state.claims,
            records: state => state.records, //miscRecords - exclusive from other categories
            providers: state => state.providers,
            allRecords: state => state.allRecords,
            allRecordsById: state => state.allRecordsById,
            currentRecords: state => state.currentRecords,
            searchingUMLS: state => state.searchingUMLS,
            medicalSynonyms: state => state.currentSearchMedicalSynonyms
        })
    },
    data: function() {
        return {
            sortBy: "date", //or "provider"
            displayType: "claims", //or "records" or "all"
            currentClaimUrl: "",
            relatedRecords: [],
            currentClaim: {},
            medicalSynonyms: []
            //currentRecords: claims
        }
    },
    watch: {
        claims(newC, oldC) {
            console.log("change in claims: " );
            console.log(newC);
            console.log(oldC);
        }
    },
    methods: {
        //unused
        toggleJsonDisplay(claim, node) {
            console.log("toggle json click");
            console.log(claim);
            console.log(claim.resource)
            console.log(claim.fullUrl);
            let claimNode = document.getElementById(claim.fullUrl + "json");
            claimNode.classList.contains("active") ? claimNode.classList.replace("active", "inactive") 
                                                    : claimNode.classList.replace("inactive", "active");
            //document.getElementById("json-container").innerText = JSON.stringify(claim, " ", 1);
            console.log(node);
        },
        jsonTree(data, claim=true) {
            if (claim) {
                let lastNode = document.getElementById(this.currentClaimUrl);
                lastNode ? lastNode.style.color = "black" : undefined;
                lastNode ? lastNode.style.backgroundColor = "white" : undefined;
                this.currentClaimUrl = data.fullUrl;
                let docEl =  document.getElementById(this.currentClaimUrl)
                if(docEl) {
                docEl.style.color = "red"; 
                docEl.style.backgroundColor = "gray"; 
                }
            }
            
            //jsonview.destroy
            document.querySelector('#json-container').innerHTML = '';
            let tree = undefined;
            if(data.resource && (!data.organization) && (!data.refs)) {
                tree = jsonview.create(data.resource); //https://github.com/pgrabovets/json-view
                jsonview.render(tree, document.querySelector('#json-container'));
                jsonview.expand(tree);
                let t2 = d3.tree(data.resource);
                console.log("trying d3");
                console.log(t2);
            } else {
                tree = jsonview.create(data);
                jsonview.render(tree, document.querySelector('#json-container'));
                jsonview.toggleNode(tree);
            }
            
            let relTree = jsonview.create(this.allRecsThatReferenceId(data.fullUrl)); //https://github.com/pgrabovets/json-view
            jsonview.render(relTree, document.querySelector('#json-container'));
            
            document.getElementById('json-popup').classList.replace('inactive', 'active');
        },
        hideJson() {
            document.getElementById('json-popup').classList.replace('active', 'inactive');
            //let lastNode = document.getElementById(this.currentClaimUrl);
            //lastNode ? lastNode.style.color = "black" : undefined;
        },
        providerNameString(providerResource) {
            let provNameObj = providerResource.name[0];
            let provOrg = providerResource.organization;
            let name = "";
            if (provNameObj.prefix) {
                name += provNameObj.prefix + " " + provNameObj.given + " " + provNameObj.family;
            }
            if (provOrg) {
                name += provOrg;
            }
            return name;
        },
        allRecsThatReferenceId(fullUrl) {
            console.log(this.allRecords);
            let res = this.allRecords.filter((r) => r.fullUrl !== fullUrl &&
                                                    JSON.stringify(r, null, 2).indexOf(fullUrl) >= 0);
            console.log("found " + res.length + " recs that ref this url");
            return res;
        },
        allRecsReferenced(rec) {
            console.log(rec);
            //can manually go thru claims and select each of the relevant parts
            //and then just use these to display
            //get an array of all the urls in the rec
            //let recUrls = this.allRecords.filter((r) => //)
            //for each url, get the record that matches
            //return
        },
        showEob(eob) {
            this.jsonTree(eob);
            this.currentClaim = eob;
            this.relatedRecords = eob.refs;
            //**this.relatedRecords = 
        },
        showRecord(rec) {
            this.jsonTree(rec, false);
        },
        getProvider(ref) {
            //console.log(claim);
            //console.log('get provider');
            //console.log(this.$store);
            //console.log(this.providers);
            //console.log(this.providers.filter((p) => p.fullUrl === ref)[0]);
            return this.providerNameString(this.providers.filter((p) => p.fullUrl === ref)[0].resource);
            //return this.$store.getters.providersMap[ref];
            //return this.$store.getters.providerByRef(ref);
        },
        showProvider(ref) {
            console.log(ref);
            console.log(this.$store.state);
            console.log(this.$store.state.allRecordsById);
            console.log(this.$store.state.allRecordsById[ref]);
            console.log(this.$store.getters.providerByRef(ref));
            this.jsonTree(this.$store.getters.providerByRef(ref));
        },
        sortByProvider() {
            this.$store.commit('sortBy', {toSort: 'claims', sortVar: 'provider'});
            //window.location.reload();
            console.log('sorted by provider');
            console.log(this.claims);
        },
        sortByDate() {
            this.$store.commit('sortBy', {toSort: 'claims', sortVar: 'date'});
            //window.location.reload();
        },
        reverseClaims() {
            this.$store.commit('reverse', 'claims');
        },
        dismissSearch() {
            this.$store.commit('dismissSearch');
            this.search = "";
            this.searching = false;
        },
        async submitSearch(search) {
            let currSearch = this.search;
            this.dismissSearch();
            this.search = currSearch;
            //show only claims for which 
            console.log(search);
            //this.currentRecords = this.claims[0];
            if (this.useUMLS) {
                console.log("using umls to search");
                await this.$store.dispatch('getMedicalSynonyms', this.search);
                //this.$store.commit('searchWithUMLSCurrentRecords', search);
            } else {
                this.$store.commit('searchCurrentRecords', search);
                this.searching = true;
                this.currentClaim = {};
            }
        },
    },
    created() {
        this.$store.dispatch('loadTestClientFromDisk');
        //jsonview.renderJSON({}, document.querySelector('#json-container'));
    },
    updated() {
        console.log("update");
    }
}
</script>

<style>
html {
    overflow-y: -moz-scrollbars-vertical; 
}
.column {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}
.row {
  display: flex;
  flex-direction: row;
  /*justify-content: space-around;*/
}
.claim {
    text-align: left;
    left: 0px;
    justify-content: left !important;
    flex: 1;
    display: flex;
}
.claim:hover {
    color: lightblue;
}
.provider {
    color: green;
}
.provider:hover {
    color: lightgreen;
}
.buttons span {
    border-radius: 10px;
    border:rgb(0, 0, 0);
    border-style:solid;
    text-align: center;
    justify-content: center;
    align-items: center;
    align-self: center;
}
#claims {
    display: flex;
    padding-top: 0vw;/*calc(30vw + 10vh);*/
    font-size: 2vw;
    max-height: 60vh;
    min-height: min-content;
    width: 70vw;
    overflow: auto;
}
#related-records {
    max-height: 60vh;
    width: 30vw;
    left: 60vw;
}
#records {
    max-height: 60vh;
    width: 50vw;
    overflow-y: scroll;
}
code {
    width: 100vw;
}
.inactive {
    display: none;
}
.active {
    display: flex;
}
#client-name {
    position: absolute;
    top: 5vh;
}
#json-popup {
    position: absolute;
    left: 30vw;
    top: 20vh;
    max-width: 50vw;
    z-index: 10;
    background-color: rgb(207, 255, 134) !important;
    /*background-color: hsla(115, 50%, 55%, 0.5);*/
}
#json-popup .active {
    display:flex;
}
#json-popup .inactive {
    display: hidden;
}
#json-container {
    justify-content: flex-start;
    text-align: left;
    display: flex;
    font-size: 7em !important;
    max-height: 60vh;
    overflow-y: scroll;
    /*background-color: hsla(258, 67%, 82%, 0.5) !important;*/
}
.json-container {
    background-color: rgb(207, 255, 134) !important;
    /*background-color: hsla(274, 90%, 72%, 1) !important;*/
    color: black;
}
.json-container .json-string {
    background-color: rgb(207, 255, 134) !important;
    /*background-color: hsla(274, 90%, 72%, 1) !important;*/
    color: rgb(43, 0, 255);
}
.json-container .json-number {
    color: rgb(255, 21, 0);
}
.service {
    font-size: 1.5vw;
}
</style>