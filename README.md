# Pam's Garden: Sổ tay vườn kiểng lá

Trang tĩnh song ngữ Việt–Anh cho một vườn kiểng lá nhỏ ở Cần Thơ, làm vì đam mê. Cuộn từ rạng sáng đến đêm khuya qua một cuốn sổ tay: ảnh thật dán vào sổ, đồng hồ và vầng nắng đổi theo giờ, đom đóm về đêm. Dùng tốt trên điện thoại và máy tính. Kịch bản nội dung ở [`docs/KICH-BAN.md`](docs/KICH-BAN.md).

## Công nghệ

| Phần | Lựa chọn |
|---|---|
| Trang | HTML + CSS + JS thuần, không build step |
| Cuộn mượt | Lenis `1.1.13` (CDN, ghim phiên bản, có SRI) |
| Ảnh 3D | three.js `0.160.0`, chỉ trên máy tính có chuột |
| Chữ | Newsreader, Hanken Grotesk (có glyph tiếng Việt) |
| Song ngữ | Cặp `<span class="vi">` / `<span class="en">` + `html[lang]` |
| Ảnh | Python (Pillow) đổi cỡ WebP 640 và 1080 px, `v2/tools/bake_photos.py` |

## Chạy thử

```bash
python -m http.server 8123 --bind 127.0.0.1 --directory v2/frontend
```

Mở `http://127.0.0.1:8123/`.

## Cấu trúc

```
docs/            kịch bản, nội dung
v1/frontend/     bản đầu tiên
v2/frontend/     trang hiện tại (gốc deploy)
v2/backend/      chưa dùng
v2/database/     chưa dùng
v2/storage/      ảnh gốc
v2/tools/        xử lý ảnh, kiểm tra hiển thị
```
