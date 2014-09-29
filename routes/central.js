/*
 *  VITacademics-Faculty
 *  Copyright (C) 2014  Kishore Narendran <kishore.narendran09@gmail.com>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var express = require('express');
var mongoClient = require('mongodb').MongoClient;
var router = express.Router();

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/VITacademics';

var addTeacher = function (req, res) {
    var empid = req.param('empid');
    var passHash = req.param('passwordhash');
    var cnums = req.param('cnum');
    var onInsert = function (err, records) {
        if (err) {
        }
        else {
            res.json({'result': "success"});
        }
    };
    var onConnect = function (err, db) {
        if (err) {
        }
        else {
            db.collection('teachers').insert({'empid': empid, 'passwordhash': passHash, 'cnums': cnums}, onInsert);
        }
    };
    mongoClient.connect(mongoUri, onConnect);
};

var addClass = function (req, res) {

    //Need to validate for the value of each class i.e. If lab then 2 if theory then 1
    var regnos = req.param('regno');
    var cnum = req.param('cnum');
    var name = req.param('name');
    var code = req.param('code');
    var slot = req.param('slot');
    var venue = req.param('venue');
    var students = [];
    for (var i = 0; i < regnos.length; i++) {
        var student = {'regno': regnos[i], 'attended': []};
        students.push(student);
    }
    var onInsert = function (err, record) {
        if (err) {
        }
        else {
            res.json({'result': 'success'});
        }
    };
    var onConnect = function (err, db) {
        if (err) {
        }
        else {
            db.collection('classes').insert({'cnum': cnum, 'students': students, 'name': name, 'code': code, 'slot': slot, 'venue': venue, 'total': 0}, onInsert);
        }
    };
    mongoClient.connect(mongoUri, onConnect);
};

router.post('/addteacher', addTeacher);
router.post('/addclass', addClass);

module.exports = router;
