<template>
    <div id="RepClientList" class="column">
        <div class="client row" v-for="client in clients" :key="client" v-on:click="chooseClient(client)">
            <h2>{{ client.name }} </h2>
            <h2 v-if="client.hasData">–– Review Records</h2>
            <h2 v-else>–– Request Records</h2>
        </div>
    </div>
</template>

<script>
import {mapState} from 'vuex'

export default {
    computed: {
        ...mapState({
            clients: state => state.clients
        })
    },
    data: function() {
        return {
            /*clients: [{
                name: "Aaron Brekke",
                hasData: false,
                dataUrl: "../../data/AaronBrekke/Aaron697_Brekke496_2fa15bc7-8866-461a-9000-f739e425860a"
            }, {
                name: "Youlanda Hettinger",
                hasData: false,
                dataUrl: "../../data/YoulandaHettinger/Youlanda785_Hettinger594_7fe3fe78-f363-4c13-95ae-a05df266448a"
            }]*/
            // n
        }
    },
    methods: {
        chooseClient(client) {
            if (client.hasData) {
                if (!client.allRecords) {
                    if (client.localStorage) {
                        this.$store.dispatch('loadClientDataFromLocalStorage', client);
                    } else if (client.dataUrl) {
                        this.$store.dispatch('loadClientDataFromServer', client);
                    }
                }  else {
                    //route to data view
                    this.$store.commit('setClient', client)
                }
                
            } else {
                //route to request view
            }
            //set client in store
            //if client has data => data view
            //if not => request or upload data view
        }
    }
}
</script>

<style>
</style>