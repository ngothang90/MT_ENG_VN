# Live Translator Free

Phiên bản miễn phí của Live Translator. Bản này không gọi OpenAI API, không dùng Cloudflare Worker và không yêu cầu API Key.

## Cập nhật GitHub Pages

Thay thế 3 file ở thư mục gốc repository bằng các file trong gói này:

- `index.html`
- `manifest.json`
- `sw.js`

Sau đó Commit changes. Mở website trên máy tính bằng Ctrl+F5. Trên điện thoại, đóng PWA hoàn toàn rồi mở lại; nếu chưa cập nhật, xóa shortcut cũ và thêm lại website từ trình duyệt.

## Cách hoạt động và giới hạn

- Nhận diện giọng nói bằng Web Speech API của trình duyệt (`SpeechRecognition` / `webkitSpeechRecognition`). Không cần API key. Trên một số trình duyệt như Chrome, âm thanh có thể được gửi tới dịch vụ nhận diện trực tuyến của trình duyệt; tính năng không hoạt động offline và hỗ trợ không đồng đều giữa các trình duyệt.
- Dịch văn bản qua endpoint Google Translate công khai không chính thức; MyMemory là phương án dự phòng. Các dịch vụ công khai có thể giới hạn tần suất, thay đổi hoặc tạm ngừng, không có SLA.
- Không có AI hiểu ngữ cảnh hoặc hiệu chỉnh câu nghe sai như Realtime trả phí. Hãy nói gần micro, rõ ràng, giảm tiếng ồn; chọn đúng ngôn ngữ nguồn.
- Giao diện hỗ trợ tiếng Việt, Anh, Nhật, Trung giản thể, Hàn. Chế độ song ngữ dùng hai micro theo lượt như bản cũ.

## Không cần

- Không cần Node.js.
- Không cần Cloudflare Worker.
- Không cần OpenAI API Key.
- Không cần thanh toán API.
