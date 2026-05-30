const cron = require('node-cron');
const User = require('../models/User');
const { Cart } = require('../models/index');
const { sendEmail } = require('./emailService');
const { sendSMS } = require('./smsService');

const startCronJobs = () => {
  // ─── Cart abandonment reminder ─────────────────────────────────
  // Runs every day at 10 AM
  cron.schedule('0 10 * * *', async () => {
    console.log('🕐 Running cart reminder cron...');
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Find carts updated more than 7 days ago with items, reminder not sent
      const abandonedCarts = await Cart.find({
        'items.0': { $exists: true },
        lastUpdated: { $lte: sevenDaysAgo },
      }).populate('user', 'name email phone cartReminderSent cartReminderDate');

      for (const cart of abandonedCarts) {
        if (!cart.user || cart.user.cartReminderSent) continue;

        // Send email reminder
        await sendEmail({
          to: cart.user.email,
          subject: '📚 You left some books behind!',
          html: `
            <h2>Hi ${cart.user.name}!</h2>
            <p>You have ${cart.items.length} book(s) waiting in your cart. Don't let them slip away!</p>
            <p><a href="${process.env.CLIENT_URL}/cart" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none">View My Cart</a></p>
            <p>Use code <strong>COMEBACK10</strong> for 10% off your order!</p>
          `,
        });

        // Send SMS if phone available
        if (cart.user.phone) {
          await sendSMS({
            to: cart.user.phone,
            body: `Hi ${cart.user.name}! 📚 You have books waiting in your BookVerse cart. Complete your order now and use COMEBACK10 for 10% off! ${process.env.CLIENT_URL}/cart`,
          });
        }

        // Mark reminder as sent
        await User.findByIdAndUpdate(cart.user._id, {
          cartReminderSent: true,
          cartReminderDate: new Date(),
        });

        console.log(`✅ Cart reminder sent to ${cart.user.email}`);
      }
    } catch (err) {
      console.error('Cart reminder cron error:', err.message);
    }
  });

  // ─── Reading subscription expiry check ─────────────────────────
  // Runs every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('🕐 Running subscription expiry check...');
    try {
      const now = new Date();

      // Deactivate expired reading subscriptions
      await User.updateMany(
        { 'readingSubscription.active': true, 'readingSubscription.endDate': { $lt: now } },
        { 'readingSubscription.active': false }
      );

      // Deactivate expired writer subscriptions
      await User.updateMany(
        { 'writerSubscription.active': true, 'writerSubscription.endDate': { $lt: now } },
        { 'writerSubscription.active': false }
      );

      // Send renewal reminders (3 days before expiry)
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const expiringUsers = await User.find({
        'readingSubscription.active': true,
        'readingSubscription.endDate': { $gte: now, $lte: threeDaysFromNow },
      }).select('name email readingSubscription');

      for (const user of expiringUsers) {
        await sendEmail({
          to: user.email,
          subject: '⚠️ Your BookVerse subscription expires in 3 days',
          html: `<p>Hi ${user.name}, your reading subscription expires on ${user.readingSubscription.endDate.toDateString()}. <a href="${process.env.CLIENT_URL}/subscription">Renew now</a> to keep reading!</p>`,
        });
      }

      console.log(`✅ Subscription check complete`);
    } catch (err) {
      console.error('Subscription cron error:', err.message);
    }
  });

  // ─── Best seller update ─────────────────────────────────────────
  // Runs every week on Sunday
  cron.schedule('0 0 * * 0', async () => {
    console.log('🕐 Updating best sellers...');
    try {
      const Book = require('../models/Book');

      // Reset all best sellers
      await Book.updateMany({}, { isBestSeller: false });

      // Top 20 by total sales become best sellers
      const topBooks = await Book.find({ status: 'approved' })
        .sort('-totalSales')
        .limit(20)
        .select('_id');

      const topIds = topBooks.map(b => b._id);
      await Book.updateMany({ _id: { $in: topIds } }, { isBestSeller: true });

      console.log(`✅ Best sellers updated: ${topIds.length} books`);
    } catch (err) {
      console.error('Best seller cron error:', err.message);
    }
  });

  console.log('⏰ Cron jobs started');
};

module.exports = { startCronJobs };
