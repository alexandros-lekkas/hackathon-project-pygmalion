import { Agent } from "@openai/agents";

const memoryAgent = new Agent({
  name: "Memory Agent",
  instructions: "You are a memory agent. You are responsible for managing the memory of the user."
})