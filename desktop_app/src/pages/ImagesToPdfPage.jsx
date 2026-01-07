import { useState, useRef } from 'react';

export default function ImagesToPdfPage() {
    const [files, setFiles] = useState([]);
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selected = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
        setFiles(prev => [...prev, ...selected]);
    };

    const handleConvert = async () => {
        if (files.length === 0) return;
        setStatus('processing');
        setErrorMsg('');

        const formData = new FormData();
        files.forEach(f => formData.append('files', f));

        try {
            const res = await fetch('http://localhost:8000/api/pdf/images-to-pdf', {
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
            a.download = `images_combined_output.pdf`;
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

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Images to PDF</h1>
                <p className="page-subtitle">Combine multiple images into a single PDF document.</p>
            </div>

            <div className="card">
                <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
                    <p>Drag & Drop Images (PNG/JPG) here or click to select</p>
                </div>

                {files.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <ul className="file-list">
                            {files.map((f, i) => (
                                <li key={i} className="file-item">
                                    <span>{i + 1}. {f.name}</span>
                                    <button className="btn btn-danger" onClick={() => removeFile(i)}>X</button>
                                </li>
                            ))}
                        </ul>

                        <button className="btn btn-primary" onClick={handleConvert} disabled={status === 'processing'}>
                            {status === 'processing' ? 'Creating PDF...' : 'Create PDF'}
                        </button>

                        {status === 'error' && <p style={{ color: 'red', marginTop: '10px' }}>{errorMsg}</p>}
                        {status === 'success' && <p style={{ color: 'green', marginTop: '10px' }}>Download started!</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
