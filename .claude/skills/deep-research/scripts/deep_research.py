import os
import time
import argparse
import sys
from google import genai

# Configuration
# This can be overridden by environment variable GEMINI_DEEP_RESEARCH_MODEL
DEEP_RESEARCH_AGENT = os.environ.get("GEMINI_DEEP_RESEARCH_MODEL", "deep-research-pro-preview-12-2025")

def get_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.", file=sys.stderr)
        sys.exit(1)
    return genai.Client(api_key=api_key)

def submit_research(prompt_file):
    try:
        with open(prompt_file, 'r', encoding='utf-8') as f:
            prompt = f.read()
    except FileNotFoundError:
        print(f"Error: Prompt file '{prompt_file}' not found.", file=sys.stderr)
        sys.exit(1)

    client = get_client()
    try:
        interaction = client.interactions.create(
            input=prompt,
            agent=DEEP_RESEARCH_AGENT,
            background=True,
            store=True,
        )
        print(interaction.id)
    except Exception as e:
        print(f"Error submitting research job: {e}", file=sys.stderr)
        sys.exit(1)

def poll_research(interaction_id, output_file=None, poll_interval=10):
    client = get_client()
    print(f"Polling job {interaction_id} every {poll_interval} seconds...", file=sys.stderr)
    
    while True:
        try:
            itx = client.interactions.get(interaction_id)
            status = itx.status
            
            if status == "completed":
                result = itx.outputs[-1].text
                if output_file:
                    with open(output_file, 'w', encoding='utf-8') as f:
                        f.write(result)
                    print(f"Research completed. Output saved to {output_file}", file=sys.stderr)
                else:
                    print(result)
                break
            
            elif status in ("failed", "cancelled"):
                print(f"Research job ended with status: {status}", file=sys.stderr)
                sys.exit(1)
            
            else:
                # running or other states
                print(f"Status: {status}. Waiting...", file=sys.stderr)
                time.sleep(poll_interval)
                
        except Exception as e:
            print(f"Error polling job: {e}", file=sys.stderr)
            # Don't exit immediately on transient network errors, maybe? 
            # For now, let's exit to be safe/visible.
            sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Gemini Deep Research CLI Wrapper")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Submit command
    submit_parser = subparsers.add_parser("submit", help="Submit a new research job")
    submit_parser.add_argument("--prompt-file", required=True, help="Path to file containing the prompt")

    # Poll command
    poll_parser = subparsers.add_parser("poll", help="Poll an existing research job")
    poll_parser.add_argument("--id", required=True, help="Interaction/Job ID to poll")
    poll_parser.add_argument("--out", help="Path to save the output report")
    poll_parser.add_argument("--interval", type=int, default=10, help="Polling interval in seconds")

    args = parser.parse_args()

    if args.command == "submit":
        submit_research(args.prompt_file)
    elif args.command == "poll":
        poll_research(args.id, args.out, args.interval)

if __name__ == "__main__":
    main()
