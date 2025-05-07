import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch('http://localhost:8000/api/user-info', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserName(data.first_name);
                }
            } catch (error) {
                console.error('Kullanıcı bilgileri alınamadı:', error);
            }
        };

        fetchUserInfo();
    }, [navigate]);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Hoş Geldiniz {userName}</h1>
            </div>
            
            <div className="dashboard-content">
                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <div className="card-icon">🎯</div>
                        <h2>Öğrenme Stili Testi</h2>
                        <p>Kişisel öğrenme stilinizi keşfedin ve size özel öğrenme stratejileri geliştirin.</p>
                        <button 
                            onClick={() => navigate('/learning-style-test')}
                            className="dashboard-button"
                        >
                            Testi Başlat
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">🧠</div>
                        <h2>Kişilik Analizi</h2>
                        <p>Kişilik özelliklerinizi keşfedin ve gelişim önerileri alın.</p>
                        <button 
                            onClick={() => navigate('/personality-test')}
                            className="dashboard-button"
                        >
                            Analizi Başlat
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">📚</div>
                        <h2>Dersler</h2>
                        <p>Öğrenme stilinize uygun dersleri keşfedin ve öğrenme sürecinizi optimize edin.</p>
                        <button 
                            onClick={() => navigate('/lessons')}
                            className="dashboard-button"
                        >
                            Derslere Git
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">📊</div>
                        <h2>Sonuçlarım</h2>
                        <p>Test sonuçlarınızı görüntüleyin ve kişisel gelişim önerilerinizi alın.</p>
                        <button 
                            onClick={() => navigate('/results')}
                            className="dashboard-button"
                        >
                            Sonuçları Gör
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 