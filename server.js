const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

app.get("/", function (req, res) {
  res.sendFile("index.html", { root: __dirname + "/public" });
});
app.use(express.static("public"));

io.on("connection", function (socket) {
  console.log("a user connected");

  socket.on("setUsername", function (data) {
    console.log("setUsername", data);
    socket.username = data.username;
  });

  /**
   * data { message: "text message"}
   */
  socket.on("chatMessage", function (data) {
    let messageToSend = {
      username: socket.username,
      message: data.message,
    };

    console.log("chatMessage", messageToSend);
    //io.emit("chatMessage", messageToSend); // broadcast to all
    socket.broadcast.emit("chatMessage", messageToSend); // broadcast to all except sender
  });

  socket.on("cursorPosition", function (data) {
    console.log("setCursor", data);
    // broadcast to all except sender
    socket.broadcast.emit("cursorPosition", {
      username: socket.username,
      x: data.x,
      y: data.y,
    });
  });

  socket.on("disconnect", function () {
    console.log("user disconnected");
  });
});

http.listen(3000, function () {
  console.log("listening on http://localhost:3000/");
});
