'use strict';

const fs = require('fs');

function groupByN(n, data) {
    let result = [];
    for (let i = 0; i < data.length; i += n) result.push(data.slice(i, i + n));
    return result;
}

function getToken(loginInfo) {
  let token = '';
  try {
    token = fs.readFileSync('/tmp/.iceconfig').toString();
  } catch (error) {
    throw `You must log in before running this command.\n${loginInfo}`;
  }
  return token;
}

module.exports = {
    groupByN: groupByN,
    getToken: getToken
}
