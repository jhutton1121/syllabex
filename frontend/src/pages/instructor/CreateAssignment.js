import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AssignmentForm from '../../components/AssignmentForm';
import assignmentService from '../../services/assignmentService';

const CreateAssignment = () => {
  const { assignmentId, courseId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(!!assignmentId);
  const [error, setError] = useState('');

  const isEdit = !!assignmentId;

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId) return;

      try {
        const data = await assignmentService.getAssignment(assignmentId);
        setAssignment(data);
      } catch (err) {
        setError('Failed to load assignment');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div className="loading-spinner-large" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading assignment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>Error</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>
        <button 
          onClick={() => navigate(-1)} 
          className="btn btn-primary"
          style={{
            padding: '0.625rem 1.25rem',
            fontSize: '0.9rem',
            fontWeight: '600',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <AssignmentForm 
        isEdit={isEdit} 
        assignment={assignment}
      />
    </div>
  );
};

export default CreateAssignment;
