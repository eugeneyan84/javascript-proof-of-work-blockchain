const express = require("express");
const Blockchain = require("./blockchain");
const uuid = require("uuid");
const reqPromise = require("request-promise");
const API_PORT = process.argv[2];

console.log(process.argv[0]);
console.log(process.argv[1]);
console.log(process.argv[2]);

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
  const txn = req.body;
  const blockIndex = bc.addTxn(txn);
  console.log(
    `[transaction] Transaction (txnId: ${txn.txnId}) received and added to pending list. Returned block index: ${blockIndex}`
  );
  res.json({
    sender: nodeAddress,
    status: `Transaction (txnId: ${txn.txnId}) received will be added to block ${blockIndex}`,
  });
});

app.post("/transaction/broadcast", (req, res) => {
  const newTxn = bc.createNewTxn(
    req.body.amount,
    req.body.sender,
    req.body.recipient
  );
  console.log(`[transaction/broadcast] New transaction created (txnId: ${newTxn.txnId}).`);
  bc.addTxn(newTxn);
  console.log("[transaction/broadcast] New transaction added to pending list.");
  const promises = [];
  bc.nodeNetwork.forEach((x) => {
    const reqOptions = {
      uri: x + "/transaction",
      method: "POST",
      body: newTxn,
      json: true,
    };
    promises.push(reqPromise(reqOptions));
  });
  console.log(
    `[transaction/broadcast] Number of txn-broadcast request(s) created: ${promises.length}`
  );
  Promise.all(promises).then((resp) => {
    console.log(
      `[transaction/broadcast] All txn-broadcast API calls executed.`
    );
    res.json({
      sender: nodeAddress,
      status: "Transaction successfully created and broadcasted to network",
    });
  });
});

app.get("/mine", (req, res) => {
  // #1: get previous block
  const previousBlock = bc.getLastBlock();
  // #2: retrieve hash of previous block
  const previousBlockHash = previousBlock["hash"];
  console.log(`[mine] Hash of previous block: ${previousBlockHash}`);
  // #3: construct new block with current set of pending transactions, plus a new index value (previous index + 1)
  const newBlock = { txns: bc.pendingTxns, index: previousBlock["index"] + 1 };
  // #4: brute force the new nonce out with the previous block's hash from #2, alongside the new block from #3
  const computedNonce = bc.mine(previousBlockHash, newBlock);
  console.log(`[mine] Computed nonce: ${computedNonce}`);
  // #5: with the new nonce, derive the hash value of the combined previous block hash (#2), new block (#3) and new nonce (#4)
  const newBlockHash = bc.hashBlock(previousBlockHash, newBlock, computedNonce);
  console.log(`[mine] Computed new block hash: ${newBlockHash}`);
  // #6: attach new block to the chain
  const finalisedBlock = bc.createNewBlock(
    computedNonce,
    previousBlockHash,
    newBlockHash
  );
  console.log(
    `[mine] Attached new block (hash: ${newBlockHash}) to curent chain.`
  );
  // #7: reward node for successfully mining new block

  const promises = [];
  bc.nodeNetwork.forEach((x) => {
    const reqOptions = {
      uri: x + "/add-block",
      method: "POST",
      body: { newBlock: finalisedBlock },
      json: true,
    };
    promises.push(reqPromise(reqOptions));
  });
  console.log(
    `[mine] Created ${promises.length} block-broadcast request(s) for execution.`
  );
  Promise.all(promises)
    .then((resp) => {
      console.log(
        `[mine] All block-broadcast request(s) sent, creating reward-transaction-creation-and-broadcast request.`
      );
      const rewardTxnReqOptions = {
        uri: bc.currentNodeUrl + "/transaction/broadcast",
        method: "POST",
        body: {
          amount: 2,
          sender: "00",
          recipient: nodeAddress,
        },
        json: true,
      };
      return reqPromise(rewardTxnReqOptions);
    })
    .then((resp) => {
      console.log(
        `[mine] reward-transaction-creation-and-broadcast request sent.`
      );
      res.json({
        status: "New block successfully mined and broadcast to network.",
        resultBlock: finalisedBlock,
      });
    });
});

