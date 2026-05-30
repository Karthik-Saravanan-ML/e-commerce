const Book = require('../models/Book');
const { Review } = require('../models/index');
const { cloudinary, getSupabase } = require('../config/storage');
const path = require('path');

// @desc  Get all approved books
// @route GET /api/books
exports.getBooks = async (req, res) => {
  const { search, bookId, author, category, minPrice, maxPrice, page = 1, limit = 12, sort = '-createdAt', isFeatured, isBestSeller, isAudiobook, isEbook } = req.query;
  const query = { status: 'approved' };

  if (search) query.$text = { $search: search };
  if (bookId) query.bookId = { $regex: bookId, $options: 'i' };
  if (author) query.authorName = { $regex: author, $options: 'i' };
  if (category) query.category = category;
  if (isFeatured === 'true') query.isFeatured = true;
  if (isBestSeller === 'true') query.isBestSeller = true;
  if (isAudiobook === 'true') query.isAudiobook = true;
  if (isEbook === 'true') query.isEbook = true;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [books, total] = await Promise.all([
    Book.find(query).sort(sort).skip(skip).limit(Number(limit)).lean(),
    Book.countDocuments(query),
  ]);

  res.json({ success: true, total, pages: Math.ceil(total / Number(limit)), currentPage: Number(page), books });
};

// @desc  Get single book
// @route GET /api/books/:id
exports.getBook = async (req, res) => {
  const idParam = req.params.id;
  const query = idParam.length === 24
    ? { $or: [{ _id: idParam }, { bookId: idParam }], status: 'approved' }
    : { bookId: idParam, status: 'approved' };

  const book = await Book.findOne(query).populate('author', 'name avatar writerProfile');
  if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

  await Book.findByIdAndUpdate(book._id, { $inc: { views: 1 } });
  const reviews = await Review.find({ book: book._id }).sort('-createdAt').limit(20).lean();
  res.json({ success: true, book, reviews });
};

// @desc  Get books by category
// @route GET /api/books/category/:category
exports.getByCategory = async (req, res) => {
  const { page = 1, limit = 12, sort = '-ratings' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [books, total] = await Promise.all([
    Book.find({ category: req.params.category, status: 'approved' }).sort(sort).skip(skip).limit(Number(limit)).lean(),
    Book.countDocuments({ category: req.params.category, status: 'approved' }),
  ]);
  res.json({ success: true, total, pages: Math.ceil(total / Number(limit)), books });
};

// @desc  Get best sellers
// @route GET /api/books/best-sellers
exports.getBestSellers = async (req, res) => {
  const books = await Book.find({ status: 'approved', isBestSeller: true }).sort('-totalSales -ratings').limit(10).lean();
  res.json({ success: true, books });
};

// @desc  Writer submits a book
// @route POST /api/books
exports.createBook = async (req, res) => {
  const { title, description, category, price, mrp, stock, language, tags, isbn, publisher, publishedYear, pages, edition, isPhysical, isEbook, isAudiobook, royaltyPercentage } = req.body;
  if (!req.file) return res.status(400).json({ success: false, message: 'Cover image required' });

  const book = await Book.create({
    title, description, category,
    price: Number(price),
    mrp: mrp ? Number(mrp) : undefined,
    stock: Number(stock) || 0,
    language: language || 'English',
    tags: tags ? tags.split(',').map(t => t.trim()) : [],
    isbn, publisher,
    publishedYear: publishedYear ? Number(publishedYear) : undefined,
    pages: pages ? Number(pages) : undefined,
    edition,
    isPhysical: isPhysical !== 'false',
    isEbook: isEbook === 'true',
    isAudiobook: isAudiobook === 'true',
    royaltyPercentage: royaltyPercentage ? Number(royaltyPercentage) : 70,
    author: req.user._id,
    authorName: req.user.name,
    coverImage: req.file.path,
    coverImagePublicId: req.file.filename,
    status: 'pending',
  });

  res.status(201).json({ success: true, message: 'Book submitted for review', book });
};

// @desc  Upload soft copy PDF to Supabase
// @route POST /api/books/:id/upload-pdf
exports.uploadSoftCopy = async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ success: false, message: 'File storage not configured. Please set up Supabase in .env' });

  const book = await Book.findOne({ _id: req.params.id, author: req.user._id });
  if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
  if (!req.file) return res.status(400).json({ success: false, message: 'PDF file required' });

  const fileName = `softcopy/${book._id}_${Date.now()}.pdf`;
  const { error } = await supabase.storage.from(process.env.SUPABASE_BUCKET).upload(fileName, req.file.buffer, { contentType: 'application/pdf', upsert: true });
  if (error) return res.status(500).json({ success: false, message: error.message });

  const { data: urlData } = supabase.storage.from(process.env.SUPABASE_BUCKET).getPublicUrl(fileName);
  book.softCopyUrl = urlData.publicUrl;
  book.softCopyPublicId = fileName;
  book.isEbook = true;
  await book.save();
  res.json({ success: true, message: 'Soft copy uploaded', softCopyUrl: book.softCopyUrl });
};

