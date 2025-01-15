import { Web3 } from 'web3'
import abi from './abi.json'

require('dotenv').config()

const web3 = new Web3(process.env.EVM_RPC_URL)
const signer = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY)
web3.eth.accounts.wallet.add(signer)
const contract = new web3.eth.Contract(abi, process.env.DISTRIBUTION_CONTRACT)

export { web3, contract, signer }
