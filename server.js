const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const port = 3000;

// Set up AWS S3
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Middleware for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static('public'));

// Endpoint to upload an image to S3
app.post('/upload', upload.single('image'), async (req, res) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${Date.now()}-${req.file.originalname}`,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };

  try {
    const data = await s3.upload(params).promise();
    res.json({ imageUrl: data.Location });
  } catch (err) {
    console.error('Error uploading to S3:', err);
    res.status(500).send('Error uploading image to S3');
  }
});

// Endpoint to get list of images from S3
app.get('/images', async (req, res) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    const imageUrls = data.Contents.map((item) => {
      return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`;
    });
    res.json(imageUrls);
  } catch (err) {
    console.error('Error fetching images from S3:', err);
    res.status(500).send('Error fetching images from S3');
  }
});

// Serve front.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'front.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
