const mongoose = require('mongoose');

const borrowSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      trim: true,
      default: 'guest_user',
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book ID is required'],
    },
    userName: {
      type: String,
      default: 'Student Member',
      trim: true,
    },
    userEmail: {
      type: String,
      default: '',
      trim: true,
    },
    userPhone: {
      type: String,
      default: '',
      trim: true,
    },
    borrowDays: {
      type: Number,
      default: 14,
      min: 1,
      max: 60,
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    borrowDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'borrowed', 'return_pending', 'rejected', 'returned'],
      default: 'pending',
    },
    adminNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Borrow', borrowSchema);
