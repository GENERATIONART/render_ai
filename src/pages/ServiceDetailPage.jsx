import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseBrowser } from '../lib/supabaseBrowser.js';
import FileUpload from '../components/FileUpload.jsx';
import readApiError from '../lib/readApiError.js';

const ServiceDetailPage = ({ price, title, subtitle, includes, process, serviceName }) => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [projectInfo, setProjectInfo] = useState('');
  const [projectFiles, setProjectFiles] = useState([]);

  const proceedLabel = 'Checkout';
  const buttonLabel = isSubmitting ? 'Submitting…' : proceedLabel;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const supabase = getSupabaseBrowser();

      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, businessName, serviceName, projectInfo })
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

          if (error) {
            throw new Error(error.message);
          }

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
          {title} / <span style={{ color: '#FF4500' }}>${price}</span><br />
          <span style={{ fontSize: '0.7em', opacity: 0.7 }}>{subtitle}</span>
        </h2>
        <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: 0, border: 'none' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '40px', marginBottom: '40px' }}>
          <div>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', marginBottom: '24px', fontWeight: 800, letterSpacing: '0.05em' }}>What's Included</h3>
            <ul style={{ listStyle: 'none' }}>
              {includes.map((item, index) => (
                <li key={index} style={{ fontSize: '18px', padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'start' }}>
                  <span style={{ color: '#FF4500', marginRight: '12px' }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', marginBottom: '24px', fontWeight: 800, letterSpacing: '0.05em' }}>The Process</h3>
            {process.map((step, index) => (
              <div key={index} style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                <span style={{ fontFamily: 'monospace', color: '#FF4500', fontWeight: 'bold', fontSize: '14px', paddingTop: '4px' }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px', fontSize: '18px' }}>{step.title}</strong>
                  <p style={{ fontSize: '16px', opacity: 0.7, lineHeight: 1.4 }}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: 0, border: 'none' }} />
        <h3 style={{ fontWeight: 900, fontSize: '24px', marginTop: '40px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '-0.04em' }}>
          Book {title}
        </h3>

	        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginTop: 0 }}>
	          <div style={{ position: 'relative' }}>
	            <input
	              type="email"
	              placeholder="Email Address"
	              required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
	              style={{
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
	              }}
	            />
	          </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Full Name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
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
                }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Business Name (Optional)"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                style={{
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
                }}
              />
            </div>
	          <div style={{ position: 'relative' }}>
	            <input
	              type="text"
	              value={`${title} ($${price})`}
	              readOnly
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid #000000',
                padding: '16px 0',
                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                fontSize: '24px',
                color: '#000000',
                borderRadius: 0,
                outline: 'none',
                opacity: 0.6
              }}
            />
          </div>
	          <div style={{ position: 'relative' }}>
	            <input
	              type="text"
	              placeholder={serviceName === 'residential-exterior' ? 'Project Link / DropBox (Optional)' :
	                           serviceName === 'residential-interior' ? 'Style Preference (e.g. Minimalist)' :
	                           serviceName === 'residential-aerial' ? 'Site Location / Address' :
	                           serviceName === 'commercial-exterior' ? 'Development Name / Brand' :
	                           serviceName === 'commercial-interior' ? 'Square Footage' :
	                           serviceName === '3d-model' ? 'Preferred Output Format (SKP, DWG, or 3DS)' :
	                           'Campus / Site Address'}
                value={projectInfo}
                onChange={(e) => setProjectInfo(e.target.value)}
	              style={{
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
              }}
            />
          </div>

          <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: '20px 0', border: 'none' }} />
	          <h3 style={{ fontWeight: 900, fontSize: '20px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '-0.04em' }}>
	            Project Files
	          </h3>

	          <FileUpload
              id={`files-${serviceName}`}
              onFilesChange={setProjectFiles}
            />

          <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: '20px 0', border: 'none' }} />
	          <h3 style={{ fontWeight: 900, fontSize: '20px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '-0.04em' }}>
	            Checkout
	          </h3>
	          <p style={{ fontSize: '16px', lineHeight: 1.6, opacity: 0.7, marginTop: '-12px' }}>
              Taxes are calculated at checkout.
            </p>

	          <div style={{ marginTop: '40px', padding: '24px', border: '2px solid #000000' }}>
	            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
	              <span style={{ fontWeight: 500 }}>{title} (4K)</span>
              <span>${price}</span>
            </div>
            <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', opacity: 0.2, margin: '16px 0', border: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 600 }}>
              <span>Total</span>
              <span style={{ color: '#FF4500' }}>${price}</span>
            </div>
          </div>

	          <button
	            type="submit"
              disabled={isSubmitting}
	            style={{
	              background: 'transparent',
	              border: '2px solid #000000',
	              textAlign: 'center',
	              fontSize: '28px',
	              fontWeight: 400,
	              cursor: isSubmitting ? 'default' : 'pointer',
	              padding: '24px',
	              display: 'flex',
	              alignItems: 'center',
	              justifyContent: 'center',
	              gap: '10px',
	              transition: 'color 0.2s',
	              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
	              marginTop: '32px',
	              width: '100%',
                opacity: isSubmitting ? 0.6 : 1
	            }}
	          >
	            {buttonLabel} <span>→</span>
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

export default ServiceDetailPage;
