require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const { Banner, SubscriptionPlan } = require('../models/index');

const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();
  console.log('🌱 Starting seed...');

  // ── Admin user ──────────────────────────────────────────────
  const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@bookverse.com' });
  if (!adminExists) {
    await User.create({
      name: 'BookVerse Admin',
      email: process.env.ADMIN_EMAIL || 'admin@bookverse.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@1234',
      role: 'admin',
      isActive: true,
    });
    console.log('✅ Admin user created');
  } else {
    console.log('ℹ️  Admin already exists');
  }

  // ── Sample writer ───────────────────────────────────────────
  let writer = await User.findOne({ email: 'writer@bookverse.com' });
  if (!writer) {
    writer = await User.create({
      name: 'Sample Author',
      email: 'writer@bookverse.com',
      password: 'Writer@1234',
      role: 'writer',
      isActive: true,
      writerSubscription: {
        active: true,
        plan: 'yearly',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      writerProfile: {
        bio: 'Bestselling author of thriller and mystery novels.',
        language: 'en',
        country: 'India',
        isPublic: true,
      },
    });
    console.log('✅ Sample writer created');
  }

  // ── Sample books ────────────────────────────────────────────
  const bookCount = await Book.countDocuments();
  if (bookCount === 0) {
    const sampleBooks = [
      {
        title: 'The Silent Algorithm',
        description: 'A thrilling tale of a rogue AI that begins to question its existence. When engineer Priya discovers anomalies in the code, she must race against time before the system goes fully autonomous.',
        category: 'thriller',
        price: 299,
        mrp: 399,
        discount: 25,
        stock: 100,
        language: 'English',
        pages: 320,
        publisher: 'Horizon Press',
        publishedYear: 2024,
        tags: ['thriller', 'AI', 'technology', 'suspense'],
        coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop',
        author: writer._id,
        authorName: writer.name,
        status: 'approved',
        isFeatured: true,
        isBestSeller: true,
        ratings: 4.5,
        numReviews: 128,
        totalSales: 450,
        isPhysical: true,
        isEbook: true,
        isAudiobook: true,
      },
      {
        title: 'Stars Over Chennai',
        description: 'A heartwarming story of love, family, and cultural identity set against the vibrant backdrop of modern Chennai.',
        category: 'romance',
        price: 249,
        mrp: 299,
        discount: 17,
        stock: 80,
        language: 'English',
        pages: 280,
        publisher: 'Lotus Books',
        publishedYear: 2024,
        tags: ['romance', 'India', 'family', 'contemporary'],
        coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop',
        author: writer._id,
        authorName: writer.name,
        status: 'approved',
        isBestSeller: true,
        ratings: 4.3,
        numReviews: 95,
        totalSales: 320,
        isPhysical: true,
        isEbook: true,
      },
      {
        title: 'Quantum Minds',
        description: 'An accessible journey into the world of quantum computing explained through fascinating real-world stories.',
        category: 'science',
        price: 399,
        mrp: 499,
        discount: 20,
        stock: 60,
        language: 'English',
        pages: 420,
        publisher: 'TechLearn Publications',
        publishedYear: 2024,
        tags: ['science', 'quantum', 'technology', 'non-fiction'],
        coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop',
        author: writer._id,
        authorName: writer.name,
        status: 'approved',
        isFeatured: true,
        ratings: 4.7,
        numReviews: 67,
        totalSales: 210,
        isPhysical: true,
        isEbook: true,
      },
      {
        title: 'Little Wonders: Tales for Kids',
        description: 'A magical collection of 20 illustrated stories for children aged 4-10, celebrating curiosity, kindness, and imagination.',
        category: 'kids',
        price: 199,
        mrp: 249,
        discount: 20,
        stock: 150,
        language: 'English',
        pages: 180,
        publisher: 'Rainbow Kids Press',
        publishedYear: 2024,
        tags: ['kids', 'stories', 'illustrated', 'children'],
        coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
        author: writer._id,
        authorName: writer.name,
        status: 'approved',
        ratings: 4.8,
        numReviews: 203,
        totalSales: 580,
        isPhysical: true,
        isEbook: true,
        isAudiobook: true,
      },
      {
        title: 'UPSC Cracker: Complete Guide',
        description: 'The definitive preparation guide for UPSC Civil Services with 5000+ practice questions, strategy, and mock tests.',
        category: 'test-prep',
        price: 599,
        mrp: 799,
        discount: 25,
        stock: 200,
        language: 'English',
        pages: 950,
        publisher: 'ExamReady Publishers',
        publishedYear: 2024,
        tags: ['UPSC', 'civil services', 'exam prep', 'government'],
        coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=600&fit=crop',
        author: writer._id,
        authorName: writer.name,
        status: 'approved',
        isBestSeller: true,
        ratings: 4.6,
        numReviews: 312,
        totalSales: 890,
        isPhysical: true,
        isEbook: true,
      },
      {
        title: 'The Forgotten Empire',
        description: 'An epic fantasy saga set in a world where ancient magic resurfaces after centuries of dormancy.',
        category: 'fantasy',
        price: 349,
        mrp: 449,
        discount: 22,
        stock: 75,
        language: 'English',
        pages: 560,
        publisher: 'Mystic Tales',
        publishedYear: 2024,
        tags: ['fantasy', 'magic', 'epic', 'adventure'],
        coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=600&fit=crop',
        author: writer._id,
        authorName: writer.name,
        status: 'approved',
        isFeatured: true,
        ratings: 4.4,
        numReviews: 88,
        totalSales: 275,
        isPhysical: true,
        isEbook: true,
        isAudiobook: true,
      },
      {
        title: 'Atomic Habits Tamil Edition',
        description: 'The life-changing self-improvement classic on building good habits and breaking bad ones.',
        category: 'self-help',
        price: 299,
        mrp: 350,
        discount: 15,
        stock: 120,
        language: 'Tamil',
        pages: 310,
        publisher: 'Noolaga Publishers',
        publishedYear: 2024,
        tags: ['self-help', 'habits', 'productivity', 'Tamil'],
        coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=600&fit=crop',
        author: writer._id,
        authorName: writer.name,
        status: 'approved',
        isBestSeller: true,
        ratings: 4.9,
        numReviews: 445,
        totalSales: 1200,
        isPhysical: true,
        isEbook: true,
      },
      {
        title: 'The Mumbai Murders',
        description: 'Detective Arjun Sharma faces his most complex case yet in the labyrinthine streets of Mumbai.',
        category: 'fiction',
        price: 279,
        mrp: 349,
        discount: 20,
        stock: 90,
        language: 'English',
        pages: 368,
        publisher: 'CrimeLine Books',
        publishedYear: 2024,
        tags: ['mystery', 'detective', 'Mumbai', 'crime'],
        coverImage: 'https://images.unsplash.com/photo-1531901599143-df5010ab9438?w=400&h=600&fit=crop',
        author: writer._id,
        authorName: writer.name,
        status: 'approved',
        ratings: 4.2,
        numReviews: 156,
        totalSales: 410,
        isPhysical: true,
        isEbook: true,
        isAudiobook: true,
      },
    ];

    await Book.insertMany(sampleBooks);
    console.log(`✅ ${sampleBooks.length} sample books created`);
  } else {
    console.log(`ℹ️  Books already exist (${bookCount})`);
  }

  // ── Sample banners ──────────────────────────────────────────
  const bannerCount = await Banner.countDocuments();
  if (bannerCount === 0) {
    await Banner.insertMany([
      {
        title: 'Up to 25% OFF on Bestsellers',
        subtitle: 'Limited time offer on top-rated books',
        imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1400&h=500&fit=crop',
        linkTo: 'fiction',
        linkType: 'category',
        type: 'main',
        discountPercent: 25,
        couponCode: 'SAVE25',
        isActive: true,
        order: 0,
      },
      {
        title: 'Unlimited Reading — ₹99/month',
        subtitle: 'Access thousands of ebooks and audiobooks',
        imageUrl: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?w=1400&h=500&fit=crop',
        linkTo: 'subscription',
        linkType: 'subscription',
        type: 'reading',
        isActive: true,
        order: 1,
      },
      {
        title: 'New Arrivals in Test Prep',
        subtitle: 'UPSC, CAT, JEE — Everything you need',
        imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1400&h=500&fit=crop',
        linkTo: 'test-prep',
        linkType: 'category',
        type: 'main',
        isActive: true,
        order: 2,
      },
    ]);
    console.log('✅ Sample banners created');
  }

  // ── Subscription plans ──────────────────────────────────────
  const planCount = await SubscriptionPlan.countDocuments();
  if (planCount === 0) {
    await SubscriptionPlan.insertMany([
      { name: 'Reading Monthly', type: 'reading', duration: 'monthly', price: 99, features: ['Unlimited ebooks', 'Audiobooks', 'Offline reading', 'No ads'], isActive: true },
      { name: 'Reading Yearly', type: 'reading', duration: 'yearly', price: 799, features: ['All monthly features', '2 months free', 'Priority support'], isActive: true },
      { name: 'Writer Monthly', type: 'writer', duration: 'monthly', price: 299, features: ['Publish books', 'Analytics', 'Writer network', '70% royalty'], isActive: true },
      { name: 'Writer Yearly', type: 'writer', duration: 'yearly', price: 2499, features: ['All monthly features', '2 months free', 'Featured placement'], isActive: true },
    ]);
    console.log('✅ Subscription plans created');
  }

  console.log('\n🎉 Seed completed!');
  console.log('─────────────────────────────────');
  console.log('Admin login:  admin@bookverse.com / Admin@1234');
  console.log('Writer login: writer@bookverse.com / Writer@1234');
  console.log('─────────────────────────────────');
  process.exit(0);
};

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
