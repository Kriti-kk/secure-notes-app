#  Secure Notes App 🔐
A privacy-focused, offline-first note-taking application with **client-side AES-256 encryption**. Your notes are encrypted on your device and never sent to any server.

#  ✨ Features

#  🔒 Security
- **AES-256-CBC Encryption**: Military-grade encryption for all notes
- **Client-Side Only**: All encryption/decryption happens in your browser
- **PBKDF2 Key Derivation**: Master password transformed into secure encryption key
- **Zero-Knowledge**: Your password is never stored anywhere
- **Auto-Lock**: Automatic session lock after 15 minutes of inactivity

#  📝 Note Management
- ✏️ **Create, Edit, Delete Notes**: Full CRUD operations
- 🔍 **Real-Time Search**: Instantly search through all notes
- 📌 **Pin Important Notes**: Keep priority notes at the top
- 📦 **Archive Notes**: Organize by archiving completed notes
- 💾 **Auto-Save**: Notes save automatically every 2 seconds

#  💻 Technical Features
- 🌐 **Offline-First**: Works completely without internet
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 📊 **IndexedDB Storage**: Robust local database
- ⚡ **No Dependencies**: Built with pure HTML, CSS, and JavaScript
- 💾 **Persistent Storage**: Notes remain even after closing browser


#  🚀 Quick Start

#  1️⃣ First Time Setup 

1. **Download** the app files
2. **Open** `index.html` in your web browser
3. **Create a Master Password** (this is YOUR password, not a default one)
4. **Start taking encrypted notes!**

That's it! Your notes are automatically encrypted and stored locally.

#  2️⃣ Creating Notes

- Click **"New Note"** button
- Type your title and content
- Notes **auto-save every 2 seconds**
- Content appears in the left sidebar

#  3️⃣ Managing Notes

**Search**: Type in the search box to filter notes instantly
**Pin Notes**: Click the pin icon to keep important notes at the top
**Archive Notes**: Archive completed or inactive notes to keep workspace clean
**Delete Notes**: Remove unwanted notes (with confirmation)

#  4️⃣ Security

- Click **"Lock"** button to logout and lock your notes
- Must re-enter master password to access
- Auto-locks after 15 minutes of inactivity


#  🛠️ Technology Stack

| Technology | Purpose |
--|
| **HTML5** | User interface structure |
| **CSS3** | Modern, responsive styling |
| **JavaScript (Vanilla)** | Core logic and state management |
| **CryptoJS** | AES-256 encryption and PBKDF2 key derivation |
| **IndexedDB** | Local database for persistent storage |


#  📋 How It Works

#  Encryption Flow

Your Password
    ↓
PBKDF2 Key Derivation (with random salt)
    ↓
Encryption Key (256-bit)
    ↓
AES-256 Encryption (with unique IV per note)
    ↓
Encrypted Data stored in IndexedDB
    ↓
Decryption only happens when you view/edit

#  Data Structure

**First Time**:
- Random salt is generated and stored in IndexedDB
- Your password derives encryption key
- Key lives in browser memory only

**Every Note**:
- Note gets unique random IV (Initialization Vector)
- Note encrypted with AES-256-CBC
- Encrypted blob stored in IndexedDB
- Only decrypted in memory when accessed


#  🔐 Security Guarantees

✅ **Your password is never stored** - only used to derive the key  
✅ **Encryption keys never hit disk** - only stored in browser memory  
✅ **Each note has unique IV** - identical content encrypts differently  
✅ **No server communication** - all processing on your device  
✅ **No tracking** - no analytics, no telemetry, no ads  
✅ **Open source approach** - you can inspect the code  

#  💾 Data Persistence
Your notes are stored in your browser's **IndexedDB**:
- **Survives browser restarts**: Notes persist between sessions
- **Device-specific**: Notes don't sync across devices (privacy by design)
- **Manual backup**: Export encrypted backups for safety
- **Automatic cleanup**: Set your own retention policy

#  ⚙️ System Requirements

| Requirement           | Specification                                 |
| **Browser**           | Chrome 87+, Firefox 78+, Safari 14+, Edge 87+ |
| **Storage**           | ~5-50MB (depending on number of notes)        |
| **Internet**          | Not required (completely offline)             |
| **RAM**               | Minimal (typically <10MB)                     |
| **Installation**      | None - just download and open!                |


#  📱 Browser Compatibility

| Browser           | Status            | Notes                |
| Chrome/Edge       | ✅ Full Support  | Best performance     |
| Firefox           | ✅ Full Support  | Excellent encryption |
| Safari            | ✅ Full Support  | iOS/Mac compatible   |
| Opera             | ✅ Full Support  | Chromium-based       |
| Internet Explorer | ❌ Not Supported | Too old              |


#  🎯 Use Cases

- **Personal Journal**: Keep private encrypted diary
- **Password Notes**: Store password hints (still encrypted)
- **Sensitive Documents**: Notes to self about confidential matters
- **Learning**: Take encrypted study notes
- **Planning**: Private project planning and ideas
- **Quick Thoughts**: Capture ideas privately throughout the day


#  ⚠️ Important Notes

#  Password Security

⚠️ **THERE IS NO PASSWORD RECOVERY**
- If you forget your master password, all notes are inaccessible
- Write down your password and keep it safe!
- Do NOT share your password with anyone

#  Data Safety

💡 **Recommended Practices**:
1. **Regular Backups**: Export encrypted backup files periodically
2. **Strong Password**: Use 12+ characters with mixed case and symbols
3. **Unique Password**: Don't reuse passwords from other apps
4. **Device Security**: Keep your device secure (password, biometric lock)
5. **Backup Storage**: Keep backups in secure location

#  ❓ FAQ

**Q: Where are my notes stored?**  
A: In your browser's IndexedDB - completely local, never uploaded anywhere.

**Q: Can I sync notes across devices?**  
A: Not by default (privacy by design), but encrypted export/import is possible.

**Q: What if I lose my password?**  
A: You cannot recover it. All notes become inaccessible. Always backup your password!

**Q: Is this secure?**  
A: Yes! Uses AES-256-CBC with PBKDF2 key derivation - same encryption as banks.

**Q: Does it collect data?**  
A: No. Zero tracking, no analytics, no telemetry. Completely private.

**Q: Can I use it offline?**  
A: Yes! 100% offline after first load. No internet needed.

**Q: Is it free?**  
A: Completely free and open-source!


#  📝 License

**MIT License** - Free to use, modify, and distribute


#  👨‍💻 Author - Kriti

Built as a web development learning project


#  🙏 Acknowledgments

- **CryptoJS**: Cryptographic library
- **IndexedDB**: Browser database API
- **Modern Web Standards**: HTML5, CSS3, JavaScript ES6+

#  🎉 Get Started Now!
1. ⬇️ **Download** the app
2. 📂 **Extract** the files  
3. 🌐 **Open** index.html in browser
4. 🔑 **Create** your master password
5. ✍️ **Start** taking encrypted notes!

**Your privacy is protected. Your data is yours alone. 🔐**


**Last Updated**: October 26, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
