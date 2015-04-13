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

var slots = {
  
  theory: {
    monday: ['A1', 'F1', 'C1', 'E1', 'TD1', 'A2', 'F2', 'C2', 'E2', 'TD2'],
    tuesday: ['B1', 'G1', 'D1', 'TA1', 'TF1', 'B2', 'G2', 'D2', 'TA2', 'TF2'],
    wednesday: ['C1', 'F1', 'E1', 'TB1', 'TG1', 'C2', 'F2', 'E2', 'TB2', 'TG2'],
    thursday: ['D1', 'A1', 'F1', 'C1', 'TE1', 'D2', 'A2', 'F2', 'C2', 'TE2'],
    friday: ['E1', 'B1', 'G1', 'D1', 'TC1', 'E2', 'B2', 'G2', 'D2', 'TC2']
  },

  lab: {
    monday: ['1', '2', '3', '4', '5', '6', '31', '32', '33', '34', '35', '36'],
    tuesday: ['7', '8', '9', '10', '11', '12', '37', '38', '39', '40', '41', '42'],
    wednesday: ['13', '14', '15', '16', '17', '18', '43', '44', '45', '46', '47', '48'],
    thursday: ['19', '20', '21', '22', '23', '24', '49', '50', '51', '52', '53', '54'],
    friday: ['25', '26', '27', '28', '29', '30', '55', '56', '57', '58', '59', '60']
  }
}

module.exports = slots;
