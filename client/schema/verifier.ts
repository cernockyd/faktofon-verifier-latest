import * as z from "zod";

export const DurationSchema = z.object({
  years: z.number().int().min(0).optional().default(0),
  months: z.number().int().min(0).optional().default(0),
  days: z.number().int().min(0).optional().default(0),
  hours: z.number().int().min(0).optional().default(0),
});

export type Duration = z.infer<typeof DurationSchema>;

export const InteractionSchema = z.object({
  approved: z.boolean(),
  rejected: z.boolean(),
});

export type Interaction = z.infer<typeof InteractionSchema>;

export const StatementVerifiabilityStatus = z.object({
  status_code: z.string(),
  messages: z.string().array(),
  errors: z.string().array(),
});

export const StatementVerifiabilityAnalysisResultSchema = z.object({
  status: StatementVerifiabilityStatus,
  proposition_timeframe: DurationSchema.nullable().optional(),
  proposition_factual: z.boolean().nullable().optional(),
});

export type StatementVerifiabilityAnalysisResult = z.infer<
  typeof StatementVerifiabilityAnalysisResultSchema
>;

export const StatementVerificationStatus = z.object({
  status_code: z.string(),
  messages: z.string().array(),
  errors: z.string().array(),
});

export const StatementVerificationAnalysisSchema = z.object({
  status: StatementVerificationStatus,
  sources_statistics: z
    .object({
      primary: z.number().int().default(0),
      secondary: z.number().int().default(0),
      terciary: z.number().int().default(0),
    })
    .nullable(),
});

export type StatementVerificationAnalysis = z.infer<
  typeof StatementVerificationAnalysisSchema
>;

export const SourceVerificationAnalysisStatus = z.object({
  status_code: z.string(),
  messages: z.string().array(),
  errors: z.string().array(),
});

export const SourceVerificationAnalysisResultSchema = z.object({
  status: SourceVerificationAnalysisStatus,
  source_title: z.string(),
  source_origin: z.enum([
    "academic",
    "professional",
    "general",
    "governmental",
    "popular",
    "other",
  ]),
  source_function: z.enum([
    "reference",
    "research",
    "instructional",
    "news",
    "opinion",
    "promotion",
    "entertainment",
  ]),
  source_level: z.enum(["primary", "secondary", "terciary"]),
  source_published_at: z.iso.datetime().nullable(),
  source_currency: z.number().min(0).max(1).nullable(),
  source_reliability: z.number().min(0).max(1),
  source_point_of_view: z.number().min(0).max(1),
  source_implies_proposition_truthful: z.number().min(0).max(1),
  source_proof_near_exact_substrings: z
    .array(z.string())
    .min(1)
    .max(5)
    .nullable(),
  source_proof_paraphrase: z.string().min(40).nullable(),
});

export type SourceVerificationAnalysisResult = z.infer<
  typeof SourceVerificationAnalysisResultSchema
>;

export const CardSourceSchema = z.object({
  type: z.string().nullable(),
  name: z.string().nullable(),
  url: z.string().nullable(),
  archive_url: z.string().nullable(),
  date: z.string().nullable(),
  //expected: z.object(z.unknown()).nullable().optional(),
  verification: SourceVerificationAnalysisResultSchema.nullable().optional(),
  verification_user_interaction: InteractionSchema.nullable().optional(),
  author_type: z.enum(["user", "agent"]).optional(),
});

export type CardSource = z.infer<typeof CardSourceSchema>;

export const NaiveCardSourceSchema = z.object({
  ...CardSourceSchema.shape,
  id: z.string().optional(),
});

export type ReorderableArray<T extends z.ZodTypeAny> = {
  order: string[];
  record: Record<string, z.infer<T>>;
};

export const CardStatementSchema = z.object({
  text: z.string().optional(),
  sources: z.object({
    order: z.array(z.string()),
    record: z.record(z.string(), CardSourceSchema),
  }),
  emoji: z.string().optional(),
  verifiability_analysis:
    StatementVerifiabilityAnalysisResultSchema.nullable().optional(),
  // verifiability_analysis_user_interaction:
  //   InteractionSchema.nullable().optional(),
  // expected: z.object(z.unknown()).optional(),
  //
  verification_analysis:
    StatementVerificationAnalysisSchema.nullable().optional(),
});

export type CardStatement = z.infer<typeof CardStatementSchema>;

export const NaiveStatementSchema = z.object({
  ...CardStatementSchema.shape,
  id: z.string().optional(),
  sources: z.array(NaiveCardSourceSchema).optional(),
});

export const CardBlockSchema = z.object({
  statements: z.object({
    order: z.array(z.string()),
    record: z.record(z.string(), CardStatementSchema),
  }),
});

export type CardBlock = z.infer<typeof CardBlockSchema>;

export const NaiveCardBlockSchema = z.object({
  id: z.string().optional(),
  statements: z.array(NaiveStatementSchema),
});

export const CardSchema = z.object({
  title: z.string(),
  dateCreated: z.date().optional(),
  dateUpdated: z.date().optional(),
  topics: z.array(
    z.object({
      id: z.string(),
      value: z.string(),
    }),
  ),
  blocks: z.object({
    order: z.array(z.string()),
    record: z.record(z.string(), CardBlockSchema),
  }),
});

export type Card = z.infer<typeof CardSchema>;

export const NaiveCardSchema = z.object({
  ...CardSchema.shape,
  topics: z.array(z.string()),
  blocks: z.array(NaiveCardBlockSchema),
});

export type NaiveCard = z.infer<typeof NaiveCardSchema>;

export type PatchPath = (string | number)[];

export type Patch = {
  op: string;
  path: PatchPath;
  value: any;
};
