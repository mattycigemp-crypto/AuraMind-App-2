import React, { useState } from 'react';

const BrightDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const navigationOptions = [
    { id: 'dashboard', label: 'Main Dashboard' },
    { id: 'cards', label: 'Cards & Decks' },
    { id: 'chat', label: 'AI Chat' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div style={{ 
      backgroundColor: '#FFFFFF', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      {/* Navigation Tabs */}
      <div style={{ 
        backgroundColor: '#000000', 
        padding: '20px',
        marginBottom: '20px',
        borderRadius: '10px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '20px' 
        }}>
          {navigationOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveSection(option.id)}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                fontWeight: 'bold',
                backgroundColor: activeSection === option.id ? '#FF0000' : '#FFFF00',
                color: '#000000',
                border: '3px solid #000000',
                borderRadius: '8px',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        backgroundColor: '#000000', 
        padding: '40px',
        borderRadius: '10px',
        color: '#FFFFFF'
      }}>
        {activeSection === 'dashboard' && (
          <div>
            <h1 style={{ 
              fontSize: '60px', 
              color: '#00FF00', 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              MAIN DASHBOARD
            </h1>
            <p style={{ 
              fontSize: '24px', 
              color: '#FFFF00', 
              textAlign: 'center',
              marginBottom: '30px'
            }}>
              Welcome to your AuraMind dashboard
            </p>
            <div style={{ 
              backgroundColor: '#FF0000', 
              padding: '30px',
              borderRadius: '10px',
              textAlign: 'center',
              border: '5px solid #FFFFFF'
            }}>
              <h2 style={{ color: '#FFFFFF', fontSize: '30px' }}>
                ✨ DASHBOARD ACTIVE ✨
              </h2>
              <p style={{ color: '#000000', fontSize: '20px', fontWeight: 'bold' }}>
                Your main workspace is ready
              </p>
            </div>
          </div>
        )}

        {activeSection === 'cards' && (
          <div>
            <h1 style={{ 
              fontSize: '60px', 
              color: '#FF00FF', 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              CARDS & DECKS
            </h1>
            <p style={{ 
              fontSize: '24px', 
              color: '#00FFFF', 
              textAlign: 'center',
              marginBottom: '30px'
            }}>
              Manage your flashcards and decks
            </p>
            <div style={{ 
              backgroundColor: '#FF00FF', 
              padding: '30px',
              borderRadius: '10px',
              textAlign: 'center',
              border: '5px solid #FFFFFF'
            }}>
              <h2 style={{ color: '#FFFFFF', fontSize: '30px' }}>
                📚 CARD MANAGEMENT 📚
              </h2>
              <p style={{ color: '#000000', fontSize: '20px', fontWeight: 'bold' }}>
                Create and organize your learning materials
              </p>
            </div>
          </div>
        )}

        {activeSection === 'chat' && (
          <div>
            <h1 style={{ 
              fontSize: '60px', 
              color: '#00FFFF', 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              AI CHAT
            </h1>
            <p style={{ 
              fontSize: '24px', 
              color: '#FF00FF', 
              textAlign: 'center',
              marginBottom: '30px'
            }}>
              Chat with your AI study assistant
            </p>
            <div style={{ 
              backgroundColor: '#00FFFF', 
              padding: '30px',
              borderRadius: '10px',
              textAlign: 'center',
              border: '5px solid #FFFFFF'
            }}>
              <h2 style={{ color: '#000000', fontSize: '30px' }}>
                🤖 AI ASSISTANT 🤖
              </h2>
              <p style={{ color: '#FF0000', fontSize: '20px', fontWeight: 'bold' }}>
                Get help with your learning journey
              </p>
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div>
            <h1 style={{ 
              fontSize: '60px', 
              color: '#FFFF00', 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              SETTINGS
            </h1>
            <p style={{ 
              fontSize: '24px', 
              color: '#00FF00', 
              textAlign: 'center',
              marginBottom: '30px'
            }}>
              Configure your preferences
            </p>
            <div style={{ 
              backgroundColor: '#FFFF00', 
              padding: '30px',
              borderRadius: '10px',
              textAlign: 'center',
              border: '5px solid #000000'
            }}>
              <h2 style={{ color: '#000000', fontSize: '30px' }}>
                ⚙️ PREFERENCES ⚙️
              </h2>
              <p style={{ color: '#FF0000', fontSize: '20px', fontWeight: 'bold' }}>
                Customize your AuraMind experience
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrightDashboard;


