import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  Calendar,
  Save,
  Loader2,
  CheckCircle2,
  Zap,
  MessageCircle,
  Bookmark,
  Share2,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { newsApi } from '../services/newsApi';

export const PolishArticleModal = ({ article, isOpen, onClose, onSuccess }) => {
  const { pageData, showToast } = useDashboard();

  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState(article?.imageUrl || '');

  const [variations, setVariations] = useState([]);
  const [loadingVariations, setLoadingVariations] = useState(false);
  const [activeVariationId, setActiveVariationId] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  const [publishMode, setPublishMode] = useState('publish_now'); // 'publish_now' | 'schedule' | 'draft'
  const [scheduledFor, setScheduledFor] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch low-text polished variations and image when modal opens
  useEffect(() => {
    if (!isOpen || !article?._id) return;

    let isMounted = true;
    setLoadingVariations(true);

    if (article.imageUrl) {
      setImageUrl(article.imageUrl);
    }

    newsApi.polishArticle(article._id)
      .then((res) => {
        if (!isMounted) return;
        if (res?.imageUrl) {
          setImageUrl(res.imageUrl);
        }
        const vars = res?.variations || [];
        setVariations(vars);
        if (vars.length > 0) {
          setCaption(vars[0].text);
          setActiveVariationId(vars[0].id);
        } else {
          setCaption(article.title || '');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setCaption(article.title || '');
      })
      .finally(() => {
        if (isMounted) setLoadingVariations(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, article]);

  if (!isOpen || !article) return null;

  const wordsCount = caption.trim() ? caption.trim().split(/\s+/).length : 0;
  const charsCount = caption.length;

  const handleApplyVariation = (v) => {
    setCaption(v.text);
    setActiveVariationId(v.id);
  };

  const handleCustomPolish = async () => {
    if (!customPrompt.trim()) {
      showToast('Please type custom instructions (e.g., "Summarize in 2 sentences in Nepali")', 'warning');
      return;
    }

    setLoadingVariations(true);
    try {
      const res = await newsApi.polishArticle(article._id, { instructions: customPrompt.trim() });
      if (res?.imageUrl) {
        setImageUrl(res.imageUrl);
      }
      const vars = res?.variations || [];
      if (vars.length > 0) {
        setVariations(vars);
        setCaption(vars[0].text);
        setActiveVariationId(vars[0].id);
        setShowCustomPrompt(false);
        showToast('Generated fresh news summary!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Polishing failed', 'error');
    } finally {
      setLoadingVariations(false);
    }
  };

  const insertHelper = (snippet) => {
    setCaption((prev) => (prev ? `${prev.trim()}\n${snippet}` : snippet));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim()) {
      showToast('Post caption cannot be empty', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const mediaToUse = imageUrl.trim() || undefined;

      if (publishMode === 'publish_now') {
        const res = await newsApi.manualPublishArticle(article._id, {
          caption: caption.trim(),
          mediaUrl: mediaToUse,
          includeLink: false
        });
        showToast('Post published successfully to your Facebook Page!', 'success');
        if (onSuccess) onSuccess(res);
        onClose();
      } else if (publishMode === 'schedule') {
        if (!scheduledFor) {
          showToast('Please select a future scheduled date and time', 'warning');
          setSubmitting(false);
          return;
        }
        const res = await newsApi.manualPublishArticle(article._id, {
          caption: caption.trim(),
          mediaUrl: mediaToUse,
          scheduledFor,
          includeLink: false
        });
        showToast('Post scheduled successfully!', 'success');
        if (onSuccess) onSuccess(res);
        onClose();
      } else {
        // Save as draft
        const res = await newsApi.manualDraftArticle(article._id, {
          caption: caption.trim(),
          mediaUrl: mediaToUse
        });
        showToast('Draft saved to Generated Posts!', 'success');
        if (onSuccess) onSuccess(res);
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '840px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          gap: '1.25rem',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Sparkles size={12} /> News Story Summarizer
              </span>
              <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                {article.sourceId?.name || article.sourceName || 'OnlineKhabar'}
              </span>
              <span className="badge badge-neutral" style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#065f46' }}>
                ✓ No External Links (Native FB Post)
              </span>
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.4rem', lineHeight: 1.35 }}>
              {article.title}
            </h2>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Polishing Variations Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Zap size={14} color="#f59e0b" /> Select Generated Post Style:
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              onClick={() => setShowCustomPrompt(!showCustomPrompt)}
            >
              <Sparkles size={12} /> Custom Prompt
            </button>
          </div>

          {showCustomPrompt && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                className="form-control"
                placeholder="e.g. 'Summarize in 2 sentences with an intriguing question', 'In simple Nepali'"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                style={{ fontSize: '0.82rem' }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleCustomPolish}
                disabled={loadingVariations}
              >
                {loadingVariations ? <Loader2 size={13} className="spin" /> : 'Generate'}
              </button>
            </div>
          )}

          {loadingVariations ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}>
              <Loader2 size={16} className="spin" color="var(--primary)" /> Summarizing news headline and content into a human-friendly post...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
              {variations.map((v) => {
                const isSelected = activeVariationId === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => handleApplyVariation(v)}
                    style={{
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                      background: isSelected ? 'var(--primary-subtle)' : 'white',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.65rem 0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.82rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                        {v.label}
                      </strong>
                      {isSelected && <CheckCircle2 size={14} color="var(--primary)" />}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.3 }}>
                      {v.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Caption Editor & FB Preview Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '1.25rem' }}>
          {/* Left: Editor & Image Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>
                Facebook Post Content
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span
                  className="badge"
                  style={{
                    fontSize: '0.72rem',
                    background: wordsCount <= 45 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    color: wordsCount <= 45 ? '#10b981' : '#3b82f6',
                    border: '1px solid currentColor'
                  }}
                >
                  {wordsCount <= 45 ? '🎯 Concise Story' : '📝 Full Summary'} ({wordsCount} words)
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {charsCount} chars
                </span>
              </div>
            </div>

            <textarea
              className="form-control"
              rows={6}
              value={caption}
              onChange={(e) => {
                setCaption(e.target.value);
                setActiveVariationId(null);
              }}
              placeholder="Post message summarizing the news..."
              style={{ fontSize: '0.88rem', lineHeight: 1.55, resize: 'vertical' }}
            />

            {/* Image Attachment Box */}
            <div
              style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                background: 'var(--surface-muted)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ImageIcon size={14} color="var(--primary)" /> Original News Photo (attached to Facebook post)
              </div>

              {imageUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <img
                    src={imageUrl}
                    alt="Article attachment"
                    style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-light)' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Original article photo will be attached to the post.
                  </span>
                </div>
              )}

              {!imageUrl && (
                <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
                  No original article image was found. Publishing will be blocked until one is available.
                </span>
              )}
            </div>

            {/* Quick Nepali Helper Chips */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem' }}
                onClick={() => insertHelper('यसबारे तपाईँको विचार के छ? 👇')}
              >
                + "तपाईँको विचार? 👇"
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem' }}
                onClick={() => insertHelper('📌 मुख्य सन्देश: ')}
              >
                + "📌 मुख्य सन्देश:"
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem' }}
                onClick={() => insertHelper('What do you think about this? 👇')}
              >
                + "What do you think? 👇"
              </button>
            </div>
          </div>

          {/* Right: Live Facebook Native Feed Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>
              Live Facebook Feed Preview
            </label>
            <div
              style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                background: '#ffffff',
                padding: '0.85rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}
            >
              {/* FB Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {pageData?.pictureUrl ? (
                  <img
                    src={pageData.pictureUrl}
                    alt="Page avatar"
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}
                  >
                    {(pageData?.name || 'W').charAt(0)}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1c1e21' }}>
                    {pageData?.name || 'Who Cares'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#65676b' }}>
                    Just now · 🌐 Public
                  </div>
                </div>
              </div>

              {/* FB Post Body */}
              <div
                style={{
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  color: '#050505',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  minHeight: '40px'
                }}
              >
                {caption || <span style={{ color: 'var(--text-muted)' }}>Type or select a summary above...</span>}
              </div>

              {/* Native FB Photo Preview */}
              {imageUrl && (
                <div
                  style={{
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #e4e6eb',
                    background: '#f0f2f5',
                    maxHeight: '260px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="Attached news"
                    style={{ width: '100%', height: 'auto', maxHeight: '260px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.parentElement.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* FB Interaction Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #e4e6eb', paddingTop: '0.5rem', color: '#65676b', fontSize: '0.75rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>👍 Like</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MessageCircle size={13} /> Comment</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Share2 size={13} /> Share</span>
              </div>
            </div>
          </div>
        </div>

        {/* Publishing Mode Selection & Date Picker */}
        <div style={{ background: 'var(--surface-muted)', padding: '0.85rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="radio"
                name="publishMode"
                value="publish_now"
                checked={publishMode === 'publish_now'}
                onChange={() => setPublishMode('publish_now')}
              />
              <Send size={14} color="var(--primary)" /> Publish to Facebook Page Now
            </label>

            <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="radio"
                name="publishMode"
                value="schedule"
                checked={publishMode === 'schedule'}
                onChange={() => setPublishMode('schedule')}
              />
              <Calendar size={14} color="#f59e0b" /> Schedule for Later
            </label>

            <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="radio"
                name="publishMode"
                value="draft"
                checked={publishMode === 'draft'}
                onChange={() => setPublishMode('draft')}
              />
              <Save size={14} color="#64748b" /> Save as Draft
            </label>
          </div>

          {publishMode === 'schedule' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 600 }}>
                Pick Time:
              </label>
              <input
                type="datetime-local"
                className="form-control"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                style={{ maxWidth: 260, fontSize: '0.82rem' }}
                required
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !caption.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="spin" />
                {publishMode === 'publish_now' ? 'Publishing photo post...' : publishMode === 'schedule' ? 'Scheduling...' : 'Saving...'}
              </>
            ) : (
              <>
                {publishMode === 'publish_now' && <Send size={15} />}
                {publishMode === 'schedule' && <Calendar size={15} />}
                {publishMode === 'draft' && <Bookmark size={15} />}
                {publishMode === 'publish_now' ? 'Publish Photo Post' : publishMode === 'schedule' ? 'Schedule Post' : 'Save to Drafts'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
