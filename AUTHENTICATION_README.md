# DimPos Management - Authentication Flow Documentation

## Tổng quan (Overview)

Tài liệu này mô tả chi tiết cơ chế xác thực trong ứng dụng DimPos Management, bao gồm quy trình đăng nhập, lưu trữ token, quản lý state Redux, và bảo vệ route trong kiến trúc monolithic.

## Kiến trúc Authentication

### 1. API Layer - Tầng API
**File:** [`src/apis/auth.api.ts`](src/apis/auth.api.ts)
```typescript
import { apiRequest } from "@/lib/http";
import type { TAuthResponse, TLoginRequest } from "@/schema/auth.schema";
import { API_SUFFIX } from "./util.api";
import type { BaseResponse } from "@/types/response.type";

export const authApi = {
    login: async (request: TLoginRequest) => 
        apiRequest.identity.post<BaseResponse<TAuthResponse>>(API_SUFFIX.AUTH_API, request)
}
```

### 2. HTTP Configuration - Cấu hình HTTP
**File:** [`src/lib/http.ts`](src/lib/http.ts)

Ứng dụng sử dụng kiến trúc **monolithic** với các microservice endpoints:
```typescript
export const apiRequest = {
    catalog,      // VITE_API_CATALOG_URL
    identity,     // VITE_API_IDENTITY_URL  
    menu,         // VITE_API_MENU_URL
    brand,        // VITE_API_BRAND_URL
    store,        // VITE_API_STORE_URL
    promotion,    // VITE_API_PROMOTION_URL
    order,        // VITE_API_ORDER_URL
    payment,      // VITE_API_PAYMENT_URL
    inventory,    // VITE_API_INVENTORY_URL
    notification  // VITE_API_NOTIFICATION_URL
}
```

### 3. Redux State Management - Quản lý State
**File:** [`src/redux/User/user-slice.tsx`](src/redux/User/user-slice.tsx)

#### Cấu trúc State
```typescript
interface UserState {
    user: TAuthResponse | null;
    isAuthenticated: boolean; 
    role: TRole | null; // "SystemAdmin" | "BrandAdmin" | "StoreAdmin"
}
```

#### Schema xác thực
```typescript
// src/schema/auth.schema.ts
export type TAuthResponse = {
    accountId: string;
    username: string;
    accessToken: string;
    refreshToken: string;
}

export type TLoginRequest = {
    username: string;
    password: string;
}
```

#### Các Actions chính
- **`setUser`**: Lưu thông tin user và token vào localStorage
- **`loadUserFromStorage`**: Load thông tin user từ localStorage khi khởi động app
- **`logout`**: Xóa thông tin user và token

### 4. Provider Architecture - Kiến trúc Provider

#### App Provider Hierarchy
**File:** [`src/providers/app-provider.tsx`](src/providers/app-provider.tsx)
```typescript
<FontProvider>
    <ThemeProvider>
        <QueryClientProvider client={queryClient}>
            <ReduxProvider>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </ReduxProvider>
        </QueryClientProvider>
    </ThemeProvider>
</FontProvider>
```

#### Redux Provider
**File:** [`src/providers/redux-provider.tsx`](src/providers/redux-provider.tsx)
```typescript
const ReduxProvider = ({ children }: Props) => {
    return (
        <Provider store={store}>
            {children}
        </Provider>
    )
}
```

#### Auth Provider
**File:** [`src/providers/auth-provider.tsx`](src/providers/auth-provider.tsx)
```typescript
const AuthProvider = ({ children }: Props) => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(loadUserFromStorage());
    }, []);
    return children;
}
```

## Quy trình Authentication hoàn chỉnh

### 1. Quy trình đăng nhập (Login Process)

#### Bước 1: User gửi form đăng nhập
**Component:** [`src/pages/auth/login/components/login-form.tsx`](src/pages/auth/login/components/login-form.tsx)

