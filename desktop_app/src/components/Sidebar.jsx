export default function Sidebar({ currentPage, onNavigate }) {
    const items = [
        { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
        { id: 'merge', label: 'Merge PDF', icon: '📄' },
        { id: 'split', label: 'Split PDF', icon: '✂️' },
        { id: 'delete', label: 'Delete Pages', icon: '🗑️' },
        { id: 'ocr', label: 'OCR & Search', icon: '🔍' },
        { id: 'pdf-to-img', label: 'PDF to Images', icon: '🖼️' },
        { id: 'img-to-pdf', label: 'Images to PDF', icon: '📑' },
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                PDF Utility
            </div>
            <nav>
                {items.map(item => (
                    <div
                        key={item.id}
                        className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                        onClick={() => onNavigate(item.id)}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </div>
                ))}
            </nav>
        </div>
    );
}
