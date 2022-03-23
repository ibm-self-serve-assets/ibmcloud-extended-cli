'use strict';

const axios = require('axios');

const appidEndpoint = 'appid.cloud.ibm.com';

const getToken = require('./utils').getToken;

function listUsersWorker(startIx, region, tenantId, token) {
    const config = {
        method: 'get',
        url: `https://${region}.${appidEndpoint}/management/v4/${tenantId}/users?count=50&startIndex=${startIx}`,
        headers: {
            'Accept': `application/json`,
            'Content-Type': `application/json`,
            'Authorization': `Bearer ${token}`,
        }
    };
    return new Promise((resolve, reject) => {
        axios(config)
            .then(function (response) {
                if (response?.data?.users?.length > 0 && response?.data?.totalResults > response?.data?.requestOptions?.count) {
                    listUsersWorker(startIx + 50, region, tenantId, token).then((users) => {
                        return resolve(response?.data?.users?.concat(users));
                    }).catch((e) => reject(e));
                } else {
                    return resolve(response?.data?.users);
                }
            })
            .catch(function (error) {
                return reject(error.toJSON());
            });
    });
}

async function listUsers(opts, loginInfo) {
    const token = getToken(loginInfo);
    const users = await listUsersWorker(0, opts.region, opts.tenantId, token);
    if (opts?.emails) {
        let emails = users.map(user => user.email);
        emails = emails.filter((email, ix) => emails.indexOf(email) === ix);
        console.log(emails.join('\n'));
    } else {
        console.log(JSON.stringify(users, null, 2));
    }
}

module.exports = {
    listUsers: listUsers
}