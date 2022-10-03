import logger from "../../config/logger";
import SocketError from "../errors/socket-error";
export default function (io,socket) {
    socket.on("disconnect", async (reason) => {
        if (reason)
            logger.info(reason);
    });
    socket.on("error", (err) => {
        let socketError = new SocketError({
            message: err.message,
        });
        socket.emit('event_errors', socketError);
        socket.disconnect(err.message);
    });
}