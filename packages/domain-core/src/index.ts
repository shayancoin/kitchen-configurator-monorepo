// Shared domain exports sourced from Clean Boilerplate 26
// Entities
export * from './domain/entities/ExampleResource';
export * from './domain/entities/Team';
export * from './domain/entities/UploadedFile';
export * from './domain/entities/User';
export * from './domain/entities/utils/EntityMetaProperties';

// Errors
export * from './domain/errors/AiServiceError';
export * from './domain/errors/AuthenticationError';
export * from './domain/errors/BaseError';
export * from './domain/errors/FileUploadError';
export * from './domain/errors/MissingValidationError';
export * from './domain/errors/NotFoundError';
export * from './domain/errors/TeamRequiredError';
export * from './domain/errors/UploadNotFoundError';
export * from './domain/errors/ValidationError';
export * from './domain/errors/WorkerError';

// Repository contracts
export * from './domain/repositories/ExampleResourceRepository';
export * from './domain/repositories/TeamRepository';
export * from './domain/repositories/UploadRepository';
export * from './domain/repositories/UserRepository';

// Services & tokens
export * from './domain/services/AIService';
export * from './domain/services/AuthWebService';
export * from './domain/services/IdGeneratorService';

// Types
export * from './domain/types/AuthenticatedContext';

// Use cases
export * from './use-cases/BaseUseCase';
export * from './use-cases/ai/GenerateResourceContent';
export * from './use-cases/authentication/LoadAuthenticatedContext';
export * from './use-cases/authentication/VerifyAuthToken';
export * from './use-cases/example-resources/CreateExampleResource';
export * from './use-cases/example-resources/DeleteExampleResource';
export * from './use-cases/example-resources/GetExampleResource';
export * from './use-cases/example-resources/ListTeamExampleResources';
export * from './use-cases/example-resources/UpdateExampleResource';
export * from './use-cases/images/UploadImage';
export * from './use-cases/users/GetMe';
