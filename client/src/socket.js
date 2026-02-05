import {io} from "socket.io-client";

export const initSocket = async ()=>{
    const option = {
        forceNew: true,
        reconnectionAttempts: Infinity,
        timeout: 10000,
        transports: ["websocket"],
    };
    return io(import.meta.env.VITE_BACKEND_URL, option);
}