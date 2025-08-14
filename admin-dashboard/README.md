# Admin Dashboard

A modern, responsive admin dashboard built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎨 Modern UI with dark mode support
- 📱 Fully responsive design
- ⚡ Fast performance with Next.js 15
- 🧪 Comprehensive testing setup with Vitest
- 🎯 TypeScript for type safety
- 🎨 Tailwind CSS for styling
- 🔧 shadcn/ui components

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Testing**: Vitest + Testing Library
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3001](http://localhost:3001) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── store/              # Zustand state management
└── types/              # TypeScript type definitions
```

## Configuration

The project uses the same configuration as the main frontend:

- **Tailwind CSS**: Configured with custom design tokens
- **shadcn/ui**: New York style with neutral color scheme
- **Testing**: Vitest with jsdom environment
- **ESLint**: Next.js recommended configuration

## Development

### Adding New Components

1. Use shadcn/ui CLI to add components:
```bash
npx shadcn@latest add [component-name]
```

2. Or manually create components in `src/components/ui/`

### Styling

- Use Tailwind CSS classes for styling
- Follow the design system defined in `globals.css`
- Use the `cn()` utility for conditional classes

### Testing

- Write tests in `__tests__` folders or alongside components
- Use Testing Library for component testing
- Run tests with `npm run test`

## Deployment

The admin dashboard can be deployed to any platform that supports Next.js:

- **Vercel**: Recommended for Next.js applications
- **Netlify**: Static site generation
- **Docker**: Containerized deployment

## Contributing

1. Follow the existing code style and patterns
2. Write tests for new features
3. Update documentation as needed
4. Use conventional commits

## License

This project is part of the Vision TF application suite.
