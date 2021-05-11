<p align="center"><img src="https://governable.symbol.ninja/logo-governable.png" width="192"></p>

# Governable: Distributed Organizations

[![npm-badge][npm-badge]][npm-url]
[![size-badge][size-badge]][npm-url]
[![dl-badge][dl-badge]][npm-url]
[![Build Status](https://travis-ci.com/UsingBlockchain/symbol-taxonomy.svg?branch=main)](https://travis-ci.com/UsingBlockchain/symbol-taxonomy)

This repository contains the source code for **governable**, an open standard for managing distributed organizations on top of Symbol from NEM, and compatible networks.

This library empowers the creation and operations of **distributed organizations** using Symbol from NEM and compatible networks.

- [Reference documentation][ref-docs]
- [Introduction](#introduction)
- [Contracts found here](#contracts-found-here)
- [Installation](#installation)
- [Sponsor Us](#sponsor-us)
- [Disclaimer](#disclaimer)
- [Licensing](#license)

## Introduction

This library empowers the creation and operations of distributed organizations using Symbol from NEM and compatible networks.

A distributed organization is represented by the following properties, which have to be agreed upon by operators during an initial launch agreement:

- **An agreement transaction**: Consists of a multi-signature account which uses `SecretLockTransaction` and `TransferTransaction` to prove a DAO agreement of operators on-chain.

- **A target account**: Consists of a public account that was agreed upon by operators to represent the distributed organization as an entity. This account will be converted to a multi-signature account where cosignatories are the operators of the DAO.

- **A governance mosaic**: Consists of a digital asset that is created only for the purpose of keeping track of operators' ability to help with decision making in a distributed organization. Governance mosaics are always non-transferrable. This implies that a *transfer* of authority is not possible and, isntead, enforces an *agreement* to be persisted on-chain.

## Contracts found here

| Contract Name | Description |
| --- | --- |
| **CreateAgreement** | Contract for *starting* a DAO launch agreement with associates (other operators), and thereby initiating the process of creation of a distributed organization. Note, that the first listed operator account will *fund* the account used for the *agreement* with 1 `symbol.xym`. This amount is sent to the **target** account when the agreement has been **commited** to and confirmed on the network.|
| **CommitAgreement** | Contract for *finalizing* a DAO launch agreement. Operators must be the same as those whom previously executed the `CreateAgreement` contract. The funds locked by secret are hereby unlocked and owned by the agreed upon target public account of the DAO. |
| **CreateDAO** | Contract for creating a distributed organization with operators. A launch agreement MUST have taken place before and also MUST be accessible through the network to read information about the agreed target account public key. |

## Installation

`npm i -g @ubcdigital/governable`

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

## Disclaimer

  *The author of this package cannot be held responsible for any loss of money or any malintentioned usage forms of this package. Please use this package with caution.*

  *Our software contains links to the websites of third parties (“external links”). As the content of these websites is not under our control, we cannot assume any liability for such external content. In all cases, the provider of information of the linked websites is liable for the content and accuracy of the information provided. At the point in time when the links were placed, no infringements of the law were recognisable to us..*

## License

Copyright 2020-2021 [Using Blockchain Ltd][ref-ltd], Reg No.: 12658136, United Kingdom, All rights reserved.

Licensed under the [AGPL v3 License](LICENSE).

[ref-docs]: https://governable.symbol.ninja/
[ref-ltd]: https://using-blockchain.org
[npm-url]: https://www.npmjs.com/package/@ubcdigital/governable
[npm-badge]: https://img.shields.io/npm/v/@ubcdigital/governable
[size-badge]: https://img.shields.io/bundlephobia/min/@ubcdigital/governable
[dl-badge]: https://img.shields.io/npm/dt/@ubcdigital/governable
