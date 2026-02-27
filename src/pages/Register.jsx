import React, {useState} from 'react';
import { Link } from 'react-router-dom';
import supabase from "../helper/supabaseClient";
function Register() {
  const [email, setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    const {data,error} = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if(error) {
      setMessage(error.message)
      return
    }

    if(data){
      setMessage("User account created sucessfully");
    }
    setEmail("");
    setPassword("");
  }
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Register</h2>
        <p className="muted">Create an account to store your lunch expense data in Supabase.</p>
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
            type="password" 
            placeholder="Password"
          />
          <button type="submit" className="primary-btn">Create Account</button>
        </form>
        <div className="auth-inline">
          <span>Already have an account?</span>
          <Link to="/login">LogIn</Link>
        </div>
      </div>
      
      
      
    </div>
  )
}

export default Register
