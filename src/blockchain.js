const sha256 = require("sha256");
const uuid = require("uuid");
const currentNodeUrl = process.argv[3];

function Blockchain(nodeAddress) {
  this.chain = []; // all mined blocks will be stored in the chain
  this.pendingTxns = []; // to contain all new txns before placed into a block for mining
  this.currentNodeUrl = currentNodeUrl;
  this.currentNodeAddress = nodeAddress;
  this.nodeNetwork = [];
  this.createNewBlock(100, "0", "0"); // genesis block creation
}

Blockchain.prototype.createNewBlock = function (nonce, previousHash, hash) {
  const newBlock = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    txns: this.pendingTxns,
    nonce: nonce, // PoW value
    hash: hash, // hash value of pendingTxns
    previousHash: previousHash, // hash value of previous block
  };

  this.pendingTxns = []; // clear out pendingTxns array
  this.chain.push(newBlock);

  return newBlock;
};

Blockchain.prototype.getLastBlock = function () {
  return this.chain[this.chain.length - 1];
};

Blockchain.prototype.createNewTxn = function (
  txnAmt,
  senderAddress,
  recipientAddress
) {
  const newTxn = {
    amount: txnAmt,
    senderAddress: senderAddress,
    recipientAddress: recipientAddress,
    txnId: uuid.v4().split("-").join("")
  };

  return newTxn;
};

Blockchain.prototype.addTxn = function(txn) {
    this.pendingTxns.push(txn);  // append new transaction into existing transactions array
    return this.getLastBlock()["index"] + 1;
};

Blockchain.prototype.hashBlock = function (
  previousBlockHash,
  currentBlockData,
  nonce
) {
  const dataStr =
    previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
  const hashValue = sha256(dataStr);

  return hashValue;
};

Blockchain.prototype.mine = function (previousBlockHash, currentBlockData) {
  let nonce = 0;
  let hashValue = this.hashBlock(previousBlockHash, currentBlockData, nonce);
  while (hashValue.substring(0, 4) !== "0000") {
    nonce += 1;
    hashValue = this.hashBlock(previousBlockHash, currentBlockData, nonce);
  }

  return nonce;
};

Blockchain.prototype.validate = function (chain) {
    let validationResult = true;

    const genesisBlock = chain[0];
    if(genesisBlock.hash !== '0' || genesisBlock.nonce !== 100 || genesisBlock.previousHash !== '0')
    {
        console.log(`[Blockchain.selfValidate] Genesis Block validation failed (hash: ${genesisBlock.hash}, nonce: ${genesisBlock.nonce}, previousHash: ${genesisBlock.previousHash})`);
        validationResult =  false;
    } else
    {
        console.log(`[Blockchain.selfValidate] Genesis Block validation passed, proceeding to validate the rest of the chain.`);
        for(var index = 1; index < chain.length; index++)
        {
            const currentBlock = chain[index];
            const previousBlock = chain[index-1];
    
            if(currentBlock.previousHash !== previousBlock.hash)
            {
                console.log(`[Blockchain.selfValidate] Block (index: ${currentBlock.index}, previousHash: ${currentBlock.previousHash}) previousHash mismatch with previous block (hash: ${previousBlock.hash})`);
                validationResult =  false;
                break;
            }
    
            const reconstructedCurrentBlockData = {txns: currentBlock.txns, index: currentBlock.index};
            const computedHashValue = this.hashBlock(previousBlock.hash, reconstructedCurrentBlockData, currentBlock.nonce);
            if(computedHashValue.substring(0, 4) !== '0000')
            {
                console.log(`[Blockchain.selfValidate] Block (index: ${currentBlock.index}) recomputed hash (${computedHashValue}) failed validation`);
                validationResult =  false;
                break;
            }
        }
    }

    console.log(`[Blockchain.selfValidate] Chain validation completed, outcome: ${validationResult}`);

    return validationResult;
};

Blockchain.prototype.retrieveBlock = function(blockHash) {
    let queriedBlock = null;
    for(let x of this.chain)
    {
        console.log(`[Blockchain.retrieveBlock] current block hash: ${x.hash}`);
        if(x.hash === blockHash)
        {
            console.log(`[Blockchain.retrieveBlock] Block hash match found.`);
            queriedBlock = x;
            break;
        }
    }
    return queriedBlock;
};

Blockchain.prototype.retrieveTxn = function(txnId) {
    let queriedTxn = null;
    for(let x of this.chain)
    {
        console.log(`[Blockchain.retrieveBlock] current block hash: ${x.hash}`);
        for(let y of x.txns)
        {
            if(y.txnId === txnId)
            {
                console.log(`[Blockchain.retrieveTxn] Transaction-id match found.`);
                queriedTxn = y;
                break;
            }
        }
        if(queriedTxn != null)
        {
            break;
        }
    }
    return queriedTxn;
}

module.exports = Blockchain;
