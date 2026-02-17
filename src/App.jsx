import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Link, useParams, useLocation } from 'react-router-dom';
import portfolioData from './portfolioData.js';
import { getSupabaseBrowser } from './lib/supabaseBrowser.js';
import { AdminPage } from './admin/AdminPage.jsx';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <section style={{ padding: '40px 0', animation: 'fadeIn 0.35s ease-out' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 400, lineHeight: 1.2, marginBottom: '16px' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.75, lineHeight: 1.5 }}>
            {this.state.error?.message || String(this.state.error)}
          </p>
          <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '12px' }}>
            Open DevTools Console for the full stack trace.
          </p>
        </section>
      );
    }
    return this.props.children;
  }
}

const customStyles = {
  container: {
    width: '100%',
    maxWidth: '100%',
    padding: '40px clamp(16px, 4vw, 60px) 120px clamp(16px, 4vw, 60px)',
    display: 'flex',
    flexDirection: 'column'
  },
  root: {
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    backgroundColor: '#F4F4F4',
    color: '#000000',
    width: '100vw',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: 0,
    padding: 0,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    overflowX: 'hidden'
  }
};

const ServiceRow = ({ price, title, tag, onClick }) => {
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
          ${price}
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

const FileUpload = ({ id, fileListId, onFilesChange }) => {
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
        style={{
          border: '2px dashed #000000',
          padding: '40px 24px',
          textAlign: 'center',
          transition: 'all 0.2s',
          cursor: 'pointer',
          background: 'transparent'
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📁</div>
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
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {files.map((file, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #000000', fontSize: '14px' }}>
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

const Header = () => {
  const navigate = useNavigate();

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 0',
      marginBottom: '80px',
      position: 'relative',
      zIndex: 50
    }}>
      <h1 
        onClick={() => navigate('/')}
        style={{
          fontWeight: 900,
          fontSize: '40px',
          lineHeight: 0.85,
          textTransform: 'uppercase',
          letterSpacing: '-0.04em',
          cursor: 'pointer'
        }}
      >
        RENDER_AI
      </h1>
      <ul style={{
        listStyle: 'none',
        textTransform: 'uppercase',
        fontSize: '14px',
        fontWeight: 500,
        letterSpacing: '0.05em',
        display: 'flex',
        gap: '24px'
      }}>
        <li><Link to="/#services" style={{ textDecoration: 'none', color: 'inherit' }}>Pricing</Link></li>
        <li><Link to="/portfolio" style={{ textDecoration: 'none', color: 'inherit' }}>Portfolio</Link></li>
        <li><Link to="/#contact" style={{ textDecoration: 'none', color: 'inherit' }}>Contact</Link></li>
        <li><Link to="/about" style={{ textDecoration: 'none', color: 'inherit' }}>About</Link></li>
      </ul>
    </nav>
  );
};

const Footer = () => (
  <footer style={{
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '40px',
    fontSize: '12px',
    textTransform: 'uppercase',
    opacity: 0.5
  }}>
    <span>Based in NY</span>
    <span>Est. 2026</span>
            <span></span>
    <a href="https://www.instagram.com/render_ai_ny/" target="_blank" rel="noopener noreferrer" style={{ color: '#555555', opacity: 1, transition: 'opacity 0.2s' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'inherit', opacity: 1 }}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
      </svg>
    </a>
  </footer>
);

const HomePage = ({ portfolioItems, heroHeadline, heroSubheadline, contactHeadline, contactSubheadline }) => {
  const navigate = useNavigate();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    navigate('/inquiry-confirmation');
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
	        
        <ServiceRow price="500" title="Residential Exterior" tag="24H Turnaround" onClick={() => navigate('/residential-exterior')} />
        <ServiceRow price="750" title="Residential Interior" tag="Living Spaces" onClick={() => navigate('/residential-interior')} />
        <ServiceRow price="850" title="Residential Aerial" tag="Neighborhood View" onClick={() => navigate('/residential-aerial')} />
        <ServiceRow price="850" title="Commercial Exterior" tag="Office/Retail" onClick={() => navigate('/commercial-exterior')} />
        <ServiceRow price="950" title="Commercial Interior" tag="Office/Retail" onClick={() => navigate('/commercial-interior')} />
        <ServiceRow price="950" title="Commercial Aerial" tag="Campus View" onClick={() => navigate('/commercial-aerial')} />
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
            style={{
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              fontSize: '28px',
              fontWeight: 400,
              cursor: 'pointer',
              padding: '20px 0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'color 0.2s',
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif"
            }}
          >
            Submit Inquiry <span>→</span>
          </button>
        </form>
      </section>
    </>
  );
};

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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                    {item.title}
                  </div>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '12px', textTransform: 'uppercase', opacity: 0.6, marginTop: '8px' }}>
                    <span style={{ color: '#FF4500', fontWeight: 800 }}>{item.tag}</span>
                    <span>Location: {item.location}</span>
                    <span>Render Time: {item.renderTime}</span>
                  </div>
                </div>
                <Link
                  to={`/portfolio/${item.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 500, textAlign: 'right', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
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

const ServiceDetailPage = ({ price, title, subtitle, includes, process, serviceName, stripeCheckoutUrl }) => {
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

  const readApiError = async (res) => {
    try {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        return data?.error ? String(data.error) : JSON.stringify(data);
      }
      const text = await res.text();
      return text ? String(text).slice(0, 300) : '';
    } catch (error) {
      return '';
    }
  };

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
              fileListId={`file-list-${serviceName}`}
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

const PortfolioDetailPage = ({ items }) => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const item = items.find((entry) => entry.slug === slug);
  const images = Array.isArray(item?.images) && item.images.length > 0
    ? item.images
    : (item?.image ? [item.image] : []);
  const [activeIndex, setActiveIndex] = useState(0);

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
            The project you're looking for doesn’t exist. Return to the portfolio to browse available work.
          </p>
        </section>
      </>
    );
  }

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
        <div style={{
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
                  background: 'rgba(255,255,255,0.8)',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontSize: 16
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
                  background: 'rgba(255,255,255,0.8)',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontSize: 16
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
              Tell us about your project and we’ll recommend the right rendering package.
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
    <section style={{ textAlign: 'center', padding: '80px 20px', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ fontSize: '64px', marginBottom: '32px' }}>✓</div>
      <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, lineHeight: 1.2, marginBottom: '20px' }}>
        {paymentMethod === 'wire-transfer' ? 'Wire Transfer Started' : 'Order Confirmed'}
      </h2>
      <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: '40px auto', maxWidth: '400px', border: 'none' }} />
      <p style={{ fontSize: '20px', lineHeight: 1.6, opacity: 0.8, marginBottom: '40px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
        {paymentMethod === 'wire-transfer'
          ? 'We’ve saved your request. Send your wire using the details below to kick off production.'
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
        Questions? Email us at <span style={{ color: '#FF4500', fontWeight: 600 }}>hello@render-ai.com</span>
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
        Thanks for reaching out. We’ll review your details and get back to you as soon as possible.
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
            <p style={{ fontSize: '16px', opacity: 0.7, lineHeight: 1.4 }}>We’ll reach out with a timeline, cost, and any clarifying questions.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <span style={{ fontFamily: 'monospace', color: '#FF4500', fontWeight: 'bold', fontSize: '14px', paddingTop: '4px' }}>03</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '18px' }}>Kickoff</strong>
            <p style={{ fontSize: '16px', opacity: 0.7, lineHeight: 1.4 }}>Once approved, we’ll start production and share the first draft.</p>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '16px', opacity: 0.6, marginBottom: '40px' }}>
        Need to add more details? Email us at <span style={{ color: '#FF4500', fontWeight: 600 }}>hello@render-ai.com</span>
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

const ScrollToHash = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      return;
    }
    const element = document.querySelector(hash);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hash]);

  return null;
};

const App = () => {
  const [portfolioItems, setPortfolioItems] = useState(portfolioData);
  const [siteCopy, setSiteCopy] = useState({});

  useEffect(() => {
    const linkElement = document.createElement('link');
    linkElement.rel = 'preconnect';
    linkElement.href = 'https://fonts.googleapis.com';
    document.head.appendChild(linkElement);

    const linkElement2 = document.createElement('link');
    linkElement2.rel = 'preconnect';
    linkElement2.href = 'https://fonts.gstatic.com';
    linkElement2.crossOrigin = 'anonymous';
    document.head.appendChild(linkElement2);

    const linkElement3 = document.createElement('link');
    linkElement3.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;800&display=swap';
    linkElement3.rel = 'stylesheet';
    document.head.appendChild(linkElement3);

    const style = document.createElement('style');
    style.textContent = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        margin: 0;
        padding: 0;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (max-width: 720px) {
        [data-app] {
          width: 100% !important;
        }
        [data-app] > div {
          padding: 20px 16px 56px 16px !important;
        }
        nav {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 12px !important;
          margin-bottom: 24px !important;
        }
        nav ul {
          flex-wrap: wrap !important;
          gap: 12px 16px !important;
          font-size: 12px !important;
        }
        h1 {
          font-size: 32px !important;
          line-height: 0.9 !important;
        }
        h2 {
          font-size: clamp(22px, 6vw, 32px) !important;
          line-height: 1.15 !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
        }
        h3 {
          font-size: 18px !important;
          line-height: 1.2 !important;
        }
        p {
          font-size: 16px !important;
          line-height: 1.5 !important;
        }
        section {
          margin-bottom: 28px !important;
        }
        hr {
          margin-top: 8px !important;
          margin-bottom: 8px !important;
        }
        form {
          gap: 14px !important;
        }
        input {
          font-size: 18px !important;
          padding: 12px 0 !important;
        }
        button {
          font-size: 20px !important;
          padding: 12px 0 !important;
        }
        [data-carousel-button] {
          font-size: 14px !important;
          padding: 6px 8px !important;
          line-height: 1 !important;
        }
        [data-carousel-dot] {
          width: 8px !important;
          height: 8px !important;
          padding: 0 !important;
          border-width: 1px !important;
        }
        ul {
          padding-left: 0 !important;
        }
        [data-app] a {
          white-space: nowrap !important;
        }
        [data-app] [style*="gridTemplateColumns: '1fr 1fr'"] {
          grid-template-columns: 1fr !important;
        }
        [data-app] [style*="gridTemplateColumns: '100px 1fr auto'"] {
          grid-template-columns: 70px 1fr auto !important;
          gap: 12px !important;
        }
        [data-service-row] {
          padding: 26px 0 !important;
        }
        [data-service-price] {
          font-size: 26px !important;
        }
        [data-service-title] {
          font-size: 26px !important;
          line-height: 1.12 !important;
        }
        [data-service-cta] {
          font-size: 16px !important;
        }
        [data-service-title] span {
          font-size: 13px !important;
          margin-left: 8px !important;
        }
        [data-app] [style*="fontSize: '32px'"] {
          font-size: 22px !important;
        }
        [data-app] [style*="fontSize: '28px'"] {
          font-size: 20px !important;
        }
        [data-app] [style*="fontSize: '24px'"] {
          font-size: 18px !important;
        }
        [data-app] [style*="padding: '40px'"] {
          padding: 20px !important;
        }
        [data-app] [style*="padding: '24px'"] {
          padding: 12px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(linkElement);
      document.head.removeChild(linkElement2);
      document.head.removeChild(linkElement3);
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        try {
          const supabase = getSupabaseBrowser();
          const { data, error } = await supabase
            .from('portfolio_items')
                .select('slug,title,tag,location,render_time,image_url,images,brief,scope,deliverables,tools,timeline')
                .eq('published', true)
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: false });
          if (!error && Array.isArray(data) && data.length > 0) {
            const mapped = data.map((row) => ({
              slug: row.slug,
              title: row.title,
              tag: row.tag,
              location: row.location,
              renderTime: row.render_time,
              images: Array.isArray(row.images) ? row.images : [],
              image: row.image_url || (Array.isArray(row.images) && row.images.length > 0 ? row.images[0] : null),
              brief: row.brief,
              scope: row.scope,
              deliverables: Array.isArray(row.deliverables) ? row.deliverables : [],
              tools: Array.isArray(row.tools) ? row.tools : [],
              timeline: Array.isArray(row.timeline) ? row.timeline : []
            }));
            setPortfolioItems(mapped);
            return;
          }
        } catch (error) {
          // ignore and fall back to static data
        }

        const response = await fetch('/portfolio.json', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map((item) => {
            const images = Array.isArray(item.images) ? item.images : [];
            return {
              ...item,
              images,
              image: item.image || (images.length > 0 ? images[0] : item.image)
            };
          });
          setPortfolioItems(normalized);
        }
      } catch (error) {
        console.error('Failed to load portfolio.json', error);
      }
    };

    loadPortfolio();
  }, []);

  useEffect(() => {
    const loadCopy = async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { data, error } = await supabase
          .from('site_copy')
          .select('key,value')
          .in('key', [
            'home.hero_headline',
            'home.hero_subheadline',
            'about.headline',
            'about.highlight',
            'about.body',
            'about.sectors',
            'about.capabilities',
            'contact.headline',
            'contact.subheadline'
          ]);
        if (error) {
          return;
        }
        const map = {};
        for (const row of data || []) {
          map[row.key] = row.value;
        }
        setSiteCopy(map);
      } catch (error) {
        // ignore
      }
    };
    loadCopy();
  }, []);

	  return (
	    <Router basename="/">
	      <ScrollToHash />
	      <div style={customStyles.root} data-app="render-ai">
	        <div style={customStyles.container}>
	          <Header />
	          
            <AppErrorBoundary>
              <Routes>
                <Route
                  path="/"
                  element={
                    <HomePage
                      portfolioItems={portfolioItems}
                      heroHeadline={siteCopy['home.hero_headline']}
                      heroSubheadline={siteCopy['home.hero_subheadline']}
                      contactHeadline={siteCopy['contact.headline']}
                      contactSubheadline={siteCopy['contact.subheadline']}
                    />
                  }
                />
                <Route path="/admin" element={<AdminPage />} />
                <Route
                  path="/about"
                  element={
                    <AboutPage
                      aboutHeadline={siteCopy['about.headline']}
                      aboutHighlight={siteCopy['about.highlight']}
                      aboutBody={siteCopy['about.body']}
                      aboutSectors={siteCopy['about.sectors']}
                      aboutCapabilities={siteCopy['about.capabilities']}
                    />
                  }
                />
                <Route path="/portfolio" element={<PortfolioPage items={portfolioItems} />} />
                <Route path="/portfolio/:slug" element={<PortfolioDetailPage items={portfolioItems} />} />
                <Route path="/residential-exterior" element={
                  <ServiceDetailPage 
                    price="500"
                    title="Residential Exterior"
                    subtitle="Photorealistic visualization for single-family homes to showcase architectural intent and curb appeal."
                    serviceName="residential-exterior"
                    stripeCheckoutUrl={import.meta.env.VITE_STRIPE_CHECKOUT_URL}
                    includes={[
                      "1 High-Res Rendering (4k)",
                      "Environment Integration (Day/Dusk)",
                      "Landscape & Vegetation",
                      "Standard Material Library",
                      "2 Rounds of Revisions",
                      "24-Hour Turnaround"
                    ]}
                    process={[
                      { title: "Upload Assets", description: "Submit CAD plans, 3D models, photo references, sketches, images, and design inspirations." },
                      { title: "Material Setup", description: "We apply textures based on your moodboard or specs." },
                      { title: "Lighting Draft", description: "Review low-res lighting pass for approval." },
                      { title: "Final Delivery", description: "Receive high-fidelity output ready for print or web." }
                    ]}
                  />
                } />
                <Route path="/residential-interior" element={
                  <ServiceDetailPage 
                    price="750"
                    title="Residential Interior"
                    subtitle="Detailed interior staging focused on living spaces, furniture curation, and atmospheric lighting."
                    serviceName="residential-interior"
                    stripeCheckoutUrl={import.meta.env.VITE_STRIPE_CHECKOUT_URL}
                    includes={[
                      "1 High-Res Rendering (4k)",
                      "Custom Furniture Selection",
                      "Complex Lighting Setup",
                      "Soft Goods & Decor Details",
                      "3 Rounds of Revisions",
                      "48-Hour Turnaround"
                    ]}
                    process={[
                      { title: "Upload Assets", description: "Submit CAD plans, 3D models, photo references, sketches, images, and design inspirations." },
                      { title: "Furniture Selection", description: "Upload your furniture and finishes selection." },
                      { title: "Draft Review", description: "Check angles, textures, and lighting balance." },
                      { title: "Final Delivery", description: "Receive high-fidelity output ready for print or web." }
                    ]}
                  />
                } />
                <Route path="/residential-aerial" element={
                  <ServiceDetailPage 
                    price="850"
                    title="Residential Aerial"
                    subtitle="Drone-view perspective to establish neighborhood context, landscaping, and property boundaries."
                    serviceName="residential-aerial"
                    stripeCheckoutUrl={import.meta.env.VITE_STRIPE_CHECKOUT_URL}
                    includes={[
                      "1 Wide-Angle Aerial View",
                      "Full Site Modeling",
                      "Surrounding Context (Ghosted or Detailed)",
                      "Vegetation & Topography",
                      "3 Rounds of Revisions",
                      "3-Day Turnaround"
                    ]}
                    process={[
                      { title: "Upload Assets", description: "Submit CAD plans, 3D models, site plans, photo references, sketches, images, and aerial photos." },
                      { title: "Massing", description: "We establish the scale of the building vs the environment." },
                      { title: "Environment", description: "Adding trees, roads, cars, and neighboring structures." },
                      { title: "Final Delivery", description: "Receive high-fidelity output ready for print or web." }
                    ]}
                  />
                } />
                <Route path="/commercial-exterior" element={
                  <ServiceDetailPage 
                    price="850"
                    title="Commercial Exterior"
                    subtitle="Striking visuals for retail, office, and mixed-use developments focused on scale and branding."
                    serviceName="commercial-exterior"
                    stripeCheckoutUrl={import.meta.env.VITE_STRIPE_CHECKOUT_URL}
                    includes={[
                      "1 Hero Shot (Street Level)",
                      "Commercial Entourage (People/Cars)",
                      "Signage & Branding Integration",
                      "Glass & Facade Detailing",
                      "3 Rounds of Revisions",
                      "3-4 Day Turnaround"
                    ]}
                    process={[
                      { title: "Upload Assets", description: "Submit CAD plans, 3D models, photo references, sketches, images, and design inspirations." },
                      { title: "Brand Integration", description: "Placement of logos, signage, and brand colors." },
                      { title: "Life & Activity", description: "Populating the scene with shoppers, workers, and activity." }
                    ]}
                  />
                } />
                <Route path="/commercial-interior" element={
                  <ServiceDetailPage 
                    price="950"
                    title="Commercial Interior"
                    subtitle="Office, retail, and hospitality interiors that communicate flow, capacity, and atmosphere."
                    serviceName="commercial-interior"
                    stripeCheckoutUrl={import.meta.env.VITE_STRIPE_CHECKOUT_URL}
                    includes={[
                      "1 Perspective View",
                      "Office/Retail Furniture Systems",
                      "Advanced Lighting (Artificial)",
                      "Entourage (People working/shopping)",
                      "4 Rounds of Revisions",
                      "5 Day Turnaround"
                    ]}
                    process={[
                      { title: "Upload Assets", description: "Submit CAD plans, 3D models, photo references, sketches, images, and design inspirations." },
                      { title: "Furniture Selection", description: "Upload your furniture and finishes selection." },
                      { title: "Lighting Design", description: "IES profiles for accurate artificial lighting simulation." },
                      { title: "Final Delivery", description: "Receive high-fidelity output ready for print or web." }
                    ]}
                  />
                } />
                <Route path="/commercial-aerial" element={
                  <ServiceDetailPage 
                    price="950"
                    title="Commercial Aerial"
                    subtitle="Bird's eye perspective for office parks, retail centers, and mixed-use developments showcasing site planning and scale."
                    serviceName="commercial-aerial"
                    stripeCheckoutUrl={import.meta.env.VITE_STRIPE_CHECKOUT_URL}
                    includes={[
                      "1 Wide-Angle Campus View",
                      "Multi-Building Site Modeling",
                      "Parking & Infrastructure",
                      "Signage & Branding",
                      "4 Rounds of Revisions",
                      "5-Day Turnaround"
                    ]}
                    process={[
                      { title: "Upload Assets", description: "Submit CAD plans, 3D models, site plans, photo references, sketches, images, and aerial photos." },
                      { title: "Site Layout", description: "We model the campus, parking lots, and access roads." },
                      { title: "Context Building", description: "Adding surrounding buildings, vehicles, and landscaping." },
                      { title: "Final Delivery", description: "Receive high-fidelity output ready for print or web." }
                    ]}
                  />
                } />
                <Route path="/confirmation" element={<ConfirmationPage />} />
                <Route path="/inquiry-confirmation" element={<InquiryConfirmationPage />} />
              </Routes>
            </AppErrorBoundary>
	          
	          <Footer />
	        </div>
	      </div>
	    </Router>
  );
};

export default App;
