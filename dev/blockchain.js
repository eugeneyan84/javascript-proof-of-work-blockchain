function Blockchain() {
    this.chain = []; // all mined blocks will be stored in the chain
    this.newTxns = []; // to contain all new txns before placed into a block for mining
}

Blockchain.prototype.createNewBlock = function(nonce, previousHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        txns: this.newTxns,
        nonce: nonce, // PoW value
        hash: hash, // hash value of newTxns
        previousHash: previousHash, // hash value of previous block
    };

    this.newTxns = []; // clear out newTxns array
    this.chain.push(newBlock);

    return newBlock;
}

module.exports = Blockchain;
