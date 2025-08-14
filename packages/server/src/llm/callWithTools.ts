import type { Responses } from "openai/resources/responses";
import openaiClient from "./openaiClient.js";
import { EMIT_ITEM_ORDER } from "./purchaseOrderHelpers.js";

export interface CallWithToolsParams {
  developer?: string; // developer role content
  user: string | Array<any>; // string or array of content parts
  tools: Responses.Tool[];
  b64Image?: string; // optional image to include as separate user message
}

export interface CallWithToolsResult {
  raw: any;
  toolCall: any | null;
}

function extractFunctionCall(out: any[], name: string) {
  return (
    out.find((it) => it?.type === "function_call" && it?.name === name) ||
    out.find((it) => it?.type === "tool_call" && it?.name === name)
  );
}

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5";

export async function callWithTools(
  params: CallWithToolsParams
): Promise<CallWithToolsResult> {
  const { developer, user, tools, b64Image } = params;

  const input: any[] = [
    { role: "developer", content: developer },
    { role: "user", content: user },
  ];

  if (b64Image) {
    input.push({
      role: "user",
      content: [
        {
          type: "input_image",
          image_url: b64Image,
        },
      ] as any,
    });
  }

  let resp: any;
  try {
    resp = await openaiClient.responses.create({
      model: OPENAI_MODEL,
      input,
      tools,
      store: true,
      reasoning: { effort: "minimal" },
      tool_choice: { type: "function", name: EMIT_ITEM_ORDER },
    });
  } catch (err: any) {
    // Normalizamos ciertos errores comunes para que el frontend pueda mostrar mensajes claros.
    const msg = String(err?.message || err || "openai failed");
    if (/socket\.setTimeout/i.test(msg)) {
      throw new Error(
        "OpenAI networking error (socket timeout unsupported en este runtime). Intenta de nuevo o revisa configuración de httpAgent/timeout. Detalle: " +
          msg
      );
    }
    throw err;
  }

  const toolCall = extractFunctionCall(
    (resp as any)?.output ?? [],
    EMIT_ITEM_ORDER
  );
  console.log({ resp, toolCall });

  return { raw: resp, toolCall };
}

export default callWithTools;
