import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import portfolioData from './portfolioData.js';
import { getSupabaseBrowser } from './lib/supabaseBrowser.js';
import { AdminPage } from './admin/AdminPage.jsx';
import PageMeta from './PageMeta.jsx';

const HomePage = React.lazy(() => import('./pages/HomePage.jsx'));
const AboutPage = React.lazy(() => import('./pages/AboutPage.jsx'));
const PortfolioPage = React.lazy(() => import('./pages/PortfolioPage.jsx'));
const PortfolioDetailPage = React.lazy(() => import('./pages/PortfolioDetailPage.jsx'));
const ServiceDetailPage = React.lazy(() => import('./pages/ServiceDetailPage.jsx'));
const CustomProjectPage = React.lazy(() => import('./pages/CustomProjectPage.jsx'));
const ConfirmationPage = React.lazy(() => import('./pages/ConfirmationPage.jsx'));
const InquiryConfirmationPage = React.lazy(() => import('./pages/InquiryConfirmationPage.jsx'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage.jsx'));
const BlogPage = React.lazy(() => import('./pages/BlogPage.jsx'));
const BlogPostPage = React.lazy(() => import('./pages/BlogPostPage.jsx'));

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




const Header = ({ compact = false }) => {
  const navigate = useNavigate();

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: compact ? '12px 0' : '20px 0',
      marginBottom: compact ? '24px' : '80px',
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
        <li><Link to="/blog" style={{ textDecoration: 'none', color: 'inherit' }}>Blog</Link></li>
      </ul>
    </nav>
  );
};

const Footer = () => (
  <footer data-footer style={{
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

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

const SERVICE_COPY_DEFAULTS = {
  'residential-exterior': {
    subtitle: 'Photorealistic visualization for single-family homes to showcase architectural intent and curb appeal.',
    includes: ['1 High-Res Rendering (4k)', 'Environment Integration (Day/Dusk)', 'Landscape & Vegetation', 'Standard Material Library', '2 Rounds of Revisions', '24-Hour Turnaround'],
    process: [
      { title: 'Upload Assets', description: 'Submit CAD plans, 3D models, photo references, sketches, images, and design inspirations.' },
      { title: 'Material Setup', description: 'We apply textures based on your moodboard or specs.' },
      { title: 'Lighting Draft', description: 'Review low-res lighting pass for approval.' },
      { title: 'Final Delivery', description: 'Receive high-fidelity output ready for print or web.' }
    ]
  },
  'residential-interior': {
    subtitle: 'Detailed interior staging focused on living spaces, furniture curation, and atmospheric lighting.',
    includes: ['1 High-Res Rendering (4k)', 'Custom Furniture Selection', 'Complex Lighting Setup', 'Soft Goods & Decor Details', '3 Rounds of Revisions', '48-Hour Turnaround'],
    process: [
      { title: 'Upload Assets', description: 'Submit CAD plans, 3D models, photo references, sketches, images, and design inspirations.' },
      { title: 'Furniture Selection', description: 'Upload your furniture and finishes selection.' },
      { title: 'Draft Review', description: 'Check angles, textures, and lighting balance.' },
      { title: 'Final Delivery', description: 'Receive high-fidelity output ready for print or web.' }
    ]
  },
  'residential-aerial': {
    subtitle: "Dramatic bird's eye perspective showcasing your home within its neighborhood context.",
    includes: ['1 Wide-Angle Aerial View', 'Full Site Modeling', 'Surrounding Context (Ghosted or Detailed)', 'Vegetation & Topography', '3 Rounds of Revisions', '3-Day Turnaround'],
    process: [
      { title: 'Upload Assets', description: 'Submit CAD plans, 3D models, site plans, photo references, sketches, images, and aerial photos.' },
      { title: 'Massing', description: 'We establish the scale of the building vs the environment.' },
      { title: 'Environment', description: 'Adding trees, roads, cars, and neighboring structures.' },
      { title: 'Final Delivery', description: 'Receive high-fidelity output ready for print or web.' }
    ]
  },
  'commercial-exterior': {
    subtitle: 'Striking visuals for retail, office, and mixed-use developments focused on scale and branding.',
    includes: ['1 Hero Shot (Street Level)', 'Commercial Entourage (People/Cars)', 'Signage & Branding Integration', 'Glass & Facade Detailing', '3 Rounds of Revisions', '3-4 Day Turnaround'],
    process: [
      { title: 'Upload Assets', description: 'Submit CAD plans, 3D models, photo references, sketches, images, and design inspirations.' },
      { title: 'Brand Integration', description: 'Placement of logos, signage, and brand colors.' },
      { title: 'Life & Activity', description: 'Populating the scene with shoppers, workers, and activity.' }
    ]
  },
  'commercial-interior': {
    subtitle: 'Office, retail, and hospitality interiors that communicate flow, capacity, and atmosphere.',
    includes: ['1 Perspective View', 'Office/Retail Furniture Systems', 'Advanced Lighting (Artificial)', 'Entourage (People working/shopping)', '4 Rounds of Revisions', '5 Day Turnaround'],
    process: [
      { title: 'Upload Assets', description: 'Submit CAD plans, 3D models, photo references, sketches, images, and design inspirations.' },
      { title: 'Furniture Selection', description: 'Upload your furniture and finishes selection.' },
      { title: 'Lighting Design', description: 'IES profiles for accurate artificial lighting simulation.' },
      { title: 'Final Delivery', description: 'Receive high-fidelity output ready for print or web.' }
    ]
  },
  'commercial-aerial': {
    subtitle: "Bird's eye perspective for office parks, retail centers, and mixed-use developments showcasing site planning and scale.",
    includes: ['1 Wide-Angle Campus View', 'Multi-Building Site Modeling', 'Parking & Infrastructure', 'Signage & Branding', '4 Rounds of Revisions', '5-Day Turnaround'],
    process: [
      { title: 'Upload Assets', description: 'Submit CAD plans, 3D models, site plans, photo references, sketches, images, and aerial photos.' },
      { title: 'Site Layout', description: 'We model the campus, parking lots, and access roads.' },
      { title: 'Context Building', description: 'Adding surrounding buildings, vehicles, and landscaping.' },
      { title: 'Final Delivery', description: 'Receive high-fidelity output ready for print or web.' }
    ]
  },
  '3d-model': {
    subtitle: 'Production-ready 3D models delivered in your preferred format — SKP, DWG, or 3DS — ready for any 3D software or workflow.',
    includes: ['1 Production-Ready 3D Model', 'Choice of Format: SKP, DWG, or 3DS', 'Clean Geometry & Layering', 'Material & Texture Mapping', '3 Rounds of Revisions', '5-Day Turnaround'],
    process: [
      { title: 'Upload Assets', description: 'Submit floor plans, sketches, reference images, CAD files, or any existing 3D files.' },
      { title: 'Geometry Build', description: 'We construct accurate 3D geometry based on your drawings and references.' },
      { title: 'Materials & Layers', description: 'Textures, materials, and layers are applied and organized for easy editing.' },
      { title: 'Format Export', description: 'Final model is exported in your chosen format (SKP, DWG, or 3DS) and delivered.' }
    ]
  }
};

const parseServiceList = (raw) => {
  if (!raw || !raw.trim()) return null;
  const lines = raw.split('\n').map(s => s.trim()).filter(Boolean);
  return lines.length > 0 ? lines : null;
};

const parseServiceSteps = (raw) => {
  if (!raw || !raw.trim()) return null;
  const steps = raw.split('\n').map(line => {
    const idx = line.indexOf('|');
    if (idx === -1) return { title: line.trim(), description: '' };
    return { title: line.slice(0, idx).trim(), description: line.slice(idx + 1).trim() };
  }).filter(s => s.title);
  return steps.length > 0 ? steps : null;
};

const AppFrame = ({ portfolioItems, siteCopy, servicePrices }) => {
  const { pathname } = useLocation();
  const isInquiry = pathname === '/inquiry-confirmation';
  const containerStyle = {
    ...customStyles.container,
    padding: isInquiry
      ? '20px clamp(16px, 4vw, 60px) 120px clamp(16px, 4vw, 60px)'
      : customStyles.container.padding
  };

  const getServiceContent = (key) => {
    const def = SERVICE_COPY_DEFAULTS[key] || {};
    return {
      subtitle: siteCopy[`service.${key}.subtitle`] || def.subtitle || '',
      includes: parseServiceList(siteCopy[`service.${key}.includes`]) || def.includes || [],
      process: parseServiceSteps(siteCopy[`service.${key}.process`]) || def.process || []
    };
  };

  return (
    <div style={customStyles.root} data-app="render-ai">
      <div style={containerStyle}>
        <Header compact={isInquiry} />
        
        <AppErrorBoundary>
          <React.Suspense fallback={null}>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <PageMeta
                    title="Render AI | Photorealistic Architectural Renderings & 3D Visualization"
                    description="Professional architectural rendering services based in New York. Residential & commercial exteriors, interiors, aerial views, and 3D models. Fast turnaround, photorealistic results."
                    canonical="/"
                    jsonLd={{
                      '@context': 'https://schema.org',
                      '@graph': [
                        {
                          '@type': 'LocalBusiness',
                          name: 'Render AI',
                          description: 'Professional architectural rendering and 3D visualization services based in New York.',
                          url: 'https://renderai.lol',
                          email: 'hello@renderai.lol',
                          address: { '@type': 'PostalAddress', addressLocality: 'New York', addressRegion: 'NY', addressCountry: 'US' },
                          priceRange: '$$',
                          hasOfferCatalog: {
                            '@type': 'OfferCatalog',
                            name: 'Architectural Rendering Services',
                            itemListElement: [
                              { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Residential Exterior Rendering' } },
                              { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Residential Interior Rendering' } },
                              { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Residential Aerial Rendering' } },
                              { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Commercial Exterior Rendering' } },
                              { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Commercial Interior Rendering' } },
                              { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Commercial Aerial Rendering' } },
                              { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '3D Modeling' } },
                            ]
                          }
                        },
                        {
                          '@type': 'WebSite',
                          name: 'Render AI',
                          url: 'https://renderai.lol',
                          potentialAction: {
                            '@type': 'SearchAction',
                            target: { '@type': 'EntryPoint', urlTemplate: 'https://renderai.lol/?q={search_term_string}' },
                            'query-input': 'required name=search_term_string'
                          }
                        },
                        {
                          '@type': 'FAQPage',
                          mainEntity: [
                            {
                              '@type': 'Question',
                              name: 'How long does a rendering take?',
                              acceptedAnswer: { '@type': 'Answer', text: 'Turnaround times vary by service: Residential Exterior renderings are delivered in 24 hours, Residential Interior in 48 hours, Aerial views in 3 days, and Commercial projects in 3–5 days depending on complexity.' }
                            },
                            {
                              '@type': 'Question',
                              name: 'What file formats do you accept?',
                              acceptedAnswer: { '@type': 'Answer', text: 'We accept a wide range of architectural file formats including CAD files (.dwg, .dxf), SketchUp (.skp), 3DS Max (.max, .3ds), Revit (.rvt), and standard image files such as PDFs, JPGs, or PNGs of floor plans and elevation drawings.' }
                            },
                            {
                              '@type': 'Question',
                              name: 'How much does an architectural rendering cost?',
                              acceptedAnswer: { '@type': 'Answer', text: 'Pricing starts at $500 for residential exterior renderings. Residential interiors start at $750, aerial views at $850, and commercial projects from $850–$950. Custom bundles combining multiple services are also available.' }
                            },
                            {
                              '@type': 'Question',
                              name: 'Do you work with residential and commercial projects?',
                              acceptedAnswer: { '@type': 'Answer', text: 'Yes. We provide rendering services for both residential projects (exteriors, interiors, aerial views) and commercial projects (offices, retail, mixed-use developments, campus views). We also offer 3D modeling and fully custom project bundles.' }
                            },
                            {
                              '@type': 'Question',
                              name: 'Where is Render AI located?',
                              acceptedAnswer: { '@type': 'Answer', text: 'Render AI is based in New York, NY. We work with architects, interior designers, builders, and real estate developers across the United States.' }
                            },
                          ]
                        }
                      ]
                    }}
                  />
                  <HomePage
                    servicePrices={servicePrices}
                    heroHeadline={siteCopy['home.hero_headline']}
                    heroSubheadline={siteCopy['home.hero_subheadline']}
                    contactHeadline={siteCopy['contact.headline']}
                    contactSubheadline={siteCopy['contact.subheadline']}
                  />
                </>
              }
            />
            <Route path="/admin" element={<AdminPage />} />
            <Route
              path="/about"
              element={
                <>
                  <PageMeta
                    title="About Render AI | Architectural Visualization Studio, New York"
                    description="Render AI is a multidisciplinary team of architects, interior designers, and technologists based in New York, dedicated to delivering world-class 3D visualization."
                    canonical="/about"
                    jsonLd={{
                      '@context': 'https://schema.org',
                      '@type': 'Organization',
                      name: 'Render AI',
                      url: 'https://renderai.lol',
                      email: 'hello@renderai.lol',
                      foundingLocation: 'New York, NY',
                      description: 'Multidisciplinary architectural visualization studio.',
                    }}
                  />
                  <AboutPage
                    aboutHeadline={siteCopy['about.headline']}
                    aboutHighlight={siteCopy['about.highlight']}
                    aboutBody={siteCopy['about.body']}
                    aboutSectors={siteCopy['about.sectors']}
                    aboutCapabilities={siteCopy['about.capabilities']}
                  />
                </>
              }
            />
            <Route path="/portfolio" element={
              <>
                <PageMeta
                  title="Portfolio | Photorealistic Architectural Renderings | Render AI"
                  description="Browse our portfolio of high-fidelity architectural renderings and 3D visualizations for residential and commercial projects."
                  canonical="/portfolio"
                />
                <PortfolioPage items={portfolioItems} />
              </>
            } />
            <Route path="/portfolio/:slug" element={<PortfolioDetailPage items={portfolioItems} />} />
            <Route path="/residential-exterior" element={
              <>
                <PageMeta
                  title="Residential Exterior Rendering | 24-Hour Turnaround | Render AI"
                  description="Photorealistic residential exterior 3D renderings with 24-hour turnaround. Perfect for architects, builders, and real estate developers. Starting from $500."
                  canonical="/residential-exterior"
                  jsonLd={{
                    '@context': 'https://schema.org',
                    '@graph': [
                      {
                        '@type': 'Service',
                        name: 'Residential Exterior Rendering',
                        provider: { '@type': 'LocalBusiness', name: 'Render AI', url: 'https://renderai.lol' },
                        description: 'Photorealistic residential exterior 3D renderings with 24-hour turnaround.',
                        url: 'https://renderai.lol/residential-exterior',
                        offers: { '@type': 'Offer', price: String(servicePrices['residential-exterior']), priceCurrency: 'USD' },
                        areaServed: { '@type': 'Country', name: 'United States' },
                      },
                      {
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://renderai.lol' },
                          { '@type': 'ListItem', position: 2, name: 'Residential Exterior Rendering', item: 'https://renderai.lol/residential-exterior' },
                        ]
                      }
                    ]
                  }}
                />
                <ServiceDetailPage
                  price={servicePrices['residential-exterior']}
                  title="Residential Exterior"
                  serviceName="residential-exterior"
                  {...getServiceContent('residential-exterior')}
                />
              </>
            } />
            <Route path="/residential-interior" element={
              <>
                <PageMeta
                  title="Residential Interior Rendering | 48-Hour Turnaround | Render AI"
                  description="High-fidelity residential interior 3D renderings with 48-hour turnaround. Perfect for interior designers, architects, and homeowners. Starting from $750."
                  canonical="/residential-interior"
                  jsonLd={{
                    '@context': 'https://schema.org',
                    '@graph': [
                      {
                        '@type': 'Service',
                        name: 'Residential Interior Rendering',
                        provider: { '@type': 'LocalBusiness', name: 'Render AI', url: 'https://renderai.lol' },
                        description: 'High-fidelity residential interior 3D renderings with 48-hour turnaround.',
                        url: 'https://renderai.lol/residential-interior',
                        offers: { '@type': 'Offer', price: String(servicePrices['residential-interior']), priceCurrency: 'USD' },
                        areaServed: { '@type': 'Country', name: 'United States' },
                      },
                      {
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://renderai.lol' },
                          { '@type': 'ListItem', position: 2, name: 'Residential Interior Rendering', item: 'https://renderai.lol/residential-interior' },
                        ]
                      }
                    ]
                  }}
                />
                <ServiceDetailPage
                  price={servicePrices['residential-interior']}
                  title="Residential Interior"
                  serviceName="residential-interior"
                  {...getServiceContent('residential-interior')}
                />
              </>
            } />
            <Route path="/residential-aerial" element={
              <>
                <PageMeta
                  title="Residential Aerial Rendering | Neighborhood Context Views | Render AI"
                  description="Stunning residential aerial 3D renderings showing neighborhood context and site overview. 3-day turnaround for architects and developers. Starting from $850."
                  canonical="/residential-aerial"
                  jsonLd={{
                    '@context': 'https://schema.org',
                    '@graph': [
                      {
                        '@type': 'Service',
                        name: 'Residential Aerial Rendering',
                        provider: { '@type': 'LocalBusiness', name: 'Render AI', url: 'https://renderai.lol' },
                        description: 'Stunning residential aerial 3D renderings with neighborhood context.',
                        url: 'https://renderai.lol/residential-aerial',
                        offers: { '@type': 'Offer', price: String(servicePrices['residential-aerial']), priceCurrency: 'USD' },
                        areaServed: { '@type': 'Country', name: 'United States' },
                      },
                      {
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://renderai.lol' },
                          { '@type': 'ListItem', position: 2, name: 'Residential Aerial Rendering', item: 'https://renderai.lol/residential-aerial' },
                        ]
                      }
                    ]
                  }}
                />
                <ServiceDetailPage
                  price={servicePrices['residential-aerial']}
                  title="Residential Aerial"
                  serviceName="residential-aerial"
                  {...getServiceContent('residential-aerial')}
                />
              </>
            } />
            <Route path="/commercial-exterior" element={
              <>
                <PageMeta
                  title="Commercial Exterior Rendering | Office & Retail Visualization | Render AI"
                  description="Photorealistic commercial exterior 3D renderings for offices, retail, and mixed-use developments. 3–4 day turnaround. Starting from $850."
                  canonical="/commercial-exterior"
                  jsonLd={{
                    '@context': 'https://schema.org',
                    '@graph': [
                      {
                        '@type': 'Service',
                        name: 'Commercial Exterior Rendering',
                        provider: { '@type': 'LocalBusiness', name: 'Render AI', url: 'https://renderai.lol' },
                        description: 'Photorealistic commercial exterior 3D renderings for office, retail and mixed-use projects.',
                        url: 'https://renderai.lol/commercial-exterior',
                        offers: { '@type': 'Offer', price: String(servicePrices['commercial-exterior']), priceCurrency: 'USD' },
                        areaServed: { '@type': 'Country', name: 'United States' },
                      },
                      {
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://renderai.lol' },
                          { '@type': 'ListItem', position: 2, name: 'Commercial Exterior Rendering', item: 'https://renderai.lol/commercial-exterior' },
                        ]
                      }
                    ]
                  }}
                />
                <ServiceDetailPage
                  price={servicePrices['commercial-exterior']}
                  title="Commercial Exterior"
                  serviceName="commercial-exterior"
                  {...getServiceContent('commercial-exterior')}
                />
              </>
            } />
            <Route path="/commercial-interior" element={
              <>
                <PageMeta
                  title="Commercial Interior Rendering | Office & Retail Spaces | Render AI"
                  description="High-fidelity commercial interior 3D renderings for offices, retail, and hospitality spaces. 5-day turnaround. Starting from $950."
                  canonical="/commercial-interior"
                  jsonLd={{
                    '@context': 'https://schema.org',
                    '@graph': [
                      {
                        '@type': 'Service',
                        name: 'Commercial Interior Rendering',
                        provider: { '@type': 'LocalBusiness', name: 'Render AI', url: 'https://renderai.lol' },
                        description: 'High-fidelity commercial interior 3D renderings for offices, retail and hospitality.',
                        url: 'https://renderai.lol/commercial-interior',
                        offers: { '@type': 'Offer', price: String(servicePrices['commercial-interior']), priceCurrency: 'USD' },
                        areaServed: { '@type': 'Country', name: 'United States' },
                      },
                      {
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://renderai.lol' },
                          { '@type': 'ListItem', position: 2, name: 'Commercial Interior Rendering', item: 'https://renderai.lol/commercial-interior' },
                        ]
                      }
                    ]
                  }}
                />
                <ServiceDetailPage
                  price={servicePrices['commercial-interior']}
                  title="Commercial Interior"
                  serviceName="commercial-interior"
                  {...getServiceContent('commercial-interior')}
                />
              </>
            } />
            <Route path="/commercial-aerial" element={
              <>
                <PageMeta
                  title="Commercial Aerial Rendering | Campus & Site Views | Render AI"
                  description="Striking commercial aerial 3D renderings showing full campus and site context. 5-day turnaround for developers and architects. Starting from $950."
                  canonical="/commercial-aerial"
                  jsonLd={{
                    '@context': 'https://schema.org',
                    '@graph': [
                      {
                        '@type': 'Service',
                        name: 'Commercial Aerial Rendering',
                        provider: { '@type': 'LocalBusiness', name: 'Render AI', url: 'https://renderai.lol' },
                        description: 'Commercial aerial 3D renderings showing campus views and site context.',
                        url: 'https://renderai.lol/commercial-aerial',
                        offers: { '@type': 'Offer', price: String(servicePrices['commercial-aerial']), priceCurrency: 'USD' },
                        areaServed: { '@type': 'Country', name: 'United States' },
                      },
                      {
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://renderai.lol' },
                          { '@type': 'ListItem', position: 2, name: 'Commercial Aerial Rendering', item: 'https://renderai.lol/commercial-aerial' },
                        ]
                      }
                    ]
                  }}
                />
                <ServiceDetailPage
                  price={servicePrices['commercial-aerial']}
                  title="Commercial Aerial"
                  serviceName="commercial-aerial"
                  {...getServiceContent('commercial-aerial')}
                />
              </>
            } />
            <Route path="/3d-model" element={
              <>
                <PageMeta
                  title="3D Modeling Services | SKP, DWG & 3DS Formats | Render AI"
                  description="Professional 3D modeling supporting SKP, DWG, and 3DS formats. 5-day turnaround for architects, designers, and developers. Starting from $1,200."
                  canonical="/3d-model"
                  jsonLd={{
                    '@context': 'https://schema.org',
                    '@graph': [
                      {
                        '@type': 'Service',
                        name: '3D Modeling',
                        provider: { '@type': 'LocalBusiness', name: 'Render AI', url: 'https://renderai.lol' },
                        description: 'Professional 3D modeling services supporting SKP, DWG, and 3DS formats.',
                        url: 'https://renderai.lol/3d-model',
                        offers: { '@type': 'Offer', price: String(servicePrices['3d-model']), priceCurrency: 'USD' },
                        areaServed: { '@type': 'Country', name: 'United States' },
                      },
                      {
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://renderai.lol' },
                          { '@type': 'ListItem', position: 2, name: '3D Modeling', item: 'https://renderai.lol/3d-model' },
                        ]
                      }
                    ]
                  }}
                />
                <ServiceDetailPage
                  price={servicePrices['3d-model']}
                  title="3D Model"
                  serviceName="3d-model"
                  {...getServiceContent('3d-model')}
                />
              </>
            } />
            <Route path="/custom" element={
              <>
                <PageMeta
                  title="Custom Architectural Rendering Packages | Mix & Match | Render AI"
                  description="Build a custom architectural visualization package by combining multiple rendering services. Mix and match to match your project scope and budget."
                  canonical="/custom"
                />
                <CustomProjectPage servicePrices={servicePrices} />
              </>
            } />
            <Route path="/blog" element={
              <>
                <PageMeta
                  title="Blog | Architectural Visualization Insights | Render AI"
                  description="Insights on architectural visualization, 3D rendering, design trends, and the art of bringing spaces to life before they're built."
                  canonical="/blog"
                />
                <BlogPage />
              </>
            } />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />
            <Route path="/inquiry-confirmation" element={<InquiryConfirmationPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </React.Suspense>
        </AppErrorBoundary>
        
        <Footer />
      </div>
    </div>
  );
};

const PRICE_DEFAULTS = {
  'residential-exterior': 500,
  'residential-interior': 750,
  'residential-aerial': 850,
  'commercial-exterior': 850,
  'commercial-interior': 950,
  'commercial-aerial': 950,
  '3d-model': 1200
};

const App = () => {
  const [portfolioItems, setPortfolioItems] = useState(portfolioData);
  const [siteCopy, setSiteCopy] = useState({});
  const [servicePrices, setServicePrices] = useState(PRICE_DEFAULTS);

  useEffect(() => {
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
        [data-portfolio-row] {
          grid-template-columns: 1fr !important;
          gap: 14px !important;
        }
        [data-portfolio-title] {
          font-size: 20px !important;
          letter-spacing: -0.005em !important;
        }
        [data-portfolio-meta] {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 6px 8px !important;
        }
        [data-portfolio-pill] {
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        [data-app] [style*="gridTemplateColumns: '100px 1fr auto'"] {
          grid-template-columns: 70px 1fr auto !important;
          gap: 12px !important;
        }
        [data-portfolio-cta] {
          justify-content: flex-end !important;
          text-align: right !important;
          white-space: normal !important;
        }
        [data-service-row] {
          padding: 22px 0 !important;
          grid-template-columns: 1fr !important;
          gap: 8px !important;
        }
        [data-service-price] {
          font-size: 22px !important;
        }
        [data-service-title] {
          font-size: 24px !important;
          line-height: 1.15 !important;
        }
        [data-service-title] span {
          display: block !important;
          margin-left: 0 !important;
          font-size: 13px !important;
        }
        [data-service-cta] {
          font-size: 16px !important;
          justify-content: flex-start !important;
        }
        [data-upload-box] {
          padding: 24px 16px !important;
        }
        [data-upload-icon] {
          font-size: 34px !important;
          margin-bottom: 10px !important;
        }
        [data-upload-item] {
          font-size: 12px !important;
          padding: 10px 12px !important;
        }
        [data-footer] {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 10px !important;
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
            'contact.subheadline',
            'service.price.residential-exterior',
            'service.price.residential-interior',
            'service.price.residential-aerial',
            'service.price.commercial-exterior',
            'service.price.commercial-interior',
            'service.price.commercial-aerial',
            'service.price.3d-model',
            'service.residential-exterior.subtitle',
            'service.residential-exterior.includes',
            'service.residential-exterior.process',
            'service.residential-interior.subtitle',
            'service.residential-interior.includes',
            'service.residential-interior.process',
            'service.residential-aerial.subtitle',
            'service.residential-aerial.includes',
            'service.residential-aerial.process',
            'service.commercial-exterior.subtitle',
            'service.commercial-exterior.includes',
            'service.commercial-exterior.process',
            'service.commercial-interior.subtitle',
            'service.commercial-interior.includes',
            'service.commercial-interior.process',
            'service.commercial-aerial.subtitle',
            'service.commercial-aerial.includes',
            'service.commercial-aerial.process',
            'service.3d-model.subtitle',
            'service.3d-model.includes',
            'service.3d-model.process'
          ]);
        if (error) {
          return;
        }
        const map = {};
        for (const row of data || []) {
          map[row.key] = row.value;
        }
        setSiteCopy(map);
        const prices = {};
        for (const [k, def] of Object.entries(PRICE_DEFAULTS)) {
          const raw = map[`service.price.${k}`];
          prices[k] = raw ? (parseFloat(raw) || def) : def;
        }
        setServicePrices(prices);
      } catch (error) {
        // ignore
      }
    };
    loadCopy();
  }, []);

	  return (
	    <Router basename="/">
	      <ScrollToTop />
	      <ScrollToHash />
	      <AppFrame portfolioItems={portfolioItems} siteCopy={siteCopy} servicePrices={servicePrices} />
	    </Router>
  );
};

export default App;
