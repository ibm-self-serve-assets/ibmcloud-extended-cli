#!/usr/bin/env node

const commander = require('commander');

const program = new commander.Command();

//////////////////////////
// Login
//////////////////////////

const login = require('./lib/login').login;

const loginCmd = program.command('login');
loginCmd.requiredOption('--apikey <apikey>', 'The IBM Cloud IAM api key.')
  .description('login to IBM Cloud.')
  .action(() => {
    login(loginCmd.opts());
  });

//////////////////////////
// IAM
//////////////////////////

const iam = require('./lib/iam');
const iamCmd = program.command('iam')
  .description('interact with IBM Cloud IAM (Identity and Access Management).');

// Users
const users = iamCmd.command('users')
  .description('interact with IBM Cloud account users.');
const listUsersCmd = users.command('list');
listUsersCmd
  .option('--user-id <userId>', 'Filter users based on their user ID.')
  .requiredOption('--account-id <accountId>', 'The IBM Cloud account ID.')
  .description('list IBM Cloud account users.')
  .action(() => {
    iam.listUsers(listUsersCmd.opts(), loginCmd.helpInformation());
  });

// Access groups
const accessGroupsCmd = iamCmd.command('access-groups')
  .description('interact with IBM Cloud IAM Access Groups.');

const listAccessGroupsCmd = accessGroupsCmd.command('list');
listAccessGroupsCmd
  .requiredOption('--account-id <accountId>', 'The IBM Cloud account ID.')
  .description('list IBM Cloud account IAM access groups.')
  .action(() => {
    iam.listAccessGroups(listAccessGroupsCmd.opts());
  });

const listMembersCmd = accessGroupsCmd.command('list-members');
listMembersCmd
  .requiredOption('--group-id <groupId>', 'The ID of the specified access group.')
  .description('list members of a specified IAM access group.')
  .action(() => {
    iam.listMembers(listMembersCmd.opts(), loginCmd.helpInformation());
  });

const addMembersCmd = accessGroupsCmd.command('add-members');
addMembersCmd
  .requiredOption('-j <usersFile>,--json <usersFile>', 'The path to the JSON file containing members to add.')
  .requiredOption('--group-id <groupId>', 'The ID of the specified Access Group.')
  .description('add members to an IAM access group.')
  .action(() => {
    iam.addMembers(addMembersCmd.opts(), loginCmd.helpInformation());
  });

const delMembersCmd = accessGroupsCmd.command('delete-members');
delMembersCmd
  .requiredOption('-j <usersFile>,--json <usersFile>', 'The path to the JSON file containing members to delete.')
  .requiredOption('--group-id <groupId>', 'The ID of the specified Access Group.')
  .description('remove members from an IAM access group.')
  .action(() => {
    iam.deleteMembers(delMembersCmd.opts(), loginCmd.helpInformation());
  });

program.parse(process.argv);
