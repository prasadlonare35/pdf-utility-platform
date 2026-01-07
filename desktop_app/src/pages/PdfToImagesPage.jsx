import { useState, useRef } from 'react';

export default function PdfToImagesPage() {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const f = e.target.files[0];
        if (f && f.type === 'application/pdf') setFile(f);
    };

    const handleConvert = async () => {
        if (!file) return;
        setStatus('processing');
        setErrorMsg('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:8000/api/pdf/pdf-to-images', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Conversion Failed');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `images_${file.name}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setStatus('success');
        } catch (e) {
            setErrorMsg(e.message);
            setStatus('error');
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">PDF to Images</h1>
                <p className="page-subtitle">Convert each page into a high-quality (300 DPI) PNG image.</p>
            </div>

            <div className="card">
                <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} accept=".pdf" style={{ display: 'none' }} onChange={handleFileSelect} />
                    {file ? <p>Selected: <strong>{file.name}</strong></p> : <p>Drag & Drop a PDF here or click to select</p>}
                </div>

                {file && (
                    <div style={{ marginTop: '20px' }}>
                        <button className="btn btn-primary" onClick={handleConvert} disabled={status === 'processing'}>
                            {status === 'processing' ? 'Converting...' : 'Convert to Images (ZIP)'}
                        </button>

                        {status === 'error' && <p style={{ color: 'red', marginTop: '10px' }}>{errorMsg}</p>}
                        {status === 'success' && <p style={{ color: 'green', marginTop: '10px' }}>Download started!</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
