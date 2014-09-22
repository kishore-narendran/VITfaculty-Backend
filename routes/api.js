/**
 * Created by kishore on 21/9/14.
 */
var express = require('express');
var router = express.Router();
var mongoClient = require('mongodb').MongoClient;
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/VITacademics';

function randomString(length, chars) {
    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.round(Math.random() * (mask.length - 1))];
    return result;
}

var getAccessToken = function (req, res) {
    var empid = req.param('empid');
    var passHash = req.param('passwordhash');
    var database, token;
    var onUpdate = function(err, result){
        if(err) {}
        else {
            res.json({'result': 'success', 'token': token});
        }
    };
    var onFind = function(err, items){
        if(err) {}
        else if(items.length == 0 ){
            res.json({'result': 'failure'});
        }
        else{
            token = randomString(6, '#aA!');
            database.collection('teachers').update({'empid': empid}, {$set: {token: token}}, onUpdate);
        }
    };
    var onConnect = function(err, db){
        if(err) {}
        else {
            database = db;
            db.collection('teachers').find({'empid': empid, 'passwordhash': passHash}).toArray(onFind);
        }
    };
    mongoClient.connect(mongoUri, onConnect);
};

var getClasses = function(req, res) {
    var token = req.param('token');
    var database;
    var classes = [];
    var onFindClass = function(err, items){
        if(err){}
        else{
            classes.push(items[0]);
        }
    };
    var onFind = function(err, items) {
        if(err){}
        else if(items.length == 0){
            res.json({'result': 'invalid token'});
        }
        else{
            var cnums = items[0].cnums;
            for(var i=0; i<cnums.length; i++){
                var cnum = cnums[i];
                database.collection('classes').find({'cnum': cnum}).toArray(onFindClass);
            }
        }
    };
    var onConnect = function(err, db){
        if(err){}
        else{
            database = db;
            db.collection('teachers').find({'token': token}).toArray(onFind);
        }
    };
    mongoClient.connect(mongoUri, onConnect);
};

var postAttendance  = function(req, res){
    var cnum = req.param('cnum');
    var date = req.param('date');
    var present = req.param('present');
    var absent = req.param('absent');

};
router.post('/getaccesstoken', getAccessToken);
router.post('/getclasses', getClasses);
module.exports = router;