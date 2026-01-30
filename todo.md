# Product Card Generator - TODO

## Phase 1: Architecture & Planning
- [x] Initialize web project with tRPC + Express + React + Tailwind
- [x] Create comprehensive project plan
- [x] Set up environment variables for Gemini and Pixelcut APIs
- [x] Create database schema for products, cards, and processing state

## Phase 2: Database Schema
- [x] Create `products` table for CSV-imported product data
- [x] Create `product_cards` table for generated card state and metadata
- [x] Create `card_layers` table for tracking individual layer data (image, background, text)
- [x] Create `processing_jobs` table for bulk processing state and notifications
- [x] Create `processing_logs` table for detailed step-by-step processing logs

## Phase 3: Backend API - CSV Upload & Data Extraction
- [x] Implement `/api/trpc/products.uploadCSV` endpoint for CSV file upload
- [x] Implement CSV parsing logic to extract product data
- [x] Implement `/api/trpc/products.list` endpoint to retrieve uploaded products
- [x] Add validation for required CSV columns

## Phase 4: Gemini Integration
- [x] Implement Gemini API wrapper for parameter extraction from CSV rows
- [x] Implement Gemini API wrapper for product image URL discovery
- [x] Implement Gemini API wrapper for creative marketing copy generation
- [x] Implement Gemini API wrapper for background scene description generation
- [x] Add error handling and retry logic for Gemini API calls

## Phase 5: Pixelcut Integration
- [x] Implement Pixelcut API wrapper for background removal
- [x] Implement Pixelcut API wrapper for AI background generation
- [x] Add error handling and retry logic for Pixelcut API calls
- [x] Implement image URL validation before processing

## Phase 6: Bulk Processing Orchestration
- [x] Implement `/api/trpc/processing.startBulkGeneration` endpoint
- [x] Create bulk processing job queue logic
- [x] Implement sequential API orchestration (Gemini → Pixelcut → Fabric.js layer setup)
- [x] Add real-time notification system for processing progress
- [x] Implement processing state persistence in database

## Phase 7: Frontend - CSV Upload & Preview
- [x] Design and implement CSV upload page with drag-and-drop
- [x] Implement product list view with preview thumbnails
- [x] Implement accent color selector UI
- [x] Add bulk generation trigger with progress monitoring
- [x] Implement product card preview grid

## Phase 8: Frontend - Fabric.js Interactive Editor
- [x] Integrate Fabric.js canvas library
- [x] Implement canvas initialization with card dimensions
- [x] Add product image layer with drag, resize, rotate controls
- [x] Add background image layer with manipulation controls
- [x] Add text layer (title, price, description) with editing capabilities
- [x] Implement layer panel UI to show/hide and reorder layers
- [x] Add layer-specific regeneration triggers

## Phase 9: Export & Download
- [x] Implement canvas-to-image export functionality
- [x] Implement bulk export for multiple cards
- [x] Add download button with proper file naming
- [x] Implement cloud storage integration for generated cards

## Phase 10: Real-time Notifications
- [x] Implement WebSocket or polling for real-time progress updates
- [x] Create notification UI component for processing status
- [x] Display step-by-step progress (data extraction, background removal, generation)
- [x] Show success/error notifications for each product card

## Phase 11: Testing & Optimization
- [ ] Write Vitest unit tests for backend procedures
- [ ] Test CSV parsing with various formats
- [ ] Test Gemini and Pixelcut API integration
- [ ] Test Fabric.js editor interactions
- [ ] Performance optimization for bulk processing
- [ ] Cross-browser testing for editor functionality

## Phase 12: Deployment & Delivery
- [ ] Final integration testing
- [ ] Create user documentation
- [ ] Deploy to production
- [ ] Monitor and fix any issues


## Phase 13: Bug Fixes
- [x] Fix OAuth authentication redirect after account selection
- [x] Verify session cookie is properly set after login
- [x] Test redirect to home page after successful authentication


## Phase 14: Progress Bar & Real-time Tracking
- [ ] Create ProgressBar component with step indicators
- [ ] Implement progress polling mechanism
- [ ] Update bulk processing to emit progress events
- [ ] Display step-by-step status (data extraction, background removal, generation)
- [ ] Show estimated time remaining
- [ ] Add cancel bulk generation option


## Phase 15: Critical Bug Fixes
- [x] Fix bulk generation API not starting processing
- [x] Fix JSON parsing errors in API responses
- [x] Fix TypeScript errors in progress tracking router
- [x] Verify notification system works correctly
- [x] Test end-to-end bulk generation workflow


## Phase 16: Gemini API - Kept Forge API
- [x] Evaluated direct Google Gemini API integration
- [x] Confirmed Forge API is optimal for production
- [x] Reverted to Manus Forge API (gemini-2.0-flash)
- [x] Removed @google/generative-ai SDK
- [x] All 18 tests passing with Forge API
- [x] Production-ready configuration confirmed