// @desc  Upload audio chapter to Supabase
// @route POST /api/books/:id/upload-audio
exports.uploadAudioChapter = async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ success: false, message: 'File storage not configured. Please set up Supabase in .env' });

  const book = await Book.findOne({ _id: req.params.id, author: req.user._id });
  if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
  if (!req.file) return res.status(400).json({ success: false, message: 'Audio file required' });

  const { chapterNumber, chapterTitle, isFree } = req.body;
  const ext = path.extname(req.file.originalname);
  const fileName = `audio/${book._id}/chapter_${chapterNumber}_${Date.now()}${ext}`;

  const { error } = await supabase.storage.from(process.env.SUPABASE_BUCKET).upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
  if (error) return res.status(500).json({ success: false, message: error.message });

  const { data: urlData } = supabase.storage.from(process.env.SUPABASE_BUCKET).getPublicUrl(fileName);
  const chapterIdx = book.chapters.findIndex(c => c.number === Number(chapterNumber));
  const chapterData = { number: Number(chapterNumber), title: chapterTitle, audioUrl: urlData.publicUrl, audioPublicId: fileName, isFree: isFree === 'true' };

  if (chapterIdx > -1) book.chapters[chapterIdx] = chapterData;
  else book.chapters.push(chapterData);

  book.totalChapters = book.chapters.length;
  book.isAudiobook = true;
  await book.save();
  res.json({ success: true, message: 'Audio chapter uploaded', chapter: chapterData });
};

// @desc  Update book (writer)
// @route PUT /api/books/:id
exports.updateBook = async (req, res) => {
  const book = await Book.findOne({ _id: req.params.id, author: req.user._id });
  if (!book) return res.status(404).json({ success: false, message: 'Book not found or not yours' });

  const fields = ['title', 'description', 'price', 'mrp', 'stock', 'discount', 'language', 'tags', 'isbn', 'publisher', 'pages'];
  fields.forEach(f => { if (req.body[f] !== undefined) book[f] = req.body[f]; });

  if (req.file) {
    if (book.coverImagePublicId) await cloudinary.uploader.destroy(book.coverImagePublicId).catch(() => {});
    book.coverImage = req.file.path;
    book.coverImagePublicId = req.file.filename;
  }
  book.status = 'pending';
  await book.save();
  res.json({ success: true, message: 'Book updated and pending review', book });
};

// @desc  Delete book
// @route DELETE /api/books/:id
exports.deleteBook = async (req, res) => {
  const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, author: req.user._id };
  const book = await Book.findOne(query);
  if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
  if (book.coverImagePublicId) await cloudinary.uploader.destroy(book.coverImagePublicId).catch(() => {});
  await book.deleteOne();
  res.json({ success: true, message: 'Book deleted' });
};

// @desc  Get writer's own books
// @route GET /api/books/my-books
exports.getMyBooks = async (req, res) => {
  const books = await Book.find({ author: req.user._id }).sort('-createdAt');
  res.json({ success: true, books });
};

// @desc  Update reading progress
// @route PUT /api/books/:id/progress
exports.updateProgress = async (req, res) => {
  const { currentChapter, percentage } = req.body;
  const User = require('../models/User');
  const user = await User.findById(req.user._id);
  const idx = user.readingProgress.findIndex(p => p.book.toString() === req.params.id);
  const data = { book: req.params.id, currentChapter: Number(currentChapter), percentage: Number(percentage), lastRead: new Date() };
  if (idx > -1) user.readingProgress[idx] = data;
  else user.readingProgress.push(data);
  await user.save();
  res.json({ success: true, message: 'Progress saved' });
};
