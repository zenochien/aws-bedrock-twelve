# Video Analysis Web App

Ứng dụng web phân tích video sử dụng AWS Bedrock và Twelve Labs model với tích hợp S3.

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Cấu hình AWS credentials:
```bash
cp .env.example .env
# Chỉnh sửa file .env với thông tin AWS của bạn
```

3. Chạy ứng dụng:
```bash
npm start
```

4. Mở trình duyệt và truy cập: http://localhost:3000

## Tính năng

### 📤 Upload Video Local
- Upload video qua drag & drop hoặc click chọn
- Hỗ trợ file lên đến 2GB
- Nhập prompt tùy chỉnh để phân tích video
- Hiển thị kết quả phân tích từ AWS Bedrock

### 📁 S3 Video Manager
- Upload video lên S3 với progress bar 0-100%
- Chặn reload khi đang upload
- Xem danh sách video từ S3 bucket
- Tìm kiếm video theo tên
- Phân tích video trực tiếp từ S3
- Tạo presigned URL để xem video

### 🔍 Tính năng khác
- Giao diện đẹp và responsive
- Real-time search trong S3
- Upload progress tracking
- Error handling và validation

## Cấu hình .env

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-west-1
S3_BUCKET_NAME=your-bucket-name
S3_BUCKET_OWNER=your-account-id
```

## Routes

- `/` - Upload video local
- `/s3` - S3 Video Manager
- `/api/s3/list` - List S3 videos
- `/api/s3/upload` - Upload to S3
- `/api/s3/analyze` - Analyze S3 video

## Yêu cầu

- Node.js >= 14
- AWS Account với quyền truy cập Bedrock và S3
- Model Twelve Labs được kích hoạt trong AWS Bedrock
- S3 bucket đã tạo và cấu hình quyền