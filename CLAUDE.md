# Phaser 2D Solid Snake - Development Guide

## Build Commands
- `npm run dev` - Run development server with logging
- `npm run dev-nolog` - Run development server without logging
- `npm run build` - Build production version with logging
- `npm run build-nolog` - Build production version without logging

## Code Style Guidelines
- **Imports**: ES6 module imports with named exports
- **Naming**: PascalCase for classes, camelCase for methods/variables
- **Formatting**: 4-space indentation
- **Comments**: Document complex functions with comments
- **Classes**: Extend Phaser.Scene for scene classes
- **Error Handling**: Use try/catch for async operations

## Framework
- Built with Phaser 3 (v3.88.2)
- Uses Vite as build tool
- Phaser3-Rex-Plugins for UI components

## Project Organization
- `src/scenes/` - Game scenes (MainMenu, Game, etc.)
- `src/entities/` - Game entities and AI
- `src/utils/` - Utility functions
- `public/assets/` - Game assets (images, sounds, tilemaps)