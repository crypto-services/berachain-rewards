import { Web3 } from 'web3'

require('dotenv').config()

const web3 = new Web3(process.env.EVM_WEBSOCKET_URL)

async function startBlockSubscription() {
  const blockSubscription = await web3.eth.subscribe('newBlockHeaders')

  blockSubscription.on('data', async blockhead => {
    if (blockhead.miner === process.env.TARGET_COINBASE.toLowerCase()) {
      console.log(
        `Found block mined by target: ${blockhead.number} with timestamp ${blockhead.timestamp}`,
      )
      await timeout(10000)
      const proof = await fetchProof(Number(blockhead.timestamp))
    }
  })
}

async function fetchProof(timestamp: number) {
  try {
    const res = await fetch(`${process.env.BKIT_API}/bkit/v1/proof/block_proposer/t${timestamp}`)
    const proof = await res.json()
    console.log(JSON.stringify(proof, null, 2))
  } catch (e) {
    console.error(e.message ?? e)
  }
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

startBlockSubscription()
