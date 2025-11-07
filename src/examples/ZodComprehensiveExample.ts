import { z } from 'zod';

/**
 * Comprehensive Zod Schema Integration Example
 * Demonstrates best practices for validation in TypeScript applications
 */

// ===========================================
// 1. BASIC SCHEMA DEFINITIONS
// ===========================================

// Simple User Schema for demonstration
const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Derived schemas for different operations
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

// Type inference
type User = z.infer<typeof UserSchema>;
type CreateUser = z.infer<typeof CreateUserSchema>;
type UpdateUser = z.infer<typeof UpdateUserSchema>;
type UserFilter = z.infer<typeof UserFilterSchema>;

// ===========================================
// 2. ERROR HANDLING CLASSES
// ===========================================

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

// ===========================================
// 3. UTILITY FUNCTIONS
// ===========================================

/**
 * Format Zod validation errors into a readable structure
 */
function formatZodErrors(error: z.ZodError): Record<string, string[]> {
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
 * Safe validation wrapper
 */
function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', formatZodErrors(error));
    }
    throw error;
  }
}

// ===========================================
// 4. SERVICE IMPLEMENTATION
// ===========================================

export class UserService {
  
  /**
   * Create a new user with validation
   */
  async createUser(userData: unknown): Promise<Omit<User, 'password'>> {
    console.log('Creating user with data:', userData);
    
    // Validate input data
    const validatedData = validateData(CreateUserSchema, userData);
    
    // Business logic validation
    await this.validateBusinessRules(validatedData);
    
    // Create complete user object
    const newUser: User = {
      ...validatedData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Final validation
    const completeUser = validateData(UserSchema, newUser);
    
    // Simulate database save
    await this.saveToDatabase(completeUser);
    
    // Return without sensitive data
    const { password, ...safeUser } = completeUser;
    return safeUser;
  }
  
  /**
   * Update user with partial data
   */
  async updateUser(userId: string, updateData: unknown): Promise<Omit<User, 'password'>> {
    console.log('Updating user:', userId, 'with data:', updateData);
    
    // Validate update data
    const validatedUpdates = validateData(UpdateUserSchema, updateData);
    
    // Get existing user (simulated)
    const existingUser = await this.findById(userId);
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }
    
    // Merge and validate complete user
    const updatedUser: User = {
      ...existingUser,
      ...validatedUpdates,
      updatedAt: new Date()
    };
    
    const validUser = validateData(UserSchema, updatedUser);
    
    // Save to database
    await this.saveToDatabase(validUser);
    
    const { password, ...safeUser } = validUser;
    return safeUser;
  }
  
  /**
   * Get users with filters
   */
  async getUsers(filterData: unknown = {}): Promise<{ users: Omit<User, 'password'>[]; total: number }> {
    console.log('Getting users with filters:', filterData);
    
    // Validate filters
    const validatedFilters = validateData(UserFilterSchema, filterData);
    
    // Simulate database query
    const users = await this.queryDatabase(validatedFilters);
    
    // Remove sensitive data
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    
    return { users: safeUsers, total: safeUsers.length };
  }
  
  // ===========================================
  // PRIVATE HELPER METHODS
  // ===========================================
  
  private async validateBusinessRules(userData: CreateUser): Promise<void> {
    // Check username availability
    if (await this.isUsernameTaken(userData.username)) {
      throw new ValidationError('Business rule violation', {
        username: ['Username is already taken']
      });
    }
    
    // Check email availability
    if (await this.isEmailTaken(userData.email)) {
      throw new ValidationError('Business rule violation', {
        email: ['Email is already registered']
      });
    }
  }
  
  private async isUsernameTaken(username: string): Promise<boolean> {
    // Simulate database check
    const takenUsernames = ['admin', 'root', 'test'];
    return takenUsernames.includes(username);
  }
  
  private async isEmailTaken(email: string): Promise<boolean> {
    // Simulate database check
    const takenEmails = ['admin@example.com', 'test@example.com'];
    return takenEmails.includes(email);
  }
  
  private async findById(id: string): Promise<User | null> {
    // Simulate database query
    if (id === 'existing-user-id') {
      return {
        id: 'existing-user-id',
        username: 'existing_user',
        email: 'existing@example.com',
        password: 'hashed_password',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };
    }
    return null;
  }
  
  private async saveToDatabase(user: User): Promise<void> {
    console.log('Saving user to database:', user.username);
    // Simulate database save
  }
  
  private async queryDatabase(filters: UserFilter): Promise<User[]> {
    console.log('Querying database with filters:', filters);
    // Simulate database query
    return [
      {
        id: '1',
        username: 'john_doe',
        email: 'john@example.com',
        password: 'hashed_password',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        username: 'jane_smith',
        email: 'jane@example.com',
        password: 'hashed_password',
        isActive: true,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      }
    ];
  }
}

// ===========================================
// 5. API CONTROLLER EXAMPLE
// ===========================================

