import { Joi, Segments } from 'celebrate';

export const registerUserSchema = {
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is a required field',
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must be at most 20 characters long',
      'any.required': 'Password is a required field',
    }),
  }),
};

export const loginUserSchema = {
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is a required field',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is a required field',
    }),
  }),
};
