"use client";

"use client";

import axios from "axios";
import { useEffect, useRef, useState } from "react";

import useConversation from "@/app/hook/useConversation";
import { FullMessageType } from "@/app/types";
import MessageBox from "./MessageBox";
import { pusherClient } from "@/app/libs/pusher";
import { find } from "lodash";

interface BodyProps {
  initialMessages: FullMessageType[];
}
const Body: React.FC<BodyProps> = ({ initialMessages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState(initialMessages);

  const { conversationId } = useConversation();

  useEffect(() => {
    axios.post(`/api/conversations/${conversationId}/seen`);
  }, [conversationId]);

  useEffect(() => {
    pusherClient.subscribe(conversationId);
    bottomRef?.current?.scrollIntoView();

    const MessageHandler = (messages: FullMessageType) => {
      setMessages((current) => {
        if (find(current, { id: messages.id })) {
          return current;
        }
        return [...current, messages];
      });
      bottomRef?.current?.scrollIntoView();
    };

    const UpdateMessageHandler = (newMessage: FullMessageType) => {
      setMessages((current) =>
        current.map((currentMessage) => {
          if (currentMessage.id === newMessage.id) {
            return newMessage;
          }
          return currentMessage;
        })
      );
    };

    pusherClient.bind("message:new", MessageHandler);
    pusherClient.bind("message:update", UpdateMessageHandler);

    return () => {
      pusherClient.unsubscribe(conversationId);
      pusherClient.unbind("message:new", MessageHandler);
      pusherClient.unbind("message:update", UpdateMessageHandler);
    };
  }, [conversationId]);

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.map((message, i) => (
        <MessageBox
          isLast={i === messages.length - 1}
          key={message.id}
          data={message}
        />
      ))}
      <div className="pt-24" ref={bottomRef} />
    </div>
  );
};

export default Body;
