FROM public.ecr.aws/lambda/nodejs:18

RUN mkdir -p /opt/bin

COPY devops/tools/ffprobe /opt/bin/ffprobe
RUN chmod +x /opt/bin/ffprobe

ENV PATH="/opt/bin:${PATH}"

COPY tsconfig.json ./
COPY tsconfig-build.json ./
COPY package*.json ./

RUN npm install

RUN npm run build

RUN npm prune --production

COPY dist/ ${LAMBDA_TASK_ROOT}/

CMD ["index.handler"]