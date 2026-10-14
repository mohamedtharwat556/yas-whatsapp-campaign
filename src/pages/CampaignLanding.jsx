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
      </div>
    </div>
  );
}

export default CampaignLanding;
