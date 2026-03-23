import { readFileSync, writeFileSync } from "fs";
import path from "path";
import type { Graduate, GraduateData, Message, MessageData } from "./types";

const dataDir = path.join(process.cwd(), "data");

export function getGraduateData(): GraduateData {
  const filePath = path.join(dataDir, "graduates.json");
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

export function getGraduates(): Graduate[] {
  return getGraduateData().graduates;
}

export function getGraduate(slug: string): Graduate | undefined {
  return getGraduates().find((g) => g.slug === slug);
}

export function getMessages(slug?: string): Message[] {
  const filePath = path.join(dataDir, "messages.json");
  const data: MessageData = JSON.parse(readFileSync(filePath, "utf-8"));
  if (slug) {
    return data.messages.filter((m) => m.to === slug);
  }
  return data.messages;
}

export function addMessage(
  message: Omit<Message, "id" | "createdAt">,
): Message {
  const filePath = path.join(dataDir, "messages.json");
  const data: MessageData = JSON.parse(readFileSync(filePath, "utf-8"));

  const newMessage: Message = {
    ...message,
    id: `msg-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  data.messages.push(newMessage);
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  return newMessage;
}

export function deleteMessage(id: string): boolean {
  const filePath = path.join(dataDir, "messages.json");
  const data: MessageData = JSON.parse(readFileSync(filePath, "utf-8"));
  const before = data.messages.length;
  data.messages = data.messages.filter((m) => m.id !== id);
  if (data.messages.length === before) return false;
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  return true;
}
