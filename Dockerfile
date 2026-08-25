# Un solo container serve sia le pagine sia l'API, sullo stesso dominio:
# nessun servizio esterno consegna il sito ai visitatori e non serve CORS.
# Richiede Base Directory "/" sulla risorsa Coolify, non "/server".

# Fase 1: compila il frontend
FROM node:22-alpine AS frontend
WORKDIR /build
COPY client/package.json client/package-lock.json ./
# --include=dev serve perche' Coolify passa NODE_ENV=production come ARG anche in
# questa fase: senza il flag npm salta le devDependencies e vite non viene
# installato, quindi "npm run build" fallisce con "vite: not found".
RUN npm ci --include=dev
COPY client/ ./
RUN npm run build

# Fase 2: il backend, con il frontend compilato dentro public/
#
# Debian, non Alpine: onnxruntime-node ha binari precompilati solo per glibc. Su
# musl il modello di embedding non si carica e fallisce con ERR_DLOPEN_FAILED
# cercando ld-linux-x86-64.so.2, e non esiste una variante musl.
FROM node:22-slim
WORKDIR /app

COPY server/package.json server/package-lock.json ./

# Installa le dipendenze di runtime, poi rimuove le parti di onnxruntime-node che
# questo server non puo' usare. Il pacchetto porta 513 MB di binari per ogni
# piattaforma e acceleratore; su un host Linux senza GPU serve solo linux/x64, e
# il solo provider CUDA ne pesa 302. La pulizia deve stare nello stesso layer
# dell'install, altrimenti i file cancellati restano nel layer precedente e
# l'immagine non si riduce davvero.
RUN npm ci --omit=dev \
    && ORT=node_modules/onnxruntime-node/bin/napi-v6 \
    && rm -rf "$ORT/darwin" "$ORT/win32" "$ORT/linux/arm64" \
    && rm -f "$ORT/linux/x64/libonnxruntime_providers_cuda.so" \
             "$ORT/linux/x64/libonnxruntime_providers_tensorrt.so" \
    && npm cache clean --force

# Scarica i pesi del modello di embedding dentro l'immagine. Senza questo passo
# la prima richiesta di un visitatore scaricherebbe 130 MB, e un server senza
# accesso di rete in uscita non avrebbe nessun recupero funzionante.
COPY server/utils/embeddings.js ./utils/embeddings.js
RUN node -e "import('./utils/embeddings.js').then(m => m.warmUpEmbeddings())"

COPY server/ ./
COPY --from=frontend /build/dist ./public

EXPOSE 3001

CMD ["npm", "start"]
