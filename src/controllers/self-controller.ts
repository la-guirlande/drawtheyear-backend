import { Request, Response } from 'express';
import _ from 'lodash';
import { Error as MongooseError } from 'mongoose';
import { UserDocument } from '../models/user-model';
import ServiceContainer from '../services/service-container';
import Controller from './controller';

/**
 * Self controller class.
 * 
 * Root path : `/me`
 */
export default class SelfController extends Controller {

  public constructor(container: ServiceContainer) {
    super(container, '/me');
    this.registerEndpoint({ method: 'GET', uri: '/', handlers: [container.auth.authenticateHandler, container.auth.isAuthenticatedHandler, this.infoHandler] });
    this.registerEndpoint({ method: 'GET', uri: '/emotions', handlers: [container.auth.authenticateHandler, container.auth.isAuthenticatedHandler, this.listEmotionsHandler] });
    this.registerEndpoint({ method: 'POST', uri: '/emotions', handlers: [container.auth.authenticateHandler, container.auth.isAuthenticatedHandler, this.createEmotionHandler] });
    this.registerEndpoint({ method: 'PATCH', uri: '/emotions/:emotionId', handlers: [container.auth.authenticateHandler, container.auth.isAuthenticatedHandler, this.updateEmotionHandler] });
    this.registerEndpoint({ method: 'DELETE', uri: '/emotions/:emotionId', handlers: [container.auth.authenticateHandler, container.auth.isAuthenticatedHandler, this.deleteEmotionHandler] });
  }

  /**
   * Returns the authenticated user.
   * 
   * Path : `GET /me`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
   public async infoHandler(req: Request, res: Response): Promise<Response> {
    try {
      const authUser: UserDocument = res.locals.authUser;
      authUser.deleted = undefined;
      authUser.emotions = undefined;
      return res.status(200).json({ user: authUser });
    } catch (err) {
      this.logger.error(err);
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Lists all user's emotions.
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async listEmotionsHandler(req: Request, res: Response): Promise<Response> {
    try {
      const emotions = (res.locals.authUser as UserDocument).emotions.filter(emotion => !emotion.deleted);
      emotions.forEach(emotion => emotion.deleted = undefined);
      return res.status(200).send({ emotions });
    } catch (err) {
      this.logger.error(err);
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Creates a new emotion.
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async createEmotionHandler(req: Request, res: Response): Promise<Response> {
    try {
      const authUser: UserDocument = res.locals.authUser;
      authUser.emotions.push(req.body);
      await authUser.save();
      return res.status(201).send({ id: _.last(authUser.emotions).id });
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
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async updateEmotionHandler(req: Request, res: Response): Promise<Response> {
    const { name, color } = req.body;
    try {
      const authUser: UserDocument = res.locals.authUser;
      const emotion = authUser.emotions.find(emotion => !emotion.deleted && emotion.id === req.params.emotionId);
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
      await authUser.save();
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
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async deleteEmotionHandler(req: Request, res: Response): Promise<Response> {
    try {
      const authUser: UserDocument = res.locals.authUser;
      const emotion = authUser.emotions.find(emotion => !emotion.deleted && emotion.id === req.params.emotionId);
      if (emotion == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'Emotion not found'
        }));
      }
      emotion.deleted = true;
      await authUser.save();
      return res.status(204).send();
    } catch (err) {
      this.logger.error(err);
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }
}
