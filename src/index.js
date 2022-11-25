#!/user/bin/env node
import 'core-js/stable';
import 'regenerator-runtime/runtime';
// make bluebird default Promise
import P from "bluebird"; // eslint-disable-line no-global-assign
import { v4 as genuuid } from "uuid";
import rateLimit from 'express-rate-limit';
import { port,env,appName,appVersion } from "#config/vars";
import logger from "#config/logger";
import * as mysql from "#config/mysql";
import app from "#config/express";
import { createServer } from "http";
import { Server } from "socket.io";
import session from "express-session";
import MySqlSession from "express-mysql-session";
import authMiddlewareSocket from "#socket/middlewares/auth";
import eventMiddlewareSocket from "#socket/middlewares/auth";
import errorMiddlewareSocket from "#socket/middlewares/auth";
Promise = P;
const mysqlStore = MySqlSession(session);
const ioMiddleware = {
    serveClient: false,
    allowEIO3: true,
    pingInterval: 10000,
    pingTimeout: 30000,
    connectTimeout: 30000,
    cookie: {
        name: "46ab848b6ea9c975243dc563ead16f50",
        httpOnly: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 1000
    }
}
const sessionMiddleware = {
    genid: function (){
        return genuuid();
    },
    secret: "46ab848b6ea9c975243dc563ead16f50",
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: "strict",
        maxAge: 60 * 60 * 1000
    },
    ttl: 60 * 60* 1000,
    store: new mysqlStore(mysql.pool),
}
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})
// Apply the rate limiting middleware to all requests
app.use(limiter);
if (env === 'production') {
    app.set('trust proxy', 1); // trust first proxy
    sessionMiddleware.cookie.secure = true;
    ioMiddleware.cookie.secure = true;
}
app.use(session(sessionMiddleware));
const httpServer = createServer(app);
/**
 * socket io
 **/
const io = new Server(httpServer, ioMiddleware);
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
// socket io event controller
io.use(wrap(session(sessionMiddleware)));
io.use(wrap(authMiddlewareSocket));
io.on("connection", function(socket) {
    eventMiddlewareSocket(io, socket);
    errorMiddlewareSocket(io, socket);
});
// listen to requests
httpServer.listen(port, async () => {
    try{
        logger.info(`${appName.toUpperCase()} v${appVersion} socket server started on port ${port} (${env})`);
        await Promise.all([
            // open mysql connection
            mysql.connect(),
        ]);
    }catch (e) {
        logger.error(e.stack);
    }
});
/**
 * Exports express
 * @public
 */
export default httpServer;