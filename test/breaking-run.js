fs = require('fs-extra'),
    validations = require('../validations'),
    db = require('../db')

var validOperations = ['BatchGetItem', 'BatchWriteItem', 'CreateTable', 'DeleteItem', 'DeleteTable',
    'DescribeTable', 'DescribeTimeToLive', 'GetItem', 'ListTables', 'PutItem', 'Query', 'Scan', 'TagResource',
    'UntagResource', 'ListTagsOfResource', 'UpdateItem', 'UpdateTable'],
    actions = {},
    actionValidations = {}

async function nohttp() {
    fs.removeSync('./dynamodb')
    var store = db.create({ path: './dynamodb' })
    validOperations.forEach(function (action) {
        action = validations.toLowerFirst(action)
        actions[action] = require('./../actions/' + action)
        actionValidations[action] = require('./../validations/' + action)
    })
    var contents = fs.readFileSync('test/breaking-load.txt', 'utf8');
    var arr = contents.split('\n')
    let i = 0
    for (let line of arr) {
        i++
        if (i === 3) await new Promise(resolve => setTimeout(resolve, 500))
        const idx = line.indexOf(',')
        const action = line.substring(0, idx)
        const data = JSON.parse(line.substring(idx + 1))
        console.log(`Request: ${action}, data: ${JSON.stringify(data)}`)
        await new Promise((resolve, reject) => {
            actions[action](store, data, function (err, response) {
                if (err && err.statusCode) {
                    let rrr = `action: ${action}, err: ${err.statusCode}, ${err.body}`
                    console.log(`Response: ${rrr}\n`)
                    return resolve()
                }
                if (err) {
                    console.error(`line: ${i}, action: ${action}, err:${err}`)
                    return reject(err)
                }
                let rrr = `action: ${action}, data: ${JSON.stringify(response)}`
                console.log(`Response: " ${rrr}\n`)
                return resolve()
            })
        })
    }
}

nohttp()
