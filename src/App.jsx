import { useState } from 'react';
import { MessageSquare, FileText } from 'lucide-react';
import DocumentUpload from './components/DocumentUpload';
import ChatInterface from './components/ChatInterface';
import './index.css';

function App() {
  const [activeView, setActiveView] = useState('chat');

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">Zoho AI Assistant</h1>
          <nav className="nav">
            <button
              className={`nav-btn ${activeView === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveView('chat')}
            >
              <MessageSquare size={18} />
              Chat
            </button>
            <button
              className={`nav-btn ${activeView === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveView('upload')}
            >
              <FileText size={18} />
              Documents
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        {activeView === 'upload' ? <DocumentUpload /> : <ChatInterface />}
      </main>
    </div>
  );
}

export default App;
