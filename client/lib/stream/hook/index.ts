export { useAgent } from "./use-agent";
export type {
  UseChatOptions,
  UseChatReturn,
  UIMessage,
  ChatRequestBody,
} from "./types";

// re-export from for convenience
export {
  fetchServerSentEvents,
  fetchHttpStream,
  stream,
  createChatClientOptions,
  type ConnectionAdapter,
  type FetchConnectionOptions,
  type InferChatMessages,
} from "../client";
