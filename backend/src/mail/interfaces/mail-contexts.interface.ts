export interface VerificationEmailContext {
  userName: string;
  verificationUrl: string;
  expiresInHours: number;
}

export interface PasswordResetContext {
  userName: string;
  resetUrl: string;
}

export interface InviteContext {
  organizationName: string;
  verificationUrl: string;
  expiresInHours: number;
}
