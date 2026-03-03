import React, { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowser } from '../lib/supabaseBrowser.js';

const inputStyle = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid #000000',
  padding: '12px 0',
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  fontSize: '18px',
  color: '#000000',
  borderRadius: 0,
  outline: 'none'
};

const labelStyle = {
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontWeight: 800,
  opacity: 0.7,
  marginBottom: 10
};

const buttonStyle = {
  background: '#000000',
  color: '#F4F4F4',
  border: '2px solid #000000',
  padding: '12px 16px',
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  fontSize: '14px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  cursor: 'pointer'
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: 'transparent',
  color: '#000000'
};

const Section = ({ title, subtitle, children, right }) => (
  <section style={{ marginBottom: 56, animation: 'fadeIn 0.35s ease-out' }}>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ fontWeight: 900, fontSize: '28px', textTransform: 'uppercase', letterSpacing: '-0.04em', marginBottom: 8 }}>
          {title}
        </h2>
        {subtitle ? <p style={{ fontSize: 16, opacity: 0.7, lineHeight: 1.4 }}>{subtitle}</p> : null}
      </div>
      {right || null}
    </div>
    <hr style={{ width: '100%', height: 2, backgroundColor: '#000000', margin: '20px 0', border: 'none' }} />
    {children}
  </section>
);

const JsonListEditor = ({ label, value, onChange, placeholder }) => (
  <div style={{ marginTop: 16 }}>
    <div style={labelStyle}>{label}</div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      style={{
        width: '100%',
        border: '2px solid #000000',
        padding: 12,
        fontSize: 14,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        background: 'transparent',
        outline: 'none',
        resize: 'vertical'
      }}
    />
    <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>One per line.</div>
  </div>
);

const TimelineEditor = ({ value, onChange }) => (
  <div style={{ marginTop: 16 }}>
    <div style={labelStyle}>Timeline</div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={'Step 1 title | step 1 description\nStep 2 title | step 2 description'}
      rows={5}
      style={{
        width: '100%',
        border: '2px solid #000000',
        padding: 12,
        fontSize: 14,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        background: 'transparent',
        outline: 'none',
        resize: 'vertical'
      }}
    />
    <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>Format: `title | description` (one per line).</div>
  </div>
);

const listToText = (value) => (Array.isArray(value) ? value.map((item) => String(item ?? '')).join('\n') : '');

const timelineToText = (value) => {
  if (!Array.isArray(value)) return '';
  return value
    .map((step) => {
      const title = String(step?.title || '').trim();
      const description = String(step?.description || '').trim();
      if (title && description) return `${title} | ${description}`;
      if (title) return title;
      if (description) return `| ${description}`;
      return '';
    })
    .filter((line) => line.length > 0)
    .join('\n');
};

const parseList = (text) =>
  String(text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const parseTimeline = (text) =>
  String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      if (!line.includes('|')) {
        return { title: line.trim(), description: '' };
      }
      const [title, ...rest] = line.split('|');
      return { title: (title || '').trim(), description: rest.join('|').trim() };
    })
    .filter((s) => s.title || s.description);

const createSupabaseBrowserSafe = () => {
  try {
    return { client: getSupabaseBrowser(), error: '' };
  } catch (e) {
    return { client: null, error: e?.message || 'Supabase browser client is not configured.' };
  }
};

