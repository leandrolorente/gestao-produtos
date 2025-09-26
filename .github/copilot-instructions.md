# Gestão de Produtos - AI Coding Agent Instructions

## Project Overview
This is an Angular 20+ inventory management system using **standalone components** and **zoneless change detection**. The app manages product inventory with CRUD operations, built with Angular Material and using mock data (no backend services yet).

## Architecture Patterns

### Component Structure
- **Standalone Components**: All components use `standalone: true` with explicit imports
- **Signal-based State**: Uses Angular signals (`signal()`) for reactive state management
- **No Services Layer**: Currently uses mock data directly in components (see `ELEMENT_DATA` in `product-list.component.ts`)

### Key Files & Patterns
- `src/app/app.ts`: Main app component using signals (`protected readonly title = signal('gestao-produtos')`)
- `src/app/models/Product.ts`: Core data model with Portuguese-Brazilian field names
- `src/app/pages/products/product-list/`: Main feature with MatTable, sorting, and CSV export
- `src/app/components/product-dialog/`: Modal form component for CRUD operations

### Angular Material Integration
Always import required Material modules in component imports array:
```typescript
@Component({
  standalone: true,
  imports: [
    CommonModule, // Required for *ngIf, *ngFor
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    // ... other Material modules
  ]
})
```

## Development Workflows

### Running the Application
- **Start dev server**: `npm start` (runs `ng serve`)
- **Build**: `npm run build`
- **Tests**: `npm test`
- **SSR serve**: `npm run serve:ssr:gestao-produtos`

### Code Generation
Use Angular CLI for consistency:
```bash
ng generate component components/component-name
ng generate component pages/feature-name/component-name
```

## Project-Specific Conventions

### Language & Localization
- **Portuguese-Brazilian**: All UI text, error messages, and field labels are in pt-BR
- **Date formatting**: Uses `toLocaleString('pt-BR')` for date display
- **Validation messages**: Custom Portuguese error messages in `getFieldErrorMessage()`

### Form Patterns
- **Reactive Forms**: All forms use FormBuilder with Validators
- **Number formatting**: Custom formatters for price (`formatPrice()`) and quantity (`formatQuantity()`)
- **Validation**: Real-time validation with Portuguese error messages

### Data Management
- **Mock Data**: Currently using `ELEMENT_DATA` array in `product-list.component.ts`
- **State Updates**: Manual array manipulation with spread operators for immutability
- **ID Generation**: Uses `new Date().getTime()` for new product IDs

### Styling Approach
- **SCSS**: All components use SCSS with Angular Material theming
- **Prettier Config**: 100 character line width, single quotes, Angular HTML parser
- **Responsive**: Desktop-first approach with Material Card layouts

## Critical Integration Points

### Dialog Communication
Product dialogs return form data via `MatDialogRef.close(result)`. Parent component handles:
- Edit mode: Updates existing item in array
- Create mode: Adds new item with generated ID
- Both update `lastUpdated` timestamp

### CSV Export Feature
Custom CSV export in `exportToCsv()` method handles:
- Date formatting for Brazilian locale
- Comma escaping in CSV values
- Direct browser download via Blob API

### Routing Structure
- Default route redirects to `/produtos`
- Single-page app with component-based routing
- No auth guards or lazy loading currently implemented

## When Adding Features
1. Create standalone components with explicit Material module imports
2. Use Portuguese labels and validation messages
3. Follow the mock data pattern until backend integration
4. Maintain the existing form validation and formatting patterns
5. Add proper TypeScript interfaces in `models/` directory
