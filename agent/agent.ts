import { type LanguageModel, wrapLanguageModel } from "ai";
import { defineAgent } from "eve";
import { openai } from "eve/models/openai";

import { catalogMiddleware } from "./lib/catalog-middleware";

function directOpenAI(modelId: string): Exclude<LanguageModel, string> {
  const model = openai(modelId);
  if (typeof model === "string") throw new Error("Expected a direct OpenAI language model.");
  return model;
}

export default defineAgent({
  defaultTools: false,
  // Anonymous sessions have the unknown audience, whose derived retention deletes run data and breaks chat restore.
  experimental: { workflow: { retention: "default" } },
  model: wrapLanguageModel({
    middleware: catalogMiddleware,
    // openai() calls OpenAI Responses with the server OPENAI_API_KEY. gpt-6-luna-fast is not a served model id.
    model: directOpenAI("gpt-6-luna"),
  }),
  // Eve passes this to the AI SDK call. The Responses builder writes it as reasoning.effort for this model id.
  reasoning: "medium",
  // The catalog middleware wrapper hides provider metadata, so Eve cannot read this model's context window.
  modelContextWindowTokens: 1_050_000,
});
