FROM public.ecr.aws/lambda/nodejs:18

ARG CACHE_BUSTER

# Crie o diretório para o ffprobe (fora do LAMBDA_TASK_ROOT para organização)
RUN mkdir -p /opt/bin
COPY devops/tools/ffprobe /opt/bin/ffprobe
RUN chmod +x /opt/bin/ffprobe
ENV PATH="/opt/bin:${PATH}"

# Define o diretório de trabalho principal dentro do container para as operações de build
WORKDIR /app

# --- Etapas de Depuração ---
# Lista o conteúdo inicial de /app (deve estar vazio)
RUN echo "--- Conteúdo de /app antes de copiar arquivos ---" && ls -la /app
# --- Fim Etapas de Depuração ---

# Copia todos os arquivos necessários para o build para o WORKDIR
COPY package*.json ./
COPY tsconfig*.json ./
COPY src/ ./src/ # Copie o código-fonte para dentro do WORKDIR

# --- Etapas de Depuração ---
# Lista o conteúdo de /app após copiar os arquivos, para confirmar que src, package.json, etc. estão lá
RUN echo "--- Conteúdo de /app após copiar arquivos de origem ---" && ls -la /app
RUN echo "--- Conteúdo de /app/src/ ---" && ls -la /app/src/
# --- Fim Etapas de Depuração ---

# Instala as dependências (incluindo devDependencies para o build)
RUN npm install

# --- Etapas de Depuração ---
# Lista o conteúdo de /app/node_modules para confirmar que as dependências foram instaladas
RUN echo "--- Conteúdo de /app/node_modules ---" && ls -la /app/node_modules
# --- Fim Etapas de Depuração ---

# Executa o script de build para gerar o 'dist' dentro de /app
RUN npm run build

# --- Etapas de Depuração ---
# Lista o conteúdo de /app após o build, para confirmar que o diretório 'dist' foi criado
RUN echo "--- Conteúdo de /app após npm run build ---" && ls -la /app
RUN echo "--- Conteúdo de /app/dist/ ---" && ls -la /app/dist/
# --- Fim Etapas de Depuração ---

# Remove as devDependencies para reduzir o tamanho final da imagem
RUN npm prune --production

# --- Etapas de Depuração ---
# Lista o conteúdo de /app após o prune
RUN echo "--- Conteúdo de /app após npm prune --production ---" && ls -la /app
# --- Fim Etapas de Depuração ---

# Agora, copie o conteúdo compilado (do /app/dist) para o diretório de execução da Lambda
COPY dist/ ${LAMBDA_TASK_ROOT}/

# --- Etapas de Depuração ---
# Lista o conteúdo final de LAMBDA_TASK_ROOT para confirmar a cópia
RUN echo "--- Conteúdo final de ${LAMBDA_TASK_ROOT} ---" && ls -la ${LAMBDA_TASK_ROOT}
# --- Fim Etapas de Depuração ---

# Define o comando de execução para a Lambda
CMD ["index.handler"]