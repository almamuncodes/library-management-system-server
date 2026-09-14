const Book = require('../models/Book');
const { checkDb } = require('../config/db');

exports.getAllBooks = async (req, res) => {
  if (!checkDb(res)) return;
  try {
    const { search, category, featured } = req.query;
    let query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { author: searchRegex }];
    }

    if (category && category.trim() && category !== 'All') {
      query.category = category.trim();
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    const books = await Book.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: books.length, data: books });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBookById = async (req, res) => {
  if (!checkDb(res)) return;
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBook = async (req, res) => {
  if (!checkDb(res)) return;
  try {
    const { title, author, category, quantity, availableQuantity, isFeatured, coverImage, description } = req.body;

    if (!title || !author || !category) {
      return res.status(400).json({ success: false, message: 'Title, Author and Category are required' });
    }

    const totalQty = Number(quantity) || 0;
    const availQty = availableQuantity !== undefined ? Number(availableQuantity) : totalQty;

    const newBook = await Book.create({
      title,
      author,
      category,
      quantity: totalQty,
      availableQuantity: availQty,
      isFeatured: !!isFeatured,
      coverImage: coverImage || '',
      description: description || '',
    });

    res.status(201).json({ success: true, message: 'Book added to database successfully', data: newBook });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateBook = async (req, res) => {
  if (!checkDb(res)) return;
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const { title, author, category, quantity, availableQuantity, isFeatured, coverImage, description } = req.body;

    if (title !== undefined) book.title = title;
    if (author !== undefined) book.author = author;
    if (category !== undefined) book.category = category;
    if (quantity !== undefined) book.quantity = Number(quantity);
    if (availableQuantity !== undefined) book.availableQuantity = Number(availableQuantity);
    if (isFeatured !== undefined) book.isFeatured = Boolean(isFeatured);
    if (coverImage !== undefined) book.coverImage = coverImage;
    if (description !== undefined) book.description = description;

    await book.save();
    res.json({ success: true, message: 'Book updated in database', data: book });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteBook = async (req, res) => {
  if (!checkDb(res)) return;
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, message: 'Book deleted from database successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
