import React, { useState, useContext } from "react";
import { AuthContext } from "../context/auth.context";
import authService from "../services/auth.service";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await authService.login(username, password, login);
      navigate("/office-management/office-list"); // Redirect after successful login
    } catch (err) {
      console.error("Login failed:", err.message);
      if(err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="login_full_page">
      <div className="login_outer">
        <img src={`${import.meta.env.VITE_REACT_APP_STATIC_PATH}/images/logo.png`} alt="ENTA" />
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleLogin}>
          <ul className="form_field">
            <li className="no_gap">
              <div className="input text required">
                <label htmlFor="username"></label>
                <input
                  type="text"
                  id="username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </li>
            <li className="gap_btm1">
              <div className="input password required">
                <label htmlFor="password"></label>
                <input
                  type="password"
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </li>
            <li>
              <button className="button" type="submit">
                Login
              </button>
              &nbsp;&nbsp;
              <button className="button" type="reset">
                Reset
              </button>
            </li>
          </ul>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
