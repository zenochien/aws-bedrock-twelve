# Video Analysis Web App

Ứng dụng web phân tích video sử dụng AWS Bedrock và Twelve Labs model.

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

- Upload video qua drag & drop hoặc click chọn
- Nhập prompt tùy chỉnh để phân tích video
- Hiển thị kết quả phân tích từ AWS Bedrock
- Giao diện đẹp và responsive

## Yêu cầu

- Node.js >= 14
- AWS Account với quyền truy cập Bedrock
- Model Twelve Labs được kích hoạt trong AWS Bedrock