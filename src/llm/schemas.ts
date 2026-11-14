import { z } from "zod";
import { TAGS } from "../engine/tags";

const semanticTags = TAGS.filter(
  (tag) => tag !== "YELL" && tag !== "NO_RESPONSE",
);
export const SemanticHitSchema = z
  .object({ tag: z.enum(semanticTags), quote: z.string().min(1).max(300) })
  .strict();
export const ChildLineSchema = z
  .object({ line: z.string().min(1).max(120), action: z.string().max(80) })
  .strict();
export const ChildLinesSchema = z
  .object({
    calmer: ChildLineSchema,
    same: ChildLineSchema,
    angrier: ChildLineSchema,
    resolved: ChildLineSchema,
    gotIt: ChildLineSchema,
  })
  .strict();
export const TurnModelSchema = z
  .object({ tags: z.array(SemanticHitSchema).max(6), lines: ChildLinesSchema })
  .strict();
export type TurnModelOutput = z.infer<typeof TurnModelSchema>;
export const CustomSceneModelSchema = z
  .object({
    ok: z.boolean(),
    refusal: z.enum(["unsafe", "not_a_meltdown"]).nullable(),
    scene: z
      .object({
        title: z.string().min(1).max(80),
        place: z.string().min(1).max(80),
        setup: z.string().min(1).max(500),
        openingLine: z.string().min(1).max(120),
        openingAction: z.string().max(80),
        limit: z.string().min(4).max(160),
        wants: z.string().min(1).max(80),
        startArousal: z.number(),
        temperament: z.enum(["easygoing", "sensitive", "spirited"]),
        limitHints: z.array(z.string().max(160)).max(30),
        giveInHints: z.array(z.string().max(160)).max(30),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type CustomSceneModelOutput = z.infer<typeof CustomSceneModelSchema>;
export const CoachModelSchema = z
  .object({
    suggestions: z
      .array(
        z
          .object({
            text: z.string().min(1).max(300),
            tags: z.array(SemanticHitSchema).max(6),
          })
          .strict(),
      )
      .max(3),
  })
  .strict();
export type CoachModelOutput = z.infer<typeof CoachModelSchema>;
