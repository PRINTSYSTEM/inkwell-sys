# Zod Schema Documentation

This document provides comprehensive guidance on using the Zod validation schemas in the Inkwell Print Management System.

## Overview

Our schema system is built using [Zod](https://github.com/colinhacks/zod) - a TypeScript-first schema validation library with static type inference. All schemas are organized in the `src/Schema/` directory.

## Schema Organization

```
src/Schema/
├── Common/
│   ├── enums.ts     # Shared enumerations
│   └── base.ts      # Base schemas and utilities
├── user.schema.ts
├── role.schema.ts
├── employee.schema.ts
├── report.schema.ts
├── department.schema.ts
├── notification.schema.ts
├── design-code.schema.ts
├── material.schema.ts
├── order.schema.ts
└── index.ts         # Main export file
```

## Basic Usage

### 1. Importing Schemas

```typescript
// Import specific schemas
import { UserSchema, CreateUserSchema } from '@/Schema/user.schema';

// Import validation utilities
import { validateSchema, formatValidationErrors } from '@/Schema';

// Import all schemas from index
import { 
  UserSchema, 
  RoleSchema, 
  EmployeeSchema,
  z 
} from '@/Schema';
```

### 2. Data Validation

```typescript
import { UserSchema, validateSchema } from '@/Schema';

// Validate user data
const userData = {
  username: 'john_doe',
  email: 'john@example.com',
  profile: {
    firstName: 'John',
    lastName: 'Doe'
  }
};

// Method 1: Using validation utility
const result = validateSchema(UserSchema, userData);
if (result.success) {
  console.log('Valid user:', result.data);
} else {
  console.log('Validation errors:', formatValidationErrors(result.errors));
}

// Method 2: Direct Zod validation
try {
  const validUser = UserSchema.parse(userData);
  console.log('Valid user:', validUser);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('Validation failed:', error.errors);
  }
}

// Method 3: Safe parsing
const parseResult = UserSchema.safeParse(userData);
if (parseResult.success) {
  console.log('Valid user:', parseResult.data);
} else {
  console.log('Validation errors:', parseResult.error.errors);
}
```

### 3. Type Inference

```typescript
import { UserSchema, User } from '@/Schema';

// Infer TypeScript type from schema
type InferredUser = z.infer<typeof UserSchema>;

// Use exported type
const user: User = {
  id: 'user-123',
  username: 'john_doe',
  email: 'john@example.com',
  // ... other properties
};
```

## Common Patterns

### 1. Create vs Update Schemas

Most entities have separate schemas for creation and updates:

```typescript
import { 
  UserSchema, 
  CreateUserSchema, 
  UpdateUserSchema 
} from '@/Schema';

// For creating new users (omits auto-generated fields)
const newUser = CreateUserSchema.parse({
  username: 'jane_doe',
  email: 'jane@example.com',
  password: 'secure123',
  profile: {
    firstName: 'Jane',
    lastName: 'Doe'
  }
});

// For updating existing users (all fields optional)
const userUpdate = UpdateUserSchema.parse({
  profile: {
    firstName: 'Janet'
  }
});
```

### 2. Filter Schemas

Use filter schemas for search and query operations:

```typescript
import { UserFilterSchema } from '@/Schema';

const filter = UserFilterSchema.parse({
  search: 'john',
  isActive: true,
  roles: ['admin', 'manager'],
  sortBy: 'createdAt',
  sortOrder: 'desc'
});
```

### 3. Nested Schema Validation

```typescript
import { EmployeeSchema } from '@/Schema';

const employeeData = {
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@company.com'
  },
  position: {
    title: 'Developer',
    department: 'Engineering',
    level: 'senior'
  },
  // ... other nested data
};

const validEmployee = EmployeeSchema.parse(employeeData);
```

## Advanced Usage

### 1. Custom Validation

```typescript
import { z } from 'zod';

// Custom validation with refinement
const CustomUserSchema = UserSchema.refine(
  (data) => data.username !== data.email.split('@')[0],
  {
    message: "Username cannot be the same as email prefix",
    path: ["username"]
  }
);
```

### 2. Conditional Validation

```typescript
// Conditional validation based on user type
const ConditionalUserSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('employee'),
    username: z.string(),
    employeeId: z.string()
  }),
  z.object({
    type: z.literal('customer'),
    username: z.string(),
    customerId: z.string()
  })
]);
```

### 3. Schema Transformation

```typescript
import { z } from 'zod';

// Transform data during validation
const UserWithProcessedEmail = UserSchema.extend({
  email: z.string().email().transform(email => email.toLowerCase())
});
```

## Error Handling

### 1. Structured Error Messages

```typescript
import { formatValidationErrors } from '@/Schema';

try {
  UserSchema.parse(invalidData);
} catch (error) {
  if (error instanceof z.ZodError) {
    const formattedErrors = formatValidationErrors(error);
    /*
    Returns:
    {
      "email": ["Invalid email format"],
      "profile.firstName": ["Required"],
      "username": ["Must be at least 3 characters"]
    }
    */
  }
}
```

### 2. Custom Error Messages

```typescript
const UserSchemaWithCustomErrors = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Please provide a valid email address"),
  age: z.number().int().min(18, "Must be at least 18 years old")
});
```

## API Integration

### 1. Express.js Middleware

```typescript
import { validateSchema } from '@/Schema';
import { CreateUserSchema } from '@/Schema/user.schema';

const validateCreateUser = (req: Request, res: Response, next: NextFunction) => {
  const result = validateSchema(CreateUserSchema, req.body);
  
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: formatValidationErrors(result.errors)
    });
  }
  
  req.body = result.data; // Use validated data
  next();
};

app.post('/users', validateCreateUser, createUserHandler);
```

### 2. Service Layer Validation

```typescript
import { validateSchema } from '@/Schema';
import { CreateEmployeeSchema } from '@/Schema/employee.schema';

class EmployeeService {
  async createEmployee(data: unknown) {
    const result = validateSchema(CreateEmployeeSchema, data);
    
    if (!result.success) {
      throw new ValidationError('Invalid employee data', result.errors);
    }
    
    // Use validated data
    return this.repository.create(result.data);
  }
}
```

## Best Practices

### 1. Schema Design

- **Keep schemas focused**: Each schema should represent a single entity or concept
- **Use composition**: Leverage base schemas and enums from the Common folder
- **Be explicit**: Always define validation rules and constraints
- **Document schemas**: Add comments for complex validation logic

### 2. Performance

- **Parse once**: Validate data at the boundary (API layer) and trust it internally
- **Use safeParse**: For user input where errors are expected
- **Cache schemas**: Reuse schema instances instead of recreating them

### 3. Error Handling

- **Provide context**: Use custom error messages that help users fix issues
- **Log validation errors**: Track validation failures for debugging
- **Graceful degradation**: Handle validation errors without breaking the application

### 4. Type Safety

- **Export types**: Always export TypeScript types from schema files
- **Use inference**: Prefer `z.infer<typeof Schema>` over manual type definitions
- **Strict mode**: Enable strict TypeScript settings for better type checking

## Examples by Entity

### User Management

```typescript
import { 
  UserSchema, 
  CreateUserSchema, 
  UserFilterSchema 
} from '@/Schema';

// Create a new user
const newUser = {
  username: 'admin',
  email: 'admin@company.com',
  password: 'securePassword123',
  profile: {
    firstName: 'Admin',
    lastName: 'User'
  },
  roles: ['admin']
};

const validatedUser = CreateUserSchema.parse(newUser);
```

### Employee Management

```typescript
import { 
  EmployeeSchema, 
  CreateEmployeeSchema 
} from '@/Schema';

// Create employee with full validation
const employeeData = {
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    phone: '+1234567890',
    dateOfBirth: new Date('1990-01-01'),
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'State',
      country: 'Country',
      postalCode: '12345'
    }
  },
  position: {
    title: 'Senior Developer',
    department: 'Engineering',
    level: 'senior',
    startDate: new Date(),
    baseSalary: 75000,
    currency: 'USD'
  }
};

const validatedEmployee = CreateEmployeeSchema.parse(employeeData);
```

### Order Processing

```typescript
import { 
  OrderSchema, 
  CreateOrderSchema,
  OrderItemSchema 
} from '@/Schema';

// Create order with items
const orderData = {
  customerId: 'customer-123',
  customerType: 'business' as const,
  type: 'standard' as const,
  priority: 'medium' as const,
  items: [
    {
      type: 'print' as const,
      name: 'Business Cards',
      quantity: 1000,
      unit: 'pieces',
      unitPrice: 0.15,
      specifications: {
        size: '3.5x2',
        material: 'cardstock',
        colors: 'full_color'
      }
    }
  ],
  deliveryMethod: 'standard_delivery' as const,
  orderDate: new Date()
};

const validatedOrder = CreateOrderSchema.parse(orderData);
```

## Migration Guide

If you're migrating from TypeScript interfaces to Zod schemas:

### 1. Replace Interface with Schema

```typescript
// Before (TypeScript interface)
interface User {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
}

// After (Zod schema)
import { z } from 'zod';
import { IdSchema } from '@/Schema/Common/base';

export const UserSchema = z.object({
  id: IdSchema,
  username: z.string().min(3),
  email: z.string().email(),
  isActive: z.boolean().default(true)
});

export type User = z.infer<typeof UserSchema>;
```

### 2. Update Service Methods

```typescript
// Before
class UserService {
  async createUser(userData: Partial<User>) {
    // Manual validation
    if (!userData.username || userData.username.length < 3) {
      throw new Error('Invalid username');
    }
    
    return this.repository.create(userData);
  }
}

// After
import { validateSchema, CreateUserSchema } from '@/Schema';

class UserService {
  async createUser(userData: unknown) {
    const result = validateSchema(CreateUserSchema, userData);
    
    if (!result.success) {
      throw new ValidationError('Invalid user data', result.errors);
    }
    
    return this.repository.create(result.data);
  }
}
```

### 3. Update API Routes

```typescript
// Before
app.post('/users', (req, res) => {
  const { username, email } = req.body;
  
  if (!username || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Process user creation
});

// After
import { validateSchema, CreateUserSchema } from '@/Schema';

app.post('/users', (req, res) => {
  const result = validateSchema(CreateUserSchema, req.body);
  
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: formatValidationErrors(result.errors)
    });
  }
  
  // Process with validated data: result.data
});
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure to import schemas from the correct path
2. **Type Conflicts**: Use the exported types from schema files
3. **Validation Errors**: Check that your data matches the schema requirements
4. **Performance**: Use `safeParse` for user input, `parse` for trusted data

### Debugging Tips

1. **Use safeParse**: To see validation errors without throwing
2. **Check error paths**: Validation errors include the path to the invalid field
3. **Log schemas**: Use `console.log(schema._def)` to inspect schema structure
4. **Test with known good data**: Verify schemas work with valid data first

## Contributing

When adding new schemas:

1. Follow the established naming conventions
2. Use base schemas and enums from the Common folder
3. Include comprehensive validation rules
4. Export TypeScript types
5. Add documentation and examples
6. Write tests for validation logic

## Resources

- [Zod Documentation](https://github.com/colinhacks/zod)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [JSON Schema](https://json-schema.org/) - For understanding validation concepts