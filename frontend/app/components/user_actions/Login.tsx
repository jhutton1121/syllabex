"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "../types/jwtPayload"; 

interface UserMeResponse {
  username: string;
  role: string; // e.g. "STUDENT", "TEACHER", "ADMIN"
} 

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Hardcoded base URL for API requests (bypassing Next.js rewrites)
  const API_BASE_URL = 'http://localhost:8000';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error(`Login failed with status ${response.status}`);
      }

      const data = await response.json();
      // e.g. data = { access: "JWT_ACCESS_TOKEN", refresh?: "JWT_REFRESH_TOKEN" }
      const token = data.access as string;

      // Optionally store the token
      localStorage.setItem('token', token);

      // Decode the JWT to get user role (or other claims)
      const decoded: JwtPayload = jwtDecode<JwtPayload>(token);
      const userRole = decoded.role;

      // 3) Fetch user info from /api/user/me/ using the JWT
      const userRes = await fetch(`${API_BASE_URL}/api/user/me/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!userRes.ok) {
        throw new Error(`Failed to fetch user data: status ${userRes.status}`);
      }

      const userData = (await userRes.json()) as UserMeResponse;
      // Example userData => { username: "someuser", role: "TEACHER" }

      // Redirect based on role
      switch (userData.role) {
        case "ADMIN":
          router.push("/admin-dashboard");
          break;
        case "TEACHER":
          router.push("/teacher-dashboard");
          break;
        case "STUDENT":
          router.push("/student-dashboard");
          break;
        default:
          router.push("/"); 
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="container">
      <div className="logo">
        <img src="/media/logo.png" alt="Syllabex Logo" />
      </div>
      <h1 className="register-heading">Login</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            id="username"
            className="input-field"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            className="input-field"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" className="btn">
          Log In
        </button>
      </form>
    </div>
  );
}
