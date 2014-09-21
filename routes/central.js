/**
 * Created by kishore on 21/9/14.
 */
var express = require('express');
var router = express.Router();
var mongoClient = require('mongodb').MongoClient;
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/VITacademics';

module.exports = router;