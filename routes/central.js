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
    var regnos = req.body.regnos;
    var cnum = req.body.cnum;
    var name = req.body.name;
    var code = req.body.code;
    var slot = req.body.slot;
    var venue = req.body.venue;
    var type = req.body.type;
    var units;
    var students = [];
    var days = [];
    var classDays = [];
    if(type === "Theory Only" || type === "Embedded Theory") {
        units = 1;
        days = slots[slot];
    }
    else if(type === "Lab Only" || type === "Embedded Lab") {
        units = slot.split('L').length - 1;
        var re = /\d+/g;
        var labSlots = slot.match(re);
        for(var i in labSlots) {
            labSlot = parseInt(i);
            if(((labSlot >= 1 && labSlot <= 6) || (labSlot >= 31 && labSlot <= 36)) && days.indexOf('monday') == -1) {
                days.push('monday');
            }
            else if(((labSlot >= 7 && labSlot <= 12) || (labSlot >= 37 && labSlot <= 42)) && days.indexOf('tuesday') == -1) {
                days.push('tuesday');
            }
            else if(((labSlot >= 13 && labSlot <= 18) || (labSlot >= 43 && labSlot <= 48)) && days.indexOf('wednesday') == -1) {
                days.push('wednesday');
            }
            else if(((labSlot >= 19 && labSlot <= 24) || (labSlot >= 49 && labSlot <= 54)) && days.indexOf('thursday') == -1) {
                days.push('thursday');
            }
            else if(((labSlot >= 25 && labSlot <= 30) || (labSlot >= 55 && labSlot <= 60)) && days.indexOf('friday') == -1) {
                days.push('friday');
            }
        }
    }
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
    var onSemesterFind = function(err, result) {
        if(err) {
            res.json({result: status.failure});
        }
        else {
            var classDates = result.classdates;
            for(var i = 0; i < days.length; i++) {
                day = days[i];
                classDays.push.apply(classDays, classDates[day]);
            }
            for(var i = 0; i < classDays.length; i++) {
                for(var j = 0; j < classDays.length - 1 - i; j++) {
                    if(moment(classDays[j]).diff(moment(classDays[j+1])) > 0) {
                        var temp = classDays[j];
                        classDays[j] = classDays[j+1];
                        classDays[j+1] = temp;
                    }
                }
            }
            req.db.collection('classes').insert({cnum: cnum, students: students, name: name, code: code, slot: slot, venue: venue, units: units, classdates: classDays, type: type, total: 0}, onInsert);
        }
    };
    req.db.collection('semesters').findOne({semester: semester}, onSemesterFind);

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
    };
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
        else {
            res.json({result: status.success});
        }
    };
    req.db.collection('semesters').insert({semester: semester, startdate: startDate, enddate: endDate, noclassdates: noClassDates, classdates: classDates}, onInsertSemester);
};
router.post('/addteacher', addTeacher);
router.post('/addclass', addClass);
router.post('/addsemester', addSemester);

module.exports = router;
