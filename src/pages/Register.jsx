import React, {useState} from 'react';
import { Link } from 'react-router-dom';
import supabase from "../helper/supabaseClient";
import Lunch from "../assets/Lunch.png"
function Register() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) {
      setMessage("Enter a username");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
      setMessage("Username must be 3-20 chars: lowercase letters, numbers, underscore");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Password and confirm password do not match");
      return;
    }

    const {data,error} = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: normalizedUsername,
        },
      },
    });

    if(error) {
      setMessage(error.message)
      return
    }

    if(data){
      setMessage("Account created. Verify your email before login.");
    }
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }
  return (
    <div className="auth-page">
      <div className="auth-split">
        <div className="auth-image-panel">
          <img
            src={Lunch}
            alt="Team enjoying lunch together"
            className="auth-hero-image"
          />
        </div>
        <div className="auth-card">
          <h2>Register</h2>
          <p className="muted">Create an account</p>
          {message && <p className="form-message auth-message">{message}</p>}
          <form onSubmit={handleSubmit} className="auth-form">
            <input
              type="text"
              placeholder='Username'
              required
              onChange={(e)=> setUsername(e.target.value)}
              value={username}
            />
            <input 
              type="email" 
              placeholder='Email'
              required
              onChange={(e)=> setEmail(e.target.value)}
              value={email}
            />

            <input
              required
              onChange={(e)=> setPassword(e.target.value)} 
              value={password}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
            />
            <input
              required
              onChange={(e)=> setConfirmPassword(e.target.value)} 
              value={confirmPassword}
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
            />
            <label className="auth-show-password">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <span>Show password</span>
            </label>
            <button type="submit" className="primary-btn">Create Account</button>
          </form>
          <div className="auth-inline">
            <span>Already have an account?</span>
            <Link to="/login">LogIn</Link>
          </div>
        </div>
      </div> 
    </div>
  )
}

export default Register
