const { useState, useEffect, useRef } = React;

// Utility function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Format date
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'Yesterday';
  return date.toLocaleDateString();
}

// Toast Component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      <span>{message}</span>
    </div>
  );
}

// Toast Container
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Modal Component
function Modal({ title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Auth Screen Component
function AuthScreen({ onAuthenticate }) {
  const [password, setPassword] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState('');

  useEffect(() => {
    checkFirstTime();
  }, []);

  async function checkFirstTime() {
    try {
      await window.dbManager.init();
      const salt = await window.dbManager.getSetting('masterSalt');
      setIsFirstTime(!salt);
      setLoading(false);
    } catch (err) {
      setError('Failed to initialize database');
      setLoading(false);
    }
  }

  function handlePasswordChange(value) {
    setPassword(value);
    if (isFirstTime) {
      setPasswordStrength(window.cryptoService.getPasswordStrength(value));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (isFirstTime) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      try {
        const salt = window.cryptoService.generateSalt();
        const derivedKey = window.cryptoService.deriveKey(password, salt);
        
        await window.dbManager.saveSetting('masterSalt', salt);
        window.cryptoService.masterSalt = salt;
        window.cryptoService.setKey(derivedKey);
        
        onAuthenticate();
      } catch (err) {
        setError('Failed to set up encryption');
      }
    } else {
      try {
        const salt = await window.dbManager.getSetting('masterSalt');
        const derivedKey = window.cryptoService.deriveKey(password, salt);
        
        window.cryptoService.masterSalt = salt;
        window.cryptoService.setKey(derivedKey);
        
        // Try to decrypt a test note to verify password
        const notes = await window.dbManager.getAllNotes();
        if (notes.length > 0) {
          try {
            window.cryptoService.decrypt(notes[0].encryptedData, notes[0].iv);
          } catch (err) {
            setError('Incorrect password');
            return;
          }
        }
        
        onAuthenticate();
      } catch (err) {
        setError('Authentication failed');
      }
    }
  }

  if (loading) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1>🔒 Secure Notes</h1>
        <p>{isFirstTime ? 'Create your master password' : 'Enter your master password'}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Enter password"
              autoFocus
            />
            {isFirstTime && password && (
              <div className="password-strength">
                <div className={`password-strength-bar ${passwordStrength}`}></div>
              </div>
            )}
          </div>

          {isFirstTime && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary">
            {isFirstTime ? 'Create &amp; Continue' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const lastActivityRef = useRef(Date.now());

  // Load notes after authentication
  useEffect(() => {
    if (isAuthenticated) {
      loadNotes();
      setupActivityMonitor();
      setupKeyboardShortcuts();
    }
  }, [isAuthenticated]);

  // Activity monitor for auto-lock
  function setupActivityMonitor() {
    const checkActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current > 900000) { // 15 minutes
        handleLock();
      }
    };

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    document.addEventListener('mousemove', updateActivity);
    document.addEventListener('keypress', updateActivity);
    const interval = setInterval(checkActivity, 60000); // Check every minute

    return () => {
      document.removeEventListener('mousemove', updateActivity);
      document.removeEventListener('keypress', updateActivity);
      clearInterval(interval);
    };
  }

  // Keyboard shortcuts
  function setupKeyboardShortcuts() {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewNote();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.querySelector('.search-box input')?.focus();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentNote) {
          saveNote(currentNote);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        if (currentNote) {
          handleTogglePin();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }

  async function loadNotes() {
    try {
      const encryptedNotes = await window.dbManager.getAllNotes();
      const decryptedNotes = [];

      for (const encrypted of encryptedNotes) {
        try {
          const decrypted = window.cryptoService.decrypt(encrypted.encryptedData, encrypted.iv);
          decryptedNotes.push({ ...decrypted, _dbId: encrypted.id });
        } catch (err) {
          console.error('Failed to decrypt note:', encrypted.id);
        }
      }

      setNotes(decryptedNotes);
    } catch (err) {
      showToast('Failed to load notes', 'error');
    }
  }

  function handleNewNote() {
    const newNote = {
      id: generateUUID(),
      title: '',
      content: '',
      tags: [],
      isPinned: false,
      isArchived: false,
      created: Date.now(),
      modified: Date.now()
    };
    setCurrentNote(newNote);
  }

  function handleSelectNote(note) {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    setCurrentNote(note);
  }

  function handleNoteChange(field, value) {
    if (!currentNote) return;

    const updatedNote = {
      ...currentNote,
      [field]: value,
      modified: Date.now()
    };

    setCurrentNote(updatedNote);

    // Auto-save after 3 seconds
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    const timer = setTimeout(() => {
      saveNote(updatedNote);
    }, 3000);
    setAutoSaveTimer(timer);
  }

  async function saveNote(note) {
    try {
      const { encryptedData, iv } = window.cryptoService.encrypt(note);
      const dbNote = {
        id: note.id,
        encryptedData,
        iv,
        timestamp: note.modified
      };

      await window.dbManager.saveNote(dbNote);
      
      setNotes(prevNotes => {
        const index = prevNotes.findIndex(n => n.id === note.id);
        if (index >= 0) {
          const updated = [...prevNotes];
          updated[index] = note;
          return updated;
        }
        return [...prevNotes, note];
      });

      setLastSaved(Date.now());
      showToast('Note saved', 'success');
    } catch (err) {
      showToast('Failed to save note', 'error');
    }
  }

  function handleTogglePin() {
    if (!currentNote) return;
    const updated = { ...currentNote, isPinned: !currentNote.isPinned, modified: Date.now() };
    setCurrentNote(updated);
    saveNote(updated);
  }

  function handleToggleArchive() {
    if (!currentNote) return;
    const updated = { ...currentNote, isArchived: !currentNote.isArchived, modified: Date.now() };
    setCurrentNote(updated);
    saveNote(updated);
    showToast(updated.isArchived ? 'Note archived' : 'Note unarchived', 'success');
  }

  function handleDeleteNote() {
    if (!currentNote) return;
    setModal({
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await window.dbManager.deleteNote(currentNote.id);
          setNotes(prevNotes => prevNotes.filter(n => n.id !== currentNote.id));
          setCurrentNote(null);
          setModal(null);
          showToast('Note deleted', 'success');
        } catch (err) {
          showToast('Failed to delete note', 'error');
        }
      },
      onCancel: () => setModal(null),
      danger: true
    });
  }

  function handleAddTag(tag) {
    if (!currentNote || !tag.trim()) return;
    const tags = [...currentNote.tags, tag.trim()];
    handleNoteChange('tags', tags);
  }

  function handleRemoveTag(index) {
    if (!currentNote) return;
    const tags = currentNote.tags.filter((_, i) => i !== index);
    handleNoteChange('tags', tags);
  }

  async function handleExport() {
    try {
      const encryptedNotes = await window.dbManager.getAllNotes();
      const backup = window.cryptoService.exportBackup(encryptedNotes);
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `secure-notes-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup exported', 'success');
    } catch (err) {
      showToast('Failed to export backup', 'error');
    }
  }

  function handleLock() {
    setIsAuthenticated(false);
    setNotes([]);
    setCurrentNote(null);
    window.cryptoService.setKey(null);
    showToast('App locked', 'success');
  }

  function showToast(message, type = 'success') {
    const id = generateUUID();
    setToasts(prev => [...prev, { id, message, type }]);
  }

  function removeToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  // Filter and sort notes
  const filteredNotes = notes
    .filter(note => {
      if (filter === 'pinned') return note.isPinned && !note.isArchived;
      if (filter === 'archived') return note.isArchived;
      return !note.isArchived;
    })
    .filter(note => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return note.title.toLowerCase().includes(query) || 
             note.content.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.modified - a.modified;
    });

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticate={() => setIsAuthenticated(true)} />;
  }

  if (showSettings) {
    return (
      <div className="app-container">
        <div className="settings-panel" style={{ flex: 1, overflowY: 'auto' }}>
          <button className="btn btn-secondary" onClick={() => setShowSettings(false)} style={{ marginBottom: '20px', width: 'auto' }}>
            ← Back to Notes
          </button>
          
          <h2>Settings</h2>
          
          <div className="settings-section">
            <h3>Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{notes.length}</div>
                <div className="stat-label">Total Notes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{notes.filter(n => n.isPinned).length}</div>
                <div className="stat-label">Pinned</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{notes.filter(n => n.isArchived).length}</div>
                <div className="stat-label">Archived</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{notes.filter(n => !n.isArchived).length}</div>
                <div className="stat-label">Active</div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>Data Management</h3>
            <button className="btn btn-primary" onClick={handleExport} style={{ marginBottom: '10px' }}>Export Encrypted Backup</button>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Download all your notes as an encrypted JSON file</p>
          </div>

          <div className="settings-section">
            <h3>Security</h3>
            <button className="btn btn-secondary" onClick={handleLock}>Lock App</button>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '10px' }}>App automatically locks after 15 minutes of inactivity</p>
          </div>

          <div className="settings-section">
            <h3>About</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              <strong>Secure Notes</strong> - A privacy-focused note-taking app with client-side AES-256 encryption.
              All your notes are encrypted before being stored locally. Your master password never leaves your device.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="app-title">
            🔒 Secure Notes
            <button className="lock-btn" onClick={handleLock} title="Lock App">🔒</button>
          </div>
          
          <div className="search-box">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'pinned' ? 'active' : ''}`}
              onClick={() => setFilter('pinned')}
            >
              Pinned
            </button>
            <button
              className={`filter-btn ${filter === 'archived' ? 'active' : ''}`}
              onClick={() => setFilter('archived')}
            >
              Archived
            </button>
          </div>
        </div>

        <div className="notes-list">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              className={`note-card ${currentNote?.id === note.id ? 'active' : ''} ${note.isArchived ? 'archived' : ''}`}
              onClick={() => handleSelectNote(note)}
            >
              <div className="note-card-header">
                <div className="note-card-title">
                  {note.title || 'Untitled Note'}
                </div>
                {note.isPinned && <span className="pin-icon pinned">⭐</span>}
              </div>
              <div className="note-card-snippet">
                {note.content.substring(0, 100) || 'No content'}
              </div>
              <div className="note-card-date">{formatDate(note.modified)}</div>
            </div>
          ))}
          {filteredNotes.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </div>
          )}
        </div>

        <button className="new-note-btn" onClick={handleNewNote}>
          <span style={{ fontSize: '20px' }}>+</span> New Note
        </button>
      </div>

      {/* Center Editor */}
      <div className="editor-panel">
        {currentNote ? (
          <>
            <div className="editor-header">
              <input
                type="text"
                className="title-input"
                placeholder="Note title..."
                value={currentNote.title}
                onChange={(e) => handleNoteChange('title', e.target.value)}
              />
            </div>
            <div className="editor-container">
              <textarea
                className="editor-textarea"
                placeholder="Start typing your note..."
                value={currentNote.content}
                onChange={(e) => handleNoteChange('content', e.target.value)}
              />
            </div>
            <div className="editor-footer">
              <div>
                {currentNote.content.length} characters • {currentNote.content.split(/\s+/).filter(Boolean).length} words
              </div>
              <div>
                {lastSaved ? `Saved ${formatDate(lastSaved)}` : 'Not saved'}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h2>No note selected</h2>
            <p>Select a note from the list or create a new one</p>
          </div>
        )}
      </div>

      {/* Right Metadata Panel */}
      <div className="metadata-panel">
        {currentNote ? (
          <>
            <div className="metadata-section">
              <h3>Metadata</h3>
              <div className="metadata-item">
                <span className="metadata-label">Created</span>
                <span className="metadata-value">{new Date(currentNote.created).toLocaleDateString()}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Modified</span>
                <span className="metadata-value">{new Date(currentNote.modified).toLocaleDateString()}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Words</span>
                <span className="metadata-value">{currentNote.content.split(/\s+/).filter(Boolean).length}</span>
              </div>
            </div>

            <div className="metadata-section">
              <h3>Actions</h3>
              <button
                className={`action-btn ${currentNote.isPinned ? 'pinned' : ''}`}
                onClick={handleTogglePin}
              >
                {currentNote.isPinned ? '⭐ Unpin Note' : '☆ Pin Note'}
              </button>
              <button className="action-btn" onClick={handleToggleArchive}>
                {currentNote.isArchived ? '📤 Unarchive' : '📥 Archive'}
              </button>
              <button className="action-btn delete" onClick={handleDeleteNote}>
                🗑️ Delete Note
              </button>
            </div>

            <div className="metadata-section">
              <h3>Tags</h3>
              <input
                type="text"
                className="tags-input"
                placeholder="Add tag and press Enter"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTag(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <div className="tags-list">
                {currentNote.tags.map((tag, index) => (
                  <div key={index} className="tag">
                    {tag}
                    <button className="tag-remove" onClick={() => handleRemoveTag(index)}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="metadata-section">
              <button className="action-btn" onClick={() => setShowSettings(true)}>
                ⚙️ Settings
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <p>Select a note to view details</p>
            <button className="btn btn-primary" onClick={() => setShowSettings(true)} style={{ marginTop: '20px' }}>
              ⚙️ Settings
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && <Modal {...modal} />}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

// Render App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);