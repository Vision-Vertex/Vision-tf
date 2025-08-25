// API Types - Complete type definitions for frontend

// Base API Response Type
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

// Error Response Type
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  sessionToken?: string;
  user?: UserProfile;
}
// API Types - Updated to match backend structure

// 2.1 API Request Types - Updated to match backend DTOs
export interface SignupRequest {
  firstname: string;
  middlename?: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  role?: 'CLIENT' | 'DEVELOPER' | 'ADMIN';
  preferredLanguage?: string;
  timezone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface Enable2faRequest {
  code: string;
}

export interface Disable2faRequest {
  code: string;
}

export interface Verify2faRequest {
  code: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
  sessionToken: string;
}

export interface DeactivateAccountRequest {
  password: string;
}

export interface TerminateSessionRequest {
  sessionToken: string;
}

export interface ChangeUserRoleRequest {
  userId: string;
  newRole: 'CLIENT' | 'DEVELOPER' | 'ADMIN';
}

export interface DeactivateUserRequest {
  userId: string;
}

export interface AuditQueryRequest {
  eventType?: string;
  eventCategory?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  limit?: number;
  offset?: number;
}

export interface SuspiciousActivityQueryRequest {
  activityType?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'FALSE_POSITIVE';
  limit?: number;
  offset?: number;
}

export interface UpdateSuspiciousActivityRequest {
  status: 'REVIEWED' | 'RESOLVED' | 'FALSE_POSITIVE';
  reviewNotes?: string;
}

export interface SignupResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: SignupUserData;
  timestamp: string;
  path: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstname: string;
  middlename?: string;
  lastname: string;
  role: string;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface SignupUserData {
  id: string;
  email: string;
  username: string;
  isEmailVerified: boolean;
  profile: {
    displayName: string;
    role: string;
  };
}

export interface Profile {
  id: string;
  userId: string;
  displayName?: string;
  bio?: string;
  profilePictureUrl?: string;
  chatLastReadAt?: string;
  skills?: string[];
  experience?: number;
  availability?: Availability;
  companyName?: string;
  companyWebsite?: string;
  adminPreferences?: Record<string, any>;
  companyDescription?: string;
  companySize?: string;
  contactEmail?: string;
  contactPerson?: string;
  contactPhone?: string;
  createdAt: string;
  currency?: string;
  education?: Education;
  hourlyRate?: number;
  industry?: string;
  lastSystemAccess?: string;
  location?: Location;
  permissions?: string[];
  projectPreferences?: ProjectPreferences;
  socialLinks?: SocialLinks;
  systemRole?: string;
  updatedAt: string;
  workPreferences?: WorkPreferences;
  portfolioLinks?: PortfolioLinks;
  billingAddress?: BillingAddress;
  role?: 'DEVELOPER' | 'CLIENT' | 'ADMIN';
}

// Profile response from backend (includes user data)
export interface ProfileResponse {
  userId: string;
  email: string;
  role: 'DEVELOPER' | 'CLIENT' | 'ADMIN';
  profile: Profile;
}

// Developer Profile Types
export interface Availability {
  available?: boolean;
  hours?: string;
  timezone?: string;
  noticePeriod?: string;
  maxHoursPerWeek?: number;
  preferredProjectTypes?: string[];
}

export interface PortfolioLink {
  label: string;
  url: string;
  description?: string;
}

export interface PortfolioLinks {
  github?: string;
  linkedin?: string;
  website?: string;
  x?: string;
  customLinks?: PortfolioLink[];
}

export interface Certification {
  name: string;
  issuer: string;
  dateObtained: string;
  expiryDate?: string;
  credentialId?: string;
}

export interface Education {
  degree?: string;
  institution?: string;
  graduationYear?: number;
  certifications?: Certification[];
}

export interface WorkPreferences {
  remoteWork?: boolean;
  onSiteWork?: boolean;
  hybridWork?: boolean;
  travelWillingness?: string;
  contractTypes?: string[];
  minProjectDuration?: string;
  maxProjectDuration?: string;
}

// Client Profile Types
export interface Location {
  country?: string;
  city?: string;
  state?: string;
  timezone?: string;
}

export interface BillingAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface CustomLink {
  label: string;
  url: string;
  description?: string;
}

export interface SocialLinks {
  linkedin?: string;
  website?: string;
  x?: string;
  customLinks?: CustomLink[];
}

export interface ProjectPreferences {
  typicalProjectBudget?: string;
  typicalProjectDuration?: string;
  preferredCommunication?: string[];
  timezonePreference?: string;
  projectTypes?: string[];
  budgetRange?: string;
  communicationStyle?: string;
}

// Profile Update DTOs
export interface UpdateDeveloperProfileRequest {
  bio?: string;
  skills?: string[];
  experience?: number;
  hourlyRate?: number;
  currency?: string;
  availability?: Availability;
  portfolioLinks?: PortfolioLinks;
  education?: Education;
  workPreferences?: WorkPreferences;
}

export interface UpdateClientProfileRequest {
  companyName?: string;
  companyWebsite?: string;
  companySize?: string;
  industry?: string;
  companyDescription?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: Location;
  billingAddress?: BillingAddress;
  projectPreferences?: ProjectPreferences;
  socialLinks?: SocialLinks;
  bio?: string;
}

export interface Session {
  sessionToken: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
  isCurrentSession: boolean;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  qrCode: string;
  backupCodes: string[];
  instructions: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  eventType: string;
  eventCategory: string;
  description: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  createdAt: string;
}

export interface SuspiciousActivity {
  id: string;
  userId: string;
  activityType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  location: string;
  deviceFingerprint: string;
  riskScore: number;
  confidence: number;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'FALSE_POSITIVE';
  reviewedBy?: string;
  reviewedAt?: string;
  riskFactors: string[];
  createdAt: string;
}

export interface LoginPattern {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  loginTime: string;
  success: boolean;
  failureReason?: string;
}

// Additional utility types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

// Profile Completion and Validation Types
export interface CompletionBreakdown {
  overall: number;
  breakdown: Record<string, number>;
  missingFields: string[];
  suggestions: string[];
}

export interface FieldValidation {
  field: string;
  isValid: boolean;
  errorMessage?: string;
  value: string;
  required: boolean;
}

export interface ProfileValidation {
  isValid: boolean;
  validFieldsCount: number;
  invalidFieldsCount: number;
  totalFieldsCount: number;
  validationPercentage: number;
  fieldValidations: FieldValidation[];
}

export interface RequiredField {
  field: string;
  displayName: string;
  description: string;
  category: string;
  required: boolean;
  type: string;
  validationRules?: Record<string, any>;
}

export interface ProfileCompletionResponse {
  completion: CompletionBreakdown;
  userId: string;
  lastUpdated: string;
}

export interface ProfileValidationResponse {
  isValid: boolean;
  validFieldsCount: number;
  invalidFieldsCount: number;
  totalFieldsCount: number;
  validationPercentage: number;
  fieldValidations: FieldValidation[];
  userId: string;
  validatedAt: string;
}

export interface RequiredFieldsResponse {
  requiredFields: RequiredField[];
  completionStatus: Record<string, boolean>;
  userId: string;
}

// Search Types - Complete search functionality types
export interface SearchQuery {
  query: string;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'experience' | 'hourlyRate' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchFilters {
  role?: 'CLIENT' | 'DEVELOPER' | 'ADMIN';
  skills?: string[];
  minExperience?: number;
  maxExperience?: number;
  minHourlyRate?: number;
  maxHourlyRate?: number;
  isAvailable?: boolean;
  timezone?: string;
  location?: string;
  workPreference?: 'remote' | 'onsite' | 'hybrid';
  isEmailVerified?: boolean;
  minProfileCompletion?: number;
  createdAtFrom?: string;
  createdAtTo?: string;
}

export interface SearchResultItem {
  userId: string;
  displayName: string;
  role: 'CLIENT' | 'DEVELOPER' | 'ADMIN';
  bio: string;
  profilePictureUrl: string;
  skills: string[];
  experience: number;
  hourlyRate: number;
  isAvailable: boolean;
  location: any;
  profileCompletion: number;
  relevanceScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResponse {
  results: SearchResultItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
  filters: SearchFilters;
  executionTime: number;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  filters: SearchFilters;
  resultsCount: number;
  timestamp: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SearchPreferences {
  defaultSortBy: 'relevance' | 'experience' | 'hourlyRate' | 'createdAt' | 'updatedAt';
  defaultSortOrder: 'asc' | 'desc';
  defaultLimit: number;
  enableNotifications: boolean;
  autoSaveHistory: boolean;
  maxHistoryItems: number;
}

export interface SearchSuggestion {
  type: 'skill' | 'location' | 'role' | 'query';
  value: string;
  count: number;
  relevance: number;
}

export interface SearchStats {
  totalSearches: number;
  averageResultsPerSearch: number;
  mostUsedFilters: Record<string, number>;
  popularQueries: string[];
  searchSuccessRate: number;
}

export interface SearchError {
  type: 'validation' | 'network' | 'server' | 'rate_limit' | 'unauthorized';
  message: string;
  code?: string;
  retryAfter?: number;
  suggestions?: string[];
}

