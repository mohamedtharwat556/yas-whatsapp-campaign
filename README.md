# YAS WhatsApp Campaign

نظام بسيط لإدارة حملات واتساب مع صفحة عرض عامة للعملاء.

## المميزات

- إنشاء حملات واتساب بسهولة
- إضافة جهات الاتصال عبر ملفات Excel/CSV أو الإدخال اليدوي
- رفع الصور والفيديوهات لصفحة العرض
- إرسال الرسائل في مجموعات
- صفحة عرض عامة للعملاء لعرض الوسائط

## التثبيت

1. تثبيت الاعتماديات:
```bash
npm install
```

2. إنشاء ملف `.env` في الدليل الرئيسي:
```bash
cp .env.example .env
```

3. إضافة بيانات Supabase في ملف `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## إعداد Supabase

1. إنشاء مشروع جديد في [Supabase](https://supabase.com/)

2. تشغيل عمليات ترحيل قاعدة البيانات:
- افتح لوحة تحكم Supabase
- اذهب إلى SQL Editor
- نفذ الملفات التالية بالترتيب:
  - `supabase/migrations/001_initial_schema.sql`
  - `supabase/migrations/002_storage_policies.sql`
  - `supabase/migrations/003_fix_existing_tables.sql` (إذا كانت الجداول موجودة مسبقاً)

3. تفعيل المصادقة (اختياري):
- اذهب إلى Authentication > Providers
- قم بتفعيل Email provider

## تشغيل المشروع

### وضع التطوير
```bash
npm run dev
```

### بناء المشروع للإنتاج
```bash
npm run build
```

### معاينة البناء
```bash
npm run preview
```

## إرسال واتساب الفعلي

لتفعيل الإرسال التلقائي للرسائل، تحتاج إلى:

1. حساب WhatsApp Business API من Meta
2. WhatsApp Access Token
3. Phone Number ID

بعد الحصول على هذه البيانات، قم بتعديل دالة `sendWhatsAppMessage` في الملف:
`src/pages/CreateCampaign.jsx`

استبدل المحاكاة الحالية باستدعاء API الفعلي:

```javascript
const response = await fetch('https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${YOUR_WHATSAPP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messaging_product: 'whatsapp',
    to: recipient.phone_number,
    type: 'text',
    text: { body: message }
  })
});
```

## النشر على Vercel

1. ربط المشروع بـ GitHub
2. استيراد المشروع في Vercel
3. إضافة متغيرات البيئة في إعدادات Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. النشر

## الصفحات

### صفحة إنشاء الحملة (`/`)
- كتابة رسالة الحملة
- إضافة جهات الاتصال
- رفع الوسائط
- إرسال الرسائل

### صفحة عرض الحملة (`/campaigns/:slug`)
- عرض الصور والفيديوهات
- تفاصيل الحملة
- زر التواصل عبر واتساب

## الأمان

- يستخدم Row Level Security (RLS) لحماية البيانات
- الوسائط العامة متاحة فقط عبر bucket محمي
- البيانات الخاصة محمية بسياسات الوصول
