import { z } from 'zod';

/**
 * Example service showing how to integrate Zod schemas
 * This demonstrates best practices for validation and type safety
 */

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string, public details: Record<string, string[]>) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

// Example schemas (simplified for demonstration)
const UserSchema = z.object({
  id: z.string(),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
});

const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

const UpdateUserSchema = UserSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

const UserFilterSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['username', 'email', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
});

// Type definitions
type User = z.infer<typeof UserSchema>;
type CreateUser = z.infer<typeof CreateUserSchema>;
type UpdateUser = z.infer<typeof UpdateUserSchema>;
type UserFilter = z.infer<typeof UserFilterSchema>;

// Utility functions
function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): 
  { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(err.message);
  });
  
  return errors;
}

/**
 * Example service using Zod validation
 */
export class UserServiceWithZod {
  
  /**
   * Create a new user with full validation
   */
  async createUser(userData: unknown): Promise<Omit<User, 'password'>> {
    // Validate input data against schema
    const validationResult = validateSchema(CreateUserSchema, userData);
    
    if (!validationResult.success) {
      const errorResult = validationResult as { success: false; errors: z.ZodError };
      const formattedErrors = formatValidationErrors(errorResult.errors);
      throw new ValidationError('Invalid user data provided', formattedErrors);
    }
    
    const validatedData = validationResult.data;
    
    // Additional business logic validation
    await this.checkUsernameAvailability(validatedData.username);
    await this.checkEmailAvailability(validatedData.email);
    
    // Hash password before storing
    const hashedPassword = await this.hashPassword(validatedData.password);
    
    // Create user with validated data
    const newUser: User = {
      ...validatedData,
      id: this.generateId(),
      password: hashedPassword,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Validate the complete user object
    const completeUser = UserSchema.parse(newUser);
    
    // Store in database
    await this.repository.create(completeUser);
    
    // Return user without password
    const { password, ...safeUser } = completeUser;
    return safeUser;
  }

  /**
   * Update user with partial data validation
   */
  async updateUser(userId: string, updateData: unknown): Promise<Omit<User, 'password'>> {
    // Validate update data
    const validationResult = validateSchema(UpdateUserSchema, updateData);
    
    if (!validationResult.success) {
      const errorResult = validationResult as { success: false; errors: z.ZodError };
      const formattedErrors = formatValidationErrors(errorResult.errors);
      throw new ValidationError('Invalid update data provided', formattedErrors);
    }
    
    const validatedUpdates = validationResult.data;
    
    // Get existing user
    const existingUser = await this.repository.findById(userId);
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }
    
    // Merge updates with existing data
    const updatedUser: User = {
      ...existingUser,
      ...validatedUpdates,
      updatedAt: new Date()
    };
    
    // Validate the complete updated user
    const validUser = UserSchema.parse(updatedUser);
    
    // Update in database
    await this.repository.update(userId, validUser);
    
    // Return safe user data
    const { password, ...safeUser } = validUser;
    return safeUser;
  }
  
  // Private helper methods
  private async checkUsernameAvailability(username: string): Promise<void> {
    const existingUser = await this.repository.findByUsername(username);
    if (existingUser) {
      throw new ConflictError('Username already exists');
    }
  }
  
  private async checkEmailAvailability(email: string): Promise<void> {
    const existingUser = await this.repository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }
  }
  
  private async hashPassword(password: string): Promise<string> {
    // Implementation for password hashing
    return 'hashed_' + password;
  }
  
  private generateId(): string {
    return 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
  
  // Mock repository for example
  private repository = {
    create: async (user: User): Promise<User> => {
      console.log('Creating user:', user.username);
      return user;
    },
    update: async (id: string, user: User): Promise<User> => {
      console.log('Updating user:', id);
      return user;
    },
    findById: async (id: string): Promise<User | null> => {
      console.log('Finding user by id:', id);
      return null;
    },
    findByUsername: async (username: string): Promise<User | null> => {
      console.log('Finding user by username:', username);
      return null;
    },
    findByEmail: async (email: string): Promise<User | null> => {
      console.log('Finding user by email:', email);
      return null;
    }
  };
}

// Example usage and demonstration
export function demonstrateZodUsage(): void {
  console.log('=== Zod Schema Usage Examples ===\n');
  
  // Example 1: Valid user creation
  console.log('1. Creating a valid user:');
  const validUserData = {
    username: 'john_doe',
    email: 'john@example.com',
    password: 'securePassword123'
  };
  
  const createResult = validateSchema(CreateUserSchema, validUserData);
  if (createResult.success) {
    console.log('✅ Valid user data:', createResult.data);
  } else {
    const errorResult = createResult as { success: false; errors: z.ZodError };
    console.log('❌ Validation failed:', formatValidationErrors(errorResult.errors));
  }
  
  // Example 2: Invalid user creation
  console.log('\n2. Creating an invalid user:');
  const invalidUserData = {
    username: 'jo', // Too short
    email: 'invalid-email', // Invalid format
    password: '123' // Too short
  };
  
  const invalidResult = validateSchema(CreateUserSchema, invalidUserData);
  if (invalidResult.success) {
    console.log('✅ Valid user data:', invalidResult.data);
  } else {
    const errorResult = invalidResult as { success: false; errors: z.ZodError };
    console.log('❌ Validation failed:', formatValidationErrors(errorResult.errors));
  }
  
  // Example 3: User filter validation
  console.log('\n3. Validating user filters:');
  const filterData = {
    search: 'john',
    isActive: true,
    sortBy: 'username',
    page: 1,
    limit: 10
  };
  
  const filterResult = validateSchema(UserFilterSchema, filterData);
  if (filterResult.success) {
    console.log('✅ Valid filters:', filterResult.data);
  } else {
    const errorResult = filterResult as { success: false; errors: z.ZodError };
    console.log('❌ Filter validation failed:', formatValidationErrors(errorResult.errors));
  }
  
  // Example 4: Partial update validation
  console.log('\n4. Validating partial update:');
  const updateData = {
    email: 'newemail@example.com',
    isActive: false
  };
  
  const updateResult = validateSchema(UpdateUserSchema, updateData);
  if (updateResult.success) {
    console.log('✅ Valid update data:', updateResult.data);
  } else {
    const errorResult = updateResult as { success: false; errors: z.ZodError };
    console.log('❌ Update validation failed:', formatValidationErrors(errorResult.errors));
  }
  
  console.log('\n=== End of Examples ===');
}

// Express.js integration example
interface Request {
  body: unknown;
  params: Record<string, string>;
  query: Record<string, unknown>;
}

interface Response {
  status(code: number): Response;
  json(data: unknown): void;
}

interface NextFunction {
  (error?: unknown): void;
}

export class UserController {
  constructor(private userService: UserServiceWithZod) {}
  
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
          details: error.details
        });
      } else {
        next(error);
      }
    }
  }
}

// Run examples if this file is executed directly
if (typeof module !== 'undefined' && require.main === module) {
  demonstrateZodUsage();
}