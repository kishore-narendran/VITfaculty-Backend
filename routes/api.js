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

/*
 The following function is to get class details
 by getting the token number.
 */

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

var getClassAttendance = function(req, res) {
    var cnum = req.param('cnum');
    var onClassFind = function(err, result) {
        if(err) {}
        else {
            var history = result.history;
            history.result = 'success';
            res.json({'history': history});
        }
    };
    var onConnect = function(err, db) {
        if (err) {
        }
        else {
            db.collection('classes').findOne({'cnum': cnum}, onClassFind);
        }
    };
    mongoClient.connect(mongoUri, onConnect);
};

var getTimeTable = function(req, res) {
    var mondayTheory = ['A1', 'F1', 'C1', 'E1', 'TD1', 'A2', 'F2', 'C2', 'E2', 'TD2'];
    var tuesdayTheory = ['B1', 'G1', 'D1', 'TA1', 'TF1', 'B2', 'G2', 'D2', 'TA2', 'TF2'];
    var wednesdayTheory = ['C1', 'F1', 'E1', 'TB1', 'TG1', 'C2', 'F2', 'E2', 'TB2', 'TG2'];
    var thursdayTheory = ['D1', 'A1', 'F1', 'C1', 'TE1', 'D2', 'A2', 'F2', 'C2', 'TE2'];
    var fridayTheory = ['E1', 'B1', 'G1', 'D1', 'TC1', 'E2', 'B2', 'G2', 'D2', 'TC2'];
    var mondayLab = ['1', '2', '3', '4', '5', '6', '31', '32', '33', '34', '35', '36'];
    var tuesdayLab = ['7', '8', '9', '10', '11', '12', '37', '38', '39', '40', '41', '42'];
    var wednesdayLab = ['13', '14', '15', '16', '17', '18', '43', '44', '45', '46', '47', '48'];
    var thursdayLab = ['19', '20', '21', '22', '23', '24', '49', '50', '51', '52', '53', '54'];
    var fridayLab = ['25', '26', '27', '28', '29', '30', '55', '56', '57', '58', '59', '60'];
    var token = req.param('token');
    var database;
    var onAllClasses = function (err, results) {
        if (err) {
        }
        else {
            for(var i = 0; i < results.length; i++){
                var slot = results[i].slot;
                var cnum = results[i].cnum;
                if (slot.indexOf("L") == -1){
                    if((tempval = mondayTheory.indexOf(slot)) != -1)
                        mondayTheory[tempval] = cnum;
                    if((tempval = tuesdayTheory.indexOf(slot)) != -1)
                        tuesdayTheory[tempval] = cnum;
                    if((tempval = wednesdayTheory.indexOf(slot)) != -1)
                        wednesdayTheory[tempval] = cnum;
                    if((tempval = thursdayTheory.indexOf(slot)) != -1)
                        thursdayTheory[tempval] = cnum;
                    if((tempval = fridayTheory.indexOf(slot)) != -1)
                        fridayTheory[tempval] = cnum;
                }
                else{
                    slot = slot.split("L");
                    for(var j = 0; j < slot.length ; j++){
                        slot[j] = slot[j].replace('+', '');
                        slot[j] = slot[j].trim();
                        if((tempval = mondayLab.indexOf(slot[j])) != -1)
                            mondayLab[tempval] = cnum;
                        if((tempval = tuesdayLab.indexOf(slot[j])) != -1)
                            tuesdayLab[tempval] = cnum;
                        if((tempval = wednesdayLab.indexOf(slot[j])) != -1)
                            wednesdayLab[tempval] = cnum;
                        if((tempval = thursdayLab.indexOf(slot[j])) != -1)
                            thursdayLab[tempval] = cnum;
                        if((tempval = fridayLab.indexOf(slot[j])) != -1)
                            fridayLab[tempval] = cnum;
                    }
                }
            }
            var monday = [], tuesday = [], wednesday = [], thursday = [], friday = [];
            for(var j = 0; j < 12; j++){
                if(j == 5 || j == 11) {
                    if(parseInt(mondayLab[j]) >= 1000)
                        monday.push(mondayLab[j]);
                    else
                        monday.push('0');
                    if(parseInt(tuesdayLab[j]) >= 1000)
                        tuesday.push(tuesdayLab[j]);
                    else
                        tuesday.push('0');
                    if(parseInt(wednesdayLab[j]) >= 1000)
                        wednesday.push(wednesdayLab[j]);
                    else
                        wednesday.push('0');
                    if(parseInt(thursdayLab[j]) >= 1000)
                        thursday.push(thursdayLab[j]);
                    else
                        thursday.push('0');
                    if(parseInt(fridayLab[j]) >= 1000)
                        friday.push(fridayLab[j]);
                    else
                        friday.push('0');
                }
                else {
                    if(parseInt(mondayLab[j]) >= 1000)
                        monday.push(mondayLab[j]);
                    else if(parseInt(mondayTheory[j]) >= 1000)
                        monday.push(mondayTheory[j]);
                    else
                        monday.push('0');

                    if(parseInt(tuesdayLab[j]) >= 1000)
                        tuesday.push(tuesdayLab[j]);
                    else if(parseInt(tuesdayTheory[j]) >= 1000)
                        tuesday.push(tuesdayTheory[j]);
                    else
                        tuesday.push('0');

                    if(parseInt(wednesdayLab[j]) >= 1000)
                        wednesday.push(wednesdayLab[j]);
                    else if(parseInt(wednesdayTheory[j]) >= 1000)
                        wednesday.push(wednesdayTheory[j]);
                    else
                        wednesday.push('0');

                    if(parseInt(thursdayLab[j]) >= 1000)
                        thursday.push(thursdayLab[j]);
                    else if(parseInt(thursdayTheory[j]) >= 1000)
                        thursday.push(thursdayTheory[j]);
                    else
                        thursday.push('0');

                    if(parseInt(fridayLab[j]) >= 1000)
                        friday.push(fridayLab[j]);
                    else if(parseInt(fridayTheory[j]) >= 1000)
                        friday.push(fridayTheory[j]);
                    else
                        friday.push('0');
                }
            }
            res.json({'monday': monday, 'tuesday': tuesday, 'wednesday': wednesday, 'thursday': thursday, 'friday': friday});
        }
    };
    var onFindClass = function (cnum, callback) {
        database.collection('classes').findOne({'cnum': cnum}, callback);
    };
    var onTokenFound = function (err, item) {
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
            db.collection('teachers').findOne({'token': token}, onTokenFound);
        }
    };
    mongoClient.connect(mongoUri, onConnect);
};

