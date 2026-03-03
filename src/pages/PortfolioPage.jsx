import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const PortfolioPage = ({ items }) => {
  const navigate = useNavigate();

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
          Selected Works / <span style={{ color: '#FF4500' }}>Portfolio</span><br />
          <span style={{ fontSize: '0.7em', opacity: 0.7 }}>Exploring the intersection of light, material, and geometric form.</span>
        </h2>
        <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', marginBottom: '64px', border: 'none' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
          {items.map((item, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                aspectRatio: '16/9',
                backgroundColor: '#E0E0E0',
                width: '100%',
                position: 'relative',
                overflow: 'hidden',
                backgroundImage: `url('${item.image}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}></div>
              <div data-portfolio-row style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'flex-end', gap: 20 }}>
                <div>
                  <div data-portfolio-title style={{ fontSize: '24px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                    {item.title}
                  </div>
                  <div data-portfolio-meta style={{ display: 'flex', gap: '24px', fontSize: '12px', textTransform: 'uppercase', opacity: 0.6, marginTop: '8px', flexWrap: 'wrap' }}>
                    <span data-portfolio-pill style={{ color: '#FF4500', fontWeight: 800 }}>{item.tag}</span>
                    <span data-portfolio-pill>Location: {item.location}</span>
                    <span data-portfolio-pill>Render Time: {item.renderTime}</span>
                  </div>
                </div>
                <Link
                  to={`/portfolio/${item.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div data-portfolio-cta style={{ fontSize: '16px', fontWeight: 500, textAlign: 'right', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
                    VIEW PROJECT <span>→</span>
                  </div>
                </Link>
              </div>
              <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', opacity: 0.1, margin: 0, border: 'none' }} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default PortfolioPage;
