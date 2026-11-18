import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { z } from 'zod';
import { env } from '../../config/environment';
import type { UserAccount } from '../data/types';
import {
  BrandsListSchema,
  MessageSchema,
  ProductsListSchema,
  UserDetailSchema,
  type ApiMessage,
  type Product,
  type UserDetail,
} from './schemas';

export interface ApiResult<T> {
  httpStatus: number;
  body: T;
}

/**
 * Typed client for the public practice API. Every response is parsed from text (the server
 * sometimes labels JSON as text/html) and validated with zod, so contract drift fails loudly with
 * a precise path instead of an undefined-property error later in the test.
 */
export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  private url(path: string): string {
    return `${env.apiUrl}/${path}`;
  }

  private async parse<S extends z.ZodTypeAny>(res: APIResponse, schema: S): Promise<ApiResult<z.infer<S>>> {
    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`API ${res.url()} returned non-JSON (HTTP ${res.status()}): ${text.slice(0, 200)}`);
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      throw new Error(
        `API ${res.url()} contract violation: ${parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`,
      );
    }
    return { httpStatus: res.status(), body: parsed.data };
  }

  // ---- Products / brands -------------------------------------------------------------------
  async getProducts(): Promise<ApiResult<{ responseCode: 200; products: Product[] }>> {
    return this.parse(await this.request.get(this.url('productsList')), ProductsListSchema);
  }

  async getBrands() {
    return this.parse(await this.request.get(this.url('brandsList')), BrandsListSchema);
  }

  async searchProducts(term: string) {
    return this.parse(
      await this.request.post(this.url('searchProduct'), { form: { search_product: term } }),
      ProductsListSchema,
    );
  }

  /** Raw call for negative/method tests where the response shape is a message. */
  async raw(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    form?: Record<string, string>,
  ): Promise<ApiResult<ApiMessage>> {
    const res = await this.request.fetch(this.url(path), { method, ...(form ? { form } : {}) });
    return this.parse(res, MessageSchema);
  }

  // ---- Accounts ----------------------------------------------------------------------------
  private accountForm(user: UserAccount): Record<string, string> {
    const a = user.address;
    return {
      name: user.name,
      email: user.email,
      password: user.password,
      title: user.title,
      birth_date: user.birthDay,
      birth_month: user.birthMonth,
      birth_year: user.birthYear,
      firstname: a.firstName,
      lastname: a.lastName,
      company: a.company,
      address1: a.address1,
      address2: a.address2,
      country: a.country,
      zipcode: a.zipcode,
      state: a.state,
      city: a.city,
      mobile_number: a.mobileNumber,
    };
  }

  async createAccount(user: UserAccount): Promise<ApiResult<ApiMessage>> {
    return this.raw('POST', 'createAccount', this.accountForm(user));
  }

  async updateAccount(user: UserAccount): Promise<ApiResult<ApiMessage>> {
    return this.raw('PUT', 'updateAccount', this.accountForm(user));
  }

  async deleteAccount(email: string, password: string): Promise<ApiResult<ApiMessage>> {
    return this.raw('DELETE', 'deleteAccount', { email, password });
  }

  async verifyLogin(email?: string, password?: string): Promise<ApiResult<ApiMessage>> {
    const form: Record<string, string> = {};
    if (email !== undefined) form.email = email;
    if (password !== undefined) form.password = password;
    return this.raw('POST', 'verifyLogin', form);
  }

  async getUserByEmail(email: string): Promise<ApiResult<{ responseCode: 200; user: UserDetail }>> {
    const res = await this.request.get(this.url('getUserDetailByEmail'), { params: { email } });
    return this.parse(res, UserDetailSchema);
  }
}