var postMarks = function(req, res) {
    var marks = req.body.marks;
    var cnum = req.body.cnum;
    var exam = req.body.exam;
    var markstemp = [], database;
    for(var i = 0; i < marks.length; i++) {
        markstemp.push(JSON.parse(marks[i]));
    }
    marks = markstemp;
    var onMarksPost = function(err, result) {
        if(err) {
            //Replace with appropriate failure response
        }
        else {
            //Replace with appropriate success response
            res.json(result);
        }
    };
    var onClassFind = function(err, item) {
        if(err) {}
        else {
            var students = item.students;
            for(var i = 0; i < marks.length; i++) {
                for(var j = 0; j < students.length; j++) {
                    if(marks[i].regno == students[j].regno) {
                        if(exam == 'cat1') students[j].cat1 = marks[i].cat1;
                        if(exam == 'cat2') students[j].cat2 = marks[i].cat2;
                        if(exam == 'quiz1') students[j].quiz1 = marks[i].quiz1;
                        if(exam == 'quiz2') students[j].quiz2 = marks[i].quiz2;
                        if(exam == 'quiz3') students[j].quiz3 = marks[i].quiz3;
                        if(exam == 'assignment') students[j].assignment = marks[i].assignment;
                        if(exam == 'tee') students[j].tee = marks[i].tee;
                        if(exam == 'lab') students[j].lab = marks[i].lab;
                    }
                }
            }
            database.collection('classes').update({'cnum': cnum}, {$set: {'students': students}}, onMarksPost);
        }
    };
    var onConnect = function(err, db) {
        if(err) {}
        else {
            database = db;
            db.collection('classes').findOne({'cnum': cnum}, onClassFind);
        }
    };
    mongoClient.connect(mongoUri, onConnect);
};

var getMarks = function(req, res) {
    var cnum = req.body.cnum;
    var exam = req.body.exam;
    console.log(cnum);
    console.log(exam);
    var onClassFind = function(err, item) {
        if(err) {}
        else {
            var responseStudents = [];
            var students = item.students;
            for(var i = 0; i < students.length; i++) {
                var responseStudent = {'regno': students[i].regno};
                if(exam == 'cat1') responseStudent.cat1 = students[i].cat1;
                if(exam == 'cat2') responseStudent.cat2 = students[i].cat2;
                if(exam == 'quiz1')responseStudent.quiz1 = students[i].quiz1;
                if(exam == 'quiz2')responseStudent.quiz2 = students[i].quiz2;
                if(exam == 'quiz3') responseStudent.quiz3 = students[i].quiz3;
                if(exam == 'assignment') responseStudent.assignment = students[i].assignment;
                if(exam == 'tee') responseStudent.tee = students[i].tee;
                if(exam == 'lab') responseStudent.lab = students[i].lab;
                responseStudents.push(responseStudent);
            }
            res.json({"students": responseStudents});
        }
    };
    var onConnect = function(err, db) {
        if(err) {}
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
router.post('/getclassattendance', getClassAttendance);
router.post('/getTimeTable', getTimeTable);
router.post('/postmarks', postMarks);
router.post('/getmarks', getMarks);

module.exports = router;
