import React, { useState, useRef, useEffect } from 'react';
import aiService from '../services/aiService';
import AIRubricReview from './AIRubricReview';
import SyllabusUpload from './SyllabusUpload';
import './AIChatPanel.css';

const AIRubricChatPanel = ({ courseId, assignmentContext, onRubricAccepted, isOpen, onToggle }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRubric, setPendingRubric] = useState(null);
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

  useEffect(() => {
    if (courseId) {
      aiService.getCourseStatus(courseId)
        .then(data => setAiStatus(data))
        .catch(() => setAiStatus({ available: false }));
    }
  }, [courseId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const handleSend = async () => {
    const prompt = inputText.trim();
    if (!prompt || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setInputText('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({ role: m.role, content: m.content }));
      const result = await aiService.generateRubric(prompt, conversationHistory, courseId, assignmentContext);

      const assistantMessage = {
        role: 'assistant',
        content: result.message || 'Here is the generated rubric.',
        rubric: result.rubric || null,
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (result.rubric) {
        setPendingRubric(result.rubric);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to generate rubric. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg, isError: true }]);
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

  const handleRubricApproved = (rubricData) => {
    setPendingRubric(null);
    onRubricAccepted(rubricData);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Rubric "${rubricData.title}" with ${rubricData.criteria.length} criteria has been accepted.`,
    }]);
  };

  const handleReset = () => {
    setMessages([]);
    setPendingRubric(null);
  };

  if (!isOpen) {
    return (
      <button className="ai-panel-toggle" onClick={onToggle} title="AI Rubric Generator">
        <span className="ai-panel-toggle-icon">AI</span>
      </button>
    );
  }

  return (
    <div className="ai-chat-panel">
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <span className="ai-icon">AI</span>
          <span>Rubric Generator</span>
        </div>
        <div className="ai-panel-actions">
          <button className="ai-btn-icon" onClick={() => setShowSyllabus(!showSyllabus)} title="Course context">
            {showSyllabus ? 'Chat' : 'Context'}
          </button>
          {messages.length > 0 && (
            <button className="ai-btn-icon" onClick={handleReset} title="New conversation">Reset</button>
          )}
          <button className="ai-btn-icon ai-btn-close" onClick={onToggle} title="Close">X</button>
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
              <div className="ai-message ai-message-system">{aiDisabledReason}</div>
            )}
            {messages.length === 0 && aiAvailable && (
              <div className="ai-message ai-message-system">
                Describe the rubric you need. For example:
                <br /><br />
                "Create a rubric for a 100-point research paper with criteria for thesis, evidence, analysis, and writing quality"
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`ai-message ai-message-${msg.role} ${msg.isError ? 'ai-message-error' : ''}`}>
                <div className="ai-message-content">{msg.content}</div>
                {msg.rubric && (
                  <button
                    className="btn btn-secondary ai-review-btn"
                    onClick={() => setPendingRubric(msg.rubric)}
                  >
                    Review Rubric ({msg.rubric.criteria?.length || 0} criteria)
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
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={!aiAvailable ? 'AI not configured...' : 'Describe the rubric you need...'}
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

      {pendingRubric && (
        <AIRubricReview
          rubric={pendingRubric}
          onAccept={handleRubricApproved}
          onClose={() => setPendingRubric(null)}
        />
      )}
    </div>
  );
};

export default AIRubricChatPanel;
