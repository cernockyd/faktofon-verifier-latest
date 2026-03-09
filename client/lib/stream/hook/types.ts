import type { AnyClientTool, ModelMessage } from "@tanstack/ai";
import type {
  ChatClientOptions,
  ChatClientState,
  ChatRequestBody,
  MultimodalContent,
  UIMessage,
} from "../client";
import type { ActionPart } from "../client/types";

// Re-export types from ai-client
export type { ChatRequestBody, MultimodalContent, UIMessage };

/**
 * Options for the useChat hook.
 *
 * This extends ChatClientOptions but omits the state change callbacks that are
 * managed internally by React state:
 * - `onMessagesChange` - Managed by React state (exposed as `messages`)
 * - `onLoadingChange` - Managed by React state (exposed as `isLoading`)
 * - `onErrorChange` - Managed by React state (exposed as `error`)
 * - `onStatusChange` - Managed by React state (exposed as `status`)
 *
 * All other callbacks (onResponse, onChunk, onFinish, onError) are
 * passed through to the underlying ChatClient and can be used for side effects.
 *
 * Note: Connection and body changes will recreate the ChatClient instance.
 * To update these options, remount the component or use a key prop.
 */
export type UseChatOptions<TTools extends ReadonlyArray<AnyClientTool> = any> =
  Omit<
    ChatClientOptions<TTools>,
    "onMessagesChange" | "onLoadingChange" | "onErrorChange" | "onStatusChange"
  >;

export type Action = {
  type: "action";
  action: string;
  payload: unknown;
};

export interface UseChatReturn<
  TTools extends ReadonlyArray<AnyClientTool> = any,
> {
  /**
   * Current messages in the conversation
   */
  messages: Array<UIMessage<TTools>>;

  /**
   * Send a message and get a response.
   * Can be a simple string or multimodal content with images, audio, etc.
   */
  sendMessage: (content: string | MultimodalContent) => Promise<void>;

  /**
   * Send action to get a response.
   */
  sendToolAction: (
    action: { content: Array<ActionPart> },
    body?: Record<string, any>,
  ) => Promise<void>;

  /**
   * Reload the last assistant message
   */
  reload: () => Promise<void>;

  /**
   * Stop the current response generation
   */
  stop: () => void;

  /**
   * Whether a response is currently being generated
   */
  isLoading: boolean;

  /**
   * Current error, if any
   */
  error: Error | undefined;

  /**
   * Current status of the chat client
   */
  status: ChatClientState;

  // /**
  //  * Set messages manually
  //  */
  // setMessages: (messages: Array<UIMessage<TTools>>) => void;

  /**
   * Clear all messages
   */
  clear: () => void;
}

// Note: createChatClientOptions and InferChatMessages are now in @tanstack/ai-client
// and re-exported from there for convenience
