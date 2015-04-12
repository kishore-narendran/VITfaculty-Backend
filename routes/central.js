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
var router = express.Router();
var path = require('path');
var status = require(path.join(__dirname, '..', 'status'));


var addTeacher = function (req, res) {
    var empid = req.body.empid;
    var passHash = req.body.passwordhash;
    var cnums = req.body.cnum;
    var onInsert = function (err, records) {
        if (err) {
            res.json({result: status.failure})
        }
        else {
            res.json({result: status.success});
        }
    };
    req.db.collection('teachers').insert({'empid': empid, 'passwordhash': passHash, 'cnums': cnums}, onInsert);
};

var addClass = function (req, res) {

    //Need to validate for the value of each class i.e. If lab then 2 if theory then 1
    var regnos = req.body.regno;
    var cnum = req.body.cnum;
    var name = req.body.name;
    var code = req.body.code;
    var slot = req.body.slot;
    var venue = req.body.venue;
    var students = [];
    for (var i = 0; i < regnos.length; i++) {
        var student = {'regno': regnos[i], 'attended': []};
        students.push(student);
    }
    var onInsert = function (err, record) {
        if (err) {
            res.json({result: status.failure})
        }
        else {
            res.json({result: status.success});
        }
    };
    req.db.collection('classes').insert({'cnum': cnum, 'students': students, 'name': name, 'code': code, 'slot': slot, 'venue': venue, 'total': 0}, onInsert);
};
var addSemester = function (req, res) {
    var semester = req.body.semester;
    var year = req.body.year;
    var startDate = req.body.startdate;
    var endDate = req.body.enddate;
    var onInsertSemester = function(err, item) {
        if(err) {}
        else {cos
            res.json({'result': 'success'});
        }
    };
    req.db.collection('semesters').insert({'semester': semester+year, 'startdate': startDate, 'enddate': endDate}, onInsertSemester);
};
router.post('/addteacher', addTeacher);
router.post('/addclass', addClass);
router.post('/addsemester', addSemester);

module.exports = router;
