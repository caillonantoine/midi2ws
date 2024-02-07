const midi = require("midi");
const websockets = require("ws");

async function main() {
  const input = new midi.Input();
  input.openPort(0);
  console.log("listening to port", input.getPortName(0));

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
