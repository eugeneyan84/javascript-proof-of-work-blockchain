const sha256 = require('sha256');

function Blockchain() {
    this.chain = []; // all mined blocks will be stored in the chain
    this.pendingTxns = []; // to contain all new txns before placed into a block for mining

    this.createNewBlock(100, '0', '0'); // genesis block creation
};

Blockchain.prototype.createNewBlock = function(nonce, previousHash, hash) {
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

Blockchain.prototype.getLastBlock = function() {
    return this.chain[this.chain.length-1];
};

Blockchain.prototype.createNewTxn = function(txnAmt, senderAddress, recipientAddress) {
    const newTxn = {
        amount: txnAmt,
        senderAddress: senderAddress,
        recipientAddress: recipientAddress
    };

    this.pendingTxns.push(newTxn); // append new transaction into existing transactions array

    return this.getLastBlock()['index'] + 1;
};

Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce) {
    const dataStr = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hashValue = sha256(dataStr);

    return hashValue;
};

Blockchain.prototype.mine = function(previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hashValue = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while(hashValue.substring(0,4) !== '0000')
    {
        nonce += 1;
        hashValue = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }

    return nonce;
};

module.exports = Blockchain;
