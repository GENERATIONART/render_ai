import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseBrowser } from '../lib/supabaseBrowser.js';
import FileUpload from '../components/FileUpload.jsx';
import readApiError from '../lib/readApiError.js';

const CUSTOM_SERVICES = [
  { key: 'residential-exterior', title: 'Residential Exterior', tag: '24H Turnaround' },
  { key: 'residential-interior', title: 'Residential Interior', tag: 'Living Spaces' },
  { key: 'residential-aerial', title: 'Residential Aerial', tag: 'Neighborhood View' },
  { key: 'commercial-exterior', title: 'Commercial Exterior', tag: 'Office/Retail' },
  { key: 'commercial-interior', title: 'Commercial Interior', tag: 'Office/Retail' },
  { key: 'commercial-aerial', title: 'Commercial Aerial', tag: 'Campus View' },
  { key: '3d-model', title: '3D Model', tag: 'SKP / DWG / 3DS' }
];

const SelectableServiceRow = ({ price, title, tag, selected, onToggle }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <div
        data-custom-service-row
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'grid',
          gridTemplateColumns: '100px 1fr auto',
          alignItems: 'center',
          padding: '28px 0',
          gap: '20px',
          backgroundColor: selected ? 'rgba(255,69,0,0.04)' : isHovered ? 'rgba(0,0,0,0.02)' : 'transparent',
          transition: 'background 0.2s'
        }}
      >
        <div style={{ fontSize: '28px', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1, color: '#FF4500' }}>
          ${price}
        </div>
        <div style={{ fontSize: '24px', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {title} <span style={{ fontSize: '13px', verticalAlign: 'middle', marginLeft: '8px', fontWeight: 400, display: 'inline-block', opacity: 0.6 }}>({tag})</span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          style={{
            background: selected ? '#FF4500' : 'transparent',
            border: `2px solid ${selected ? '#FF4500' : '#000000'}`,
            color: selected ? '#ffffff' : '#000000',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '10px 20px',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            minWidth: '100px'
          }}
        >
          {selected ? '✓ Added' : '+ Add'}
        </button>
      </div>
      <hr style={{ width: '100%', height: '2px', backgroundColor: selected ? '#FF4500' : '#000000', opacity: selected ? 0.3 : 1, margin: 0, border: 'none', transition: 'all 0.2s' }} />
    </>
  );
};

