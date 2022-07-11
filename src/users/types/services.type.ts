import { Claim } from "../entities/claim.entity";
import { UserMeta } from "../entities/user-meta.entity";

// Tokens Type
export enum Tokens {
  ACCESS_TOKEN = 'AT',
  REFRESH_TOKEN = 'RT'
};

// Login Return Type
export interface IServiceUserLoginResult {
  data: {
    email: string;
    password: string;
    phone: string;
    mobilePhone: string;
    postalCode: string;
    claims: Claim[];
    meta: UserMeta[];
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    ipAddress?: string;
    userAgent?: string;
    deletedAt?: Date;
  };
  meta: {
    accessToken: string;
    refreshToken: string;
  };
}

// Register Return Type
export interface IServiceUserRegisterResult {
  data: {
    email: string;
    password: string;
    phone: string;
    mobilePhone: string;
    postalCode: string;
    claims: Claim[];
    meta: UserMeta[];
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    ipAddress?: string;
    userAgent?: string;
    deletedAt?: Date;
  },
  meta: {
    accessToken: string;
    refreshToken: string;
  };
}

// Refresh Tokens Return Type
export interface IServiceUserRefreshTokensResult {
  data: {
    email: string;
    password: string;
    phone: string;
    mobilePhone: string;
    postalCode: string;
    claims: Claim[];
    meta: UserMeta[];
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    ipAddress?: string;
    userAgent?: string;
    deletedAt?: Date;
  },
  meta: {
    accessToken: string;
    refreshToken: string;
  };
}

// Remove User Return Type
export interface IServiceUserRemoveResult {

}