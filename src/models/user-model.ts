import { Document, Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Attributes from './model';
const mongooseToJson = require('@meanie/mongoose-to-json');

/**
 * User attributes.
 */
export interface UserAttributes extends Attributes {
  googleId: string;
}

/**
 * User instance.
 */
export interface UserInstance extends UserAttributes, Document {}

/**
 * Creates the user model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose): Model<UserInstance> {
  return mongoose.model('User', createUserSchema(), 'users');
}

/**
 * Creates the user schema.
 * 
 * @returns User schema
 */
function createUserSchema() {
  const schema = new Schema<UserInstance>({
    googleId: {
      type: Schema.Types.String,
      required: [true, 'Google ID is required']
    }
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

  schema.plugin(mongooseToJson);

  return schema;
}
