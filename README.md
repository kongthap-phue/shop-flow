# ShopFlow

ร้านค้าออนไลน์สำหรับโปรเจกต์วิชา IT332 ตอนนี้รันในเครื่องได้ครบทุกฟีเจอร์ โค้ดฝั่ง backend เขียนเป็นฟังก์ชันแบบ Lambda ไว้แล้ว เพื่อให้ย้ายขึ้น AWS ทีหลังได้โดยแก้น้อยที่สุด

## วิธีรัน

ต้องมี Node.js 20 ขึ้นไป

```bash
npm run setup   # ติดตั้งทุกอย่าง + ใส่สินค้าตัวอย่าง (รันครั้งแรกครั้งเดียว)
npm run dev     # เปิด backend (port 4301) + หน้าเว็บ (port 4300)
```

เปิด http://localhost:4300

ถ้าพอร์ตชนกับงานอื่น เปลี่ยนได้ด้วย `WEB_PORT=xxxx API_PORT=yyyy npm run dev`

### ให้เพื่อนเข้าดู

- อยู่ Wi-Fi เดียวกัน: ให้เพื่อนเปิด `http://<IP ของเครื่องเรา>:4300` (ดู IP ด้วย `ipconfig getifaddr en0`)
- อยู่คนละที่: เปิด `npm run dev` ไว้ แล้วรัน `npm run share` (ใช้ ngrok) จะได้ลิงก์ https ส่งให้เพื่อนได้เลย

| บัญชีทดลอง | อีเมล | รหัสผ่าน |
|---|---|---|
| แอดมิน | `admin@shop.local` | `admin1234` |
| ลูกค้า | `customer@shop.local` | `customer1234` |

บัตรทดสอบตอนชำระเงิน (ไม่ตัดเงินจริง)

- `4242 4242 4242 4242` จ่ายสำเร็จ
- `4000 0000 0000 0002` บัตรถูกปฏิเสธ
- วันหมดอายุกับ CVC ใส่อะไรก็ได้ให้ถูกรูปแบบ เช่น `12/28`, `123`

คำสั่งอื่น

- `npm run seed` ล้างข้อมูลทั้งหมดแล้วใส่สินค้าตัวอย่างใหม่
- `npm run report` รันรายงานยอดขายประจำวันด้วยมือ

## ฟีเจอร์

**ลูกค้า:** สมัคร/ล็อกอิน · ดูและค้นหาสินค้า กรองตามหมวด · ตะกร้า · ชำระเงิน · ดูประวัติคำสั่งซื้อ

**แอดมิน (เมนู "หลังร้าน"):** เพิ่ม/แก้/ลบสินค้า · อัปโหลดรูป · ดูและเปลี่ยนสถานะคำสั่งซื้อ (ชำระแล้ว → กำลังจัดส่ง → จัดส่งสำเร็จ หรือยกเลิกแล้วคืนสต็อก) · ดูการแจ้งเตือน

**งานอัตโนมัติ**

- อัปรูปสินค้า → ย่อเป็น thumbnail 480×480 ให้เอง
- มีคำสั่งซื้อใหม่ → ตัดสต็อก + แจ้งแอดมิน พร้อมเตือนสินค้าใกล้หมด
- รายงานยอดขาย 24 ชม. ล่าสุด + สินค้าใกล้หมด (กดสร้างได้ที่หลังร้าน → การแจ้งเตือน)

## โครงสร้าง

```
backend/
  src/                    ← โค้ดที่จะขึ้น AWS
    handlers/             API: products, orders, uploads   (→ Lambda หลัง API Gateway)
    events/               onImageUploaded                  (→ Lambda จาก S3 trigger)
                          onOrderCreated                   (→ Lambda จาก DynamoDB Stream)
                          dailyReport                      (→ Lambda จาก EventBridge)
    lib/
      db.js               เก็บข้อมูลเป็นไฟล์ JSON          (→ เปลี่ยนเป็น DynamoDB)
      storage.js          เก็บรูปในโฟลเดอร์ uploads/       (→ เปลี่ยนเป็น S3 + CloudFront)
      notify.js           แจ้งเตือนลงไฟล์                 (→ เปลี่ยนเป็น SNS)
      payment.js          จำลองการตัดบัตร                  (→ เปลี่ยนเป็น Stripe/Omise test mode)
      auth.js             อ่านข้อมูลผู้ใช้จาก Cognito claims (ใช้ได้เลย ไม่ต้องแก้)
  local/                  ← ใช้แค่ตอนรันในเครื่อง ไม่ต้องขึ้น AWS
    server.js             จำลอง API Gateway, S3, DynamoDB Stream
    auth-local.js         ล็อกอินจำลอง                     (→ Cognito แทน)
    seed.js               ข้อมูลตัวอย่าง
frontend/                 React + Vite + Tailwind          (→ Amplify Hosting)
```

ตอนย้ายขึ้น AWS ไฟล์ใน `handlers/` กับ `events/` แทบไม่ต้องแก้ ที่ต้องเขียนใหม่คือไฟล์ใน `lib/` ที่มีลูกศรบอกไว้ และเปลี่ยนการล็อกอินฝั่งหน้าเว็บ (`frontend/src/auth.jsx`) ไปใช้ Cognito

## API

| Method | Path | ใครเรียก |
|---|---|---|
| GET | `/products` | ทุกคน |
| GET | `/products/{id}` | ทุกคน |
| POST | `/products` | แอดมิน |
| PUT | `/products/{id}` | แอดมิน |
| DELETE | `/products/{id}` | แอดมิน |
| POST | `/uploads` | แอดมิน |
| POST | `/orders` | ลูกค้า |
| GET | `/orders/me` | ลูกค้า |
| GET | `/orders` | แอดมิน |
| PATCH | `/orders/{id}` | แอดมิน |
