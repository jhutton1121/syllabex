import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
import './AISettings.css';

const AISettings = () => {
  const [settings, setSettings] = useState({
    model_name: 'gpt-4o',
    max_tokens: 4096,
    enabled: true,
    api_key_display: '',
  });
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await aiService.getSettings();
      setSettings(data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load AI settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        model_name: settings.model_name,
        max_tokens: settings.max_tokens,
        enabled: settings.enabled,
      };
      if (apiKey) {
        payload.api_key = apiKey;
      }
      const updated = await aiService.updateSettings(payload);
      setSettings(updated);
      setApiKey('');
      setMessage({ type: 'success', text: 'Settings saved successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ai-settings-page">
        <div className="card">
          <div className="card-header">AI Assistant Settings</div>
          <p style={{ padding: '20px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-settings-page">
      <div className="card">
        <div className="card-header">AI Assistant Settings</div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSave} className="ai-settings-form">
          <div className="form-group">
            <label htmlFor="api_key">OpenAI API Key</label>
            <input
              id="api_key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={settings.api_key_display || 'Enter API key'}
            />
            {settings.api_key_display && settings.api_key_display !== '***' && (
              <small className="form-hint">
                Current key: {settings.api_key_display} (leave blank to keep current)
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="model_name">Model</label>
            <select
              id="model_name"
              value={settings.model_name}
              onChange={(e) => setSettings({ ...settings, model_name: e.target.value })}
            >
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="max_tokens">Max Tokens</label>
            <input
              id="max_tokens"
              type="number"
              value={settings.max_tokens}
              onChange={(e) => setSettings({ ...settings, max_tokens: parseInt(e.target.value) || 4096 })}
              min="256"
              max="16384"
            />
          </div>

          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              />
              <span>AI Assistant Enabled</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AISettings;
