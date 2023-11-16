<template>
    <div>
        <h3>Get Data - {{ client.name }}</h3>
        <!--upload box-->
        <div id="upload div">
            <p>(in development - not working) upload a FHIR R4 JSON file for the current client(additional filetypes coming soon)</p>
            <p>the file will be stored in your browser's local storage. we will only store anonymized metadata about search and analyses that you choose to share to help us build our product.</p>
            <input id="fileInput" type="file">
        </div>
        <!--1up explanation-->
        <div id="1up">
            <p>the below link will route you to the 1up sandbox for the associated provider for your client</p>
            <a>_to be filled in_</a>
        </div>
        <!--1up links-->
        <!--1up link => consent page => data to express server => refresh the page in 5 seconds and check if the data's there-->
    </div>
</template>

<script>
import {mapState} from 'vuex'

export default {
    computed: {
        ...mapState({
            client: state => state.currentClient
        })
    },
    methods: {
        requestData(clientName) {
            switch (clientName) {
                case "Donna Dobson": {
                    //go to Veragidm
                }/*
                case "Wilma Smart" {
                    //Cerner
                }
                case "Fhir Jason" {
                    //Epic
                }
                case "BB User" {
                    //Medicare
                }
                case "Adult Female" {
                    //eClincalWorks
                }*/
            }

        }
    }
}
</script>

<style>
</style>