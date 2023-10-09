const { defineConfig } = require('@vue/cli-service')
//const fs = require('fs');

//const testData = fs.readFileSync('../data/AaronBrekke/AaronBrekke.json');

module.exports = defineConfig({
  transpileDependencies: true,
  /*configureWebpack: config => {
    return {
      plugins: [
        new webpack.DefinePlugin({
          //'testData': testData,
        })
      ]
    }
  }*/
})
