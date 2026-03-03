import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const PortfolioDetailPage = ({ items }) => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const item = items.find((entry) => entry.slug === slug);
  const images = Array.isArray(item?.images) && item.images.length > 0
    ? item.images
    : (item?.image ? [item.image] : []);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStart = React.useRef({ x: 0, y: 0, time: 0 });
  const touchDelta = React.useRef({ x: 0, y: 0 });

  useEffect(() => {
    setActiveIndex(0);
  }, [slug]);

  if (!item) {
    return (
      <>
        <div
          onClick={() => navigate('/portfolio')}
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
          ← Back to Portfolio
        </div>
        <section style={{ marginBottom: '80px', animation: 'fadeIn 0.5s ease-out' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, lineHeight: 1.2, marginBottom: '20px' }}>
            Project Not Found
          </h2>
          <p style={{ fontSize: '18px', opacity: 0.7 }}>
            The project you're looking for doesn't exist. Return to the portfolio to browse available work.
          </p>
        </section>
      </>
    );
  }

  const pageUrl = `https://renderai.lol/portfolio/${item.slug}`;
  const primaryImage = images[0] || item.image;

  return (
    <>
      <Helmet>
        <title>{item.title} | Portfolio | Render AI</title>
        <meta name="description" content={item.brief || `View the ${item.title} architectural rendering project by Render AI.`} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={`${item.title} | Render AI Portfolio`} />
        <meta property="og:description" content={item.brief || `Photorealistic architectural rendering: ${item.title}`} />
        <meta property="og:url" content={pageUrl} />
        {primaryImage && <meta property="og:image" content={primaryImage} />}
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'ImageObject',
              name: item.title,
              description: item.brief || `Architectural rendering: ${item.title}`,
              contentUrl: primaryImage,
              url: pageUrl,
              creator: { '@type': 'Organization', name: 'Render AI', url: 'https://renderai.lol' },
              ...(item.location ? { locationCreated: { '@type': 'Place', name: item.location } } : {})
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://renderai.lol' },
                { '@type': 'ListItem', position: 2, name: 'Portfolio', item: 'https://renderai.lol/portfolio' },
                { '@type': 'ListItem', position: 3, name: item.title, item: pageUrl },
              ]
            }
          ]
        })}</script>
      </Helmet>
      <div
        onClick={() => navigate('/portfolio')}
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
        ← Back to Portfolio
      </div>

      <section style={{ marginBottom: '80px', animation: 'fadeIn 0.5s ease-out' }}>
        <div
          onTouchStart={(e) => {
            const touch = e.touches[0];
            touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
            touchDelta.current = { x: 0, y: 0 };
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            touchDelta.current = {
              x: touch.clientX - touchStart.current.x,
              y: touch.clientY - touchStart.current.y
            };
          }}
          onTouchEnd={() => {
            if (images.length < 2) return;
            const { x, y } = touchDelta.current;
            const absX = Math.abs(x);
            const absY = Math.abs(y);
            if (absX < 40 || absX < absY) return;
            if (x < 0) {
              setActiveIndex((prev) => (prev + 1) % images.length);
            } else {
              setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
            }
          }}
          style={{
          aspectRatio: '16/9',
          backgroundColor: '#E0E0E0',
          width: '100%',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {images.length > 0 ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url('${images[Math.min(activeIndex, images.length - 1)]}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'opacity 0.2s ease'
              }}
            />
          ) : null}
          {images.length > 1 ? (
            <>
              <button
                type="button"
                data-carousel-button="prev"
                onClick={() => setActiveIndex((prev) => (prev - 1 + images.length) % images.length)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 12,
                  transform: 'translateY(-50%)',
                  border: '2px solid #000000',
                  background: 'rgba(255,255,255,0.85)',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: '#000000',
                  WebkitAppearance: 'none',
                  appearance: 'none'
                }}
              >
                ←
              </button>
              <button
                type="button"
                data-carousel-button="next"
                onClick={() => setActiveIndex((prev) => (prev + 1) % images.length)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: 12,
                  transform: 'translateY(-50%)',
                  border: '2px solid #000000',
                  background: 'rgba(255,255,255,0.85)',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: '#000000',
                  WebkitAppearance: 'none',
                  appearance: 'none'
                }}
              >
                →
              </button>
              <div style={{ position: 'absolute', left: '50%', bottom: 12, transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
                {images.map((_, idx) => (
                  <button
                    key={`dot-${idx}`}
                    type="button"
                    data-carousel-dot
                    onClick={() => setActiveIndex(idx)}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      border: '1px solid #000000',
                      background: idx === activeIndex ? '#000000' : 'rgba(255,255,255,0.8)',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div style={{ marginTop: '40px' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, lineHeight: 1.2, marginBottom: '16px' }}>
            {item.title}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', fontSize: '12px', textTransform: 'uppercase', opacity: 0.7 }}>
            <span style={{ color: '#FF4500', fontWeight: 800 }}>{item.tag}</span>
            <span>Location: {item.location}</span>
            <span>Render Time: {item.renderTime}</span>
          </div>
          <p style={{ fontSize: '20px', lineHeight: 1.7, marginTop: '24px', maxWidth: '900px' }}>
            {item.brief}
          </p>
        </div>

        <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: '40px 0', border: 'none' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 800, letterSpacing: '0.05em' }}>Project Scope</h3>
            <p style={{ fontSize: '18px', lineHeight: 1.6, opacity: 0.8 }}>{item.scope}</p>

            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', marginTop: '32px', marginBottom: '16px', fontWeight: 800, letterSpacing: '0.05em' }}>Deliverables</h3>
            <ul style={{ listStyle: 'none', fontSize: '16px', lineHeight: 2 }}>
              {item.deliverables.map((deliverable, index) => (
                <li key={index}>
                  <span style={{ color: '#FF4500', marginRight: '8px', fontWeight: 'bold' }}>→</span>
                  {deliverable}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 800, letterSpacing: '0.05em' }}>Pipeline</h3>
            {item.timeline.map((step, index) => (
              <div key={index} style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <span style={{ fontFamily: 'monospace', color: '#FF4500', fontWeight: 'bold', fontSize: '14px', paddingTop: '4px' }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px', fontSize: '18px' }}>{step.title}</strong>
                  <p style={{ fontSize: '16px', opacity: 0.7, lineHeight: 1.4 }}>{step.description}</p>
                </div>
              </div>
            ))}

            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', marginTop: '32px', marginBottom: '16px', fontWeight: 800, letterSpacing: '0.05em' }}>Tools</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {item.tools.map((tool) => (
                <span key={tool} style={{ padding: '8px 12px', border: '1px solid #000000', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>

        <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: '40px 0', border: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Interested in a similar project?
            </h3>
            <p style={{ fontSize: '16px', opacity: 0.7, lineHeight: 1.4 }}>
              Tell us about your project and we'll recommend the right rendering package.
            </p>
          </div>
          <Link to="/#contact" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div
              style={{
                background: 'transparent',
                border: '2px solid #000000',
                textAlign: 'center',
                fontSize: '18px',
                fontWeight: 400,
                cursor: 'pointer',
                padding: '16px 24px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'color 0.2s',
                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                whiteSpace: 'nowrap'
              }}
            >
              Start a Project <span>→</span>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
};

export default PortfolioDetailPage;
