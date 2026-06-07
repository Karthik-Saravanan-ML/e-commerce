const Book = require('../models/Book');
const { Review } = require('../models/index');
const { cloudinary, uploadFile, isSupabaseConfigured } = require('../config/storage');
const path = require('path');

// @desc  Get all approved books
// @route GET /api/books
exports.getBooks = async (req, res) => {
  const { search, bookId, author, category, minPrice, maxPrice, page = 1, limit = 12, sort = '-createdAt', isFeatured, isBestSeller, isAudiobook, isEbook, onSale } = req.query;
  const query = { status: 'approved' };

  if (onSale === 'true') {
    query.$or = [{ discount: { $gt: 0 } }, { isBestSeller: true }];
  }
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
  try {
  const { title, description, category, price, mrp, stock, language, tags, isbn, publisher, publishedYear, pages, edition, isPhysical, isEbook, isAudiobook, royaltyPercentage } = req.body;

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ success: false, message: 'Title and description are required' });
  }
  if (!category) {
    return res.status(400).json({ success: false, message: 'Category is required' });
  }
  if (price === undefined || price === '' || Number.isNaN(Number(price))) {
    return res.status(400).json({ success: false, message: 'Valid price is required' });
  }
  if (!req.file) return res.status(400).json({ success: false, message: 'Cover image required' });

  const stockNum = stock === '' || stock === undefined ? 0 : Number(stock);

  const book = await Book.create({
    title: title.trim(), description: description.trim(), category,
    price: Number(price),
    mrp: mrp ? Number(mrp) : undefined,
    stock: Number.isNaN(stockNum) ? 0 : Math.max(0, stockNum),
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
  } catch (err) {
    console.error('createBook error:', err);
    throw err;
  }
};

// @desc  Upload soft copy PDF to Supabase
// @route POST /api/books/:id/upload-pdf
exports.uploadSoftCopy = async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, author: req.user._id });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    if (!req.file) return res.status(400).json({ success: false, message: 'PDF file required' });

    if (!req.file.originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ success: false, message: 'Only PDF files are allowed' });
    }

    // Check Supabase is available for production
    if (process.env.NODE_ENV === 'production' && !isSupabaseConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'File storage (Supabase) is not configured. Contact the administrator.',
      });
    }

    const fileName = `softcopy/${book._id}_${Date.now()}.pdf`;
    const result = await uploadFile(req.file.buffer, {
      filePath: fileName,
      contentType: 'application/pdf',
      originalname: req.file.originalname,
      localSubfolder: 'softcopy',
    });

    book.softCopyUrl = result.url;
    book.softCopyPublicId = result.publicId;
    book.isEbook = true;
    await book.save();
    res.json({
      success: true,
      message: result.storage === 'supabase'
        ? 'E-book PDF uploaded successfully'
        : 'E-book saved locally (development mode — will use Supabase in production)',
      softCopyUrl: book.softCopyUrl,
      storage: result.storage,
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(500).json({ success: false, message: `Upload failed: ${error.message}` });
  }
};

// @desc  Upload audio chapter to Supabase
// @route POST /api/books/:id/upload-audio
exports.uploadAudioChapter = async (req, res) => {
  const book = await Book.findOne({ _id: req.params.id, author: req.user._id });
  if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
  if (!req.file) return res.status(400).json({ success: false, message: 'Audio file required' });

  // Check Supabase is available for production
  if (process.env.NODE_ENV === 'production' && !isSupabaseConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'File storage (Supabase) is not configured. Contact the administrator.',
    });
  }

  const { chapterNumber, chapterTitle, isFree } = req.body;
  const ext = path.extname(req.file.originalname);
  const fileName = `audio/${book._id}/chapter_${chapterNumber}_${Date.now()}${ext}`;

  const result = await uploadFile(req.file.buffer, {
    filePath: fileName,
    contentType: req.file.mimetype,
    originalname: req.file.originalname,
    localSubfolder: `audio/${book._id}`,
  });

  const chapterIdx = book.chapters.findIndex(c => c.number === Number(chapterNumber));
  const chapterData = { number: Number(chapterNumber), title: chapterTitle, audioUrl: result.url, audioPublicId: result.publicId, isFree: isFree === 'true' };

  if (chapterIdx > -1) book.chapters[chapterIdx] = chapterData;
  else book.chapters.push(chapterData);

  book.totalChapters = book.chapters.length;
  book.isAudiobook = true;
  await book.save();
  res.json({ success: true, message: 'Audio chapter uploaded', chapter: chapterData, storage: result.storage });
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
