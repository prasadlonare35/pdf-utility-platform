
import { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import MergePage from './pages/MergePage';

import SplitPage from './pages/SplitPage';
import DeletePagesPage from './pages/DeletePagesPage';
import OCRPage from './pages/OCRPage';
import PdfToImagesPage from './pages/PdfToImagesPage';
import ImagesToPdfPage from './pages/ImagesToPdfPage';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [backendStatus, setBackendStatus] = useState('Connecting...');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:8000/health');
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'ok') setBackendStatus('Online');
        }
      } catch (error) {
        setBackendStatus('Offline');
      }
    };
    checkHealth();
    const intervalId = setInterval(checkHealth, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'merge':
        return <MergePage />;
      case 'split':
        return <SplitPage />;
      case 'delete':
        return <DeletePagesPage />;
      case 'ocr':
        return <OCRPage />;
      case 'pdf-to-img':
        return <PdfToImagesPage />;
      case 'img-to-pdf':
        return <ImagesToPdfPage />;
      case 'dashboard':
        return (
          <div>
            <h1>Dashboard</h1>
            <p>Welcome to the PDF Utility Platform.</p>
            <p>System Status: <span style={{ color: backendStatus === 'Online' ? 'green' : 'red' }}>{backendStatus}</span></p>
          </div>
        );
      default:
        return <div>Module not implemented yet.</div>;
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="main-content">
        {renderPage()}
      </div>
    </div>
  );
}

export default App;
