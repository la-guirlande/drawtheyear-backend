import { Mongoose } from 'mongoose';
import createEmotionModel, { EmotionModel } from '../models/emotion-model';
import createUserModel, { UserModel } from '../models/user-model';
import Service from './service';
import ServiceContainer from './service-container';

/**
 * Database service class.
 * 
 * This service is used to interact with database(s). Models must be registered in this service.
 */
export default class DatabaseService extends Service {

  public readonly users: UserModel;
  public readonly emotions: EmotionModel;
  private readonly mongoose: Mongoose;

  /**
   * Creates a new database service.
   * 
   * @param container Services container
   */
  public constructor(container: ServiceContainer) {
    super(container);
    this.mongoose = this.createMongoose();
    this.users = createUserModel(container, this.mongoose);
    this.emotions = createEmotionModel(container, this.mongoose);
  }

  /**
   * Connects to a database.
   * 
   * @param url URL (example : `mongodb://database.com:27017/collection`)
   * @async
   */
  public async connect(url: string): Promise<void> {
    await this.mongoose.connect(url);
  }

  /**
   * Disconnects from a database.
   * 
   * @async
   */
  public async disconnect(): Promise<void> {
    await this.mongoose.disconnect();
  }

  /**
   * Creates Mongoose instance.
   * 
   * @returns Mongoose instance
   */
  private createMongoose(): Mongoose {
    return new Mongoose();
  }
}
