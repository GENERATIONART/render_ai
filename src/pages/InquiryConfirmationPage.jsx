import React from 'react';
import { useNavigate } from 'react-router-dom';

const InquiryConfirmationPage = () => {
  const navigate = useNavigate();

  return (
    <section style={{ textAlign: 'center', padding: '80px 20px', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ fontSize: '64px', marginBottom: '32px' }}>✓</div>
      <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, lineHeight: 1.2, marginBottom: '20px' }}>
        Inquiry Received
      </h2>
      <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: '40px auto', maxWidth: '400px', border: 'none' }} />
      <p style={{ fontSize: '20px', lineHeight: 1.6, opacity: 0.8, marginBottom: '40px', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
        Thanks for reaching out. We'll review your details and get back to you as soon as possible.
      </p>

      <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '40px', margin: '40px 0', textAlign: 'left' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '24px', letterSpacing: '0.05em' }}>
          What Happens Next
        </h3>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
          <span style={{ fontFamily: 'monospace', color: '#FF4500', fontWeight: 'bold', fontSize: '14px', paddingTop: '4px' }}>01</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '18px' }}>We Review Your Inquiry</strong>
            <p style={{ fontSize: '16px', opacity: 0.7, lineHeight: 1.4 }}>Our team will review your project details and determine the best package.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
          <span style={{ fontFamily: 'monospace', color: '#FF4500', fontWeight: 'bold', fontSize: '14px', paddingTop: '4px' }}>02</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '18px' }}>We Follow Up</strong>
            <p style={{ fontSize: '16px', opacity: 0.7, lineHeight: 1.4 }}>We'll reach out with a timeline, cost, and any clarifying questions.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <span style={{ fontFamily: 'monospace', color: '#FF4500', fontWeight: 'bold', fontSize: '14px', paddingTop: '4px' }}>03</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '18px' }}>Kickoff</strong>
            <p style={{ fontSize: '16px', opacity: 0.7, lineHeight: 1.4 }}>Once approved, we'll start production and share the first draft.</p>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '16px', opacity: 0.6, marginBottom: '40px' }}>
        Need to add more details? Email us at <span style={{ color: '#FF4500', fontWeight: 600 }}>hello@renderai.lol</span>
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
        <span>←</span> Back to Home
      </button>
    </section>
  );
};

export default InquiryConfirmationPage;
