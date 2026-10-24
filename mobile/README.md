# VitaLoom Mobile

Ứng dụng Expo + React Native + TypeScript cho dashboard sức khỏe demo. Heart rate và steps là **dữ liệu mô phỏng** từ Go Producer; sleep và water do người dùng nhập thủ công. Ứng dụng không kết nối Apple Health/HealthKit hoặc wearable thật.

## Yêu cầu

- Node.js LTS và npm
- Expo Go phiên bản tương thích với Expo SDK 57 trên iPhone
- Backend VitaLoom chạy qua Nginx
- PC và iPhone cùng một mạng LAN cho kết nối API trực tiếp

## Cài đặt

Từ thư mục **mobile/**:

    npm install

Tạo file **.env** từ **.env.example**, sau đó thay địa chỉ mẫu bằng IPv4 LAN thật của PC:

    EXPO_PUBLIC_API_BASE_URL=http://YOUR-PC-LAN-IP

Ví dụ địa chỉ có dạng **http://192.168.1.20**; không chép ví dụ này nếu đó không phải IP của PC bạn. Không dùng **localhost** trên iPhone vì khi đó localhost trỏ về chính điện thoại.

Khởi động backend và xác minh từ PC tại **http://localhost/api/health**.

Sau đó mở Safari trên iPhone và truy cập **http://YOUR-PC-LAN-IP/api/health**. Nếu điện thoại không nhận được phản hồi, kiểm tra Wi-Fi/LAN, Windows Firewall và port Nginx trước khi debug app. Cho phép Expo Go truy cập Local Network nếu iOS hỏi.

Chạy ứng dụng:

    npx expo start

Quét QR bằng Expo Go. Sau khi sửa .env, khởi động lại Metro để nạp biến môi trường mới. Chế độ tunnel của Metro chỉ giúp tải JavaScript bundle; nó không tự đưa API backend trên PC ra ngoài mạng LAN.

## Kiểm tra

    npx expo-doctor
    npx tsc --noEmit

## Hành vi dữ liệu

- Dashboard đọc GET /api/statistics/daily và cập nhật khoảng 2 giây một lần khi app đang foreground.
- Các trường null được hiển thị là **—** / chưa có dữ liệu, không tự chuyển thành **0**.
- Nếu refresh lỗi sau khi đã nhận dữ liệu, giá trị thành công gần nhất vẫn được giữ và app hiển thị cảnh báo.
- Ghi nước gọi POST /api/water-intakes; một action có intakeId, timestamp và payload ổn định để retry không cộng trùng.
- Ghi giấc ngủ gọi PUT /api/sleep/daily và sau đó refresh dashboard từ server.
- Ngày thống kê theo Asia/Ho_Chi_Minh và được cung cấp bởi API.

## Xử lý lỗi thường gặp

1. **Không kết nối được API:** mở /api/health trên iPhone Safari bằng IP LAN của PC; kiểm tra firewall và mạng.
2. **App không nạp biến môi trường:** xác nhận file tên chính xác .env, biến EXPO_PUBLIC_API_BASE_URL không có dấu ngoặc, rồi restart Expo.
3. **SDK không tương thích:** kiểm tra phiên bản Expo trong package.json và phiên bản Expo Go đang cài; dùng SDK mà thiết bị hỗ trợ.
4. **Dữ liệu không thay đổi:** xác nhận Producer đã gửi batch thành công và gọi /api/statistics/daily trực tiếp để xem backend có dữ liệu mới không.

## Giới hạn demo

Không có đăng nhập, phân tách dữ liệu người dùng, HealthKit, biểu đồ lịch sử, WebSocket hay xử lý nền. Dữ liệu chỉ thuộc ngày hiện tại theo contract của backend.
