'use strict';

const axios = require('axios');
const fs = require('fs');

const iamEndpoint = 'https://iam.cloud.ibm.com';

const groupByN = require('./utils').groupByN;

function getToken(loginInfo) {
  let token = '';
  try {
    token = fs.readFileSync('/tmp/.iceconfig').toString();
  } catch (error) {
    throw `You must log in before running this command.\n${loginInfo}`;
  }
  return token;
}

function retrieveUsersWorker(url, token) {
  const config = {
    method: 'get',
    url: url,
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  };
  return new Promise((resolve, reject) => {
    axios(config)
      .then(function (response) {
        if (response.data?.next_url) {
          retrieveUsersWorker(`${iamEndpoint}${response.data?.next_url}`, token).then((subUsers) => {
            return resolve(response.data?.resources.concat(subUsers));
          }).catch((e) => reject(e));
        } else {
          return resolve(response.data?.resources);
        }
      })
      .catch(function (error) {
        return reject(error.toJSON());
      });
  });
}

function listUsers(opts, loginInfo) {
  const token = getToken(loginInfo);
  retrieveUsersWorker(`${iamEndpoint}/v2/accounts/${opts.accountId}/users?user_id=${opts.userId || ''}`, token)
    .then((users) => {
      console.log(JSON.stringify(users));
    })
    .catch(console.error);
}

function listAccessGroups(opts, loginInfo) {
  const token = getToken(loginInfo);
  const config = {
    method: 'get',
    url: `${iamEndpoint}/v2/groups?account_id=${opts.accountId}`,
    headers: {
      'Accept': `application/json`,
      'Authorization': `Bearer ${token}`,
    }
  };
  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data?.groups));
    })
    .catch(e => console.error(e.toJSON()));
}

function retrieveMembersWorker(url, token) {
  const config = {
    method: 'get',
    url: url,
    headers: {
      'Accept': `application/json`,
      'Authorization': `Bearer ${token}`,
    }
  };
  return new Promise((resolve, reject) => {
    axios(config)
      .then(function (response) {
        if (response.data.next?.href) {
          retrieveMembersWorker(response.data?.next?.href, token).then((subMembers) => {
            return resolve((response.data?.members).concat(subMembers));
          }).catch((e) => reject(e));
        } else {
          return resolve(response.data?.members);
        }
      })
      .catch(function (error) {
        return reject(error.toJSON());
      });
  });
}

function listMembers(opts, loginInfo) {
  const token = getToken(loginInfo);
  retrieveMembersWorker(`${iamEndpoint}/v2/groups/${opts.groupId}/members`, token)
    .then(members => {
      console.log(JSON.stringify(members));
    }).catch(e => console.error(e));
}

function addMembersWorker(ix, data, groupId, token) {
  const config = {
    method: 'put',
    url: `${iamEndpoint}/v2/groups/${groupId}/members`,
    headers: {
      'Accept': `application/json`,
      'Content-Type': `application/json`,
      'Authorization': `Bearer ${token}`,
    },
    data: {
      members: data[ix].map(user => ({
        iam_id: user.iam_id,
        type: 'user'
      }))
    }
  };
  return new Promise((resolve, reject) => {
    axios(config)
      .then(function (response) {
        if (ix < data.length - 1) {
          addMembersWorker(ix + 1, data, groupId, token).then((subMembers) => {
            return resolve(response?.data?.members.concat(subMembers));
          }).catch((e) => reject(e));
        } else {
          return resolve(response?.data?.members);
        }
      })
      .catch(function (error) {
        return reject(error.toJSON());
      });
  });
}

function addMembers(opts, loginInfo) {
  const token = getToken(loginInfo);
  const users = JSON.parse(fs.readFileSync(opts.j).toString());
  const userArrays = groupByN(50, users);
  addMembersWorker(0, userArrays, opts.groupId, token)
    .then((members) => {
      console.log(JSON.stringify(members));
    })
    .catch(console.error);
}

function delMembersWorker(ix, data, groupId, token) {
  const config = {
    method: 'post',
    url: `${iamEndpoint}/v2/groups/${groupId}/members/delete`,
    headers: {
      'Accept': `application/json`,
      'Content-Type': `application/json`,
      'Authorization': `Bearer ${token}`,
    },
    data: {
      members: data[ix].map(user => user.iam_id)
    }
  };
  return new Promise((resolve, reject) => {
    axios(config)
      .then(function (response) {
        if (ix < data.length - 1) {
          delMembersWorker(ix + 1, data, groupId, token).then((subMembers) => {
            return resolve(response?.data?.members.concat(subMembers));
          }).catch((e) => reject(e));
        } else {
          return resolve(response?.data?.members);
        }
      })
      .catch(function (error) {
        return reject(error.toJSON());
      });
  });
}

function deleteMembers(opts, loginInfo) {
  const token = getToken(loginInfo);
  const users = JSON.parse(fs.readFileSync(opts.j).toString());
  const userArrays = groupByN(50, users);
  delMembersWorker(0, userArrays, opts.groupId, token)
    .then((members) => {
      console.log(JSON.stringify(members));
    })
    .catch(console.error);
}

module.exports = {
  listUsers: listUsers,
  listAccessGroups: listAccessGroups,
  listMembers: listMembers,
  addMembers: addMembers,
  deleteMembers: deleteMembers
}
