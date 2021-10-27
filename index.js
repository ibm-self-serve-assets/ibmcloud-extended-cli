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

// Login 

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
    .catch(function (error) {
      console.log(error);
    });
});

// Users

const users = program.command('users');

// Command to list account users
const list = users.command('list');
list
  .option('--user-id <userId>', 'Filter users based on their user ID.')
  .requiredOption('--account-id <accountId>', 'The account ID of the specified user.')
list.action(() => {
  try {
    const token = fs.readFileSync('.config').toString();
    const opts = list.opts();
    const config = {
      method: 'get',
      url: `${iamEndpoint}/v2/accounts/${opts.accountId}/users?user_id=${opts.userId || ''}`,
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    };
    axios(config)
      .then(function (response) {
        console.log(JSON.stringify(response.data?.resources));
      })
      .catch(function (error) {
        console.log(JSON.stringify(error.toJSON()));
      });
  } catch (error) {
    console.log('Not logged in. You must first log in with:\n');
    login.help();
  }
});

// IAM

const iam = program.command('iam');

// IAM Access Groups

const accessGroups = iam.command('access-groups');

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
        console.log(JSON.stringify(response.data));
      })
      .catch(function (error) {
        console.log(JSON.stringify(error.toJSON()));
      });
  } catch (error) {
    console.log('Not logged in. You must first log in with:\n');
    login.help();
  }
});

// Command to list access group members
const acListMembers = accessGroups.command('list-members');
acListMembers
  .requiredOption('--group-id <groupId>', 'The ID of the specified Access Group.')
acListMembers.action(() => {
  try {
    const token = fs.readFileSync('.config').toString();
    const opts = acListMembers.opts();
    const config = {
      method: 'get',
      url: `${iamEndpoint}/v2/groups/${opts.groupId}/members`,
      headers: {
        'Accept': `application/json`,
        'Authorization': `Bearer ${token}`,
      }
    };
    axios(config)
      .then(function (response) {
        console.log(JSON.stringify(response.data));
      })
      .catch(function (error) {
        console.log(JSON.stringify(error.toJSON()));
      });
  } catch (error) {
    console.log('Not logged in. You must first log in with:\n');
    login.help();
  }
});
const acAddMembers = accessGroups.command('add-members');
acAddMembers
  .requiredOption('--users-file <usersFile>', 'The path to the JSON file containing members to add.')
  .requiredOption('--group-id <groupId>', 'The ID of the specified Access Group.')
acAddMembers.action(() => {
  try {
    const token = fs.readFileSync('.config').toString();
    const opts = acAddMembers.opts();
    const config = {
      url: `${iamEndpoint}/v2/groups/${opts.groupId}/members`,
      headers: {
        'Accept': `application/json`,
        'Content-Type': `application/json`,
        'Authorization': `Bearer ${token}`,
      }
    };
    const users = JSON.parse(fs.readFileSync(opts.usersFile).toString());
    const userArrays = groupByN(50, users);
    userArrays.forEach((userGroup) => {
      console.log(userGroup);
    });
    axios.put(config, {})
      .then(function (response) {
        console.log(JSON.stringify(response.data));
      })
      .catch(function (error) {
        console.log(JSON.stringify(error.toJSON()));
      });
  } catch (error) {
    console.log('Not logged in. You must first log in with:\n');
    login.help();
  }
});
accessGroups.command('delete-members').action(() => {
  console.log('delete members from access group');
});

program.parse(process.argv);