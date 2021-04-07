/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */
import {
  Address,
  Metadata,
  MetadataType,
} from 'symbol-sdk'

// internal dependencies
import { Service } from '../kernel/Service'
import * as Symbol from '../adapters/Symbol'
import { AssetIdentifier } from '../models/AssetIdentifier'
import { MetadataBucket } from '../models/MetadataBucket'

// internal type definition
type FormattedMetadata = {
  scopedMetadataKey: string,
  senderAddress: Address,
  targetAddress: Address,
  metadataType: MetadataType,
  targetId: string | undefined,
  metadataValue: string
}

/**
 * @class MetadataService
 * @package Governable
 * @subpackage Services
 * @since v1.0.0
 * @description Class that describes a service to facilitate the
 *              handling and processes with network-wide metadata.
 */
export class MetadataService extends Service {
  /**
   * @static
   * @access public
   * @description Known metadata keys
   */
  public static KNOWN_METADATAS: {[k: string]: string} = {
    'XXX1': 'dao_name',
    'XXX2': 'dao_code',
    'XXX3': 'dao_website_uri',
    'XXX4': 'dao_contact_uri',
    'XXX5': 'dao_description',
    'XXX6': 'dao_image_uri'
  }

  /**
   * @static
   * @access public
   * @description Entries are sorted by index of appearance.
   */
  public static SORT_ORDER = Object.keys(MetadataService.KNOWN_METADATAS)

  /**
   * @function Governable.MetadataService.readTransactionFromNetwork()
   * @access public
   * @description Gets metadata given a distributed organization target
   *              public account address.
   *
   * @param   {AssetIdentifier}  identifier   The asset identifier
   * @returns {Transaction | undefined}   The transaction or nothing.
   */
  public async readMetadataFromNetwork(
    target: Address
  ): Promise<MetadataBucket> {
    // shortcuts
    const factory = (this.context.reader as Symbol.Reader).factoryHttp
    type Dictionary = {[k: string]: string}

    // - Reads metadata about account from network
    const entries = await factory.createMetadataRepository().search(
      { targetAddress: target }
    ).toPromise()

    // - Sorts entries by storage index
    const sorted = entries.data.map(
      (metadata: Metadata) => this.formatMetadata(metadata)
    ).sort(this.sortPredicate)

    // - Builds a key-value dictionary
    const dictionary: Dictionary = sorted.map(this.toDictionary).reduce(
      (prev, current) => ({...prev, ...current}))

    return new MetadataBucket(
      dictionary['dao_name'],
      dictionary['dao_code'],
      dictionary['dao_website_uri'],
      dictionary['dao_contact_uri'],
      dictionary['dao_description'],
      dictionary['dao_image_uri'],
      {} // custom metadata
    )
  }

  /**
   * @function Governable.MetadataService.getKnownMetadataKey()
   * @static
   * @access public
   * @description Helper function to retrieve known mosaic metadata keys
   *
   * @param   {string}    hexKey    The hexadecimal scoped metadata key.
   * @return  {string}    The snake-case representation if exists.
   */
  public static getKnownMetadataKey(
     hexKey: string,
  ): string {
    return hexKey in MetadataService.KNOWN_METADATAS
      ? MetadataService.KNOWN_METADATAS[hexKey]
      : hexKey
  }

  /**
   * @function Governable.MetadataService.formatMetadata()
   * @access protected
   * @description Helper function to format metadata entries
   *
   * @see {FormattedMetadata}
   * @param   {Metadata}  metadataEntry   The entry to be formatted.
   * @return  {FormattedMetadata}         The formatted metadata object.
   */
  protected formatMetadata(
    metadata: Metadata,
  ): FormattedMetadata {
    const metadataEntry = metadata.metadataEntry
    return ({
      ...metadataEntry,
      scopedMetadataKey: metadataEntry.scopedMetadataKey.toHex(),
      senderAddress: metadataEntry.sourceAddress,
      targetAddress: metadataEntry.targetAddress,
      metadataType: MetadataType.Account,
      targetId: metadataEntry.targetId ? metadataEntry.targetId.toHex() : undefined,
      metadataValue: metadataEntry.value
    })
  }

  /**
   * @function Governable.MetadataService.sortPredicate()
   * @access protected
   * @description Helper function to sort metadata entries
   * 
   * @see {FormattedMetadata}
   * @param   {FormattedMetadata}   a
   * @param   {FormattedMetadata}   b
   * @return  {number}              Difference between A and B indexes.
   */
  protected sortPredicate(
    a: FormattedMetadata,
    b: FormattedMetadata
  ): number {
    let finderFn = MetadataService.SORT_ORDER.findIndex

    // - Keys are ordered depending on appearance in SORT_ORDER
    const indexA = finderFn(v => v === a.scopedMetadataKey)
    const indexB = finderFn(v => v === b.scopedMetadataKey)
    return indexA - indexB
  }

  /**
   * @function Governable.MetadataService.toDictionary()
   * @access protected
   * @description Helper function to build a key-value pair
   *              of a metadata entry.
   * 
   * @param   {FormattedMetadata}   entry   The entry to read.
   * @return  {[k: string]: string}         The entry as a key-value pair.
   */
  protected toDictionary(
    entry: FormattedMetadata,
  ): {[k: string]: string} {
    let knownKeys = MetadataService.SORT_ORDER
    let scopedKey = entry.scopedMetadataKey

    // - Overwrites metadata hexadecimal with "known field"
    if (-1 !== knownKeys.indexOf(scopedKey)) {
      scopedKey = MetadataService.getKnownMetadataKey(scopedKey)
    }

    return {[scopedKey]: entry.metadataValue}
  }
}
