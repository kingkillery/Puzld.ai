#!/bin/bash
# data-extraction.sh - Batch data extraction using CLI tools

set -e

INPUT_DIR="${1:-.}"
OUTPUT_FILE="${2:-extracted.jsonl}"

echo "Extracting structured data from files in: $INPUT_DIR"
echo "Output: $OUTPUT_FILE"

# Clear output file
> "$OUTPUT_FILE"

# Schema for extraction
SCHEMA='{
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "summary": {"type": "string"},
        "keywords": {"type": "array", "items": {"type": "string"}},
        "sentiment": {"type": "string", "enum": ["positive", "negative", "neutral"]}
    },
    "required": ["title", "summary", "keywords"]
}'

# Process each text file
for file in "$INPUT_DIR"/*.txt "$INPUT_DIR"/*.md; do
    [[ ! -f "$file" ]] && continue
    
    FILENAME=$(basename "$file")
    echo "Processing: $FILENAME"
    
    # Extract structured data using gemini headless mode
    RESULT=$(cat "$file" | timeout 60 gemini -p --output-format json --schema "$SCHEMA" \
        "Extract title, summary (max 100 words), keywords, and sentiment from this document.")
    
    # Add source filename and write to output
    echo "$RESULT" | jq -c --arg src "$FILENAME" '. + {source: $src}' >> "$OUTPUT_FILE"
done

echo ""
echo "=== Extraction Complete ==="
echo "Records: $(wc -l < "$OUTPUT_FILE")"
echo "Output: $OUTPUT_FILE"

# Show sample
echo ""
echo "Sample record:"
head -1 "$OUTPUT_FILE" | jq .
