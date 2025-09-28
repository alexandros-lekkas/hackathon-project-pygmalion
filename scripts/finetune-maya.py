#!/usr/bin/env python3
"""
Fine-tune an OpenAI chat model from your local machine.

Usage:
  python finetune.py --train data/maya-train.jsonl \
                     --val data/maya-val.jsonl \
                     --base gpt-4o-mini-2024-07-18 \
                     --suffix maya-gf

Notes:
- Training examples must be JSONL with: {"messages":[{"role":"system","content":"..."},{"role":"user","content":"..."},{"role":"assistant","content":"..."}]}
- Each example must fit the per-example token limit (docs show 4096 tokens/example). Keep your system text concise. :contentReference[oaicite:1]{index=1}
"""

import argparse
import os
import sys
import time
from typing import Optional

from dotenv import load_dotenv
from openai import OpenAI

POLL_SECS = 8

def die(msg: str, code: int = 1):
    print(f"Error: {msg}", file=sys.stderr)
    sys.exit(code)

def upload_file(client: OpenAI, path: str, purpose: str = "fine-tune") -> str:
    if not os.path.exists(path):
        die(f"File not found: {path}")
    print(f"Uploading: {path}")
    with open(path, "rb") as fd:
        f = client.files.create(file=fd, purpose=purpose)
    print(f"  -> file id: {f.id}")
    return f.id

def create_job_with_retry(client: OpenAI, training_file: str, validation_file: Optional[str],
                          base_model: str, suffix: str, retries: int = 8) -> str:
    """
    Some files take a moment to process; if you see 'File not ready', wait and retry.
    Mirrors Cookbook guidance. :contentReference[oaicite:2]{index=2}
    """
    attempt = 0
    while True:
        try:
            job = client.fine_tuning.jobs.create(
                training_file=training_file,
                validation_file=validation_file,
                model=base_model,
                suffix=suffix or None,
            )
            print(f"Fine-tune job created: {job.id}  (status: {job.status})")
            return job.id
        except Exception as e:
            msg = str(e)
            if "File not ready" in msg and attempt < retries:
                attempt += 1
                wait = 5 + attempt * 3
                print(f"File not ready, retrying in {wait}s...")
                time.sleep(wait)
                continue
            raise

def stream_events(client: OpenAI, job_id: str):
    """Print new events as training progresses."""
    print("Streaming training events… (Ctrl+C to stop watching; job will continue server-side)")
    seen = set()
    while True:
        try:
            job = client.fine_tuning.jobs.retrieve(job_id)
            status = job.status
            # print a short heartbeat line
            print(f"\rStatus: {status:<12} trained_tokens={getattr(job, 'trained_tokens', None)}", end="")
            # list events and print unseen ones in chronological order
            events = getattr(client.fine_tuning.jobs.list_events(job_id), "data", [])
            for ev in reversed(events):  # API returns newest first
                if ev.id not in seen:
                    print(f"\n{ev.message}")
                    seen.add(ev.id)
            if status in ("succeeded", "failed", "cancelled"):
                print("\nDone.")
                return job
            time.sleep(POLL_SECS)
        except KeyboardInterrupt:
            print("\nStopped watching. You can re-run to check again.")
            return client.fine_tuning.jobs.retrieve(job_id)

def main():
    load_dotenv()  # reads .env with OPENAI_API_KEY
    if not os.getenv("OPENAI_API_KEY"):
        die("OPENAI_API_KEY not set. Put it in .env (do NOT commit it).")

    ap = argparse.ArgumentParser()
    ap.add_argument("--train", required=True, help="Path to training JSONL")
    ap.add_argument("--val", help="Path to validation JSONL (optional)")
    ap.add_argument("--base", default="gpt-4o-mini-2024-07-18",
                    help="Base model to fine-tune (default: gpt-4o-mini-2024-07-18)")
    ap.add_argument("--suffix", default="maya-gf", help="Suffix to tag the FT model")
    args = ap.parse_args()

    client = OpenAI()

    # 1) Upload files
    train_id = upload_file(client, args.train)
    val_id = upload_file(client, args.val) if args.val else None

    # 2) Create the job (retry if files still processing)
    job_id = create_job_with_retry(client, train_id, val_id, args.base, args.suffix)

    # 3) Watch progress & finish
    job = stream_events(client, job_id)
    status = job.status
    print(f"Final status: {status}")

    # 4) Save FT model id if succeeded
    if status == "succeeded":
        ft_model = job.fine_tuned_model
        if not ft_model:
            die("Fine-tune succeeded but no model id returned; check dashboard.")
        with open(".ft-model.txt", "w", encoding="utf8") as f:
            f.write(ft_model + "\n")
        print(f"Fine-tuned model id: {ft_model}")
        print("Saved to .ft-model.txt")
        print("\nUse it like this:")
        print("  from openai import OpenAI")
        print("  client = OpenAI()")
        print(f"  client.chat.completions.create(model='{ft_model}', messages=[{{'role':'system','content':'...'}}, {{'role':'user','content':'hi'}}])")
    else:
        die("Fine-tune did not succeed; check the job in the dashboard.")

if __name__ == "__main__":
    main()
