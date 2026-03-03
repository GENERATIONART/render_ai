import React from 'react';
import { useNavigate } from 'react-router-dom';

const AboutPage = ({ aboutHeadline, aboutHighlight, aboutBody, aboutSectors, aboutCapabilities }) => {
  const navigate = useNavigate();
  const defaultParagraphs = [
    'We are a multidisciplinary team of architects, interior designers, and technologists with extensive experience creating high-fidelity 3D visualizations for leading design firms, real estate developers, and cultural institutions worldwide.',
    "After years working with major agencies, we recognized a gap: exceptional architectural visualization remained inaccessible to emerging designers, independent practices, and smaller studios who couldn't justify the traditional cost and turnaround time.",
    'So we built a streamlined process—combining deep technical expertise with efficient workflows—to deliver photorealistic presentation imagery at a fraction of the industry standard. Our mission is to democratize access to world-class visualization, empowering a broader community of design enthusiasts to communicate their vision with clarity and impact.',
    "Whether you're pitching to clients, submitting for permits, or building your portfolio, we're here to make professional-grade rendering fast, affordable, and straightforward."
  ];
  const paragraphText = (aboutBody && aboutBody.trim().length > 0)
    ? aboutBody
    : defaultParagraphs.join('\n\n');
  const paragraphs = paragraphText
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
  const splitLines = (text) =>
    String(text || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  const defaultSectors = [
    'Residential Architecture',
    'Commercial Real Estate',
    'Interior Design Studios',
    'Urban Development',
    'Hospitality & Retail'
  ];
  const defaultCapabilities = [
    'Photorealistic Rendering',
    'Material & Lighting Simulation',
    'Site Context Integration',
    'Entourage & Atmosphere',
    'Rapid Turnaround Workflow'
  ];
  const sectors = splitLines(aboutSectors);
  const capabilities = splitLines(aboutCapabilities);

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
        ← Back to Home
      </div>

      <section style={{ marginBottom: '80px', animation: 'fadeIn 0.5s ease-out' }}>
        <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', marginBottom: '32px', border: 'none' }} />
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, lineHeight: 1.2, marginBottom: '40px' }}>
          {(aboutHeadline || 'Who We Are /').trim()} <span style={{ color: '#FF4500' }}>{aboutHighlight || 'About'}</span>
        </h2>
        <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', marginBottom: '40px', border: 'none' }} />

        <div style={{ fontSize: '20px', lineHeight: 1.7, marginBottom: '60px' }}>
          {paragraphs.map((paragraph, index) => (
            <p
              key={`${index}-${paragraph.slice(0, 12)}`}
              style={{
                marginBottom: index === paragraphs.length - 1 ? 0 : '32px',
                opacity: index === paragraphs.length - 1 ? 0.7 : 1
              }}
            >
              {paragraph}
            </p>
          ))}
        </div>

        <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: '60px 0 40px 0', border: 'none' }} />
        <h3 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '32px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Our Experience</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em', color: '#FF4500' }}>Sectors</h4>
            <ul style={{ listStyle: 'none', fontSize: '16px', lineHeight: 2 }}>
              {(sectors.length > 0 ? sectors : defaultSectors).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em', color: '#FF4500' }}>Capabilities</h4>
            <ul style={{ listStyle: 'none', fontSize: '16px', lineHeight: 2 }}>
              {(capabilities.length > 0 ? capabilities : defaultCapabilities).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutPage;
