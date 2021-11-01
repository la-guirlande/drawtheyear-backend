import { Document, Model, Query, Schema } from 'mongoose';

/**
 * Base model attributes.
 */
export default interface Attributes {
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Deleted model.
 */
export interface DeletedAttributes {
  deleted: boolean;
}

/**
 * Adds the "expiration" attribute to delete models after the time has elapsed.
 * 
 * This function is a mongoose plugin.
 * 
 * @param schema Schema to apply the plugin
 * @param options Plugin options
 */
export function expirePlugin(schema: Schema, options: { expires: number }): void {
  schema.add({
    expiration: {
      type: Schema.Types.Date,
      default: new Date(),
      expires: options.expires
    }
  });
}

/**
 * Adds the "deleted" attribute to mark models as deleted instead of remove them from the database.
 * 
 * This function is a mongoose plugin.
 * 
 * @param schema Schema to apply the plugin
 */
export function deletedPlugin(schema: Schema): void {
  schema.add({
    deleted: {
      type: Schema.Types.Boolean,
      default: false,
      select: false
    }
  });
}
