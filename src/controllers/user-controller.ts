import { Request, Response } from 'express';
import _ from 'lodash';
import { Day, UserInstance } from '../models/user-model';
import ServiceContainer from '../services/service-container';
import Controller, { Link } from './controller';

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
        this.registerEndpoint({ method: 'POST', uri: '/', handlers: this.createHandler });
        this.registerEndpoint({ method: 'PATCH', uri: '/:id', handlers: this.updateHandler });
        this.registerEndpoint({ method: 'DELETE', uri: '/:id', handlers: this.deleteHandler });
        this.registerEndpoint({ method: 'GET', uri: '/:id/emotions', handlers: this.listEmotionsHandler });
        this.registerEndpoint({ method: 'GET', uri: '/:id/emotions/:emotionId', handlers: this.getEmotionHandler });
        this.registerEndpoint({ method: 'GET', uri: '/:id/days', handlers: this.listDaysHandler });
        this.registerEndpoint({ method: 'GET', uri: '/:id/days/:date', handlers: this.getDayHandler });
        this.registerEndpoint({ method: 'POST', uri: '/:id/days', handlers: this.createDayHandler });
        this.registerEndpoint({ method: 'PUT', uri: '/:id/days/:date', handlers: this.modifyDayHandler });
        this.registerEndpoint({ method: 'PATCH', uri: '/:id/days/:date', handlers: this.updateDayHandler });
        this.registerEndpoint({ method: 'DELETE', uri: '/:id/days/:date', handlers: this.deleteDayHandler });
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
            const authUser: UserInstance = res.locals.authUser;
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
            return res.status(200).send({ users: await this.db.users.find().populate('emotions') });
        } catch (err) {
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
            const user = await this.db.users.findById(req.params.id).populate('emotions');
            if (user == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'User not found'
                }));
            }
            return res.status(200).send({ user });
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Creates a new user.
     * 
     * Path : `POST /users`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async createHandler(req: Request, res: Response): Promise<Response> {
        try {
            const user = await this.db.users.create({
                email: req.body.email,
                name: req.body.name,
                password: req.body.password
            });
            return res.status(201).send({
                id: user.id,
                links: [{
                    rel: 'get_user',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${user.id}`
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
     * Updates an user.
     * 
     * Path : `PATCH /users/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async updateHandler(req: Request, res: Response): Promise<Response> {
        try {
            const user = await this.db.users.findById(req.params.id);
            if (user == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'User not found'
                }));
            }
            if (req.body.email != null) {
                user.email = req.body.email;
            }
            if (req.body.name != null) {
                user.name = req.body.name;
            }
            if (req.body.password != null) {
                user.password = req.body.password;
            }
            await user.save();
            return res.status(200).send({
                id: user.id,
                links: [{
                    rel: 'get_user',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${user.id}`
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
            const user = await this.db.users.findByIdAndDelete(req.params.id);
            if (user == null) {
                return res.status(404).send(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'User not found'
                }));
            }
            return res.status(204).send();
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Lists all emotions of an user.
     * 
     * Path : `GET /users/:id/emotions`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async listEmotionsHandler(req: Request, res: Response): Promise<Response> {
        try {
            const user = await this.db.users.findById(req.params.id);
            if (user == null) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'User not found'
                }));
            }
            return res.status(200).json({ emotions: user.emotions });
        } catch (err) {
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }

    /**
     * Gets a specific emotion of an user.
     * 
     * Path : `GET /users/:id/emotions/:emotionId`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async getEmotionHandler(req: Request, res: Response): Promise<Response> {
        try {
            const user = await this.db.users.findById(req.params.id);
            if (user == null) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'User not found'
                }));
            }
            const emotion = user.emotions.find(currentEmotion => currentEmotion.id === req.params.emotionId);
            if (emotion == null) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Emotion not found'
                }));
            }
            return res.status(200).json(emotion);
        } catch (err) {
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }

    /**
     * Lists all days of an user.
     * 
     * Path : `GET /users/:id/days`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async listDaysHandler(req: Request, res: Response): Promise<Response> {
        try {
            const user = await this.db.users.findById(req.params.id);
            if (user == null) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'User not found'
                }));
            }
            return res.status(200).json({ days: user.days });
        } catch (err) {
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }

    /**
     * Gets a specific day of an user.
     * 
     * Path : `GET /users/:id/days/:date`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async getDayHandler(req: Request, res: Response): Promise<Response> {
        try {
            const user = await this.db.users.findById(req.params.id);
            if (user == null) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'User not found'
                }));
            }
            const day = user.days.find(currentDay => currentDay.date === req.params.date);
            if (day == null) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Day not found'
                }));
            }
            return res.status(200).json(day);
        } catch (err) {
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }

    /**
     * Creates a new day for an user.
     * 
     * Path : `POST /users/:id/days`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async createDayHandler(req: Request, res: Response): Promise<Response> {
        try {
            const user = await this.db.users.findById(req.params.id);
            if (user == null) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'User not found'
                }));
            }
            const day: Day = {
                date: req.body.date,
                description: req.body.description,
                emotions: req.body.emotions
            };
            user.days.push(day);
            await user.save();
            return res.status(201).send({
                id: day.date,
                links: [{
                    rel: 'get_day',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${user.id}/days/${day.date}`
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
     * Modifies a day of an user.
     * 
     * Path : `PUT /users/:id/days/:date`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async modifyDayHandler(req: Request, res: Response): Promise<Response> {
        try {
            const user = await this.db.users.findById(req.params.id);
            if (user == null) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'User not found'
                }));
            }
            const day = user.days.find(currentDay => currentDay.date === req.params.date);
            if (day == null) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Day not found'
                }));
            }
            day.description = req.body.description;
            day.emotions = req.body.emotions;
            await user.save();
            return res.status(200).send({
                id: day.date,
                links: [{
                    rel: 'get_day',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${user.id}/days/${day.date}`
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
     * Updates a day of an user.
     * 
     * Path : `PATCH /users/:id/days/:date`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async updateDayHandler(req: Request, res: Response): Promise<Response> {
        try {
            const user = await this.db.users.findById(req.params.id);
            if (user == null) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'User not found'
                }));
            }
            const day = user.days.find(currentDay => currentDay.date === req.params.date);
            if (day == null) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Day not found'
                }));
            }
            if (req.body.description) {
                day.description = req.body.description;
            }
            if (req.body.emotions) {
                day.emotions = req.body.emotions;
            }
            await user.save();
            return res.status(200).send({
                id: day.date,
                links: [{
                    rel: 'get_day',
                    action: 'GET',
                    href: `${req.protocol}://${req.get('host')}${this.rootUri}/${user.id}/days/${day.date}`
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
     * Deletes a day of an user.
     * 
     * Path : `DELETE /users/:id/days/:date`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async deleteDayHandler(req: Request, res: Response): Promise<Response> {
        try {
            const user = await this.db.users.findById(req.params.id);
            if (user == null) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'User not found'
                }));
            }
            const removed = _.remove(user.days, currentDay => currentDay.date === req.params.date);
            if (removed.length === 0) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Day not found'
                }));
            }
            user.markModified('days');
            await user.save();
            return res.status(204).send();
        } catch (err) {
            if (err.name === 'ValidationError') {
                return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
            }
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }
}
