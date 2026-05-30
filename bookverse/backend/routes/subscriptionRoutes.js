const express = require('express');
const router = express.Router();

router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: {
      reading: [
        { plan: 'monthly', price: 99, duration: '1 Month', features: ['Unlimited ebooks', 'Audiobooks', 'Offline reading', 'Ad-free'] },
        { plan: 'yearly', price: 799, duration: '12 Months', features: ['All monthly features', '2 months free', 'Priority support'] },
      ],
      writer: [
        { plan: 'monthly', price: 299, duration: '1 Month', features: ['Publish unlimited books', 'Analytics dashboard', 'Writer community access'] },
        { plan: 'yearly', price: 2499, duration: '12 Months', features: ['All monthly features', '2 months free', 'Featured placement'] },
      ],
    },
  });
});

module.exports = router;
