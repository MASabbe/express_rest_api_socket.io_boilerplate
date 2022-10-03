import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import compress from "compression";
import methodOverride from "method-override";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import path from "path";
import favicon from "serve-favicon";
import { logs } from "./vars";
import strategies from "./passport";
import * as error from "#api/middlewares/error";
import routes from "#api/routes/v1";
const app = express();
// request logging. dev: console | production: file
app.use(morgan(logs));
// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// gzip compression
app.use(compress());
// lets you use HTTP verbs such as PUT or DELETE
// in places where the client doesn't support it
app.use(methodOverride());
// secure apps by setting various HTTP headers
app.use(helmet());
// enable CORS - Cross Origin Resource Sharing
app.use(cors());
// enable authentication
app.use(passport.initialize());
passport.use('jwt', strategies.jwt);
// public static files
app.use('/public', express.static(path.join(__dirname, '../../public')));
// favicon apps
app.use(favicon(path.join(__dirname, '../../public','favicon.ico')));
// mount web routes
app.use('/', express.static(path.join(__dirname, '../../public/views')));
// mount api v1 routes
app.use('/v1', routes);
// if error is not an instanceOf APIError, convert it.
app.use(error.converter);
// catch 404 and forward to error handler
app.use(error.notFound);
// error handler, send stacktrace only during development
app.use(error.handler);
export default app;