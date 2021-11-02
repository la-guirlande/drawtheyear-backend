import axios from 'axios';
import { Request, Response } from 'express';
import ServiceContainer from '../services/service-container';
import { AccessTokenData } from '../services/token-service';
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
      // const response = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', { headers: { Authorization: res.getHeader('Authorization') as string } });
      const accessToken = await this.container.tokens.encode<AccessTokenData>({ userId: '61812492271832f17a07170d' }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '100d' });
      return res.status(200).json({ access_token: accessToken }); // TODO Check if the user is correct with Google API
    } catch (err) {
      this.logger.error(err);
      return res.status(500).json(this.container.errors.formatServerError());
    }
  }
}
