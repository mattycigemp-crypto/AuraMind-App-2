import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div style={{ 
      backgroundColor: '#0d1515', 
      color: '#dbfcff', 
      padding: '40px',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>AuraMind Test Page</h1>
      <p>If you can see this, the basic rendering is working!</p>
      <button style={{
        backgroundColor: '#8B5CF6',
        color: '#00363a',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: 'pointer'
      }}>
        Test Button
      </button>
    </div>
  );
};

export default TestPage;


