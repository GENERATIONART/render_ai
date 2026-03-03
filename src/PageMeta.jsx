import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://renderai.lol';
const OG_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_TITLE = 'Render AI | Photorealistic Architectural Renderings & 3D Visualization';
const DEFAULT_DESCRIPTION =
  'Professional architectural rendering services based in New York. Residential & commercial exteriors, interiors, aerial views, and 3D models. Fast turnaround, photorealistic results.';

export default function PageMeta({ title, description, canonical, jsonLd }) {
  const metaTitle = title || DEFAULT_TITLE;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL;

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Render AI" />
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={OG_IMAGE} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
