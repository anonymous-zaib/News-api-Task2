// const multer = require('multer');
// const { v4: uuidv4 } = require('uuid');
// const path = require('path');

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'gs://newsapi-b3ca9.appspot.com');
//   },
//   filename: function (req, file, cb) {
//     const uniqueName = uuidv4();
//     cb(null, uniqueName + path.extname(file.originalname));
//   }
// });

// const upload = multer({ storage: storage });

// module.exports = upload;

// const multer = require('multer');
// const { v4: uuidv4 } = require('uuid');
// const path = require('path');
// const { bucket } = require('../firebase');

// const storage = multer.memoryStorage();

// const upload = multer({ storage: storage });

// const uploadToFirebase = async (file) => {
//   const uniqueName = uuidv4() + path.extname(file.originalname);
//   const blob = bucket.file(uniqueName);
//   const blobStream = blob.createWriteStream({
//     metadata: {
//       contentType: file.mimetype,
//     },
//   });

//   return new Promise((resolve, reject) => {
//     blobStream.on('error', (err) => {
//       reject(err);
//     });

//     blobStream.on('finish', async () => {
//       const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
//       resolve(publicUrl);
//     });

//     blobStream.end(file.buffer);
//   });
// };

// module.exports = { upload, uploadToFirebase };

// const multer = require('multer');
// const { v4: uuidv4 } = require('uuid');
// const path = require('path');
// const { bucket } = require('../firebase');

// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

// const uploadToFirebase = async (file) => {
//   const uniqueName = uuidv4() + path.extname(file.originalname);
//   const blob = bucket.file(uniqueName);
//   const blobStream = blob.createWriteStream({
//     metadata: {
//       contentType: file.mimetype,
//     },
//   });

//   return new Promise((resolve, reject) => {
//     blobStream.on('error', (err) => {
//       reject(err);
//     });

//     blobStream.on('finish', async () => {
//       const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueName}`;
//       resolve(publicUrl);
//     });

//     blobStream.end(file.buffer);
//   });
// };

// module.exports = { upload, uploadToFirebase };

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { bucket } = require('../firebase');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadToFirebase = async (file) => {
  const uniqueName = uuidv4() + path.extname(file.originalname);
  const blob = bucket.file(uniqueName);
  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => {
      reject(err);
    });

    blobStream.on('finish', async () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueName}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};

module.exports = { upload, uploadToFirebase };

