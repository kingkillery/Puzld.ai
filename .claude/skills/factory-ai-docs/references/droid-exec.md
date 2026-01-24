# droid exec (headless CLI)

Key points from the droid exec docs:

- droid exec runs a single prompt in headless (non-interactive) mode for automation.
- It is a one-shot invocation suitable for scripts and pipelines.
- You can set the model explicitly; otherwise it uses the default model.
- Spec mode is read-only by default; flags allow tool use and edits.
- Output is printed to stdout for piping or file capture.
- The --auto option controls autonomy level (e.g., auto-none/auto-low/auto-medium/auto-high).
