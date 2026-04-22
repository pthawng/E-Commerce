import { Principal } from '../types/principal.types';

/**
 * Interface for any resource that implies ownership.
 */
export interface IOwnable {
  /**
   * Returns a list of principals that have direct ownership of this resource.
   */
  getOwners(): Principal[];
}
