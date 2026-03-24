import { z } from "zod";

export const CreateAgentSchema = z.object({
  name: z.string().min(1),
  systemPrompt: z.string().optional().nullable(),
  voiceModel: z.string().optional().nullable(),
  type: z.enum(["WIDGET", "INBOUND_TWILIO", "OUTBOUND_TWILIO"]).optional().nullable(),
  voiceGender: z.enum(["MALE", "FEMALE"]).optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  autoStart: z.boolean().optional(),
  widgetIsVisible: z.boolean().optional(),
  widgetPosition: z.string().optional(),
  widgetPrimaryColor: z.string().optional(),
  widgetDefaultOpen: z.boolean().optional(),
  phoneNumber: z.string().optional().nullable(),
});

export const UpdateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  systemPrompt: z.string().optional().nullable(),
  voiceModel: z.string().optional().nullable(),
  type: z.enum(["WIDGET", "INBOUND_TWILIO", "OUTBOUND_TWILIO"]).optional().nullable(),
  voiceGender: z.enum(["MALE", "FEMALE"]).optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  autoStart: z.boolean().optional(),
  isActive: z.boolean().optional(),
  widgetIsVisible: z.boolean().optional(),
  widgetPosition: z.string().optional(),
  widgetPrimaryColor: z.string().optional(),
  widgetDefaultOpen: z.boolean().optional(),
  phoneNumber: z.string().optional().nullable(),
});

export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;
export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>;

/**
 * Maps incoming schema data to Prisma Agent model fields.
 * Centralizes the translation of UI fields (like voiceModel) to DB fields (voiceId).
 */
export function mapAgentData(body: CreateAgentInput | UpdateAgentInput) {
  const data: Record<string, any> = {};

  // Field-to-field translations
  const fieldMapping: Record<string, string> = {
    voiceModel: "voiceId",
  };

  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined) {
      const prismaKey = fieldMapping[key] || key;

      // Normalized defaults for common fields
      if (prismaKey === "systemPrompt" && (value === null || value === "")) {
        data[prismaKey] = "";
      } else if (prismaKey === "voiceId" && !value) {
        data[prismaKey] = "aoede";
      } else if (prismaKey === "type" && !value) {
        data[prismaKey] = "WIDGET";
      } else {
        data[prismaKey] = value;
      }
    }
  });

  return data;
}
