const midi = require("midi");
const websockets = require("ws");
const prompt = require("prompt-sync")({ sigint: true });

let ccList = [];
let rateLimiter = 40;

async function main() {
  // select and open midi port
  const midiInput = new midi.Input();
  console.log("Available midi inputs:");
  for (let i = 0; i < midiInput.getPortCount(); i++) {
    console.log(i, "--", midiInput.getPortName(i));
  }
  let port = prompt("Select a MIDI midiInput: ");
  port = Number(port);
  midiInput.openPort(port);
  midiInput.on("message", (deltaTime, message) => {
    if (message[0] !== 176) return;
    console.log("CC", message[1], "->", message[2]);
  });
  console.log("listening to port", midiInput.getPortName(port));

  // starting websocket server
  const wss = new websockets.WebSocketServer({ port: 8080 });
  console.log("waiting for connection (ws://localhost:8080)");
  wss.on("connection", (ws) => {
    console.log("connection established !");
    midiInput.removeAllListeners();
    midiInput.on("message", (deltaTime, message) => {
      if (message[0] !== 176) return;
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