const PortfolioEditor = () => {
  const { client: supabase, error: supabaseError } = useMemo(() => createSupabaseBrowserSafe(), []);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/portfolio');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Failed to load (${res.status})`);
      }
      setItems(data.items || []);
    } catch (e) {
      setError(e?.message || 'Failed to load');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    setEditing({
      id: null,
      published: true,
      sort_order: 0,
      slug: '',
      title: '',
      tag: '',
      location: '',
      render_time: '',
      image_url: '',
      brief: '',
      scope: '',
      deliverables: [],
      tools: [],
      timeline: [],
      deliverablesText: '',
      toolsText: '',
      timelineText: '',
      imagesText: ''
    });
  };

  const save = async () => {
    if (!editing) return;
    setError('');
    const images = parseList(editing.imagesText);
    const coverImage = (editing.image_url || '').trim() || (images[0] || null);
    const row = {
      id: editing.id,
      published: !!editing.published,
      sort_order: Number.isFinite(Number(editing.sort_order)) ? Number(editing.sort_order) : 0,
      slug: (editing.slug || '').trim(),
      title: (editing.title || '').trim(),
      tag: (editing.tag || '').trim() || null,
      location: (editing.location || '').trim() || null,
      render_time: (editing.render_time || '').trim() || null,
      image_url: coverImage,
      images,
      brief: (editing.brief || '').trim() || null,
      scope: (editing.scope || '').trim() || null,
      deliverables: parseList(editing.deliverablesText),
      tools: parseList(editing.toolsText),
      timeline: parseTimeline(editing.timelineText),
      updated_at: new Date().toISOString()
    };
    if (!row.slug || !row.title) {
      setError('Slug and title are required.');
      return;
    }

    try {
      const response = await fetch('/api/admin/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || `Save failed (${response.status})`);
      }
    } catch (e) {
      setError(e?.message || 'Save failed');
      return;
    }
    setEditing(null);
    await load();
  };

  const remove = async (id) => {
    const ok = window.confirm('Delete this portfolio item?');
    if (!ok) return;
    try {
      const response = await fetch(`/api/admin/portfolio/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || `Delete failed (${response.status})`);
      }
    } catch (e) {
      setError(e?.message || 'Delete failed');
      return;
    }
    await load();
  };

  const uploadImages = async (files) => {
    const uploads = Array.isArray(files) ? files.filter(Boolean) : [];
    if (uploads.length === 0) return;
    setUploading(true);
    setError('');
    try {
      if (!supabase) {
        throw new Error(supabaseError || 'Supabase browser client is not configured.');
      }
      const uploadedUrls = [];
      for (const file of uploads) {
        const signRes = await fetch('/api/admin/site-media/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ originalName: file.name })
        });
        const signData = await signRes.json().catch(() => ({}));
        if (!signRes.ok) {
          throw new Error(signData?.error || `Failed to prepare upload (${signRes.status})`);
        }

        const upload = signData.upload;
        const { data, error } = await supabase.storage
          .from(upload.bucket)
          .uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type || 'application/octet-stream' });
        if (error) {
          throw new Error(error.message);
        }
        const publicPath = data?.path || upload.path;
        const { data: urlData } = supabase.storage.from(upload.bucket).getPublicUrl(publicPath);
        const url = urlData?.publicUrl;
        if (url) uploadedUrls.push(url);
      }

      if (uploadedUrls.length > 0) {
        setEditing((prev) => {
          if (!prev) return prev;
          const existing = parseList(prev.imagesText || '');
          const merged = [...existing, ...uploadedUrls].filter(Boolean);
          const imagesText = merged.join('\n');
          const cover = (prev.image_url || '').trim() || merged[0] || '';
          return { ...prev, imagesText, image_url: cover };
        });
      }
    } catch (e) {
      setError(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {!!supabaseError && (
        <p style={{ color: '#FF4500', marginTop: 12 }}>
          {supabaseError} Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`, then restart the frontend to enable media uploads.
        </p>
      )}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, opacity: 0.7 }}>
          {loading ? 'Loading…' : `${items.length} item(s)`}
        </div>
        <button type="button" style={buttonStyle} onClick={startNew}>
          New Item
        </button>
      </div>

      {!!error && <p style={{ color: '#FF4500', marginTop: 16 }}>{error}</p>}

      {editing ? (
        <div style={{ marginTop: 20, border: '2px solid #000000', padding: 18 }}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, opacity: 0.8 }}>
              {editing.id ? 'Edit Item' : 'New Item'}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" style={secondaryButtonStyle} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" style={buttonStyle} onClick={save}>
                Save
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }}>
            <div>
              <div style={labelStyle}>Slug</div>
              <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Published</div>
              <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={!!editing.published}
                  onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                />
                Visible on site
              </label>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle}>Title</div>
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} style={inputStyle} />
            </div>

            <div>
              <div style={labelStyle}>Tag</div>
              <input value={editing.tag || ''} onChange={(e) => setEditing({ ...editing, tag: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Render Time</div>
              <input
                value={editing.render_time || ''}
                onChange={(e) => setEditing({ ...editing, render_time: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <div style={labelStyle}>Location</div>
              <input
                value={editing.location || ''}
                onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <div style={labelStyle}>Sort Order</div>
              <input
                type="number"
                value={editing.sort_order}
                onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={labelStyle}>Image</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                value={editing.image_url || ''}
                onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                placeholder="https://…"
                style={{ ...inputStyle, maxWidth: 720 }}
              />
              <label style={{ ...secondaryButtonStyle, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => uploadImages([...(e.target.files || [])])}
                  disabled={uploading}
                />
                {uploading ? 'Uploading…' : 'Upload'}
              </label>
            </div>
            {editing.image_url ? (
              <div style={{ marginTop: 12, border: '2px solid #000000', width: '100%', maxWidth: 860 }}>
                <div
                  style={{
                    aspectRatio: '16/9',
                    backgroundImage: `url('${editing.image_url}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
              </div>
            ) : null}
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={labelStyle}>Gallery Images (Carousel)</div>
            <textarea
              value={editing.imagesText || ''}
              onChange={(e) => setEditing({ ...editing, imagesText: e.target.value })}
              placeholder={'https://...\nhttps://...'}
              rows={4}
              style={{
                width: '100%',
                border: '2px solid #000000',
                padding: 12,
                fontSize: 14,
                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                background: 'transparent',
                outline: 'none',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
              <label style={{ ...secondaryButtonStyle, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => uploadImages([...(e.target.files || [])])}
                  disabled={uploading}
                />
                {uploading ? 'Uploading…' : 'Upload Gallery'}
              </label>
              <span style={{ fontSize: 12, opacity: 0.6 }}>One URL per line. Used for the carousel.</span>
            </div>
            {parseList(editing.imagesText || '').length > 0 ? (
              <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                {parseList(editing.imagesText || '').map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIndex === null || dragIndex === index) return;
                      const list = parseList(editing.imagesText || '');
                      const [moved] = list.splice(dragIndex, 1);
                      list.splice(index, 0, moved);
                      setEditing({ ...editing, imagesText: list.join('\n') });
                      setDragIndex(null);
                    }}
                    onDragEnd={() => setDragIndex(null)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 1fr auto',
                      gap: 12,
                      alignItems: 'center',
                      border: '1px solid #000000',
                      padding: 10,
                      background: dragIndex === index ? 'rgba(0,0,0,0.04)' : 'transparent'
                    }}
                  >
                    <div
                      style={{
                        border: '1px solid #000000',
                        aspectRatio: '4/3',
                        backgroundImage: `url('${url}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div style={{ fontSize: 12, wordBreak: 'break-all', opacity: 0.8 }}>
                      {url}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        style={{ ...secondaryButtonStyle, padding: '6px 10px' }}
                        onClick={() => {
                          const list = parseList(editing.imagesText || '');
                          list.splice(index, 1);
                          setEditing({ ...editing, imagesText: list.join('\n') });
                        }}
                      >
                        Delete
                      </button>
                      <span style={{ fontSize: 11, opacity: 0.5, alignSelf: 'center' }}>Drag to reorder</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={labelStyle}>Brief</div>
            <textarea
              value={editing.brief || ''}
              onChange={(e) => setEditing({ ...editing, brief: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                border: '2px solid #000000',
                padding: 12,
                fontSize: 14,
                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                background: 'transparent',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={labelStyle}>Scope</div>
            <textarea
              value={editing.scope || ''}
              onChange={(e) => setEditing({ ...editing, scope: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                border: '2px solid #000000',
                padding: 12,
                fontSize: 14,
                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                background: 'transparent',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <JsonListEditor
            label="Deliverables"
            value={editing.deliverablesText || ''}
            onChange={(deliverablesText) => setEditing({ ...editing, deliverablesText })}
            placeholder={'Hero render (4K)\nTwilight variant\nMaterial pass'}
          />
          <JsonListEditor
            label="Tools"
            value={editing.toolsText || ''}
            onChange={(toolsText) => setEditing({ ...editing, toolsText })}
            placeholder={'Rhino\nV-Ray\nPhotoshop'}
          />
          <TimelineEditor
            value={editing.timelineText || ''}
            onChange={(timelineText) => setEditing({ ...editing, timelineText })}
          />
        </div>
      ) : null}

      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              border: '2px solid #000000',
              padding: 16,
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 12,
              alignItems: 'center'
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.7 }}>
                {item.published ? 'Published' : 'Draft'} • {item.slug}
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.title}
              </div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
                {item.tag || ''}{item.location ? ` • ${item.location}` : ''}{item.render_time ? ` • ${item.render_time}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() =>
                  setEditing({
                    ...item,
                    deliverablesText: listToText(item.deliverables),
                    toolsText: listToText(item.tools),
                    timelineText: timelineToText(item.timeline),
                    imagesText: listToText(Array.isArray(item.images) && item.images.length > 0 ? item.images : (item.image_url ? [item.image_url] : []))
                  })
                }
              >
                Edit
              </button>
              <button type="button" style={{ ...secondaryButtonStyle, borderColor: '#FF4500', color: '#FF4500' }} onClick={() => remove(item.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SiteCopyEditor = () => {
  const [heroHeadline, setHeroHeadline] = useState('');
  const [heroSubheadline, setHeroSubheadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setError('');
    try {
      const res = await fetch('/api/admin/site-copy?keys=home.hero_headline,home.hero_subheadline');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Failed to load (${res.status})`);
      }
      const map = new Map((data.rows || []).map((row) => [row.key, row.value]));
      setHeroHeadline(map.get('home.hero_headline') || '');
      setHeroSubheadline(map.get('home.hero_subheadline') || '');
    } catch (e) {
      setError(e?.message || 'Failed to load');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    const rows = [
      { key: 'home.hero_headline', value: heroHeadline || '' },
      { key: 'home.hero_subheadline', value: heroSubheadline || '' }
    ];
    try {
      const res = await fetch('/api/admin/site-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Save failed (${res.status})`);
      }
    } catch (e) {
      setError(e?.message || 'Save failed');
      setSaving(false);
      return;
    }
    setSaved(true);
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 900 }}>
      {!!error && <p style={{ color: '#FF4500', marginTop: 16 }}>{error}</p>}
      <div style={{ marginTop: 6 }}>
        <div style={labelStyle}>Homepage headline</div>
        <textarea
          value={heroHeadline}
          onChange={(e) => setHeroHeadline(e.target.value)}
          rows={2}
          placeholder="Architecture visualized / instantly."
          style={{
            width: '100%',
            border: '2px solid #000000',
            padding: 12,
            fontSize: 16,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            background: 'transparent',
            outline: 'none',
            resize: 'vertical'
          }}
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={labelStyle}>Homepage subheadline</div>
        <textarea
          value={heroSubheadline}
          onChange={(e) => setHeroSubheadline(e.target.value)}
          rows={3}
          placeholder="High fidelity renderings… starting at $500."
          style={{
            width: '100%',
            border: '2px solid #000000',
            padding: 12,
            fontSize: 16,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            background: 'transparent',
            outline: 'none',
            resize: 'vertical'
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 18 }}>
        <button type="button" style={buttonStyle} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved ? <span style={{ fontSize: 14, opacity: 0.7 }}>Saved.</span> : null}
      </div>
    </div>
  );
};

const AboutEditor = () => {
  const [aboutHeadline, setAboutHeadline] = useState('');
  const [aboutHighlight, setAboutHighlight] = useState('');
  const [aboutBody, setAboutBody] = useState('');
  const [aboutSectors, setAboutSectors] = useState('');
  const [aboutCapabilities, setAboutCapabilities] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setError('');
    try {
      const res = await fetch('/api/admin/site-copy?keys=about.headline,about.highlight,about.body,about.sectors,about.capabilities');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Failed to load (${res.status})`);
      }
      const map = new Map((data.rows || []).map((row) => [row.key, row.value]));
      setAboutHeadline(map.get('about.headline') || '');
      setAboutHighlight(map.get('about.highlight') || '');
      setAboutBody(map.get('about.body') || '');
      setAboutSectors(map.get('about.sectors') || '');
      setAboutCapabilities(map.get('about.capabilities') || '');
    } catch (e) {
      setError(e?.message || 'Failed to load');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    const rows = [
      { key: 'about.headline', value: aboutHeadline || '' },
      { key: 'about.highlight', value: aboutHighlight || '' },
      { key: 'about.body', value: aboutBody || '' },
      { key: 'about.sectors', value: aboutSectors || '' },
      { key: 'about.capabilities', value: aboutCapabilities || '' }
    ];
    try {
      const res = await fetch('/api/admin/site-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Save failed (${res.status})`);
      }
    } catch (e) {
      setError(e?.message || 'Save failed');
      setSaving(false);
      return;
    }
    setSaved(true);
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 900 }}>
      {!!error && <p style={{ color: '#FF4500', marginTop: 16 }}>{error}</p>}
      <div style={{ marginTop: 6 }}>
        <div style={labelStyle}>About headline</div>
        <input
          value={aboutHeadline}
          onChange={(e) => setAboutHeadline(e.target.value)}
          placeholder="Who We Are /"
          style={inputStyle}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={labelStyle}>About highlight</div>
        <input
          value={aboutHighlight}
          onChange={(e) => setAboutHighlight(e.target.value)}
          placeholder="About"
          style={inputStyle}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={labelStyle}>About body (paragraphs)</div>
        <textarea
          value={aboutBody}
          onChange={(e) => setAboutBody(e.target.value)}
          rows={6}
          placeholder={'Paragraph one...\n\nParagraph two...'}
          style={{
            width: '100%',
            border: '2px solid #000000',
            padding: 12,
            fontSize: 16,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            background: 'transparent',
            outline: 'none',
            resize: 'vertical'
          }}
        />
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>Use a blank line between paragraphs.</div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={labelStyle}>Sectors (one per line)</div>
        <textarea
          value={aboutSectors}
          onChange={(e) => setAboutSectors(e.target.value)}
          rows={4}
          placeholder={'Residential Architecture\nCommercial Real Estate\nInterior Design Studios'}
          style={{
            width: '100%',
            border: '2px solid #000000',
            padding: 12,
            fontSize: 16,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            background: 'transparent',
            outline: 'none',
            resize: 'vertical'
          }}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={labelStyle}>Capabilities (one per line)</div>
        <textarea
          value={aboutCapabilities}
          onChange={(e) => setAboutCapabilities(e.target.value)}
          rows={4}
          placeholder={'Photorealistic Rendering\nMaterial & Lighting Simulation\nSite Context Integration'}
          style={{
            width: '100%',
            border: '2px solid #000000',
            padding: 12,
            fontSize: 16,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            background: 'transparent',
            outline: 'none',
            resize: 'vertical'
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 18 }}>
        <button type="button" style={buttonStyle} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved ? <span style={{ fontSize: 14, opacity: 0.7 }}>Saved.</span> : null}
      </div>
    </div>
  );
};

const ContactEditor = () => {
  const [contactHeadline, setContactHeadline] = useState('');
  const [contactSubheadline, setContactSubheadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setError('');
    try {
      const res = await fetch('/api/admin/site-copy?keys=contact.headline,contact.subheadline');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Failed to load (${res.status})`);
      }
      const map = new Map((data.rows || []).map((row) => [row.key, row.value]));
      setContactHeadline(map.get('contact.headline') || '');
      setContactSubheadline(map.get('contact.subheadline') || '');
    } catch (e) {
      setError(e?.message || 'Failed to load');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    const rows = [
      { key: 'contact.headline', value: contactHeadline || '' },
      { key: 'contact.subheadline', value: contactSubheadline || '' }
    ];
    try {
      const res = await fetch('/api/admin/site-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Save failed (${res.status})`);
      }
    } catch (e) {
      setError(e?.message || 'Save failed');
      setSaving(false);
      return;
    }
    setSaved(true);
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 900 }}>
      {!!error && <p style={{ color: '#FF4500', marginTop: 16 }}>{error}</p>}
      <div style={{ marginTop: 6 }}>
        <div style={labelStyle}>Contact headline</div>
        <input
          value={contactHeadline}
          onChange={(e) => setContactHeadline(e.target.value)}
          placeholder="PROJECT / INQUIRY"
          style={inputStyle}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={labelStyle}>Contact subheadline</div>
        <textarea
          value={contactSubheadline}
          onChange={(e) => setContactSubheadline(e.target.value)}
          rows={2}
          placeholder="Short line under the headline (optional)"
          style={{
            width: '100%',
            border: '2px solid #000000',
            padding: 12,
            fontSize: 16,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            background: 'transparent',
            outline: 'none',
            resize: 'vertical'
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 18 }}>
        <button type="button" style={buttonStyle} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved ? <span style={{ fontSize: 14, opacity: 0.7 }}>Saved.</span> : null}
      </div>
    </div>
  );
};

