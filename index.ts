import cron from 'node-cron'
import { web3, contract, signer } from './web3'

let startHeight = 0

/**
 * @description Fetches the proof from the Beacon Kit API using the timestamp of the target block's child.
 *
 * @param timestamp
 * @returns Proof object from the Beacon Kit API.
 */
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
      throw new Error(`Invalid response from block_proposer endpoint`)
    }
  } catch (e) {
    throw new Error(e)
  }
}

/**
 * @description Calls isTimestampActionable to check if a given timestamp has been claimed.
 *
 * @param timestamp
 * @returns True if claimable else false.
 */
async function canClaim(timestamp: number): Promise<boolean> {
  try {
    return await contract.methods.isTimestampActionable(timestamp).call()
  } catch (e) {
    throw new Error(e)
  }
}

/**
 * @description Fetches the child of the target block, confirms hashes match and returns the timestamp.
 *
 * @param number
 * @param hash
 * @returns The timestamp of the target block's child.
 */
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

/**
 * @description Fetches a block by number and checks if the the miner was the coinbase set in .env.
 *
 * @param number
 * @returns Block hash on match else empty string.
 */
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

/**
 * @description Sets the global start height and returns the end height for the scan.
 *
 * @returns The target end height for the scan.
 */
async function setScanRange(): Promise<number> {
  try {
    const currentHeight = await web3.eth.getBlockNumber()
    const endHeight = Number(currentHeight) - Number(process.env.DISTANCE_FROM_HEAD)
    if (!startHeight) {
      startHeight = Number(currentHeight) - Number(process.env.LOOK_BACK)
    }
    console.log(`Scanning from ${startHeight} to ${endHeight}`)
    return endHeight
  } catch (e) {
    throw new Error(e)
  }
}

/**
 * @description Submits a distributeFor transaction using the timestamp of the target block's child and the proof from the Beacon Kit API.
 *
 * @param timestamp
 * @param proposerIndex
 * @param pubKey
 * @param proposerIndexProof
 * @param pubkeyProof
 */
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

/**
 * @description Iterates over the target range of blocks searching for rewards to claim.
 *
 * @dev If any of the request fail or the beacon kit api doesn't have proofs start height it not updated and blocks will be scanned again in the next round.
 */
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

/**
 * @description Schedule the task to run every POLLING_INTERVAL_SECONDS.
 */
cron.schedule(`*/${process.env.POLLING_INTERVAL_SECONDS} * * * * *`, async () => {
  await scanBlocks()
})
