import { fetchHttpStream } from "./client";

export const connection = fetchHttpStream("http://localhost:8000/agent");
