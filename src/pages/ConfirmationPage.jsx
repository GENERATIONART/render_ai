import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const paymentMethod = location?.state?.paymentMethod;
  const serviceTitle = location?.state?.title;
  const servicePrice = location?.state?.price;
  const searchParams = new URLSearchParams(location?.search || '');
  const stripeSessionId = searchParams.get('session_id');
  const [stripeSessionStatus, setStripeSessionStatus] = useState(null);

  useEffect(() => {
    if (!stripeSessionId) {
      return;
    }
    let cancelled = false;
    const loadStatus = async () => {
      try {
        const res = await fetch(`/api/checkout/session-status?session_id=${encodeURIComponent(stripeSessionId)}`);
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setStripeSessionStatus(data?.session?.payment_status || null);
        }
      } catch (error) {
        // ignore
      }
    };
    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [stripeSessionId]);

  return (
    <section style={{ textAlign: 'center', padding: '20px 20px 80px 20px', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ fontSize: '64px', marginBottom: '32px' }}>✓</div>
      <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, lineHeight: 1.2, marginBottom: '20px' }}>
        {paymentMethod === 'wire-transfer' ? 'Wire Transfer Started' : 'Order Confirmed'}
      </h2>
      <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: '40px auto', maxWidth: '400px', border: 'none' }} />
      <p style={{ fontSize: '20px', lineHeight: 1.6, opacity: 0.8, marginBottom: '40px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
        {paymentMethod === 'wire-transfer'
          ? "We've saved your request. Send your wire using the details below to kick off production."
          : "Thank you for your order. We've received your project details and will begin work immediately."}
      </p>

      {!!stripeSessionId && (
        <p style={{ fontSize: '14px', opacity: 0.6, marginBottom: '16px' }}>
          Payment status: {stripeSessionStatus || 'checking…'}
        </p>
      )}

      {paymentMethod === 'wire-transfer' && (
        <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '24px', margin: '24px auto 40px auto', textAlign: 'left', maxWidth: '680px' }}>
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 800, letterSpacing: '0.05em' }}>
            Wire Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px 16px', fontSize: '16px', lineHeight: 1.6, opacity: 0.9 }}>
            <span style={{ fontWeight: 600 }}>Bank Name</span>
            <span>YOUR BANK NAME</span>
            <span style={{ fontWeight: 600 }}>Account Name</span>
            <span>RENDER AI LLC</span>
            <span style={{ fontWeight: 600 }}>Routing</span>
            <span>XXXXXX</span>
            <span style={{ fontWeight: 600 }}>Account</span>
            <span>XXXXXX</span>
            <span style={{ fontWeight: 600 }}>SWIFT</span>
            <span>XXXXXX</span>
            <span style={{ fontWeight: 600 }}>Memo</span>
            <span>{serviceTitle ? `${serviceTitle}${servicePrice ? ` ($${servicePrice})` : ''}` : 'Your project name'}</span>
          </div>
          <p style={{ marginTop: '16px', fontSize: '14px', opacity: 0.7 }}>
            Reply to your confirmation email if you need a secure portal link.
          </p>
        </div>
      )}

      <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '40px', margin: '40px 0', textAlign: 'left' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '24px', letterSpacing: '0.05em' }}>
          What Happens Next
        </h3>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
          <span style={{ fontFamily: 'monospace', color: '#FF4500', fontWeight: 'bold', fontSize: '14px', paddingTop: '4px' }}>01</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '18px' }}>Confirmation Email</strong>
            <p style={{ fontSize: '16px', opacity: 0.7, lineHeight: 1.4 }}>You'll receive an order confirmation with project details within 5 minutes.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
          <span style={{ fontFamily: 'monospace', color: '#FF4500', fontWeight: 'bold', fontSize: '14px', paddingTop: '4px' }}>02</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '18px' }}>Project Kickoff</strong>
            <p style={{ fontSize: '16px', opacity: 0.7, lineHeight: 1.4 }}>Our team will review your files and reach out if we need any clarifications.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
          <span style={{ fontFamily: 'monospace', color: '#FF4500', fontWeight: 'bold', fontSize: '14px', paddingTop: '4px' }}>03</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '18px' }}>Progress Updates</strong>
            <p style={{ fontSize: '16px', opacity: 0.7, lineHeight: 1.4 }}>We'll email you with progress updates and draft previews throughout the process.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
          <span style={{ fontFamily: 'monospace', color: '#FF4500', fontWeight: 'bold', fontSize: '14px', paddingTop: '4px' }}>04</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '18px' }}>Final Delivery</strong>
            <p style={{ fontSize: '16px', opacity: 0.7, lineHeight: 1.4 }}>High-resolution files will be delivered via email within the turnaround time.</p>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '16px', opacity: 0.6, marginBottom: '40px' }}>
        Questions? Email us at <span style={{ color: '#FF4500', fontWeight: 600 }}>hello@renderai.lol</span>
      </p>

      <button
        onClick={() => navigate('/')}
        style={{
          background: 'transparent',
          border: 'none',
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: 400,
          cursor: 'pointer',
          padding: '20px 0',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'color 0.2s',
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          margin: '0 auto'
        }}
      >
        <span>←</span> Back to Services
      </button>
    </section>
  );
};

export default ConfirmationPage;
