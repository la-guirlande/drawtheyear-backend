import { Document, Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Attributes, { DeletedAttributes, deletedPlugin } from './model';
import { UserDocument } from './user-model';
const mongooseToJson = require('@meanie/mongoose-to-json');

/**
 * Emotion attributes.
 */
export interface Emotion extends Attributes, DeletedAttributes {
  owner: UserDocument;
  name: string;
  color: string;
}

/**
 * Emotion document.
 */
export interface EmotionDocument extends Emotion, Document {}

/**
 * Emotion model.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EmotionModel extends Model<EmotionDocument> {}

/**
 * Creates the emotion model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose): EmotionModel {
  return mongoose.model<EmotionDocument, EmotionModel>('Emotion', createEmotionSchema(container), 'emotions');
}

/**
 * Creates the emotion schema.
 * 
 * @param container Services container
 * @returns Emotion schema
 */
function createEmotionSchema(container: ServiceContainer) {
  const schema = new Schema<EmotionDocument, EmotionModel>({
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Emotion owner is required']
    },
    name: {
      type: Schema.Types.String,
      required: [true, 'Emotion name is required'],
      maxlength: [16, 'Emotion name is too long']
    },
    color: {
      type: Schema.Types.String,
      required: [true, 'Emotion color is required'],
      match: [/#([a-f0-9]{3}){1,2}\b/i, 'Invalid emotion color']
    }
  }, {
    timestamps: true
  });

  schema.pre('validate', async function(this: EmotionDocument, next) {
    if (this.isModified('name') && await container.db.emotions.exists({ owner: this.owner, name: this.name, deleted: false })) {
      this.invalidate('name', 'Emotion name already exists', this.name);
    }

    const count = await container.db.emotions.countDocuments({ owner: this.owner });
    if (count > 1000) {
      this.invalidate('name', 'To many emotions');
    }

    next();
  });

  schema.plugin(mongooseToJson);
  schema.plugin(deletedPlugin);

  return schema;
}