```typescript
const onSubmit = async (data: TLoginRequest) => {
    if (loginMutation.isPending) return;

    try {
        // 1. Gọi API đăng nhập
        const result = await loginMutation.mutateAsync(data);
        const accessToken = result.data.data.accessToken;
        
        // 2. Decode JWT để lấy role
        const role = (jwtDecode(accessToken) as any).role;
        
        // 3. Validate role
        if (RoleSchema.safeParse(role).error) {
            throw { response: { status: 403, data: { status: 403 } } };
        }
        
        // 4. Kết nối SignalR
        await connect(accessToken);
        
        // 5. Dispatch action setUser để lưu vào Redux
        dispatch(setUser(result.data.data));
        
    } catch (error) {
        handleApiError(error);
    }
};
```

#### Bước 2: Redux State Update
**Action:** [`setUser`](src/redux/User/user-slice.tsx)

```typescript
setUser(state, action: PayloadAction<TAuthResponse | null>) {
    const userData = action.payload;

    // Kiểm tra dữ liệu hợp lệ
    if (!userData || !userData.accessToken) {
        state.user = null;
        state.isAuthenticated = false;
        state.role = null;
        clearStoredAuthData();
        return;
    }

    // Kiểm tra token hết hạn
    if (isTokenExpired(userData.accessToken)) {
        console.warn('Attempted to set user with expired token');
        clearStoredAuthData();
        return;
    }

    try {
        // Decode token để lấy role
        const decodedToken = jwtDecode(userData.accessToken) as any;

        // Cập nhật state
        state.user = userData;
        state.isAuthenticated = true;
        state.role = decodedToken.role;

        // Lưu vào localStorage
        localStorage.setItem("accessToken", userData.accessToken);
        localStorage.setItem("refreshToken", userData.refreshToken);
        localStorage.setItem("user", JSON.stringify(userData));

        // Set Authorization headers cho tất cả API instances
        setAuthorizationHeaders(userData.accessToken);
    } catch (error) {
        console.error('Error processing user token:', error);
        clearStoredAuthData();
    }
}
```

### 2. Token Storage & Management - Lưu trữ và quản lý Token

#### LocalStorage Structure
```javascript
localStorage: {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...", 
    "user": "{\"accountId\":\"...\",\"username\":\"...\",\"accessToken\":\"...\",\"refreshToken\":\"...\"}"
}
```

#### Authorization Headers Setup (Monolithic)
```typescript
const setAuthorizationHeaders = (token: string) => {
    const authHeader = `Bearer ${token}`;
    
    // Set headers cho tất cả API instances trong kiến trúc monolithic
    apiRequest.catalog.defaults.headers.common.Authorization = authHeader;
    apiRequest.identity.defaults.headers.common.Authorization = authHeader;
    apiRequest.menu.defaults.headers.common.Authorization = authHeader;
    apiRequest.brand.defaults.headers.common.Authorization = authHeader;
    apiRequest.store.defaults.headers.common.Authorization = authHeader;
    apiRequest.promotion.defaults.headers.common.Authorization = authHeader;
    apiRequest.order.defaults.headers.common.Authorization = authHeader;
    apiRequest.payment.defaults.headers.common.Authorization = authHeader;
    apiRequest.inventory.defaults.headers.common.Authorization = authHeader;
    apiRequest.notification.defaults.headers.common.Authorization = authHeader;
};
```

#### Token Validation
```typescript
const isTokenExpired = (token: string): boolean => {
    try {
        const decodedToken = jwtDecode(token) as any;
        if (!decodedToken.exp) return true;
        
        const currentTime = Date.now() / 1000;
        const bufferTime = 30; // 30 giây buffer
        
        return decodedToken.exp < (currentTime + bufferTime);
    } catch (error) {
        console.error('Error decoding token:', error);
        return true;
    }
};
```

### 3. Application Startup Flow - Quy trình khởi động ứng dụng

#### Bước 1: App Initialization
**File:** [`src/App.tsx`](src/App.tsx)
```typescript
function App() {
    return (
        <SignalRProvider>
            <AppProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </AppProvider>
        </SignalRProvider>
    )
}
```

