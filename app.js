const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

// AWS config
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'eu-west-1'
});

const bedrock = new AWS.BedrockRuntime({ region: process.env.AWS_REGION || 'eu-west-1' });
const s3 = new AWS.S3();

// Multer config (limit 2GB)
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 2 * 1024 * 1024 * 1024 }
});

// Middleware
app.use(express.static('public'));
app.use(express.json({ limit: '2gb' }));

// Route chính
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route S3 manager
app.get('/s3', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 's3-manager.html'));
});

// API để list S3 objects
app.get('/api/s3/list', async (req, res) => {
    try {
        const bucketName = process.env.S3_BUCKET_NAME;
        const bucketOwner = process.env.S3_BUCKET_OWNER;
        if (!bucketName) {
            return res.status(400).json({ error: 'S3_BUCKET_NAME không được cấu hình' });
        }

        const params = {
            Bucket: bucketName,
            MaxKeys: 100,
            ...(bucketOwner && { ExpectedBucketOwner: bucketOwner })
        };

        const data = await s3.listObjectsV2(params).promise();
        const videoFiles = data.Contents.filter(obj =>
            obj.Key.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i)
        );

        res.json({ success: true, files: videoFiles });
    } catch (error) {
        console.error('S3 list error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API để upload video lên S3
app.post('/api/s3/upload', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Không có file video được upload' });
        }

        const bucketName = process.env.S3_BUCKET_NAME;
        if (!bucketName) {
            return res.status(400).json({ error: 'S3_BUCKET_NAME không được cấu hình' });
        }

        const videoPath = req.file.path;
        const originalName = req.file.originalname;
        const timestamp = Date.now();
        const s3Key = `videos/${timestamp}-${originalName}`;

        // Đọc file và upload lên S3
        const fileContent = fs.readFileSync(videoPath);
        const bucketOwner = process.env.S3_BUCKET_OWNER;
        
        const uploadParams = {
            Bucket: bucketName,
            Key: s3Key,
            Body: fileContent,
            ContentType: req.file.mimetype,
            ...(bucketOwner && { ExpectedBucketOwner: bucketOwner })
        };

        const result = await s3.upload(uploadParams).promise();
        
        // Xóa file tạm
        fs.unlinkSync(videoPath);

        res.json({ 
            success: true, 
            message: 'Upload thành công',
            s3Key: s3Key,
            location: result.Location
        });

    } catch (error) {
        console.error('S3 upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API để phân tích video từ S3
app.post('/api/s3/analyze', async (req, res) => {
    try {
        const { s3Key, prompt } = req.body;
        const bucketName = process.env.S3_BUCKET_NAME;

        if (!bucketName || !s3Key) {
            return res.status(400).json({ error: 'Thiếu thông tin bucket hoặc file key' });
        }

        // Tạo presigned URL cho video
        const bucketOwner = process.env.S3_BUCKET_OWNER;
        const videoUrl = s3.getSignedUrl('getObject', {
            Bucket: bucketName,
            Key: s3Key,
            Expires: 3600, // 1 hour
            ...(bucketOwner && { ExpectedBucketOwner: bucketOwner })
        });

        // Request body cho Bedrock với S3 URL
        const requestBody = {
            inputPrompt: prompt || 'Describe this video',
            mediaSource: {
                s3Location: {
                    uri: `s3://${bucketName}/${s3Key}`,
                    bucketOwner: bucketOwner || process.env.S3_BUCKET_OWNER
                    // bucketOwner: process.env.S3_BUCKET_OWNER
                }
            }
        };

        const response = await bedrock.invokeModel({
            modelId: 'eu.twelvelabs.pegasus-1-2-v1:0',
            body: JSON.stringify(requestBody),
            contentType: 'application/json',
            accept: 'application/json'
        }).promise();

        const responseBody = JSON.parse(response.body.toString());
        let formattedMessage = (responseBody.message || responseBody.content || JSON.stringify(responseBody))
            .replace(/\\\"/g, '"')
            .replace(/&quot;/g, '"')
            .replace(/\n/g, '<br>');

        res.json({ success: true, result: formattedMessage, videoUrl });

    } catch (error) {
        console.error('S3 analyze error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route xử lý video
app.post('/analyze-video', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Không có file video được upload' });
        }

        const videoPath = req.file.path;
        const prompt = req.body.prompt || 'Describe this video';

        // Đọc video thành base64
        const videoBuffer = fs.readFileSync(videoPath);
        const base64Video = videoBuffer.toString('base64');

        // Request body cho Bedrock
        const requestBody = {
            inputPrompt: prompt,
            mediaSource: {
                base64String: base64Video
            }
        };

        const response = await bedrock.invokeModel({
            modelId: 'eu.twelvelabs.pegasus-1-2-v1:0',
            body: JSON.stringify(requestBody),
            contentType: 'application/json',
            accept: 'application/json'
        }).promise();

        const responseBody = JSON.parse(response.body.toString());
        let formattedMessage = (responseBody.message || responseBody.content || JSON.stringify(responseBody))
            .replace(/\\\"/g, '"')
            .replace(/&quot;/g, '"')
            .replace(/\n/g, '<br>');

        // Xóa file tạm
        fs.unlinkSync(videoPath);

        res.json({ success: true, result: formattedMessage });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});