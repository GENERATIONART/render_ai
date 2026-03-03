import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/blog')
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load posts.');
        setLoading(false);
      });
  }, []);

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <section style={{
      animation: 'fadeIn 0.35s ease-out',
      width: '100vw',
      position: 'relative',
      left: '50%',
      right: '50%',
      marginLeft: '-50vw',
      marginRight: '-50vw',
      padding: '0',
      minHeight: '100vh'
    }}>
      {/* Hero banner */}
      <div style={{
        background: '#000',
        color: '#fff',
        padding: 'clamp(60px, 10vw, 120px) clamp(24px, 6vw, 80px) clamp(40px, 6vw, 80px)',
        marginBottom: '0'
      }}>
        <h1 style={{ fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.0, marginBottom: '16px' }}>
          Blog
        </h1>
        <p style={{ fontSize: 'clamp(16px, 2vw, 22px)', opacity: 0.6, lineHeight: 1.5, maxWidth: '600px' }}>
          Insights on architectural visualization, 3D rendering, and design.
        </p>
      </div>

      {/* Posts grid */}
      <div style={{ padding: 'clamp(24px, 4vw, 60px) clamp(24px, 6vw, 80px)' }}>
        {loading && (
          <p style={{ fontSize: '16px', opacity: 0.5 }}>Loading…</p>
        )}

        {error && (
          <p style={{ fontSize: '16px', color: '#FF4500' }}>{error}</p>
        )}

        {!loading && !error && posts.length === 0 && (
          <p style={{ fontSize: '18px', opacity: 0.6 }}>No posts yet. Check back soon.</p>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))',
          gap: '40px'
        }}>
          {!loading && !error && posts.map((post) => (
            <article key={post.id} style={{
              background: '#fff',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}>
              {post.cover_image && (
                <Link to={`/blog/${post.slug}`} style={{ display: 'block' }}>
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '16/9',
                      backgroundImage: `url('${post.cover_image}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                </Link>
              )}
              <div style={{ padding: '28px 24px 32px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.4, marginBottom: '12px' }}>
                  {formatDate(post.published_at)}
                </div>
                <Link
                  to={`/blog/${post.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '12px' }}>
                    {post.title}
                  </h2>
                </Link>
                {post.excerpt && (
                  <p style={{ fontSize: '15px', opacity: 0.65, lineHeight: 1.6, marginBottom: '20px' }}>
                    {post.excerpt}
                  </p>
                )}
                <Link
                  to={`/blog/${post.slug}`}
                  style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#FF4500', textDecoration: 'none' }}
                >
                  Read More →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogPage;
