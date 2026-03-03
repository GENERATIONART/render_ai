import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import readApiError from '../lib/readApiError.js';

const ServiceRow = ({ price, priceDisplay, title, tag, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <div
        data-service-row
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'grid',
          gridTemplateColumns: '100px 1fr auto',
          alignItems: 'baseline',
          padding: '32px 0',
          position: 'relative',
          cursor: 'pointer',
          gap: '20px',
          transition: 'background 0.2s',
          backgroundColor: isHovered ? 'rgba(0,0,0,0.02)' : 'transparent'
        }}
      >
        <div data-service-price style={{ fontSize: '32px', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1, color: '#FF4500' }}>
          {priceDisplay !== undefined ? priceDisplay : `$${price}`}
        </div>
        <div data-service-title style={{ fontSize: '32px', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {title} <span style={{ fontSize: '14px', verticalAlign: 'middle', marginLeft: '10px', fontWeight: 400, display: 'inline-block', opacity: 0.6 }}>({tag})</span>
        </div>
        <div data-service-cta style={{ fontSize: '16px', fontWeight: 500, textAlign: 'right', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#FF4500' }}>Start</span>
          <span style={{ transition: 'transform 0.2s ease', transform: isHovered ? 'translateX(5px)' : 'translateX(0)' }}>→</span>
        </div>
      </div>
      <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: 0, border: 'none' }} />
    </>
  );
};

const HomePage = ({ servicePrices, heroHeadline, heroSubheadline, contactHeadline, contactSubheadline }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          businessName,
          projectType,
          estimatedBudget
        })
      });
      if (!res.ok) {
        const apiError = await readApiError(res);
        throw new Error(`Inquiry failed (${res.status})${apiError ? `: ${apiError}` : ''}`);
      }
      navigate('/inquiry-confirmation');
    } catch (error) {
      setSubmitError(error?.message || 'Something went wrong submitting your inquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const headlineText = heroHeadline || 'Architecture visualized / instantly.';
  const subheadlineText =
    heroSubheadline ||
    'High fidelity renderings for Interior Designers, Architects, Builders, Real Estate Developers, Real Estate Agents, and Homeowners starting at';

	  return (
	    <>
      <section style={{ marginBottom: '80px', animation: 'fadeIn 0.5s ease-out' }}>
        <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', marginBottom: '32px', border: 'none' }} />
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, lineHeight: 1.2, marginBottom: '40px' }}>
          {headlineText} <br />
          {subheadlineText} <span style={{ color: '#FF4500' }}>$500</span>.
        </h2>
	      </section>

	      <section id="services" style={{ marginBottom: '80px', animation: 'fadeIn 0.5s ease-out' }}>
	        <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: 0, border: 'none' }} />

        <ServiceRow price={servicePrices['residential-exterior']} title="Residential Exterior" tag="24H Turnaround" onClick={() => navigate('/residential-exterior')} />
        <ServiceRow price={servicePrices['residential-interior']} title="Residential Interior" tag="Living Spaces" onClick={() => navigate('/residential-interior')} />
        <ServiceRow price={servicePrices['residential-aerial']} title="Residential Aerial" tag="Neighborhood View" onClick={() => navigate('/residential-aerial')} />
        <ServiceRow price={servicePrices['commercial-exterior']} title="Commercial Exterior" tag="Office/Retail" onClick={() => navigate('/commercial-exterior')} />
        <ServiceRow price={servicePrices['commercial-interior']} title="Commercial Interior" tag="Office/Retail" onClick={() => navigate('/commercial-interior')} />
        <ServiceRow price={servicePrices['commercial-aerial']} title="Commercial Aerial" tag="Campus View" onClick={() => navigate('/commercial-aerial')} />
        <ServiceRow price={servicePrices['3d-model']} title="3D Model" tag="SKP / DWG / 3DS" onClick={() => navigate('/3d-model')} />
        <ServiceRow priceDisplay="Custom" title="Build Your Own" tag="Mix & Match Services" onClick={() => navigate('/custom')} />
      </section>

	      <section id="contact" style={{ marginBottom: '80px', animation: 'fadeIn 0.5s ease-out' }}>
	        <h2 style={{ fontWeight: 900, fontSize: '32px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '-0.04em' }}>
            {contactHeadline || 'PROJECT / INQUIRY'}
          </h2>
          {contactSubheadline ? (
            <p style={{ fontSize: '16px', opacity: 0.7, marginTop: 0, marginBottom: '20px' }}>
              {contactSubheadline}
            </p>
          ) : null}
	        <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: 0, border: 'none' }} />

	        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginTop: '40px' }}>
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
	              placeholder="Project Type"
	              required
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
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
              placeholder="Estimated Budget"
              required
              value={estimatedBudget}
              onChange={(e) => setEstimatedBudget(e.target.value)}
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

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              fontSize: '28px',
              fontWeight: 400,
              cursor: isSubmitting ? 'default' : 'pointer',
              padding: '20px 0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'color 0.2s',
              color: '#000000',
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              opacity: isSubmitting ? 0.6 : 1
            }}
          >
            Submit Inquiry <span>→</span>
          </button>
          {!!submitError && (
            <p style={{ marginTop: '-20px', fontSize: '13px', color: '#FF4500' }}>
              {submitError}
            </p>
          )}
	        </form>
      </section>
    </>
  );
};

export default HomePage;
