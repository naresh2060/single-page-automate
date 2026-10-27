import React, { useState } from 'react';
import { X, Sparkles, Send, Calendar, Image as ImageIcon, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { facebookApi } from '../services/facebookApi';

export const CreatePostModal = () => {
  const { isCreatePostOpen, setIsCreatePostOpen, publishNewPost, addScheduledPost, showToast } = useDashboard();

  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [postMode, setPostMode] = useState('publish_now'); // 'publish_now' | 'schedule'
  const [scheduledFor, setScheduledFor] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AI draft generator state
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('Engaging');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  if (!isCreatePostOpen) return null;

  const handleGenerateAi = async () => {
    if (!aiTopic.trim()) {
      showToast('Please enter a topic or theme for the AI copywriter', 'warning');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await facebookApi.generateDraft({ topic: aiTopic.trim(), tone: aiTone });
      setMessage(res.generatedText);
      setShowAiHelper(false);
      showToast('AI draft generated and inserted into composer!', 'success');
    } catch (err) {
      showToast(err.message || 'AI generation failed', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast('Please enter post text before submitting', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (postMode === 'publish_now') {
        await publishNewPost({
          message: message.trim(),
          mediaUrl: mediaUrl.trim() || undefined,
          link: linkUrl.trim() || undefined
        });
      } else {
        if (!scheduledFor) {
          showToast('Please select a scheduled date and time', 'warning');
          setSubmitting(false);
          return;
        }

        await addScheduledPost({
          message: message.trim(),
          mediaUrl: mediaUrl.trim() || undefined,
          linkUrl: linkUrl.trim() || undefined,
          scheduledFor: new Date(scheduledFor).toISOString()
        });
      }

      // Reset
      setMessage('');
      setMediaUrl('');
      setLinkUrl('');
    } catch (err) {
      // Handled in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsCreatePostOpen(false)}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 className="modal-title">Create Facebook Post</h3>
          </div>
          <button 
            className="btn-refresh" 
            onClick={() => setIsCreatePostOpen(false)}
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.35rem', borderRadius: 'var(--radius-md)' }}>
              <button
                type="button"
                className={`btn btn-sm ${postMode === 'publish_now' ? 'btn-primary' : ''}`}
                style={{ flex: 1, borderRadius: '8px' }}
                onClick={() => setPostMode('publish_now')}
              >
                <Send size={14} />
                <span>Publish Immediately</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${postMode === 'schedule' ? 'btn-primary' : ''}`}
                style={{ flex: 1, borderRadius: '8px' }}
                onClick={() => setPostMode('schedule')}
              >
                <Calendar size={14} />
                <span>Schedule for Later</span>
              </button>
            </div>

            {/* AI Generator Helper Drawer */}
            {showAiHelper ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 700, fontSize: '0.85rem' }}>
                    <Sparkles size={16} />
                    <span>AI Social Copy Assistant</span>
                  </div>
                  <button type="button" onClick={() => setShowAiHelper(false)} style={{ fontSize: '0.75rem', color: '#166534', textDecoration: 'underline' }}>
                    Cancel
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E.g., New cloud automation feature release, weekly tip..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select 
                      className="form-control" 
                      style={{ width: 'auto' }}
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                    >
                      <option value="Engaging">Engaging Tone</option>
                      <option value="Professional">Professional Tone</option>
                      <option value="Promotional">Promotional Tone</option>
                      <option value="Casual">Casual Tone</option>
                    </select>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleGenerateAi}
                      disabled={isGeneratingAi}
                      style={{ flex: 1 }}
                    >
                      {isGeneratingAi ? <Loader2 size={14} className="spinning" /> : <Sparkles size={14} />}
                      <span>Generate Copy</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowAiHelper(true)}
                  style={{ color: '#1877F2', borderColor: '#bfdbfe', background: '#eff6ff' }}
                >
                  <Sparkles size={14} />
                  <span>Draft with AI Assistant</span>
                </button>
              </div>
            )}

            {/* Post Content */}
            <div className="form-group">
              <label className="form-label">Post Caption / Message</label>
              <textarea
                className="form-control"
                placeholder="What's on your mind? Share an update, announcement, or insight with your Facebook audience..."
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {message.length} characters
              </div>
            </div>

            {/* Media Attachment URL */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ImageIcon size={14} />
                <span>Image / Media URL (Optional)</span>
              </label>
              <input
                type="url"
                className="form-control"
                placeholder="https://example.com/image.jpg"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
              {mediaUrl && (
                <div style={{ marginTop: '0.5rem', maxHeight: '120px', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <img src={mediaUrl} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover' }} onError={(e) => e.target.style.display='none'} />
                </div>
              )}
            </div>

            {/* Click-Through Link URL */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <LinkIcon size={14} />
                <span>Link URL (Optional)</span>
              </label>
              <input
                type="url"
                className="form-control"
                placeholder="https://yourwebsite.com/article"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>

            {/* Schedule Date & Time if in Schedule Mode */}
            {postMode === 'schedule' && (
              <div className="form-group" style={{ background: '#f8fafc', padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <label className="form-label">Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required={postMode === 'schedule'}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsCreatePostOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !message.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spinning" />
                  <span>Processing...</span>
                </>
              ) : postMode === 'publish_now' ? (
                <>
                  <Send size={16} />
                  <span>Publish to Facebook</span>
                </>
              ) : (
                <>
                  <Calendar size={16} />
                  <span>Schedule Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
