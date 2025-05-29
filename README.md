# 🎬 YouTube Farsi Translator

<div align="center">

![Version](https://img.shields.io/badge/version-1.5-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-yellow.svg)
![Persian](https://img.shields.io/badge/language-Persian-red.svg)

**یک افزونه کروم قدرتمند برای ترجمه زیرنویس‌های انگلیسی یوتیوب به فارسی**

[📥 دانلود](#نصب) • [🚀 ویژگی‌ها](#ویژگی‌ها) • [⚙️ تنظیمات](#تنظیمات) • [🤝 مشارکت](#مشارکت)

</div>

---

## 📖 درباره پروژه

YouTube Farsi Translator یک افزونه کروم پیشرفته است که به شما امکان ترجمه آنی زیرنویس‌های انگلیسی ویدیوهای یوتیوب به فارسی را می‌دهد. این افزونه با استفاده از هوش مصنوعی‌های پیشرفته مانند OpenRouter و Gemini، ترجمه‌های با کیفیت و طبیعی ارائه می‌دهد.

## ✨ ویژگی‌ها

### 🔥 ویژگی‌های اصلی
- **ترجمه آنی**: ترجمه خودکار زیرنویس‌های انگلیسی به فارسی
- **نمایش همزمان**: نمایش زیرنویس انگلیسی و فارسی به صورت همزمان
- **پشتیبانی از چند API**: OpenRouter و Gemini API
- **ترجمه تکه‌ای**: تقسیم ویدیوهای طولانی برای ترجمه بهتر
- **ذخیره خودکار**: ذخیره ترجمه‌ها برای استفاده مجدد

### 🎯 ویژگی‌های پیشرفته
- **پراگرس بار**: نمایش پیشرفت ترجمه به صورت زنده
- **پرامپت سفارشی**: امکان ویرایش پرامپت ترجمه
- **مدیریت ذخیره‌سازی**: مشاهده و مدیریت ترجمه‌های ذخیره شده
- **رابط کاربری فارسی**: طراحی کاملاً فارسی با فونت وزیر

### 🛠️ ویژگی‌های فنی
- **بهینه‌سازی عملکرد**: ترجمه سریع و کارآمد
- **مدیریت خطا**: مدیریت هوشمند خطاها و بازیابی
- **رابط کاربری مدرن**: طراحی زیبا و کاربرپسند
- **سازگاری بالا**: کار با انواع ویدیوهای یوتیوب

## 🚀 نصب

### نصب دستی (حالت توسعه‌دهنده)

1. **دانلود پروژه**
   ```bash
   git clone https://github.com/mortezadalil/Youtube-Ai-Translator.git
   cd Youtube-Ai-Translator
   ```

2. **فعال‌سازی حالت توسعه‌دهنده**
   - کروم را باز کنید
   - به `chrome://extensions/` بروید
   - "Developer mode" را فعال کنید

3. **بارگذاری افزونه**
   - روی "Load unpacked" کلیک کنید
   - پوشه پروژه را انتخاب کنید
   - افزونه نصب خواهد شد

## ⚙️ تنظیمات

### 🔑 تنظیم کلید API

#### OpenRouter API
1. به [OpenRouter.ai](https://openrouter.ai/keys) بروید
2. حساب کاربری ایجاد کنید
3. کلید API دریافت کنید
4. در تنظیمات افزونه وارد کنید

#### Gemini API
1. به [Google AI Studio](https://aistudio.google.com/app/apikey) بروید
2. کلید API دریافت کنید
3. در تنظیمات افزونه وارد کنید

### 🎛️ تنظیمات پیشرفته

- **انتخاب مدل**: انتخاب مدل هوش مصنوعی مورد نظر
- **مدت زمان تکه**: تنظیم طول هر بخش برای ترجمه (1-30 دقیقه)
- **بازه زمانی**: انتخاب بخش خاصی از ویدیو
- **پرامپت سفارشی**: ویرایش دستورات ترجمه

## 📱 نحوه استفاده

1. **باز کردن ویدیو**: ویدیوی یوتیوب مورد نظر را باز کنید
2. **فعال‌سازی افزونه**: روی آیکن افزونه در پلیر کلیک کنید
3. **تنظیم API**: کلید API خود را وارد کنید
4. **شروع ترجمه**: روی "دریافت ترجمه" کلیک کنید
5. **لذت ببرید**: از تماشای ویدیو با زیرنویس فارسی لذت ببرید

## 🎨 تصاویر

<div align="center">

### رابط کاربری اصلی
![Main Interface](https://via.placeholder.com/600x300/1a1a1a/ffffff?text=YouTube+Farsi+Translator)

### پنل تنظیمات
![Settings Panel](https://via.placeholder.com/400x500/2a2a2a/ffffff?text=Settings+Panel)

### نمایش زیرنویس
![Subtitle Display](https://via.placeholder.com/600x200/333333/ffffff?text=Subtitle+Display)

</div>

## 🔧 مدل‌های پشتیبانی شده

### OpenRouter Models
- `meta-llama/llama-3.1-8b-instruct:free` (رایگان)
- `meta-llama/llama-3.1-70b-instruct`
- `anthropic/claude-3-haiku`
- `google/gemini-pro`

### Gemini Models
- `gemini-2.0-flash`
- `gemini-1.5-pro`

## 📊 آمار پروژه

- **خطوط کد**: 6000+ خط
- **ویژگی‌ها**: 20+ ویژگی
- **زبان‌ها**: JavaScript, CSS, HTML
- **سازگاری**: Chrome 88+

## 🤝 مشارکت

ما از مشارکت شما استقبال می‌کنیم! برای مشارکت:

1. پروژه را Fork کنید
2. شاخه جدید ایجاد کنید (`git checkout -b feature/AmazingFeature`)
3. تغییرات را Commit کنید (`git commit -m 'Add some AmazingFeature'`)
4. به شاخه Push کنید (`git push origin feature/AmazingFeature`)
5. Pull Request ایجاد کنید

## 🐛 گزارش باگ

برای گزارش باگ‌ها، پیشنهادات و انتقادات:

📧 **ایمیل**: mortezadalil@gmail.com

لطفاً موارد زیر را در گزارش خود ذکر کنید:
- نسخه مرورگر
- نسخه افزونه
- توضیح کامل مشکل
- مراحل بازتولید باگ

## 📄 مجوز

این پروژه تحت مجوز MIT منتشر شده است. برای اطلاعات بیشتر فایل [LICENSE](LICENSE) را مطالعه کنید.

## 🙏 تشکر

- از تیم [OpenRouter](https://openrouter.ai) برای ارائه API قدرتمند
- از [Google](https://ai.google.dev) برای Gemini API
- از جامعه متن‌باز برای ابزارها و کتابخانه‌های استفاده شده

---

<div align="center">

**ساخته شده با ❤️ برای جامعه فارسی‌زبان**

[⭐ ستاره بدهید](https://github.com/mortezadalil/Youtube-Ai-Translator) • [🐛 باگ گزارش کنید](mailto:mortezadalil@gmail.com) • [💡 پیشنهاد دهید](mailto:mortezadalil@gmail.com)

</div>
