import React, { useState } from 'react';

const WorkingDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const navigationOptions = [
    { id: 'dashboard', label: 'Main Dashboard' },
    { id: 'cards', label: 'Cards & Decks' },
    { id: 'chat', label: 'AI Chat' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div 
      style={{ 
        minHeight: '100vh',
        backgroundColor: '#808080',
        fontFamily: 'Arial, sans-serif',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* Navigation Tabs */}
      <div 
        style={{ 
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          zIndex: '1000',
          backgroundColor: '#c0c0c0',
          borderBottom: '4px solid #00ffff',
          boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
          padding: '20px'
        }}
      >
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px'
          }}
        >
          {navigationOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveSection(option.id)}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                fontWeight: 'bold',
                backgroundColor: activeSection === option.id ? '#00ffff' : '#ffffff',
                color: activeSection === option.id ? '#000000' : '#000000',
                border: activeSection === option.id ? '3px solid #000000' : '2px solid #cccccc',
                borderRadius: '10px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                boxShadow: activeSection === option.id ? '0 4px 12px rgba(0,255,255,0.5)' : '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ paddingTop: '120px', padding: '40px' }}>
        {activeSection === 'dashboard' && (
          <div 
            style={{ 
              backgroundColor: '#ffffff',
              padding: '40px',
              borderRadius: '20px',
              margin: '20px auto',
              maxWidth: '1200px',
              border: '4px solid #00ffff',
              boxShadow: '0 8px 32px rgba(0,255,255,0.3)'
            }}
          >
            <h1 
              style={{ 
                fontSize: '56px', 
                fontWeight: 'bold', 
                color: '#00ffff', 
                marginBottom: '20px',
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              MAIN DASHBOARD
            </h1>
            <p 
              style={{ 
                color: '#333333', 
                fontSize: '24px',
                textAlign: 'center',
                marginBottom: '40px'
              }}
            >
              Welcome to your AuraMind dashboard
            </p>
            
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '30px',
                marginTop: '40px'
              }}
            >
              <div 
                style={{ 
                  backgroundColor: '#00ffff', 
                  padding: '30px', 
                  borderRadius: '15px', 
                  border: '4px solid #000000',
                  textAlign: 'center',
                  boxShadow: '0 6px 20px rgba(0,255,255,0.4)'
                }}
              >
                <h3 
                  style={{ 
                    color: '#000000', 
                    marginBottom: '10px', 
                    fontSize: '24px', 
                    fontWeight: 'bold' 
                  }}
                >
                  ✨ DASHBOARD ACTIVE
                </h3>
                <p style={{ color: '#000000', fontSize: '18px' }}>
                  Your main workspace is ready
                </p>
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#f0f0f0', 
                  padding: '30px', 
                  borderRadius: '15px', 
                  border: '3px solid #00ffff',
                  textAlign: 'center'
                }}
              >
                <h3 
                  style={{ 
                    color: '#00ffff', 
                    marginBottom: '10px', 
                    fontSize: '24px', 
                    fontWeight: 'bold' 
                  }}
                >
                  📊 STATISTICS
                </h3>
                <p style={{ color: '#333333', fontSize: '18px' }}>
                  Track your learning progress
                </p>
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#f0f0f0', 
                  padding: '30px', 
                  borderRadius: '15px', 
                  border: '3px solid #00ffff',
                  textAlign: 'center'
                }}
              >
                <h3 
                  style={{ 
                    color: '#00ffff', 
                    marginBottom: '10px', 
                    fontSize: '24px', 
                    fontWeight: 'bold' 
                  }}
                >
                  🎯 GOALS
                </h3>
                <p style={{ color: '#333333', fontSize: '18px' }}>
                  Set and achieve your targets
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'cards' && (
          <div 
            style={{ 
              backgroundColor: '#ffffff',
              padding: '40px',
              borderRadius: '20px',
              margin: '20px auto',
              maxWidth: '1200px',
              border: '4px solid #ff00ff',
              boxShadow: '0 8px 32px rgba(255,0,255,0.3)'
            }}
          >
            <h1 
              style={{ 
                fontSize: '56px', 
                fontWeight: 'bold', 
                color: '#ff00ff', 
                marginBottom: '20px',
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              CARDS & DECKS
            </h1>
            <p 
              style={{ 
                color: '#333333', 
                fontSize: '24px',
                textAlign: 'center',
                marginBottom: '40px'
              }}
            >
              Manage your flashcards and decks
            </p>
            
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '30px',
                marginTop: '40px'
              }}
            >
              <div 
                style={{ 
                  backgroundColor: '#ff00ff', 
                  padding: '30px', 
                  borderRadius: '15px', 
                  border: '4px solid #000000',
                  textAlign: 'center',
                  boxShadow: '0 6px 20px rgba(255,0,255,0.4)'
                }}
              >
                <h3 
                  style={{ 
                    color: '#000000', 
                    marginBottom: '10px', 
                    fontSize: '24px', 
                    fontWeight: 'bold' 
                  }}
                >
                  📚 CARD MANAGEMENT
                </h3>
                <p style={{ color: '#000000', fontSize: '18px' }}>
                  Create and organize your learning materials
                </p>
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#f0f0f0', 
                  padding: '30px', 
                  borderRadius: '15px', 
                  border: '3px solid #ff00ff',
                  textAlign: 'center'
                }}
              >
                <h3 
                  style={{ 
                    color: '#ff00ff', 
                    marginBottom: '10px', 
                    fontSize: '24px', 
                    fontWeight: 'bold' 
                  }}
                >
                  📁 DECK LIBRARY
                </h3>
                <p style={{ color: '#333333', fontSize: '18px' }}>
                  Browse your collection of decks
                </p>
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#f0f0f0', 
                  padding: '30px', 
                  borderRadius: '15px', 
                  border: '3px solid #ff00ff',
                  textAlign: 'center'
                }}
              >
                <h3 
                  style={{ 
                    color: '#ff00ff', 
                    marginBottom: '10px', 
                    fontSize: '24px', 
                    fontWeight: 'bold' 
                  }}
                >
                  📈 PROGRESS TRACKING
                </h3>
                <p style={{ color: '#333333', fontSize: '18px' }}>
                  Monitor your learning journey
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'chat' && (
          <div 
            style={{ 
              backgroundColor: '#ffffff',
              padding: '40px',
              borderRadius: '20px',
              margin: '20px auto',
              maxWidth: '1200px',
              border: '4px solid #ff6b6b',
              boxShadow: '0 8px 32px rgba(255,107,107,0.3)'
            }}
          >
            <h1 
              style={{ 
                fontSize: '56px', 
                fontWeight: 'bold', 
                color: '#ff6b6b', 
                marginBottom: '20px',
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              AI CHAT
            </h1>
            <p 
              style={{ 
                color: '#333333', 
                fontSize: '24px',
                textAlign: 'center',
                marginBottom: '40px'
              }}
            >
              Chat with your AI study assistant
            </p>
            
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '30px',
                marginTop: '40px'
              }}
            >
              <div 
                style={{ 
                  backgroundColor: '#ff6b6b', 
                  padding: '30px', 
                  borderRadius: '15px', 
                  border: '4px solid #000000',
                  textAlign: 'center',
                  boxShadow: '0 6px 20px rgba(255,107,107,0.4)'
                }}
              >
                <h3 
                  style={{ 
                    color: '#000000', 
                    marginBottom: '10px', 
                    fontSize: '24px', 
                    fontWeight: 'bold' 
                  }}
                >
                  🤖 AI ASSISTANT
                </h3>
                <p style={{ color: '#000000', fontSize: '18px' }}>
                  Get help with your learning journey
                </p>
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#f0f0f0', 
                  padding: '30px', 
                  borderRadius: '15px', 
                  border: '3px solid #ff6b6b',
                  textAlign: 'center'
                }}
              >
                <h3 
                  style={{ 
                    color: '#ff6b6b', 
                    marginBottom: '10px', 
                    fontSize: '24px', 
                    fontWeight: 'bold' 
                  }}
                >
                  💬 CHAT HISTORY
                </h3>
                <p style={{ color: '#333333', fontSize: '18px' }}>
                  Review your conversations
                </p>
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#f0f0f0', 
                  padding: '30px', 
                  borderRadius: '15px', 
                  border: '3px solid #ff6b6b',
                  textAlign: 'center'
                }}
              >
                <h3 
                  style={{ 
                    color: '#ff6b6b', 
                    marginBottom: '10px', 
                    fontSize: '24px', 
                    fontWeight: 'bold' 
                  }}
                >
                  🎓 STUDY HELP
                </h3>
                <p style={{ color: '#333333', fontSize: '18px' }}>
                  Personalized learning support
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div 
            style={{ 
              backgroundColor: '#ffffff',
              padding: '40px',
              borderRadius: '20px',
              margin: '20px auto',
              maxWidth: '1200px',
              border: '4px solid #4a4a4a',
              boxShadow: '0 8px 32px rgba(74,74,74,0.3)'
            }}
          >
            <h1 
              style={{ 
                fontSize: '56px', 
                fontWeight: 'bold', 
                color: '#4a4a4a', 
                marginBottom: '20px',
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              SETTINGS
            </h1>
            <p 
              style={{ 
                color: '#333333', 
                fontSize: '24px',
                textAlign: 'center',
                marginBottom: '40px'
              }}
            >
              Configure your preferences
            </p>
            
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '30px',
                marginTop: '40px'
              }}
            >
              <div 
                style={{ 
                  backgroundColor: '#4a4a4a', 
                  padding: '30px', 
                  borderRadius: '15px', 
                  border: '4px solid #000000',
                  textAlign: 'center',
                  boxShadow: '0 6px 20px rgba(74,74,74,0.4)'
                }}
              >
                <h3 
                  style={{ 
                    color: '#ffffff', 
                    marginBottom: '10px', 
                    fontSize: '24px', 
                    fontWeight: 'bold' 
                  }}
                >
                  ⚙️ PREFERENCES
                </h3>
                <p style={{ color: '#ffffff', fontSize: '18px' }}>
                  Customize your AuraMind experience
                </p>
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#f0f0f0', 
                  padding: '30px', 
                  borderRadius: '15px', 
                  border: '3px solid #4a4a4a',
                  textAlign: 'center'
                }}
              >
                <h3 
                  style={{ 
                    color: '#4a4a4a', 
                    marginBottom: '10px', 
                    fontSize: '24px', 
                    fontWeight: 'bold' 
                  }}
                >
                  👤 PROFILE
                </h3>
                <p style={{ color: '#333333', fontSize: '18px' }}>
                  Manage your account details
                </p>
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#f0f0f0', 
                  padding: '30px', 
                  borderRadius: '15px', 
                  border: '3px solid #4a4a4a',
                  textAlign: 'center'
                }}
              >
                <h3 
                  style={{ 
                    color: '#4a4a4a', 
                    marginBottom: '10px', 
                    fontSize: '24px', 
                    fontWeight: 'bold' 
                  }}
                >
                  🔒 PRIVACY
                </h3>
                <p style={{ color: '#333333', fontSize: '18px' }}>
                  Control your data and security
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkingDashboard;


