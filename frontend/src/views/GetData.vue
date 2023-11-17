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
            client: state => state.currentClient,
            oneUpClientId: state => state.oneUpClientId
        })
    },
    methods: {
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
        }
    }
}
</script>

<style>
</style>