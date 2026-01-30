# Product Card Generator - TODO

## Core Features
- [x] Database schema for products, cards, layers, and processing jobs
- [x] CSV product import (SKU, name, description, category, price)
- [x] Gemini AI integration for data extraction and marketing copy
- [x] Product image discovery and validation
- [x] Pixelcut API integration for background removal
- [x] AI-generated contextual backgrounds
- [x] Visual card editor with Fabric.js canvas
- [x] Bulk card generation with progress tracking
- [x] Card layer system (background, product image, title, description)
- [x] Export cards as PNG
- [x] Dashboard for managing products, cards, and jobs
- [x] S3 storage for images and generated cards
- [x] Owner notifications for job status

## UI Components
- [x] Dashboard layout with sidebar navigation
- [x] Products list page with CSV import
- [x] Card editor page with Fabric.js canvas
- [x] Processing jobs page with progress tracking
- [x] Generated cards gallery

## API Endpoints
- [x] Products CRUD operations
- [x] CSV import endpoint
- [x] Card generation endpoints
- [x] Processing job management
- [x] File upload/download endpoints


## Bugs
- [x] Fix database error in CSV import: "Failed query: insert into `products`" - missing column or data type mismatch

## New Features & Improvements
- [x] CSV preview step with validation before import
- [x] Russian marketplace templates (Wildberries, Ozon, Yandex Market) with proper size/aspect ratio/resolution
- [ ] Fix background removal integration with Pixelcut API
- [ ] Fix AI background generation (currently showing only accent color)
- [ ] Implement proper composition rules for card layouts (golden ratio, rule of thirds, proper scaling)
- [ ] Redesign card editor as canvas-style interface with toolbars
- [ ] Add regeneration controls for each layer/step in the editor
- [ ] Add visual indicators for composition guidelines in editor
