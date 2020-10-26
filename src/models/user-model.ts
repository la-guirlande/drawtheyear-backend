import mongooseToJson from '@meanie/mongoose-to-json';
import { Document, Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import { EmotionInstance } from './emotion-model';
import Attributes from './model';

/**
 * User attributes interface.
 */
export interface UserAttributes extends Attributes {
    name: string;
    password: string;
    emotions: EmotionInstance[];
    days: Day[];
}

/**
 * Day interface.
 */
export interface Day {
    date: Date;
    description: string;
    emotions: EmotionInstance[];
}

/**
 * User instance interface.
 */
export interface UserInstance extends UserAttributes, Document {}

/**
 * Creates the user model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose): Model<UserInstance> {
    return mongoose.model('User', createUserSchema(container), 'users');
}

/**
 * Creates the user schema.
 * 
 * @param container Services container
 * @returns User schema
 */
function createUserSchema(container: ServiceContainer) {
    const schema = new Schema({
        name: {
            type: Schema.Types.String,
            required: [true, 'Name is required'],
            unique: [true, 'Name already exists']
        },
        password: {
            type: Schema.Types.String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password is too small'],
            select: false
        },
        days: {
            type: [{
                type: createDaySubSchema(container)
            }],
            default: []
        }
    }, {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

    schema.virtual('emotions', {
        ref: 'Emotion',
        localField: '_id',
        foreignField: 'owner'
    });

    // Password hash validation
    schema.pre('save', async function(this: UserInstance, next) {
        if (this.password != null) { // Validates the password only if filled
            try {
                this.password = await container.crypto.hash(this.password, parseInt(process.env.HASH_SALT, 10));
                return next();
            } catch (err) {
                return next(err);
            }
        }
    });

    schema.plugin(mongooseToJson);

    return schema;
}

/**
 * Creates the day subschema.
 * 
 * @param container Services container
 * @returns Day subschema
 */
function createDaySubSchema(container: ServiceContainer) {
    const schema = new Schema({
        date: {
            type: Schema.Types.Date,
            required: [true, 'Day date is required']
        },
        description: {
            type: Schema.Types.String,
            default: null
        },
        emotions: {
            type: [{
                type: Schema.Types.ObjectId,
                ref: 'Emotion'
            }],
            required: [true, 'Day emotions are required'],
            validate: {
                validator: (emotions: EmotionInstance[]) => emotions.every(emotion => emotion.owner.emotions.includes(emotion)),
                message: 'Specified emotion is not owned by the user'
            }
        }
    }, {
        timestamps: true
    });
    return schema;
}
