# Claimant Front-end

The front-end web app for uploading and searching through FHIR R4 JSON files.

## project architecture: tech used
- dependencies for dev/serving: [node.js](https://nodejs.org/en/download) and [node package manager](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [vue](https://vuejs.org/) framework with a [vuex store](https://vuex.vuejs.org/)
- [UMLS](https://www.nlm.nih.gov/research/umls/index.html) API for medical synonyms

## folder architecture & important files
- ./src/ - the source files (the code) for the project
    - App.vue - the sparest page - sets up the nav bar
    - store/index.js - data storage and analysis that persists across the app (e.g., when you load a client's data into the app, it lives in here regardless of what page you navigate to. Does not save any data outside of user sessions.)
    - views/ - folder containing the main pages of the app
        - ClientDataView.vue - display/search/analyze a single Client's FHIR Data
        - GetData.vue - upload a client's data directly to the app to analyze
        - RepClientView.vue - for a representative to navigate between their clients

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your unit tests
```
npm run test:unit
```

### Run your end-to-end tests
```
npm run test:e2e
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).


### code practices
- a "**" indicates a comment describing something i want to implement in the future
