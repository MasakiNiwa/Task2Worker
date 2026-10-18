import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, expect, it } from 'vitest';
import { theme } from './app/theme';
import { App } from './App';

describe('App', () => {
  it('renders header with color-scheme toggle and help, without GitHub icon', async () => {
    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <App />
      </MantineProvider>,
    );
    expect(screen.getByLabelText('ダークモード切り替え')).toBeInTheDocument();
    expect(screen.getByLabelText('ヘルプ')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'ダッシュボード' })).toBeInTheDocument();
  });
});
