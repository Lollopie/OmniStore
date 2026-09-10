export interface VerificationEmailContext {
  verificationUrl: string;
  expiresInMinutes: number;
}

export interface PasswordResetContext {
  username: string;
  resetUrl: string;
}

export interface InviteContext {
  organizationName: string;
  verificationUrl: string;
  expiresInHours: number;
}
