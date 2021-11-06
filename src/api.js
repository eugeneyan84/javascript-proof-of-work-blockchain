const express = require("express");
const Blockchain = require("./blockchain");
const uuid = require("uuid");
const API_PORT = 5000;

const nodeAddress = uuid.v4().split("-").join("");
console.log(`node-address: ${nodeAddress}`);
var app = express();

const bc = new Blockchain();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/blockchain", (req, res) => {
  res.send(bc); // just return the whole chain
});

app.post("/transaction", (req, res) => {
  const blockIndex = bc.createNewTxn(
    req.body.amount,
    req.body.sender,
    req.body.recipient
  );
  res.json({ blockIndex: blockIndex });
});

app.get("/mine", (req, res) => {
  // #1: get previous block
  const previousBlock = bc.getLastBlock();
  // #2: retrieve hash of previous block
  const previousBlockHash = previousBlock["hash"];
  // #3: construct new block with current set of pending transactions, plus a new index value (previous index + 1)
  const newBlock = { txns: bc.pendingTxns, index: previousBlock["index"] + 1 };
  // #4: brute force the new nonce out with the previous block's hash from #2, alongside the new block from #3
  const computedNonce = bc.mine(previousBlockHash, newBlock);
  console.log(`Computed nonce: ${computedNonce}`);
  // #5: with the new nonce, derive the hash value of the combined previous block hash (#2), new block (#3) and new nonce (#4)
  const newBlockHash = bc.hashBlock(previousBlockHash, newBlock, computedNonce);
  console.log(`Computed new block hash: ${newBlockHash}`);
  // #6: attach new block to the chain
  const finalisedBlock = bc.createNewBlock(
    computedNonce,
    previousBlockHash,
    newBlockHash
  );
  // #7: reward node for successfully mining new block
  bc.createNewTxn(2, "00", nodeAddress);

  res.json({
    status: "New block successfully mined.",
    resultBlock: finalisedBlock,
  });
});

app.listen(API_PORT, () => {
  console.log(`Listening on port ${API_PORT}...`);
});
