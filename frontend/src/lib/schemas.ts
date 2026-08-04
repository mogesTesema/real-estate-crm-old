import { z } from "zod";

/** Colocated Zod schemas for Phase 1 forms (plan §13). */

export const captureLeadSchema = z
  .object({
    name: z.string().optional().default(""),
    email: z.string().email("Invalid email").or(z.literal("")).optional().default(""),
    phone: z.string().optional().default(""),
    lead_type: z.enum(["buy", "sell", "rent_out", "rent_in", "investment"]),
    source: z.string().min(1, "Source required"),
    budget_max: z.string().optional().default(""),
    preferred_location: z.string().optional().default(""),
    timeline: z.string().optional().default(""),
    notes: z.string().optional().default(""),
  })
  .refine((d) => !!(d.name?.trim() || d.email?.trim() || d.phone?.trim()), {
    message: "Provide at least a name, email, or phone",
    path: ["name"],
  });

export type CaptureLeadValues = z.infer<typeof captureLeadSchema>;

export const contactSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  company_name: z.string().optional().default(""),
  email: z.string().email("Invalid email").or(z.literal("")).optional().default(""),
  phone: z.string().optional().default(""),
  location_preference: z.string().optional().default(""),
  is_vip: z.boolean().default(false),
});

export type ContactValues = z.infer<typeof contactSchema>;

export const propertySchema = z.object({
  title: z.string().min(1, "Title is required"),
  node_type: z.enum(["property", "building", "project"]),
  parent: z.string().optional().default(""),
  category: z.string().min(1),
  city: z.string().optional().default(""),
  address_line: z.string().optional().default(""),
  bedrooms: z.string().optional().default(""),
  bathrooms: z.string().optional().default(""),
  area_built: z.string().optional().default(""),
  image_url: z.string().url("Must be a URL").or(z.literal("")).optional().default(""),
  description: z.string().optional().default(""),
  listing_type: z.enum(["sale", "rent"]).optional(),
  price: z.string().optional().default(""),
});

export type PropertyValues = z.infer<typeof propertySchema>;

export const createDealSchema = z.object({
  title: z.string().min(1, "Title is required"),
  contact: z.string().uuid("Pick a contact"),
  property: z.string().optional().default(""),
  pipeline: z.string().min(1, "Pick a pipeline"),
  stage: z.string().min(1, "Pick a stage"),
  value: z.string().optional().default(""),
  probability: z.string().optional().default("10"),
  expected_close: z.string().optional().default(""),
});

export type CreateDealValues = z.infer<typeof createDealSchema>;
