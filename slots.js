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
        monday: ['A1', 'F1', 'C1', 'E1', 'TD1', 'X', 'A2', 'F2', 'C2', 'E2', 'TD2', 'X'],
        tuesday: ['B1', 'G1', 'D1', 'TA1', 'TF1', 'X', 'B2', 'G2', 'D2', 'TA2', 'TF2', 'X'],
        wednesday: ['C1', 'F1', 'E1', 'TB1', 'TG1', 'X', 'C2', 'F2', 'E2', 'TB2', 'TG2', 'X'],
        thursday: ['D1', 'A1', 'F1', 'C1', 'TE1', 'X', 'D2', 'A2', 'F2', 'C2', 'TE2', 'X'],
        friday: ['E1', 'B1', 'G1', 'D1', 'TC1', 'X', 'E2', 'B2', 'G2', 'D2', 'TC2', 'X']
    },

    lab: {
        monday: ['1', '2', '3', '4', '5', '6', '31', '32', '33', '34', '35', '36'],
        tuesday: ['7', '8', '9', '10', '11', '12', '37', '38', '39', '40', '41', '42'],
        wednesday: ['13', '14', '15', '16', '17', '18', '43', '44', '45', '46', '47', '48'],
        thursday: ['19', '20', '21', '22', '23', '24', '49', '50', '51', '52', '53', '54'],
        friday: ['25', '26', '27', '28', '29', '30', '55', '56', '57', '58', '59', '60']
    },

    'A1': ['monday', 'thursday'],
    'A1+TA1': ['monday', 'tuesday', 'thursday'],
    'A2': ['monday', 'thursday'],
    'A2+TA2': ['monday', 'tuesday', 'thursday'],
    'B1': ['tuesday', 'friday'],
    'B1+TB1': ['tuesday', 'wednesday', 'friday'],
    'B2': ['tuesday', 'friday'],
    'B2+TB2': ['tuesday', 'wednesday', 'friday'],
    'C1': ['monday', 'wednesday', 'thursday'],
    'C1+TC1': ['monday', 'wednesday', 'thursday', 'friday'],
    'C2': ['monday', 'wednesday', 'thursday'],
    'C2+TC2': ['monday', 'wednesday', 'thursday', 'friday'],
    'D1': ['tuesday', 'thursday', 'friday'],
    'D1+TD1': ['monday', 'tuesday', 'thursday', 'friday'],
    'E1': ['monday', 'wednesday', 'friday'],
    'E1+TE1': ['monday', 'wednesday', 'thursday', 'friday'],
    'E2': ['monday', 'wednesday', 'friday'],
    'E2+TE2': ['monday', 'wednesday', 'thursday', 'friday'],
    'F1': ['monday', 'wednesday', 'thursday'],
    'F1+TF1': ['monday', 'tuesday', 'wednesday', 'thursday'],
    'F2': ['monday', 'wednesday', 'thursday'],
    'F2+TF2': ['monday', 'tuesday', 'wednesday', 'thursday'],
    'G1': ['tuesday', 'friday'],
    'G1+TG1': ['tuesday', 'wednesday', 'friday'],
    'G2': ['tuesday', 'friday'],
    'G2+TG2': ['tuesday', 'wednesday', 'friday']
};

module.exports = slots;
