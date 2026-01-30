# Changelog

All notable changes to the Product Card Generator project are documented here.

## [1.3.0] - 2026-01-30 - Cyrillic Font Support

### Added
- **Full Cyrillic Character Support**: Replaced entire font library with 14 fonts verified to support Russian text
- **Cyrillic-Compatible Fonts**:
  - Sans-serif: Roboto, Open Sans, Montserrat, Raleway, PT Sans, Noto Sans, Ubuntu, Exo 2, Jura
  - Serif: PT Serif
  - Display: Oswald, Comfortaa, Marck Script, Caveat
- **Russian Font Descriptions**: All font descriptions now in Russian for better UX
- **Cyrillic Subset Loading**: Google Fonts now loads with `cyrillic` and `cyrillic-ext` subsets
- **New Helper Function**: `getCyrillicFonts()` to filter Cyrillic-compatible fonts

### Changed
- Removed fonts without Cyrillic support (Inter, Poppins, Playfair Display, Lato, Merriweather)
- Updated all font metadata to include `cyrillicSupport: true` flag
- Default title font changed to Montserrat Bold (700)
- Default description font changed to Poppins Regular (400)

### Technical Details
- All 14 fonts tested with Russian text rendering
- Font library now includes category-based filtering
- Comprehensive test coverage for Cyrillic support (51 passing tests)

---

## [1.2.0] - 2026-01-30 - Font Selection Feature

### Added
- **Font Selection UI**: Dropdown menu in card editor to choose from 10 professional fonts
- **Font Customization Controls**:
  - Font family selector with preview
  - Font size input (8-200px range with slider)
  - Font weight selector (400-900)
  - Text color picker with hex input
- **Google Fonts Integration**: Loaded 10 fonts via CDN with multiple weights
- **Real-time Preview**: Canvas updates instantly as font properties change

### Changed
- Card editor properties panel redesigned with typography section
- Layer update API now supports font family, size, weight, and color changes

### Technical Details
- Font library created with categorization (sans-serif, serif, display)
- Helper functions for font lookup by family or category
- All font changes persist to database via tRPC mutations

---

## [1.1.0] - 2026-01-30 - Major Product Card Generator Improvements

### Added
- **CSV Preview System**: Validate data before import with error/warning indicators
- **Russian Marketplace Templates**:
  - Wildberries (1000x1000px, 1:1 aspect ratio)
  - Ozon (1200x1200px, 1:1 aspect ratio)
  - Yandex Market (1000x1000px, 1:1 aspect ratio)
  - Avito (1280x960px, 4:3 aspect ratio)
  - Custom template option
- **Composition Rules Engine**:
  - Golden ratio calculations for optimal element positioning
  - Rule of thirds grid overlay in editor
  - Automatic layout based on marketplace guidelines
  - Text safe zones to prevent content clipping
- **Redesigned Card Editor**:
  - Canvas-style interface with professional toolbars
  - Layer management panel with visibility toggles
  - Properties panel for detailed customization
  - Zoom controls (25%-200%)
  - Composition guides overlay
- **Regeneration Controls**: Individual regenerate buttons for each layer (background, product image, title, description)

### Changed
- Card generation now uses marketplace-specific composition rules
- Background generation improved with better AI prompts
- Product image positioning follows golden ratio principles
- Text elements auto-sized based on canvas dimensions

### Fixed
- Background removal integration with Pixelcut API
- AI background generation (was showing only accent color)
- Composition violations (improved element scaling and positioning)

### Technical Details
- Created `compositionRules.ts` utility with mathematical layout calculations
- Added marketplace template configuration system
- Implemented regeneration API endpoints for all layer types
- Comprehensive test coverage for composition rules

---

## [1.0.1] - 2026-01-30 - Database Fix

### Fixed
- **CSV Import Error**: Changed `price` field from `decimal(10,2)` to `text` type
- Now supports any currency format including symbols and formatting (e.g., "3 250 000 ₽")
- Database migration applied successfully to production

### Technical Details
- Updated Drizzle schema for products table
- Modified CSV parser to handle text-based price values
- All existing tests updated and passing

---

## [1.0.0] - 2026-01-30 - Initial Release

### Added
- **CSV Product Import**: Upload CSV files with SKU, name, description, category, and price
- **AI-Powered Data Extraction**: Gemini AI integration for:
  - Marketing copy generation
  - Product image discovery and validation
  - Background scene description generation
- **Background Processing**:
  - Pixelcut API integration for background removal
  - AI-generated contextual backgrounds
- **Visual Card Editor**:
  - Fabric.js canvas for interactive editing
  - Layer system (background, product image, title, description)
  - Real-time preview
- **Bulk Card Generation**:
  - Process multiple products simultaneously
  - Progress tracking with job management
  - Real-time status updates
- **Export Functionality**: Download finished cards as PNG
- **Dashboard Interface**:
  - Product management page
  - Card gallery view
  - Processing jobs monitor
  - User authentication with Manus OAuth
- **S3 Storage Integration**: All generated images stored in S3
- **Owner Notifications**: Real-time alerts for bulk processing events

### Technical Stack
- **Frontend**: React 19, Tailwind CSS 4, Fabric.js, shadcn/ui
- **Backend**: Express 4, tRPC 11, Drizzle ORM
- **Database**: MySQL/TiDB
- **AI Services**: Gemini (Google), Pixelcut API
- **Storage**: S3-compatible storage
- **Authentication**: Manus OAuth

### Database Schema
- `users`: User accounts with role-based access
- `products`: Product catalog with metadata
- `product_cards`: Generated card metadata
- `card_layers`: Individual card elements (background, image, text)
- `processing_jobs`: Bulk generation job tracking
- `processing_logs`: Detailed processing history

---

## Development Notes

### Testing
- Comprehensive test suite with Vitest
- 51 passing tests across 6 test files
- Tests cover: CSV parsing, composition rules, font library, product routers, authentication

### Code Quality
- TypeScript strict mode enabled
- ESLint and Prettier configured
- No TypeScript errors or build warnings

### Performance
- Lazy loading for heavy components
- Optimized image loading with S3 CDN
- Canvas rendering optimizations with Fabric.js

---

## Future Roadmap

### Planned Features
1. **Text Alignment Controls**: Left/center/right alignment for text layers
2. **Text Effects**: Shadow, outline, and background options for better readability
3. **Font Pairing Presets**: Pre-designed combinations like "Современный" or "Классический"
4. **Card Templates Library**: Pre-designed templates with different visual styles
5. **Batch Export**: Download all cards as ZIP file
6. **Custom Font Upload**: Allow users to upload brand fonts
7. **Watermark Support**: Optional watermarks for client previews
8. **Multi-language Support**: Interface localization beyond Russian

### Known Limitations
- Pixelcut API requires API key configuration in Settings → Secrets
- Background generation depends on external AI service availability
- Large CSV files (>1000 rows) may require chunked processing
