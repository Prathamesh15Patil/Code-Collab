# 🚀 CodeCollab - Real-time Collaborative Coding Platform
**Code together. Learn together. In real time.**

A web-based collaborative coding environment that allows multiple users to write, discuss, and execute code together in real time. Designed to promote pair/group learning, active problem-solving, and practical coding practice.

---

## ✨ What This Is
This platform provides a shared online workspace where users can collaboratively write code, chat, choose a programming language, and run programs securely — all within the browser.

---

## ✅ Phase 1 Features (Implemented)
- 🧑‍🤝‍🧑 Real-time collaborative code editing using **CodeMirror** and **Socket.IO**
- 💬 Integrated real-time chat for each room
- 🌐 Dynamic language selection (**Python & Java**) synced across collaborators
- 🐳 Secure **Docker-based code execution** for Python and Java
- ⌨️ User input support (all input provided upfront during execution)
- 🏠 Room management: create, join, leave rooms with live member list
- 🔄 Automatic code & language sync for newly joined members


<img src="code collab phase 1.png" alt="My Image" width="300">
---

## 🛠️ Tech Stack
- **Frontend:** React
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Real-time Communication:** Socket.IO
- **Code Editor:** CodeMirror
- **Code Execution:** Docker (sandboxed execution)
- **Stack:** MERN

---

## ▶️ Getting Started (Local Setup)

### Prerequisites
- Node.js
- Docker
- MongoDB (local or cloud)

### Run the Project
```bash
# Clone the repository
git clone <repo-url>

# Start backend
cd server
npm install
npm run dev

# Start frontend
cd client
npm install
npm start


