// scripts/finetune-maya.ts, restore
import 'dotenv/config';
import fs from 'node:fs';
import OpenAI from 'openai';

async function main() {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY in .env');
  }

  // If you used the <MAYA_SYSTEM> token, do a quick replace here before upload.
  // fs.writeFileSync('data/maya-train.upload.jsonl',
  //   fs.readFileSync('data/maya-train.jsonl','utf8').replace(/<MAYA_SYSTEM>/g, require('../prompts/system-maya').MAYA_SYSTEM)
  // );

  const file = await openai.files.create({
    file: fs.createReadStream('data/maya-train.jsonl'),
    purpose: 'fine-tune',
  });

  const job = await openai.fineTuning.jobs.create({
    training_file: file.id,
    // pick a base that your org can fine-tune, e.g.:
    model: 'gpt-4o-mini-2024-07-18',
    suffix: 'maya-gf',
  });

  console.log('FT job:', job.id);
  // Later:
  // const done = await openai.fineTuning.jobs.retrieve(job.id);
  // console.log(done.status, done.fine_tuned_model);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});