const CustomProjectPage = ({ servicePrices }) => {
  const navigate = useNavigate();
  const [selectedServices, setSelectedServices] = useState(new Set());
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [projectInfo, setProjectInfo] = useState('');
  const [projectFiles, setProjectFiles] = useState([]);

  const toggleService = (key) => {
    setSelectedServices(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectedList = [...selectedServices];
  const total = selectedList.reduce((sum, key) => sum + (servicePrices[key] || 0), 0);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (selectedServices.size === 0) {
      setSubmitError('Please select at least one service before checking out.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const supabase = getSupabaseBrowser();

      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, businessName, serviceName: 'custom', selectedServices: selectedList, projectInfo })
      });
      if (!projectRes.ok) {
        const apiError = await readApiError(projectRes);
        throw new Error(`Failed to create project (${projectRes.status})${apiError ? `: ${apiError}` : ''}`);
      }
      const { projectId } = await projectRes.json();

      if (projectFiles.length > 0) {
        const uploadedFiles = [];
        for (const file of projectFiles) {
          const signRes = await fetch('/api/uploads/sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, originalName: file.name, contentType: file.type })
          });
          if (!signRes.ok) {
            const apiError = await readApiError(signRes);
            throw new Error(`Failed to prepare upload (${signRes.status})${apiError ? `: ${apiError}` : ''}`);
          }
          const { upload } = await signRes.json();
          const { data, error } = await supabase.storage
            .from(upload.bucket)
            .uploadToSignedUrl(upload.path, upload.token, file, {
              contentType: file.type || 'application/octet-stream'
            });
          if (error) throw new Error(error.message);
          uploadedFiles.push({
            bucket: upload.bucket,
            path: data?.path || upload.path,
            originalName: file.name,
            contentType: file.type || null,
            sizeBytes: file.size
          });
        }
        const recordRes = await fetch(`/api/projects/${projectId}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: uploadedFiles })
        });
        if (!recordRes.ok) {
          const apiError = await readApiError(recordRes);
          throw new Error(`Failed to record uploaded files (${recordRes.status})${apiError ? `: ${apiError}` : ''}`);
        }
      }

      const checkoutRes = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
      if (!checkoutRes.ok) {
        const apiError = await readApiError(checkoutRes);
        throw new Error(`Checkout failed (${checkoutRes.status})${apiError ? `: ${apiError}` : ''}`);
      }
      const { url } = await checkoutRes.json();
      window.location.assign(url);
    } catch (error) {
      setSubmitError(error?.message || 'Something went wrong submitting your project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid #000000',
    padding: '16px 0',
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    fontSize: '24px',
    color: '#000000',
    borderRadius: 0,
    outline: 'none'
  };

  return (
    <>
      <div
        onClick={() => navigate('/')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 600,
          textTransform: 'uppercase',
          marginBottom: '24px',
          opacity: 0.6,
          cursor: 'pointer'
        }}
      >
        ← Back to Services
      </div>

      <section style={{ marginBottom: '80px', animation: 'fadeIn 0.5s ease-out' }}>
        <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', marginBottom: '32px', border: 'none' }} />
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, lineHeight: 1.2, marginBottom: '40px' }}>
          Build Your Own / <span style={{ color: '#FF4500' }}>Custom Bundle</span><br />
          <span style={{ fontSize: '0.7em', opacity: 0.7 }}>Mix and match services to create your perfect rendering package.</span>
        </h2>
        <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: 0, border: 'none' }} />

        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', margin: '40px 0 8px 0' }}>
          Select Your Renders
        </h3>
        <p style={{ fontSize: '16px', opacity: 0.7, margin: '0 0 20px 0', lineHeight: 1.5 }}>
          Click + Add on any services you'd like included in your project.
        </p>

        {CUSTOM_SERVICES.map(service => (
          <SelectableServiceRow
            key={service.key}
            price={servicePrices[service.key]}
            title={service.title}
            tag={service.tag}
            selected={selectedServices.has(service.key)}
            onToggle={() => toggleService(service.key)}
          />
        ))}

        <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: '60px 0 0 0', border: 'none' }} />
        <h3 style={{ fontWeight: 900, fontSize: '24px', marginTop: '40px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '-0.04em' }}>
          Book Your Bundle
        </h3>

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <div style={{ position: 'relative' }}>
            <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder="Full Name" required value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder="Business Name (Optional)" value={businessName} onChange={e => setBusinessName(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder="Project Notes (Style, location, references, etc.)" value={projectInfo} onChange={e => setProjectInfo(e.target.value)} style={inputStyle} />
          </div>

          <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: '20px 0', border: 'none' }} />
          <h3 style={{ fontWeight: 900, fontSize: '20px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '-0.04em' }}>
            Project Files
          </h3>
          <FileUpload id="files-custom" onFilesChange={setProjectFiles} />

          <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: '20px 0', border: 'none' }} />
          <h3 style={{ fontWeight: 900, fontSize: '20px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '-0.04em' }}>
            Checkout
          </h3>
          <p style={{ fontSize: '16px', lineHeight: 1.6, opacity: 0.7, marginTop: '-12px' }}>
            Taxes are calculated at checkout.
          </p>

          <div style={{ marginTop: '40px', padding: '24px', border: `2px solid ${selectedServices.size > 0 ? '#000000' : 'rgba(0,0,0,0.2)'}`, transition: 'border-color 0.2s' }}>
            {selectedServices.size === 0 ? (
              <p style={{ fontSize: '16px', opacity: 0.5, textAlign: 'center', padding: '16px 0', margin: 0 }}>
                No services selected yet — choose above to see your total.
              </p>
            ) : (
              <>
                {selectedList.map(key => {
                  const svc = CUSTOM_SERVICES.find(s => s.key === key);
                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ fontWeight: 500 }}>{svc?.title} (4K)</span>
                      <span>${servicePrices[key]}</span>
                    </div>
                  );
                })}
                <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', opacity: 0.2, margin: '16px 0', border: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 600 }}>
                  <span>Total</span>
                  <span style={{ color: '#FF4500' }}>${total}</span>
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || selectedServices.size === 0}
            style={{
              background: 'transparent',
              border: '2px solid #000000',
              textAlign: 'center',
              fontSize: '28px',
              fontWeight: 400,
              cursor: (isSubmitting || selectedServices.size === 0) ? 'default' : 'pointer',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'color 0.2s',
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              marginTop: '32px',
              width: '100%',
              opacity: (isSubmitting || selectedServices.size === 0) ? 0.5 : 1
            }}
          >
            {isSubmitting ? 'Submitting…' : 'Checkout'} <span>→</span>
          </button>
          {!!submitError && (
            <p style={{ marginTop: '12px', fontSize: '13px', color: '#FF4500' }}>
              {submitError}
            </p>
          )}
        </form>
      </section>
    </>
  );
};

export default CustomProjectPage;