const SERVICE_PAGE_OPTIONS = [
  { key: 'residential-exterior', label: 'Residential Exterior' },
  { key: 'residential-interior', label: 'Residential Interior' },
  { key: 'residential-aerial', label: 'Residential Aerial' },
  { key: 'commercial-exterior', label: 'Commercial Exterior' },
  { key: 'commercial-interior', label: 'Commercial Interior' },
  { key: 'commercial-aerial', label: 'Commercial Aerial' },
  { key: '3d-model', label: '3D Model' }
];

const ServicePagesEditor = () => {
  const [selectedKey, setSelectedKey] = useState('residential-exterior');
  const [subtitle, setSubtitle] = useState('');
  const [includes, setIncludes] = useState('');
  const [process, setProcess] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = async (key) => {
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/site-copy?keys=service.${key}.subtitle,service.${key}.includes,service.${key}.process`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Failed to load (${res.status})`);
      const map = new Map((data.rows || []).map((row) => [row.key, row.value]));
      setSubtitle(map.get(`service.${key}.subtitle`) || '');
      setIncludes(map.get(`service.${key}.includes`) || '');
      setProcess(map.get(`service.${key}.process`) || '');
    } catch (e) {
      setError(e?.message || 'Failed to load');
    }
  };

  useEffect(() => { load(selectedKey); }, [selectedKey]);

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    const rows = [
      { key: `service.${selectedKey}.subtitle`, value: subtitle || '' },
      { key: `service.${selectedKey}.includes`, value: includes || '' },
      { key: `service.${selectedKey}.process`, value: process || '' }
    ];
    try {
      const res = await fetch('/api/admin/site-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Save failed (${res.status})`);
    } catch (e) {
      setError(e?.message || 'Save failed');
      setSaving(false);
      return;
    }
    setSaved(true);
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {SERVICE_PAGE_OPTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSelectedKey(s.key)}
            style={{
              ...secondaryButtonStyle,
              background: selectedKey === s.key ? '#000000' : 'transparent',
              color: selectedKey === s.key ? '#F4F4F4' : '#000000',
              fontSize: '12px',
              padding: '8px 12px'
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      {!!error && <p style={{ color: '#FF4500', marginBottom: 16 }}>{error}</p>}
      <div style={{ marginTop: 6 }}>
        <div style={labelStyle}>Subtitle (shown under the title)</div>
        <textarea
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          rows={3}
          placeholder="A short description of this service…"
          style={{ width: '100%', border: '2px solid #000000', padding: 12, fontSize: 16, fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", background: 'transparent', outline: 'none', resize: 'vertical' }}
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={labelStyle}>What's Included (one item per line)</div>
        <textarea
          value={includes}
          onChange={(e) => setIncludes(e.target.value)}
          rows={7}
          placeholder={'1 High-Res Rendering (4k)\nEnvironment Integration\n2 Rounds of Revisions\n24-Hour Turnaround'}
          style={{ width: '100%', border: '2px solid #000000', padding: 12, fontSize: 14, fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", background: 'transparent', outline: 'none', resize: 'vertical' }}
        />
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>One bullet point per line.</div>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={labelStyle}>The Process (one step per line, format: title | description)</div>
        <textarea
          value={process}
          onChange={(e) => setProcess(e.target.value)}
          rows={5}
          placeholder={'Upload Assets | Submit CAD plans, references, and inspiration.\nDraft Review | Review the lighting and material pass.\nFinal Delivery | Receive the high-fidelity output.'}
          style={{ width: '100%', border: '2px solid #000000', padding: 12, fontSize: 14, fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", background: 'transparent', outline: 'none', resize: 'vertical' }}
        />
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>Format: <code>Step Title | Step description</code> (one per line).</div>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 18 }}>
        <button type="button" style={buttonStyle} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved ? <span style={{ fontSize: 14, opacity: 0.7 }}>Saved.</span> : null}
      </div>
    </div>
  );
};

const SERVICES = [
  { key: 'residential-exterior', label: 'Residential Exterior', defaultPrice: 500 },
  { key: 'residential-interior', label: 'Residential Interior', defaultPrice: 750 },
  { key: 'residential-aerial', label: 'Residential Aerial', defaultPrice: 850 },
  { key: 'commercial-exterior', label: 'Commercial Exterior', defaultPrice: 850 },
  { key: 'commercial-interior', label: 'Commercial Interior', defaultPrice: 950 },
  { key: 'commercial-aerial', label: 'Commercial Aerial', defaultPrice: 950 },
  { key: '3d-model', label: '3D Model', defaultPrice: 1200 }
];

const PricingEditor = () => {
  const [prices, setPrices] = useState(() =>
    Object.fromEntries(SERVICES.map((s) => [s.key, String(s.defaultPrice)]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setError('');
    try {
      const keys = SERVICES.map((s) => `service.price.${s.key}`).join(',');
      const res = await fetch(`/api/admin/site-copy?keys=${keys}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Failed to load (${res.status})`);
      const map = new Map((data.rows || []).map((row) => [row.key, row.value]));
      setPrices((prev) => {
        const next = { ...prev };
        for (const s of SERVICES) {
          const val = map.get(`service.price.${s.key}`);
          if (val !== undefined) next[s.key] = val;
        }
        return next;
      });
    } catch (e) {
      setError(e?.message || 'Failed to load');
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    const rows = SERVICES.map((s) => ({
      key: `service.price.${s.key}`,
      value: String(parseFloat(prices[s.key]) || s.defaultPrice)
    }));
    try {
      const res = await fetch('/api/admin/site-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Save failed (${res.status})`);
    } catch (e) {
      setError(e?.message || 'Save failed');
      setSaving(false);
      return;
    }
    setSaved(true);
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 560 }}>
      {!!error && <p style={{ color: '#FF4500', marginBottom: 16 }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {SERVICES.map((s) => (
          <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 24, borderBottom: '1px solid rgba(0,0,0,0.1)', padding: '14px 0' }}>
            <div style={labelStyle}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 500 }}>$</span>
              <input
                type="number"
                min="0"
                step="1"
                value={prices[s.key]}
                onChange={(e) => setPrices((prev) => ({ ...prev, [s.key]: e.target.value }))}
                style={{ ...inputStyle, width: 100, textAlign: 'right' }}
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 20 }}>
        <button type="button" style={buttonStyle} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved ? <span style={{ fontSize: 14, opacity: 0.7 }}>Saved.</span> : null}
      </div>
    </div>
  );
};

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const BLANK_POST = { title: '', slug: '', excerpt: '', content: '', cover_image: '', published: false };

const BlogEditor = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = list view, {} = form
  const [form, setForm] = useState(BLANK_POST);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/admin/blog', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { setPosts(d.posts || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm(BLANK_POST);
    setEditing('new');
    setError('');
    setSuccess('');
  };

  const openEdit = (post) => {
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      cover_image: post.cover_image || '',
      published: !!post.published
    });
    setEditing(post.id);
    setError('');
    setSuccess('');
  };

  const handleTitleChange = (val) => {
    setForm((f) => ({ ...f, title: val, slug: editing === 'new' ? slugify(val) : f.slug }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return setError('Title is required.');
    if (!form.slug.trim()) return setError('Slug is required.');
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const isNew = editing === 'new';
      const url = isNew ? '/api/admin/blog' : `/api/admin/blog/${editing}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Save failed.'); setSaving(false); return; }
      setSuccess('Saved.');
      setSaving(false);
      load();
      setEditing(null);
    } catch {
      setError('Save failed.');
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    await fetch(`/api/admin/blog/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const textareaStyle = {
    width: '100%', border: '2px solid #000000', padding: 12, fontSize: 15,
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    background: 'transparent', outline: 'none', resize: 'vertical', lineHeight: 1.6
  };

  if (editing !== null) {
    return (
      <div>
        <button type="button" style={{ ...secondaryButtonStyle, marginBottom: 28 }} onClick={() => setEditing(null)}>
          ← Back to Posts
        </button>
        <div style={{ display: 'grid', gap: 20 }}>
          <div>
            <div style={labelStyle}>Title</div>
            <input style={inputStyle} value={form.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="My First Post" />
          </div>
          <div>
            <div style={labelStyle}>Slug (URL)</div>
            <input style={inputStyle} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} placeholder="my-first-post" />
            <div style={{ fontSize: 12, opacity: 0.55, marginTop: 6 }}>renderai.lol/blog/{form.slug || 'slug'}</div>
          </div>
          <div>
            <div style={labelStyle}>Cover Image URL (optional)</div>
            <input style={inputStyle} value={form.cover_image} onChange={(e) => setForm((f) => ({ ...f, cover_image: e.target.value }))} placeholder="https://..." />
          </div>
          <div>
            <div style={labelStyle}>Excerpt (shown on blog listing)</div>
            <textarea style={textareaStyle} rows={3} value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} placeholder="A short summary of the post..." />
          </div>
          <div>
            <div style={labelStyle}>Content</div>
            <div style={{ fontSize: 12, opacity: 0.55, marginBottom: 8 }}>Separate paragraphs with a blank line.</div>
            <textarea style={textareaStyle} rows={20} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="Write your post here...&#10;&#10;Each blank line starts a new paragraph." />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              id="blog-published"
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="blog-published" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>
              Published (visible on site)
            </label>
          </div>
          {error && <p style={{ color: '#FF4500', fontSize: 14 }}>{error}</p>}
          {success && <p style={{ color: '#000', fontSize: 14, opacity: 0.6 }}>{success}</p>}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" style={buttonStyle} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Post'}
            </button>
            <button type="button" style={secondaryButtonStyle} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <button type="button" style={buttonStyle} onClick={openNew}>+ New Post</button>
      </div>
      {loading && <p style={{ fontSize: 14, opacity: 0.5 }}>Loading…</p>}
      {!loading && posts.length === 0 && (
        <p style={{ fontSize: 16, opacity: 0.6 }}>No posts yet. Hit <strong>+ New Post</strong> to write your first one.</p>
      )}
      {!loading && posts.map((post) => (
        <div key={post.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid rgba(0,0,0,0.12)', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{post.title}</div>
            <div style={{ fontSize: 13, opacity: 0.55 }}>
              /blog/{post.slug} &nbsp;·&nbsp; {formatDate(post.published_at || post.created_at)} &nbsp;·&nbsp;
              <span style={{ fontWeight: 700, color: post.published ? '#000' : '#FF4500' }}>
                {post.published ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" style={secondaryButtonStyle} onClick={() => openEdit(post)}>Edit</button>
            <button type="button" style={{ ...secondaryButtonStyle, borderColor: '#FF4500', color: '#FF4500' }} onClick={() => handleDelete(post.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export const AdminPage = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionEmail, setSessionEmail] = useState('');
  const [tab, setTab] = useState('portfolio');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/session');
        const data = await res.json().catch(() => ({}));
        setAuthenticated(!!data.authenticated);
        setSessionEmail(data.email || '');
        setSessionLoading(false);
      } catch {
        setAuthenticated(false);
        setSessionLoading(false);
      }
    };
    load();
  }, []);

  const signIn = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Login failed (${res.status})`);
      }
      setAuthenticated(true);
      setSessionEmail(email);
    } catch (e) {
      setAuthError(e?.message || 'Login failed');
    }
    setAuthLoading(false);
  };

  const signOut = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    setAuthenticated(false);
    setSessionEmail('');
  };

  if (sessionLoading) {
    return (
      <Section title="Admin" subtitle="Loading session…">
        <p style={{ fontSize: 14, opacity: 0.7 }}>Checking authentication…</p>
      </Section>
    );
  }

  if (!authenticated) {
    return (
      <Section
        title="Admin"
        subtitle="Sign in to manage portfolio photos and site text."
      >
        <div style={{ maxWidth: 560 }}>
          {!!authError && <p style={{ color: '#FF4500', marginBottom: 16 }}>{authError}</p>}
          <div style={{ marginBottom: 18 }}>
            <div style={labelStyle}>Email</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} type="email" placeholder="you@domain.com" />
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={labelStyle}>Password</div>
            <input value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} type="password" placeholder="••••••••" />
          </div>
          <button type="button" style={buttonStyle} onClick={signIn} disabled={authLoading}>
            {authLoading ? 'Signing in…' : 'Sign In'}
          </button>
          <p style={{ marginTop: 14, fontSize: 12, opacity: 0.65 }}>
            Access is controlled by the API server. Only the configured owner email can sign in.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <>
      <Section
        title="Admin"
        subtitle={`Signed in as ${sessionEmail || ''}`}
        right={
          <button type="button" style={secondaryButtonStyle} onClick={signOut}>
            Sign Out
          </button>
        }
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setTab('portfolio')}
            style={{
              ...secondaryButtonStyle,
              background: tab === 'portfolio' ? '#000000' : 'transparent',
              color: tab === 'portfolio' ? '#F4F4F4' : '#000000'
            }}
          >
            Portfolio
          </button>
          <button
            type="button"
            onClick={() => setTab('copy')}
            style={{
              ...secondaryButtonStyle,
              background: tab === 'copy' ? '#000000' : 'transparent',
              color: tab === 'copy' ? '#F4F4F4' : '#000000'
            }}
          >
            Home Copy
          </button>
          <button
            type="button"
            onClick={() => setTab('about')}
            style={{
              ...secondaryButtonStyle,
              background: tab === 'about' ? '#000000' : 'transparent',
              color: tab === 'about' ? '#F4F4F4' : '#000000'
            }}
          >
            About
          </button>
          <button
            type="button"
            onClick={() => setTab('contact')}
            style={{
              ...secondaryButtonStyle,
              background: tab === 'contact' ? '#000000' : 'transparent',
              color: tab === 'contact' ? '#F4F4F4' : '#000000'
            }}
          >
            Contact
          </button>
          <button
            type="button"
            onClick={() => setTab('pricing')}
            style={{
              ...secondaryButtonStyle,
              background: tab === 'pricing' ? '#000000' : 'transparent',
              color: tab === 'pricing' ? '#F4F4F4' : '#000000'
            }}
          >
            Pricing
          </button>
          <button
            type="button"
            onClick={() => setTab('services')}
            style={{
              ...secondaryButtonStyle,
              background: tab === 'services' ? '#000000' : 'transparent',
              color: tab === 'services' ? '#F4F4F4' : '#000000'
            }}
          >
            Services
          </button>
          <button
            type="button"
            onClick={() => setTab('blog')}
            style={{
              ...secondaryButtonStyle,
              background: tab === 'blog' ? '#000000' : 'transparent',
              color: tab === 'blog' ? '#F4F4F4' : '#000000'
            }}
          >
            Blog
          </button>
        </div>
      </Section>

      {tab === 'portfolio' ? (
        <Section title="Portfolio" subtitle="Manage photos + text used across the site.">
          <PortfolioEditor />
        </Section>
      ) : null}

      {tab === 'copy' ? (
        <Section title="Home Copy" subtitle="Edit homepage hero copy without redeploying.">
          <SiteCopyEditor />
        </Section>
      ) : null}

      {tab === 'about' ? (
        <Section title="About" subtitle="Edit the About page content.">
          <AboutEditor />
        </Section>
      ) : null}

      {tab === 'contact' ? (
        <Section title="Contact" subtitle="Edit the contact section headline and subheadline.">
          <ContactEditor />
        </Section>
      ) : null}

      {tab === 'pricing' ? (
        <Section title="Pricing" subtitle="Update service prices. Changes apply immediately to the site and Stripe checkout.">
          <PricingEditor />
        </Section>
      ) : null}

      {tab === 'services' ? (
        <Section title="Service Pages" subtitle="Edit the subtitle, what's included, and process steps for each service page.">
          <ServicePagesEditor />
        </Section>
      ) : null}

      {tab === 'blog' ? (
        <Section title="Blog" subtitle="Write and publish blog posts. Separate paragraphs with a blank line.">
          <BlogEditor />
        </Section>
      ) : null}
    </>
  );
};
