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
      const proof = await fetchProof(Number(blockhead.timestamp))
    }
  })
}

async function fetchProof(timestamp: number) {
  try {
    const res = fetch(`${process.env.BKIT_API}/bkit/v1/proof/block_proposer/t${timestamp}`)
  } catch (e) {
    console.error(e.message ?? e)
  }
}

startBlockSubscription()
