import { useState, useRef } from 'react';

export default function ConvertPage() {
    const [conversionType, setConversionType] = useState('pdf-to-word');
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const fileInputRef = useRef(null);

    const options = [
        { id: 'pdf-to-word', label: 'PDF to Word (.docx)', accept: '.pdf' },
        { id: 'pdf-to-ppt', label: 'PDF to PowerPoint (.pptx)', accept: '.pdf' },
    ];

    const currentOption = options.find(o => o.id === conversionType);

    const handleFileSelect = (e) => {
        const f = e.target.files[0];
        if (f) setFile(f);
    };

    const handleConvert = async () => {
        if (!file) return;
        setStatus('processing');
        setErrorMsg('');

        const formData = new FormData();
        formData.append('file', file);

        let endpoint = '';
        if (conversionType === 'pdf-to-word') endpoint = 'convert/pdf-to-word';
        else if (conversionType === 'pdf-to-ppt') endpoint = 'convert/pdf-to-ppt';

        try {
            const res = await fetch(`http://localhost:8000/api/${endpoint}`, {
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

            // Determine output name
            let outExt = 'pdf';
            if (conversionType === 'pdf-to-word') outExt = 'docx';
            if (conversionType === 'pdf-to-ppt') outExt = 'pptx';

            const origName = file.name.substring(0, file.name.lastIndexOf('.'));
            a.download = `${origName}_converted.${outExt}`;

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
                <h1 className="page-title">Document Converter</h1>
                <p className="page-subtitle">Convert between PDF and Office formats.</p>
            </div>

            <div className="card">
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Select Conversion Type:</label>
                    <select
                        value={conversionType}
                        onChange={(e) => {
                            setConversionType(e.target.value);
                            setFile(null);
                            setStatus('idle');
                        }}
                        style={{ padding: '10px', width: '100%', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                        {options.map(o => (
                            <option key={o.id} value={o.id}>{o.label}</option>
                        ))}
                    </select>
                </div>

                <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept={currentOption.accept}
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                    />
                    {file ? <p>Selected: <strong>{file.name}</strong></p> : <p>Click to upload {currentOption.label}</p>}
                </div>

                {file && (
                    <div style={{ marginTop: '20px' }}>
                        <button className="btn btn-primary" onClick={handleConvert} disabled={status === 'processing'}>
                            {status === 'processing' ? 'Converting...' : 'Start Conversion'}
                        </button>

                        {status === 'error' && <p style={{ color: 'red', marginTop: '10px' }}>{errorMsg}</p>}
                        {status === 'success' && <p style={{ color: 'green', marginTop: '10px' }}>Download started!</p>}

                        {status === 'processing' && (conversionType === 'pdf-to-word' || conversionType === 'pdf-to-ppt') && (
                            <p style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
                                Note: Complex documents may take a minute to process.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
