# EventHub Frontend

A modern React frontend for the EventHub event management application built with Vite, TypeScript, and Tailwind CSS.

## Features

- ✅ **React 18** with TypeScript
- ✅ **Vite** for fast development and building
- ✅ **Tailwind CSS** for styling
- ✅ **React Router** for client-side routing
- ✅ **Context API** for state management
- ✅ **Axios** for API communication
- ✅ **Custom hooks** for API calls
- ✅ **Protected routes** with authentication
- ✅ **Responsive design** with mobile-first approach

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Header, Footer, Layout)
│   ├── ui/             # Basic UI components (Button, Input)
│   └── forms/          # Form components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API service layers
├── context/            # React Context providers
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment variables:
```bash
cp .env.example .env
```

3. Update the `.env` file with your API URL:
```
VITE_API_BASE_URL=http://localhost:4000/api
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Authentication

The application includes a complete authentication system:

- **Login/Register** pages with form validation
- **Context API** for global auth state management
- **Protected routes** for authenticated users
- **Role-based access** (admin/user)
- **Automatic token management** with localStorage
- **API interceptors** for token handling

## API Integration

- **Base API service** with Axios interceptors
- **Service layers** for different API endpoints (auth, events)
- **Custom hooks** for data fetching and mutations
- **Error handling** with user-friendly messages
- **Loading states** for better UX

## Styling

- **Tailwind CSS** for utility-first styling
- **Custom color palette** with primary brand colors
- **Responsive design** with mobile-first approach
- **Component-based** styling approach
- **Dark mode ready** (can be extended)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint (if configured)

## Pages

- **Home** - Landing page with hero section and popular events
- **Login** - User authentication
- **Register** - User registration
- **Dashboard** - Protected user dashboard
- **Admin** - Admin-only panel
- **Events** - Events listing (placeholder)

## Components

### UI Components
- `Button` - Reusable button with variants and loading states
- `Input` - Form input with labels, errors, and validation

### Layout Components
- `Header` - Navigation header with auth buttons
- `Footer` - Site footer with links
- `Layout` - Main layout wrapper

### Other Components
- `ProtectedRoute` - Route protection for authenticated users

## Custom Hooks

- `useApi` - Generic API call hook with loading/error states
- `useEvents` - Event-specific API hooks
- `useAuth` - Authentication context hook

## Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL

## Future Enhancements

- Event listing and filtering
- Event details and booking
- User profile management
- Admin event management
- Real-time notifications
- Event search and categories
- Social features (comments, ratings)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
