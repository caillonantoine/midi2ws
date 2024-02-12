const midi = require("midi");
const websockets = require("ws");
const prompt = require("prompt-sync")({ sigint: true });

let ccList = [];
let rateLimiter = 40;

async function main() {
  // select and open midi port
  const input = new midi.Input();
  console.log("Available midi inputs:");
  for (let i = 0; i < input.getPortCount(); i++) {
    console.log(i, "--", input.getPortName(i));
  }
  let port = prompt("Select a MIDI input: ");
  port = Number(port);
  input.openPort(port);
  input.on("message", (deltaTime, message) => {
    console.log("CC", message[1], "->", message[2]);
  });
  console.log("listening to port", input.getPortName(port));

  // starting websocket server
  const wss = new websockets.WebSocketServer({ port: 8080 });
  console.log("waiting for connection (ws://localhost:8080)");
  wss.on("connection", (ws) => {
    console.log("connection established !");
    input.removeAllListeners();
    input.on("message", (deltaTime, message) => {
      let ccIndex = ccList.indexOf(message[1]);
      if (ccIndex == -1) {
        ws.send(JSON.stringify(message));
        console.log("sending CC", message[1], "->", message[2]);
        ccList.push(message[1]);
        setTimeout(() => {
          ccList.splice(ccList.indexOf(message[1]), 1);
        }, rateLimiter);
      }
    });
  });
}

main();
