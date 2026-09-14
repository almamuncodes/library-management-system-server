const express = require('express');
const router = express.Router();
const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');

router.route('/').get(getAllBooks).post(createBook);
router.route('/:id').get(getBookById).put(updateBook).delete(deleteBook);

module.exports = router;
