import { Request, Response } from 'express';
import { Day } from '../models/user-model';
import ServiceContainer from '../services/service-container';
import Controller from './controller';

/**
 * Days controller class.
 * 
 * Root path : `/days`
 */
export default class DayController extends Controller {

    /**
     * Creates a new days controller.
     * 
     * @param container Services container
     */
    public constructor(container: ServiceContainer) {
        super(container, '/days');
        this.registerEndpoint({ method: 'GET', uri: '/', handlers: this.listHandler });
        this.registerEndpoint({ method: 'GET', uri: '/:date', handlers: this.dateHandler });
    }

    /**
     * Lists all days.
     * 
     * Path : `GET /days`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async listHandler(req: Request, res: Response): Promise<Response> {
        try {
            const users = await this.db.users.find().populate('days.emotions');
            const days = new Map<string, Day[]>();
            for (const user of users) {
                for (const day of user.days) {
                    if (!days.has(day.date)) {
                        days.set(day.date, []);
                    }
                    days.get(day.date).push(day);
                    day.date = undefined; // Remove date field because days are sorted by date
                }
            }
            return res.status(200).json({ days: this.mapToObject(days) });
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Gets all days from a specified date.
     * 
     * Path : `GET /days/:date`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async dateHandler(req: Request, res: Response): Promise<Response> {
        try {
            const users = await this.db.users.find().populate('days.emotions');
            const days = new Map<string, Day[]>();
            for (const user of users) {
                for (const day of user.days.filter(day => day.date === req.params.date)) {
                    if (!days.has(day.date)) {
                        days.set(day.date, []);
                    }
                    days.get(day.date).push(day);
                    day.date = undefined; // Remove date field because days are sorted by date
                }
            }
            return res.status(200).json({ days: this.mapToObject(days) });
        } catch (err) {
            return res.status(500).send(this.container.errors.formatServerError());
        }
    }

    /**
     * Transforms a map to object.
     * 
     * Keys of the map to transform must be typed as string.
     * 
     * @param map Map to transform
     * @returns Transformed object
     */
    private mapToObject<V>(map: Map<string, V>): { [key: string]: V } {
        const obj: { [key: string]: V } = {};
        for (const [k, v] of map) {
            obj[k] = v;
        }
        return obj;
    }
}
