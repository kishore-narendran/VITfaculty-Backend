/**
 * Created by kishore on 21/9/14.
 */
var express = require('express');
var async = require('async');
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
    var onAllClasses = function(err, results) {
        if(err){}
        else {
            res.json({'classes': results, 'token': token});
        }
    };
    var onFindClass = function(cnum, callback){
        database.collection('classes').findOne({'cnum': cnum}, callback);
    };
    var onFind = function(err, item) {
        if(err){}
        else if(item){
            var cnums = item.cnums;
            async.map(cnums, onFindClass, onAllClasses);
        }
        else {
            res.json({'result': 'token invalid'})
        }
    };
    var onConnect = function(err, db){
        if(err){}
        else{
            database = db;
            db.collection('teachers').findOne({'token': token}, onFind);
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