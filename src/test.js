const Blockchain = require('./blockchain');

const bc1 = new Blockchain();

console.log(bc1);


//bc1.createNewBlock(1234, '00000000', '38c6e01f');

bc1.createNewTxn(125, '0x4E79BaB6A08a668544cA6b3382264B333202', '0x152cedc1602CC6394378fC8CC3088d6E19cC')

//bc1.createNewBlock(5678, '38c6e01f', '1a4b860e');
//bc1.createNewBlock(9012, '1a4b860e', '7f205ea4');

//console.log(bc1);

var computedNonce = bc1.mine(bc1.getLastBlock()['hash'], bc1.pendingTxns);

console.log('Proof-of-Work: '+computedNonce);

var newHash = bc1.hashBlock(bc1.getLastBlock()['hash'], bc1.pendingTxns, computedNonce);

console.log('New hash: '+newHash);