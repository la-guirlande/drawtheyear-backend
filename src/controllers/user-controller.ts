import { Request, Response } from 'express';
import _ from 'lodash';
import { Error as MongooseError } from 'mongoose';
import { UserModel } from '../models/user-model';
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
    this.registerEndpoint({ method: 'GET', uri: '/info', handlers: [this.container.auth.authenticateHandler, this.container.auth.isAuthenticatedHandler, this.infoHandler] });
    this.registerEndpoint({ method: 'GET', uri: '/', handlers: this.listHandler });
    this.registerEndpoint({ method: 'GET', uri: '/:id', handlers: this.getHandler });
    this.registerEndpoint({ method: 'DELETE', uri: '/:id', handlers: this.deleteHandler });
    this.registerEndpoint({ method: 'GET', uri: '/:id/emotions', handlers: this.listEmotionsHandler });
    this.registerEndpoint({ method: 'POST', uri: '/:id/emotions', handlers: this.createEmotionHandler });
    this.registerEndpoint({ method: 'PATCH', uri: '/:id/emotions/:emotionId', handlers: this.updateEmotionHandler });
    this.registerEndpoint({ method: 'DELETE', uri: '/:id/emotions/:emotionId', handlers: this.deleteEmotionHandler });
  }

  /**
   * Returns the authenticated user.
   * 
   * Path : `GET /users/info`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async infoHandler(req: Request, res: Response): Promise<Response> {
    try {
      const authUser: UserModel = res.locals.authUser;
      if (authUser == null) {
        return res.status(404).json(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found'
        }));
      }
      return res.status(200).json({ user: authUser });
    } catch (err) {
      return res.status(500).send(this.container.errors.formatServerError());
    }
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
      return res.status(200).send({ users: await this.db.users.find().where('deleted').equals(false).select('-emotions') });
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
      const user = await this.db.users.findById(req.params.id).where('deleted').equals(false).select('-emotions');
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
   * Lists all user's emotions.
   * 
   * Path : `GET /users/:id/emotions`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async listEmotionsHandler(req: Request, res: Response): Promise<Response> {
    try {
      const { emotions } = await this.db.users.findById(req.params.id).select('emotions');
      if (emotions == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found'
        }));
      }
      return res.status(200).send({ emotions: emotions.filter(emotion => !emotion.deleted) });
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
      const user = await this.db.users.findById(req.params.id).select('emotions');
      if (user == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found'
        }));
      }
      user.emotions.push(req.body);
      await user.save();
      return res.status(201).send({ id: _.last(user.emotions).id });
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
      const user = await this.db.users.findById(req.params.id).select('emotions');
      if (user == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found'
        }));
      }
      const emotion = user.emotions.find(emotion => !emotion.deleted && emotion.id === req.params.emotionId);
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
      await user.save();
      return res.status(200).send({ id: req.params.emotionId });
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
      const user = await this.db.users.findById(req.params.id).where('deleted').equals(false);
      if (user == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found'
        }));
      }
      const emotion = user.emotions.find(emotion => !emotion.deleted && emotion.id === req.params.emotionId);
      if (emotion == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'Emotion not found'
        }));
      }
      emotion.deleted = true;
      await user.save();
      return res.status(204).send();
    } catch (err) {
      this.logger.error(err);
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }
}
