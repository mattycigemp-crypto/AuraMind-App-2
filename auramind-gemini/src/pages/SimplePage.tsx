import React from 'react';

const SimplePage: React.FC = () => {
  return (
    <div style={{ 
      backgroundColor: '#0d1515', 
      color: '#dbfcff', 
      padding: '40px',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1>AuraMind Dashboard</h1>
      <p>Your app is working!</p>
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginTop: '20px' 
      }}>
        <button style={{
          backgroundColor: '#8B5CF6',
          color: '#00363a',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer'
        }}>
          Dashboard
        </button>
        <button style={{
          backgroundColor: '#d0bcff',
          color: '#3c0091',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer'
        }}>
          Cards
        </button>
        <button style={{
          backgroundColor: '#fff3f2',
          color: '#67001b',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer'
        }}>
          AI Chat
        </button>
        <button style={{
          backgroundColor: '#a1a1aa',
          color: '#ffffff',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer'
        }}>
          Settings
        </button>
      </div>
    </div>
  );
};

export default SimplePage;


