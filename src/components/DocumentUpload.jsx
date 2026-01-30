import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, AlertTriangle, Library } from 'lucide-react';
import './DocumentUpload.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function DocumentUpload() {
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, docId: null, docName: '' });

    // Fetch documents on mount
    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await fetch(`${API_URL}/documents`);
            const data = await response.json();
            setDocuments(data.documents || []);
        } catch (err) {
            console.error('Error fetching documents:', err);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            // Upload multiple files
            for (let i = 0; i < files.length; i++) {
                await uploadFile(files[i]);
            }
        }
    };

    const handleFileInput = async (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            // Upload multiple files
            for (let i = 0; i < files.length; i++) {
                await uploadFile(files[i]);
            }
        }
    };

    const uploadFile = async (file) => {
        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_URL}/documents/upload`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                await fetchDocuments();
            } else {
                setError(data.error || 'Upload failed');
            }
        } catch (err) {
            setError('Network error: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const deleteDocument = async (id, filename) => {
        setDeleteConfirm({ show: true, docId: id, docName: filename });
    };

    const confirmDelete = async () => {
        const { docId } = deleteConfirm;
        setDeleteConfirm({ show: false, docId: null, docName: '' });

        try {
            const response = await fetch(`${API_URL}/documents/${docId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchDocuments();
            }
        } catch (err) {
            console.error('Error deleting document:', err);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm({ show: false, docId: null, docName: '' });
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="document-upload fade-in">
            <div className="upload-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Library size={24} />
                    Document Library
                </h2>
                <p className="subtitle">Upload documents to power your AI assistant</p>
            </div>

            {/* Upload Zone */}
            <div
                className={`upload-zone glass-card ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    id="file-input"
                    className="file-input"
                    accept=".pdf,.txt,.docx"
                    multiple
                    onChange={handleFileInput}
                    disabled={uploading}
                />

                {uploading ? (
                    <div className="upload-content">
                        <div className="spinner-large"></div>
                        <p>Processing document...</p>
                    </div>
                ) : (
                    <label htmlFor="file-input" className="upload-content">
                        <div className="upload-icon">
                            <Upload size={48} strokeWidth={1.5} />
                        </div>
                        <h3>Drop files here or click to browse</h3>
                        <p className="upload-hint">Supports PDF, TXT, DOCX (max 10MB)</p>
                    </label>
                )}
            </div>

            {error && (
                <div className="error-message">
                    <AlertTriangle size={18} />
                    {error}
                </div>
            )}

            {/* Documents List */}
            <div className="documents-list">
                <h3>Uploaded Documents ({documents.length})</h3>

                {documents.length === 0 ? (
                    <div className="empty-state glass-card">
                        <p>No documents uploaded yet</p>
                        <p className="text-muted">Upload your first document to get started</p>
                    </div>
                ) : (
                    <div className="documents-grid">
                        {documents.map((doc) => (
                            <div key={doc.id} className="document-card glass-card">
                                <div className="doc-icon">
                                    <FileText size={32} strokeWidth={1.5} />
                                </div>
                                <div className="doc-info">
                                    <h4 className="doc-name">{doc.filename}</h4>
                                    <div className="doc-meta">
                                        <span>{doc.chunks} chunks</span>
                                        <span>•</span>
                                        <span>{(doc.textLength / 1000).toFixed(1)}k chars</span>
                                    </div>
                                    <div className="doc-date">
                                        {new Date(doc.uploadDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    className="delete-btn"
                                    onClick={() => deleteDocument(doc.id, doc.filename)}
                                    title="Delete document"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="modal-overlay" onClick={cancelDelete}>
                    <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Trash2 size={20} />
                                Delete Document
                            </h3>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete this document?</p>
                            <p className="doc-name-highlight">{deleteConfirm.docName}</p>
                            <p className="text-muted">This action cannot be undone.</p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={cancelDelete}>
                                Cancel
                            </button>
                            <button className="btn-danger" onClick={confirmDelete}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DocumentUpload;
