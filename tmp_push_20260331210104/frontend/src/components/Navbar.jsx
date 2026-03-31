// src/components/Navbar.jsx - FIXED VERSION

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';   // adjust path if needed

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Smart Hostel Management System</h1>
        {user ? (
          <nav>
            <ul>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/complaints">Complaints</Link></li>
              <li><Link to="/notices">Notices</Link></li>
              <li><button onClick={logout}>Logout</button></li>
            </ul>
          </nav>
        ) : (
          <nav>
            <ul>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Navbar;   // ← This line is crucial!