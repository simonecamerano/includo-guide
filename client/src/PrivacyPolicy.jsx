/**
 * PRIVACY POLICY
 * Informativa sul trattamento dei dati personali.
 *
 * Ogni affermazione di questa pagina e' stata verificata sul codice e sul server
 * in produzione. Se l'applicazione cambia, questa pagina va cambiata con lei:
 * un'informativa che dichiara cose non vere e' peggio di un'informativa assente,
 * perche' promette una tutela che non c'e'.
 */

import { useEffect } from 'react';

const LAST_UPDATED = '25 agosto 2026';

function PrivacyPolicy() {
  // La pagina e' servita dallo stesso index.html della chat, che porta il titolo
  // della chat: senza questo, la scheda del browser direbbe la cosa sbagliata.
  useEffect( () => {
    document.title = 'Informativa privacy | IncluDO Guide';
  }, [] );

  return (
    <div className="legal-page">
      <header className="legal-header">
        <a className="legal-back" href="/">← Torna alla conversazione</a>
        <h1>Informativa sul trattamento dei dati personali</h1>
        <p className="legal-updated">Ultimo aggiornamento: { LAST_UPDATED }</p>
      </header>

      <main className="legal-content">

        <section>
          <h2>In breve</h2>
          <ul>
            <li>Non serve registrarsi e non ti chiediamo il nome, l'email o il telefono.</li>
            <li>Il testo di quello che scrivi viene inviato ad <strong>Anthropic</strong>, il fornitore
              che genera le risposte. È l'unico soggetto esterno coinvolto.</li>
            <li>La ricerca dei corsi nel catalogo avviene <strong>interamente su questo server</strong>:
              per quella operazione niente esce da qui.</li>
            <li>Le conversazioni vengono cancellate dopo <strong>30 giorni</strong> dall'ultimo messaggio,
              e puoi cancellare subito la tua con il pulsante "Nuova Chat".</li>
            <li>Non ci sono cookie di profilazione e non c'è nessuno strumento di statistica o
              tracciamento.</li>
          </ul>
        </section>

        <section>
          <h2>1. Che cos'è questa applicazione</h2>
          <p>
            IncluDO Guide è un'<strong>applicazione dimostrativa</strong>: è stata realizzata per mostrare
            competenze tecniche di sviluppo software e di integrazione con sistemi di intelligenza
            artificiale, ed è pubblicata online perché possa essere provata. Il catalogo dei corsi che
            l'assistente consulta è un catalogo di esempio, costruito per la dimostrazione: non
            corrisponde a corsi realmente attivi e le indicazioni che ricevi non sono un servizio di
            orientamento professionale su cui prendere decisioni.
          </p>
          <p>
            L'applicazione è gratuita, non vende nulla, non ha inserzioni e non contatta nessuno.
          </p>
        </section>

        <section>
          <h2>2. Titolare del trattamento</h2>
          <p>
            <strong>Simone Camerano</strong><br />
            Email: <a href="mailto:info@simonecamerano.dev">info@simonecamerano.dev</a>
          </p>
        </section>

        <section>
          <h2>3. Stai parlando con un sistema di intelligenza artificiale</h2>
          <p>
            Le risposte che leggi sono generate da un modello linguistico, non scritte da una persona.
            Nessun essere umano legge le tue conversazioni per rispondere. Come tutti i sistemi di
            questo tipo, il modello <strong>può sbagliare</strong>: può indicare orari, durate o
            requisiti inesatti, o presentare come certo qualcosa che non lo è.
          </p>
          <p>
            Questa informazione ti è dovuta ai sensi dell'articolo 50 del Regolamento (UE) 2024/1689
            sull'intelligenza artificiale.
          </p>
        </section>

        <section>
          <h2>4. Quali dati vengono trattati</h2>
          <ul>
            <li>
              <strong>Il testo dei messaggi che scrivi.</strong> Non ti chiediamo dati personali e
              l'assistente ha l'istruzione esplicita di non chiederteli, né di chiederti informazioni
              su disabilità, condizioni di salute o situazioni familiari. Se scegli tu di scrivere un
              dato personale in un messaggio, quel dato verrà trattato come parte della conversazione:
              per ricevere un consiglio sui corsi non serve, quindi ti chiediamo di non farlo.
            </li>
            <li>
              <strong>Un identificativo di sessione.</strong> Un codice casuale, salvato nella memoria
              locale del tuo browser con il nome <code>includo_sid</code>, che serve solo a farti
              ritrovare la tua conversazione se ricarichi la pagina. Non contiene nulla di te, non è
              collegato alla tua identità e non viene condiviso con nessuno. Non è un cookie di
              profilazione: senza di esso l'applicazione non potrebbe funzionare.
            </li>
            <li>
              <strong>Il tuo indirizzo IP.</strong> È tecnicamente indispensabile perché il server
              possa risponderti, quindi il server lo vede nel momento della richiesta. <strong>Non
              viene conservato</strong>: non è attivo nessun registro degli accessi, e l'unico uso è
              un conteggio temporaneo in memoria che protegge la funzione riservata di aggiornamento
              del catalogo dagli abusi.
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Perché e con quale base giuridica</h2>
          <p>
            La finalità è una sola: rispondere alla richiesta di orientamento che fai quando invii un
            messaggio, e mantenere il filo della conversazione mentre la usi. Non c'è nessuna
            profilazione, nessuna decisione automatizzata sul tuo conto, nessuna finalità commerciale
            e nessun uso dei tuoi messaggi per addestrare modelli.
          </p>
          <p>
            La base giuridica è l'<strong>esecuzione del servizio che richiedi</strong> inviando un
            messaggio (articolo 6, paragrafo 1, lettera b, del Regolamento UE 2016/679): senza trattare
            il testo che scrivi, l'applicazione non può risponderti.
          </p>
        </section>

        <section>
          <h2>6. Chi altro vede questi dati</h2>
          <p>
            Due soggetti, e nessun altro. Entrambi trattano i dati come responsabili del trattamento,
            per conto del titolare e secondo le sue istruzioni.
          </p>
          <ul>
            <li>
              <strong>Anthropic</strong> (Anthropic PBC, Stati Uniti), che genera le risposte. Riceve il
              testo dei messaggi della conversazione in corso. È l'unico soggetto a cui il contenuto di
              quello che scrivi viene trasmesso. Essendo una società statunitense, il trasferimento fuori
              dall'Unione Europea si fonda sulle clausole contrattuali standard approvate dalla
              Commissione Europea (articolo 46 del Regolamento). I messaggi inviati tramite l'interfaccia
              di programmazione non vengono usati per addestrare i modelli; la conservazione lato
              fornitore segue le condizioni contrattuali del servizio.
            </li>
            <li>
              <strong>Hetzner</strong> (Hetzner Online GmbH, Germania), che fornisce il server su cui
              girano sia le pagine che stai leggendo sia l'applicazione. I dati restano in Germania,
              quindi all'interno dell'Unione Europea.
            </li>
          </ul>
          <p>
            Nessun altro servizio esterno è coinvolto: le pagine, gli stili, i caratteri tipografici e
            le immagini arrivano tutti da questo stesso server. Non ci sono contenuti incorporati da
            terze parti, né strumenti di statistica, né social network.
          </p>
        </section>

        <section>
          <h2>7. La ricerca dei corsi non esce da questo server</h2>
          <p>
            Quando l'assistente cerca i corsi adatti al tuo profilo, la ricerca semantica viene calcolata
            da un modello che gira <strong>dentro questo stesso server</strong>. Per quell'operazione non
            viene fatta nessuna chiamata verso l'esterno e nessun fornitore riceve il termine cercato.
          </p>
          <p>
            È una scelta presa proprio per questa applicazione: le domande che si fanno a una guida
            sull'inclusione possono rivelare da sole una condizione personale, propria o di un familiare,
            e ridurre il numero di soggetti che le vedono è il modo più diretto di proteggerle.
          </p>
        </section>

        <section>
          <h2>8. Per quanto tempo</h2>
          <p>
            Le conversazioni sono conservate sul server per <strong>30 giorni</strong> a partire
            dall'ultimo messaggio, dopodiché vengono cancellate automaticamente. Una conversazione
            scaduta non viene più mostrata né riattivata.
          </p>
          <p>
            Vanno inoltre perse a ogni aggiornamento dell'applicazione: non sono salvate su un disco
            permanente, quindi in pratica la durata effettiva è spesso molto più breve di 30 giorni.
          </p>
          <p>
            L'identificativo di sessione resta nel tuo browser fino a quando non lo cancelli, con il
            pulsante "Nuova Chat" o svuotando i dati del sito dalle impostazioni del browser.
          </p>
        </section>

        <section>
          <h2>9. I tuoi diritti</h2>
          <p>
            Puoi chiedere in ogni momento di accedere ai dati che ti riguardano, di correggerli, di
            cancellarli, di limitarne il trattamento, di riceverli in formato leggibile e di opporti al
            trattamento. Scrivi a <a href="mailto:info@simonecamerano.dev">info@simonecamerano.dev</a>.
          </p>
          <p>
            La cancellazione puoi però ottenerla anche <strong>subito e da solo</strong>: il pulsante
            "Nuova Chat" elimina la conversazione dal server, non solo dallo schermo.
          </p>
          <p>
            Una precisazione onesta sull'accesso: le conversazioni non sono collegate alla tua identità,
            ma soltanto a un codice casuale generato dal tuo browser. Se ci scrivi senza indicare quel
            codice, non abbiamo modo di sapere quale conversazione sia la tua, e questo ci impedisce di
            darti i dati di qualcun altro per errore.
          </p>
        </section>

        <section>
          <h2>10. Reclamo all'autorità di controllo</h2>
          <p>
            Se ritieni che i tuoi dati non siano trattati correttamente, puoi rivolgerti al{ ' ' }
            <strong>Garante per la protezione dei dati personali</strong>{ ' ' }
            (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">garanteprivacy.it</a>){ ' ' }
            oppure all'autorità di controllo del Paese in cui vivi.
          </p>
        </section>

        <section>
          <h2>11. Minori</h2>
          <p>
            L'applicazione invia il testo dei messaggi a un fornitore di intelligenza artificiale i cui
            termini richiedono la maggiore età, quindi non è destinata a chi ha meno di 18 anni.
          </p>
        </section>

      </main>

      <footer className="legal-footer">
        <a href="/">← Torna alla conversazione</a>
      </footer>
    </div>
  );
}

export default PrivacyPolicy;
