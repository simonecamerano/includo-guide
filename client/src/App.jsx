import axios from 'axios';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { Bot, Loader2, RotateCcw, Send, Sparkles, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Backend API base URL.
 *
 * In the built application the API answers on the same origin that served the
 * page, so a relative path is enough and no cross-origin request is made. In
 * local development Vite serves the client on its own port, so the full address
 * of the backend is used instead. VITE_API_BASE overrides both.
 */
const API_BASE = import.meta.env.VITE_API_BASE
  || ( import.meta.env.PROD ? '/api' : 'http://localhost:3001/api' );

/**
 * MAIN COMPONENT: IncluDO Chatbot Interface
 * Handles state management for conversation history, session persistence, 
 * and communication with the orientation AI.
 */
function App() {
  // --- STATE MANAGEMENT ---
  
  /** Current conversation messages array. */
  const [messages, setMessages] = useState( [] );
  
  /** Current text input value from the user. */
  const [input, setInput] = useState( '' );
  
  /** Loading state for AI response simulation. */
  const [isLoading, setIsLoading] = useState( false );
  
  /** Controls the visibility of the reset confirmation modal. */
  const [showResetModal, setShowResetModal] = useState( false );

  /** 
   * Unified Session ID. 
   * Retrieves an existing ID from localStorage or generates a new one.
   * This ensures the chat history persists even if the browser is refreshed.
   */
  const [sessionId] = useState( () => {
    const saved = localStorage.getItem( 'includo_sid' );
    if ( saved ) return saved;
    const newId = ( window.crypto && window.crypto.randomUUID )
      ? `sid_${window.crypto.randomUUID()}`
      : `sid_${Date.now()}_${Math.random().toString( 36 ).slice( 2, 10 )}`;
    localStorage.setItem( 'includo_sid', newId );
    return newId;
  } );

  /** References for auto-scrolling and input focus management. */
  const scrollRef = useRef( null );
  const inputRef = useRef( null );

  // --- SIDE EFFECTS (Hooks) ---

  /** 
   * Auto-scroll: Triggered whenever messages change or loading state toggles.
   * Keeps the latest message visible in the viewport.
   */
  useEffect( () => {
    if ( scrollRef.current ) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading] );

  /** 
   * Auto-focus: Ensures the input field is focused after an AI response is received.
   */
  useEffect( () => {
    if ( !isLoading && inputRef.current ) {
      inputRef.current.focus();
    }
  }, [isLoading] );

  /** 
   * Initialization: Fetches the chat history for the current sessionId from the server.
   * If no history exists, pushes a default assistant welcome message.
   */
  useEffect( () => {
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get( `${API_BASE}/history/${sessionId}` );
        if ( data.history && data.history.length > 0 ) {
          setMessages( data.history );
        } else {
          setMessages( [{
            role: 'assistant',
            content: "Ciao! Benvenuto in IncluDO Guide. Sono un **sistema di intelligenza artificiale**, non una persona, e posso sbagliare: verifica sempre le informazioni importanti. Sono qui per aiutarti a scoprire il tuo talento artigianale. Le nostre aree di eccellenza sono: **Legno, Tessuti, Ceramica, Pelle e Natura**. Dimmi pure: quale di queste ti piacerebbe esplorare?"
          }] );
        }
      } catch ( err ) {
        console.error( "History fetch failed:", err );
      }
    };
    fetchHistory();
  }, [sessionId] );

  // --- EVENT HANDLERS ---

  /** 
   * Resets the current chat session both locally and on the server.
   * Clears the UI history and requests a session deletion via API.
   */
  const resetChat = async () => {
    try {
      await axios.post( `${API_BASE}/reset`, { sessionId } );
      setMessages( [{
        role: 'assistant',
        content: "Reset completato, la conversazione precedente è stata eliminata dal server. Ricomincio da zero, sempre come **sistema di intelligenza artificiale**. Le nostre aree sono: **Legno, Tessuti, Ceramica, Pelle e Natura**. Quale ti incuriosisce di più?"
      }] );
      setShowResetModal( false );
    } catch ( err ) {
      console.error( "Reset failed:", err );
    }
  };

  /** 
   * Sends a user message to the backend and handles the AI synthesis response.
   * @param {Event} e - Submit event.
   */
  const sendMessage = async ( e ) => {
    e.preventDefault();
    if ( !input.trim() || isLoading ) return;

    const userMsg = { role: 'user', content: input };
    setMessages( prev => [...prev, userMsg] );
    setInput( '' );
    setIsLoading( true );

    try {
      const { data } = await axios.post( `${API_BASE}/chat`, {
        message: input,
        sessionId: sessionId
      } );
      setMessages( prev => [...prev, { role: 'assistant', content: data.reply }] );
    } catch ( err ) {
      console.error( "Chat error:", err );
      // Use the reason the server gave, when it gave one: it distinguishes a rate
      // limit from a misconfiguration from a network failure, and "riprova" is not
      // useful advice for all three.
      const serverMessage = err.response?.data?.error;
      setMessages( prev => [...prev, {
        role: 'assistant',
        content: serverMessage || "Errore di connessione. Riprova!"
      }] );
    } finally {
      setIsLoading( false );
    }
  };

  return (
    <div className="app-container">
      <header role="banner">
        <div className="header-container">
          <div className="title-group">
            <h1>Inclu<span>DO</span> Guide</h1>
            <p className="tagline">Tradizione artigiana, opportunità sociale.</p>
          </div>
          <button
            className="reset-chat-btn"
            onClick={ () => setShowResetModal( true ) }
            aria-label="Nuova conversazione"
          >
            <RotateCcw size={ 16 } aria-hidden="true" /> Nuova Chat
          </button>
        </div>
        {/* Dichiarazione di trasparenza richiesta dall'art. 50 del Regolamento UE
            2024/1689: chi usa l'applicazione deve sapere, senza doverlo dedurre,
            che sta interagendo con un sistema di intelligenza artificiale. */}
        <p className="ai-disclosure">
          <Bot size={ 14 } aria-hidden="true" />
          <span>
            Stai parlando con un <strong>sistema di intelligenza artificiale</strong>, non con una
            persona. Le risposte possono contenere errori.{ ' ' }
            <a href="/privacy">Come trattiamo i tuoi dati</a>
          </span>
        </p>
      </header>

      <main className="chat-window" role="log" aria-live="polite">
        <div className="messages-area" ref={ scrollRef }>
          <AnimatePresence>
            { messages.map( ( msg, idx ) => (
              <Motion.div
                key={ idx }
                initial={ { opacity: 0, y: 15 } }
                animate={ { opacity: 1, y: 0 } }
                className={ `message ${msg.role === 'user' ? 'user' : 'bot'}` }
                role="article"
                aria-label={ msg.role === 'user' ? "Messaggio inviato da te" : "Risposta di IncluDO Guide" }
              >
                <div className="sender-info" aria-hidden="true">
                  { msg.role === 'user' ? <User size={ 14 } /> : <Sparkles size={ 14 } /> }
                  <span>{ msg.role === 'user' ? 'Tu' : 'IncluDO Guide' }</span>
                </div>
                <div className="bubble">
                  <ReactMarkdown remarkPlugins={ [remarkGfm] }>
                    { msg.content }
                  </ReactMarkdown>
                </div>
              </Motion.div>
            ) ) }
          </AnimatePresence>
          { isLoading && (
            <div className="message bot loading" role="status" aria-label="Caricamento risposta">
              <div className="bubble">
                <Loader2 className="animate-spin" size={ 20 } />
              </div>
            </div>
          ) }
        </div>

        {/* --- INPUT AREA --- */}
        <form className="input-area" onSubmit={ sendMessage } role="search">
          <input
            ref={ inputRef }
            className="chat-input"
            type="text"
            placeholder={ isLoading ? "Sto elaborando i tuoi dati..." : "Scrivi qui il tuo messaggio..." }
            value={ input }
            onChange={ ( e ) => setInput( e.target.value ) }
            disabled={ isLoading }
            aria-label="Digita il tuo messaggio"
          />
          <button
            className="send-btn"
            type="submit"
            disabled={ !input.trim() || isLoading }
            aria-label="Invia messaggio"
          >
            <Send size={ 18 } aria-hidden="true" />
          </button>
        </form>
      </main>

      {/* --- RESET CONFIRMATION MODAL --- */}
      <AnimatePresence>
        { showResetModal && (
          <Motion.div
            className="modal-overlay"
            initial={ { opacity: 0 } }
            animate={ { opacity: 1 } }
            exit={ { opacity: 0 } }
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
          >
            <Motion.div
              className="modal-content"
              initial={ { scale: 0.9, opacity: 0 } }
              animate={ { scale: 1, opacity: 1 } }
              exit={ { scale: 0.9, opacity: 0 } }
            >
              <h2 id="modal-title">Nuova Conversazione</h2>
              <p id="modal-description">Stai per azzerare la chat. Tutte le tue preferenze salvate verranno eliminate. Vuoi continuare?</p>
              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={ () => setShowResetModal( false ) }
                >
                  Indietro
                </button>
                <button
                  className="confirm-btn"
                  onClick={ resetChat }
                >
                  Conferma Reset
                </button>
              </div>
            </Motion.div>
          </Motion.div>
        ) }
      </AnimatePresence>
    </div>
  );
}

export default App;
