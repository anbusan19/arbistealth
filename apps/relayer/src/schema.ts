import { z } from "zod";

const addressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, "expected a 20-byte hex address");

const hexSchema = z.string().regex(/^0x[0-9a-fA-F]+$/, "expected hex data");

const uint256Schema = z
  .union([z.string(), z.number()])
  .transform((value, ctx) => {
    try {
      return BigInt(value);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "expected an integer" });
      return z.NEVER;
    }
  })
  .refine((value) => value >= 0n, "expected a non-negative integer");

export const intentSchema = z.object({
  user: addressSchema,
  tokenIn: addressSchema,
  tokenOut: addressSchema,
  amountIn: uint256Schema,
  minAmountOut: uint256Schema,
  nonce: uint256Schema,
  expiry: uint256Schema,
});

export const submitIntentSchema = z.object({
  intent: intentSchema,
  signature: hexSchema,
});

export const claimSchema = z.object({
  agent: addressSchema,
});
