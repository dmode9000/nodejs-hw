import { Router } from 'express';
import { celebrate } from 'celebrate';

import {
  createNote,
  getAllNotes,
  getNoteById,
  deleteNote,
  updateNote,
} from '../controllers/notesController.js';

import {
  noteIdSchema,
  createNoteSchema,
  updateNoteSchema,
  getAllNotesSchema,
} from '../validations/notesValidation.js';
// middleware
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// add authentication for all product routes
router.use('/notes', authenticate);

router.get('/notes', celebrate(getAllNotesSchema), getAllNotes);
router.get('/notes/:noteId', celebrate(noteIdSchema), getNoteById);
router.post('/notes', celebrate(createNoteSchema), createNote);
router.delete('/notes/:noteId', celebrate(noteIdSchema), deleteNote);
router.patch('/notes/:noteId', celebrate(updateNoteSchema), updateNote);

export default router;