#### Bước 2: Load User từ Storage
**Action:** [`loadUserFromStorage`](src/redux/User/user-slice.tsx)
```typescript
loadUserFromStorage(state) {
    try {
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");
        const storedUserData = localStorage.getItem("user");

        // Kiểm tra dữ liệu tối thiểu
        if (!accessToken || !refreshToken || !storedUserData) {
            clearStoredAuthData();
            return;
        }

        // Kiểm tra token hết hạn
        if (isTokenExpired(accessToken)) {
            clearStoredAuthData();
            state.user = null;
            state.isAuthenticated = false;
            state.role = null;
            return;
        }

        // Khôi phục user state
        const userData = JSON.parse(storedUserData);
        const decodedToken = jwtDecode(accessToken) as any;

        state.user = userData;
        state.isAuthenticated = true;
        state.role = decodedToken.role;

        setAuthorizationHeaders(accessToken);
    } catch (error) {
        clearStoredAuthData();
        state.user = null;
        state.isAuthenticated = false;
        state.role = null;
    }
}
```

### 4. Route Protection - Bảo vệ Route

#### Auth Guard
**File:** [`src/guards/auth-guard.tsx`](src/guards/auth-guard.tsx)
```typescript
export default function AuthGuard({ children }: AuthGuardProps) {
    const { isAuthenticated } = useSelector((state: RootState) => state.user);
    const { pathname } = useLocation();
    const [requestedLocation, setRequestedLocation] = useState<string | null>(null);

    if (!isAuthenticated) {
        if (pathname !== requestedLocation) {
            setRequestedLocation(pathname);
        }
        
        if (pathname === "/") {
            return <Navigate to="/auth/login" />;
        }
        
        return (
            <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
                <div className="w-full max-w-sm md:max-w-5xl">
                    <LoginForm />
                </div>
            </div>
        );
    }

    if (requestedLocation && pathname !== requestedLocation) {
        setRequestedLocation(null);
        return <Navigate to={requestedLocation} />;
    }

    return <>{children}</>;
}
```

#### Role-Based Guard
**File:** [`src/guards/role-based-guard.tsx`](src/guards/role-based-guard.tsx)
```typescript
const RoleBasedGuard = ({ children, role }: RoleBasedGuardProps) => {
    const { isAuthenticated, role: userRole } = useSelector((state: RootState) => state.user);
    
    if (!isAuthenticated) {
        return <LoginForm />;
    }
    
    // Redirect theo role nếu user không có quyền truy cập
    if (userRole !== role) {
        switch (userRole) {
            case 'BrandAdmin':
                return <Navigate to={PATH_BRAND_DASHBOARD.root} replace />;
            case 'SystemAdmin':
                return <Navigate to={PATH_ADMIN_DASHBOARD.root} replace />;
            case 'StoreAdmin':
                return <Navigate to={PATH_STORE_DASHBOARD.root} replace />;
            default:
                return <Navigate to='/404' replace />;
        }
    }
    
    return <>{children}</>;
}
```

#### Guest Guard (Redirect authenticated users)
**File:** [`src/guards/guest-guard.tsx`](src/guards/guest-guard.tsx)
```typescript
export default function GuestGuard({ children }: GuestGuardProps) {
    const { isAuthenticated, role } = useSelector((state: RootState) => state.user);

    if (isAuthenticated) {
        switch (role) {
            case 'BrandAdmin':
                return <Navigate to={PATH_BRAND_DASHBOARD.root} />;
            case 'StoreAdmin':
                return <Navigate to={PATH_STORE_DASHBOARD.root} />;
            case 'SystemAdmin':
                return <Navigate to={PATH_ADMIN_DASHBOARD.root} />;
            default:
                return <Navigate to='/404' />;
        }
    }

    return <>{children}</>;
}
```

### 5. Route Structure - Cấu trúc Route theo Role

#### Path Configuration
**File:** [`src/routes/path.ts`](src/routes/path.ts)
```typescript
const ROOTS_AUTH = '/auth';
const ROOTS_BRAND_DASHBOARD = '/brand-admin/dashboard';
const ROOTS_ADMIN_DASHBOARD = '/system-admin/dashboard';
const ROOTS_STORE_DASHBOARD = '/store-admin/dashboard';

export const PATH_AUTH = {
    root: ROOTS_AUTH,
    login: path(ROOTS_AUTH, '/login'),
    logout: path(ROOTS_AUTH, '/logout'),
};

export const PATH_BRAND_DASHBOARD = {
    root: ROOTS_BRAND_DASHBOARD,
    general: { app: path(ROOTS_BRAND_DASHBOARD, '/app') },
    // ... other brand routes
};

export const PATH_STORE_DASHBOARD = {
    root: ROOTS_STORE_DASHBOARD,
    general: { app: path(ROOTS_STORE_DASHBOARD, '/app') },
    // ... other store routes
};

export const PATH_ADMIN_DASHBOARD = {
    root: ROOTS_ADMIN_DASHBOARD,
    general: { app: path(ROOTS_ADMIN_DASHBOARD, '/app') },
    // ... other admin routes  
};
```

