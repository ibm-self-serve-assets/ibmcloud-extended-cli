#!/usr/bin/env node

const commander = require('commander');
const axios = require('axios');
const fs = require('fs');

const iamEndpoint = 'https://iam.cloud.ibm.com';

const program = new commander.Command();

let groupByN = (n, data) => {
  let result = [];
  for (let i = 0; i < data.length; i += n) result.push(data.slice(i, i + n));
  return result;
};

//////////////////////////
// Login
//////////////////////////

const login = program.command('login');
login
  .requiredOption('--apikey <apikey>', 'The value of the IBM Cloud IAM api key.')
login.action(() => {
  const opts = login.opts();
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
        fs.writeFileSync('.config', response.data?.access_token);
        console.log('ok');
      } else {
        console.log('ko');
      }
    })
    .catch((e) => console.error(e.toJSON()));
});

//////////////////////////
// Users
//////////////////////////

const users = program.command('users');

// Command to list account users

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

const list = users.command('list');
list
  .option('--user-id <userId>', 'Filter users based on their user ID.')
  .requiredOption('--account-id <accountId>', 'The account ID of the specified user.')
list.action(() => {
  const opts = list.opts();
  let token = '';
  try {
    token = fs.readFileSync('.config').toString();
  } catch (error) {
    console.log('Not logged in. You must first log in with:\n');
    login.help();
    return;
  }
  retrieveUsersWorker(`${iamEndpoint}/v2/accounts/${opts.accountId}/users?user_id=${opts.userId || ''}`, token)
    .then((users) => {
      console.log(JSON.stringify(users));
    })
    .catch(console.error);
});

//////////////////////////
// IAM Access Groups
//////////////////////////

const accessGroups = program.command('access-groups');

// Command to list access groups
const acList = accessGroups.command('list');
acList
  .requiredOption('--account-id <accountId>', 'The account ID of the specified user.')
acList.action(() => {
  try {
    const token = fs.readFileSync('.config').toString();
    const opts = acList.opts();
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
  } catch (error) {
    console.log('Not logged in. You must first log in with:\n');
    login.help();
  }
});

// Command to list access group members

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

const acListMembers = accessGroups.command('list-members');
acListMembers
  .requiredOption('--group-id <groupId>', 'The ID of the specified Access Group.')
acListMembers.action(() => {
  const opts = acListMembers.opts();
  let token = '';
  try {
    token = fs.readFileSync('.config').toString();
  } catch (error) {
    console.log('Not logged in. You must first log in with:\n');
    login.help();
    return;
  }
  retrieveMembersWorker(`${iamEndpoint}/v2/groups/${opts.groupId}/members`, token)
    .then(members => {
      console.log(JSON.stringify(members));
    }).catch(e => console.error(e));
});

// Command to add access group members

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

const acAddMembers = accessGroups.command('add-members');
acAddMembers
  .requiredOption('-j <usersFile>,--json <usersFile>', 'The path to the JSON file containing members to add.')
  .requiredOption('--group-id <groupId>', 'The ID of the specified Access Group.')
acAddMembers.action(() => {
  let token = '';
  try {
    token = fs.readFileSync('.config').toString();
  } catch (error) {
    console.log('Not logged in. You must first log in with:\n');
    login.help();
    return;
  }
  const opts = acAddMembers.opts();
  const users = JSON.parse(fs.readFileSync(opts.j).toString());
  const userArrays = groupByN(50, users);
  addMembersWorker(0, userArrays, opts.groupId, token)
    .then((members) => {
      console.log(JSON.stringify(members));
    })
    .catch(console.error);
});

// Command to delete access group members

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

const acDelMembers = accessGroups.command('delete-members');
acDelMembers
  .requiredOption('-j <usersFile>,--json <usersFile>', 'The path to the JSON file containing members to delete.')
  .requiredOption('--group-id <groupId>', 'The ID of the specified Access Group.')
  acDelMembers.action(() => {
    let token = '';
    try {
      token = fs.readFileSync('.config').toString();
    } catch (error) {
      console.log('Not logged in. You must first log in with:\n');
      login.help();
    }
    const opts = acDelMembers.opts();
    const users = JSON.parse(fs.readFileSync(opts.j).toString());
    const userArrays = groupByN(50, users);
    delMembersWorker(0, userArrays, opts.groupId, token)
    .then((members) => {
      console.log(JSON.stringify(members));
    })
    .catch(console.error);
});

program.parse(process.argv);