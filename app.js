const express = require('express'); // for using router
const mongoose = require('mongoose'); //for easy manipulation of data and database
const cors = require('cors');
const bodyParser = require('body-parser');
const Employee = require('./models/employee');
const {addValidation, loginValidation} = require('./validation'); //to validate data before submission
const bcrypt = require('bcryptjs'); //for encrypting the password
const jwt = require('jsonwebtoken'); //for using Json Web Tokens
require('dotenv/config'); // for accessing the .env file which holds the details for the database connection
mongoose.set('useFindAndModify', false);
const Rota = require('./models/rota');
const moment = require('moment');




// Instantiate express and Router services
const app = express();
const router = express.Router();
app.use(cors());
app.use(bodyParser.json());





// Email service /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
async function main(useremail, password) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "hatapptesting@gmail.com", // generated ethereal user
      pass: "Hattapptesting123"// generated ethereal password
    }
  });
  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"The Hat-App " <HatAppTesting@gmail.com>', // sender address
    to: useremail, // list of receivers
    subject: "Hi from @Hat-App", // Subject line
    text: "Hi There! See below your login details for the Hat-App", // plain text body
    html: "<b>Your Username: "+useremail+" and the Password: "+password+"</b>" // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
}


// Instantiate express and Router services////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// Connect to db
mongoose.connect(
    process.env.DB_CONNECT,
    { useNewUrlParser: true, useUnifiedTopology: true }, () => {
        console.log('Connected to the DB');
    });


// Middlewares - functions that will execute in the background whenever hitting a specific route
//this is just an example - whenever hitting the /posts the below console.log will run.
app.use('/posts', () => {
    console.log('Posts middleware running!');
});


/////////////////////////////////////////////////////////////////////Routes////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Endpoint for login for all users/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.route('/login').post(async (req, res) =>{
    
    //validate data before submitting
    const {error} = loginValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    
    //check if email exists
    const employee = await Employee.findOne({ email: req.body.email });
    if(!employee) return res.status(400).send('Email not found!');
    
    //Check if password is correct
    const validPassword = await bcrypt.compare(req.body.password, employee.password);
    if(!validPassword) return res.status(400).send('Password is invalid!');

    //Create a jsonWebToken
    const token = jwt.sign({_id: employee._id}, process.env.TOKEN_SECRET);

    
    //set the token to the header and send the employee json object over to the frontend
    res.json(employee);
});

//Endpoints for clients////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Endpoint for requesting staff by date

router.route('/request/:date').post(async (req, res, next) => {
    Employee.findById({_id: req.body.id}, (err, emp) =>{
        if(!emp){
            res.send(err);
        } else {
            emp.requests.push({date: req.params.date, time: req.body.time, numberOfpeopleRequested: req.body.numberOfpeople, numberOfpeopleDelivered: 'waiting...'})
            emp.save();
            res.send('Request was successfuly added!');
        }
    });
});


//Endpoint for clocking IN the employees
router.route('/client/start').post(async (req, res, next) => {
    //find schedule of employee using its ID
    Rota.findOne({employeeID: req.body.employeeID}, (err, schedule) =>{
        if(!schedule){

            //create new rota object in case the person never scanned before
            let rota = new Rota();
            rota.employeeID = req.body.employeeID;
            clientName = req.body.clientName;
            rota.status = true;
            dateTimeNow = new Date();
            stringDate = dateTimeNow.toString();
            rota.records.push({clientName: clientName, typeOfScan: "start", dateTime: stringDate});
            //save the new object into the database
            rota.save();
            res.json(req.body.employeeID);
        }
        else
            if(schedule.status)
            //if person scanned in but did not scan out = cannot scan in again until scanning out.
                res.json([{error: 'Person is currently scanned IN!'},{ Started_at: schedule.records[schedule.records.length-1].dateTime}]);
            else{
            // new scan can be added to the database for the person
                let clientName = req.body.clientName;
                let dateTimeNow = new Date();
                let stringDate = dateTimeNow.toString();
                let typeOfScan = "start";
                schedule.status = !schedule.status;
                schedule.records.push({ clientName: clientName,  typeOfScan: typeOfScan, dateTime: stringDate});
                schedule.save().then(schedule => {
                    res.status(200).json([{error: 'n/a'}, schedule]);
            })
            .catch(err => {
                res.status(400).send('Unable to add new record. Please contact your administrator for help!');
            });
        }
    });
});

