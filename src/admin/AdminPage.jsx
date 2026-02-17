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
      timelineText: ''
    });
  };

  const save = async () => {
    if (!editing) return;
    setError('');
    const row = {
      id: editing.id,
      published: !!editing.published,
      sort_order: Number.isFinite(Number(editing.sort_order)) ? Number(editing.sort_order) : 0,
      slug: (editing.slug || '').trim(),
      title: (editing.title || '').trim(),
      tag: (editing.tag || '').trim() || null,
      location: (editing.location || '').trim() || null,
      render_time: (editing.render_time || '').trim() || null,
      image_url: (editing.image_url || '').trim() || null,
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

  const uploadImage = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      if (!supabase) {
        throw new Error(supabaseError || 'Supabase browser client is not configured.');
      }
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
      setEditing((prev) => (prev ? { ...prev, image_url: url } : prev));
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
                  onChange={(e) => uploadImage(e.target.files?.[0])}
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
                    timelineText: timelineToText(item.timeline)
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
  const [aboutHeadline, setAboutHeadline] = useState('');
  const [aboutHighlight, setAboutHighlight] = useState('');
  const [aboutBody, setAboutBody] = useState('');
  const [aboutSectors, setAboutSectors] = useState('');
  const [aboutCapabilities, setAboutCapabilities] = useState('');
  const [contactHeadline, setContactHeadline] = useState('');
  const [contactSubheadline, setContactSubheadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setError('');
    try {
      const res = await fetch('/api/admin/site-copy?keys=home.hero_headline,home.hero_subheadline,about.headline,about.highlight,about.body,about.sectors,about.capabilities,contact.headline,contact.subheadline');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Failed to load (${res.status})`);
      }
      const map = new Map((data.rows || []).map((row) => [row.key, row.value]));
      setHeroHeadline(map.get('home.hero_headline') || '');
      setHeroSubheadline(map.get('home.hero_subheadline') || '');
      setAboutHeadline(map.get('about.headline') || '');
      setAboutHighlight(map.get('about.highlight') || '');
      setAboutBody(map.get('about.body') || '');
      setAboutSectors(map.get('about.sectors') || '');
      setAboutCapabilities(map.get('about.capabilities') || '');
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
      { key: 'home.hero_headline', value: heroHeadline || '' },
      { key: 'home.hero_subheadline', value: heroSubheadline || '' },
      { key: 'about.headline', value: aboutHeadline || '' },
      { key: 'about.highlight', value: aboutHighlight || '' },
      { key: 'about.body', value: aboutBody || '' },
      { key: 'about.sectors', value: aboutSectors || '' },
      { key: 'about.capabilities', value: aboutCapabilities || '' },
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
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, opacity: 0.7 }}>
          About Page
        </div>
        <div style={{ marginTop: 12 }}>
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
      </div>
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, opacity: 0.7 }}>
          Contact Section
        </div>
        <div style={{ marginTop: 12 }}>
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
            Homepage Text
          </button>
        </div>
      </Section>

      {tab === 'portfolio' ? (
        <Section title="Portfolio" subtitle="Manage photos + text used across the site.">
          <PortfolioEditor />
        </Section>
      ) : null}

      {tab === 'copy' ? (
        <Section title="Homepage Text" subtitle="Edit homepage hero copy without redeploying.">
          <SiteCopyEditor />
        </Section>
      ) : null}
    </>
  );
};
