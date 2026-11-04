# Live Translator AI — bộ mã nâng cấp

Bộ này thay engine `SpeechRecognition` của trình duyệt và các API dịch văn bản cũ bằng **OpenAI Realtime Translation qua WebRTC**. Cloudflare Worker chỉ tạo client secret thời hạn ngắn; API key chính được giữ trong Worker Secret.

## Thành phần

- `index.html`: giao diện nghe & dịch một chiều và hội thoại hai chiều.
- `manifest.json`: cấu hình cài ứng dụng PWA.
- `sw.js`: service worker; bản dịch trực tiếp cần Internet.
- `worker/worker.js`: API backend tạo client secret.
- `worker/wrangler.toml`: cấu hình triển khai Cloudflare Worker và danh sách domain được phép.

## A. Chuẩn bị OpenAI API key

1. Tạo API key trong OpenAI API Platform. Việc sử dụng API có tính phí riêng theo mức dùng; gói ChatGPT không tự động bao gồm chi phí API.
2. Không dán API key vào `index.html`, GitHub hoặc gửi key cho người khác.

## B. Triển khai Cloudflare Worker

Cài Node.js LTS, sau đó mở terminal tại thư mục `worker`:

```bash
npx wrangler login
npx wrangler secret put OPENAI_API_KEY
npx wrangler deploy
```

Khi chạy lệnh `secret put`, dán API key vào cửa sổ terminal. Giá trị này được lưu dưới dạng Secret trong Cloudflare, không nằm trong mã nguồn.

Trước khi deploy, mở `worker/wrangler.toml` và thay:

```toml
ALLOWED_ORIGINS = "https://YOUR_GITHUB_USERNAME.github.io,http://localhost:8788"
```

bằng origin GitHub Pages thật của anh, ví dụ `https://ten-tai-khoan.github.io`. Origin chỉ gồm giao thức + domain, không thêm tên repository hoặc dấu `/` cuối. Giữ `http://localhost:8788` nếu muốn kiểm tra local.

Sau deploy, Cloudflare hiển thị URL dạng:

```text
https://live-translator-ai-worker.<ten-tai-khoan>.workers.dev
```

Lưu lại URL này.

## C. Cập nhật GitHub Pages

1. Chép `index.html`, `manifest.json` và `sw.js` ở thư mục gốc của gói này vào repository GitHub Pages, ghi đè ba file cũ.
2. Commit và push lên GitHub để Pages cập nhật.
3. Mở trang web, chọn **Kết nối**, dán URL Worker vừa deploy vào ô địa chỉ rồi nhấn **Lưu địa chỉ**.
4. Nhấn **Kiểm tra**. Nếu hiện “Kết nối Worker thành công” là cấu hình CORS và Worker đã đúng.
5. Bấm **BẮT ĐẦU NGHE** và cấp quyền microphone.

## D. Cách sử dụng

### Nghe & dịch

- AI tự nhận diện ngôn ngữ đầu vào.
- Chọn ngôn ngữ đích.
- Nhấn BẮT ĐẦU NGHE một lần và giữ phiên chạy trong suốt cuộc họp.
- Lời nói gốc và bản dịch hiển thị trực tiếp; các đoạn đã nhận được lưu ở phần lịch sử.
- Chọn ngôn ngữ đích khác khi đang chạy để cập nhật phiên hiện tại.

### Hội thoại 2 chiều

- Chọn ngôn ngữ của anh và ngôn ngữ đối phương.
- Khi anh nói, nhấn **TÔI NÓI** để dịch sang ngôn ngữ đối phương.
- Khi đối phương nói, nhấn **ĐỐI PHƯƠNG NÓI** để đổi ngôn ngữ dịch về ngôn ngữ của anh.
- Nhấn lại nút đang sáng để dừng nghe.
- Nút đọc bản dịch cho phép bật/tắt âm thanh dịch.

## E. Ghi chú quan trọng

- Realtime Translation xuất đồng thời transcript lời nói gốc và transcript bản dịch. AI có thể cải thiện nhận diện khi phát âm, tốc độ và ngữ cảnh không hoàn hảo, nhưng không thể khôi phục chắc chắn tiếng nói quá nhỏ, bị che lấp hoặc nhiễu mạnh.
- Với mic phòng họp / thu âm xa, Worker yêu cầu giảm nhiễu `far_field` ở mức 0.85. Chất lượng cuối cùng vẫn phụ thuộc microphone, khoảng cách, tiếng vang, loa và kết nối Internet.
- Chuyển người nói trong chế độ hai chiều đổi ngôn ngữ đích trong cùng một phiên để hạn chế mất ngữ cảnh. Người dùng vẫn cần bấm đúng người đang nói; ứng dụng không tự phân biệt danh tính người nói.
- Ứng dụng cần HTTPS, microphone permission và Internet. Trên iPhone, chế độ nền có thể bị iOS hạn chế microphone/WebRTC; không nên coi PWA là giải pháp đảm bảo nghe liên tục khi khóa màn hình.
- `ALLOWED_ORIGINS` là lớp kiểm soát nguồn truy cập trình duyệt, không phải xác thực người dùng. Với ứng dụng public, nên thêm Cloudflare Rate Limiting hoặc Cloudflare Access để hạn chế người lạ lạm dụng endpoint tạo phiên.
- Worker không lưu âm thanh hoặc bản dịch. Nội dung âm thanh được gửi đến OpenAI để xử lý theo dịch vụ Realtime API.

## F. Xử lý lỗi thường gặp

- **403 Origin chưa được cho phép:** kiểm tra `ALLOWED_ORIGINS` đúng domain GitHub Pages, rồi deploy Worker lại.
- **Worker chưa được cấu hình secret:** chạy `npx wrangler secret put OPENAI_API_KEY` trong thư mục `worker`.
- **401/403 từ OpenAI:** kiểm tra API key, trạng thái billing và quyền truy cập model/API của project.
- **Không truy cập được microphone:** dùng HTTPS, cấp quyền mic cho trình duyệt và đóng ứng dụng khác đang chiếm microphone.
- **Âm thanh nói nhanh / xa vẫn sai:** thử microphone gần người nói hơn, giảm tiếng ồn phòng họp và dùng micro ngoài. Mô hình AI không thể phục hồi tín hiệu không thu được.
