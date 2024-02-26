import midi from "midi";
import { WebSocketServer } from "ws";
import abletonlink from "abletonlink";
import prompt from "prompt-sync";

const link = new abletonlink();
const wss = new WebSocketServer({ port: 8080 });

let ccList = [];
let rateLimiter = 40;

function getMidiInput() {
  const midiInput = new midi.Input();
  console.log("Available midi inputs:");
  for (let i = 0; i < midiInput.getPortCount(); i++) {
    console.log(i, "--", midiInput.getPortName(i));
  }
  let port = prompt({ sigint: true })("Select a MIDI midiInput: ");
  port = Number(port);
  midiInput.openPort(port);
  midiInput.on("message", (deltaTime, message) => {
    if (message[0] !== 176) return;
    console.log("CC", message[1], "->", message[2]);
  });
  console.log("listening to port", midiInput.getPortName(port));
  return midiInput;
}

function sendLinkState(ws) {
  link.update();
  ws.send(
    JSON.stringify({
      type: "linkState",
      beat: link.beat,
      phase: link.phase,
      bpm: link.bpm,
      time: Date.now(),
    })
  );
}

async function main() {
  // select and open midi port
  let midiInput = getMidiInput();

  // starting websocket server
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
    ws.on("message", (data) => {
      data = JSON.parse(data.toString());
      switch (data.type) {
        case "linkState":
          sendLinkState(ws);
      }
    });
  });
}

main();
