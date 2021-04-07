/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */

/**
 * @interface Reader
 * @package Governable
 * @subpackage Kernel
 * @since v1.0.0
 * @description Interface that describes a network reader.
 */
export interface Reader {

  /**
   * @description The endpoint URL. This URL shall point to the network
   *              node that is used to READ data about governable assets.
   *
   * @example https://node.ubc.digital:3000
   * @example xml+rpc://bitcoin.ubc.digital:1234
   */
  gatewayUrl: string

}
