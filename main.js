const midi = require("midi");
const websockets = require("ws");
const prompt = require("prompt-sync")({ sigint: true });

async function main() {
  const input = new midi.Input();

  console.log("Available midi inputs:");
  for (let i = 0; i < input.getPortCount(); i++) {
    console.log(i, "--", input.getPortName(i));
  }
  let port = prompt("Select a MIDI input: ");
  port = Number(port);

  input.openPort(port);
  console.log("listening to port", input.getPortName(port));

  const wss = new websockets.WebSocketServer({ port: 8080 });
  console.log("waiting for connection");
  wss.on("connection", (ws) => {
    let ccList = [];
    console.log("connection established !");
    input.on("message", (deltaTime, message) => {
      ccIndex = ccList.indexOf(message[1]);
      if (ccIndex == -1) {
        ws.send(JSON.stringify(message));
        console.log("CC", message[1], "->", message[2]);
        ccList.push(message[1]);
        setTimeout(() => {
          ccList.splice(ccList.indexOf(message[1]), 1);
        }, 100);
      }
    });
  });
}

main();
