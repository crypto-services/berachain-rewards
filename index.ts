import { Web3 } from 'web3'
import cron from 'node-cron'

import abi from './abi.json'

require('dotenv').config()

const web3 = new Web3(process.env.EVM_RPC_URL)
web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY)
const contract = new web3.eth.Contract(abi, process.env.DISTRIBUTION_CONTRACT)

let startHeight = 0

async function canClaim(timestamp: number): Promise<boolean> {
  try {
    return await contract.methods.isTimestampActionable(timestamp).call()
  } catch (e) {
    throw new Error(e)
  }
}

async function getTargetHeight(): Promise<number> {
  try {
    const currentHeight = await web3.eth.getBlockNumber()
    const endHeight = Number(currentHeight) - 0
    if (!startHeight) {
      startHeight = Number(currentHeight) - Number(process.env.LOOK_BACK)
    }
    console.log(`Scanning from ${startHeight} to ${endHeight}`)
    return endHeight
  } catch (e) {
    throw new Error(e)
  }
}

async function verifyBlock(number: number, hash: string): Promise<boolean> {
  try {
    const parent = await web3.eth.getBlock(number + 1)
    if (parent.parentHash === hash) {
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

async function claimRewards(
  timestamp: number,
  proposerIndex: number,
  pubKey: string,
  proposerIndexProof: string[],
  pubkeyProof: string[],
) {
  const txId = await contract.methods
    .distributeFor(timestamp, proposerIndex, pubKey, proposerIndexProof, pubkeyProof)
    .send()
  console.log(txId)
}

async function scanBlocks() {
  try {
    const endHeight = await getTargetHeight()
    for (let i = startHeight; i < endHeight; i++) {
      const block = await web3.eth.getBlock(i)
      if (block.miner === process.env.TARGET_COINBASE.toLowerCase()) {
        const isValid = await verifyBlock(Number(block.number), block.hash)
        if (isValid) {
          const claimable = await canClaim(Number(block.timestamp))
          if (claimable) {
            const proof = await fetchProof(Number(block.timestamp))
            console.log(`Claiming rewards: ${block.number}`)
            await claimRewards(
              Number(block.timestamp),
              proof.beacon_block_header.proposer_index,
              proof.validator_pubkey,
              proof.proposer_index_proof,
              proof.validator_pubkey_proof,
            )
          } else {
            console.log(`Block already claimed: ${block.number}`)
          }
        } else {
          console.log(`Block is no longer in chain: ${Number(block.number)} ${block.hash}`)
        }
      }
    }
    startHeight = endHeight
  } catch (e) {
    console.error(e)
  }
}

cron.schedule('*/20 * * * * *', async () => {
  scanBlocks()
})
