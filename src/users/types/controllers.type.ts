import { Claim } from "../entities/claim.entity";
import { UserMeta } from "../entities/user-meta.entity";

// Login User Result
export interface IControllerUserLoginResult {
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
  accessToken: string;
}

// Register User Result
export interface IControllerUserRegisterResult extends IControllerUserLoginResult { }

// Refresh Tokens Result
export interface IControllerUserRefreshTokensResult extends IControllerUserLoginResult { }
