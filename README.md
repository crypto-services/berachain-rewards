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

Update the .env file with the values for your validator:

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

## Disclaimer

This disclaimer ("Disclaimer") sets forth the general guidelines, disclosures, and terms of your use of the software ("Software") provided by Republic Node Jersey Limited, a Bailiwick of Jersey company ("Company", "we", "our", "us") under the MIT License. The Software is designed for running blockchain nodes and is made available to you free of charge. By accessing, downloading, or using the Software, you acknowledge that you have read, understood, and agree to be bound by this Disclaimer.

No Warranties

The Software is provided on an "AS IS" and "AS AVAILABLE" basis. The Company expressly disclaims all warranties, whether express, implied, statutory, or otherwise, with respect to the Software, including all implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement. Without limitation, we make no warranty or guarantee that the Software will meet your requirements, achieve any intended results, be compatible, or work with any other software, systems, or services, operate without interruption, or be error-free.

Limitation of Liability

To the fullest extent permitted by applicable law, in no event will the Company, its affiliates, directors, employees, agents, suppliers, or licensors be liable for (a) any indirect, incidental, special, consequential, or punitive damages, including but not limited to, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Software; (b) any conduct or content of any third party on the Software; (c) any content obtained from the Software; and (d) unauthorized access, use, or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed its essential purpose.

Indemnification

You agree to defend, indemnify, and hold harmless the Company and its licensee and licensors, and their employees, contractors, agents, officers, and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees), resulting from or arising out of a) your use and access of the Software, or b) a breach of these terms.

Modifications and Amendments

The Company reserves the right, at its sole discretion, to modify or replace this Disclaimer at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
