import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@/hooks/useUIStore';

describe('useUIStore', () => {
    beforeEach(() => {
        useUIStore.setState({
            isCommandPaletteOpen: false,
            initialCommandId: null,
            initialParams: {},
            isSidebarOpen: false,
        });
    });

    describe('command palette', () => {
        it('opens command palette', () => {
            useUIStore.getState().openCommandPalette();
            expect(useUIStore.getState().isCommandPaletteOpen).toBe(true);
        });

        it('opens command palette with initial command', () => {
            useUIStore.getState().openCommandPalette('search', { q: 'test' });
            expect(useUIStore.getState().isCommandPaletteOpen).toBe(true);
            expect(useUIStore.getState().initialCommandId).toBe('search');
            expect(useUIStore.getState().initialParams).toEqual({ q: 'test' });
        });

        it('closes command palette and clears state', () => {
            useUIStore.getState().openCommandPalette('search', { q: 'test' });
            useUIStore.getState().closeCommandPalette();
            expect(useUIStore.getState().isCommandPaletteOpen).toBe(false);
            expect(useUIStore.getState().initialCommandId).toBeNull();
            expect(useUIStore.getState().initialParams).toEqual({});
        });
    });

    describe('sidebar', () => {
        it('opens sidebar', () => {
            useUIStore.getState().openSidebar();
            expect(useUIStore.getState().isSidebarOpen).toBe(true);
        });

        it('closes sidebar', () => {
            useUIStore.getState().openSidebar();
            useUIStore.getState().closeSidebar();
            expect(useUIStore.getState().isSidebarOpen).toBe(false);
        });

        it('sets sidebar open state directly', () => {
            useUIStore.getState().setSidebarOpen(true);
            expect(useUIStore.getState().isSidebarOpen).toBe(true);
            useUIStore.getState().setSidebarOpen(false);
            expect(useUIStore.getState().isSidebarOpen).toBe(false);
        });
    });
});
