import { useState, useRef } from 'react';

export default function MergePage() {
    const [files, setFiles] = useState([]);
    const [status, setStatus] = useState('idle'); // idle, uploading, processing, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selected = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
        if (selected.length === 0) return;

        // Append to existing
        setFiles(prev => [...prev, ...selected]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const dropped = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
        setFiles(prev => [...prev, ...dropped]);
    };

    const handleDragOver = (e) => e.preventDefault();

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const moveFile = (index, direction) => {
        const newFiles = [...files];
        if (direction === 'up' && index > 0) {
            [newFiles[index], newFiles[index - 1]] = [newFiles[index - 1], newFiles[index]];
        } else if (direction === 'down' && index < newFiles.length - 1) {
            [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
        }
        setFiles(newFiles);
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            setErrorMessage("Please select at least 2 files to merge.");
            return;
        }

        setStatus('uploading');
        setErrorMessage('');

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            // 1. Send to Backend
            setStatus('processing');
            const response = await fetch('http://localhost:8000/api/pdf/merge', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Merge failed');
            }

            // 2. Get Blob
            const blob = await response.blob();

            // 3. Trigger Download
            // In Electron/Browser, creates a temp link and clicks it
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `merged_${new Date().getTime()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000); // Reset after 3s

        } catch (error) {
            console.error(error);
            setStatus('error');
            setErrorMessage(error.message);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Merge PDFs</h1>
                <p className="page-subtitle">Combine multiple PDF files into a single document.</p>
            </div>

            <div className="card">
                <div
                    className="drop-zone"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept=".pdf"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                    />
                    <p><strong>Drag & Drop PDF files here</strong> or click to browse</p>
                </div>

                {files.length > 0 && (
                    <div className="file-list-container">
                        <h3 style={{ marginTop: '20px' }}>Selected Files ({files.length})</h3>
                        <ul className="file-list">
                            {files.map((file, index) => (
                                <li key={`${file.name}-${index}`} className="file-item">
                                    <span className="file-name">{index + 1}. {file.name}</span>
                                    <div className="file-actions">
                                        <button className="btn btn-outline" onClick={() => moveFile(index, 'up')} disabled={index === 0}>↑</button>
                                        <button className="btn btn-outline" onClick={() => moveFile(index, 'down')} disabled={index === files.length - 1}>↓</button>
                                        <button className="btn btn-danger" onClick={() => removeFile(index)}>X</button>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="action-bar">
                            {status === 'processing' || status === 'uploading' ? (
                                <button className="btn btn-primary" disabled>Processing...</button>
                            ) : (
                                <button className="btn btn-primary" onClick={handleMerge}>Merge Files</button>
                            )}
                        </div>

                        {status === 'success' && <p style={{ color: 'green', marginTop: '10px' }}>Merge Complete! Downloading...</p>}
                        {status === 'error' && <p style={{ color: 'red', marginTop: '10px' }}>Error: {errorMessage}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
