import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

function CreateCampaign() {
  const [message, setMessage] = useState('');
  const [previewMessage, setPreviewMessage] = useState('');
  const [manualNumbers, setManualNumbers] = useState('');
  const [batchSize, setBatchSize] = useState(100);
  const [recipients, setRecipients] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [campaignId, setCampaignId] = useState(null);
  const [campaignSlug, setCampaignSlug] = useState('');
  const [status, setStatus] = useState('draft');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sendingProgress, setSendingProgress] = useState({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    currentBatch: 0
  });
  const [currentRecipient, setCurrentRecipient] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    updatePreview(message);
  }, [message]);

  const updatePreview = (msg) => {
    if (recipients.length > 0) {
      const sampleName = recipients[0].name || 'العميل';
      const personalized = msg.replace(/\{name\}/g, sampleName);
      setPreviewMessage(personalized);
    } else {
      setPreviewMessage(msg.replace(/\{name\}/g, 'العميل'));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processImportedData(results.data);
        },
        error: (error) => {
          setError('خطأ في قراءة ملف CSV: ' + error.message);
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        processImportedData(jsonData);
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError('يرجى تحميل ملف CSV أو Excel فقط');
    }
  };

  const processImportedData = (data) => {
    const newRecipients = [];
    const phoneNumbers = new Set();

    data.forEach((row) => {
      const keys = Object.keys(row);
      const nameKey = keys.find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('اسم'));
      const phoneKey = keys.find(k => k.toLowerCase().includes('phone') || k.toLowerCase().includes('tel') || k.toLowerCase().includes('هاتف') || k.toLowerCase().includes('رقم'));

      const name = nameKey ? row[nameKey] : '';
      const phone = phoneKey ? row[phoneKey] : Object.values(row)[0];

      if (phone) {
        const cleanedPhone = phone.toString().replace(/\D/g, '');
        if (cleanedPhone.length >= 10 && !phoneNumbers.has(cleanedPhone)) {
          phoneNumbers.add(cleanedPhone);
          newRecipients.push({
            name: name || '',
            phone_number: cleanedPhone,
            status: 'pending'
          });
        }
      }
    });

    setRecipients(newRecipients);
    setSuccess(`تم استيراد ${newRecipients.length} جهة اتصال بنجاح`);
    setError('');
  };

  const handleManualNumbers = () => {
    const lines = manualNumbers.split('\n').filter(line => line.trim());
    const newRecipients = [];
    const phoneNumbers = new Set(recipients.map(r => r.phone_number));

    lines.forEach(line => {
      const cleanedPhone = line.replace(/\D/g, '');
      if (cleanedPhone.length >= 10 && !phoneNumbers.has(cleanedPhone)) {
        phoneNumbers.add(cleanedPhone);
        newRecipients.push({
          name: '',
          phone_number: cleanedPhone,
          status: 'pending'
        });
      }
    });

    setRecipients([...recipients, ...newRecipients]);
    setManualNumbers('');
    setSuccess(`تم إضافة ${newRecipients.length} رقم هاتف`);
    setError('');
  };

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      setError('بعض الملفات غير مدعومة. يرجى تحميل صور أو فيديوهات فقط');
    }

    setMediaFiles([...mediaFiles, ...validFiles]);
  };

  const removeMedia = (index) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  const generateSlug = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `campaign-${timestamp}-${random}`;
  };

  const uploadMediaToSupabase = async (campaignId, slug) => {
    const uploadedMedia = [];

    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${slug}/${Date.now()}-${i}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { data, error } = await supabase.storage
        .from('campaign-media')
        .upload(filePath, file);

      if (error) {
        console.error('Upload error:', error);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('campaign-media')
        .getPublicUrl(filePath);

      uploadedMedia.push({
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        display_order: i
      });

      setUploadProgress(((i + 1) / mediaFiles.length) * 100);
    }

    return uploadedMedia;
  };

  const saveCampaign = async () => {
    if (!message.trim()) {
      setError('يرجى كتابة رسالة الحملة');
      return;
    }

    if (recipients.length === 0) {
      setError('يرجى إضافة جهات اتصال');
      return;
    }

    try {
      const slug = campaignSlug || generateSlug();
      const landingPageUrl = `${window.location.origin}/campaigns/${slug}`;

      let campaignData = {
        slug,
        message,
        batch_size: batchSize,
        status: 'draft',
        total_recipients: recipients.length,
        landing_page_url: landingPageUrl
      };

      let savedCampaignId = campaignId;

      if (campaignId) {
        const { error } = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', campaignId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('campaigns')
          .insert([campaignData])
          .select()
          .single();

        if (error) throw error;
        savedCampaignId = data.id;
        setCampaignId(savedCampaignId);
      }

      setCampaignSlug(slug);

      if (mediaFiles.length > 0) {
        const uploadedMedia = await uploadMediaToSupabase(savedCampaignId, slug);

        for (const media of uploadedMedia) {
          await supabase
            .from('campaign_media')
            .insert([{ ...media, campaign_id: savedCampaignId }]);
        }
      }

      const { error: recipientsError } = await supabase
        .from('recipients')
        .delete()
        .eq('campaign_id', savedCampaignId);

      if (recipientsError) throw recipientsError;

      const { error: insertRecipientsError } = await supabase
        .from('recipients')
        .insert(recipients.map(r => ({ ...r, campaign_id: savedCampaignId })));

      if (insertRecipientsError) throw insertRecipientsError;

      setSuccess('تم حفظ الحملة بنجاح');
      setError('');
      setUploadProgress(0);

    } catch (error) {
      console.error('Save error:', error);
      setError('خطأ في حفظ الحملة: ' + error.message);
    }
  };

  const insertLandingPageUrl = () => {
    if (!campaignSlug) {
      setError('يرجى حفظ الحملة أولاً لإنشاء رابط صفحة العرض');
      return;
    }

    const landingPageUrl = `${window.location.origin}/campaigns/${campaignSlug}`;
    setMessage(prev => prev + '\n\n' + landingPageUrl);
    updatePreview(message + '\n\n' + landingPageUrl);
    setSuccess('تم إضافة رابط صفحة العرض إلى الرسالة');
  };

  const sendWhatsAppMessage = async (recipient, message) => {
    // Use wa.me link to open WhatsApp with pre-filled message
    // This requires manual sending by the user
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${recipient.phone_number}?text=${encodedMessage}`;

    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');

    // Return that message is pending user confirmation
    return { success: true, requiresConfirmation: true };
  };

  const startSending = async () => {
    if (!campaignId) {
      setError('يرجى حفظ الحملة أولاً');
      return;
    }

    setIsSending(true);
    setIsPaused(false);
    setStatus('sending');

    const totalBatches = Math.ceil(recipients.length / batchSize);
    let processed = 0;
    let successful = 0;
    let failed = 0;
    let recipientIndex = 0;

    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      if (isPaused) {
        break;
      }

      const startIdx = batchNum * batchSize;
      const endIdx = Math.min(startIdx + batchSize, recipients.length);
      const batch = recipients.slice(startIdx, endIdx);

      setSendingProgress(prev => ({
        ...prev,
        currentBatch: batchNum + 1
      }));

      for (const recipient of batch) {
        if (isPaused) {
          break;
        }

        recipientIndex++;
        const personalizedMessage = message.replace(/\{name\}/g, recipient.name || 'العميل');

        setCurrentRecipient({
          ...recipient,
          index: recipientIndex,
          message: personalizedMessage
        });
        setShowConfirmDialog(true);

        // Wait for user confirmation
        const confirmed = await new Promise((resolve) => {
          window.handleMessageConfirmation = resolve;
        });

        setShowConfirmDialog(false);

        if (confirmed) {
          successful++;
          await supabase
            .from('recipients')
            .update({ status: 'sent' })
            .eq('id', recipient.id);
        } else {
          failed++;
          await supabase
            .from('recipients')
            .update({ status: 'failed', error_message: 'User cancelled' })
            .eq('id', recipient.id);
        }

        processed++;
        setSendingProgress(prev => ({
          ...prev,
          processed,
          successful,
          failed
        }));

        await supabase
          .from('campaigns')
          .update({
            processed_recipients: processed,
            successful_submissions: successful,
            failed_submissions: failed,
            current_batch: batchNum + 1
          })
          .eq('id', campaignId);
      }
    }

    if (!isPaused) {
      setStatus('completed');
      await supabase
        .from('campaigns')
        .update({ status: 'completed' })
        .eq('id', campaignId);
      setSuccess('تم إرسال الحملة بنجاح');
    } else {
      setStatus('paused');
      await supabase
        .from('campaigns')
        .update({ status: 'paused' })
        .eq('id', campaignId);
    }

    setIsSending(false);
    setCurrentRecipient(null);
  };

  const pauseSending = () => {
    setIsPaused(true);
  };

  const resumeSending = () => {
    setIsPaused(false);
    startSending();
  };

  const validRecipients = recipients.filter(r => r.phone_number && r.phone_number.length >= 10);
  const requiredBatches = Math.ceil(validRecipients.length / batchSize);

  const confirmMessageSent = async (confirmed) => {
    window.lastConfirmation = confirmed;
    if (window.handleMessageConfirmation) {
      window.handleMessageConfirmation(confirmed);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>إنشاء حملة واتساب</h1>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <h2>رسالة الحملة</h2>
        <div className="form-group">
          <label>اكتب رسالة واتساب</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا... استخدم {name} لإدراج اسم العميل"
          />
        </div>
        <div className="form-group">
          <label>معاينة الرسالة</label>
          <div className="preview-box">{previewMessage || 'ستظهر المعاينة هنا...'}</div>
        </div>
      </div>

      <div className="card">
        <h2>إضافة جهات الاتصال</h2>
        <div className="form-group">
          <label>الخيار أ: تحميل ملف (Excel أو CSV)</label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            ref={fileInputRef}
          />
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            يجب أن يحتوي الملف على عمود للأسماء وعمود لأرقام الهواتف
          </p>
        </div>
        <div className="form-group">
          <label>الخيار ب: إدخال الأرقام يدوياً</label>
          <textarea
            value={manualNumbers}
            onChange={(e) => setManualNumbers(e.target.value)}
            placeholder="أدخل رقم هاتف في كل سطر&#10;966500000000&#10;966500000001"
          />
          <button className="btn btn-secondary" onClick={handleManualNumbers}>
            إضافة الأرقام
          </button>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="label">إجمالي جهات الاتصال</div>
            <div className="value">{validRecipients.length}</div>
          </div>
          <div className="stat-card">
            <div className="label">الأرقام المكررة</div>
            <div className="value">{recipients.length - validRecipients.length}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>إعدادات المجموعات</h2>
        <div className="form-group">
          <label>حجم المجموعة</label>
          <input
            type="number"
            value={batchSize}
            onChange={(e) => setBatchSize(parseInt(e.target.value) || 100)}
            min="1"
            max="1000"
          />
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="label">عدد المجموعات المطلوبة</div>
            <div className="value">{requiredBatches}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>وسائط الحملة</h2>
        <div className="form-group">
          <label>تحميل الصور والفيديوهات</label>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleMediaUpload}
          />
        </div>
        {mediaFiles.length > 0 && (
          <div className="media-preview">
            {mediaFiles.map((file, index) => (
              <div key={index} className="media-item">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt={file.name} />
                ) : (
                  <video src={URL.createObjectURL(file)} controls />
                )}
                <button
                  className="remove-btn"
                  onClick={() => removeMedia(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${uploadProgress}%` }}
            >
              {Math.round(uploadProgress)}%
            </div>
          </div>
        )}
        {campaignSlug && (
          <button className="btn btn-secondary" onClick={insertLandingPageUrl}>
            إدراج رابط صفحة العرض
          </button>
        )}
        <button className="btn btn-secondary" onClick={() => window.open(`${window.location.origin}/campaigns/${campaignSlug}`, '_blank')}>
          معاينة صفحة العرض
        </button>
      </div>

      <div className="card">
        <h2>إجراءات الحملة</h2>
        <button className="btn btn-primary" onClick={saveCampaign} disabled={isSending}>
          حفظ الحملة
        </button>
        <button className="btn btn-secondary" onClick={() => updatePreview(message)}>
          معاينة الرسالة
        </button>
        <button
          className="btn btn-success"
          onClick={startSending}
          disabled={isSending || !campaignId || status === 'completed'}
        >
          بدء الإرسال
        </button>
        {isSending && (
          <button className="btn btn-warning" onClick={pauseSending}>
            إيقاف مؤقت
          </button>
        )}
        {status === 'paused' && (
          <button className="btn btn-success" onClick={resumeSending}>
            استئناف الإرسال
          </button>
        )}
      </div>

      {isSending && (
        <div className="card">
          <h2>تقدم الإرسال</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="label">إجمالي المستلمين</div>
              <div className="value">{sendingProgress.total || validRecipients.length}</div>
            </div>
            <div className="stat-card">
              <div className="label">تمت المعالجة</div>
              <div className="value">{sendingProgress.processed}</div>
            </div>
            <div className="stat-card">
              <div className="label">ناجحة</div>
              <div className="value" style={{ color: 'var(--yas-success)' }}>
                {sendingProgress.successful}
              </div>
            </div>
            <div className="stat-card">
              <div className="label">فاشلة</div>
              <div className="value" style={{ color: 'var(--yas-error)' }}>
                {sendingProgress.failed}
              </div>
            </div>
            <div className="stat-card">
              <div className="label">المجموعة الحالية</div>
              <div className="value">{sendingProgress.currentBatch}</div>
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${(sendingProgress.processed / validRecipients.length) * 100}%` }}
            >
              {Math.round((sendingProgress.processed / validRecipients.length) * 100)}%
            </div>
          </div>
        </div>
      )}

      {showConfirmDialog && currentRecipient && (
        <div className="card" style={{ border: '3px solid var(--yas-blue)' }}>
          <h2>تأكيد إرسال الرسالة</h2>
          <div className="alert alert-info">
            <p><strong>المستلم:</strong> {currentRecipient.name || 'غير محدد'} ({currentRecipient.phone_number})</p>
            <p><strong>الرسالة:</strong></p>
            <div className="preview-box">{currentRecipient.message}</div>
          </div>
          <p style={{ marginBottom: '20px' }}>
            تم فتح واتساب في نافذة جديدة. يرجى إرسال الرسالة ثم العودة لتأكيد الإرسال.
          </p>
          <button className="btn btn-success" onClick={() => confirmMessageSent(true)}>
            ✓ تم الإرسال
          </button>
          <button className="btn btn-danger" onClick={() => confirmMessageSent(false)}>
            ✗ لم يتم الإرسال
          </button>
        </div>
      )}

      <div className="card">
        <h2>ملاحظات مهمة</h2>
        <div className="alert alert-info">
          <strong>طريقة الإرسال الحالية</strong>
          <p style={{ marginTop: '10px' }}>
            يستخدم النظام روابط wa.me لفتح واتساب مع رسالة مُعبأة مسبقاً. يجب عليك النقر على زر الإرسال يدوياً في واتساب لكل رسالة.
          </p>
          <p style={{ marginTop: '10px' }}>
            <strong>كيف يعمل:</strong>
          </p>
          <ol style={{ marginTop: '10px', marginRight: '20px' }}>
            <li>يفتح النظام واتساب في نافذة جديدة لكل مستلم</li>
            <li>الرسالة مُعبأة تلقائياً</li>
            <li>تأكد من إرسال الرسالة في واتساب</li>
            <li>عد إلى الصفحة وانقر "تم الإرسال"</li>
            <li>يستمر النظام إلى المستلم التالي</li>
          </ol>
          <p style={{ marginTop: '10px' }}>
            <strong>للإرسال التلقائي بدون تدخل يدوي:</strong>
          </p>
          <ul style={{ marginTop: '10px', marginRight: '20px' }}>
            <li>يتطلب WhatsApp Business API من Meta</li>
            <li>يتطلب حساب مطور معتمد ورسوم اشتراك</li>
            <li>يتطلب Phone Number ID و Access Token</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CreateCampaign;
