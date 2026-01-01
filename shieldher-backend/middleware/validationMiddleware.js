const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: error.details.map(detail => detail.message) 
      });
    }
    next();
  };
};

const schemas = {
  register: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
  sos: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    type: Joi.string().valid('emergency', 'harassment', 'medical').default('emergency')
  }),
  friendRequest: Joi.object({
    senderId: Joi.number().integer().required()
  })
};

module.exports = { validateRequest, schemas };