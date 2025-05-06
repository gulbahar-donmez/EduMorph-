import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LearningStyleTest.css';

const LearningStyleTest = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const questions = [
        {
            id: 1,
            text: "Yeni bir konuyu öğrenirken görsel materyaller (resimler, grafikler, videolar) kullanmayı tercih ederim.",
            style: "visual"
        },
        {
            id: 2,
            text: "Sesli anlatımları ve tartışmaları dinleyerek daha iyi öğrenirim.",
            style: "auditory"
        },
        {
            id: 3,
            text: "Pratik yaparak ve deneyimleyerek öğrenmeyi tercih ederim.",
            style: "kinesthetic"
        },
        {
            id: 4,
            text: "Okuma ve yazma yoluyla öğrenmeyi tercih ederim.",
            style: "reading"
        }
    ];

    const handleAnswer = (value) => {
        setAnswers(prev => ({
            ...prev,
            [questions[currentQuestion].style]: value
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

            // En yüksek puanı alan öğrenme stilini bul
            const styleScores = Object.entries(answers).map(([style, value]) => ({
                style,
                score: value * 20 // 1-5 arası değeri 20-100 arasına dönüştür
            }));

            const dominantStyle = styleScores.reduce((prev, current) => 
                (current.score > prev.score) ? current : prev
            ).style;

            // AI analizi için prompt oluştur
            const prompt = `
                Lütfen aşağıdaki öğrenme stili sonuçlarına göre bir analiz yapın:
                ${styleScores.map(s => `${s.style}: ${s.score}%`).join('\n')}
                
                Analiz şu bölümleri içermeli:
                1. Öğrenme Stiliniz
                2. Öğrenme İpuçları
                
                Lütfen yanıtınızı Türkçe olarak verin ve teknik terimleri açıklayın.
                Analiz 200-250 kelime arasında olsun ve 7-70 yaş arası herkesin anlayabileceği bir dil kullanın.
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
            await fetch('http://localhost:8000/api/save-learning-style', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    style: dominantStyle,
                    recommendations
                })
            });

            navigate('/results');
        } catch (error) {
            console.error('Öğrenme stili analizi hatası:', error);
            alert('Öğrenme stili analizi sırasında bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Analiz yapılıyor...</div>;
    }

    return (
        <div className="learning-style-test-container">
            <div className="test-card">
                <h2>Öğrenme Stili Testi</h2>
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

export default LearningStyleTest; 