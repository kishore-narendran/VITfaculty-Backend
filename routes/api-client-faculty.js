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
}

var getAccessToken = function(req, res) {
    var employeeID = req.body.employee_id;
    var passwordHash = req.body.password_hash;
    var token;
    var onUpdate = function(err, result) {
        if(err) {
            res.json({result: status.failure});
        }
        else {
            res.json({result: status.success, token: token});
        }
    }
    var onFind = function(err, result) {
        if(err) {
            res.json({result: status.failure});
        }
        else if(result == null){
            res.json({result: status.incorrectCredentials});
        }
        else {
            token = tokenGenerator(6, '#aA');
            req.db.collection('teachers').update({employee_id: employeeID, password_hash: passwordHash}, {$set: {token: token}}, onUpdate)
        }
    }
    req.db.collection('teachers').findOne({employee_id: employeeID, password_hash: passwordHash}, onFind);
};

router.post('/getaccesstoken', getAccessToken);

module.exports = router;
