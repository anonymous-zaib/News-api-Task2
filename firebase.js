// const admin = require('firebase-admin');
// const serviceAccount = require('./path/to/serviceAccountKey.json'); // Replace with your service account key file path

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   storageBucket: 'gs://newsapi-b3ca9.appspot.com' // Replace with your Firebase Storage bucket name
// });

// const bucket = admin.storage().bucket();

// module.exports = { bucket };

const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json'); // Replace with your service account key file path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://newsapi-b3ca9.appspot.com' // Replace with your Firebase Storage bucket name
});

const bucket = admin.storage().bucket();

module.exports = { bucket };


