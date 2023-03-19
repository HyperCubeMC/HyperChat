const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const multer = require('multer');
const path = require('path');

// Set the storage engine for the uploaded files
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Initialize the upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // Set the maximum file size to 1 MB
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
}).single('file');

// Check the file type before uploading
function checkFileType(file, cb) {
  // Allowed file extensions
  const filetypes = /jpeg|jpg|png|gif/;
  // Check the extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check the mime type
  const mimetype = filetypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

// Serve the static files from the "public" directory
app.use(express.static('./public'));

// Route for file upload
app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.status(400).send({ msg: err });
    } else {
      if (req.file === undefined) {
        res.status(400).send({ msg: 'Error: No File Selected!' });
      } else {
        // Emit the uploaded file data to all connected clients
        io.emit('new image', { image: req.file.filename });
        res.status(200).send({ msg: 'File Uploaded!' });
      }
    }
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server started on port 3000');
});