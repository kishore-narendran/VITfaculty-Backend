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
    var employeeID = req.body.employee_id;
    var passwordHash = req.body.password_hash;
    var classNumbers = req.body.class_numbers;
    var onInsert = function (err, records) {
        if (err) {
            res.json({result: status.failure})
        }
        else {
            res.json({result: status.success});
        }
    };
    req.db.collection('teachers').insert({employee_id: employeeID, password_hash: passwordHash, class_numbers: classNumbers}, onInsert);
};

var addClass = function (req, res) {
    var semester = req.body.semester;
    var registerNumbers = req.body.register_numbers;
    var classNumber = req.body.class_number;
    var title = req.body.title;
    var code = req.body.code;
    var slot = req.body.slot;
    var venue = req.body.venue;
    var type = req.body.type;
    var units;
    var students = [];
    var days = [];
    var classDates = [];
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
    for (var i = 0; i < registerNumbers.length; i++) {
        var student = {register_number: registerNumbers[i], attended: []};
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
        else if(result == null) {
            res.json({result: status.semesterNotFound});
        }
        else {
            var instructionalDates = result.class_dates;
            for(var i = 0; i < days.length; i++) {
                day = days[i];
                classDates.push.apply(classDates, instructionalDates[day]);
            }
            for(var i = 0; i < classDates.length; i++) {
              for(var j = 0; j < classDates.length - 1 - i; j++) {
                if(moment(classDates[j]).diff(moment(classDates[j+1])) > 0) {
                  var temp = classDates[j];
                  classDates[j] = classDates[j+1];
                  classDates[j+1] = temp;
                }
              }
            }
            req.db.collection('classes').insert({class_number: classNumber, students: students, title: title, code: code, slot: slot, venue: venue, units: units, class_dates: classDates, type: type, total: 0, history: []}, onInsert);
        }
    }
    req.db.collection('semesters').findOne({semester: semester}, onSemesterFind);

};

var addSemester = function (req, res) {
    var semester = req.body.semester;
    var noClassDates = req.body.non_instructional_dates;
    var startDate = req.body.start_date;
    var endDate = req.body.end_date;
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
        else {
            res.json({result: status.success});
        }
    };
    req.db.collection('semesters').insert({semester: semester, start_date: startDate, end_date: endDate, non_instructional_dates: noClassDates, class_dates: classDates}, onInsertSemester);
};

router.post('/addteacher', addTeacher);
router.post('/addclass', addClass);
router.post('/addsemester', addSemester);
module.exports = router;
