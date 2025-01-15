import cron from 'node-cron'
import { web3, contract, signer } from './web3'

let startHeight = 0

async function canClaim(timestamp: number): Promise<boolean> {
  try {
    return await contract.methods.isTimestampActionable(timestamp).call()
  } catch (e) {
    throw new Error(e)
  }
}

async function setScanRange(): Promise<number> {
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

async function fetchChildTimestamp(number: number, hash: string): Promise<number> {
  try {
    const child = await web3.eth.getBlock(number + 1)
    if (child.parentHash === hash) {
      return Number(child.timestamp)
    } else {
      throw new Error('Invalid parent block')
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
    throw new Error(e)
  }
}

async function claimRewards(
  timestamp: number,
  proposerIndex: number,
  pubKey: string,
  proposerIndexProof: string[],
  pubkeyProof: string[],
) {
  try {
    const receipt = await contract.methods
      .distributeFor(timestamp, proposerIndex, pubKey, proposerIndexProof, pubkeyProof)
      .send({ from: signer.address })
    console.log(`Tx confirmed: ${process.env.EXPLORER_URL}/tx/${receipt.transactionHash}`)
  } catch (e) {
    console.error(
      e.receipt
        ? `Tx reverted: ${process.env.EXPLORER_URL}/tx/${e.receipt.transactionHash}`
        : e.message
        ? e.message
        : e,
    )
  }
}

async function isTargetBlock(number: number): Promise<string> {
  try {
    const block = await web3.eth.getBlock(number)
    if (block.miner === process.env.TARGET_COINBASE.toLowerCase()) {
      return block.hash
    } else {
      return ''
    }
  } catch (e) {
    throw new Error(e)
  }
}

async function scanBlocks() {
  try {
    const endHeight = await setScanRange()
    for (let i = startHeight; i < endHeight; i++) {
      const targetHash = await isTargetBlock(i)
      if (!!!targetHash) continue
      const timestamp = await fetchChildTimestamp(i, targetHash)
      const claimable = await canClaim(timestamp)
      if (claimable) {
        console.log(`Claiming rewards for block: ${i}`)
        const proof = await fetchProof(timestamp)
        await claimRewards(
          timestamp,
          proof.beacon_block_header.proposer_index,
          proof.validator_pubkey,
          proof.proposer_index_proof,
          proof.validator_pubkey_proof,
        )
      } else {
        console.log(`Block already claimed: ${i}`)
      }
    }
    startHeight = endHeight
  } catch (e) {
    console.error(e.message ?? e)
  }
}

cron.schedule('*/120 * * * * *', async () => {
  scanBlocks()
})
