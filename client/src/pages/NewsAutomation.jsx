import React, { useCallback, useEffect, useState } from 'react';
import {
  Newspaper,
  Plus,
  RefreshCw,
  Play,
  Trash2,
  Pencil,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Sparkles,
  Send,
  AlertTriangle,
  Search
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { newsApi } from '../services/newsApi';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { PolishArticleModal } from '../components/PolishArticleModal';

const emptyForm = {
  name: '',
  websiteUrl: '',
  feedUrl: '',
  intervalMinutes: 30,
  autoPublish: false,
  excerptOnly: false,
  isActive: true,
  generation: {
    language: 'English',
    tone: 'Informative',
    captionMinWords: 40,
    captionMaxWords: 80,
    emojiUsage: 'sparse',
    hashtagUsage: 'sparse',
    targetAudience: 'general readers'
  }
};

const formatDate = (value) => {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
};

const StatusPill = ({ children, tone = 'blue' }) => (
  <span className={`badge badge-${tone}`} style={{ fontSize: '0.7rem' }}>
    {children}
  </span>
);

export const NewsAutomation = () => {
  const { pageData, showToast } = useDashboard();
  const [tab, setTab] = useState('sources');
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState([]);
  const [articles, setArticles] = useState([]);
  const [posts, setPosts] = useState([]);
  const [history, setHistory] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [captionDrafts, setCaptionDrafts] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedArticleForPolish, setSelectedArticleForPolish] = useState(null);
  const [articleSearch, setArticleSearch] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sourceRes, articleRes, postRes, historyRes] = await Promise.all([
        newsApi.listSources(),
        newsApi.listArticles(),
        newsApi.listPosts(),
        newsApi.getHistory()
      ]);
      setSources(sourceRes || []);
      setArticles(articleRes || []);
      setPosts(postRes || []);
      setHistory(historyRes || null);
    } catch (error) {
      showToast(error.message || 'Failed to load news automation data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateGeneration = (field, value) => {
    setForm((prev) => ({
      ...prev,
      generation: { ...prev.generation, [field]: value }
    }));
  };

  const handleSaveSource = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await newsApi.updateSource(editingId, form);
        showToast('News source updated', 'success');
      } else {
        await newsApi.createSource(form);
        showToast('News source added', 'success');
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadAll();
    } catch (error) {
      showToast(error.message || 'Unable to save source', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (source) => {
    setEditingId(source._id);
    setForm({
      name: source.name,
      websiteUrl: source.websiteUrl,
      feedUrl: source.feedUrl,
      intervalMinutes: source.intervalMinutes,
      autoPublish: source.autoPublish,
      excerptOnly: source.excerptOnly,
      isActive: source.isActive,
      generation: {
        language: source.generation?.language || 'English',
        tone: source.generation?.tone || 'Informative',
        captionMinWords: source.generation?.captionMinWords || 40,
        captionMaxWords: source.generation?.captionMaxWords || 80,
        emojiUsage: source.generation?.emojiUsage || 'sparse',
        hashtagUsage: source.generation?.hashtagUsage || 'sparse',
        targetAudience: source.generation?.targetAudience || 'general readers'
      }
    });
    setTab('sources');
  };

  const runAction = async (id, action, successMessage) => {
    setBusyId(id);
    try {
      const result = await action();
      showToast(successMessage, 'success');
      await loadAll();
      return result;
    } catch (error) {
      showToast(error.message || 'Action failed', 'error');
      return null;
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Newspaper size={24} color="var(--primary)" />
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            News Automation
          </h1>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Monitor RSS feeds and generate polished Gemini captions. Enable automatic publishing on a source to post eligible articles on the scheduler's configured interval.
        </p>
      </div>

      {!sources.some((source) => source.isActive && source.autoPublish) && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.1)',
            color: 'var(--warning)',
            fontSize: '0.84rem'
          }}
        >
          <AlertTriangle size={17} />
          Automatic publishing is off. Open Sources, edit an active source, and enable automatic publishing to start the 10-minute schedule.
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[
          ['sources', 'Sources'],
          ['articles', 'Articles'],
          ['posts', 'Generated Posts'],
          ['history', 'History']
        ].map(([id, label]) => (
          <button
            key={id}
            className={`btn ${tab === id ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
        <button className="btn btn-outline btn-sm" onClick={loadAll} style={{ marginLeft: 'auto' }}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {tab === 'sources' && (
        <div className="dashboard-grid-2">
          <form
            onSubmit={handleSaveSource}
            style={{
              background: 'white',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              {editingId ? 'Edit news source' : 'Add news source'}
            </h2>
            <input className="form-control" placeholder="Display name" value={form.name} onChange={(e) => updateForm('name', e.target.value)} required />
            <input className="form-control" placeholder="Website URL" value={form.websiteUrl} onChange={(e) => updateForm('websiteUrl', e.target.value)} required />
            <input className="form-control" placeholder="RSS or Atom feed URL" value={form.feedUrl} onChange={(e) => updateForm('feedUrl', e.target.value)} required />
            <label className="form-label">Monitoring interval (minutes)</label>
            <input
              type="number"
              min="5"
              max="360"
              className="form-control"
              value={form.intervalMinutes}
              onChange={(e) => updateForm('intervalMinutes', Number(e.target.value))}
            />
            <select className="form-control" value={form.generation.tone} onChange={(e) => updateGeneration('tone', e.target.value)}>
              <option>Informative</option>
              <option>Professional</option>
              <option>Casual</option>
              <option>Engaging</option>
              <option>Promotional</option>
            </select>
            <input className="form-control" placeholder="Language" value={form.generation.language} onChange={(e) => updateGeneration('language', e.target.value)} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input className="form-control" type="number" min="20" max="120" value={form.generation.captionMinWords} onChange={(e) => updateGeneration('captionMinWords', Number(e.target.value))} />
              <input className="form-control" type="number" min="30" max="200" value={form.generation.captionMaxWords} onChange={(e) => updateGeneration('captionMaxWords', Number(e.target.value))} />
            </div>
            <label style={{ fontSize: '0.85rem' }}>
              <input type="checkbox" checked={form.autoPublish} onChange={(e) => updateForm('autoPublish', e.target.checked)} /> Enable automatic publishing for this source
            </label>
            <label style={{ fontSize: '0.85rem' }}>
              <input type="checkbox" checked={form.excerptOnly} onChange={(e) => updateForm('excerptOnly', e.target.checked)} /> Excerpt-only mode (do not fetch the article page)
            </label>
            <label style={{ fontSize: '0.85rem' }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => updateForm('isActive', e.target.checked)} /> Monitoring active
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Plus size={14} />
                {editingId ? 'Save changes' : 'Add source'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sources.length === 0 && (
              <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                No news sources yet. Add an RSS feed to start monitoring.
              </div>
            )}
            {sources.map((source) => (
              <div
                key={source._id}
                style={{
                  background: 'white',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem 1.15rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{source.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{source.feedUrl}</div>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      <StatusPill tone={source.isActive ? 'live' : 'demo'}>{source.isActive ? 'Monitoring' : 'Paused'}</StatusPill>
                      <StatusPill>{source.autoPublish ? 'Auto publish' : 'Manual approval'}</StatusPill>
                      <StatusPill>Every {source.intervalMinutes}m</StatusPill>
                    </div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.65rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(source.autoPublish)}
                        disabled={!source.isActive || busyId === source._id}
                        onChange={(event) => runAction(
                          source._id,
                          () => newsApi.updateSource(source._id, { autoPublish: event.target.checked }),
                          event.target.checked ? 'Automatic publishing enabled' : 'Automatic publishing disabled'
                        )}
                      />
                      Automatically publish articles from this source
                    </label>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                      Last success: {formatDate(source.lastSuccessfulCheckAt)}
                    </p>
                    {source.lastError && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>{source.lastError}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => startEdit(source)} aria-label={`Edit ${source.name}`}>
                      <Pencil size={13} /> Edit settings
                    </button>
                    <button className="btn btn-outline btn-sm" disabled={busyId === source._id} onClick={() => runAction(source._id, () => newsApi.testFeed(source._id), 'Feed looks valid')}>Test</button>
                    <button className="btn btn-primary btn-sm" disabled={busyId === source._id} onClick={() => runAction(source._id, () => newsApi.checkSource(source._id), 'Manual check started')}>
                      <Play size={13} /> Check
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => runAction(source._id, () => newsApi.updateSource(source._id, { ...source, generation: source.generation, isActive: !source.isActive }), source.isActive ? 'Monitoring paused' : 'Monitoring enabled')}
                    >
                      {source.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => setConfirmDelete(source)}>
                      <Trash2 size={13} color="var(--danger)" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'articles' && (() => {
        const query = articleSearch.toLowerCase().trim();
        const filteredArticles = articles.filter((a) => {
          if (!query) return true;
          const title = (a.title || '').toLowerCase();
          const source = (a.sourceId?.name || a.sourceName || '').toLowerCase();
          return title.includes(query) || source.includes(query);
        });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '420px' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="form-control"
                  placeholder="Search articles by title or news source..."
                  value={articleSearch}
                  onChange={(e) => setArticleSearch(e.target.value)}
                  style={{ paddingLeft: '2.4rem', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Showing <strong>{filteredArticles.length}</strong> of {articles.length} articles
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflowX: 'auto', boxShadow: 'var(--shadow-xs)' }}>
              {filteredArticles.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {articles.length === 0 ? 'No articles discovered yet. Add a source and run a check.' : 'No articles match your search.'}
                </div>
              ) : (
                <table className="news-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 280 }}>Article Headline</th>
                      <th>Source</th>
                      <th>Published</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right', minWidth: 140 }}>FB Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArticles.map((article) => {
                      const isPublished = article.processingStatus === 'published';
                      const isScheduled = article.processingStatus === 'scheduled';
                      return (
                        <tr key={article._id}>
                          <td>
                            <a
                              href={article.canonicalUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontWeight: 600, color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', lineHeight: 1.35 }}
                            >
                              {article.title} <ExternalLink size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
                            </a>
                          </td>
                          <td>
                            <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                              {article.sourceId?.name || article.sourceName}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {formatDate(article.publishedAt)}
                          </td>
                          <td>
                            <StatusPill tone={isPublished ? 'live' : isScheduled ? 'warning' : article.processingStatus === 'extracted' ? 'purple' : 'blue'}>
                              {article.processingStatus}
                            </StatusPill>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                whiteSpace: 'nowrap',
                                fontSize: '0.78rem',
                                padding: '0.35rem 0.75rem'
                              }}
                              onClick={() => setSelectedArticleForPolish(article)}
                            >
                              <Sparkles size={13} />
                              {isPublished ? 'Repolish' : 'Polish & Post'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      })()}

      {tab === 'posts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {posts.length === 0 && (
            <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              No generated posts yet.
            </div>
          )}
          {posts.map((post) => {
            const draft = captionDrafts[post._id] ?? post.caption;
            return (
              <div key={post._id} style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{post.headline || post.articleId?.title}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {post.sourceId?.name} • {post.approvalStatus} / {post.publishingStatus}
                    </div>
                  </div>
                  <a href={post.sourceUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                    Source <ExternalLink size={12} />
                  </a>
                </div>
                {post.needsReview && (
                  <p style={{ color: 'var(--warning)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                    <AlertTriangle size={13} /> Needs review: {post.reviewReason || 'Review required'}
                  </p>
                )}
                <textarea
                  className="form-control"
                  rows={5}
                  style={{ marginTop: '0.75rem' }}
                  value={draft}
                  disabled={post.publishingStatus === 'published'}
                  onChange={(e) => setCaptionDrafts((prev) => ({ ...prev, [post._id]: e.target.value }))}
                />
                {post.lastError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{post.lastError}</p>}
                {post.fbPostId && <p style={{ fontSize: '0.8rem' }}>Facebook post ID: {post.fbPostId}</p>}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-outline btn-sm" disabled={busyId === post._id || post.publishingStatus === 'published'} onClick={() => runAction(post._id, () => newsApi.updatePost(post._id, { caption: draft }), 'Caption saved')}>
                    Save edit
                  </button>
                  <button className="btn btn-outline btn-sm" disabled={busyId === post._id || post.publishingStatus === 'published'} onClick={() => runAction(post._id, () => newsApi.regeneratePost(post._id), 'Caption regenerated')}>
                    <Sparkles size={13} /> Regenerate
                  </button>
                  <button className="btn btn-outline btn-sm" disabled={busyId === post._id} onClick={() => runAction(post._id, () => newsApi.approvePost(post._id), 'Approved')}>
                    <CheckCircle2 size={13} /> Approve
                  </button>
                  <button className="btn btn-outline btn-sm" disabled={busyId === post._id} onClick={() => runAction(post._id, () => newsApi.rejectPost(post._id), 'Rejected')}>
                    <XCircle size={13} /> Reject
                  </button>
                  <button className="btn btn-primary btn-sm" disabled={busyId === post._id || post.publishingStatus === 'published'} onClick={() => runAction(post._id, () => newsApi.publishPost(post._id), 'Published to Facebook')}>
                    <Send size={13} /> Publish
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'history' && history && (
        <div className="dashboard-grid-2">
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', padding: '1.25rem' }}>
            <p>Articles discovered: <strong>{history.articlesDiscovered}</strong></p>
            <p>Posts generated: <strong>{history.postsGenerated}</strong></p>
            <p>Posts published: <strong>{history.postsPublished}</strong></p>
            <p>Last run: {formatDate(history.lastRun)}</p>
            <p>Last successful run: {formatDate(history.lastSuccessfulRun)}</p>
            {history.lastSourceError && <p style={{ color: 'var(--danger)' }}>{history.lastSourceError}</p>}
          </div>
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', padding: '1.25rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Failed or uncertain jobs</h3>
            {(history.failedJobs || []).length === 0 && <p style={{ color: 'var(--text-muted)' }}>No failed jobs.</p>}
            {(history.failedJobs || []).map((job) => (
              <div key={job._id} style={{ marginBottom: '0.75rem' }}>
                <strong>{job.articleId?.title || 'Untitled'}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{job.lastError}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, padding: '1.25rem' }}>
            <h3>Delete {confirmDelete.name}?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.75rem 0' }}>
              This removes the source and its discovered articles and drafts.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  await runAction(confirmDelete._id, () => newsApi.deleteSource(confirmDelete._id), 'Source deleted');
                  setConfirmDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedArticleForPolish && (
        <PolishArticleModal
          article={selectedArticleForPolish}
          isOpen={Boolean(selectedArticleForPolish)}
          onClose={() => setSelectedArticleForPolish(null)}
          onSuccess={() => {
            loadAll();
          }}
        />
      )}
    </div>
  );
};
