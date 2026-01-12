import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    role: 'student',
    student_id: '',
    employee_id: '',
    date_of_birth: '',
    department: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate role-specific fields
    if (formData.role === 'student' && !formData.student_id) {
      setError('Student ID is required for student registration');
      setLoading(false);
      return;
    }

    if ((formData.role === 'teacher' || formData.role === 'admin') && !formData.employee_id) {
      setError('Employee ID is required for teacher/admin registration');
      setLoading(false);
      return;
    }

    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0e9f23e3-2830-4e0f-950b-18a18264dff5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegisterPage.js:57',message:'Registration attempt',data:{role:formData.role,hasDateOfBirth:!!formData.date_of_birth,dateOfBirthValue:formData.date_of_birth,employeeId:formData.employee_id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C'})}).catch(()=>{});
      // #endregion
      await register(formData);
      setSuccess('Registration successful! Please login.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0e9f23e3-2830-4e0f-950b-18a18264dff5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegisterPage.js:64',message:'Registration error caught',data:{errorResponse:err.response?.data,status:err.response?.status,role:formData.role},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C,D'})}).catch(()=>{});
      // #endregion
      const errorMessage = err.response?.data;
      if (typeof errorMessage === 'object') {
        const firstError = Object.values(errorMessage)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Register for Syllabex</h1>
        
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              minLength="8"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password_confirm">Confirm Password</label>
            <input
              id="password_confirm"
              type="password"
              name="password_confirm"
              value={formData.password_confirm}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          {formData.role === 'student' && (
            <>
              <div className="form-group">
                <label htmlFor="student_id">Student ID</label>
                <input
                  id="student_id"
                  type="text"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleChange}
                  required
                  placeholder="Enter your student ID"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="date_of_birth">Date of Birth</label>
                <input
                  id="date_of_birth"
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                />
              </div>
            </>
          )}
          
          {(formData.role === 'teacher' || formData.role === 'admin') && (
            <>
              <div className="form-group">
                <label htmlFor="employee_id">Employee ID</label>
                <input
                  id="employee_id"
                  type="text"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  required
                  placeholder="Enter your employee ID"
                />
              </div>
              
              {formData.role === 'teacher' && (
                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <input
                    id="department"
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Enter your department"
                  />
                </div>
              )}
            </>
          )}
          
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
