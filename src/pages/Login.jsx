import React,{useState} from 'react'
import supabase from '../helper/supabaseClient'
import {Link, useNavigate} from "react-router-dom";
import Lunch from "../assets/Lunch.png"

function Login() {
 const [email, setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState("")
   const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    const {data,error} = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if(error) {
      setMessage(error.message)
      return
    }

    if(data){
      navigate("/dashboard")
      return null;
    }
    setEmail("");
    setPassword("");
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
          <h2>LogIn</h2>
          <p className="muted">Sign in</p>
          {message && <p className="form-message auth-message">{message}</p>}
          <form onSubmit={handleSubmit} className="auth-form">
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
            <label className="auth-show-password">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <span>Show password</span>
            </label>
            <button type="submit" className="primary-btn">Log In</button>
          </form>
          <div className="auth-inline">
            <span>Don&apos;t have an account?</span>
            <Link to="/register">Register</Link>
          </div>
        </div>
      </div>
    </div>
  )
}


export default Login
