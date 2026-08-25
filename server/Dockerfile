# Debian, not Alpine: onnxruntime-node ships prebuilt binaries linked against
# glibc. On Alpine (musl) the embedding model fails to load with ERR_DLOPEN_FAILED
# looking for ld-linux-x86-64.so.2, and there is no prebuilt musl variant.
FROM node:22-slim

WORKDIR /app

# Copy dependency manifests first for better Docker layer caching
COPY package*.json ./

# Install runtime dependencies, then strip the parts of onnxruntime-node this
# server can never use. The package ships 513 MB of binaries for every platform
# and accelerator; on a CPU-only Linux host only linux/x64 is reachable, and the
# CUDA provider alone is 302 MB of it. The cleanup must run in the same layer as
# the install, otherwise the deleted files stay in the previous layer and the
# image does not actually shrink.
RUN npm ci --omit=dev \
    && ORT=node_modules/onnxruntime-node/bin/napi-v6 \
    && rm -rf "$ORT/darwin" "$ORT/win32" "$ORT/linux/arm64" \
    && rm -f "$ORT/linux/x64/libonnxruntime_providers_cuda.so" \
             "$ORT/linux/x64/libonnxruntime_providers_tensorrt.so" \
    && npm cache clean --force

# Download the embedding model weights into the image.
# Without this the first user request would trigger a 130 MB download, and a
# server without outbound network access would have no working retrieval at all.
COPY utils/embeddings.js ./utils/embeddings.js
RUN node -e "import('./utils/embeddings.js').then(m => m.warmUpEmbeddings())"

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
