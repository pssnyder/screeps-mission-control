/**
 * MINIMAL TEST - Cloud Functions Gen 2
 */

const { onRequest } = require('firebase-functions/v2/https');

exports.test = onRequest({ cors: true }, async (req, res) => {
  res.json({ message: 'Hello from Cloud Functions Gen 2!' });
});
