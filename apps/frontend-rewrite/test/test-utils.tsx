import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {}

function AllTheProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function customRender(ui: ReactElement, options?: CustomRenderOptions) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from RTL
export * from '@testing-library/react';
export { customRender as render };
