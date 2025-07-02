FROM public.ecr.aws/lambda/nodejs:18

RUN mkdir -p /opt/bin

COPY devops/tools/ffprobe /opt/bin/ffprobe
RUN chmod +x /opt/bin/ffprobe

ENV PATH="/opt/bin:${PATH}"

COPY src/ ${LAMBDA_TASK_ROOT}/
COPY package*.json ./
RUN npm install --production

CMD ["dist/index.handler"]
