import React from 'react';
import {Link} from "react-router-dom";
import Lunch from "../assets/Lunch.png"


function Home() {
  return (
    <div className="home-page">
      <div className="home-split">
        <div className="home-image-panel">
          <img
            src={Lunch}
            alt="Friends splitting lunch bill together"
            className="home-hero-image"
          />
        </div>
        <div className="home-card">
          <h1>Welcome to KhajaTracker</h1>
          <p>
            If you are having problems every day splitting your office lunch
            expenses, you have arrived at the right place.
          </p>
          <div className="home-actions">
            <Link to="/register" className="primary-btn">Register</Link>
            <Link to="/login" className="secondary-btn">Login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
