import { useState, useRef } from 'react';

export default function DeletePagesPage() {
    const [file, setFile] = useState(null);
    const [pages, setPages] = useState('');
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const f = e.target.files[0];
        if (f && f.type === 'application/pdf') setFile(f);
    };

    const handleDelete = async () => {
        if (!file || !pages) return;
        setStatus('processing');
        setErrorMsg('');

        const formData = new FormData();
        formData.append('file', file);

        // Note: In FastAPI we are sending 'pages' as query param to simplify, or form field.
        // Let's use query param for consistency with split
        try {
            const res = await fetch(`http://localhost:8000/api/pdf/delete-pages?pages=${pages}`, {
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
            a.download = `trimmed_${file.name}`;
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
                <h1 className="page-title">Delete Pages</h1>
                <p className="page-subtitle">Remove unwanted pages from your PDF.</p>
            </div>

            <div className="card">
                <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} accept=".pdf" style={{ display: 'none' }} onChange={handleFileSelect} />
                    {file ? <p>Selected: <strong>{file.name}</strong></p> : <p>Drag & Drop a PDF here or click to select</p>}
                </div>

                {file && (
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <p className="text-sm">Pages to remove (e.g. "1, 3-5")</p>
                            <input
                                type="text"
                                value={pages}
                                onChange={(e) => setPages(e.target.value)}
                                placeholder="e.g. 1, 5"
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            />
                        </div>

                        <button className="btn btn-danger" onClick={handleDelete} disabled={status === 'processing' || !pages}>
                            {status === 'processing' ? 'Processing...' : 'Delete Pages'}
                        </button>

                        {status === 'error' && <p style={{ color: 'red', marginTop: '10px' }}>{errorMsg}</p>}
                        {status === 'success' && <p style={{ color: 'green', marginTop: '10px' }}>Download started!</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
