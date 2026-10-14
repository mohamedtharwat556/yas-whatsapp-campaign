import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function CampaignLanding() {
  const { slug } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCampaign();
  }, [slug]);

  const loadCampaign = async () => {
    try {
      setLoading(true);

      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('slug', slug)
        .single();

      if (campaignError) throw campaignError;

      if (!campaignData) {
        setError('الحملة غير موجودة أو لم يتم نشرها بعد');
        setLoading(false);
        return;
      }

      setCampaign(campaignData);

      const { data: mediaData, error: mediaError } = await supabase
        .from('campaign_media')
        .select('*')
        .eq('campaign_id', campaignData.id)
        .order('display_order', { ascending: true });

      if (mediaError) throw mediaError;

      setMedia(mediaData || []);
      setLoading(false);

    } catch (error) {
      console.error('Load campaign error:', error);
      setError('حدث خطأ في تحميل الحملة');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="landing-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="landing-page">
        <div className="container" style={{ paddingTop: '100px' }}>
          <div className="card">
            <div className="alert alert-error">
              <h2>عذراً</h2>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="container">
          <h1>YAS Campaign</h1>
        </div>
      </header>

      <div className="container landing-content">
        {media.length > 0 && (
          <div className="landing-media">
            {media.map((item) => (
              <div key={item.id} className="landing-media-item">
                {item.file_type.startsWith('image/') ? (
                  <img src={item.file_url} alt={item.file_name} />
                ) : (
                  <video controls>
                    <source src={item.file_url} type={item.file_type} />
                    متصفحك لا يدعم تشغيل الفيديو
                  </video>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="landing-details">
          <h2>تفاصيل الحملة</h2>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
            {campaign.message}
          </p>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          {campaign.whatsapp_number ? (
            <a
              href={`whatsapp://send?phone=${campaign.whatsapp_number}`}
              className="whatsapp-btn"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              تواصل معنا على واتساب
            </a>
          ) : (
            <p style={{ color: '#666' }}>رقم واتساب غير متوفر</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CampaignLanding;
