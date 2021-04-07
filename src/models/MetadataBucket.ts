/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */
/**
 * @class MetadataBucket
 * @package Models
 * @since v1.0.0
 * @description Model that describes the metadata of internal securities.
 * @link https://en.wikipedia.org/wiki/Standard_Industrial_Classification
 */
 export class MetadataBucket {
  /**
   * Constructor for MetadataBucket objects
   *
   * @param {string} source
   */
  public constructor(
    /**
     * @description The company name
     */
    public name: string,

    /**
     * @description A SIC code or NAICS code (industrial classifications)
     * @link https://en.wikipedia.org/wiki/Standard_Industrial_Classification
     * @link https://en.wikipedia.org/wiki/North_American_Industry_Classification_System
     */
    public code: string,

    /**
     * @description The website of the company
     */
    public website: string,

    /**
     * @description The contact URI (e.g.: "mailto:info@swaps.cloud")
     */
    public contact: string,

    /**
     * @description The description of the company
     */
    public description: string,

    /**
     * @description An image representative of the company (e.g. logo)
     */
    public image: string,

    /**
     * @description Custom metadata entries
     */
    public customMetadata: {[k: string]: string} = {},
  )
  {}
}
