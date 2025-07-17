# 📁 RealTime Collaborative App

A **real-time collaborative platform** for developers and teams to code, draw, and preview together inside shared rooms (folder-based workspaces). Features live file editing, collaborative whiteboard, terminal-style code execution using Judge0, and real-time synchronization powered by CRDTs.

---

## 🚀 Features

✅ Folder-based workspaces (MongoDB-powered)
🧐 **Monaco Editor** with syntax highlighting
🎨 **Excalidraw Canvas** for collaborative sketching
🧠 **Real-time collaboration** via Yjs + Socket.IO
🧝 **Live presence & cursor sharing**
🔒 **JWT authentication** with user role support
🖥️ **Judge0 integration** to execute code in terminal-like UI
🗖 **Persistent file structure** (stored in MongoDB)
🧪 **Future**: Docker-per-room containerized terminals

---

## 🧱 Tech Stack

### Frontend

* React + TypeScript
* TailwindCSS
* Monaco Editor
* Excalidraw
* Yjs (with Awareness)
* Socket.IO Client
* Judge0 (API-based code execution)

### Backend

* Node.js + Express
* Socket.IO
* MongoDB (Mongoose)
* Yjs (CRDT backend)
* Judge0 (via RapidAPI or self-hosted)

---

## 💃 File Schema (MongoDB)

```ts
{
  _id: ObjectId,
  roomId: string,         // e.g., "team123"
  name: string,           // e.g., "main.py"
  path: string,           // e.g., "src/main.py"
  type: 'file' | 'folder',
  parent: string | null,  // e.g., "src"
  content: string,        // Only for files
  createdAt, updatedAt
}
```

---

## 📆 Folder Tree (Client-Side)

The folder structure is generated from the above schema using a utility function (`buildFileTree`). The frontend maintains folder toggling, tree view, and syncing via socket events.

---

## 🧷 Code Execution via Judge0

Users can run code files directly inside the app using a **run button**. Output appears in a terminal-like component.

### Supported Languages

| Extension | Language             |
| --------- | -------------------- |
| `.js`     | JavaScript (Node.js) |
| `.py`     | Python 3             |
| `.ts`     | TypeScript           |
| `.cpp`    | C++                  |
| `.c`      | C                    |
| `.java`   | Java                 |
| `.go`     | Go                   |
| `.rb`     | Ruby                 |
| `.rs`     | Rust                 |

*Execution handled via Judge0 REST API*

---

## 📊 Real-time Sync via Yjs

* Yjs CRDTs sync content of files using collaborative data structures
* Each file has its own Yjs document (`Y.Doc`)
* Updates are synced in real-time using `Socket.IO`
* Changes are periodically saved to MongoDB

---

## ⚙️ Project Setup

### 1️⃣ Clone the repo

```bash
git clone https://github.com/omadityajha/ORJ.git
cd ORJ
```

### 2️⃣ Install dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3️⃣ Environment variables

Add `.env` file in `server/` and `client/` with appropriate MongoDB URI and Judge0 API keys.

### 4️⃣ Start development servers

```bash
# Start backend
cd server
npm run dev

# Start frontend
cd ../client
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 📆 Future Plans

| Feature                         | Status     |
| ------------------------------- | ---------- |
| Docker-per-room terminals       | 🔜 Planned |
| Real terminal with `node-pty`   | 🔜 Planned |
| FS-based execution environments | 🔜 Planned |
| Code download as ZIP            | 🔜 Planned |
| Session-based Excalidraw sync   | 🔜 Working |
| Terminal-like UI for output     | ✅ Done    |

**Plan:** Each room will spawn a separate Docker container (in production), which will:

* Run `node-pty` shell for isolated terminal access
* Sync with frontend `xterm.js`
* Allow truly interactive sessions for file execution

---

## 🧑‍💻 Contributing

Pull requests, issues, and feedback welcome!

---

## 📜 License

MIT © 2025 – Team TechSena
