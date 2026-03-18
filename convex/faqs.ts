import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

export const listFaqs = queryGeneric({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("faqs"),
      question: v.string(),
      answer: v.string(),
      order: v.number(),
      created_at: v.number(),
      updated_at: v.number(),
    })
  ),
  handler: async (ctx) => {
    const faqs = await ctx.db.query("faqs").withIndex("by_order").collect();
    return faqs.map((faq) => ({
      _id: faq._id,
      question: faq.question,
      answer: faq.answer,
      order: faq.order,
      created_at: faq.created_at,
      updated_at: faq.updated_at,
    }));
  },
});

export const createFaq = mutationGeneric({
  args: {
    question: v.string(),
    answer: v.string(),
    order: v.number(),
  },
  returns: v.id("faqs"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("faqs", {
      question: args.question.trim(),
      answer: args.answer.trim(),
      order: args.order,
      created_at: now,
      updated_at: now,
    });
    return id;
  },
});

export const updateFaq = mutationGeneric({
  args: {
    id: v.id("faqs"),
    question: v.string(),
    answer: v.string(),
    order: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const faq = await ctx.db.get(args.id);
    if (!faq) {
      throw new Error("FAQ not found.");
    }
    await ctx.db.patch(args.id, {
      question: args.question.trim(),
      answer: args.answer.trim(),
      order: args.order,
      updated_at: Date.now(),
    });
    return null;
  },
});
