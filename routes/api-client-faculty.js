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

var async = require('async');
var express = require('express');
var bcrypt = require('bcrypt');
var path = require('path');

var status = require(path.join(__dirname, '..', 'status'));
var slots = require(path.join(__dirname, '..', 'slots'));

var router = express.Router();

var tokenGenerator = function(length, chars) {
    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.round(Math.random() * (mask.length - 1))];
    return result;
};

var getAccessToken = function(req, res) {
    var employeeID = req.body.employee_id;
    var password = req.body.password;
    var token;
    var onUpdate = function(err, result) {
        if(err) {
            res.json({result: status.failure});
        }
        else {
            res.json({result: status.success, token: token});
        }
    };
    var onFind = function(err, data) {
        if(err) {
            res.json({result: status.failure});
        }
        else if (bcrypt.compareSync(password, data.password_hash)) {
            token = tokenGenerator(6, '#aA');
            req.db.collection('teachers').update({employee_id: employeeID}, {$set: {token: token}}, {upsert: true}, onUpdate);
        }
        else {
            res.json({result: status.incorrectCredentials});
        }
    };
    req.db.collection('teachers').findOne({employee_id: employeeID}, onFind);
};

var getClasses = function(req, res) {
    var token = req.body.token;
    var onComplete = function(err, results) {
        if(err) {
            res.json({result: status.failure});
        }
        else {
            res.json({result: status.success, classes: results});
        }
    };
    var onFindClass = function (classNumber, callback) {
        req.db.collection('classes').findOne({class_number: classNumber}, callback);
    };
    var onFind = function(err, data) {
        if(err) {
            res.json({result: status.failure});
        }
        else if(data == null) {
            res.json({result: status.invalidToken});
        }
        else {
            classNumbers = data.class_numbers;
            async.map(classNumbers, onFindClass, onComplete);
        }
    };
    req.db.collection('teachers').findOne({token: token}, onFind);
};

var postAttendance = function(req, res) {
    var token = req.body.token;
    var date = req.body.date;
    var classNumber = req.body.class_number;
    var present = req.body.present;
    var absent = req.body.absent;
    var onUpdate = function(err, result) {
        if(err) {
            res.json({result: status.failure});
        }
        else {
            res.json({result: status.success});
        }
    };
    var onFindClass = function(err, data) {
        if(err) {
            res.json({result: status.failure});
        }
        else if(data == null) {
            res.json({result: status.unknownClassNumber});
        }
        else {
            var history = data.history;
            var students = data.students;
            for(var i = 0; i < history.length; i++) {
                if(history[i].date == date) {
                    history.splice(i, 1);
                    break;
                }
            }
            history.push({date: date, present: present, absent: absent});
            for(var i = 0; i < students.length; i++) {
                var student = students[i];
                if(student.attended.indexOf(date) > -1) {
                    student.attended.splice(student.attended.indexOf(date), 1);
                }
            }
            for (var i = 0; i < present.length; i++) {
                for (var j = 0; j < students.length; j++) {
                    if (present[i] == students[j].register_number) {
                        students[j].attended.push(date);
                    }
                }
            }
            var total = data.total;
            total += data.units;
            req.db.collection('classes').update({class_number: classNumber}, {$set: {history: history, students: students, total: total}}, onUpdate);
        }
    };
    var onFindToken = function(err, data) {
        if(err) {
            res.json({result: status.failure});
        }
        else if(data == null) {
            res.json({result: status.invalidToken});
        }
        else {
            req.db.collection('classes').findOne({class_number: classNumber}, onFindClass);
        }
    };
    req.db.collection('teachers').findOne({token: token}, onFindToken);
};

var getClassAttendance = function(req, res) {
    var classNumber = req.body.class_number;
    var date = req.body.date;
    var token = req.body.token;
    var onFindClass = function(err, data) {
        if(err) {
            res.json({result: status.failure});
        }
        else if(data == null){
            res.json({result: status.invalidClassNumber});
        }
        else {
            if(date == null) {
                res.json({result: status.success, history: data.history});
            }
            else {
                var history = data.history;
                var i;
                for(i = 0; i < history.length; i++) {
                    if(history[i].date == date) {
                        res.json({result: status.success, date: date, present: history[i].present, absent: history[i].absent});
                        break;
                    }
                }
                if(i == history.length) {
                    res.json({result: status.failure});
                }
            }
        }
    };
    var onFindToken = function(err, data) {
        if(err) {
            res.json({result: status.failure});
        }
        else if(data == null) {
            res.json({result: status.invalidToken});
        }
        else {
            req.db.collection('classes').findOne({class_number: classNumber}, onFindClass);
        }
    };
    req.db.collection('teachers').findOne({token: token}, onFindToken);
};

