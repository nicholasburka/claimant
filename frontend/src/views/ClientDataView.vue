<template>
    
    <div id="container" class="column">
        <div id="client-name">
            <h3>Client: {{ currentClient }}</h3>
        </div>
        <div id="json-popup" class="inactive">
            <code id="json-container"></code>
            <span v-on:click="hideJson()" style="font-size: 24px">X</span>
        </div>
        <div class="row buttons" style="">
            <span v-on:click="sortByProvider()">sort by provider&nbsp;&nbsp;&nbsp;</span>
            <span v-on:click="sortByDate()">sort by date&nbsp;&nbsp;&nbsp;</span>
            <span v-on:click="reverseClaims()">reverse list</span>
        </div>
        <br>
        <div id="claims" class="claims column">
            <div class="claim row" :key="claim" v-for="claim in claims" :id="claim.fullUrl">
                <div><span v-on:click.self="this.jsonTree(claim)">EoB: </span>
                    <span v-if="claim.resource.item[0]" v-on:click.self="this.jsonTree(claim)">{{ claim.resource.item[0].servicedPeriod.start }}</span>
                    <span v-else v-on:click.self="this.jsonTree(claim)">{{ " " + claim.resource.item.servicedPeriod.start  +", "}}</span>
                    <span v-on:click="showProvider(claim.resource.provider.reference)">{{ " " + this.getProvider(claim.resource.provider.reference) + ", "}}</span>
                    <div :id="claim.fullUrl + service" class="service" v-on:click.self="this.jsonTree(claim)">
                        <div v-if="claim.resource.item[0]">
                            <span v-for="item in claim.resource.item" :key="item">
                                {{ item.productOrService.text + ", "}}
                            </span>
                        </div>
                        <span v-else v-on:click.self="this.jsonTree(claim)">{{ claim.resource.item.productOrService.text }}</span>
                    </div>
                    <!--<span style="font-size:5px" :key="item" v-for="item in claim.resource.item">{{ item.servicedPeriod.start + "   "}}</span>-->
                    <!--<code :id="claim.fullUrl + 'json'" class="inactive">{{JSON.stringify(claim)}}</code>
                    -->
                </div>
            </div>
        </div>

        <!----<div id="records" class="column">
            <div class="record" :key="record" v-for="record in records" :id="record">
                <div v-if="record.resource.resourceType === 'ExplanationOfBenefit'"><span style="color: green">EOB</span></div>
                <div v-else-if="record.resource.resourceType === 'Encounter'"><span style="color: blue">Encounter</span></div>
                <div v-else><span>{{ record.resource.resourceType }}</span></div>

                //on click, display the json object
                //on click when dropdown === active, remove the active class
            </div>
        </div>-->
    </div>
    
    
    
</template>

<script>
import {mapState} from 'vuex'
import jsonview from '@pgrabovets/json-view'
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
            allRecordsById: state => state.allRecordsById
            //currentRecords: claims
        })
    },
    data: function() {
        return {
            sortBy: "date", //or "provider"
            displayType: "claims", //or "records" or "all"
            currentClaimUrl: ""
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
        jsonTree(data) {
            let lastNode = document.getElementById(this.currentClaimUrl);
            lastNode ? lastNode.style.color = "black" : undefined;
            this.currentClaimUrl = data.fullUrl;
            let docEl =  document.getElementById(this.currentClaimUrl)
            if(docEl) {
              docEl.style.color = "red";  
            }
            //jsonview.destroy
            document.querySelector('#json-container').innerHTML = '';
            let tree = undefined;
            if(data.resource && (!data.organization)) {
                tree = jsonview.create(data.resource); //https://github.com/pgrabovets/json-view
                jsonview.render(tree, document.querySelector('#json-container'));
                jsonview.expand(tree);
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
            let lastNode = document.getElementById(this.currentClaimUrl);
            lastNode ? lastNode.style.color = "black" : undefined;
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
        }
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
    align-self: flex-start;
    text-align: left;
    left: 0px;
    justify-content: left !important;
    max-width: 70vw;
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
    padding-top: 250px;
    max-height: 60vh;
    width: 70vw;
    overflow-y: scroll;
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
    font-size: 10px;
}
</style>