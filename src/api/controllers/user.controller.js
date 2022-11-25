import httpStatus from 'http-status';
import { omit } from 'lodash';
import * as adminModel from '../models/admin.model';
/**
 * Load user and append to req.
 * @public
 */
export async function load(req, res, next, id){
    try {
        const user = await adminModel.findById(id);
        req.locals = { user };
        return next();
    } catch (error) {
        return next(error);
    }
}
/**
 * Get user
 * @public
 */
export function get(req, res) {
    return res.json(adminModel.transform(req.locals.user));
}
/**
 * Get logged in user info
 * @public
 */
export function loggedIn(req, res) {
    return res.json(adminModel.transform(req.user));
}
/**
 * Create new user
 * @public
 */
export async function create(req, res, next) {
    try {
        const user = new User(req.body);
        const savedUser = await user.save();
        res.status(httpStatus.CREATED);
        res.json(savedUser.transform());
    } catch (error) {
        next(User.checkDuplicateEmail(error));
    }
}
/**
 * Replace existing user
 * @public
 */
export async function replace(req, res, next) {
    try {
        const { user } = req.locals;
        const newUser = new User(req.body);
        const ommitRole = user.role !== 'admin' ? 'role' : '';
        const newUserObject = omit(newUser.toObject(), '_id', ommitRole);

        await user.updateOne(newUserObject, { override: true, upsert: true });
        const savedUser = await User.findById(user._id);

        res.json(savedUser.transform());
    } catch (error) {
        next(User.checkDuplicateEmail(error));
    }
}
/**
 * Update existing user
 * @public
 */
export async function update(req, res, next) {
    const ommitRole = req.locals.user.role !== 'admin' ? 'role' : '';
    const updatedUser = omit(req.body, ommitRole);
    const user = Object.assign(req.locals.user, updatedUser);

    user.save()
        .then((savedUser) => res.json(savedUser.transform()))
        .catch((e) => next(User.checkDuplicateEmail(e)));
}
/**
 * Get user list
 * @public
 */
export async function list(req, res, next) {
    try {
        const users = await adminModel.list(req.query);
        const transformedUsers = users.map((user) => adminModel.transform(user));
        res.json(transformedUsers);
    } catch (error) {
        next(error);
    }
}
/**
 * Delete user
 * @public
 */
export async function remove(req, res, next) {
    const { user } = req.locals;

    user.remove()
        .then(() => res.status(httpStatus.NO_CONTENT).end())
        .catch((e) => next(e));
}