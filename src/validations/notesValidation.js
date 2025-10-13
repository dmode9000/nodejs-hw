import { Joi, Segments } from 'celebrate';
import { isValidObjectId } from 'mongoose';
import { TAGS } from '../constants/tags.js';

// custom validator for ObjectId
const objectIdValidator = (value, helpers) => {
  return !isValidObjectId(value) ? helpers.message('Invalid id format') : value;
};

// base body schemas to reuse
const bodySchemaBase = Joi.object({
  title: Joi.string().min(1).messages({
    'string.min': 'Title must be at least 1 characters long',
  }),
  content: Joi.string().allow(''),
  tag: Joi.string()
    .valid(...TAGS)
    .messages({
      'any.only': `Tag must be one of the following values: ${TAGS.join(', ')}`,
    }),
});

// base noteId schema to reuse
const noteIdSchemaBase = Joi.object({
  noteId: Joi.string().custom(objectIdValidator).required().messages({
    'string.required': 'noteId is a required field',
  }),
});

// for GET /notes route, to validate query string parameters:
export const getAllNotesSchema = {
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.min': 'Page must be at least 1',
      'number.integer': 'Page must be an integer',
    }),
    perPage: Joi.number().integer().min(5).max(20).default(10).messages({
      'number.min': 'PerPage must be at least 5',
      'number.max': 'PerPage must be at most 20',
      'number.integer': 'PerPage must be an integer',
    }),
    tag: Joi.string()
      .valid(...TAGS)
      .messages({
        'any.only': `Tag must be one of the following values: ${TAGS.join(
          ', ',
        )}`,
      }),
    search: Joi.string().allow('').trim().messages({
      'string.base': 'Search must be a string',
    }),
  }),
};

// For GET /notes/:noteId route, to validate the noteId parameter:
export const noteIdSchema = {
  [Segments.PARAMS]: noteIdSchemaBase,
};

// For POST /notes route, to validate the request body:
export const createNoteSchema = {
  [Segments.BODY]: bodySchemaBase.fork('title', (schema) => schema.required()),
};

// For PATCH /notes/:noteId route, to validate noteId & request body:
export const updateNoteSchema = {
  [Segments.PARAMS]: noteIdSchemaBase,
  [Segments.BODY]: bodySchemaBase.min(1),
};
