import { fetchHttpStream } from "./client";

export const connection = fetchHttpStream(window?.ENV.AGENT_URL + "/agent");
