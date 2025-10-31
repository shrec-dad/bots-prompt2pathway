# Multi-Bot Platform

A production-ready, visually appealing multi-bot platform built with React, TypeScript, and Tailwind CSS. This platform provides comprehensive bot management capabilities with a visual flow builder and professional admin interface.

## 🚀 Features

### Bot Types
- **Lead Qualifier** - Qualify leads with custom scoring and nurture sequences
- **Appointment Booking** - Schedule appointments with calendar integration
- **Customer Support** - Handle support tickets with AI assistance
- **Waitlist Management** - Manage product waitlists with automated updates
- **Social Media Bot** - Engage across social platforms with smart responses

### Core Capabilities
- **Visual Bot Builder** - Drag-and-drop interface with React Flow
- **Multi-client Management** - Manage multiple clients and their bots
- **Real-time Analytics** - Track performance and conversions
- **Embed System** - Script and iframe widgets for client websites
- **Nurture Sequences** - Automated email/SMS follow-up campaigns
- **CRM Integration** - Webhooks and field mapping for any CRM
- **Knowledge Base** - File upload and parsing (PDF, DOCX, XLSX)

## 🎨 Design System

The platform features a modern, colorful design with:
- **Gradient Color Scheme** - Purple to blue primary colors with vibrant accents
- **Professional UI** - Clean layouts with generous spacing and smooth animations
- **Responsive Design** - Mobile-first approach with accessible components
- **Dark/Light Theme** - Full theme support with CSS variables

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with custom variants
- **Bot Builder**: React Flow (@xyflow/react)
- **Routing**: React Router DOM
- **State Management**: React Query (TanStack Query)
- **Icons**: Lucide React
- **Animations**: CSS transitions with custom easing

## 📁 Project Structure

```
src/
├── components/
│   ├── builder/           # Visual bot builder components
│   │   ├── BotBuilder.tsx
│   │   ├── NodePalette.tsx
│   │   ├── NodeInspector.tsx
│   │   └── nodes/         # Node type components
│   ├── layout/            # Layout components
│   │   ├── AdminLayout.tsx
│   │   ├── AdminHeader.tsx
│   │   └── AdminSidebar.tsx
│   └── ui/                # Reusable UI components (shadcn)
├── pages/
│   ├── admin/             # Admin pages
│   │   ├── Dashboard.tsx
│   │   ├── Bots.tsx
│   │   ├── Clients.tsx
│   │   └── Builder.tsx
│   ├── Index.tsx          # Welcome page
│   └── NotFound.tsx
├── types/
│   └── bot.ts             # TypeScript type definitions
├── assets/                # Images and static files
└── styles/
    └── index.css          # Global styles and design system
```

## 🚦 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd multi-bot-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:8080`

## 🎯 Navigation

- **Dashboard** (`/admin`) - Overview and statistics
- **Clients** (`/admin/clients`) - Client management
- **Bots** (`/admin/bots`) - Bot list and management
- **Builder** (`/admin/builder`) - Visual bot flow builder
- **Knowledge** - File upload and management (coming soon)
- **Nurture** - Email/SMS sequence builder (coming soon)
- **Branding** - Customize bot appearance (coming soon)
- **Integrations** - CRM and webhook setup (coming soon)
- **Analytics** - Performance metrics (coming soon)
- **Settings** - Platform configuration (coming soon)

## 🎨 Bot Builder

The visual bot builder includes:

### Node Types
- **Message** - Display text to users
- **Input** - Collect user information
- **Choice** - Present multiple options
- **Logic** - Conditional branching
- **Action** - Perform actions
- **Integration** - Connect external services
- **AI Response** - Generate AI responses

### Features
- Drag-and-drop interface
- Node property inspector
- Canvas controls (zoom, pan, fit view)
- Snap-to-grid functionality
- Mini-map navigation
- Real-time flow validation

## 📊 Admin Dashboard

Professional admin interface featuring:
- **Statistics Cards** - Key metrics with colorful gradients
- **Recent Bots** - Quick access to active bots
- **Performance Tracking** - Conversion rates and lead counts
- **Status Management** - Active/draft/paused bot states
- **Client Overview** - Multi-tenant management

## 🎨 Design Tokens

All colors are defined as HSL values in the design system:

```css
:root {
  /* Primary Colors */
  --primary: 250 84% 64%;        /* Purple */
  --secondary: 264 83% 70%;      /* Blue-Purple */
  
  /* Accent Colors */
  --accent-blue: 217 91% 60%;
  --accent-teal: 189 85% 52%;
  --accent-green: 142 76% 36%;
  --accent-orange: 25 95% 53%;
  --accent-pink: 330 81% 60%;
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
  --gradient-hero: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent-blue)));
}
```

## 🔧 Customization

### Adding New Bot Types
1. Update `BotType` in `src/types/bot.ts`
2. Add label in `BOT_TYPE_LABELS`
3. Create bot-specific logic
4. Add icon mapping in components

### Creating Custom Nodes
1. Create new node component in `src/components/builder/nodes/`
2. Register in `nodeTypes` object in `BotBuilder.tsx`
3. Add to node palette with appropriate styling

### Styling Components
- Use design system tokens instead of hardcoded colors
- Create variants in shadcn components
- Follow the established gradient patterns

## 🚀 Deployment

This project is optimized for modern deployment platforms:

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## 📋 Roadmap

### Phase 1 (Current)
- ✅ Visual bot builder
- ✅ Admin dashboard
- ✅ Bot and client management
- ✅ Professional UI/UX

### Phase 2 (Next)
- 🔄 Knowledge base with file parsing
- 🔄 Nurture sequence builder
- 🔄 Webhook integrations
- 🔄 Embeddable widgets

### Phase 3 (Future)
- 🔄 Real-time analytics
- 🔄 A/B testing
- 🔄 Multi-language support
- 🔄 Advanced AI features

## 📄 License

This project is built with modern web technologies and follows industry best practices for scalability and maintainability.

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
