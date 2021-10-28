import axios from 'axios';
import { Request, Response } from 'express';
import ServiceContainer from '../services/service-container';
import Controller from './controller';

/**
 * Authentication controller class.
 * 
 * Root path : `/auth`
 */
export default class AuthenticationController extends Controller {

  /**
   * Creates a new authentication controller.
   * 
   * @param container Services container
   */
  public constructor(container: ServiceContainer) {
    super(container, '/auth');
    this.registerEndpoint({ method: 'POST', uri: '/accessToken', handlers: this.accessToken });
  }

  /**
   * Gets a new access token with a refresh token.
   * 
   * Path: `POST /accessToken`
   * 
   * @param req Express request
   * @param res Express response
   */
  public async accessToken(req: Request, res: Response): Promise<Response> {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', { headers: { Authorization: res.getHeader('Authorization') as string } });
      return res.status(200).json(); // TODO Check if the user is correct with Google API
    } catch (err) {
      this.logger.error(err);
      return res.status(500).json(this.container.errors.formatServerError());
    }
  }
}
