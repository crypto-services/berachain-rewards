# Berachain Rewards Script

## Setup

This requires NodeJS to be installed. Tested using v22.

### Clone the repo

```sh
git clone https://github.com/crypto-services/berachain-rewards.git
```

### Install packages

```sh
cd berachain-rewards
npm i
```

### Create .env file

```sh
cp .env.sample .env
nano .env
```

### Update .env values

```sh
EVM_RPC_URL=http://localhost:8545
BKIT_API=http://localhost:3500
TARGET_COINBASE=0x0000000000000000000000000000000000000000
DISTRIBUTION_CONTRACT=0x211bE45338B7C6d5721B5543Eb868547088Aca39
DISTANCE_FROM_HEAD=100
LOOK_BACK=8191
PRIVATE_KEY=0x
EXPLORER_URL=https://bartio.beratrail.io
POLLING_INTERVAL_SECONDS=60
```

| **Name**                   | **Description**                                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `EVM_RPC_URL`              | The URL of your EVM RPC.                                                                                                                                                                   |
| `BKIT_API`                 | The URL of your Beacon Kit API.                                                                                                                                                            |
| `TARGET_COINBASE`          | The rewards address for your validator as set in your config. This is the address which will listed as `miner` in the blocks you produce.                                                  |
| `DISTRIBUTION_CONTRACT`    | The address of the distribution contract.                                                                                                                                                  |
| `DISTANCE_FROM_HEAD`       | The script will scan up to latest block height - `DISTANCE_FROM_HEAD` with each round. Setting this too low will compete with the foundation distributor resulting in failed transactions. |
| `LOOK_BACK`                | The maximum number of blocks to look back when starting the script. Rewards older than 8191 blocks cannot be claimed.                                                                      |
| `PRIVATE_KEY`              | Private key for submitting transactions starting with 0x. Can be any address with enough funds for gas.                                                                                    |
| `EXPLORER_URL`             | The explorer url to use when creating links to submitted transactions.                                                                                                                     |
| `POLLING_INTERVAL_SECONDS` | How often in seconds the script should run.                                                                                                                                                |

### Run the script

```sh
npm start
```
