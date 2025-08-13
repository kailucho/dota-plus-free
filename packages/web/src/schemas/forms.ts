import { z } from "zod";
import { RoleEnum } from "@dba/shared";

export const InitFormSchema = z.object({
  rank: z.string().min(1, "Requerido"),
  hero: z.string().min(1, "Requerido"),
  role: RoleEnum,
  enemies: z.array(z.string()).length(5, "Debes elegir 5 enemigos"),
  patch: z.string().optional(),
  constraints: z.string().max(280).optional(),
});
export type InitFormValues = z.infer<typeof InitFormSchema>;

export const EnemyRowSchema = z.object({
  hero: z.string(),
  level: z.string().regex(/^\d{1,2}$/, { message: "1-2 dígitos" }),
  k: z.string().optional(),
  d: z.string().optional(),
  a: z.string().optional(),
});

export const TickFormSchema = z.object({
  minute: z.string().regex(/^\d{1,2}$/, { message: "1-2 dígitos" }),
  myLevel: z.string().regex(/^\d{1,2}$/).optional().or(z.literal("")),
  myK: z.string().regex(/^\d{1,2}$/).optional().or(z.literal("")),
  myD: z.string().regex(/^\d{1,2}$/).optional().or(z.literal("")),
  myA: z.string().regex(/^\d{1,2}$/).optional().or(z.literal("")),
  enemies: z.array(EnemyRowSchema),
});
export type TickFormValues = z.infer<typeof TickFormSchema>;