var getTimeTable = function(req, res) {
    var token = req.body.token;
    var timetable = {
        monday:Array.apply(null, new Array(12)).map(Number.prototype.valueOf,0),
        tuesday: Array.apply(null, new Array(12)).map(Number.prototype.valueOf,0),
        wednesday: Array.apply(null, new Array(12)).map(Number.prototype.valueOf,0),
        thursday: Array.apply(null, new Array(12)).map(Number.prototype.valueOf,0),
        friday: Array.apply(null, new Array(12)).map(Number.prototype.valueOf,0)
    };
    var onComplete = function(err, classes) {
        if(err) {
            res.json({result: status.failure});
        }
        else {
            var timetableSchema = slots;
            for(var i = 0; i < classes.length; i++) {
                var x;
                var slot = classes[i].slot;
                var tutorialFlag = (slot.indexOf('+') != -1 && slot.indexOf('L') == -1);
                var classNumber = classes[i].class_number;
                if (slot.indexOf('L') > -1) {
                    var re = /\d+/g;
                    var labSlots = slot.match(re);
                    for (var j = 0; j < labSlots.length; j++) {
                        var labSlot = labSlots[j];
                        if ((x = timetableSchema.lab.monday.indexOf(labSlot)) != -1) {
                            timetable.monday[x] = classNumber;
                        }
                        if ((x = timetableSchema.lab.tuesday.indexOf(labSlot)) != -1) {
                            timetable.tuesday[x] = classNumber;
                        }
                        if ((x = timetableSchema.lab.wednesday.indexOf(labSlot)) != -1) {
                            timetable.wednesday[x] = classNumber;
                        }
                        if ((x = timetableSchema.lab.thursday.indexOf(labSlot)) != -1) {
                            timetable.thursday[x] = classNumber;
                        }
                        if ((x = timetableSchema.lab.friday.indexOf(labSlot)) != -1) {
                            timetable.friday[x] = classNumber;
                        }
                    }

                }
                else {
                    slot = slot.split('+')[0];
                    if ((x = timetableSchema.theory.monday.indexOf(slot)) != -1) {
                        timetable.monday[x] = classNumber;
                    }
                    if ((x = timetableSchema.theory.tuesday.indexOf(slot)) != -1) {
                        timetable.tuesday[x] = classNumber;
                    }
                    if ((x = timetableSchema.theory.wednesday.indexOf(slot)) != -1) {
                        timetable.wednesday[x] = classNumber;
                    }
                    if ((x = timetableSchema.theory.thursday.indexOf(slot)) != -1) {
                        timetable.thursday[x] = classNumber;
                    }
                    if ((x = timetableSchema.theory.friday.indexOf(slot)) != -1) {
                        timetable.friday[x] = classNumber;
                    }
                }
                if (tutorialFlag) {
                    slot = 'T' + slot;
                    if ((x = timetableSchema.theory.monday.indexOf(slot)) != -1) {
                        timetable.monday[x] = classNumber;
                    }
                    if ((x = timetableSchema.theory.tuesday.indexOf(slot)) != -1) {
                        timetable.tuesday[x] = classNumber;
                    }
                    if ((x = timetableSchema.theory.wednesday.indexOf(slot)) != -1) {
                        timetable.wednesday[x] = classNumber;
                    }
                    if ((x = timetableSchema.theory.thursday.indexOf(slot)) != -1) {
                        timetable.thursday[x] = classNumber;
                    }
                    if ((x = timetableSchema.theory.friday.indexOf(slot)) != -1) {
                        timetable.friday[x] = classNumber;
                    }
                }
            }
            res.json({result: status.success, timetable: timetable});
        }
    };
    var onFindClassInfo = function(classNumber, callback) {
        req.db.collection('classes').findOne({class_number: classNumber}, callback)
    };
    var onFindTeacher = function(err, data) {
        if(err) {
            res.json({result: status.failure});
        }
        else if(data == null) {
            res.json({result: status.invalidToken});
        }
        else {
            async.map(data.class_numbers, onFindClassInfo, onComplete);
        }
    };
    req.db.collection('teachers').findOne({token: token}, onFindTeacher);
};

var postMarks = function(req, res) {
    var type = req.body.type;
    var classNumber = req.body.class_number;
    var marks = req.body.marks;
    var token = req.body.token;
    var onUpdate = function(err, result) {
        if(err) {
            res.json({result: status.failure});
        }
        else {
            res.json({result: status.success});
        }
    };
    var onFindClass = function(err, data) {
        if(err) {
            res.json({result: status.failure});
        }
        else if(data == null) {
            res.json({result: status.unknownClassNumber});
        }
        else {
            var students = data.students;
            var exams = data.exams;
            for(var i = 0; i < marks.length; i++) {
                for(var j = 0; j < students.length; j++) {
                    if(marks[i].register_number == students[j].register_number) {
                        students[j][type] = marks[i][type];
                        break;
                    }
                }
            }
            exams.push(type);
            req.db.collection('classes').update({class_number: classNumber}, {$set: {students: students, exams: exams}}, onUpdate);
        }
    };
    var onFindToken = function(err, data) {
        if(err) {
            res.json({result: status.failure});
        }
        else if(data == null) {
            res.json({result: status.invalidToken});
        }
        else {
            req.db.collection('classes').findOne({class_number: classNumber}, onFindClass);
        }
    };
    req.db.collection('teachers').findOne({token: token}, onFindToken);
};

var getMarks = function(req, res) {
    var type = req.body.type;
    var classNumber = req.body.class_number;
    var onFindClass = function(err, data) {
        if(err) {
            res.json({result: status.failure});
        }
        else if(data == null){
            res.json({result: status.unknownClassNumber});
        }
        else {
            var students = data.students;
            var marks = [];
            for(var i = 0; i < students.length; i++) {
                var x = {register_number: students[i].register_number};
                x[type] = students[i][type];
                marks.push(x);
            }
            res.json({class_number: classNumber, type: type, marks: marks, result: status.success});
        }
    };
    req.db.collection('classes').findOne({class_number: classNumber}, onFindClass);
};
router.post('/getaccesstoken', getAccessToken);
router.post('/getclasses', getClasses);
router.post('/postattendance', postAttendance);
router.post('/getattendance', getClassAttendance);
router.post('/gettimetable', getTimeTable);
router.post('/postmarks', postMarks);
router.post('/getmarks', getMarks);
module.exports = router;
