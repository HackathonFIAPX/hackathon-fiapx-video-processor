import { Context, SQSEvent, S3EventRecord } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);
const s3Client = new S3Client({});

/**
 * Função que gera uma URL pré-assinada para GET no S3
 */
async function gerarUrlPreAssinada(bucket: string, key: string) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  // URL válida por 5 minutos
  return getSignedUrl(s3Client, command, { expiresIn: 300 });
}

/**
 * Função que executa ffprobe e extrai a duração do vídeo
 */
async function extrairDuracao(url: string) {
  // Comando ffprobe para extrair duração no formato JSON
  const cmd = `ffprobe -v error -show_entries format=duration -of json "${url}"`;
  const { stdout, stderr } = await execPromise(cmd);

  if (stderr) {
    console.error("Erro ffprobe:", stderr);
  }
  const info = JSON.parse(stdout);
  if (!info.format || !info.format.duration) {
    throw new Error("Duração não encontrada no ffprobe output");
  }
  return parseFloat(info.format.duration);
}

/**
 * Handler principal da Lambda
 */
export const handler = async (event: SQSEvent, _: Context) => {
  console.log("Evento recebido:", JSON.stringify(event, null, 2));
  // Event SQS tem múltiplas mensagens
  for (const record of event.Records) {
    try {
      // A mensagem do SQS contém o evento original do S3 como JSON na propriedade body
      const s3Event = JSON.parse(record.body);
      console.log("Registro SQS recebido:", JSON.stringify(s3Event, null, 2));
      const s3EventRecord = JSON.parse(s3Event.Message);
      console.log("Registro S3 recebido:", JSON.stringify(s3EventRecord, null, 2));

      // S3EventRecords podem ter múltiplos eventos, geralmente só 1
      for (const rec of s3EventRecord.Records) {
        const bucket = rec.s3.bucket.name;
        const key = decodeURIComponent(rec.s3.object.key.replace(/\+/g, " "));

        console.log(`Processando vídeo: s3://${bucket}/${key}`);

        // Gera a URL pré-assinada
        const url = await gerarUrlPreAssinada(bucket, key);

        // Extrai a duração usando ffprobe
        const duracao = await extrairDuracao(url);

        console.log(`Duração do vídeo: ${duracao} segundos`);
        // Aqui você pode salvar a duração no banco, enviar para outro serviço etc.
      }
    } catch (error) {
      console.error("Erro ao processar registro SQS:", error);
      // Pode fazer retry ou enviar para DLQ
    }
  }
};
