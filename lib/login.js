'use strict';

const axios = require('axios');
const fs = require('fs');

const iamEndpoint = 'https://iam.cloud.ibm.com';

const login = (opts) => {
    const config = {
      method: 'post',
      url: `${iamEndpoint}/identity/token?apikey=${opts.apikey}&grant_type=urn:ibm:params:oauth:grant-type:apikey`,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    };
    axios(config)
      .then(function (response) {
        if (response.data?.access_token) {
          fs.writeFileSync('/tmp/.iceconfig', response.data?.access_token);
          console.log('ok');
        } else {
          console.log('ko');
        }
      })
      .catch((e) => console.error(e.toJSON()));
}

module.exports = {
    login: login
}
