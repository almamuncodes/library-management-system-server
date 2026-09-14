const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    availableQuantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Available quantity cannot be negative'],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    coverImage: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Book', bookSchema);