//Endpoint for adding clocking OUT the employees
router.route('/client/finish').post(async (req, res, next) => {
    //find schedule of employee using its ID
    Rota.findOne({employeeID: req.body.employeeID}, (err, schedule) =>{
        if(!schedule){

            return next(new Error("This person never worked! He must be scanned IN before scanning OUT!"));
        }
        else
        if(!schedule.status)
            res.json([{error: 'Person is currently scanned OUT!'},{ Finished_at: schedule.records[schedule.records.length-1].dateTime}]);
        else{
            let clientName = req.body.clientName;
            let dateTime = new Date();
            let stringDate = dateTime.toString();
            let typeOfScan = "finish";
            schedule.status = !schedule.status;
            schedule.records.push({clientName: clientName, typeOfScan: typeOfScan, dateTime: stringDate});
            schedule.save().then(schedule => {
                res.status(200).json([{error: 'n/a'}, schedule]);
            })
            .catch(err => {
                res.status(400).send('Unable to add new record. Please contact your administrator for help!');
            });
        }
    });
});

//Endpoint for getting all records of a specific client
router.route('/record/:clientName').get((req, res) => {
    let newArray = [];
    stringName = req.params.clientName.toString();
    Rota.find({records : { $elemMatch: {clientName: stringName } } }, (err, all) =>{
        if(err)
            res.json(err);
        else if (!all)
            res.sendStatus(404).send('Nothing was found. . .');
        else
        console.log(all);
        all.forEach(element => {
            element.records.forEach(item => {
                if(item.clientName === stringName){
                    newArray.push({employeeID: element.employeeID, type: item.typeOfScan, dateTime: item.dateTime});
                }
            });
        });
            res.json(newArray);
    });
});



//Endpoint for getting all records of a specific employee
router.route('/empRecord/:empID').get((req, res) =>{
    Rota.find({employeeID: req.params.empID}, (err, all) =>{
        if(err)
            res.json(err);
        else if(!all)
            res.sendStatus(404).send('Nothing was found. . .');
        else {
            res.json(all);
        }
    });
});

// Endpoints for admins ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Endpoint for getting all employees
router.route('/employees').get((req, res) => {
    Employee.find((err, employees) => {
        if(err)
            console.log(err);
        else
            res.json(employees);
    });
});

// Endpoint for getting a single employee by the ID
router.route('/employees/:id').get((req, res) => {
    Employee.findById(req.params.id, (err, employee) => {
        if(err)
        console.log(err);
        else
        res.json(employee);
    });
});

// Endpoint for adding new employees
router.route('/employees/add').post(async (req, res) => {

    //Validate data before submitting
    const {error} = addValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    // Checking if use already exists by searching for the email
    const checkEmail = await Employee.findOne({ email: req.body.email });
    if(checkEmail) return res.status(400).send('Email is already in use!');

    // Hash the password
    const salt = await bcrypt.genSalt(10); //generate salt
    const hashPassword = await bcrypt.hash(req.body.password, salt); // hash the password with the salt

    // Create the new employee record
    let employee = new Employee(req.body);
    let newDate = new Date();
    let stringDate = newDate.toString();

    //add empty schedule record for newly created employee
    employee.records.push({sunday_startOfWeekDate: "Null",
    sunday: 'not set',
    monday: 'not set',
    tuesday: 'not set',
    wednesday: 'not set',
    thursday: 'not set',
    friday: 'not set',
    saturday: 'not set'});
    clientName = employee.assignment;

    let rota = new Rota();
    rota.employeeID = employee._id;
    rota.status = false;
    rota.records.push({clientName: clientName, typeOfScan: "Welcome Scan", dateTime: stringDate});
    rota.save();

    //add hashPassword to the object before saving it
    employee.password = hashPassword;
    employee.save()
        .then(employee => {
            res.status(200).json({status: "success"});
            main(employee.email.toString(), req.body.password.toString()).catch(console.error);

        })
        .catch(err => {
            res.status(400).send('Failed to create a new record');
        });
});

