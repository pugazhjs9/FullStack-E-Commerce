import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

// ─── Helper: a component that throws on demand ────────────────────────────────

function BrokenComponent({ shouldThrow = false }) {
    if (shouldThrow) {
        throw new Error('Intentional test error');
    }
    return <div>Normal content</div>;
}

// Suppress expected console.error output during error boundary tests
const originalConsoleError = console.error;
beforeEach(() => {
    console.error = vi.fn();
});
afterEach(() => {
    console.error = originalConsoleError;
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ErrorBoundary', () => {
    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <BrokenComponent shouldThrow={false} />
            </ErrorBoundary>,
        );

        expect(screen.getByText('Normal content')).toBeInTheDocument();
    });

    it('renders fallback UI when a child component throws', () => {
        render(
            <ErrorBoundary>
                <BrokenComponent shouldThrow={true} />
            </ErrorBoundary>,
        );

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
        render(
            <ErrorBoundary fallback={<div>Custom fallback</div>}>
                <BrokenComponent shouldThrow={true} />
            </ErrorBoundary>,
        );

        expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    });

    it('shows Try Again and Reload Page buttons in default fallback', () => {
        render(
            <ErrorBoundary>
                <BrokenComponent shouldThrow={true} />
            </ErrorBoundary>,
        );

        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
    });

    it('logs the error via console.error', () => {
        render(
            <ErrorBoundary>
                <BrokenComponent shouldThrow={true} />
            </ErrorBoundary>,
        );

        expect(console.error).toHaveBeenCalled();
    });
});
