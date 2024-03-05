// import midi from "midi";
// import { WebSocketServer } from "ws";
// import abletonlink from "abletonlink";

const midi = require("midi");
const websockets = require("ws");
const abletonlink = require("abletonlink");

const link = new abletonlink();
const wss = new websockets.WebSocketServer({ port: 8080 });

let ccList = [];
let rateLimiter = 40;

function sendLinkState(ws) {
  link.update();
  ws.send(
    JSON.stringify({
      type: "linkState",
      beat: link.beat,
      phase: link.phase,
      bpm: link.bpm,
      time: Date.now(),
      peers: link.getNumPeers(),
    })
  );
}

function setLinkBPM(bpm) {
  console.log("Changing bpm to", bpm);
  link.bpm = bpm;
}

async function main() {
  const midiInput = new midi.Input();

  console.log("Available midi inputs:");
  for (let i = 0; i < midiInput.getPortCount(); i++) {
    console.log(i, "--", midiInput.getPortName(i));
  }

  let inputPort = 0;

  if (process.argv.length === 3) {
    inputPort = Number(process.argv[2]);
  }

  midiInput.openPort(inputPort);
  midiInput.on("message", (deltaTime, message) => {
    if (message[0] !== 176) return;
    console.log("CC", message[1], "->", message[2]);
  });
  console.log("listening to port", midiInput.getPortName(inputPort)); // starting websocket server
  console.log("waiting for connection (ws://localhost:8080)");

  wss.on("connection", (ws) => {
    console.log("connection established !");
    // midi related handlers
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

    // metadata related handlers
    ws.on("message", (msg) => {
      let data = JSON.parse(msg.toString());
      switch (data.type) {
        case "linkState":
          sendLinkState(ws);
          break;
        case "setLinkBPM":
          setLinkBPM(data.value);
          break;
      }
    });
  });
}

main();
