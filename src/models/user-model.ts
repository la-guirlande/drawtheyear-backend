import _ from 'lodash';
import { Document, Model, Mongoose, Schema, Types } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Attributes, { DeletedAttributes, deletedPlugin } from './model';
const mongooseToJson = require('@meanie/mongoose-to-json');

/**
 * User attributes.
 */
export interface User extends Attributes, DeletedAttributes {
  googleId: string;
  emotions: Emotion[];
}

/**
 * User document.
 */
export interface UserDocument extends User, Document {}

/**
 * User model.
 */
export interface UserModel extends Model<UserDocument> {
  getEmotions: () => Promise<Emotion[]>;
}

/**
 * Emotion attributes.
 */
export interface Emotion extends Attributes, DeletedAttributes {
  id: string;
  name: string;
  color: string;
}

/**
 * Creates the user model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose) {
  return mongoose.model<UserDocument, UserModel>('User', createUserSchema(), 'users');
}

/**
 * Creates the user schema.
 * 
 * @returns User schema
 */
function createUserSchema() {
  const schema = new Schema<UserDocument, UserModel>({
    googleId: {
      type: Schema.Types.String,
      required: [true, 'Google ID is required'],
      unique: true
    },
    emotions: {
      type: [{
        type: createEmotionSchema()
      }],
      default: [],
      validate: [{
        validator: (emotions: Emotion[]) => emotions.length <= 1000,
        message: 'Too many emotions'
      }, {
        validator: (emotions: Emotion[]) => _.uniq(emotions.map(emotion => emotion.name)).length === emotions.length,
        message: 'Emotion name already exists'
      }]
    }
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

  schema.plugin(mongooseToJson);
  schema.plugin(deletedPlugin);

  return schema;
}

/**
 * Creates the emotion subschema.
 * 
 * @returns Emotion subschema
 */
function createEmotionSchema() {
  const schema = new Schema<Emotion>({
    name: {
      type: Schema.Types.String,
      required: [true, 'Emotion name is required'],
      maxlength: [16, 'Emotion name is too long'],
      unique: true
    },
    color: {
      type: Schema.Types.String,
      required: [true, 'Emotion color is required'],
      match: [/#([a-f0-9]{3}){1,2}\b/i, 'Invalid emotion color']
    }
  }, {
    timestamps: true
  });

  schema.plugin(deletedPlugin);

  return schema;
}
