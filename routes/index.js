var express = require('express');
var router = express.Router();
var mongoClient = require('mongodb').MongoClient;
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/VITacademics';

/* GET home page. */
router.get('/', function(req, res) {
    var name = req.param('name');
    var onInsert = function(err,records){
        console.log(records[0].name);
    };
    var onConnect = function(err, db) {
        if(err){}
        else{
            db.collection('names').insert({name:name}, onInsert);
        }
    };
    mongoClient.connect(mongoUri, onConnect);
    res.render('index', { title: 'Hello World!', name: name });
});

module.exports = router;
