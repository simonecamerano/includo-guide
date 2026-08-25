/**
 * FRONTEND INTEGRATION TESTS
 * This suite verifies the core UI components and interaction flows
 * of the IncluDO guide using React Testing Library and Vitest.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

/**
 * Helper to render the App and wait for the initial welcome message.
 */
const renderApp = async () => {
  render( <App /> );
  await screen.findByText( /Le nostre aree di eccellenza sono/i );
};

// --- MOCKS ---

/**
 * MOCK AXIOS: Prevents real network requests during UI tests.
 * This ensures tests are fast and independent of the backend state.
 */
vi.mock( 'axios', () => {
  return {
    default: {
      get: vi.fn().mockResolvedValue( { data: { history: [] } } ),
      post: vi.fn().mockResolvedValue( { data: { success: true } } ),
    }
  };
} );

/**
 * MOCK LOCALSTORAGE: Simulates browser persistence in JSDOM.
 * Necessary for testing Session ID stability across renders.
 */
Object.defineProperty( window, 'localStorage', {
  value: {
    getItem: vi.fn().mockReturnValue( null ),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true
} );

describe( 'IncluDO Frontend Integration & UX', () => {

  /**
   * Branding & Initial Render
   */
  it( 'renders the brand title and logo correctly', async () => {
    await renderApp();
    const titleElement = screen.getByRole( 'heading', { name: /IncluDO Guide/i } );
    expect( titleElement ).toBeInTheDocument();
    expect( screen.getByText( 'DO' ) ).toBeInTheDocument();
  } );

  /**
   * Content & Pedagogy
   * Verifies that the initial welcome message contains the correct vocational categories.
   */
  it( 'displays the welcome message with artisan categories', async () => {
    await renderApp();
    const welcome = screen.getByText( /Le nostre aree di eccellenza sono/i );
    expect( welcome ).toBeInTheDocument();

    const categories = screen.getByText( /Legno, Tessuti, Ceramica, Pelle e Natura/i );
    expect( categories ).toBeInTheDocument();
  } );

  /**
   * Accessibility (A11y)
   * Ensures the application follows semantic HTML patterns and ARIA roles.
   */
  it( 'has correct ARIA roles for screen reader accessibility', async () => {
    await renderApp();
    expect( screen.getByRole( 'banner' ) ).toBeInTheDocument();
    expect( screen.getByRole( 'log' ) ).toBeInTheDocument();
  } );

  /**
   * Interaction Logic (Chat Flow)
   * Verifies the full cycle of sending a message and receiving an AI reply in the UI.
   */
  it( 'sends a message and renders the assistant reply from the API', async () => {
    await renderApp();

    // Mock specific success response for this test case
    axios.post.mockResolvedValueOnce( { data: { reply: 'Risposta orientamento test' } } );

    const input = screen.getByRole( 'textbox' );
    fireEvent.change( input, { target: { value: 'Vorrei un corso da remoto' } } );
    fireEvent.click( screen.getByRole( 'button', { name: /Invia messaggio/i } ) );

    // Wait for the async state update and DOM rendering
    await waitFor( () => {
      expect( screen.getByText( 'Risposta orientamento test' ) ).toBeInTheDocument();
    } );
  } );

  /**
   * Error Handling (Resilience)
   */
  it( 'shows a fallback error bubble when the chat request fails', async () => {
    await renderApp();

    // Mock network failure
    axios.post.mockRejectedValueOnce( new Error( 'network down' ) );

    const input = screen.getByRole( 'textbox' );
    fireEvent.change( input, { target: { value: 'Messaggio che fallisce' } } );
    fireEvent.click( screen.getByRole( 'button', { name: /Invia messaggio/i } ) );

    await waitFor( () => {
      expect( screen.getByText( /Errore di connessione. Riprova!/i ) ).toBeInTheDocument();
    } );
  } );

  /**
   * Privacy: nothing is written to the device before the visitor asks for the
   * service. The session identifier belongs to a conversation, so it may only
   * appear once a conversation exists.
   */
  it( 'writes nothing to the device for a visitor who only opens the page', async () => {
    window.localStorage.setItem.mockClear();
    await renderApp();
    expect( window.localStorage.setItem ).not.toHaveBeenCalled();
  } );

  it( 'creates the session identifier only when the first message is sent', async () => {
    window.localStorage.setItem.mockClear();
    await renderApp();

    axios.post.mockResolvedValueOnce( { data: { reply: 'Prima risposta' } } );

    const input = screen.getByRole( 'textbox' );
    fireEvent.change( input, { target: { value: 'Primo messaggio' } } );
    fireEvent.click( screen.getByRole( 'button', { name: /Invia messaggio/i } ) );

    await waitFor( () => {
      expect( window.localStorage.setItem ).toHaveBeenCalledWith(
        'includo_sid',
        expect.stringMatching( /^sid_/ )
      );
    } );
  } );

} );
