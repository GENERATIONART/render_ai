import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const BlogPostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`/api/blog/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setPost(data.post || null);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return <p style={{ fontSize: '16px', opacity: 0.5, animation: 'fadeIn 0.35s ease-out' }}>Loading…</p>;
  }

  if (notFound || !post) {
    return (
      <section style={{ animation: 'fadeIn 0.35s ease-out' }}>
        <div
          onClick={() => navigate('/blog')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '24px', opacity: 0.6, cursor: 'pointer' }}
        >
          ← Back to Blog
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, lineHeight: 1.2, marginBottom: '16px' }}>
          Post Not Found
        </h2>
        <p style={{ fontSize: '18px', opacity: 0.7 }}>This post doesn't exist or has been removed.</p>
      </section>
    );
  }

  const paragraphs = (post.content || '').split(/\n\n+/).filter(Boolean);

  return (
    <>
      <Helmet>
        <title>{post.title} | Render AI Blog</title>
        <meta name="description" content={post.excerpt || `${post.title} — Render AI Blog`} />
        <link rel="canonical" href={`https://renderai.lol/blog/${post.slug}`} />
        <meta property="og:title" content={`${post.title} | Render AI Blog`} />
        <meta property="og:description" content={post.excerpt || post.title} />
        {post.cover_image && <meta property="og:image" content={post.cover_image} />}
        <meta property="og:url" content={`https://renderai.lol/blog/${post.slug}`} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt || '',
          datePublished: post.published_at || post.created_at,
          dateModified: post.updated_at || post.created_at,
          author: { '@type': 'Organization', name: 'Render AI', url: 'https://renderai.lol' },
          publisher: { '@type': 'Organization', name: 'Render AI', url: 'https://renderai.lol' },
          url: `https://renderai.lol/blog/${post.slug}`,
          ...(post.cover_image ? { image: post.cover_image } : {})
        })}</script>
      </Helmet>

      <article style={{ maxWidth: '720px', animation: 'fadeIn 0.35s ease-out' }}>
        <div
          onClick={() => navigate('/blog')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '32px', opacity: 0.6, cursor: 'pointer' }}
        >
          ← Back to Blog
        </div>

        <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.5, marginBottom: '16px' }}>
          {formatDate(post.published_at)}
        </div>

        <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '24px' }}>
          {post.title}
        </h1>

        {post.excerpt && (
          <p style={{ fontSize: '20px', lineHeight: 1.5, opacity: 0.6, marginBottom: '32px' }}>
            {post.excerpt}
          </p>
        )}

        <hr style={{ width: '100%', height: '2px', backgroundColor: '#000000', border: 'none', marginBottom: '36px' }} />

        {post.cover_image && (
          <div
            style={{
              width: '100%',
              aspectRatio: '16/9',
              backgroundImage: `url('${post.cover_image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              marginBottom: '40px'
            }}
          />
        )}

        <div style={{ fontSize: '18px', lineHeight: 1.8, opacity: 0.85 }}>
          {paragraphs.map((para, i) => (
            <p key={i} style={{ marginBottom: '24px' }}>{para}</p>
          ))}
        </div>
      </article>
    </>
  );
};

export default BlogPostPage;
