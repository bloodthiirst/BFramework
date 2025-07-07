const ip = "ws://localhost:56888/Refresh";

const socket = new WebSocket(ip);

// Connection opened
socket.addEventListener("open", (event) => {
  console.log("Hot-reload server connected");
});


socket.addEventListener("close", (event) => {
  console.log("Hot-reload server disconnected");
});

// Listen for messages
socket.addEventListener("message", (event) => {
  window.location.reload();
  console.log("Received Message from Hot-reload server : ", event.data);
});

console.log("Client side Hot reloading is attached");