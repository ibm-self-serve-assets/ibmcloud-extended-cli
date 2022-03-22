# IBM Cloud IAM Helper

Simple CLI that helps streamline your interactions with IBM Cloud, by consuming IBM Cloud APIs:

```sh
Usage: ice [options] [command]

Options:
  -h, --help       display help for command

Commands:
  login [options]  login to IBM Cloud.
  iam              interact with IBM Cloud IAM (Identity and Access Management).
  help [command]   display help for command
```

## Install locally

```
❯ git clone https://github.com/ibm-gsi-ecosystem/ibmcloud-extended-cli
❯ cd ibmcloud-extended-cli
❯ npm i -g ./
❯ ice --help
```

## Reference

### IAM

**Note**: you need to login using `ice login --apikey $IBMCLOUD_API_KEY` before running any other command.

#### Login

```sh
❯ ice login --apikey $IBMCLOUD_API_KEY
```

#### List account users

```sh
❯ ice iam users list --account-id $ACCOUNT_ID > users.json
```

**Note**: you can get account id using `ibmcloud login --apikey IBMCLOUD_API_KEY`.

#### List access groups

```sh
❯ ice iam access-groups list --account-id $ACCOUNT_ID > groups.json
```

**Note**: you can get account id using `ibmcloud login --apikey IBMCLOUD_API_KEY`.

#### List access group members

```sh
❯ ice iam access-groups list-members --group-id  $GROUP_ID > members.json
```

#### Add all account users to an access group members

```sh
❯ ice iam users list --account-id $ACCOUNT_ID > users.json
❯ ice iam access-groups add-members -j users.json --group-id $GROUP_ID > new-members.json
```

#### Delete all access group members

```sh
❯ ice iam access-groups list-members --group-id  $GROUP_ID > members.json
❯ ice iam access-groups delete-members -j members.json --group-id $GROUP_ID > deleted-members.json
```

#### AppID

TODO
