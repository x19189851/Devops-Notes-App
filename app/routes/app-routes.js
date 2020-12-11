const express = require('express');
const moment = require('moment');
const _ = require('underscore');
var request = require("request");

const uuidv4 = require('uuid/v4');
const jwtDecode = require('jwt-decode');

const router = express.Router();

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-south-1' });

const tableName = 'Notezy-table';
var user_id;
var user_name;

// ++++++++++++++++++++++++++Custom Auth Middleware to get Credentials from Cognito++++++++++++++++++++++++++++++++
var customAuth = function (req, res, next) {
    
    let id_token = req.headers.authorization;
    var decoded = jwtDecode(id_token);
    
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        // IdentityPoolId: process.env.ID_POOL,
        IdentityPoolId: 'ap-south-1:ad1e387a-6028-4dce-9e3b-c1659c8956b5',
        Logins: {
            'accounts.google.com': id_token
        }
    });

    AWS.config.credentials.get((error) => {
        user_id = AWS.config.credentials.identityId;
        user_name = decoded.name;
        if(user_id) {
            //authentication successful
         docClient =  new AWS.DynamoDB.DocumentClient();
            next();
        } else {
            //unauthorized
            res.status(401).send();
        }
    });

};

//++++++++++++++++++++++++++++++++++++++Google Tokenid to Login+++++++++++++++++++++++++++++++++++
router.post('/api/tokensignin', (req, res, next)=>{
    let id_token = req.body.id_token;

    let tokeninfoEndpoint = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + id_token;

    let options = {
        url: tokeninfoEndpoint,
        method: 'GET'
    };

    request(options, (error, response, body) => {
        if(response && response.statusCode) {
            return res.status(response.statusCode).send();
        } else {
            return res.status(400).send();
        }
    });
});

//+++++++++++++++++++++++++++++++++++++++++++++++++To add a note++++++++++++++++++++++++++++++++

router.post('/api/note', customAuth, (req, res, next)=>{
    let item = req.body.Item;
    item.user_id = user_id;
    item.user_name = user_name;
    item.note_id = user_id + ':' + uuidv4();
    item.timestamp = moment().unix();
    item.expires = moment().add(90, 'days').unix();

    docClient.put({
        TableName : tableName,
        Item: item
    }, (err, data)=>{
        if(err) {
            console.log(err);
            return res.status(err.statusCode).send({
                message: err.message,
                status: err.statusCode
            });
        } else {
            return res.status(200).send(item);
        }
    });   
});


//+++++++++++++++++++++++++++++++++++++++++To update a note++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++Mandatory : timestamp++++++++++++++++++++++++++++++++++
router.patch('/api/note', customAuth, (req, res, next)=>{

    let item = req.body.Item;
    item.user_id = user_id;
    item.user_name = user_name;
    item.expires = moment().add(90, 'days').unix();

    docClient.put({
        TableName : tableName,
        Item: item,
        ConditionExpression: '#t = :t',
        ExpressionAttributeNames: {
            '#t': 'timestamp'
        },
        ExpressionAttributeValues: {
            ':t': item.timestamp
        }
    }, (err, data)=>{
        if(err) {
            console.log(err);
            return res.status(err.statusCode).send({
                message: err.message,
                status: err.statusCode
            });
        } else {
            return res.status(200).send(item);
        }
    });
});


//+++++++++++++++++++++++++++++++++To reterive all notes of a user++++++++++++++++++++++++++++
router.get('/api/notes', customAuth, (req, res, next) => {

    let limit = req.query.limit ? parseInt(req.query.limit):5;
    let params = {
        TableName: tableName,
        KeyConditionExpression: "user_id = :uid",
        ExpressionAttributeValues: {
            ":uid": user_id
        },
        Limit: limit,
        ScanIndexForward: false
    };

    let startTimestamp = req.query.start ? parseInt(req.query.start) : 0;

    if (startTimestamp > 0) {
        params.ExclusiveStartKey = {
            user_id: user_id,
            timestamp: startTimestamp
        }
    }
 
    docClient.query(params, (err, data)=>{
        if(err) {
            console.log(err);
            return res.status(err.statusCode).send({
                message: err.message,
                status: err.statusCode
            });
        } else {
            return res.status(200).send(data);
        }
    });
});


//+++++++++++++++++++++++++++++++++++To reterive particular note of a user+++++++++++++++++
//++++++++++++++++++++++++++++++++++++++mandatory : noteid++++++++++++++++++++++
router.get('/api/note/:note_id', customAuth, (req, res, next) => {
    
    let note_id = req.params.note_id;
    let params = {
        TableName: tableName,
        IndexName: "note_id-index",
        KeyConditionExpression: "note_id = :note_id",
        ExpressionAttributeValues: {
            ":note_id": note_id
        },
        Limit: 1
    };

    docClient.query(params, (err, data)=>{
        if(err) {
            console.log(err);
            return res.status(err.statusCode).send({
                message: err.message,
                status: err.statusCode
            });
        } else {
            if(!_.isEmpty(data.Items)) {
                return res.status(200).send(data.Items[0]);
            } else {
                return res.status(404).send();
            }            
        }
    });
});


//+++++++++++++++++++++++++++++++++++++To detelet note ++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++mandatory : timestamp +++++++++++++++++++++++++++
router.delete('/api/note/:timestamp', customAuth, (req, res, next) => {
    let timestamp = parseInt(req.params.timestamp);

    let params = {
        TableName: tableName,
        Key: {
            user_id: user_id,
            timestamp: timestamp
        }
    };

    docClient.delete(params, (err, data)=>{
        if(err) {
            console.log(err);
            return res.status(err.statusCode).send({
                message: err.message,
                status: err.statusCode
            });
        } else {
            return res.status(200).send();
        }
    });
});

router.get('/', (req, res, next)=>{
    res.render('index');
});

module.exports = router;