app.post("/add-block", (req, res) => {
  // get new block
  const newBlock = req.body.newBlock;
  console.log(`[add-block] New block received (hash: ${newBlock.hash})`);
  // retrieve last block in current node's chain
  const lastBlock = bc.getLastBlock();

  console.log(`[add-block] newBlock.previousHash: ${newBlock.previousHash}`);
  console.log(`[add-block]        lastBlock.hash: ${lastBlock.hash}`);
  console.log(`[add-block]  newBlock.index: ${newBlock.index}`);
  console.log(`[add-block] lastBlock.index: ${lastBlock.index}`);

  // if previous block's hash matches current block's previous-hash value,
  // and current block's index matches previous block's index + 1, then push
  // new block into chain
  if (
    newBlock.previousHash === lastBlock.hash &&
    newBlock.index === lastBlock.index + 1
  ) {
    console.log(
      `[add-block] Verification passed, new block (hash: ${newBlock.hash}) pushed into chain`
    );
    bc.chain.push(newBlock);
    bc.pendingTxns = [];
    res.json({
      sender: nodeAddress,
      status: `New block received and pushed into chain`,
    });
  } else {
    console.log(
      `[add-block] Verification failed, new block (hash: ${newBlock.hash}) rejected.`
    );
    res.json({
      sender: nodeAddress,
      status: `New block rejected`,
    });
  }
});

app.post("/register-and-broadcast", (req, res) => {
  const newNodeUrl = req.body.newNodeUrl;
  if (
    bc.nodeNetwork.indexOf(newNodeUrl) == -1 &&
    newNodeUrl != bc.currentNodeUrl
  ) {
    console.log(
      `[register-and-broadcast] Registered new node url ${newNodeUrl}`
    );
    bc.nodeNetwork.push(newNodeUrl);
  } else {
    console.log(
      `[register-and-broadcast] Node url ${newNodeUrl} already exists in network`
    );
  }
  const promises = [];

  // build requests that would be executed to every other existing node on the network
  console.log(
    `[register-and-broadcast] Building registration request(s) for the existing ${bc.nodeNetwork.length} node(s) in network`
  );
  bc.nodeNetwork
    .filter((x) => x !== newNodeUrl)
    .forEach((x) => {
      const reqOptions = {
        uri: x + "/register",
        method: "POST",
        body: { newNodeUrl: newNodeUrl },
        json: true,
      };
      console.log(
        `[register-and-broadcast] Current reqOptions: ${reqOptions.uri}, ${reqOptions.method}`
      );
      promises.push(reqPromise(reqOptions));
    });

  // execute the API call built from previous step, then build a bulk-registration request
  console.log(`[register-and-broadcast] Executing registration broadcast`);
  Promise.all(promises).then((resp) => {
    console.log(resp);
    console.log(
      `[register-and-broadcast] Building bulk-registration request(s) for the existing ${bc.nodeNetwork.length} node(s) in network`
    );
    const bulkOptions = {
      uri: newNodeUrl + "/bulk-register",
      method: "POST",
      body: {
        allNetworkNodes: [...bc.nodeNetwork, bc.currentNodeUrl].filter(
          (x) => x !== newNodeUrl
        ),
      },
      json: true,
    };
    console.log(
      `[register-and-broadcast] bulkOptions.body.allNetworkNodes: ${bulkOptions.body.allNetworkNodes.length}`
    );

    // make bulk-registration API call to new node, then return a response
    console.log(`[register-and-broadcast] Executing bulk-registration request`);
    return reqPromise(bulkOptions).then((resp) => {
      console.log(resp);
      res.json({
        sender: nodeAddress,
        status: "New node registered with network successfully.",
      });
    });
  });
});

app.post("/register", (req, res) => {
  // register node with network
  const newNodeUrl = req.body.newNodeUrl;
  if (
    bc.nodeNetwork.indexOf(newNodeUrl) == -1 &&
    newNodeUrl !== bc.currentNodeUrl
  ) {
    bc.nodeNetwork.push(newNodeUrl);
    console.log(`[register] Registered new node url ${newNodeUrl}`);
  } else {
    console.log(`[register] Node url ${newNodeUrl} already exists in network`);
  }
  res.json({
    sender: nodeAddress,
    status: `New node (${newNodeUrl}) successfully registered`,
  });
});

app.post("/bulk-register", (req, res) => {
  const nodeUrls = req.body.allNetworkNodes;
  nodeUrls.forEach((x) => {
    console.log(`[bulk-register] Processing ${x}`);
    if (bc.nodeNetwork.indexOf(x) == -1 && x !== bc.currentNodeUrl) {
      bc.nodeNetwork.push(x);
      console.log(`[bulk-register] Registered new node url ${x}`);
    } else {
      console.log(`[bulk-register] Node url ${x} already exists in network`);
    }
  });
  res.json({ sender: nodeAddress, status: `Bulk registration successful` });
});

app.get("/self-validate", (req, res) =>{
  const validationResult = bc.validate(bc.chain);
  res.json({sender: nodeAddress, status: `Validation outcome: ${validationResult}`});
});

app.listen(API_PORT, () => {
  console.log(`Listening on port ${API_PORT}...`);
});