// Endpoint for updating an existing employee record using the ID
router.route('/employees/update/:id').post((req, res, next) => {

    //return the employee by it's ID from the database
    Employee.findById(req.params.id, (err, employee) => {
        if(!employee)
            return next(new Error('Could not load document!'));
        else{
            //assign new valued to the employee record using the values from the request body
            employee.name = req.body.name;
            employee.surname = req.body.surname;
            employee.email = req.body.email;
            employee.assignment = req.body.assignment;
            employee.status = req.body.status;
            
            //update the data into the database
            employee.save().then(employee => {
                res.json('Update successful!');
            }).catch(err => {
                res.status(400).send('Update failed!');
            });
        }
    });
});

//Endpoint for deleting an employee
router.route('/employees/delete/:id').get((req, res) => {
    //find record using the ID and remove it
    Employee.findByIdAndRemove({_id: req.params.id}, (err, employees) => {
        if(err)
            res.json(err);
        else
            res.json('Employee was removed from your database');
    });;
});

//Endpoint for adding work schedule for an employee
router.route('/addRota').post((req, res, next) => {

    // get employee by ID
    Employee.findById({_id: req.body.id}, (err, employee) => {

        if(!employee){
            console.log("no employee");
            return next(new Error('Could not load document!'));
        } else{
            //assign new valued to the employee record using the values from the request body
            employee.records.push({sunday_startOfWeekDate: req.body.startOfWeek,
                sunday: req.body.sunday,
                monday: req.body.monday,
                tuesday: req.body.tuesday,
                wednesday: req.body.wednesday,
                thursday: req.body.thursday,
                friday: req.body.wednesday,
                saturday: req.body.saturday});
            //update the data into the database
            employee.save().then(employee => {
                res.json(employee.records[employee.records.length-1]);
            }).catch(err => {
                res.status(400).send('Update failed!');
            });
        }
    });
});



//Endpoint for getting all the records for all employees and clients

router.route('/scans').get((req, res) => {
    Rota.find((err, schedules) => {
        if(err)
            res.json({message: "No records found"});
        else
            res.json(schedules);
    });
});



//Endpoint for employees////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//Endpoint for getting schedule based on date

router.route('/employees/rota/:idDateRequest').get((req, res) =>{
    startDate = req.params.idDateRequest.split('"')[1];
    id = req.params.idDateRequest.split('"')[0];

    Employee.findOne({_id: id } , { records: { $elemMatch: { sunday_startOfWeekDate : startDate } } } ,(err, response) => {

        if(!response)
            res.send("No records found!");
        else
            res.json(response.records);
    });

});


// Endpoint for getting all records/schedules of one person

router.route('/employees/getSchedules/:id').get((req, res) =>{
    Employee.findById({ _id: req.params.id }, (err, record) =>{
        if(err)
            res.json(err);
        else if(!record)
            res.json({message: 'You have not received any schedules yet . . .'});
        else
        res.json(record);
    });
});


// Endpoint for requesting new fill rate by date
router.route('/new-request').post((req, res) =>{
    Employee.findById({_id: req.body.id }, (err, record) =>{
        if(err)
            res.json(err);
        else if(!record)
            res.json({message: 'Cannot load object . . .'});
        else {
            record.requests.push({date: req.body.date, number: req.body.number, comment: req.body.comment});
            record.save().then(response => {res.json({message:'Request successfuly sent!'})}, err => {res.json(err)});
        }
    });
});


//Endpoint for home/localhost
app.use('/', router);


//Start listenning to the server
app.listen(3000);
