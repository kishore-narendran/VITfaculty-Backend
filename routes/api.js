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
var path = require('path');
var router = express.Router();
var status = require(path.join(__dirname, '..', 'status'));

var randomString = function(length, chars) {
    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.round(Math.random() * (mask.length - 1))];
    return result;
}

var checkDateBefore = function (date1, date2) {
    var year1 = date1.getFullYear();
    var month1 = date1.getMonth();
    var date1 = date1.getDate();
    var year2 = date2.getFullYear();
    var month2 = date2.getMonth();
    var date2 = date2.getDate();
    if(year2 > year1) {return true;}
    else if(year1 == year2) {
        if(month1 < month2) {return true;}
        else if(month1 == month2) {
            if(date1 <= date2) {return true;}
            else {return false;}
        }
        else {return false;}
    }
    else {return false;}
};

var getDateString = function (datevar) {
    var year = datevar.getFullYear();
    var month = datevar.getMonth();
    var date = datevar.getDate();
    var stringDate = year.toString();
    if(month < 10)
        stringDate = stringDate+"-0"+month.toString();
    else
        stringDate = stringDate+"-"+month.toString();
    if(date < 10)
        stringDate = stringDate+"-0"+date.toString();
    else
        stringDate = stringDate+"-"+date.toString();
    return stringDate;
}

var getAccessToken = function (req, res) {
    var empid = req.body.empid;
    var passHash = req.body.passwordhash;
    var token;
    var onUpdate = function (err, result) {
        if (err) {
            res.json({status: status.failure})
        }
        else {
            res.json({result: status.success, token: token});
        }
    };
    var onFind = function (err, items) {
        if (err) {
        }
        else if (items.length == 0) {
            res.json({result: status.incorrectCredentials});
        }
        else {
            token = randomString(6, '#aA');
            req.db.collection('teachers').update({'empid': empid}, {$set: {token: token}}, onUpdate);
        }
    };
    req.db.collection('teachers').find({'empid': empid, 'passwordhash': passHash}).toArray(onFind);
};

var getClasses = function (req, res) {
    var token = req.body.token;
    var classes = [];
    var onAllClasses = function (err, results) {
        if (err) {
            res.json({status: status.failure})
        }
        else {
            res.json({status: status.success, classes: results});
        }
    };
    var onFindClass = function (cnum, callback) {
        req.db.collection('classes').findOne({'cnum': cnum}, callback);
    };
    var onFind = function (err, item) {
        if (err) {
            res.json({status: status.failure})
        }
        else if (item) {
            var cnums = item.cnums;
            async.map(cnums, onFindClass, onAllClasses);
        }
        else {
            res.json({status: status.invalidToken})
        }
    };
    req.db.collection('teachers').findOne({'token': token}, onFind);
};

var postAttendance = function (req, res) {
    var cnum = req.body.cnum;
    var date = req.body.date;
    var present = req.body.present;
    var absent = req.body.absent;
    var token = req.body.token;
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
            res.json({result: status.failure});
        }
        else {
            res.json({result: status.success});
        }
    };
    var onClassFind = function (err, result) {
        if (err) {
            res.json({result: status.failure});
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
            req.db.collection('classes').update({'cnum': cnum}, {$set: {'history': history, 'students': students, 'total': total}}, onUpdate);
        }
    };
    req.db.collection('classes').findOne({'cnum': cnum}, onClassFind);
};

var getClassAttendanceByDate = function (req, res) {
    var date = req.body.date;
    var cnum = req.body.cnum;
    var onClassFind = function (err, result) {
        if (err) {
            res.json({status: status.failure});
        }
        else {
            var history = result.history;
            var i;
            for (i = 0; i < history.length; i++) {
                if (history[i].date == date) {
                    history[i].result = status.success;
                    res.json(history[i]);
                    break;
                }
            }
            if(i == history.length) {
              res.json({result: status.failure});
            }
        }
    };
    req.db.collection('classes').findOne({'cnum': cnum}, onClassFind);
};

var getClassAttendance = function(req, res) {
    var cnum = req.body.cnum;
    var onClassFind = function(err, result) {
        if(err) {
            res.json({result: status.failure});
        }
        else {
            var history = result.history;
            history.result = 'success';
            res.json({result: result.success, history: history});
        }
    };
    req.db.collection('classes').findOne({'cnum': cnum}, onClassFind);
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
    var token = req.body.token;
    var onAllClasses = function (err, results) {
        if (err) {
            res.json({result: status.failure});
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
            res.json({result: status.success, monday: monday, tuesday: tuesday, wednesday: wednesday, thursday: thursday, friday: friday});
        }
    };
    var onFindClass = function (cnum, callback) {
        req.db.collection('classes').findOne({'cnum': cnum}, callback);
    };
    var onTokenFound = function (err, item) {
        if (err) {
            res.json({result: status.success})
        }
        else if (item) {
            var cnums = item.cnums;
            async.map(cnums, onFindClass, onAllClasses);
        }
        else {
            res.json({result: status.invalidToken})
        }
    };
    req.db.collection('teachers').findOne({'token': token}, onTokenFound);
};

var postMarks = function(req, res) {
    var marks = req.body.marks;
    var cnum = req.body.cnum;
    var exam = req.body.exam;
    var markstemp = [];
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
            req.db.collection('classes').update({'cnum': cnum}, {$set: {'students': students}}, onMarksPost);
        }
    };
    req.db.collection('classes').findOne({'cnum': cnum}, onClassFind);
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
    req.db.collection('classes').findOne({'cnum': cnum}, onClassFind);
};

