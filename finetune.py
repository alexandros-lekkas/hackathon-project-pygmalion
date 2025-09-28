#!/usr/bin/env python3
import argparse, os, sys, time
from typing import Optional
from dotenv import load_dotenv
from openai import OpenAI

POLL_SECS = 8

def die(msg, code=1):
    print(f"Error: {msg}", file=sys.stderr); sys.exit(code)

def upload_file(client: OpenAI, path: str, purpose="fine-tune") -> str:
    if not os.path.exists(path):
        die(f"File not found: {path}")
    print(f"Uploading: {path}")
    with open(path, "rb") as fd:
        f = client.files.create(file=fd, purpose=purpose)
    print(f"  -> file id: {f.id}")
    return f.id

def create_job_with_retry(client: OpenAI, training_file: str, validation_file: Optional[str],
                          base_model: str, suffix: str, retries: int = 8) -> str:
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
            if "File not ready" in str(e) and attempt < retries:
                attempt += 1
                wait = 5 + attempt * 3
                print(f"File not ready, retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise

def stream_events(client: OpenAI, job_id: str):
    print("Streaming training events… (Ctrl+C to stop watching)")
    seen = set()
    while True:
        try:
            job = client.fine_tuning.jobs.retrieve(job_id)
            status = job.status
            print(f"\rStatus: {status:<12} trained_tokens={getattr(job, 'trained_tokens', None)}", end="")
            events = client.fine_tuning.jobs.list_events(job_id).data
            for ev in reversed(events):  # newest first -> reverse to print oldest first
                if ev.id not in seen:
                    print(f"\n{ev.message}")
                    seen.add(ev.id)
            if status in ("succeeded", "failed", "cancelled"):
                print("\nDone."); return job
            time.sleep(POLL_SECS)
        except KeyboardInterrupt:
            print("\nStopped watching. Re-run later to check again.")
            return client.fine_tuning.jobs.retrieve(job_id)

def main():
    load_dotenv()
    if not os.getenv("OPENAI_API_KEY"):
        die("OPENAI_API_KEY not set. Put it in .env (do NOT commit it).")

    ap = argparse.ArgumentParser()
    ap.add_argument("--train", required=True, help="Path to training JSONL")
    ap.add_argument("--val", help="Path to validation JSONL (optional)")
    ap.add_argument("--base", default="gpt-4o-mini-2024-07-18",
                    help="Base model to fine-tune")
    ap.add_argument("--suffix", default="maya-gf", help="Suffix tag for the FT model")
    args = ap.parse_args()

    client = OpenAI()

    train_id = upload_file(client, args.train)
    val_id = upload_file(client, args.val) if args.val else None

    job_id = create_job_with_retry(client, train_id, val_id, args.base, args.suffix)
    job = stream_events(client, job_id)
    if job.status == "succeeded":
        ft = job.fine_tuned_model
        if not ft: die("Success but no fine_tuned_model returned. Check dashboard.")
        with open(".ft-model.txt", "w", encoding="utf8") as f:
            f.write(ft + "\n")
        print(f"\nFine-tuned model id: {ft}")
        print("Saved to .ft-model.txt")
        print("\nExample usage:")
        print(f"from openai import OpenAI\nc=OpenAI()\nc.chat.completions.create(model='{ft}',messages=[{{'role':'system','content':'...'}},{{'role':'user','content':'hi'}}])")
    else:
        die("Fine-tune did not succeed; see dashboard for details.")

if __name__ == "__main__":
    main()
