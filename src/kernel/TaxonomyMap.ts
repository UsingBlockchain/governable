/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */
import { TransactionType } from 'symbol-sdk'

/**
* @class TaxonomyMapEntry
* @package Governable
* @subpackage Kernel
* @since v1.0.0
* @description Interface that describes a transaction sequence entry.
*/
export interface TaxonomyMapEntry {
  /**
  * @description The entry's expected transaction type.
  */
  type: TransactionType,

  /**
  * @description Whether this entry is require or not.
  */
  required: boolean,
}

/**
* @class TaxonomyMap
* @package Governable
* @subpackage Kernel
* @since v1.0.0
* @description Class that describes an indexed transaction sequence.
*/
export class TaxonomyMap extends Map<number, TaxonomyMapEntry> {}
