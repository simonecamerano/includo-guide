/**
 * TOOL CALLING CYCLE TESTS
 * Verifies the RAG round trip inside POST /api/chat: the model asks for a catalog
 * search, the server performs it locally, and the results go back in the shape the
 * Messages API requires before the synthesis turn.
 *
 * The AI bridge is mocked here rather than the SDK, because what is under test is
 * the orchestration in server.js, not the provider call.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const calls = [];

vi.mock( './utils/ai.js', async ( importOriginal ) => {
  const actual = await importOriginal();
  return {
    // Real implementations: these are pure readers of the message shape and are
    // exactly what the cycle depends on being correct.
    extractText: actual.extractText,
    extractToolUses: actual.extractToolUses,
    describeFailure: actual.describeFailure,
    generateEmbedding: vi.fn().mockResolvedValue( Array( 384 ).fill( 0.05 ) ),
    getChatResponse: vi.fn().mockImplementation( async ( params ) => {
      calls.push( params );
      // First turn: ask for the catalog search. Second turn: answer.
      if ( calls.length === 1 ) {
        return {
          stop_reason: 'tool_use',
          content: [
            { type: 'text', text: 'Cerco nel catalogo.' },
            {
              type: 'tool_use',
              id: 'toolu_probe_1',
              name: 'cerca_corsi',
              input: {
                search_query: 'restauro del legno in bottega',
                user_profile: {
                  area: 'Legno', level: 'Principiante', objective: 'Lavoro',
                  modality: 'Presenza', hours: 20
                }
              }
            }
          ]
        };
      }
      return {
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: '| Corso | Ore |\n| :--- | :--- |\n| Test | 20 |' }]
      };
    } )
  };
} );

process.env.ADMIN_INGEST_TOKEN = 'test-admin-token';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.EMBEDDINGS_BACKEND = 'mock';
// Own session directory: test files run in parallel and would otherwise race on
// the same sessions.json, which surfaces as an ENOENT on the atomic rename.
process.env.SESSIONS_DIR = fs.mkdtempSync( path.join( os.tmpdir(), 'includo-tools-test-' ) );

const { app } = await import( './server.js' );

describe( 'RAG tool calling cycle', () => {

  beforeEach( () => {
    calls.length = 0;
  } );

  it( 'performs the search and returns the synthesis, not the tool request', async () => {
    const res = await request( app )
      .post( '/api/chat' )
      .send( { message: 'voglio lavorare il legno', sessionId: 'tools_session_1' } );

    expect( res.status ).toBe( 200 );
    expect( calls ).toHaveLength( 2 );
    // The reply must be the synthesis, not the placeholder text of the tool turn
    expect( res.body.reply ).toContain( '| Corso | Ore |' );
  } );

  it( 'sends the tool result back with its tool_use_id, results before instructions', async () => {
    await request( app )
      .post( '/api/chat' )
      .send( { message: 'voglio lavorare il legno', sessionId: 'tools_session_2' } );

    const secondTurn = calls[1].messages;
    const assistantTurn = secondTurn[secondTurn.length - 2];
    const resultTurn = secondTurn[secondTurn.length - 1];

    // The assistant turn carrying the tool_use block must be replayed verbatim,
    // otherwise the API rejects the tool result as unmatched.
    expect( assistantTurn.role ).toBe( 'assistant' );
    expect( assistantTurn.content.some( b => b.type === 'tool_use' ) ).toBe( true );

    expect( resultTurn.role ).toBe( 'user' );
    expect( resultTurn.content[0].type ).toBe( 'tool_result' );
    expect( resultTurn.content[0].tool_use_id ).toBe( 'toolu_probe_1' );
    // Instructions come after the results, never before
    expect( resultTurn.content[1].type ).toBe( 'text' );
    expect( resultTurn.content[1].text ).toContain( '# ISTRUZIONI DI OUTPUT' );

    // Real courses reached the model, not an empty catalog
    const matches = JSON.parse( resultTurn.content[0].content );
    expect( Array.isArray( matches ) ).toBe( true );
    expect( matches.length ).toBeGreaterThan( 0 );
    expect( matches[0] ).toHaveProperty( 'title' );
  } );

  it( 'persists only readable turns, no tool bookkeeping and no system prompt', async () => {
    await request( app )
      .post( '/api/chat' )
      .send( { message: 'voglio lavorare il legno', sessionId: 'tools_session_3' } );

    const res = await request( app ).get( '/api/history/tools_session_3' );

    expect( res.status ).toBe( 200 );
    expect( res.body.history ).toHaveLength( 2 );
    expect( res.body.history[0] ).toEqual( { role: 'user', content: 'voglio lavorare il legno' } );
    expect( res.body.history[1].role ).toBe( 'assistant' );
    expect( res.body.history.every( m => typeof m.content === 'string' ) ).toBe( true );
  } );

  it( 'sends the system prompt as a parameter, never as a message', async () => {
    await request( app )
      .post( '/api/chat' )
      .send( { message: 'ciao', sessionId: 'tools_session_4' } );

    expect( calls[0].system ).toContain( '# RUOLO' );
    expect( calls[0].messages.every( m => m.role !== 'system' ) ).toBe( true );
  } );

} );
