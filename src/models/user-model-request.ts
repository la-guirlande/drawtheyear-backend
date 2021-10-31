import { Request, Response } from 'express';
import _ from 'lodash';
import { Error as MongooseError } from 'mongoose';
import ServiceContainer from '../services/service-container';
import ModelRequest from './model-request';

/**
 * User model request class.
 */
export default class UserModelRequest extends ModelRequest {

  /**
   * Creates a new user model request.
   * 
   * @param container Services container
   */
  public constructor(container: ServiceContainer) {
    super(container);
  }

  /**
   * Lists all user's emotions.
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async listEmotionsHandler(req: Request, res: Response): Promise<Response> {
    const { authUserId } = res.locals;
    try {
      const user = await this.db.users.findById(authUserId || req.params.id).select('emotions');
      if (user == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found'
        }));
      }
      return res.status(200).send({ emotions: user.emotions.filter(emotion => !emotion.deleted) });
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
