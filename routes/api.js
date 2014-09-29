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

var async = require('async');
var express = require('express');
var mongoClient = require('mongodb').MongoClient;
var router = express.Router();

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/VITacademics';


/*
 The following function generates a random string which
 will act as a token for all requests coming in from the
 side
 */
function randomString(length, chars) {
    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.round(Math.random() * (mask.length - 1))];
    return result;
}

/*
 The following function is called when a new token is
 requested for a teacher.
 */
var getAccessToken = function (req, res) {
    var empid = req.param('empid');
    var passHash = req.param('passwordhash');
    var database, token;
    var onUpdate = function (err, result) {
        if (err) {
        }
        else {
            res.json({'result': 'success', 'token': token});
        }
    };
    var onFind = function (err, items) {
        if (err) {
        }
        else if (items.length == 0) {
            res.json({'result': 'failure'});
        }
        else {
            token = randomString(6, '#aA');
            database.collection('teachers').update({'empid': empid}, {$set: {token: token}}, onUpdate);
        }
    };
    var onConnect = function (err, db) {
        if (err) {
        }
        else {
            database = db;
            db.collection('teachers').find({'empid': empid, 'passwordhash': passHash}).toArray(onFind);
        }
    };
    mongoClient.connect(mongoUri, onConnect);
};

var getClasses = function (req, res) {
    var token = req.param('token');
    var database;
    var classes = [];
    var onAllClasses = function (err, results) {
        if (err) {
        }
        else {
            res.json({'classes': results, 'token': token});
        }
    };
    var onFindClass = function (cnum, callback) {
        database.collection('classes').findOne({'cnum': cnum}, callback);
    };
    var onFind = function (err, item) {
        if (err) {
        }
        else if (item) {
            var cnums = item.cnums;
            async.map(cnums, onFindClass, onAllClasses);
        }
        else {
            res.json({'result': 'token invalid'})
        }
    };
    var onConnect = function (err, db) {
        if (err) {
        }
        else {
            database = db;
            db.collection('teachers').findOne({'token': token}, onFind);
        }
    };
    mongoClient.connect(mongoUri, onConnect);
};

var postAttendance = function (req, res) {
    var cnum = req.param('cnum');
    var date = req.param('date');
    var present = req.param('present');
    var absent = req.param('absent');
    var token = req.param('token');
    if (!(present instanceof Array)) {
        var presentA = [];
        presentA.push(present);
        present = presentA;
    }
    if (!(absent instanceof Array)) {
        var absentA = [];
        absentA.push(absent);
        absent = absentA;
    }
    var onUpdate = function (err, result) {
        if (err) {
            res.json({'result': 'failure'});
        }
        else {
            res.json({'result': 'success'});
        }
    };
    var onClassFind = function (err, result) {
        if (err) {
        }
        else {
            var history = [];
            if (result.history) {
                history = result.history;
            }
            history.push({'date': date, 'present': present, 'absent': absent});
            var students = result.students;
            for (var i = 0; i < present.length; i++) {
                for (var j = 0; j < students.length; j++) {
                    if (present[i] == students[j].regno) {
                        students[j].attended.push(date);
                    }
                }
            }
            var total = result.total;
            total = total + 1;
            database.collection('classes').update({'cnum': cnum}, {$set: {'history': history, 'students': students, 'total': total}}, onUpdate);
        }
    };
    var onConnect = function (err, db) {
        if (err) {
        }
        else {
            database = db;
            database.collection('classes').findOne({'cnum': cnum}, onClassFind);
        }
    };
    var database;
    mongoClient.connect(mongoUri, onConnect);
};

var getClassAttendanceByDate = function (req, res) {
    var date = req.param('date');
    var cnum = req.param('cnum');
    var onClassFind = function (err, result) {
        if (err) {
        }
        else {
            var history = result.history;
            for (var i = 0; i < history.length; i++) {
                if (history[i].date == date) {
                    history[i].result = 'success';
                    res.json(history[i]);
                }
                res.json({'result': 'failure'});
            }
        }
    };
    var onConnect = function (err, db) {
        if (err) {
        }
        else {
            db.collection('classes').findOne({'cnum': cnum}, onClassFind);
        }

    };
    mongoClient.connect(mongoUri, onConnect);
};

router.post('/getaccesstoken', getAccessToken);
router.post('/getclasses', getClasses);
router.post('/postattendance', postAttendance);
router.post('/getclassattendancedate', getClassAttendanceByDate);

module.exports = router;
