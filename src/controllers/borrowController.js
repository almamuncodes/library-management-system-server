const Book = require('../models/Book');
const Borrow = require('../models/Borrow');
const { checkDb } = require('../config/db');

// @desc    Student submits a borrow request with duration (e.g. 7, 14, 30 days)
// @route   POST /api/borrow
exports.requestBorrow = async (req, res) => {
  if (!checkDb(res)) return;
  try {
    const { bookId, userId = 'guest_user', userName, userEmail, userPhone, borrowDays = 14 } = req.body;

    if (!bookId) {
      return res.status(400).json({ success: false, message: 'Book ID is required' });
    }

    // 1. Verify book
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found in database' });
    }

    // 2. Check available stock
    if (book.availableQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This book is currently out of stock for borrowing',
      });
    }

    // 3. Prevent duplicate active or pending borrow for the same book
    const existing = await Borrow.findOne({
      userId,
      bookId,
      status: { $in: ['pending', 'borrowed', 'return_pending'] },
    });

    if (existing) {
      if (existing.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending borrow request for this book awaiting admin approval',
        });
      }
      return res.status(400).json({
        success: false,
        message: 'You currently have this book borrowed and have not returned it yet',
      });
    }

    const durationDays = Number(borrowDays) || 14;

    // 4. Create request record with status 'pending'
    const newRequest = await Borrow.create({
      userId,
      bookId,
      userName: userName || 'Student',
      userEmail: userEmail || '',
      userPhone: userPhone || '',
      borrowDays: durationDays,
      requestDate: new Date(),
      status: 'pending',
    });

    const populated = await Borrow.findById(newRequest._id).populate('bookId');

    res.status(201).json({
      success: true,
      message: `Borrow request for "${book.title}" submitted successfully! Awaiting librarian approval.`,
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin approves a student's borrow request (decrements stock, sets dueDate)
// @route   PUT /api/borrow/:id/approve
exports.approveBorrow = async (req, res) => {
  if (!checkDb(res)) return;
  try {
    const borrowRecord = await Borrow.findById(req.params.id);
    if (!borrowRecord) {
      return res.status(404).json({ success: false, message: 'Borrow request not found' });
    }

    if (borrowRecord.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve record with status "${borrowRecord.status}"`,
      });
    }

    const book = await Book.findById(borrowRecord.bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (book.availableQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Book has run out of available copies',
      });
    }

    // Decrement stock
    book.availableQuantity -= 1;
    await book.save();

    // Calculate dates
    const now = new Date();
    const durationDays = borrowRecord.borrowDays || 14;
    const due = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    borrowRecord.status = 'borrowed';
    borrowRecord.borrowDate = now;
    borrowRecord.dueDate = due;
    await borrowRecord.save();

    const populated = await Borrow.findById(borrowRecord._id).populate('bookId');

    res.json({
      success: true,
      message: `Request approved! Book issued until ${due.toLocaleDateString()}.`,
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin rejects a borrow request
// @route   PUT /api/borrow/:id/reject
exports.rejectBorrow = async (req, res) => {
  if (!checkDb(res)) return;
  try {
    const { note } = req.body;
    const borrowRecord = await Borrow.findById(req.params.id);
    if (!borrowRecord) {
      return res.status(404).json({ success: false, message: 'Borrow request not found' });
    }

    if (borrowRecord.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject record with status "${borrowRecord.status}"`,
      });
    }

    borrowRecord.status = 'rejected';
    borrowRecord.adminNote = note || 'Request declined by librarian';
    await borrowRecord.save();

    res.json({
      success: true,
      message: 'Borrow request declined',
      data: borrowRecord,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Student submits a RETURN REQUEST for a borrowed book
// @route   POST /api/borrow/request-return
exports.requestReturn = async (req, res) => {
  if (!checkDb(res)) return;
  try {
    const { borrowId } = req.body;
    if (!borrowId) {
      return res.status(400).json({ success: false, message: 'Borrow ID is required' });
    }

    const borrowRecord = await Borrow.findById(borrowId);
    if (!borrowRecord) {
      return res.status(404).json({ success: false, message: 'Active borrowed book record not found' });
    }

    if (borrowRecord.status === 'return_pending') {
      return res.status(400).json({
        success: false,
        message: 'Return request is already pending librarian confirmation',
      });
    }

    if (borrowRecord.status !== 'borrowed') {
      return res.status(400).json({
        success: false,
        message: `Cannot request return for book with status "${borrowRecord.status}"`,
      });
    }

    borrowRecord.status = 'return_pending';
    await borrowRecord.save();

    const populated = await Borrow.findById(borrowRecord._id).populate('bookId');

    res.json({
      success: true,
      message: 'Return request submitted! The librarian will inspect and accept the book to confirm return.',
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin confirms receipt of returned book (increments stock, marks returned)
// @route   PUT /api/borrow/:id/accept-return
exports.acceptReturn = async (req, res) => {
  if (!checkDb(res)) return;
  try {
    const borrowRecord = await Borrow.findById(req.params.id);
    if (!borrowRecord) {
      return res.status(404).json({ success: false, message: 'Borrow record not found' });
    }

    if (borrowRecord.status !== 'return_pending' && borrowRecord.status !== 'borrowed') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept return for record with status "${borrowRecord.status}"`,
      });
    }

    borrowRecord.status = 'returned';
    borrowRecord.returnDate = new Date();
    await borrowRecord.save();

    // Increment stock
    const book = await Book.findById(borrowRecord.bookId);
    if (book) {
      book.availableQuantity += 1;
      if (book.availableQuantity > book.quantity) {
        book.availableQuantity = book.quantity;
      }
      await book.save();
    }

    const populated = await Borrow.findById(borrowRecord._id).populate('bookId');

    res.json({
      success: true,
      message: 'Book return confirmed! Stock restored in library inventory.',
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Return a borrowed book directly or via return request
// @route   POST /api/borrow/return
exports.returnBook = async (req, res) => {
  if (!checkDb(res)) return;
  try {
    const { borrowId, bookId, userId } = req.body;

    let borrowRecord;
    if (borrowId) {
      borrowRecord = await Borrow.findById(borrowId);
    } else if (bookId && userId) {
      borrowRecord = await Borrow.findOne({ userId, bookId, status: { $in: ['borrowed', 'return_pending'] } });
    }

    if (!borrowRecord) {
      return res.status(404).json({ success: false, message: 'Active borrowed book record not found' });
    }

    if (borrowRecord.status === 'returned') {
      return res.status(400).json({ success: false, message: 'This book has already been returned' });
    }

    borrowRecord.status = 'returned';
    borrowRecord.returnDate = new Date();
    await borrowRecord.save();

    // Increment stock
    const book = await Book.findById(borrowRecord.bookId);
    if (book) {
      book.availableQuantity += 1;
      if (book.availableQuantity > book.quantity) {
        book.availableQuantity = book.quantity;
      }
      await book.save();
    }

    res.json({
      success: true,
      message: 'Book returned successfully to library stock!',
      data: borrowRecord,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all borrow records for Admin (pending, return_pending, active borrowed, overdue, returned)
// @route   GET /api/borrow/all
exports.getAllBorrows = async (req, res) => {
  if (!checkDb(res)) return;
  try {
    const { status } = req.query;
    let query = {};

    if (status) {
      if (status === 'overdue') {
        query.status = { $in: ['borrowed', 'return_pending'] };
        query.dueDate = { $lt: new Date() };
      } else {
        query.status = status;
      }
    }

    const records = await Borrow.find(query)
      .populate('bookId')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's borrows (requests, active books in hand with due dates, returned history)
// @route   GET /api/borrow/user/:userId
exports.getUserBorrows = async (req, res) => {
  if (!checkDb(res)) return;
  try {
    const { userId } = req.params;
    const { status } = req.query;

    let query = { userId };
    if (status) {
      query.status = status;
    }

    const borrows = await Borrow.find(query)
      .populate('bookId')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: borrows.length, data: borrows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
