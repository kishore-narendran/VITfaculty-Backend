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

var status = {
  success: {
    message: 'Successful execution',
    code: 1
  },
  failure: {
    message: 'Failure',
    code: 0
  },
  incorrectCredentials: {
    message: 'Incorrect credentials',
    code: 11
  },
  invalidToken: {
    message: 'Invalid token',
    code: 12
  },
  semesterNotFound: {
    message: 'Semester not found',
    code: 13
  },
  dateNotFound: {
    message: 'Date not found',
    code: 14
  }
}

module.exports = status;
