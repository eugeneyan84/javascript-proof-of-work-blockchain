# JavaScript proof-of-work Blockchain

## Background
This project is primarily a demonstration of a simplistic blockchain platform using JavaScript. It serves as a basis to understand the fundamentals of maintaining and growing a decentralised ledger of transactions that is secured by cryptographic principles, as well as the inner workings of the proof-of-work protocol. Actions to be executed on a node are facilitated via HTTP requests, with endpoints built out using Express.

The following capabilities are demonstrated through a set of web API calls:
- how nodes discover each other within a network.
- how a transaction is submitted to a node, then subsequently broadcasted to the network.
- how a block is mined, and subsequently broadcasted to the network, alongside a small reward transaction attributed to the node that mined the block.
- how a newly-joined node catches up with the rest of the network that already has an existing blockchain and transaction pool of pending records.

*Take note that the implementation here is meant for observing and understanding some of the basic concepts of a blockchain, and is by no means a complete one that mirrors (or even comes close to mirroring) the capability and robustness of existing blockchains in production.*

## Pre-requisites

The following must be installed in order to run this project:
- Node.js (LTS version)

## Setup
1. Clone this repository:
```bash
$ git clone https://github.com/eugeneyan84/javascript-proof-of-work-blockchain.git
```
2. Navigate into the project folder:
```bash
$ cd bc-js-v0
```
3. Install all the required libraries specified in the [package.json](https://github.com/eugeneyan84/bc-js-v0/blob/main/package.json):
```bash
$ npm install
```
4. In current terminal, start up the 1st node:
```bash
$ npm run bc_node1
```
5. While the above is sufficient for sending transactions and mining blocks to a single node, several nodes can be started up in separate terminals using the same command format as step #4, but with different script names, i.e. `bc_node2`, `bc_node3` and `bc_node4`. You will see these names defined in the scripts sub-section of the [package.json](https://github.com/eugeneyan84/bc-js-v0/blob/main/package.json).

## API Endpoints
This project was developed to be run locally, hence the endpoints are accessed via http://localhost:{port}, where the port of the node #1 is 5001, up to the last node #4 which is 5004.

Endpoints using the GET method can be accessed via a browser, while endpoints using POST method usually require JSON data to be sent, hence tools like [Postman](https://www.postman.com/) can be used to interact with POST endpoints.

URIs in bold serve as main entry-points for exploring and interacting with the blockchain, while those in italic are mostly secondary API calls that are used internally for broadcast/synchronisation purposes. The full list of URIs are as follows:

| Path | Method | Description |
|-|-|-|
| **/blockchain** | GET | Retrieves the current state of a node's blockchain. |
| **/transaction/broadcast** | POST | Receives a JSON payload in the request (containing *sender*,*recipient* and *amount* fields), creates a new transaction to be added to the node's transaction pool, then broadcast the new transaction record to all other nodes in the network by calling their **/transaction** endpoints. |
| */transaction* | POST | Receives a JSON payload in the request (containing *sender*,*recipient*, *amount* and *txnId* fields), creates a new transaction to be added to the node's transaction pool. Typically called by the **/transaction/broadcast** endpoint of a the node that received the original transaction request. |
| **/mine** | GET | Constructs a new block consisting of the current set of transactions from the transaction pool, the hash of the previous block in the chain, a computed nonce value based on the transaction-set and previous block's hash, and hash value based on the previous block's hash, the computed nonce, and current block data (transaction-set and block-index). This new block is added to the chain of the current node, before broadcasting this new block to all other nodes in the network by calling their **/add-block** endpoints. |
| */add-block* | POST | Receives a JSON payload in the request that constitutes the data of the new block, validates the new block's previousHash and block-index values before adding the new block to its own chain. Typically called by **/mine** endpoint of the node that constructed the new block. |
| **/register-and-broadcast** | POST | Receives a JSON payload in the request (containing *newNodeUrl* field) to register the address of a new node that is added to the network. Subsequently broadcast this new node's address to all other nodes in the network by calling their **/register** endpoints. Finally, the current node's address book (i.e. the addresses of all other nodes in the network) is sent to the new node by calling its **/bulk-register** endpoint, so that the new node would be aware of all other nodes present on the network. |
| */register* | POST | Receives a JSON payload in the request (containing the **newNodeUrl** field) which holds the address of a node to be registered into the current node's address book. |
| */bulk-register* | POST | Receives a JSON payload in the request (containing the **allNetworkNodes** field) which holds the address of multiple nodes to be registered into the current node's address book. |
| **/sync-chain** | GET | Calls the **/blockchain** endpoint of all other nodes in the network to get a copy of their current chains. Those chains are then validated before used to sync up the current node's blockchain state, as well as pending transactions. This allows a new node that has just joined a network to catch up with all other nodes in terms of blockchain state.  |

*E.g. to inspect the state of the blockchain in `bc_node1` hosted locally, use the following url: http://localhost:5001/blockchain.*

## Proof-of-Work Procedure

In this project, a new block is created with the following sequence of actions:
1. Retrieve the last block in the blockchain of the current node
2. Extract the hash of the block retrieved from step #1
3. Construct a new dictionary containing current list of transactions from the node's transaction pool, as well as the hash of the previous block from step #2.
4. Using the previous-block-hash (step #2) and the dictionary (step #3), together with an integer nonce value (start at 0), concatenate all 3 components to hash it using SHA-256. For as long as the resultant hash-value does not start with four zeroes ('0000'), increment the nonce and repeat the hashing process in a simplistic brute-force manner. Stop only when a hash value beginning with '0000' is detected, before returning the nonce that produces this proof-of-work hash result.
5. Hash-value for current block is constructed by hashing the previous block's hash (step #2), data dictionary (step #3), and the computed nonce (step #4). This hash should start with '0000'.
6. Build the finalised block containing previous block's hash, current block hash, computed nonce, current block index, timestamp and transaction-set.

## Execution Flow

The following prescribed execution flow shows how a sequence of API calls can demonstrate the various capabilities of this javascript blockchain:

1. Open a new terminal window, start the 1st node `bc_node1`:
```bash
$ npm run bc_node1
```
2. Open 2 more terminals, start up `bc_node2` and `bc_node3`. At this point, the 3 nodes are not aware of each other yet.
3. To simulate `bc_node2` reaching out to `bc_node1`, launch Postman and create a new POST request (http://localhost:5001/register-and-broadcast), with the following JSON body:
```json
{
	"newNodeUrl": "http://localhost:5002"
}
```
4. Repeat POST request for `bc_node3`. (remember to update port in JSON body)
5. In browser, query the state of `bc_node1` via the url http://localhost:5001/blockchain. You will see the addresses of 2 other nodes registered in `bc_node1`:
![blockchain state after registering 2 other nodes](https://imgur.com/DfFWtAT.png)
6. Simulate the adding of a token transaction to `bc_node1` via POST request (http://localhost:5001/transaction/broadcast) with the following JSON body:
```json
{
	"amount": 15.5,
	"sender": "0x33A56E2F",
	"recipient": "0x8C60A2F7"
}
```
7. In browser, query the state of `bc_node1` via the url http://localhost:5001/blockchain to observe the presence of a new pending transaction:
![Transaction from step #6 observed in pendingTxns section](https://imgur.com/ls4hpFi.png)
8. Check `b2_node2` (http://localhost:5002/blockchain) too for same observation, as the new transaction has been propagated to all nodes in network.
9. Simulate mining of new block carried out in `bc_node2` via GET request (http://localhost:5002/mine). The response would reveal the details of the new block, observe the 4 zeroes in the *hash* field, while the *previousHash* simply reflects the arbitrary '0' value of the genesis block:
![enter image description here](https://imgur.com/AnLLSwv.png) 
10. This time, navigate to http://localhost:5003/blockchain to observe that the new block has also been broadcasted to `bc_node3`:
![New block propagated over to bc_node3](https://imgur.com/eOKvrtB.png)
11. In a new terminal, start up `bc_node4`, register it with the network (similar to step #3), and observe that its blockchain is not in sync with the other 3 nodes:
![bc_node4 registered with network, but blockchain state has not caught up with network yet](https://imgur.com/3ySGmC1.png)
12. Use the GET request (http://localhost:5004/sync-chain) to enable `bc_node4` to catch up with the rest of the nodes in the network:
![Synchronising the blockchain state for bc_node4](https://imgur.com/T2tffFZ.png)
13. Navigate to http://localhost:5004/blockchain, observe that the blockchain (both chain and pending transactions) in `bc_node4` now mirrors the state of all other nodes:
![Blockchain state in bc_node4 caught up with rest of network](https://imgur.com/fiPZZeR.png)

> Written with [StackEdit](https://stackedit.io/).