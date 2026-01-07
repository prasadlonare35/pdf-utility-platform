import { useState, useRef } from 'react';

export default function OCRPage() {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, analyzing, ready_to_ocr, processing, success, error, already_text
    const [errorMsg, setErrorMsg] = useState('');
    const [warnMsg, setWarnMsg] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const f = e.target.files[0];
        if (!f || f.type !== 'application/pdf') return;
        setFile(f);
        checkText(f);
    };

    const checkText = async (f) => {
        setStatus('analyzing');
        setErrorMsg('');
        setWarnMsg('');

        const formData = new FormData();
        formData.append('file', f);

        try {
            const res = await fetch('http://localhost:8000/api/pdf/check-text', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.has_text) {
                setStatus('already_text');
                setWarnMsg('This PDF already contains searchable text. You can download it as-is or force OCR if needed (not recommended).');
            } else {
                setStatus('ready_to_ocr');
            }
        } catch (e) {
            setErrorMsg("Failed to analyze PDF: " + e.message);
            setStatus('error');
        }
    };

    const runOCR = async () => {
        setStatus('processing');
        setErrorMsg('');
        setWarnMsg('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:8000/api/pdf/ocr', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'OCR Failed');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `searchable_${file.name}`;
            document.body.appendChild(a);
            a.click();
            setStatus('success');
        } catch (e) {
            setErrorMsg(e.message);
            setStatus('error');
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">OCR / Text Search</h1>
                <p className="page-subtitle">Make scanned documents searchable.</p>
            </div>

            <div className="card">
                <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} accept=".pdf" style={{ display: 'none' }} onChange={handleFileSelect} />
                    {file ? <p>Selected: <strong>{file.name}</strong></p> : <p>Drag & Drop a PDF here or click to select</p>}
                </div>

                {file && (
                    <div style={{ marginTop: '20px' }}>
                        {status === 'analyzing' && <p>Analyzing document structure...</p>}

                        {status === 'already_text' && (
                            <div style={{ backgroundColor: '#e6fffa', padding: '15px', borderRadius: '8px', color: '#006d5d' }}>
                                <strong>✓ Text Detected:</strong> {warnMsg}
                            </div>
                        )}

                        {status === 'ready_to_ocr' && (
                            <div style={{ backgroundColor: '#fffbea', padding: '15px', borderRadius: '8px', color: '#946c00' }}>
                                <strong>⚠ No Text Detected:</strong> This document appears to be a scan. We can run OCR to make it searchable.
                                <br /><small>Note: This process may take 10-60 seconds depending on file size.</small>
                            </div>
                        )}

                        <div className="action-bar">
                            {(status === 'ready_to_ocr' || status === 'already_text') && (
                                <button className="btn btn-primary" onClick={runOCR}>
                                    {status === 'already_text' ? 'Force OCR' : 'Start OCR Processing'}
                                </button>
                            )}
                            {status === 'processing' && <button className="btn btn-primary" disabled>Running OCR...</button>}
                        </div>

                        {status === 'success' && <p style={{ color: 'green', marginTop: '10px' }}>OCR Complete! Downloading...</p>}
                        {status === 'error' && <p style={{ color: 'red', marginTop: '10px' }}>Error: {errorMsg}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
