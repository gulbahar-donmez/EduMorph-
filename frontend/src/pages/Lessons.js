import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Lessons.css';
import personalityService from '../services/personalityService';

function Lessons() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('başlangıç');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [learningStyle, setLearningStyle] = useState(null);

  useEffect(() => {
    // LocalStorage'dan öğrenme stilini al
    const learningStyleResult = localStorage.getItem('learningStyleResult');
    if (learningStyleResult) {
      setLearningStyle(JSON.parse(learningStyleResult));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Lütfen bir konu girin');
      return;
    }

    setLoading(true);
    setError('');
    setContent('');

    try {
      let prompt = `Konu: ${subject}\nSeviye: ${level}\n`;
      
      if (learningStyle) {
        prompt += `Öğrenme Stili: ${learningStyle.style}\n`;
        prompt += `Öğrenme stiline uygun olarak ders içeriği oluştur:\n`;
        
        if (learningStyle.style === 'Görsel') {
          prompt += '- Görsel materyaller ve diyagramlar kullan\n';
          prompt += '- Renkli ve görsel açıdan zengin bir içerik sun\n';
        } else if (learningStyle.style === 'İşitsel') {
          prompt += '- Sesli açıklamalar ve örnekler kullan\n';
          prompt += '- Tartışma soruları ve konuşma pratikleri ekle\n';
        } else if (learningStyle.style === 'Kinestetik') {
          prompt += '- Uygulamalı örnekler ve aktiviteler ekle\n';
          prompt += '- Pratik yapma fırsatları sun\n';
        } else {
          prompt += '- Detaylı yazılı açıklamalar kullan\n';
          prompt += '- Not alma ve yazma alıştırmaları ekle\n';
        }
      }

      prompt += '\nLütfen içeriği aşağıdaki formatta oluştur:\n';
      prompt += '1. Giriş ve Genel Bakış\n';
      prompt += '2. Ana Konular\n';
      prompt += '3. Önemli Noktalar\n';
      prompt += '4. Örnekler ve Uygulamalar\n';
      prompt += '5. Özet ve Değerlendirme\n';
      prompt += '\nHer bölümü başlık olarak belirt ve alt başlıklar kullan.';

      console.log('Gönderilen prompt:', prompt);
      const response = await personalityService.generateAIAnalysis(prompt);
      console.log('AI yanıtı:', response);
      
      // AI yanıtını formatla
      const formattedContent = response
          .split('\n')
          .map(line => {
              // Başlıkları formatla
              if (line.match(/^\d+\./)) {
                  return `<h3>${line}</h3>`;
              }
              // Alt başlıkları formatla
              if (line.match(/^[A-Z][^a-z]+:/)) {
                  return `<h4>${line}</h4>`;
              }
              // Liste öğelerini formatla
              if (line.trim().startsWith('-')) {
                  return `<li>${line.replace('-', '').trim()}</li>`;
              }
              // Normal paragrafları formatla
              return `<p>${line}</p>`;
          })
          .join('');

      setContent(formattedContent);
    } catch (err) {
      console.error('Detaylı hata:', err);
      setError(`Ders içeriği oluşturulurken bir hata oluştu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lessons-container">
      <div className="lessons-header">
        <h1>Kişiselleştirilmiş Dersler</h1>
        <button onClick={() => navigate('/dashboard')} className="back-button">
          Dashboard'a Dön
        </button>
      </div>

      <div className="lessons-content">
        <div className="lesson-form">
          <h2>Ders İçeriği Oluştur</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="subject">Konu</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Öğrenmek istediğiniz konuyu girin"
              />
            </div>

            <div className="form-group">
              <label htmlFor="level">Seviye</label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="başlangıç">Başlangıç</option>
                <option value="orta">Orta</option>
                <option value="ileri">İleri</option>
              </select>
            </div>

            {learningStyle && (
              <div className="learning-style-info">
                <h3>Öğrenme Stiliniz: {learningStyle.style}</h3>
                <p>{learningStyle.description}</p>
              </div>
            )}

            <button type="submit" disabled={loading}>
              {loading ? 'İçerik Oluşturuluyor...' : 'Ders İçeriği Oluştur'}
            </button>
          </form>
        </div>

        {error && <div className="error-message">{error}</div>}

        {content && (
          <div className="lesson-content">
            <h2>Ders İçeriği</h2>
            <div className="content-text" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Lessons; 