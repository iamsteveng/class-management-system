import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  purchases: defineTable({
    order_id: v.string(),
    customer_mobile: v.string(),
    purchase_datetime: v.string(),
    participant_count: v.number(),
    status: v.union(
      v.literal("pending_terms"),
      v.literal("confirmation_sent"),
      v.literal("terms_accepted"),
      v.literal("cancelled")
    ),
    token: v.string(),
    class_id: v.optional(v.string()),
    session_id: v.optional(v.string()),
    created_at: v.number(),
  })
    .index("by_order_id", ["order_id"])
    .index("by_token", ["token"]),

  participants: defineTable({
    participant_id: v.string(),
    purchase_id: v.id("purchases"),
    session_id: v.string(),
    name: v.optional(v.string()),
    mobile: v.optional(v.string()),
    qr_code_data: v.optional(v.string()),
    terms_accepted_at: v.optional(v.number()),
    terms_version_id: v.optional(v.id("terms_versions")),
    created_at: v.number(),
  })
    .index("by_participant_id", ["participant_id"])
    .index("by_session_id", ["session_id"]),

  classes: defineTable({
    class_id: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
    created_at: v.number(),
  }).index("by_class_id", ["class_id"]),

  sessions: defineTable({
    session_id: v.string(),
    class_id: v.string(),
    location: v.string(),
    date: v.string(),
    time: v.string(),
    quota_defined: v.number(),
    quota_used: v.number(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    created_at: v.number(),
  })
    .index("by_session_id", ["session_id"])
    .index("by_class_id", ["class_id"]),

  terms_versions: defineTable({
    version: v.string(),
    content: v.string(),
    is_current: v.boolean(),
    created_at: v.number(),
  }).index("by_is_current", ["is_current"]),

  admins: defineTable({
    username: v.string(),
    role: v.union(v.literal("super_admin"), v.literal("regular_admin")),
    password_hash: v.string(),
    created_at: v.number(),
  }).index("by_username", ["username"]),

  audit_logs: defineTable({
    admin_id: v.optional(v.id("admins")),
    action: v.string(),
    entity_type: v.string(),
    entity_id: v.string(),
    metadata: v.optional(v.any()),
    created_at: v.number(),
  })
    .index("by_admin_id", ["admin_id"])
    .index("by_entity", ["entity_type", "entity_id"]),

  csv_files: defineTable({
    filename: v.string(),
    file_storage_id: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processed"),
      v.literal("failed")
    ),
    processed_at: v.optional(v.number()),
    error_message: v.optional(v.string()),
    created_at: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_file_storage_id", ["file_storage_id"]),

  attendance_records: defineTable({
    attendance_id: v.string(),
    participant_id: v.string(),
    session_id: v.string(),
    marked_by_admin: v.id("admins"),
    marked_at: v.number(),
    created_at: v.number(),
  })
    .index("by_attendance_id", ["attendance_id"])
    .index("by_participant_id", ["participant_id"])
    .index("by_session_id", ["session_id"]),
});
