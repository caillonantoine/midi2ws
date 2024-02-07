const midi = require("midi");
const websockets = require("ws");

async function main() {
  const input = new midi.Input();
  input.openPort(0);
  console.log("listening to port", input.getPortName(0));

  const wss = new websockets.WebSocketServer({ port: 8080 });
  console.log("waiting for connection");
  wss.on("connection", (ws) => {
    console.log("connection established !");
    input.on("message", (deltaTime, message) => {
      ws.send(JSON.stringify(message));
    });
  });
}

main();
