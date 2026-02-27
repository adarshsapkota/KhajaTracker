import React from 'react';
import {Link} from "react-router-dom";

function Home() {
  return (
    <div className="home-page">
      <div className="home-card">
        <h1>KhajaExpense</h1>
        <p>Split everyday office lunch bills and track balances for your team.</p>
        <div className="home-actions">
          <Link to="/register" className="primary-btn">Register</Link>
          <Link to="/login" className="secondary-btn">Login</Link>
        </div>
      </div>
    </div>
  )
}

export default Home
