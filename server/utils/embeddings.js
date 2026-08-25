/**
 * LOCAL EMBEDDINGS ENGINE
 * Generates vector embeddings entirely on this server, with no external API call.
 *
 * The model runs through ONNX Runtime inside the Node process: the text of a user
 * question never leaves the machine that serves the application. This is the reason
 * the RAG architecture could stay intact instead of being removed.
 *
 * Model: multilingual-e5-small (384 dimensions, quantized). It is trained for
 * asymmetric retrieval, so queries and indexed documents must be prefixed
 * differently ("query:" vs "passage:") or the scores degrade.
 */

import { env, pipeline } from '@huggingface/transformers';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

/** Hugging Face model id. Weights are baked into the image at build time. */
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'Xenova/multilingual-e5-small';

/** Quantized weights: 113 MB on disk instead of ~450 MB, same retrieval quality on this catalog. */
const EMBEDDING_DTYPE = process.env.EMBEDDING_DTYPE || 'q8';

/** Vector length produced by the model. The vector store must be rebuilt if this changes. */
export const EMBEDDING_DIMENSIONS = 384;

/**
 * Where the model weights live. Defaults to a stable directory next to the code
 * rather than the library default inside node_modules, which a reinstall wipes.
 */
env.cacheDir = process.env.EMBEDDING_CACHE_DIR || path.join( __dirname, '../.models' );

/** Never reach the network at request time: the weights are expected to be already present. */
env.allowRemoteModels = process.env.EMBEDDING_ALLOW_DOWNLOAD !== '0';

/**
 * Deterministic stand-in used by the unit tests, enabled only by an explicit
 * EMBEDDINGS_BACKEND=mock. It is never selected implicitly: a missing model must
 * fail loudly instead of silently degrading retrieval to noise.
 */
const isMockBackend = () => process.env.EMBEDDINGS_BACKEND === 'mock';

/** Cached pipeline instance, plus the in-flight promise so concurrent requests share one load. */
let extractorPromise = null;

/**
 * Loads the feature-extraction pipeline once and reuses it.
 * @returns {Promise<Function>} The transformers.js pipeline.
 */
const getExtractor = () => {
    if ( !extractorPromise ) {
        extractorPromise = pipeline( 'feature-extraction', EMBEDDING_MODEL, { dtype: EMBEDDING_DTYPE } );
    }
    return extractorPromise;
};

/**
 * WARM UP
 * Loads the model ahead of the first request. Called at server startup so the
 * first user does not pay the few seconds the initial load costs.
 * @returns {Promise<void>}
 */
export const warmUpEmbeddings = async () => {
    if ( isMockBackend() ) return;
    const started = Date.now();
    await getExtractor();
    console.log( `🧠 Embedding model ready (${EMBEDDING_MODEL}, ${Date.now() - started}ms)` );
};

/**
 * EMBED TEXT
 * Converts a string into a normalized vector.
 * @param {string} text - The input text.
 * @param {'query'|'passage'} [kind='query'] - Whether the text is a search query
 *   or a document being indexed. The model expects a different prefix for each.
 * @returns {Promise<Array<number>>} A 384-dimensional unit vector.
 */
export const embedText = async ( text, kind = 'query' ) => {
    const input = typeof text === 'string' ? text.trim() : '';
    if ( input.length === 0 ) {
        throw new Error( 'embedText: empty input' );
    }

    if ( isMockBackend() ) {
        const seed = input.split( '' ).reduce( ( acc, char ) => acc + char.charCodeAt( 0 ), 0 );
        return Array( EMBEDDING_DIMENSIONS ).fill( 0 ).map( ( _, i ) => Math.sin( seed + i ) / 2 + 0.5 );
    }

    const prefix = kind === 'passage' ? 'passage: ' : 'query: ';
    const extractor = await getExtractor();
    const output = await extractor( `${prefix}${input}`, { pooling: 'mean', normalize: true } );
    return Array.from( output.data );
};
