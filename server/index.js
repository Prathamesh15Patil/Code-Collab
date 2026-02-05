const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const { exec } = require("child_process"); // Used for executing Docker commands
const cors = require("cors");
app.use(cors());
app.use(express.json()); // For parsing application/json
const { v4: uuidv4 } = require("uuid"); // To generate unique IDs for temporary directories
const path = require("path");
const fs = require("fs"); // For file system operations

// --- Socket.IO Setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust in production
    methods: ["GET", "POST"],
  },
});

const userSocketMap = {}; // Maps socket ID to username
const roomLanguageMap = {}; // New: Maps roomId to selected language

const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join", ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);

    // If this is the first user in the room, set a default language
    if (!roomLanguageMap[roomId]) {
      roomLanguageMap[roomId] = 'java'; // Default to Java
    }

    // Notify all users that a new user has joined
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit("joined", {
        clients,
        username,
        socketId: socket.id,
        currentLanguage: roomLanguageMap[roomId], // Send current language
      });
    });

    // Also emit the current language to the newly joined user
    io.to(socket.id).emit("language-change", {
      language: roomLanguageMap[roomId],
    });
  });

  socket.on("code-change", ({ roomId, code }) => {
    socket.in(roomId).emit("code-change", { code });
  });

  socket.on("sync-code", ({ socketId, code }) => {
    io.to(socketId).emit("code-change", { code });
  });

  // New: Handle language change from a client
  socket.on("language-change", ({ roomId, language }) => {
    roomLanguageMap[roomId] = language; // Update language for the room
    socket.in(roomId).emit("language-change", { language }); // Broadcast to others
    console.log(`Room ${roomId} language changed to: ${language}`);
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit("disconnected", {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
      // Optionally clean up roomLanguageMap if room becomes empty, but not strictly needed for now
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
});

// --- Code Execution Endpoint ---
app.post("/run", async (req, res) => {
  const { code, language, input } = req.body; // New: receive 'language' and 'input'
  console.log("Run request:", { language, input, codeSnippet: code.substring(0, 50) + "..." });

  if (!code) return res.status(400).send({ error: "Code is required" });
  if (!language) return res.status(400).send({ error: "Language is required" });

  const runId = uuidv4();
  const dirPath = path.join(__dirname, "temp", runId);

  try {
    fs.mkdirSync(dirPath, { recursive: true });

    let filePath;
    let dockerCmd;
    let mainClassName = "Main"; // Default for Java

    if (language === "java") {
      filePath = path.join(dirPath, `${mainClassName}.java`);
      fs.writeFileSync(filePath, code);
      // For Java, we need to compile then run. Input is piped to 'java Main'
      dockerCmd = `echo "${input || ""}" | docker run --rm -i -v "${dirPath}:/app" -w /app eclipse-temurin:21-jdk bash -c "javac Main.java && java Main"`;
    } else if (language === "python") {
      filePath = path.join(dirPath, "main.py");
      fs.writeFileSync(filePath, code);
      // For Python, just run the script. Input is piped directly.
      dockerCmd = `echo "${input || ""}" | docker run --rm -i -v "${dirPath}:/app" -w /app python:3.9-slim-buster python main.py`;
    } else {
      return res.status(400).send({ error: "Unsupported language" });
    }

    // Execute the docker command
    // `child_process.exec` pipes stdin using the `input` option
    exec(dockerCmd, { timeout: 5000, stdin: input || "" }, (error, stdout, stderr) => {
      fs.rmSync(dirPath, { recursive: true, force: true }); // Clean up temp directory

      if (error) {
        // Handle common Docker errors and execution errors
        let output = stderr || error.message;
        if (error.killed && error.signal === 'SIGTERM') {
          output = `Execution timed out (${(5000 / 1000)}s limit). Possible infinite loop or long-running computation.\n` + output;
        }
        return res.send({ output });
      }

      return res.send({ output: stdout });
    });

  } catch (err) {
    console.error("Error during code execution:", err);
    fs.rmSync(dirPath, { recursive: true, force: true }); // Ensure cleanup even on setup errors
    return res.status(500).send({ error: "Server error during execution" });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`server is running at ${PORT}`));