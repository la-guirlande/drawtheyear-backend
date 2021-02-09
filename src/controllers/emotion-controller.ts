import { Request, Response } from 'express';
import ServiceContainer from '../services/service-container';
import Controller, { Link } from './controller';

/**
 * Emotions controller class.
 * 
 * Root path : `/emotions`
 */
export default class EmotionController extends Controller {

    /**
     * Creates a new emotions controller.
     * 
     * @param container Services container
     */
    public constructor(container: ServiceContainer) {
        super(container, '/emotions');
        this.registerEndpoint({ method: 'GET', uri: '/', handlers: this.listHandler });
        this.registerEndpoint({ method: 'GET', uri: '/:id', handlers: this.specificHandler });
        this.registerEndpoint({ method: 'POST', uri: '/', handlers: this.createHandler });
        this.registerEndpoint({ method: 'PUT', uri: '/:id', handlers: this.modifyHandler });
        this.registerEndpoint({ method: 'PATCH', uri: '/:id', handlers: this.updateHandler });
        this.registerEndpoint({ method: 'DELETE', uri: '/:id', handlers: this.deleteHandler });
    }

    /**
     * Lists all emotions.
     * 
     * Path : `GET /emotions`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async listHandler(req: Request, res: Response): Promise<Response> {
        try {
            return res.status(200).json({ emotions: await this.db.emotions.find(req.query).populate('owner') });
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Gets a specific emotion.
     * 
     * Path : `GET /emotions`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async specificHandler(req: Request, res: Response): Promise<Response> {
        try {
            const emotion = await this.db.emotions.findById(req.params.id).populate('owner');
            if (emotion == null) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Emotion not found'
                }));
            }
            return res.status(200).json({ emotion });
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Creates a new emotion.
     * 
     * Path : `POST /emotions`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async createHandler(req: Request, res: Response): Promise<Response> {
        try {
            const emotion = await this.db.emotions.create({
                name: req.body.name,
                color: req.body.color,
                owner: req.body.owner
            });
            return res.status(201).send({
                id: emotion.id,
                links: [{
                    rel: 'get_emotion',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${emotion.id}`
                }] as Link[]
            });
        } catch (err) {
            if (err.name === 'ValidationError') {
                return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
            }
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Modifies an emotion
     * Path : `PUT /emotions/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async modifyHandler(req: Request, res: Response): Promise<Response> {
        try {
            const emotion = await this.db.emotions.findById(req.params.id);
            if (emotion == null) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Emotion not found'
                }));
            }
            emotion.name = req.body.name;
            emotion.color = req.body.color;
            await emotion.save();
            return res.status(200).send({
                id: emotion.id,
                links: [{
                    rel: 'get_emotion',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${emotion.id}`
                }] as Link[]
            });
        } catch (err) {
            if (err.name === 'ValidationError') {
                return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
            }
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Updates an emotion
     * Path : `PUT /emotions/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async updateHandler(req: Request, res: Response): Promise<Response> {
        try {
            const emotion = await this.db.emotions.findById(req.params.id);
            if (emotion == null) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Emotion not found'
                }));
            }
            if (req.body.name != null) {
                emotion.name = req.body.name;
            }
            if (req.body.color != null) {
                emotion.color = req.body.color;
            }
            await emotion.save();
            return res.status(200).send({
                id: emotion.id,
                links: [{
                    rel: 'get_emotion',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${emotion.id}`
                }] as Link[]
            });
        } catch (err) {
            if (err.name === 'ValidationError') {
                return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
            }
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Deletes an emotion.
     * 
     * Path : `DELETE /emotions/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async deleteHandler(req: Request, res: Response): Promise<Response> {
        try {
            const emotion = await this.db.emotions.findByIdAndDelete(req.params.id);
            if (emotion == null) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Emotion not found'
                }));
            }
            return res.status(204).json();
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }
}
