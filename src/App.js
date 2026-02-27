import React from 'react'
import { HashRouter,Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DashboardLayout from './components/DashboardLayout'
import Profile from './pages/Profile'
import History from './pages/History'
import Record from './pages/Record'
import Receivables from './pages/Receivables'

function App() {
  return (
<HashRouter>
<Routes>
  <Route path="/" element={<Home />} />

  <Route path = "/register" element={<Register/>}/>


  <Route path="/login" element={<Login/>}/>

  <Route path="/dashboard" element ={<DashboardLayout/>}>
    <Route index element={<Dashboard/>} />
    <Route path="profile" element={<Profile/>} />
    <Route path="history" element={<History/>} />
    <Route path="record" element={<Record/>} />
    <Route path="receivables" element={<Receivables/>} />
  </Route>

</Routes>
</HashRouter>
  )
}

export default App