interface ApiRequest {
  body: unknown;
  params: Record<string, string>;
  query: Record<string, unknown>;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  json(data: unknown): void;
}

export class UserController {
  constructor(private userService: UserService) {}
  
  async createUser(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }
  
  async updateUser(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      const user = await this.userService.updateUser(req.params.id, req.body);
      res.json({
        success: true,
        data: user,
        message: 'User updated successfully'
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }
  
  async getUsers(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      const result = await this.userService.getUsers(req.query);
      res.json({
        success: true,
        data: result.users,
        meta: {
          total: result.total,
          page: req.query.page || 1,
          limit: req.query.limit || 10
        }
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }
  
  private handleError(error: unknown, res: ApiResponse): void {
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
        details: error.details
      });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

// ===========================================
// 6. DEMONSTRATION AND EXAMPLES
// ===========================================

export async function demonstrateZodUsage(): Promise<void> {
  console.log('\n=== Zod Schema Validation Examples ===\n');
  
  const userService = new UserService();
  
  // Example 1: Valid user creation
  console.log('1. Creating a valid user:');
  try {
    const validUser = await userService.createUser({
      username: 'john_doe',
      email: 'john@newcompany.com',
      password: 'securePassword123'
    });
    console.log('✅ User created successfully:', validUser);
  } catch (error) {
    console.log('❌ Creation failed:', error);
  }
  
  // Example 2: Invalid user creation
  console.log('\n2. Creating an invalid user:');
  try {
    await userService.createUser({
      username: 'jo', // Too short
      email: 'invalid-email', // Invalid format
      password: '123' // Too short
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('❌ Validation failed as expected:');
      console.log('   Details:', error.details);
    }
  }
  
  // Example 3: Business rule violation
  console.log('\n3. Testing business rule validation:');
  try {
    await userService.createUser({
      username: 'admin', // Taken username
      email: 'admin@newcompany.com',
      password: 'securePassword123'
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('❌ Business rule violation caught:');
      console.log('   Details:', error.details);
    }
  }
  
  // Example 4: User update
  console.log('\n4. Updating an existing user:');
  try {
    const updatedUser = await userService.updateUser('existing-user-id', {
      email: 'newemail@company.com',
      isActive: false
    });
    console.log('✅ User updated successfully:', updatedUser);
  } catch (error) {
    console.log('❌ Update failed:', error);
  }
  
  // Example 5: Filter validation
  console.log('\n5. Getting users with filters:');
  try {
    const result = await userService.getUsers({
      search: 'john',
      isActive: true,
      sortBy: 'username',
      page: 1,
      limit: 10
    });
    console.log('✅ Users retrieved:', result.users.length, 'users found');
  } catch (error) {
    console.log('❌ Query failed:', error);
  }
  
  // Example 6: Advanced schema usage
  console.log('\n6. Advanced schema validation:');
  
  // Nested object validation
  const OrderSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    items: z.array(z.object({
      productId: z.string(),
      quantity: z.number().positive(),
      price: z.number().min(0)
    })),
    total: z.number().min(0),
    status: z.enum(['pending', 'processing', 'shipped', 'delivered'])
  });
  
  try {
    const order = OrderSchema.parse({
      id: 'order-123',
      customerId: 'customer-456',
      items: [
        { productId: 'product-1', quantity: 2, price: 10.99 },
        { productId: 'product-2', quantity: 1, price: 25.50 }
      ],
      total: 47.48,
      status: 'pending'
    });
    console.log('✅ Complex object validation passed');
  } catch (error) {
    console.log('❌ Complex validation failed:', error);
  }
  
  console.log('\n=== Examples Complete ===\n');
}

// ===========================================
// 7. UTILITY PATTERNS AND BEST PRACTICES
// ===========================================

/**
 * Generic validation middleware for Express
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: ApiRequest, res: ApiResponse, next: () => void) => {
    try {
      req.body = validateData(schema, req.body);
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
          details: error.details
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Validation error'
        });
      }
    }
  };
}

/**
 * Schema composition example
 */
const BaseEntitySchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

const ProductSchema = BaseEntitySchema.extend({
  name: z.string(),
  price: z.number().min(0),
  category: z.string()
});

/**
 * Conditional validation example
 */
const PaymentSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('credit_card'),
    cardNumber: z.string().regex(/^\d{16}$/),
    expiryDate: z.string().regex(/^\d{2}\/\d{2}$/),
    cvv: z.string().regex(/^\d{3,4}$/)
  }),
  z.object({
    method: z.literal('bank_transfer'),
    accountNumber: z.string(),
    routingNumber: z.string()
  }),
  z.object({
    method: z.literal('cash'),
    amount: z.number().positive()
  })
]);

// Run demonstration if this file is executed directly
if (typeof module !== 'undefined' && require.main === module) {
  demonstrateZodUsage().catch(console.error);
}