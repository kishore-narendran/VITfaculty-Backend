/*
 *  VITfaculty
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
var path = require('path');
var moment = require('moment');
var slots = require(path.join(__dirname, '..', 'slots'));
var status = require(path.join(__dirname, '..', 'status'));
var router = express.Router();


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
    var semester = req.body.semester;
    var regnos = req.body.regno;
    var cnum = req.body.cnum;
    var name = req.body.name;
    var code = req.body.code;
    var slot = req.body.slot;
    var venue = req.body.venue;
    var units = (slot.split("L").length - 1) != 0 ? (slot.split("L").length - 1) : 1;
    var students = [];
    for (var i = 0; i < regnos.length; i++) {
        var student = {'regno': regnos[i], 'attended': []};
        students.push(student);
    }
    var onInsert = function (err, record) {
        if (err) {
            res.json({result: status.failure});
        }
        else {
            res.json({result: status.success});
        }
    };
    //req.db.collection('classes').insert({'cnum': cnum, 'students': students, 'name': name, 'code': code, 'slot': slot, 'venue': venue, 'total': 0}, onInsert);
};
var addSemester = function (req, res) {
    var semester = req.body.semester;
    var noClassDates = req.body.non_instructional_dates;
    var startDate = req.body.startdate;
    var endDate = req.body.enddate;
    var classDates = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: []
    }
    var lastDay = moment(endDate).add('days', 1);
    for(var day = moment(startDate); day.diff(lastDay); day = day.add('days', 1)) {
        if(noClassDates.indexOf(day.format('YYYY-MM-DD')) > -1) {
            continue;
        }
        else if(day.day() == 0 || day.day() == 6) {
            continue;
        }
        else {
            switch(day.day()) {
                case 1:
                    classDates.monday.push(day.format("YYYY-MM-DD"));
                    break;

                case 2:
                    classDates.tuesday.push(day.format("YYYY-MM-DD"));
                    break;

                case 3:
                    classDates.wednesday.push(day.format("YYYY-MM-DD"));
                    break;

                case 4:
                    classDates.thursday.push(day.format("YYYY-MM-DD"));
                    break;

                case 5:
                    classDates.friday.push(day.format("YYYY-MM-DD"));
                    break;
            }
        }
    }
    var onInsertSemester = function(err, item) {
        if(err) {
            res.json({result: status.failure});
        }
        else {cos
            res.json({result: status.success});
        }
    };
    req.db.collection('semesters').insert({semester: semester, startdate: startDate, enddate: endDate, noclassdates: noClassDates, classdates: classDates}, onInsertSemester);
};
router.post('/addteacher', addTeacher);
router.post('/addclass', addClass);
router.post('/addsemester', addSemester);

module.exports = router;
