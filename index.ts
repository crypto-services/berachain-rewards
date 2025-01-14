import { Web3 } from 'web3'
import cron from 'node-cron'

import type { PendingBlocks } from './types'
require('dotenv').config()

const web3 = new Web3(process.env.EVM_WEBSOCKET_URL)

const pendingBlocks: PendingBlocks = []

async function startBlockSubscription() {
  const blockSubscription = await web3.eth.subscribe('newBlockHeaders')

  blockSubscription.on('data', async blockhead => {
    if (blockhead.miner === process.env.TARGET_COINBASE.toLowerCase()) {
      console.log(
        `Found block mined by target: ${blockhead.number} with timestamp ${blockhead.timestamp}`,
      )
      pendingBlocks.push({
        hash: blockhead.hash,
        number: Number(blockhead.number),
        timestamp: Number(blockhead.timestamp),
      })
    }
  })
}

async function processBlocks() {
  console.log('Processing outstanding blocks')
  const nowSecond = Math.floor(Date.now() / 1000)
  for (let i = 0; i < pendingBlocks.length; i++) {
    if (nowSecond - pendingBlocks[i].timestamp > 60) {
      const { hash, number, timestamp } = pendingBlocks[i]
      console.log(`Processing block ${number} ${hash} with timestamp ${timestamp}`)
      try {
        const isValid = await verifyBlock(number, hash)
        if (isValid) {
          const proof = await fetchProof(timestamp)
          console.log(proof)
        } else {
          console.log(`Block is no longer in chain: ${number} ${hash}`)
        }
      } catch (e) {
        console.log(e)
      }
    }
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

cron.schedule('*/1 * * * *', async () => {
  processBlocks()
})

startBlockSubscription()
