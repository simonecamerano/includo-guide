/**
 * SESSION RETENTION TESTS
 * Verifies that the declared 30 day lifetime is actually applied, not just
 * configured. A session is written to disk with a stale timestamp before the
 * server loads it, which is the only way to exercise the path a real restart
 * takes: load from disk, then serve a request for an id that has expired.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const SESSIONS_DIR = fs.mkdtempSync( path.join( os.tmpdir(), 'includo-retention-test-' ) );
const DAY = 1000 * 60 * 60 * 24;

// Written before server.js is imported, so it is there when sessions are loaded.
fs.writeFileSync( path.join( SESSIONS_DIR, 'sessions.json' ), JSON.stringify( {
  fresh_session: {
    history: [{ role: 'user', content: 'domanda recente' }],
    updatedAt: Date.now() - ( 2 * DAY )
  },
  expired_session: {
    history: [{ role: 'user', content: 'domanda vecchia' }],
    updatedAt: Date.now() - ( 45 * DAY )
  },
  undated_session: {
    history: [{ role: 'user', content: 'senza data' }]
  },
  legacy_with_system: {
    history: [
      { role: 'system', content: '# RUOLO vecchio prompt di sistema' },
      { role: 'user', content: 'domanda di una sessione vecchio formato' }
    ],
    updatedAt: Date.now() - ( 1 * DAY )
  }
} ) );

process.env.SESSIONS_DIR = SESSIONS_DIR;
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.EMBEDDINGS_BACKEND = 'mock';

const { app } = await import( './server.js' );

describe( 'Session retention', () => {

  it( 'keeps a session that is still inside the 30 day window', async () => {
    const res = await request( app ).get( '/api/history/fresh_session' );
    expect( res.status ).toBe( 200 );
    expect( res.body.history ).toHaveLength( 1 );
  } );

  it( 'does not serve a session older than the TTL, even right after a restart', async () => {
    const res = await request( app ).get( '/api/history/expired_session' );
    expect( res.status ).toBe( 200 );
    expect( res.body.history ).toEqual( [] );
  } );

  it( 'does not revive an expired session by reading it twice', async () => {
    await request( app ).get( '/api/history/expired_session' );
    const second = await request( app ).get( '/api/history/expired_session' );
    expect( second.body.history ).toEqual( [] );
  } );

  it( 'drops a session with no timestamp instead of keeping it forever', async () => {
    const res = await request( app ).get( '/api/history/undated_session' );
    expect( res.body.history ).toEqual( [] );
  } );

  it( 'strips the system prompt from a session written before the provider change', async () => {
    const res = await request( app ).get( '/api/history/legacy_with_system' );
    expect( res.body.history ).toHaveLength( 1 );
    expect( res.body.history[0].role ).toBe( 'user' );
    expect( res.body.history.every( m => m.role !== 'system' ) ).toBe( true );
  } );

  it( 'removes expired entries from the file it persists', async () => {
    // Any write persists the pruned store
    await request( app ).post( '/api/reset' ).send( { sessionId: 'fresh_session' } );

    const onDisk = JSON.parse( fs.readFileSync( path.join( SESSIONS_DIR, 'sessions.json' ), 'utf8' ) );
    expect( onDisk ).not.toHaveProperty( 'expired_session' );
    expect( onDisk ).not.toHaveProperty( 'undated_session' );
  } );

} );
