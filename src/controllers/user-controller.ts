import { Request, Response } from 'express';
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
    this.registerEndpoint({ method: 'GET', uri: '/:id/emotions', handlers: container.db.userMR.listEmotionsHandler });
    this.registerEndpoint({ method: 'POST', uri: '/:id/emotions', handlers: container.db.userMR.createEmotionHandler });
    this.registerEndpoint({ method: 'PATCH', uri: '/:id/emotions/:emotionId', handlers: container.db.userMR.updateEmotionHandler });
    this.registerEndpoint({ method: 'DELETE', uri: '/:id/emotions/:emotionId', handlers: container.db.userMR.deleteEmotionHandler });
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
}
