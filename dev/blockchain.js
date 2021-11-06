function Blockchain() {
    this.chain = []; // all mined blocks will be stored in the chain
    this.pendingTxns = []; // to contain all new txns before placed into a block for mining
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

module.exports = Blockchain;
