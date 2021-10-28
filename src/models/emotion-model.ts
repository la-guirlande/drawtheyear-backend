import { Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Attributes from './model';

/**
 * Emotion attributes.
 */
export interface EmotionAttributes extends Attributes {
  name: string;
  color: string;
}

/**
 * Emotion instance.
 */
export interface EmotionInstance extends EmotionAttributes, Document {}

/**
 * Creates the emotion model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose): Model<EmotionInstance> {
  return mongoose.model<EmotionInstance>('Emotion', createEmotionSchema(), 'emotions');
}

/**
 * Creates the emotion schema.
 * 
 * @returns Emotion schema
 */
function createEmotionSchema() {
  const schema = new Schema<EmotionInstance, Model<EmotionInstance>, EmotionAttributes>({
    name: {
      type: Schema.Types.String,
      required: [true, 'Emotion name is required'],
      maxlength: [16, 'Emotion name is too long']
    },
    color: {
      type: Schema.Types.String,
      required: [true, 'Emotion color is required']
    }
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  return schema;
}
