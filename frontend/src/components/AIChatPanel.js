import React, { useState, useRef, useEffect } from 'react';
import aiService from '../services/aiService';
import AIQuestionReview from './AIQuestionReview';
import SyllabusUpload from './SyllabusUpload';
import './AIChatPanel.css';

const AIChatPanel = ({ courseId, assignmentContext, onQuestionsAccepted, isOpen, onToggle }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState(null);
  const [aiStatus, setAiStatus] = useState(null); // null=loading, object=loaded
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
          ? 'AI assistant is not enabled for this course. An admin can enable it in course settings.'
          : 'AI assistant is unavailable.'
    : null;

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
      // Build conversation history (exclude system messages)
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const result = await aiService.generateQuestions(
        prompt,
        conversationHistory,
        courseId,
        assignmentContext
      );

      const assistantMessage = {
        role: 'assistant',
        content: result.message || 'Here are the generated questions.',
        questions: result.questions || [],
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (result.questions && result.questions.length > 0) {
        setPendingQuestions(result.questions);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to generate questions. Please try again.';
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
    setPendingQuestions(null);
  };

  const handleQuestionsApproved = (approvedQuestions) => {
    setPendingQuestions(null);
    onQuestionsAccepted(approvedQuestions);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `${approvedQuestions.length} question${approvedQuestions.length !== 1 ? 's' : ''} added to the assignment.`,
    }]);
  };

  const handleReset = () => {
    setMessages([]);
    setPendingQuestions(null);
  };

  if (!isOpen) {
    return (
      <button className="ai-panel-toggle" onClick={onToggle} title="AI Assistant">
        <span className="ai-panel-toggle-icon">AI</span>
      </button>
    );
  }

  return (
    <div className="ai-chat-panel">
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <span className="ai-icon">AI</span>
          <span>Assignment Assistant</span>
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
                Describe the questions you want to create. For example:
                <br /><br />
                "Create 10 multiple choice questions on time value of money, 10 points each"
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`ai-message ai-message-${msg.role} ${msg.isError ? 'ai-message-error' : ''}`}
              >
                <div className="ai-message-content">{msg.content}</div>
                {msg.questions && msg.questions.length > 0 && (
                  <button
                    className="btn btn-secondary ai-review-btn"
                    onClick={() => setPendingQuestions(msg.questions)}
                  >
                    Review {msg.questions.length} Question{msg.questions.length !== 1 ? 's' : ''}
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
              placeholder={!aiAvailable ? 'AI not configured...' : 'Describe what questions to create...'}
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

      {pendingQuestions && (
        <AIQuestionReview
          questions={pendingQuestions}
          onAccept={handleQuestionsApproved}
          onClose={handleReviewClose}
        />
      )}
    </div>
  );
};

export default AIChatPanel;
