import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Results.css';

const Results = () => {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Öğrenme stili önerilerini döndüren fonksiyon
    const getLearningStyleRecommendations = (style) => {
        const recommendations = {
            visual: [
                'Görsel materyaller ve diyagramlar kullanın',
                'Renkli notlar ve zihin haritaları oluşturun',
                'Video ve görsel kaynaklardan yararlanın',
                'Görsel hafıza tekniklerini kullanın'
            ],
            auditory: [
                'Sesli kayıtlar ve podcastler dinleyin',
                'Grup tartışmalarına katılın',
                'Konuları başkalarına anlatın',
                'Sesli notlar alın'
            ],
            reading: [
                'Detaylı notlar tutun',
                'Yazılı kaynaklardan çalışın',
                'Özetler çıkarın',
                'Yazma alıştırmaları yapın'
            ],
            kinesthetic: [
                'Pratik yapma fırsatları oluşturun',
                'Deneyler ve projeler yapın',
                'Rol yapma ve simülasyonlar kullanın',
                'Fiziksel aktivitelerle öğrenin'
            ]
        };
        return recommendations[style] || [];
    };

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const [learningStyleResponse, personalityResponse] = await Promise.all([
                    fetch('http://localhost:8000/api/learning-style', {
                    headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }),
                    fetch('http://localhost:8000/api/personality-analysis', {
                    headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    })
                ]);

                if (!learningStyleResponse.ok && !personalityResponse.ok) {
                    throw new Error('Sonuçlar alınamadı');
                }

                const learningStyleData = learningStyleResponse.ok ? await learningStyleResponse.json() : null;
                const personalityData = personalityResponse.ok ? await personalityResponse.json() : null;

                console.log('Personality Data:', personalityData); // Debug için

                setResults({
                    learningStyle: learningStyleData,
                    personality: personalityData
                });
            } catch (error) {
                console.error('Sonuçlar alınırken hata:', error);
                setError('Sonuçlar alınırken bir hata oluştu');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [navigate]);

    const renderLearningStyleResults = () => {
        if (!results.learningStyle) return null;

        const styles = {
            visual: { name: 'Görsel', description: 'Görsel öğrenenler, bilgiyi resimler, diyagramlar ve görsel materyaller aracılığıyla daha iyi öğrenirler.' },
            auditory: { name: 'İşitsel', description: 'İşitsel öğrenenler, bilgiyi dinleyerek ve tartışarak daha iyi öğrenirler.' },
            reading: { name: 'Okuma-Yazma', description: 'Okuma-yazma öğrenenler, bilgiyi yazarak ve okuyarak daha iyi öğrenirler.' },
            kinesthetic: { name: 'Kinestetik', description: 'Kinestetik öğrenenler, bilgiyi uygulayarak ve deneyimleyerek daha iyi öğrenirler.' }
        };

        // Skorları hesapla
        const scores = {};
        Object.keys(styles).forEach(style => {
            scores[style] = 0;
        });

        if (results.learningStyle.scores) {
            Object.keys(results.learningStyle.scores).forEach(style => {
                scores[style] = results.learningStyle.scores[style];
            });
        } else if (results.learningStyle.answers) {
            results.learningStyle.answers.forEach(answer => {
                if (answer.style && scores[answer.style] !== undefined) {
                    scores[answer.style]++;
                }
            });
        }

        // En yüksek skorları bul
        const sortedScores = Object.entries(scores)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2);

        return (
            <div className="results-section">
                <h2>Öğrenme Stili Analizi</h2>
                
                <div className="results-content">
                    {Object.entries(scores).map(([style, score]) => (
                        <div key={style} className="result-item">
                            <div className="result-header">
                                <h3>{styles[style].name}</h3>
                                <span className="score">{score}%</span>
                            </div>
                            <div className="progress-bar">
                                <div 
                                    className="progress" 
                                    style={{ width: `${score}%` }}
                                />
                            </div>
                            <p className="description">{styles[style].description}</p>
                        </div>
                    ))}
                </div>

                <div className="recommendations">
                    <h3>Öneriler</h3>
                    <ul>
                        {sortedScores.map(([style, score]) => (
                            <li key={style}>
                                <strong>{styles[style].name} Öğrenme Stili için:</strong>
                                <ul>
                                    {getLearningStyleRecommendations(style).map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    };

    const renderPersonalityResults = () => {
        if (!results?.personality) {
            return (
                <div className="results-section">
                    <h2>Kişilik Analizi Sonuçları</h2>
                    <p>Henüz kişilik analizi sonucunuz bulunmuyor.</p>
                    <button onClick={() => navigate('/personality-test')} className="test-button">
                        Analizi Başlat
                    </button>
                </div>
            );
        }

        const traits = {
            extroversion: { name: 'Dışa Dönüklük', description: 'Sosyal etkileşim ve enerji seviyesi' },
            emotional: { name: 'Duygusal Kararlılık', description: 'Duyguları yönetme ve stres toleransı' },
            conscientiousness: { name: 'Sorumluluk', description: 'Düzen ve hedef odaklılık' },
            agreeableness: { name: 'Uyumluluk', description: 'Empati ve işbirliği' },
            openness: { name: 'Yeniliğe Açıklık', description: 'Yaratıcılık ve deneyime açıklık' }
        };

        // Skorları hesapla
        const scores = {};
        Object.keys(traits).forEach(trait => {
            scores[trait] = 0;
        });

        if (results.personality.traits) {
            results.personality.traits.forEach(trait => {
                if (trait.name && trait.score !== undefined) {
                    scores[trait.name] = trait.score;
                }
            });
        } else if (results.personality.answers && Array.isArray(results.personality.answers)) {
            const traitCounts = results.personality.answers.reduce((acc, answer) => {
                if (answer && answer.trait) {
                    acc[answer.trait] = (acc[answer.trait] || 0) + (answer.score || 0);
                }
                return acc;
            }, {});

            Object.keys(traits).forEach(trait => {
                const maxScore = 25 * 5;
                scores[trait] = ((traitCounts[trait] || 0) / maxScore) * 100;
            });
        }

        // En yüksek skorları bul
        const sortedScores = Object.entries(scores)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2);

        return (
            <div className="results-section">
                <h2>Kişilik Analizi</h2>
                
                <div className="results-content">
                    {Object.entries(scores).map(([trait, score]) => (
                        <div key={trait} className="result-item">
                            <div className="result-header">
                                <h3>{traits[trait].name}</h3>
                                <span className="score">{Math.round(score)}%</span>
                            </div>
                            <div className="progress-bar">
                                <div 
                                    className="progress" 
                                    style={{ width: `${score}%` }}
                                />
                            </div>
                            <p className="description">{traits[trait].description}</p>
                        </div>
                    ))}
                </div>

                <div className="recommendations">
                    <h3>Öneriler</h3>
                    <ul>
                        {sortedScores.map(([trait, score]) => (
                            <li key={trait}>
                                <strong>{traits[trait].name} için:</strong>
                                <ul>
                                    {getPersonalityRecommendations(trait).map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    };

    // Kişilik özellikleri için öneriler
    const getPersonalityRecommendations = (trait) => {
        const recommendations = {
            extroversion: [
                'Grup çalışmalarına aktif katılım sağlayın',
                'Sosyal etkileşim fırsatları oluşturun',
                'Topluluk önünde konuşma pratikleri yapın'
            ],
            emotional: [
                'Stres yönetimi tekniklerini öğrenin',
                'Duygusal farkındalık egzersizleri yapın',
                'Meditasyon ve nefes çalışmaları deneyin'
            ],
            conscientiousness: [
                'Hedeflerinizi belirleyin ve planlayın',
                'Düzenli bir çalışma rutini oluşturun',
                'Görev takibi için araçlar kullanın'
            ],
            agreeableness: [
                'Takım çalışması becerilerinizi geliştirin',
                'Empati pratikleri yapın',
                'İşbirliği fırsatları arayın'
            ],
            openness: [
                'Yeni deneyimlere açık olun',
                'Yaratıcı aktivitelere katılın',
                'Farklı perspektifleri keşfedin'
            ]
        };
        return recommendations[trait] || [];
    };

    if (loading) {
        return <div className="loading">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="results-container">
            <div className="results-header">
                <h1>Analiz Sonuçları</h1>
            </div>
            <div className="results-content">
                {renderLearningStyleResults()}
                {renderPersonalityResults()}
            </div>
        </div>
    );
};

export default Results; 