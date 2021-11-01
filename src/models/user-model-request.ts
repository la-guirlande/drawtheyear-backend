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
}