var getDates = function(req, res) {
    var semester = req.body.semester;
    var year = req.body.year;
    var startdate = req.body.startdate;
    var slot = req.body.slot;
    var onSemesterFind = function(err, item) {
        if(err) {}
        else{
            var dates = [];
            var enddate = item.enddate;
            enddate = new Date(enddate);
            startdate = new Date(startdate);
            switch(slot) {
                case "A1":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 1 || startdate.getDay() == 4)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "A2":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 1 || startdate.getDay() == 4)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "A1+TA1":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 1 || startdate.getDay() == 2 || startdate.getDay() == 4)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "A2+TA2":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 1 || startdate.getDay() == 2 || startdate.getDay() == 4)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "B1":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 2 || startdate.getDay() == 5)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "B2":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 2 || startdate.getDay() == 5)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "B1+TB1":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 2 || startdate.getDay() == 3 || startdate.getDay() == 5)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "B2+TB2":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 2 || startdate.getDay() == 3 || startdate.getDay() == 5)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "C1":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 1 || startdate.getDay() == 3 || startdate.getDay() == 4)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "C2":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 1 || startdate.getDay() == 3 || startdate.getDay() == 4)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "C1+TC1":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 1 || startdate.getDay() == 3 || startdate.getDay() == 4 || startdate.getDay() == 5)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "C2+TC2":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 1 || startdate.getDay() == 3 || startdate.getDay() == 4 || startdate.getDay() == 5)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "D1":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 2 || startdate.getDay() == 4 || startdate.getDay() == 5)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "D2":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 2 || startdate.getDay() == 4 || startdate.getDay() == 5)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "D1+TD1":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 2 || startdate.getDay() == 4 || startdate.getDay() == 5 || startdate.getDay() == 1)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "D2+TD2":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 2 || startdate.getDay() == 4 || startdate.getDay() == 5 || startdate.getDay() == 1)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "E1":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 1 || startdate.getDay() == 3 || startdate.getDay() == 5)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "E2":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 1 || startdate.getDay() == 3 || startdate.getDay() == 5)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "E1+TE1":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 1 || startdate.getDay() == 3 || startdate.getDay() == 5 || startdate.getDay() == 4)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "E2+TE2":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 1 || startdate.getDay() == 3 || startdate.getDay() == 5 || startdate.getDay() == 4)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "F1":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 1 || startdate.getDay() == 3 || startdate.getDay() == 4)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "F2":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 1 || startdate.getDay() == 3 || startdate.getDay() == 4)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "F1+TF1":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 1 || startdate.getDay() == 3 || startdate.getDay() == 4 || startdate.getDay() == 2)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "F2+TF2":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 1 || startdate.getDay() == 3 || startdate.getDay() == 4 || startdate.getDay() == 2)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "G1":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 2 || startdate.getDay() == 5)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "G2":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 2 || startdate.getDay() == 5)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "G1+TG1":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 2 || startdate.getDay() == 5 || startdate.getDay() == 3)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                case "G2+TG2":
                    while(checkDateBefore(startdate, enddate)) {
                        if(startdate.getDay() == 2 || startdate.getDay() == 5 || startdate.getDay() == 3)
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
                default:
                    slot = slot.split("L");
                    var labdays = {monday: false, tuesday: false, wednesday: false, thursday: false, friday: false}
                    for(var i = 0; i < slot.length; i++) {
                        slot[i] = slot[i].replace("+", "");
                        slot[i] = slot[i].replace(" ", "");
                        slot[i] = parseInt(slot[i]);
                        if((slot[i] >= 1 && slot[i] <= 6) || (slot[i] >= 31 && slot[i] <= 36))
                            labdays.monday = true;
                        else if((slot[i] >= 7 && slot[i] <= 12) || (slot[i] >= 37 && slot[i] <= 42))
                            labdays.tuesday = true;
                        else if((slot[i] >= 13 && slot[i] <= 18) || (slot[i] >= 33 && slot[i] <= 48))
                            labdays.wednesday = true;
                        else if((slot[i] >= 19 && slot[i] <= 24) || (slot[i] >= 49 && slot[i] <= 54))
                            labdays.thursday = true;
                        else if((slot[i] >= 25 && slot[i] <= 30) || (slot[i] >= 55 && slot[i] <= 60))
                            labdays.friday = true;
                    }
                    while(checkDateBefore(startdate, enddate)) {
                        if((startdate.getDay() == 1 && labdays.monday) || (startdate.getDay() == 2 && labdays.tuesday) || (startdate.getDay() == 3 && labdays.wednesday) || (startdate.getDay() == 4 && labdays.thursday) || (startdate.getDay() == 5 && labdays.friday))
                            dates.push(getDateString(startdate));
                        startdate.setDate(startdate.getDate() + 1);
                    }
                    break;
            }
            res.json({"dates": dates});
        }
    };
    req.db.collection('semesters').findOne({'semester': semester+year}, onSemesterFind);
};

router.post('/getaccesstoken', getAccessToken);
router.post('/getclasses', getClasses);
router.post('/postattendance', postAttendance);
router.post('/getclassattendancedate', getClassAttendanceByDate);
router.post('/getclassattendance', getClassAttendance);
router.post('/getTimeTable', getTimeTable);
router.post('/postmarks', postMarks);
router.post('/getmarks', getMarks);
router.post('/getdates', getDates);
module.exports = router;
