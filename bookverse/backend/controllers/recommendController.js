const Book = require('../models/Book');
const User = require('../models/User');
const { Review } = require('../models/index');

// @desc  Get personalized recommendations
// @route GET /api/recommend
exports.getRecommendations = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('purchasedBooks', 'category tags authorName')
    .populate('wishlist', 'category tags authorName');

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const booksInteracted = [...(user.purchasedBooks || []), ...(user.wishlist || [])];

  // Build preference profile
  const categoryCount = {};
  const authorCount = {};
  const tagCount = {};
  const excludeIds = booksInteracted.map(b => b._id);

  booksInteracted.forEach(book => {
    if (book.category) categoryCount[book.category] = (categoryCount[book.category] || 0) + 1;
    if (book.authorName) authorCount[book.authorName] = (authorCount[book.authorName] || 0) + 1;
    (book.tags || []).forEach(tag => { tagCount[tag] = (tagCount[tag] || 0) + 1; });
  });

  const topCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  const topAuthors = Object.entries(authorCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);

  let recommendations = [];

  if (topCategories.length > 0) {
    // Score-based recommendation
    const candidateBooks = await Book.find({
      status: 'approved',
      _id: { $nin: excludeIds },
      $or: [
        { category: { $in: topCategories } },
        { authorName: { $in: topAuthors } },
        { tags: { $in: topTags } },
      ],
    })
      .sort('-ratings -totalSales')
      .limit(30)
      .lean();

    // Score each book
    recommendations = candidateBooks.map(book => {
      let score = 0;
      if (topCategories.includes(book.category)) score += 3 * (topCategories.length - topCategories.indexOf(book.category));
      if (topAuthors.includes(book.authorName)) score += 5;
      (book.tags || []).forEach(tag => { if (topTags.includes(tag)) score += 2; });
      score += book.ratings * 2;
      score += Math.min(book.totalSales / 10, 10);
      return { ...book, _score: score };
    });

    recommendations.sort((a, b) => b._score - a._score);
    recommendations = recommendations.slice(0, 12);
  }

  // Fallback: best sellers / top rated if no history
  if (recommendations.length < 6) {
    const fallback = await Book.find({ status: 'approved', _id: { $nin: excludeIds } })
      .sort('-ratings -totalSales')
      .limit(12 - recommendations.length)
      .lean();
    recommendations = [...recommendations, ...fallback];
  }

  res.json({
    success: true,
    recommendations,
    basedOn: topCategories.length > 0 ? { categories: topCategories, authors: topAuthors } : 'popular',
  });
};

// @desc  Similar books (based on category and tags)
// @route GET /api/recommend/similar/:bookId
exports.getSimilarBooks = async (req, res) => {
  const book = await Book.findById(req.params.bookId);
  if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

  const similar = await Book.find({
    status: 'approved',
    _id: { $ne: book._id },
    $or: [
      { category: book.category },
      { tags: { $in: book.tags } },
      { authorName: book.authorName },
    ],
  })
    .sort('-ratings')
    .limit(8)
    .lean();

  res.json({ success: true, books: similar });
};

// @desc  Trending books by category
// @route GET /api/recommend/trending
exports.getTrending = async (req, res) => {
  const { category } = req.query;
  const query = { status: 'approved' };
  if (category) query.category = category;

  // Trending = high views + sales in last 30 days
  const books = await Book.find(query)
    .sort('-views -totalSales -ratings')
    .limit(10)
    .lean();

  res.json({ success: true, books });
};
