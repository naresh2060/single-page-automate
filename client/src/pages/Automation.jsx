import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  MessageSquare, 
  Clock, 
  Sliders, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Copy, 
  Send 
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { facebookApi } from '../services/facebookApi';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const Automation = () => {
  const { automationSettings, setAutomationSettings, showToast, setIsCreatePostOpen } = useDashboard();

  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('Engaging');
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // New rule state
  const [newKeyword, setNewKeyword] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const handleGenerateAiDraft = async () => {
    if (!aiTopic.trim()) {
      showToast('Please enter a topic for the social post', 'warning');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await facebookApi.generateDraft({ topic: aiTopic.trim(), tone: aiTone });
      setGeneratedDraft(res.generatedText);
      showToast('AI draft generated!', 'success');
    } catch (err) {
      showToast(err.message || 'Generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newKeyword.trim() || !newResponse.trim()) {
      showToast('Keyword and response message are required', 'warning');
      return;
    }

    const updatedRules = [
      ...(automationSettings?.autoReplyRules || []),
      { keyword: newKeyword.trim().toLowerCase(), response: newResponse.trim(), isActive: true }
    ];

    try {
      setIsSavingSettings(true);
      const res = await facebookApi.updateAutomationSettings({ autoReplyRules: updatedRules });
      setAutomationSettings(res);
      setNewKeyword('');
      setNewResponse('');
      showToast('New auto-reply rule saved!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update rules', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeleteRule = async (index) => {
    const updatedRules = (automationSettings?.autoReplyRules || []).filter((_, i) => i !== index);
    try {
      const res = await facebookApi.updateAutomationSettings({ autoReplyRules: updatedRules });
      setAutomationSettings(res);
      showToast('Rule removed', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete rule', 'error');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bot size={24} color="var(--primary)" />
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Social Automation Suite
          </h1>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Configure automated responses, AI copywriters, and content dispatch rules
        </p>
      </div>

      <div className="dashboard-grid-2">
        {/* Left: AI Social Copy Generator */}
        <div 
          style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Sparkles size={18} color="#1877F2" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              AI Content Synthesizer
            </h2>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Generate optimized Facebook post captions tailored to your audience's interests and engagement patterns.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Core Topic or Announcement</label>
              <input
                type="text"
                className="form-control"
                placeholder="E.g., Quarterly platform release, customer milestone, industry tips"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Audience Tone</label>
              <select
                className="form-control"
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
              >
                <option value="Engaging">Engaging & Conversational</option>
                <option value="Professional">Professional & Corporate</option>
                <option value="Promotional">Promotional & High-Converting</option>
                <option value="Casual">Casual & Friendly</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleGenerateAiDraft}
              disabled={isGenerating || !aiTopic.trim()}
              style={{ marginTop: '0.5rem' }}
            >
              <Sparkles size={16} />
              <span>{isGenerating ? 'Synthesizing...' : 'Generate Post Copy'}</span>
            </button>

            {/* Output Box */}
            {generatedDraft && (
              <div 
                style={{
                  marginTop: '1.25rem',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    GENERATED DRAFT PREVIEW
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => copyToClipboard(generatedDraft)}
                      title="Copy text"
                    >
                      <Copy size={12} />
                      <span>Copy</span>
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setIsCreatePostOpen(true)}
                    >
                      <Send size={12} />
                      <span>Use in Post</span>
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: '#1e293b', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                  {generatedDraft}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Automated Keyword Responders */}
        <div 
          style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <MessageSquare size={18} color="#10b981" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Auto-Reply Rule Engine
            </h2>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Automatically respond to recurring questions, inquiries, and customer DMs matching trigger keywords.
          </p>

          {/* Existing Rules List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {(automationSettings?.autoReplyRules || []).map((rule, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '0.85rem',
                  background: '#f8fafc',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                      keyword: "{rule.keyword}"
                    </span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#334155', lineHeight: 1.4 }}>
                    {rule.response}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteRule(idx)}
                  className="btn btn-refresh"
                  style={{ width: '28px', height: '28px', color: 'var(--danger)' }}
                  title="Remove rule"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Rule Form */}
          <form onSubmit={handleAddRule} style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Add Keyword Rule
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Trigger keyword (e.g., pricing, support, hours)"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                required
              />
              <textarea
                className="form-control"
                placeholder="Automated reply message..."
                rows={2}
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                disabled={isSavingSettings}
                style={{ alignSelf: 'flex-start' }}
              >
                <Plus size={14} />
                <span>Save Auto-Reply Rule</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
