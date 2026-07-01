const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join-room", (roomId) => {
    console.log(`${socket.id} joined ${roomId}`);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        users: [],
        ready: {},
      };
    }

    if (rooms[roomId].users.length >= 2) {
      socket.emit("room-full");
      return;
    }

    if (!rooms[roomId].users.includes(socket.id)) {
      rooms[roomId].users.push(socket.id);
    }

    rooms[roomId].ready[socket.id] = false;

    socket.join(roomId);
    socket.roomId = roomId;

    io.to(roomId).emit("room-users", rooms[roomId].users);

    if (rooms[roomId].users.length === 2) {
      io.to(roomId).emit("partner-connected");
      io.to(rooms[roomId].users[0]).emit("create-offer");
    }
  });

  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", offer);
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  // ❤️ READY SYSTEM
  socket.on("ready", (roomId) => {
    if (!rooms[roomId]) return;

    rooms[roomId].ready[socket.id] = true;

    socket.to(roomId).emit("partner-ready");

    const users = rooms[roomId].users;

    if (
  users.length === 2 &&
  rooms[roomId].ready[users[0]] &&
  rooms[roomId].ready[users[1]]
) {
  io.to(roomId).emit("both-ready");

  setTimeout(() => {
    io.to(roomId).emit("start-countdown");
  }, 1000);
}
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    const roomId = socket.roomId;

    if (!roomId || !rooms[roomId]) return;

    rooms[roomId].users = rooms[roomId].users.filter(
      (id) => id !== socket.id
    );

    delete rooms[roomId].ready[socket.id];

    socket.to(roomId).emit("partner-left");

    io.to(roomId).emit("room-users", rooms[roomId].users);

    if (rooms[roomId].users.length === 0) {
      delete rooms[roomId];
    }
  });
});

app.get("/", (req, res) => {
  res.send("Together Booth Server Running ❤️");
});

const PORT = 5001;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});