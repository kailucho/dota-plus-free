import type { Responses } from "openai/resources/responses";

// Tool schema for purchase order emission.
export const emitItemOrderTool: Responses.Tool = {
  type: "function",
  name: "emit_item_order",
  description: "Returns only the recommended item purchase order.",
  parameters: {
    type: "object",
    properties: {
      purchase_order: {
        type: "array",
        description:
          "List of recommended item purchases in order, with explanation and game phase for each.",
        items: {
          type: "object",
          properties: {
            item: {
              type: "string",
              description: "Name of the recommended item to purchase.",
            },
            why: {
              type: "string",
              description: "Reason for purchasing this item.",
            },
            phase: {
              type: "string",
              description: "Game phase for this item purchase.",
              enum: ["starting", "early", "mid", "late", "situational"],
            },
          },
          required: ["item", "why", "phase"],
          additionalProperties: false,
        },
      },
    },
    required: ["purchase_order"],
    additionalProperties: false,
  },
  strict: true,
};

// Export the tools array directly (single tool for now, easy to extend later)
export const tools: Responses.Tool[] = [emitItemOrderTool];
