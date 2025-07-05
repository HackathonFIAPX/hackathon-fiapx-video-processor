FROM public.ecr.aws/lambda/nodejs:18 AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./

COPY src/ ./src/

RUN npm install

RUN npm run build

FROM public.ecr.aws/lambda/nodejs:18

RUN mkdir -p /opt/bin
COPY devops/tools/ffprobe /opt/bin/ffprobe
RUN chmod +x /opt/bin/ffprobe
COPY devops/tools/ffmpeg /opt/bin/ffmpeg
RUN chmod +x /opt/bin/ffmpeg

ENV PATH="/opt/bin:${PATH}"

WORKDIR ${LAMBDA_TASK_ROOT}

COPY --from=builder /app/dist/ ./

COPY --from=builder /app/node_modules/ ./node_modules/

CMD ["index.handler"]