// const express = require('express');
// const multer = require('multer');
// const AWS = require('aws-sdk');
// const fs = require('fs');
// const path = require('path');

// const app = express();
// const PORT = 3000;

// // Cấu hình AWS
// const bedrock = new AWS.BedrockRuntime({
//     region: 'eu-west-1'
// });

// // Cấu hình multer để upload file
// const upload = multer({ dest: 'uploads/' });

// // Middleware
// app.use(express.static('public'));
// app.use(express.json());

// // Route chính
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // Route xử lý video
// app.post('/analyze-video', upload.single('video'), async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ error: 'Không có file video được upload' });
//         }

//         const videoPath = req.file.path;
//         const prompt = req.body.prompt || 'tell me about the video';

//         // Đọc file và chuyển thành base64
//         const videoBuffer = fs.readFileSync(videoPath);
//         const base64Video = videoBuffer.toString('base64');

//         // Gọi AWS Bedrock
//         const requestBody = {
//             inputPrompt: prompt,
//             mediaSource: {
//                 base64String: base64Video
//             }
//         };

//         const response = await bedrock.invokeModel({
//             modelId: 'eu.twelvelabs.pegasus-1-2-v1:0',
//             body: JSON.stringify(requestBody),
//             contentType: 'application/json',
//             accept: 'application/json'
//         }).promise();

//         const responseBody = JSON.parse(response.body.toString());

//         // Xóa file tạm
//         fs.unlinkSync(videoPath);

//         res.json({
//             success: true,
//             result: responseBody
//         });

//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// app.listen(PORT, () => {
//     console.log(`Server đang chạy tại http://localhost:${PORT}`);
// });

const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// AWS Bedrock config
const bedrock = new AWS.BedrockRuntime({
    region: 'eu-west-1'
});

// Multer config (limit 100MB)
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 100 * 1024 * 1024 }
});

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Route chính
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route xử lý video
app.post('/analyze-video', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Không có file video được upload' });
        }

        const videoPath = req.file.path;
        const prompt = req.body.prompt || 'Tell me about the video';

        // Đọc file video -> base64
        const videoBuffer = fs.readFileSync(videoPath);
        const base64Video = videoBuffer.toString('base64');

        // Body request cho Bedrock (demo, có thể phải chỉnh theo API Twelve Labs thật)
        const requestBody = {
            inputPrompt: prompt,
            mediaSource: {
                base64String: base64Video
            }
        };

        // Gọi Bedrock model
        const response = await bedrock.invokeModel({
            modelId: 'eu.twelvelabs.pegasus-1-2-v1:0',
            body: JSON.stringify(requestBody),
            contentType: 'application/json',
            accept: 'application/json'
        }).promise();

        const responseBody = JSON.parse(response.body.toString());

        // Format xuống dòng
        let formattedMessage = responseBody.message || '';
        formattedMessage = formattedMessage.replace(/\n\n/g, '\n').replace(/\n/g, '<br>');

        // Xóa file tạm
        fs.unlinkSync(videoPath);

        res.json({
            success: true,
            result: formattedMessage
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
