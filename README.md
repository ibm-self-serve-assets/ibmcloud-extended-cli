# IBM Cloud IAM Helper

Simple CLI that helps streamline your interactions with IBM Cloud IAM:

```sh
Usage: iam [options] [command]

Options:
  -h, --help       display help for command

Commands:
  login [options]
  users
  access-groups
  help [command]   display help for command
```

## Examples

**Note**: you need to login using `./iam.js login --apikey $IBMCLOUD_API_KEY` before running any other command.

### Login

```sh
./iam.js login --apikey $IBMCLOUD_API_KEY
```

### List account users

```sh
./iam.js users list --account-id $ACCOUNT_ID > users.json
```

**Note**: you can get account id using `ibmcloud login --apikey IBMCLOUD_API_KEY`.

### List access groups

```sh
./iam.js access-groups list --account-id $ACCOUNT_ID
```

**Note**: you can get account id using `ibmcloud login --apikey IBMCLOUD_API_KEY`.

### List access group members

```sh
./iam.js access-groups list-members --group-id  $GROUP_ID > members.json
```

### Add all account users to an access group members

```sh
./iam.js users list --account-id $ACCOUNT_ID > users.json
./iam.js access-groups add-members -j users.json --group-id $GROUP_ID > new-members.json
```

### Delete all access group members

```sh
./iam.js access-groups list-members --group-id  $GROUP_ID > members.json
./iam.js access-groups delete-members -j members.json --group-id $GROUP_ID > deleted-members.json
```