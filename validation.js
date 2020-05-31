const Joi = require('@hapi/joi');

// User ADD validation

const addValidation = data => {
    
    const schema = Joi.object({
        name: Joi.string().min(2).required(),
        surname: Joi.string().min(2).required(),
        email: Joi.string().email().required().min(6),
        password: Joi.string().min(8).required(),
        assignment: Joi.string().min(3).required(),
        status: Joi.string().required(),
        records: Joi.array(),
        clientName: Joi.string(),
        requests: Joi.array()
    });
    return schema.validate(data);
};



// User login validation

const loginValidation = data => {
    
    const schema = Joi.object({
        email: Joi.string().email().required().min(6),
        password: Joi.string().min(6).required(),
    });
    return schema.validate(data);
};


module.exports.addValidation = addValidation;
module.exports.loginValidation = loginValidation;

