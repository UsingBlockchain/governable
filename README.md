# Governable: Distributed Organizations

[![npm version](https://badge.fury.io/js/governable.svg)](https://badge.fury.io/js/governable)
[![Build Status](https://travis-ci.com/usingblockchain/governable.svg?branch=main)](https://travis-ci.com/usingblockchain/governable)

This repository contains the source code for **governable**, an open standard for managing distributed organizations on top of Symbol from NEM, and compatible networks.

- [Reference documentation](https://governable.symbol.ninja/docs/1.0.0)
- [Installation](#installation)
- [Usage](#usage)
- [Sponsor Us](#sponsor-us)
- [Disclaimer](#disclaimer)
- [Licensing](#license)

## Installation

`npm i -g governable`

## Usage

:warning: The following example usage for the `governable` library is subject to change.
:warning: This command execution creates at least one- or more than one - network-wide
**account restriction**. Restrictions can potentially lock you out of your account, so
please use this only with caution and only if you understand the risks.

:white_check_mark: This package uses TEST_NET by default, you are free to specifiy other
network parameters (see `transactionParams` in the source code below).

```javascript
import { NetworkType, PublicAccount } from 'symbol-sdk'
import { MnemonicPassPhrase } from 'symbol-hd-wallets'
import { TransactionURI } from 'symbol-hd-wallets'
import { Governable, NetworkConfig, TransactionParameters } from 'governable'

// - The following settings are network specific and may need changes
const networkType = NetworkType.TEST_NET
const sourceNetwork = '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6'
const symbolMosaicId = '6BED913FA20223F8';
const transactionParams = new TransactionParameters(
  1573430400, // epochAdjustment
  Deadline.create(), // transaction(s) deadline
  750000, // maxFee
)

// - You should use secure storage practices for mnemonic pass phrases.
const keyRing = MnemonicPassPhrase.createRandom()

// - Initializes a so-called "network reader". The URL used here should
//   typically refer to a running REST gateway on your node.
const reader = new Symbol.Reader(
  'http://dual-001.symbol.ninja:3000',
  networkType,
  sourceNetwork,
  1615853185,
  new MosaicId(symbolMosaicId),
  '306FA94E0AB682964416C8172F858939533E5998906B8AFAD4A4585C7CDD722C',
)

// - Initializes a key provider and distributed organization instance.
const signer = new Symbol.Signer() 
const myAwesomeOrg = new Governable.DistributedOrganization(
  'My awesome DAO',
  reader,
  signer,
  keyRing,
  's3t.a;Secure!P4ssw0rd#',
)

// - Stores the transaction URI for `CreateAgreement` execution
const resultURI = myAwesomeOrg.execute(
  myAwesomeOrg.getTarget().publicAccount, // actor
  myAwesomeOrg.identifier,
  'CreateAgreement',
  transactionParams,
  []
)

// It is important to denote that given the **aggregate** nature of digital
// contracts, multiple parties MAY be involved in the transaction and
// it is therefor required to issue a HashLockTransaction before announcing
// the aggregate bonded transaction that represents the contract.

// :warning: It is recommended to sign the resulting transactions
// using a hardware wallet rather than any type of software generated
// wallets.
```

## Sponsor us

| Platform | Sponsor Link |
| --- | --- |
| Paypal | [https://paypal.me/usingblockchainltd](https://paypal.me/usingblockchainltd) |
| Patreon | [https://patreon.com/usingblockchainltd](https://patreon.com/usingblockchainltd) |
| Github | [https://github.com/sponsors/UsingBlockchain](https://github.com/sponsors/UsingBlockchain) |

## Donations / Pot de vin

Donations can also be made with cryptocurrencies and will be used for running the project!

    NEM      (XEM):     NB72EM6TTSX72O47T3GQFL345AB5WYKIDODKPPYW
    Symbol   (XYM):     NDQALDK4XWLOUYKPE7RDEWUI25YNRQ7VCGXMPCI
    Ethereum (ETH):     0x7a846fd5Daa4b904caF7C59f866bb906153305D2
    Bitcoin  (BTC):     3EVqgUqYFRYbf9RjhyjBgKXcEwAQxhaf6o

## Credits

| Name | Contributions |
| --- | --- |
| Using Blockchain Ltd (@UsingBlockchain) <info@using-blockchain.org> | Product Owner |
| Grégory Saive (@eVias) | Lead Engineering |

## Disclaimer

  *The author of this package cannot be held responsible for any loss of money or any malintentioned usage forms of this package. Please use this package with caution.*

  *Our software contains links to the websites of third parties (“external links”). As the content of these websites is not under our control, we cannot assume any liability for such external content. In all cases, the provider of information of the linked websites is liable for the content and accuracy of the information provided. At the point in time when the links were placed, no infringements of the law were recognisable to us..*

## License

Copyright 2020-2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom, All rights reserved.

Licensed under the [AGPL v3 License](LICENSE).
