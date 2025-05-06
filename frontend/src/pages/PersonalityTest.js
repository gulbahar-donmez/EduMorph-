import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PersonalityTest.css';

const PersonalityTest = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const questions = [
        {
            id: 1,
            text: "Yeni insanlarla tanışmaktan hoşlanırım.",
            trait: "extroversion"
        },
        {
            id: 2,
            text: "Duygusal durumlarımı kolayca ifade edebilirim.",
            trait: "emotional"
        },
        {
            id: 3,
            text: "İşlerimi planlı ve düzenli yaparım.",
            trait: "conscientiousness"
        },
        {
            id: 4,
            text: "Başkalarının duygularına karşı hassasım.",
            trait: "agreeableness"
        },
        {
            id: 5,
            text: "Yeni fikirlere ve deneyimlere açığım.",
            trait: "openness"
        }
    ];

    const handleAnswer = (value) => {
        setAnswers(prev => ({
            ...prev,
            [questions[currentQuestion].trait]: value
        }));

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // Kişilik özelliklerini hesapla
            const traits = Object.entries(answers).map(([trait, value]) => ({
                name: trait,
                score: value * 20 // 1-5 arası değeri 20-100 arasına dönüştür
            }));

            // AI analizi için prompt oluştur
            const prompt = `
                Lütfen aşağıdaki kişilik özelliklerine göre bir analiz yapın:
                ${traits.map(t => `${t.name}: ${t.score}%`).join('\n')}
                
                Analiz şu bölümleri içermeli:
                1. Genel Değerlendirme
                2. Güçlü Yönler
                3. Geliştirilebilecek Alanlar
                4. Öneriler
                
                Lütfen yanıtınızı Türkçe olarak verin ve teknik terimleri açıklayın.
            `;

            // AI'dan yanıt al
            const response = await fetch('http://localhost:8000/api/generate-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                throw new Error('AI yanıtı alınamadı');
            }

            const data = await response.json();
            const recommendations = data.content.split('\n').filter(line => line.trim());

            // Sonuçları kaydet
            await fetch('http://localhost:8000/api/save-personality-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    traits,
                    recommendations
                })
            });

            navigate('/results');
        } catch (error) {
            console.error('Kişilik analizi hatası:', error);
            alert('Kişilik analizi sırasında bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Analiz yapılıyor...</div>;
    }

    return (
        <div className="personality-test-container">
            <div className="test-card">
                <h2>Kişilik Analizi</h2>
                <div className="progress-bar">
                    <div 
                        className="progress" 
                        style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                    ></div>
                </div>
                <div className="question">
                    <h3>{questions[currentQuestion].text}</h3>
                    <div className="options">
                        <button onClick={() => handleAnswer(1)}>Kesinlikle Katılmıyorum</button>
                        <button onClick={() => handleAnswer(2)}>Katılmıyorum</button>
                        <button onClick={() => handleAnswer(3)}>Kararsızım</button>
                        <button onClick={() => handleAnswer(4)}>Katılıyorum</button>
                        <button onClick={() => handleAnswer(5)}>Kesinlikle Katılıyorum</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalityTest; 