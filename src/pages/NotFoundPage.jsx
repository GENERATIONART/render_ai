import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const NotFoundPage = () => {
  return (
    <section style={{ textAlign: 'center', padding: '80px 20px', animation: 'fadeIn 0.5s ease-out' }}>
      <Helmet>
        <title>404 – Page Not Found | Render AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div style={{ fontSize: '64px', fontWeight: 900, color: '#FF4500', letterSpacing: '-0.04em', marginBottom: '16px' }}>404</div>
      <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, lineHeight: 1.2, marginBottom: '20px' }}>
        Page Not Found
      </h2>
      <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: '40px auto', maxWidth: '400px', border: 'none' }} />
      <p style={{ fontSize: '20px', lineHeight: 1.6, opacity: 0.7, marginBottom: '40px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
        The page you're looking for doesn't exist. Head back home to browse our services.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '18px',
          fontWeight: 400,
          color: '#000000',
          textDecoration: 'none',
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif"
        }}
      >
        <span>←</span> Back to Home
      </Link>
    </section>
  );
};

export default NotFoundPage;
