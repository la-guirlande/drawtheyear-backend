import mongooseToJson from '@meanie/mongoose-to-json';
import _ from 'lodash';
import moment from 'moment';
import { Document, Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import { EmotionInstance } from './emotion-model';
import Attributes from './model';

/**
 * User attributes interface.
 */
export interface UserAttributes extends Attributes {
    email: string;
    name: string;
    password: string;
    emotions: EmotionInstance[];
    days: Day[];
    refreshToken: string;
}

/**
 * Day interface.
 */
export interface Day {
    date: string;
    description: string;
    emotions: EmotionInstance[];
    toDate?(): Date;
}

/**
 * User instance interface.
 */
export interface UserInstance extends UserAttributes, Document {
}

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
        email: {
            type: Schema.Types.String,
            required: [true, 'Email is required'],
            unique: true
        },
        name: {
            type: Schema.Types.String,
            required: [true, 'Name is required'],
            unique: true
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
            default: [],
            validate: {
                validator: (days: Day[]) => _.uniq(days.map(day => day.date)).length === days.length,
                message: 'Day already exists'
            }
        },
        refreshToken: {
            type: Schema.Types.String,
            default: null
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
            type: Schema.Types.String,
            required: [true, 'Day date is required'],
            validate: [{
                validator: (date: string) => moment(date, 'YYYY-MM-DD').format('YYYY-MM-DD') === date,
                message: 'Date must be formatted in "YYYY-MM-DD"'
            }, {
                validator: (date: string) => moment(date).isSameOrBefore(new Date()),
                message: 'Date can\'t be superior of today'
            }]
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
            validate: [{
                validator: (emotionIds: string[]) => emotionIds.every(async emotionId => {
                    const emotion = await container.db.emotions.findById(emotionId).populate('owner');
                    if (emotion == null) {
                        return false;
                    }
                    await emotion.owner.populate('emotions').execPopulate();
                    return emotion.owner.emotions.includes(emotion);
                }),
                message: 'Invalid emotion'
            }, {
                validator: (emotions: EmotionInstance[]) => emotions.length > 0,
                message: '1 emotion minimum is required'
            }]
        }
    }, {
        _id: false,
        id: false,
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

    schema.method('toDate', function(this: Day): Date {
        return moment(this.date).toDate();
    });

    return schema;
}
