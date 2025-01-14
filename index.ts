import { Web3 } from 'web3'
import cron from 'node-cron'

require('dotenv').config()

const web3 = new Web3(process.env.EVM_RPC_URL)

let startHeight = 0

async function scanBlocks() {
  try {
    const currentHeight = await web3.eth.getBlockNumber()
    const endHeight = Number(currentHeight) - 100
    if (!startHeight) {
      startHeight = Number(currentHeight) - Number(process.env.LOOK_BACK)
    }
    console.log(`Scanning from ${startHeight} to ${endHeight}`)

    for (let i = startHeight; i < endHeight; i++) {
      const block = await web3.eth.getBlock(i)
      if (block.miner === process.env.TARGET_COINBASE.toLowerCase()) {
        const isValid = await verifyBlock(Number(block.number), block.hash)
        if (isValid) {
          console.log(
            `Found block mined by target: ${block.number} with timestamp ${block.timestamp}`,
          )
          const proof = await fetchProof(Number(block.timestamp))
          console.log(proof)
        } else {
          console.log(`Block is no longer in chain: ${Number(block.number)} ${block.hash}`)
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
}

async function verifyBlock(number: number, hash: string): Promise<boolean> {
  try {
    const parent = await web3.eth.getBlock(number + 1)
    if (parent.parentHash == hash) {
      return true
    } else {
      return false
    }
  } catch (e) {
    throw new Error(e)
  }
}

async function fetchProof(timestamp: number) {
  try {
    const res = await fetch(`${process.env.BKIT_API}/bkit/v1/proof/block_proposer/t${timestamp}`)
    const proof = await res.json()
    if (
      proof.beacon_block_header?.proposer_index &&
      proof.validator_pubkey &&
      proof.proposer_index_proof &&
      proof.validator_pubkey_proof
    ) {
      return proof
    } else {
      throw new Error(`Invalid response from block_proposer endpoint: ${proof}`)
    }
  } catch (e) {
    console.error(e.message ?? e)
  }
}

cron.schedule('*/10 * * * *', async () => {
  scanBlocks()
})
