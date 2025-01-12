"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import './Register.css';

interface FormState {
  username: string;
  email: string;
  password1: string;
  password2: string;
  role: string;
}

const Register: React.FC = () => {
  const [form, setForm] = useState<FormState>({
    username: '',
    email: '',
    password1: '',
    password2: '',
    role: '',
  });
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Hardcoded base URL for API requests (bypassing Next.js rewrites)
  const API_BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        console.log('Starting roles fetch...');
        const response = await fetch(`${API_BASE_URL}/api/roles/`);

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Error response body:', errorText);
          throw new Error(`Error fetching roles: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('Response data:', data);

        setRoles(data.roles);

        if (data.roles.length > 0) {
          setForm((prevForm) => ({ ...prevForm, role: data.roles[0] }));
        }
      } catch (err: any) {
        console.error('Full error:', err);
        setError('Failed to load roles.');
      }
    };

    fetchRoles();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (form.password1 !== form.password2) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Registration failed');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <div className="logo">
        <img src="/media/logo.png" alt="Syllabex Logo" />
      </div>
      <p>Create your first Syllabex course generated from your syllabus.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="id_username">Username</label>
          <input
            type="text"
            id="id_username"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="id_email">Email address</label>
          <input
            type="email"
            id="id_email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="id_password1">Password</label>
          <input
            type="password"
            id="id_password1"
            name="password1"
            value={form.password1}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="id_password2">Confirm Password</label>
          <input
            type="password"
            id="id_password2"
            name="password2"
            value={form.password2}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="id_role">Role</label>
          <select
            id="id_role"
            name="role"
            value={form.role}
            onChange={handleChange}
            required
          >
            {roles.length > 0 ? (
              roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))
            ) : (
              <option disabled>Loading roles...</option>
            )}
          </select>
        </div>
        <button type="submit" className="btn">
          Create Account
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Registration successful!</p>}

      <div className="login-link">
        Already have an account? <a href="/login">Login</a>
      </div>
    </div>
  );
};

export default Register;
