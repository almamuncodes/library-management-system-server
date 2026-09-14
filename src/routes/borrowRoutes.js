const express = require('express');
const router = express.Router();
const {
  requestBorrow,
  approveBorrow,
  rejectBorrow,
  requestReturn,
  acceptReturn,
  returnBook,
  getAllBorrows,
  getUserBorrows,
} = require('../controllers/borrowController');

router.post('/', requestBorrow);
router.put('/:id/approve', approveBorrow);
router.put('/:id/reject', rejectBorrow);
router.post('/request-return', requestReturn);
router.put('/:id/accept-return', acceptReturn);
router.post('/return', returnBook);
router.get('/all', getAllBorrows);
router.get('/user/:userId', getUserBorrows);

module.exports = router;
