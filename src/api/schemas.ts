import { z } from 'zod';

/**
 * Response contracts for automationexercise.com/api. Note the site's convention: HTTP status is
 * usually 200 and the *logical* status is in body.responseCode. Tests assert on both.
 */
export const ProductSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  price: z.string().regex(/^Rs\. ?\d+$/),
  brand: z.string().min(1),
  category: z.object({
    usertype: z.object({ usertype: z.string().min(1) }),
    category: z.string().min(1),
  }),
});
export type Product = z.infer<typeof ProductSchema>;

export const ProductsListSchema = z.object({
  responseCode: z.literal(200),
  products: z.array(ProductSchema),
});

export const BrandsListSchema = z.object({
  responseCode: z.literal(200),
  brands: z.array(z.object({ id: z.number().int().positive(), brand: z.string().min(1) })),
});

export const MessageSchema = z.object({
  responseCode: z.number().int(),
  message: z.string(),
});
export type ApiMessage = z.infer<typeof MessageSchema>;

export const UserDetailSchema = z.object({
  responseCode: z.literal(200),
  user: z.object({
    id: z.number().int(),
    name: z.string(),
    email: z.string(),
    title: z.string(),
    birth_day: z.string(),
    birth_month: z.string(),
    birth_year: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    company: z.string(),
    address1: z.string(),
    address2: z.string(),
    country: z.string(),
    state: z.string(),
    city: z.string(),
    zipcode: z.string(),
  }),
});
export type UserDetail = z.infer<typeof UserDetailSchema>['user'];
