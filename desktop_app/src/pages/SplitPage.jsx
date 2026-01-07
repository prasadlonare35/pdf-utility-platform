import { useState, useRef } from 'react';

export default function SplitPage() {
    const [file, setFile] = useState(null);
    const [mode, setMode] = useState('all'); // 'all' or 'ranges'
    const [ranges, setRanges] = useState('');
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const f = e.target.files[0];
        if (f && f.type === 'application/pdf') setFile(f);
    };

    const handleSplit = async () => {
        if (!file) return;
        setStatus('processing');
        setErrorMsg('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('mode', mode);
        formData.append('ranges', ranges);

        try {
            const res = await fetch(`http://localhost:8000/api/pdf/split?mode=${mode}&ranges=${ranges}`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `split_${file.name}.zip`;
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
                <h1 className="page-title">Split PDF</h1>
                <p className="page-subtitle">Extract pages or split into multiple documents.</p>
            </div>

            <div className="card">
                <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} accept=".pdf" style={{ display: 'none' }} onChange={handleFileSelect} />
                    {file ? <p>Selected: <strong>{file.name}</strong></p> : <p>Drag & Drop a PDF here or click to select</p>}
                </div>

                {file && (
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ marginRight: '20px' }}>
                                <input type="radio" checked={mode === 'all'} onChange={() => setMode('all')} /> Extract All Pages (Separate files)
                            </label>
                            <label>
                                <input type="radio" checked={mode === 'ranges'} onChange={() => setMode('ranges')} /> Custom Ranges
                            </label>
                        </div>

                        {mode === 'ranges' && (
                            <div style={{ marginBottom: '20px' }}>
                                <p className="text-sm">Enter ranges separated by commas (e.g. "1-5, 8, 10-12")</p>
                                <input
                                    type="text"
                                    value={ranges}
                                    onChange={(e) => setRanges(e.target.value)}
                                    placeholder="e.g. 1-5, 8"
                                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                />
                            </div>
                        )}

                        <button className="btn btn-primary" onClick={handleSplit} disabled={status === 'processing'}>
                            {status === 'processing' ? 'Processing...' : 'Split PDF'}
                        </button>

                        {status === 'error' && <p style={{ color: 'red', marginTop: '10px' }}>{errorMsg}</p>}
                        {status === 'success' && <p style={{ color: 'green', marginTop: '10px' }}>Download started!</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
