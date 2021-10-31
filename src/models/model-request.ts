import Component from '../component';
import ServiceContainer from '../services/service-container';


/**
 * Model request class.
 * 
 * A model request is used to make reusable controller requests.
 */
export default class ModelRequest extends Component {

  /**
   * Creates a new model request.
   * 
   * @param container Services container
   */
  public constructor(container: ServiceContainer) {
    super(container);
  }
}
