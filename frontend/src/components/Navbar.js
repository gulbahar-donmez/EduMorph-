import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/dashboard" className="navbar-logo">
                    EduMorph
                </Link>
                <ul className="nav-menu">
                    <li className="nav-item">
                        <Link className="nav-link" to="/dashboard">Anasayfa</Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/learning-style-test">Öğrenme Stili Testi</Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/personality-test">Kişilik Analizi</Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/lessons">Dersler</Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/results">Sonuçlar</Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar; 