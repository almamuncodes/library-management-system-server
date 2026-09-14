const Book = require('../models/Book');
const Borrow = require('../models/Borrow');
const { checkDb } = require('../config/db');

// @desc    Get complete library statistics including circulation & overdue counters
// @route   GET /api/stats
exports.getStats = async (req, res) => {
  if (!checkDb(res)) return;
  try {
    const books = await Book.find({});
    const totalTitles = books.length;
    const totalBooks = books.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    const availableBooks = books.reduce((acc, curr) => acc + (curr.availableQuantity || 0), 0);

    const now = new Date();
    const pendingRequests = await Borrow.countDocuments({ status: 'pending' });
    const pendingReturns = await Borrow.countDocuments({ status: 'return_pending' });
    const activeBorrowed = await Borrow.countDocuments({ status: { $in: ['borrowed', 'return_pending'] } });
    const overdueCount = await Borrow.countDocuments({
      status: { $in: ['borrowed', 'return_pending'] },
      dueDate: { $lt: now },
    });
    const totalReturns = await Borrow.countDocuments({ status: 'returned' });
    const uniqueBorrowers = await Borrow.distinct('userId');

    const categoryCounts = {};
    books.forEach((b) => {
      const cat = b.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        totalTitles,
        totalBooks,
        availableBooks,
        borrowedBooks: activeBorrowed,
        pendingRequests,
        pendingReturns,
        overdueCount,
        totalReturns,
        totalMembers: uniqueBorrowers.length,
        categoryCounts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
