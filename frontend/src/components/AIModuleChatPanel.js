import React, { useState, useRef, useEffect } from 'react';
import aiService from '../services/aiService';
import AIModuleReview from './AIModuleReview';
import SyllabusUpload from './SyllabusUpload';
import './AIModuleChatPanel.css';

const AIModuleChatPanel = ({ courseId, existingModules, onModulesAccepted, isOpen, onToggle }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingModules, setPendingModules] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [showSyllabus, setShowSyllabus] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const aiAvailable = aiStatus?.available === true;
  const aiDisabledReason = aiStatus && !aiStatus.available
    ? !aiStatus.api_key_configured
      ? 'AI API key is not configured. An admin needs to set it in AI Settings.'
      : !aiStatus.global_enabled
        ? 'AI assistant is globally disabled by the administrator.'
        : !aiStatus.course_enabled
          ? 'AI assistant is not enabled for this course.'
          : 'AI assistant is unavailable.'
    : null;

  const hasExistingModules = existingModules && existingModules.length > 0;

  useEffect(() => {
    if (courseId) {
      aiService.getCourseStatus(courseId)
        .then(data => setAiStatus(data))
        .catch(() => setAiStatus({ available: false, api_key_configured: false, global_enabled: false, course_enabled: false }));
    }
  }, [courseId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    const prompt = inputText.trim();
    if (!prompt || isLoading) return;

    const userMessage = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const mode = hasExistingModules ? 'edit' : 'create';
      const modulesForContext = hasExistingModules
        ? existingModules.map(m => ({
            id: m.id,
            title: m.title,
            description: m.description,
            start_date: m.start_date,
            end_date: m.end_date,
            order: m.order,
            zoom_link: m.zoom_link,
            assignments: (m.assignments || []).map(a => ({
              id: a.id,
              title: a.title,
              type: a.type,
              due_date: a.due_date,
              points_possible: a.points_possible,
            })),
          }))
        : [];

      const result = await aiService.generateModules(
        prompt,
        conversationHistory,
        courseId,
        modulesForContext,
        mode
      );

      const assistantMessage = {
        role: 'assistant',
        content: result.message || 'Here are the generated modules.',
        modules: result.modules || [],
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (result.modules && result.modules.length > 0) {
        setPendingModules(result.modules);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to generate modules. Please try again.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMsg,
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReviewClose = () => {
    setPendingModules(null);
  };

  const handleModulesApproved = (approvedModules) => {
    setPendingModules(null);
    onModulesAccepted(approvedModules);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `${approvedModules.length} module${approvedModules.length !== 1 ? 's' : ''} applied to the course.`,
    }]);
  };

  const handleReset = () => {
    setMessages([]);
    setPendingModules(null);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-module-panel">
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <span className="ai-icon">AI</span>
          <span>Module Assistant</span>
        </div>
        <div className="ai-panel-actions">
          <button
            className="ai-btn-icon"
            onClick={() => setShowSyllabus(!showSyllabus)}
            title="Course context"
          >
            {showSyllabus ? 'Chat' : 'Context'}
          </button>
          {messages.length > 0 && (
            <button className="ai-btn-icon" onClick={handleReset} title="New conversation">
              Reset
            </button>
          )}
          <button className="ai-btn-icon ai-btn-close" onClick={onToggle} title="Close">
            X
          </button>
        </div>
      </div>

      {showSyllabus ? (
        <div className="ai-panel-body">
          <SyllabusUpload courseId={courseId} />
        </div>
      ) : (
        <>
          <div className="ai-messages">
            {!aiAvailable && aiStatus && (
              <div className="ai-message ai-message-system">
                {aiDisabledReason}
              </div>
            )}
            {messages.length === 0 && aiAvailable && (
              <div className="ai-message ai-message-system">
                {hasExistingModules
                  ? 'Describe how you want to modify your modules. For example:\n\n"Shift all modules forward 2 weeks" or "Add a spring break gap in mid-March"'
                  : 'Describe the modules you want to create. For example:\n\n"6 modules, 3 weeks each, for Finance 101 from Jan 6 through June 1, with a spring break in mid-March"'}
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`ai-message ai-message-${msg.role} ${msg.isError ? 'ai-message-error' : ''}`}
              >
                <div className="ai-message-content">{msg.content}</div>
                {msg.modules && msg.modules.length > 0 && (
                  <button
                    className="btn btn-secondary ai-review-btn"
                    onClick={() => setPendingModules(msg.modules)}
                  >
                    Review {msg.modules.length} Module{msg.modules.length !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="ai-message ai-message-assistant">
                <div className="ai-typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-input-area">
            <textarea
              ref={inputRef}
              className="ai-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={!aiAvailable ? 'AI not configured...' : hasExistingModules ? 'Describe changes to modules...' : 'Describe modules to create...'}
              disabled={isLoading || !aiAvailable}
              rows={2}
            />
            <button
              className="btn btn-primary ai-send-btn"
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading || !aiAvailable}
            >
              Send
            </button>
          </div>
        </>
      )}

      {pendingModules && (
        <AIModuleReview
          modules={pendingModules}
          isEditMode={hasExistingModules}
          onAccept={handleModulesApproved}
          onClose={handleReviewClose}
        />
      )}
    </div>
  );
};

export default AIModuleChatPanel;
