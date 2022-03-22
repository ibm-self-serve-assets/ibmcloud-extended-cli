'use strict';

const groupByN = (n, data) => {
    let result = [];
    for (let i = 0; i < data.length; i += n) result.push(data.slice(i, i + n));
    return result;
}

module.exports = {
    groupByN: groupByN
}
