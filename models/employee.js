const mongoose = require('mongoose');



const Schema = mongoose.Schema;

let Employee = new Schema({
    name: {
        type: String,
        required: true,
    },
    surname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        max: 255,
        min: 6
    },
    password: {
        type: String,
        max: 1024,
        min: 6
    },
    //where is the employee working, what client is he working with
    assignment: {
        type: String,
        max: 1024,
        min:3
    },
    //Active or inactive
    status: {
        type: String,
    },
    records: [
        {
            sunday_startOfWeekDate: String,
            sunday: String,
            monday: String,
            tuesday: String,
            wednesday: String,
            thursday: String,
            friday: String,
            saturday: String
        }
    ],
    clientName: {
        type: String
    },
    requests: [{
        date: {
            type: String
        },
        time: {
            type: String
        },
        numberOfpeopleRequested: {
            type: String
        },
        numberOfpeopleDelivered: {
            type: String
        }

    }]
});
module.exports = mongoose.model('Employee', Employee);