#### Route Protection Implementation
**File:** [`src/routes/routes.tsx`](src/routes/routes.tsx)
```typescript
export const AppRoutes = () => useRoutes([
    // Auth routes
    {
        path: PATH_AUTH.root,
        children: [
            { element: <Navigate to={PATH_AUTH.login} replace />, index: true },
            { 
                path: "login", 
                element: (
                    <GuestGuard>
                        <LoginPage />
                    </GuestGuard>
                ) 
            },
            { path: "logout", element: <Logout /> },
        ],
    },
    
    // Brand Admin routes
    {
        path: PATH_BRAND_DASHBOARD.root,
        element: (
            <RoleBasedGuard role="BrandAdmin">
                <DashBoardLayout />
            </RoleBasedGuard>
        ),
        children: [
            { element: <Navigate to={PATH_BRAND_DASHBOARD.general.app} replace />, index: true },
            { path: "app", element: <GeneralAppPage /> },
            // ... other brand routes
        ],
    },
    
    // Store Admin routes  
    {
        path: PATH_STORE_DASHBOARD.root,
        element: (
            <RoleBasedGuard role="StoreAdmin">
                <DashBoardLayout />
            </RoleBasedGuard>
        ),
        children: [
            { element: <Navigate to={PATH_STORE_DASHBOARD.general.app} replace />, index: true },
            { path: "app", element: <GeneralAppPage /> },
            // ... other store routes
        ],
    },
    
    // System Admin routes
    {
        path: PATH_ADMIN_DASHBOARD.root,
        element: (
            <RoleBasedGuard role="SystemAdmin">
                <DashBoardLayout />
            </RoleBasedGuard>
        ),
        children: [
            { element: <Navigate to={PATH_ADMIN_DASHBOARD.general.app} replace />, index: true },
            { path: "app", element: <GeneralAppPage /> },
            // ... other admin routes
        ],
    },
    
    // Default redirect
    {
        path: "/",
        element: (
            <AuthGuard>
                <DashBoardLayout />
            </AuthGuard>
        ),
        children: [
            { element: <Navigate to={PATH_BRAND_DASHBOARD.root} replace />, index: true },
        ],
    }
]);
```

### 6. SignalR Integration - Tích hợp SignalR

#### SignalR Provider
**File:** [`src/context/signalr-provider.tsx`](src/context/signalr-provider.tsx)
```typescript
export const SignalRProvider = ({ children }: { children: ReactNode }) => {
    const [connectionStatus, setConnectionStatus] = useState<
        "connecting" | "connected" | "disconnected" | "error"
    >("disconnected");

    const connect = async (accessToken: string) => {
        try {
            setConnectionStatus("connecting");
            const newConnection = new signalR.HubConnectionBuilder()
                .withUrl(envConfig.VITE_NOTIFICATION_HUB_URL, {
                    accessTokenFactory: () => accessToken,
                    transport: signalR.HttpTransportType.WebSockets,
                    skipNegotiation: true
                })
                .configureLogging(signalR.LogLevel.Debug)
                .withAutomaticReconnect([0, 2, 1, 3])
                .build();

            await newConnection.start();
            setConnectionStatus("connected");
        } catch (err) {
            console.error("Error establishing SignalR connection:", err);
            setConnectionStatus("error");
        }
    };

    const disconnect = async () => {
        try {
            if (globalConnection) {
                await globalConnection.stop();
                globalConnection = null;
            }
            setConnectionStatus("disconnected");
        } catch (err) {
            console.error("Error disconnecting SignalR connection:", err);
        }
    };

    return (
        <SignalRContext.Provider value={{ connect, disconnect, connectionStatus }}>
            {children}
        </SignalRContext.Provider>
    );
};
```

### 7. Logout Process - Quy trình đăng xuất

