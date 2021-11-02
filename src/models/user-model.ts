import _ from 'lodash';
import moment from 'moment';
import { Document, Model, Mongoose, Schema, Error as MongooseError } from 'mongoose';
import { Permission, Role } from '../services/permission-service';
import ServiceContainer from '../services/service-container';
import { EmotionDocument } from './emotion-model';
import Attributes, { DeletedAttributes, deletedPlugin } from './model';
const mongooseToJson = require('@meanie/mongoose-to-json');

/**
 * User attributes.
 */
export interface User extends Attributes, DeletedAttributes {
  googleId: string;
  role: Role;
  emotions: EmotionDocument[];
  days: Day[];
}

/**
 * User document.
 */
export interface UserDocument extends User, Document {
  hasPermission(perm: Permission): boolean;
}

/**
 * User model.
 */
export interface UserModel extends Model<UserDocument> {}

/**
 * Day attributes.
 */
export interface Day extends Attributes {
  date: string;
  emotions: EmotionDocument[];
  description: string;
}

/**
 * Creates the user model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose) {
  return mongoose.model<UserDocument, UserModel>('User', createUserSchema(container), 'users');
}

/**
 * Creates the user schema.
 * 
 * @param container Services container
 * @returns User schema
 */
function createUserSchema(container: ServiceContainer) {
  const schema = new Schema<UserDocument, UserModel>({
    googleId: {
      type: Schema.Types.String,
      required: [true, 'Google ID is required'],
      unique: true
    },
    role: {
      type: Schema.Types.String,
      enum: Object.keys(container.config.services.permissions.roles),
      default: container.permissions.defaultRole
    },
    days: {
      type: [{
        type: createDaySchema()
      }],
      default: [],
      validate: {
        validator: (days: Day[]) => _.uniq(days.map(day => day.date)).length === days.length,
        message: 'Day already exists'
      },
      select: false
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

  schema.method('hasPermission', function(this: UserDocument, perm: Permission) {
    return container.permissions.getPermissions(this.role).includes(perm);
  });

  schema.pre('validate', async function(this: UserDocument, next) {
    if (this.isModified('days')) {
      await this.populate('days.emotions', 'owner');
      if (!this.days.every(day => day.emotions.every(emotion => emotion.owner.toString() === this.id))) {
        this.invalidate('days', 'Day emotion(s) not found');
      }
    }
    next();
  });

  schema.plugin(mongooseToJson);
  schema.plugin(deletedPlugin);

  return schema;
}

/**
 * Creates the day subschema.
 * 
 * @returns Day subschema
 */
function createDaySchema() {
  const schema = new Schema<Day>({
    date: {
      type: Schema.Types.String,
      required: [true, 'Day date is required'],
      // eslint-disable-next-line no-useless-escape
      match: [/^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/, 'Invalid day date format'],
      validate: {
        validator: (date: string) => {
          const realDate = moment(date);
          return realDate.isValid() && realDate.isBefore(moment()) && realDate.isAfter(moment('2000-01-01'));
        },
        message: 'Invalid day date'
      }
    },
    emotions: {
      type: [{
        type: Schema.Types.ObjectId,
        ref: 'Emotion',
      }],
      validate: [{
        validator: (emotions: EmotionDocument[]) => emotions.length > 0,
        message: 'Day emotions are required'
      }, {
        validator: (emotions: EmotionDocument[]) => _.uniq(emotions.map(emotion => emotion.id)).length === emotions.length,
        message: 'Day emotion already exists'
      }],
      description: {
        type: Schema.Types.String,
        maxlength: [100000, 'Day description is too long'],
        default: null
      }
    }
  }, {
    _id: false,
    id: false,
    timestamps: true
  });

  return schema;
}
