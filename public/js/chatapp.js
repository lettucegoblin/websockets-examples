// Purpose: Chat application

// ------ State ------
const state = {
  username: localStorage.getItem("username") || "Anonymous",
};
// ------ Socket.io ------
var socket = io();
socket.on("connect", function () {
  console.log("connected");
  setUsername(state.username);
});
socket.on("chatMessage", function (data) {
  console.log("chatMessage", data);
  appendMessage(data.message, data.username, new Date().toISOString());
});
socket.on("cursorPosition", function (data) {
  //console.log("cursorPosition", data);
  setCursor(data.username, data.x, data.y);
});
socket.on("disconnect", function () {
  console.log("disconnected");
});

// ------ Chat App ------
function sendChatMessage(text) {
  socket.emit("chatMessage", { message: text });
}

function setUsername(username) {
  state.username = username;
  localStorage.setItem("username", username);
  socket.emit("setUsername", { username: state.username });
}

function sendMessage() {
  var messageInput = document.getElementById("messageInput");
  var message = messageInput.value;
  if (message.trim() == "") {
    return;
  }
  // check if it's a command
  if (message.startsWith("/")) {
    var command = message.substring(1);
    if (command === "clear") {
      document.getElementById("chatMessages").innerHTML = "";
    } else if (command.startsWith("username")) {
      var newUsername = command.substring("username".length + 1); // +1 for the space
      if (newUsername.trim() == "") {
        alert("Username cannot be empty");
        return
      }
      setUsername(newUsername);
    }
    messageInput.value = "";
    return;
  }

  sendChatMessage(message);
  messageInput.value = "";

  appendMessage(message, state.username, new Date().toISOString());
}

// welcome message
appendMessage(`Welcome! This is a basic websocket chatroom where you can also see the cursors of other participants. Use \\username to set username. See https://github.com/lettucegoblin/websockets-examples for the code. Share this link ${window.location.href} with other participants.`, "Server", new Date().toISOString());

function cleanMessage(message) {
  return message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function addLinks(message) {
  return message.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank">$1</a>'
  );
}

function appendMessage(message, username, timestamp) {
  var chatMessages = document.getElementById("chatMessages");
  var messageElement = document.createElement("div");
  messageElement.classList.add("message", "card", "mb-3");

  message = cleanMessage(message); // prevent XSS
  message = addLinks(message); // add links

  messageElement.innerHTML = `
    <div class="card-header"> 
      <span class="username" data-toggle="tooltip" title=${timestamp}>${username}</span>
    </div>
    <div class="card-body">
      <p class="card-text">${message}</p>
    </div>
  `;
  chatMessages.appendChild(messageElement);
  // scroll to bottom
  chatMessages.parentElement.scrollTop =
    chatMessages.parentElement.scrollHeight;
}

// ------ Cursor ------
function setCursor(username, x, y) {
  var cursor = document.getElementById(username);
  if (!cursor) {
    cursor = document.createElement("img");
    cursor.id = username;
    cursor.classList.add("cursor");
    cursor.classList.add("fadeOut");
    cursor.src = "/defaultCursor.cur";
    void cursor.offsetWidth;
    cursor.setAttribute("data-toggle", "tooltip");
    cursor.setAttribute("title", username);
    document.body.appendChild(cursor);
  }
  cursor.classList.remove('fadeOut');
  cursor.style.left = x + "vw";
  cursor.style.top = y + "vh";
  if(cursor.timeout) {
    clearTimeout(cursor.timeout);
  }
  timeout = setTimeout(function() {
    cursor.classList.add('fadeOut');
  }, 100);
  cursor.timeout = timeout;
}

// ------ Event Handlers ------
document
  .getElementById("messageInput")
  .addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  });

let lastCursorUpdate = Date.now();
let delayForCursorUpdate = 60; // ms
document.addEventListener("mousemove", function (event) {
  if(!state.username) return;
  clientXInVw = (event.clientX / window.innerWidth) * 100;
  clientYInVh = (event.clientY / window.innerHeight) * 100;
  if (Date.now() - lastCursorUpdate < delayForCursorUpdate) {
    return;
  }
  socket.emit("cursorPosition", { x: clientXInVw, y: clientYInVh });
  lastCursorUpdate = Date.now();
});