#### Logout Component
**File:** [`src/pages/auth/logout/logout.tsx`](src/pages/auth/logout/logout.tsx)
```typescript
const Logout = () => {
    const dispatch = useDispatch();
    const { isAuthenticated } = useSelector((state: RootState) => state.user);
    const { disconnect } = useSignalRContext();
    
    useEffect(() => {
        if (isAuthenticated) {
            disconnect(); // Disconnect SignalR
            dispatch(logout()); // Clear Redux state
            window.location.href = PATH_AUTH.root; // Redirect to login
        }
    }, [dispatch]);

    return null;
};
```

#### Logout Action
```typescript
logout(state) {
    state.user = null;
    state.isAuthenticated = false;
    state.role = null;
    clearStoredAuthData();
}

const clearStoredAuthData = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    clearAuthorizationHeaders();
};

const clearAuthorizationHeaders = () => {
    // Clear headers từ tất cả API instances
    apiRequest.catalog.defaults.headers.common.Authorization = null;
    apiRequest.identity.defaults.headers.common.Authorization = null;
    // ... clear tất cả các API instances khác
};
```

## Tính năng đặc biệt

### 1. Token Expiration Handling
- Tự động validate token khi khởi động app
- Buffer time 30 giây trước khi token thực sự hết hạn
- Tự động cleanup token hết hạn

### 2. Role-based Navigation
- Automatic redirect sau khi login dựa vào role
- Role-specific sidebar và navigation menu
- Protection routes theo permission

### 3. Error Handling
- Graceful fallback về login page khi token invalid
- Network error handling trong login process
- Security measures với automatic cleanup

### 4. Dashboard Layout theo Role
**File:** [`src/components/app-sidebar.tsx`](src/components/app-sidebar.tsx)
```typescript
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { role } = useSelector((state: RootState) => state.user);
    
    return (
        <Sidebar variant="sidebar" collapsible="icon" {...props}>
            {(() => {
                switch (role) {
                    case "BrandAdmin":
                        return (
                            <SidebarContent>
                                <NavMain content={brandRoutes.dashboard} />
                                <NavMain content={brandRoutes.productManagement} />
                                <NavMain content={brandRoutes.promotionCampaignManagement} />
                                <NavMain content={brandRoutes.storeManagement} />
                                <NavMain content={brandRoutes.generalManagement} />
                            </SidebarContent>
                        );
                    case "StoreAdmin":
                        return (
                            <SidebarContent>
                                <NavMain content={storeRoutes.dashboard} />
                                <NavMain content={storeRoutes.sales} />
                                <NavMain content={storeRoutes.operation} />
                                <NavMain content={storeRoutes.settings} />
                            </SidebarContent>
                        );
                    case "SystemAdmin":
                        return (
                            <SidebarContent>
                                <NavMain content={adminRoutes.dashboard} />
                                <NavMain content={adminRoutes.brand} />
                                <NavMain content={adminRoutes.systemManagement} />
                            </SidebarContent>
                        );
                    default:
                        return null;
                }
            })()}
        </Sidebar>
    );
}
```

## Cách sử dụng trong Components

### Accessing User Data
```typescript
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';

const MyComponent = () => {
    const { user, isAuthenticated, role } = useSelector((state: RootState) => state.user);
    
    if (!isAuthenticated) {
        return <div>Vui lòng đăng nhập</div>;
    }
    
    return <div>Chào mừng, {user?.username}!</div>;
};
```

### Manual Logout
```typescript
import { useDispatch } from 'react-redux';
import { logout } from '@/redux/user/user-slice';

const LogoutButton = () => {
    const dispatch = useDispatch();
    
    const handleLogout = () => {
        dispatch(logout());
    };
    
    return <button onClick={handleLogout}>Đăng xuất</button>;
};
```

### Using Auth Hook
```typescript
import { useAuth } from '@/hooks/use-auth';

const LoginComponent = () => {
    const { loginMutation } = useAuth();
    
    const handleLogin = async (data: TLoginRequest) => {
        try {
            const result = await loginMutation.mutateAsync(data);
            // Handle success
        } catch (error) {
            // Handle error
        }
    };
};
```

Hệ thống authentication này cung cấp một giải pháp bảo mật, linh hoạt và dễ bảo trì cho việc xác thực người dùng với automatic token management, role-based access control và tích hợp SignalR trong kiến trúc monolithic.