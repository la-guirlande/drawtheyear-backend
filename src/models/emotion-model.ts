import mongooseToJson from '@meanie/mongoose-to-json';
import { Document, Model, Mongoose, Schema } from 'mongoose';
import autopopulate from 'mongoose-autopopulate';
import ServiceContainer from '../services/service-container';
import Attributes from './model';
import { UserInstance } from './user-model';

/**
 * Emotion attributes interface.
 */
export interface EmotionAttributes extends Attributes {
    name: string;
    color: string;
    owner: UserInstance;
}

/**
 * Emotion instance interface.
 */
export interface EmotionInstance extends EmotionAttributes, Document {}

/**
 * Creates the emotion model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose): Model<EmotionInstance> {
    return mongoose.model('Emotion', createEmotionSchema(container), 'emotions');
}

/**
 * Creates the emotion schema.
 * 
 * @param container Services container
 * @returns Emotion schema
 */
function createEmotionSchema(container: ServiceContainer) {
    const schema = new Schema({
        name: {
            type: Schema.Types.String,
            required: [true, 'Emotion name is required']
        },
        color: {
            type: Schema.Types.String,
            required: [true, 'Emotion color is required'],
            validate: {
                validator: (value: string) => /^#([0-9a-f]{3}){1,2}$/i.test(value),
                message: 'Invalid emotion color'
            }
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Emotion owner is required'],
            validate: {
                validator: async (ownerId: string) => ownerId != null && container.db.users.exists({ _id: ownerId }),
                message: 'Invalid owner'
            },
            autopopulate: true
        }
    }, {
        timestamps: true
    });
    schema.plugin(autopopulate);
    schema.plugin(mongooseToJson);
    return schema;
}
