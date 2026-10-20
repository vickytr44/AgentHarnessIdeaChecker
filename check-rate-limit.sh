#!/usr/bin/env bash
# Test Google Gemini API rate limits and switch models

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPSETTINGS="$SCRIPT_DIR/backend/appsettings.json"

TARGET_MODEL="${1:-}"
SWITCH_FLAG="${2:-}"

API_KEY=""
CURRENT_MODEL=""

if [ -f "$APPSETTINGS" ]; then
    if command -v jq >/dev/null 2>&1; then
        API_KEY=$(jq -r '.Google.ApiKey // empty' "$APPSETTINGS" 2>/dev/null)
        CURRENT_MODEL=$(jq -r '.Google.Model // empty' "$APPSETTINGS" 2>/dev/null)
    elif command -v python3 >/dev/null 2>&1; then
        API_KEY=$(python3 -c "import json; d=json.load(open('$APPSETTINGS')); print(d.get('Google',{}).get('ApiKey',''))" 2>/dev/null)
        CURRENT_MODEL=$(python3 -c "import json; d=json.load(open('$APPSETTINGS')); print(d.get('Google',{}).get('Model',''))" 2>/dev/null)
    fi
fi

API_KEY="${GOOGLE_API_KEY:-$API_KEY}"
MODEL="${TARGET_MODEL:-$CURRENT_MODEL}"
MODEL="${MODEL:-gemini-3.5-flash-lite}"

if [ -z "$API_KEY" ]; then
    echo "Error: No Google API key found in backend/appsettings.json or GOOGLE_API_KEY environment variable."
    exit 1
fi

ENDPOINT="https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"

echo ""
echo "=========================================================="
echo "    Google Gemini API Rate Limit & Model Quota Checker    "
echo "=========================================================="
echo "Testing Model : $MODEL"
echo "Endpoint      : $ENDPOINT"
echo "Key (masked)  : ${API_KEY:0:12}..."
echo "----------------------------------------------------------"

TMP_PAYLOAD=$(mktemp)
echo "{\"model\": \"$MODEL\", \"messages\": [{\"role\": \"user\", \"content\": \"ping\"}], \"max_tokens\": 5}" > "$TMP_PAYLOAD"

HTTP_RESPONSE=$(curl -4 -s -w "\n__STATUS__:%{http_code}\n__TIME__:%{time_total}" \
    -X POST "$ENDPOINT" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    --data-binary "@$TMP_PAYLOAD" \
    --max-time 45)

rm -f "$TMP_PAYLOAD"

BODY=$(echo "$HTTP_RESPONSE" | sed -e '/__STATUS__:/,$d')
STATUS=$(echo "$HTTP_RESPONSE" | grep "__STATUS__:" | cut -d':' -f2 | tr -d '\r')
TIME=$(echo "$HTTP_RESPONSE" | grep "__TIME__:" | cut -d':' -f2 | tr -d '\r')

echo "Status Code   : $STATUS"
echo "Latency       : ${TIME}s"

if [ "$STATUS" = "200" ]; then
    echo -e "\n[RESULT] HEALTHY! No rate limit hit."
    echo "Quota is active and ready for execution."
elif [ "$STATUS" = "429" ]; then
    echo -e "\n[ALERT] RATE LIMIT ACHIEVED (HTTP 429 - Quota Exceeded)!"
    echo "Details: $BODY"
    echo ""
    echo "To test another model:"
    echo "  ./check-rate-limit.sh gemini-3.8-flash"
elif [ "$STATUS" = "404" ]; then
    echo -e "\n[RESULT] Model Not Found / Deprecated (HTTP 404)"
    echo "Details: $BODY"
else
    echo -e "\n[RESULT] HTTP Status: $STATUS"
    echo "Details: $BODY"
fi
echo "=========================================================="
echo ""
