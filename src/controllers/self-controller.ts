import { Request, Response } from 'express';
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
    this.registerEndpoint({ method: 'GET', uri: '/emotions', handlers: [container.auth.authenticateHandler, container.auth.isAuthenticatedHandler, container.db.userMR.listEmotionsHandler] });
    this.registerEndpoint({ method: 'POST', uri: '/emotions', handlers: [container.auth.authenticateHandler, container.auth.isAuthenticatedHandler, container.db.userMR.createEmotionHandler] });
    this.registerEndpoint({ method: 'PATCH', uri: '/emotions/:emotionId', handlers: [container.auth.authenticateHandler, container.auth.isAuthenticatedHandler, container.db.userMR.updateEmotionHandler] });
    this.registerEndpoint({ method: 'DELETE', uri: '/emotions/:emotionId', handlers: [container.auth.authenticateHandler, container.auth.isAuthenticatedHandler, container.db.userMR.deleteEmotionHandler] });
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
      if (authUser == null) {
        return res.status(404).json(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'User not found'
        }));
      }
      if (!authUser.hasPermission('own.read')) {
        return res.status(403).json(this.container.errors.formatErrors({
          error: 'forbidden',
          error_description: 'Permission denied'
        }));
      }
      return res.status(200).json({ user: authUser });
    } catch (err) {
      this.logger.error(err);
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }
}
