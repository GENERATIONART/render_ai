import React, { useState } from 'react';

const FileUpload = ({ id, onFilesChange }) => {
  const [files, setFiles] = useState([]);

  const setFilesAndNotify = (nextFiles) => {
    setFiles(nextFiles);
    if (typeof onFilesChange === 'function') {
      onFilesChange(nextFiles);
    }
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFilesAndNotify([...files, ...newFiles]);
  };

  const removeFile = (index) => {
    setFilesAndNotify(files.filter((_, i) => i !== index));
  };

  return (
    <div style={{ margin: '40px 0' }}>
      <div
        onClick={() => document.getElementById(id).click()}
        data-upload-box
        style={{
          border: '2px dashed #000000',
          padding: '40px 24px',
          textAlign: 'center',
          transition: 'all 0.2s',
          cursor: 'pointer',
          background: 'transparent'
        }}
      >
        <div data-upload-icon style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📁</div>
        <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>Click to upload or drag files here</div>
        <div style={{ fontSize: '14px', opacity: 0.6 }}>All file types accepted: CAD, images, PDFs, sketches, photos, videos (Max 100MB per file)</div>
      </div>
      <input
        type="file"
        id={id}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        multiple
        accept="*"
      />
      {files.length > 0 && (
        <div data-upload-list style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {files.map((file, index) => (
            <div data-upload-item key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #000000', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>📄</span>
                <span>{file.name}</span>
              </div>
              <span
                onClick={() => removeFile(index)}
                style={{ cursor: 'pointer', padding: '4px 8px', opacity: 0.6, transition: 'opacity 0.2s' }}
              >
                ✕
              </span>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: '32px', padding: '24px', backgroundColor: 'rgba(0,0,0,0.02)' }}>
        <h4 style={{ fontSize: '14px', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 800, letterSpacing: '0.05em' }}>For Best Results, Include:</h4>
        <ul style={{ listStyle: 'none', fontSize: '14px', lineHeight: 1.8 }}>
          <li><span style={{ color: '#FF4500', marginRight: '8px', fontWeight: 'bold' }}>→</span>Photo references for style direction</li>
          <li><span style={{ color: '#FF4500', marginRight: '8px', fontWeight: 'bold' }}>→</span>Hand sketches or digital drawings</li>
          <li><span style={{ color: '#FF4500', marginRight: '8px', fontWeight: 'bold' }}>→</span>CAD files (SKP, RVT, DWG, Rhino)</li>
          <li><span style={{ color: '#FF4500', marginRight: '8px', fontWeight: 'bold' }}>→</span>Material samples or mood boards</li>
          <li><span style={{ color: '#FF4500', marginRight: '8px', fontWeight: 'bold' }}>→</span>Furniture and decor inspiration images</li>
          <li><span style={{ color: '#FF4500', marginRight: '8px', fontWeight: 'bold' }}>→</span>Lighting references and time-of-day preferences</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;
