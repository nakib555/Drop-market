export class ApiError extends Error {
  status: number;
  isStaticFallbackEligible: boolean;

  constructor(message: string, status = 0, isStaticFallbackEligible = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isStaticFallbackEligible = isStaticFallbackEligible;
  }
}
