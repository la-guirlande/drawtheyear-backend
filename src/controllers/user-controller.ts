import { Request, Response } from 'express';
import _ from 'lodash';
import { Error as MongooseError } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Controller from './controller';

/**
 * Users controller class.
 * 
 * Root path : `/users`
 */
export default class UserController extends Controller {

  /**
   * Creates a new users controller.
   * 
   * @param container Services container
   */
  public constructor(container: ServiceContainer) {
    super(container, '/users');
    this.registerEndpoint({ method: 'GET', uri: '/', handlers: this.listHandler });
    this.registerEndpoint({ method: 'GET', uri: '/:id', handlers: this.getHandler });
    this.registerEndpoint({ method: 'DELETE', uri: '/:id', handlers: this.deleteHandler });
    this.registerEndpoint({ method: 'GET', uri: '/:id/emotions', handlers: this.listEmotionsHandler });
    this.registerEndpoint({ method: 'POST', uri: '/:id/emotions', handlers: this.createEmotionHandler });
    this.registerEndpoint({ method: 'PATCH', uri: '/:id/emotions/:emotionId', handlers: this.updateEmotionHandler });
    this.registerEndpoint({ method: 'DELETE', uri: '/:id/emotions/:emotionId', handlers: this.deleteEmotionHandler });
    this.registerEndpoint({ method: 'GET', uri: '/:id/days', handlers: this.listDaysHandler });
    this.registerEndpoint({ method: 'POST', uri: '/:id/days', handlers: this.createDayHandler });
    this.registerEndpoint({ method: 'PATCH', uri: '/:id/days/:date', handlers: this.updateDayhandler });
    this.registerEndpoint({ method: 'DELETE', uri: '/:id/days/:date', handlers: this.deleteDayHandler });
  }

  /**
   * Lists all users.
   * 
   * Path : `GET /users`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async listHandler(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).send({ users: await this.db.users.find().where('deleted').equals(false) });
    } catch (err) {
      this.logger.error(err);
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Gets a specific user.
   * 
   * Path : `GET /users/:id`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async getHandler(req: Request, res: Response): Promise<Response> {
    try {
      const user = await this.db.users.findById(req.params.id).where('deleted').equals(false);
      if (user == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found'
        }));
      }
      return res.status(200).send({ user });
    } catch (err) {
      this.logger.error(err);
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Deletes an user.
   * 
   * Path : `DELETE /users/:id`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async deleteHandler(req: Request, res: Response): Promise<Response> {
    try {
      const user = await this.db.users.findById(req.params.id).where('deleted').equals(false).select('deleted');
      if (user == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found'
        }));
      }
      user.deleted = true;
      await user.save();
      return res.status(204).send();
    } catch (err) {
      this.logger.error(err);
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Lists emotions.
   * 
   * Path : `GET /users/:id/emotions`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async listEmotionsHandler(req: Request, res: Response): Promise<Response> {
    try {
      const user = await this.db.users.findById(req.params.id).where('deleted').equals(false).select('emotions').populate({ path: 'emotions', match: { deleted: false } });
      if (user == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found'
        }));
      }
      return res.status(200).send({ emotions: user.emotions });
    } catch (err) {
      this.logger.error(err);
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Creates a new emotion.
   * 
   * Path : `POST /users/:id/emotions`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
   public async createEmotionHandler(req: Request, res: Response): Promise<Response> {
    try {
      if (!await this.db.users.exists({ _id: req.params.id })) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found'
        }));
      }
      const emotion = await this.db.emotions.create({ owner: req.params.id, ...req.body });
      return res.status(201).send({ id: emotion.id });
    } catch (err) {
      this.logger.error(err);
      if (err instanceof MongooseError.ValidationError) {
        return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
      }
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Updates an emotion.
   * 
   * Path : `PATCH /users/:id/emotions/:emotionId`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
   public async updateEmotionHandler(req: Request, res: Response): Promise<Response> {
    const { name, color } = req.body;
    try {
      if (!await this.db.users.exists({ _id: req.params.id })) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found'
        }));
      }
      const emotion = await this.db.emotions.findById(req.params.emotionId).where('deleted').equals(false);
      if (emotion == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'Emotion not found'
        }));
      }
      if (name != null) {
        emotion.name = name;
      }
      if (color != null) {
        emotion.color = color;
      }
      await emotion.save();
      return res.status(200).send({ id: emotion.id });
    } catch (err) {
      this.logger.error(err);
      if (err instanceof MongooseError.ValidationError) {
        return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
      }
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Deletes an emotion.
   * 
   * Path : `DELETE /users/:id/emotions/:emotionId`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
   public async deleteEmotionHandler(req: Request, res: Response): Promise<Response> {
    try {
      if (!await this.db.users.exists({ _id: req.params.id })) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found'
        }));
      }
      const emotion = await this.db.emotions.findById(req.params.emotionId).where('deleted').equals(false);
      if (emotion == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'Emotion not found'
        }));
      }
      emotion.deleted = true;
      await emotion.save();
      return res.status(204).send();
    } catch (err) {
      this.logger.error(err);
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Lists days.
   * 
   * Path : `GET /users/:id/days`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async listDaysHandler(req: Request, res: Response): Promise<Response> {
    try {
      const user = await this.db.users.findById(req.params.id).where('deleted').equals(false).select('days');
      if (user == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found'
        }));
      }
      return res.status(200).send({ days: user.days });
    } catch (err) {
      this.logger.error(err);
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Creates a new day.
   * 
   * Path : `POST /users/:id/days`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async createDayHandler(req: Request, res: Response): Promise<Response> {
    try {
      const user = await this.db.users.findById(req.params.id).where('deleted').equals(false).select('days');
      if (user == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found'
        }));
      }
      user.days.push(req.body);
      await user.save();
      return res.status(201).send({ id: _.last(user.days).date });
    } catch (err) {
      this.logger.error(err);
      if (err instanceof MongooseError.ValidationError) {
        return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
      }
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Updates a day.
   * 
   * Path : `PATCH /users/:id/days/:date`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async updateDayhandler(req: Request, res: Response): Promise<Response> {
    const { description, emotions } = req.body;
    try {
      const user = await this.db.users.findById(req.params.id).where('deleted').equals(false).select('+days');
      if (user == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found'
        }));
      }
      const day = user.days.find(day => day.date === req.params.date);
      if (day == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'Day not found'
        }));
      }
      if (description != null) {
        day.description = description;
      }
      if (emotions != null) {
        day.emotions = emotions;
      }
      user.markModified('days');
      await user.save();
      return res.status(200).send({ id: day.date });
    } catch (err) {
      this.logger.error(err);
      if (err instanceof MongooseError.ValidationError) {
        return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
      }
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Deletes a day.
   * 
   * Path : `DELETE /users/:id/days/:date`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async deleteDayHandler(req: Request, res: Response): Promise<Response> {
    try {
      const user = await this.db.users.findById(req.params.id).where('deleted').equals(false).select('days');
      if (user == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found'
        }));
      }
      const day = user.days.find(day => day.date === req.params.date);
      if (day == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'Day not found'
        }));
      }
      _.remove(user.days, day);
      user.markModified('days');
      await user.save();
      return res.status(204).send();
    } catch (err) {
      this.logger.error(err);
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }
}
