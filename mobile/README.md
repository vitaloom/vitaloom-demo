# VitaLoom Mobile

Ứng dụng Expo + React Native + TypeScript cho dashboard sức khỏe demo. Heart rate và steps là **dữ liệu mô phỏng** từ Go Producer; sleep và water do người dùng nhập thủ công. Ứng dụng không kết nối Apple Health/HealthKit hoặc wearable thật.

## Trạng thái hiện tại

- App đã được merge vào `main`.
- Chủ dự án đã xác nhận chạy E2E thủ công trên iPhone của mình: mở Expo session, đăng nhập bằng Expo account đang dùng cho demo, quét QR bằng Expo Go và chạy được app.
- Luồng chia sẻ hiện tại có giới hạn: người khác chưa tự mở được nếu không dùng Expo account của chủ dự án. Chưa xác minh nguyên nhân gốc hay cách chia sẻ độc lập; không mặc định đây là lỗi của API/backend.
- `npx expo-doctor` và `npx tsc --noEmit` chưa có kết quả được ghi nhận trong tài liệu này. Việc app mở thành công không thay thế cho hai kiểm tra đó.

## Yêu cầu

- Node.js LTS và npm
- Expo Go tương thích với SDK của dự án trên iPhone
- Backend VitaLoom chạy qua Nginx
- PC và iPhone có kết nối mạng cho phép truy cập API qua LAN

Phiên bản trong `package.json` hiện tại: Expo `~57.0.31`, React Native `0.86.3`, React `19.2.3`. Nếu thay đổi SDK/dependency, hãy xác minh lại với Expo Go đang cài trên thiết bị thật.

## Cài đặt

Từ thư mục **mobile/**:

```bash
npm install
```

Tạo file **.env** từ **.env.example**, sau đó thay địa chỉ mẫu bằng IPv4 LAN thật của PC:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://YOUR-PC-LAN-IP
```

Ví dụ địa chỉ có dạng **http://192.168.1.20**; chỉ dùng nếu đó là IP thật của PC. Không dùng **localhost** trên iPhone vì localhost trỏ về chính điện thoại.

Khởi động backend và xác minh từ PC tại **http://localhost/api/health**. Sau đó mở Safari trên iPhone và truy cập **http://YOUR-PC-LAN-IP/api/health**. Nếu điện thoại không nhận được phản hồi, kiểm tra Wi-Fi/LAN, Windows Firewall và port Nginx trước khi debug app. Cho phép Expo Go truy cập Local Network nếu iOS hỏi.

Chạy ứng dụng:

```bash
npx expo start
```

Đăng nhập bằng Expo account đang được dùng cho luồng demo đã xác nhận, sau đó quét QR bằng Expo Go. Sau khi sửa `.env`, khởi động lại Metro để nạp biến môi trường mới.

**Lưu ý:** luồng trên đã được xác nhận với iPhone/account của chủ dự án; chưa xác minh luồng chia sẻ cho account khác. Metro tunnel chỉ giúp tải JavaScript bundle; nó không tự đưa API backend trên PC ra ngoài mạng LAN.

## Kiểm tra bổ sung

Các lệnh dưới đây là bước kiểm tra nên chạy và lưu lại kết quả; tài liệu hiện chưa ghi nhận chúng đã chạy thành công:

```bash
npx expo-doctor
npx tsc --noEmit
```

## Hành vi dữ liệu

- Dashboard đọc `GET /api/statistics/daily` và cập nhật khoảng 2 giây một lần khi app đang foreground.
- Các trường `null` được hiển thị là **—** / chưa có dữ liệu, không tự chuyển thành **0**.
- Nếu refresh lỗi sau khi đã nhận dữ liệu, giá trị thành công gần nhất vẫn được giữ và app hiển thị cảnh báo.
- Ghi nước gọi `POST /api/water-intakes`; một action có `intakeId`, timestamp và payload ổn định để retry không cộng trùng.
- Ghi giấc ngủ gọi `PUT /api/sleep/daily` và sau đó refresh dashboard từ server.
- Ngày thống kê theo `Asia/Ho_Chi_Minh` và được cung cấp bởi API.

## Xử lý lỗi thường gặp

1. **Không kết nối được API:** mở `/api/health` trên iPhone Safari bằng IP LAN của PC; kiểm tra firewall và mạng.
2. **App không nạp biến môi trường:** xác nhận file tên chính xác `.env`, biến `EXPO_PUBLIC_API_BASE_URL` không có dấu ngoặc, rồi restart Expo.
3. **SDK không tương thích:** kiểm tra phiên bản Expo trong `package.json` và phiên bản Expo Go đang cài; dùng SDK mà thiết bị hỗ trợ.
4. **Dữ liệu không thay đổi:** xác nhận Producer đã gửi batch thành công và gọi `/api/statistics/daily` để xem backend có dữ liệu mới không.

## Giới hạn demo

Không có đăng nhập ứng dụng, phân tách dữ liệu người dùng, HealthKit, biểu đồ lịch sử, WebSocket hay xử lý nền. Dữ liệu chỉ thuộc ngày hiện tại theo contract của backend.
