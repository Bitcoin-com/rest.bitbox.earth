

import axios from "axios";

const BitboxHTTP = axios.create({
    baseURL: process.env.RPC_BASEURL
});

export const getInstance = () => BitboxHTTP;
