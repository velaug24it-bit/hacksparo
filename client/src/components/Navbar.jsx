import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, ClipboardList, UtensilsCrossed, Radio, Map, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header style={{
      backgroundColor: '#0f172a',
      borderBottom: '1px solid #1e293b',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem'
      }}>
        {/* Brand & Live Mesh Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <NavLink
            to="/"
            onClick={closeMobileMenu}
            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', color: '#f8fafc' }}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              flexShrink: 0
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.375rem', lineHeight: 1.2 }}>
                CrisisCare Mesh
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Green SOS & Yellow Mesh</div>
            </div>
          </NavLink>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.2rem 0.5rem',
            borderRadius: 9999,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: '#34d399'
          }}>
            <span className="status-dot status-dot-green"></span>
            <span>LIVE</span>
          </div>
        </div>

        {/* Desktop Navigation Items */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.7rem',
              borderRadius: 8,
              fontSize: '0.825rem',
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? '#34d399' : '#94a3b8',
              backgroundColor: isActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent'
            })}
          >
            <span>🟢</span>
            <span>Resource Assistance</span>
          </NavLink>

          <NavLink
            to="/mesh-relay"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.7rem',
              borderRadius: 8,
              fontSize: '0.825rem',
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? '#facc15' : '#94a3b8',
              backgroundColor: isActive ? 'rgba(250, 204, 21, 0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(250, 204, 21, 0.35)' : '1px solid transparent'
            })}
          >
            <span>🟡</span>
            <span>Mesh Relay</span>
          </NavLink>

          <NavLink
            to="/crisis-map"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.7rem',
              borderRadius: 8,
              fontSize: '0.825rem',
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? '#38bdf8' : '#94a3b8',
              backgroundColor: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent'
            })}
          >
            <Map size={14} />
            <span>Crisis Map</span>
          </NavLink>

          <NavLink
            to="/foodbridge"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.7rem',
              borderRadius: 8,
              fontSize: '0.825rem',
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? '#34d399' : '#94a3b8',
              backgroundColor: isActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent'
            })}
          >
            <UtensilsCrossed size={14} />
            <span>FoodBridge</span>
          </NavLink>

          <NavLink
            to="/requests"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.7rem',
              borderRadius: 8,
              fontSize: '0.825rem',
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? '#34d399' : '#94a3b8',
              backgroundColor: isActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent'
            })}
          >
            <ClipboardList size={14} />
            <span>Requests</span>
          </NavLink>
        </nav>

        {/* Mobile Hamburger Toggle Button */}
        <button
          className="mobile-nav-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
          style={{
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: 8,
            color: '#f8fafc',
            padding: '0.4rem',
            cursor: 'pointer',
            display: 'none', // Overridden in mobile media query
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isMobileMenuOpen ? <X size={22} className="text-yellow-400" /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {isMobileMenuOpen && (
        <div
          className="mobile-nav-drawer"
          style={{
            backgroundColor: '#090d16',
            borderTop: '1px solid #1e293b',
            borderBottom: '2px solid #334155',
            padding: '0.75rem 1rem 1.25rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <NavLink
            to="/"
            end
            onClick={closeMobileMenu}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 8,
              fontSize: '0.95rem',
              fontWeight: 700,
              textDecoration: 'none',
              color: isActive ? '#34d399' : '#f8fafc',
              backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
              border: isActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #1e293b'
            })}
          >
            <span style={{ fontSize: '1.2rem' }}>🟢</span>
            <div>
              <div>Green Resource SOS</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>Request emergency food, water & shelter</div>
            </div>
          </NavLink>

          <NavLink
            to="/mesh-relay"
            onClick={closeMobileMenu}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 8,
              fontSize: '0.95rem',
              fontWeight: 700,
              textDecoration: 'none',
              color: isActive ? '#facc15' : '#f8fafc',
              backgroundColor: isActive ? 'rgba(250, 204, 21, 0.15)' : '#0f172a',
              border: isActive ? '1px solid rgba(250, 204, 21, 0.4)' : '1px solid #1e293b'
            })}
          >
            <span style={{ fontSize: '1.2rem' }}>🟡</span>
            <div>
              <div>Yellow Mesh Relay (NSL-02)</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>Off-grid QR packets & courier carrier bag</div>
            </div>
          </NavLink>

          <NavLink
            to="/crisis-map"
            onClick={closeMobileMenu}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 8,
              fontSize: '0.95rem',
              fontWeight: 700,
              textDecoration: 'none',
              color: isActive ? '#38bdf8' : '#f8fafc',
              backgroundColor: isActive ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
              border: isActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #1e293b'
            })}
          >
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              backgroundColor: 'rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <Map size={16} />
            </div>
            <div>
              <div>Crisis Radar Map</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>Geospatial shelters & surplus food donor pins</div>
            </div>
          </NavLink>

          <NavLink
            to="/foodbridge"
            onClick={closeMobileMenu}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 8,
              fontSize: '0.95rem',
              fontWeight: 700,
              textDecoration: 'none',
              color: isActive ? '#34d399' : '#f8fafc',
              backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
              border: isActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #1e293b'
            })}
          >
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981'
            }}>
              <UtensilsCrossed size={16} />
            </div>
            <div>
              <div>FoodBridge Surplus Matching</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>Match & register real community food surplus</div>
            </div>
          </NavLink>

          <NavLink
            to="/requests"
            onClick={closeMobileMenu}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 8,
              fontSize: '0.95rem',
              fontWeight: 700,
              textDecoration: 'none',
              color: isActive ? '#34d399' : '#f8fafc',
              backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
              border: isActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #1e293b'
            })}
          >
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              backgroundColor: 'rgba(148, 163, 184, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cbd5e1'
            }}>
              <ClipboardList size={16} />
            </div>
            <div>
              <div>Requests Registry</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>Live status tracking & rescue timelines</div>
            </div>
          </NavLink>
        </div>
      )}
    </header>
  );
};

export default Navbar;
