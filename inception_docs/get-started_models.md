# Source: https://docs.inceptionlabs.ai/get-started/models

Skip to main content

[Inception Platform home page![light
logo](https://mintcdn.com/inception/w7s4yg-nCRxo-B5U/logo/light-
logo.svg?fit=max&auto=format&n=w7s4yg-
nCRxo-B5U&q=85&s=69620a68aea50f7e998dcc7c397627e4)![dark
logo](https://mintcdn.com/inception/w7s4yg-nCRxo-B5U/logo/dark-
logo.svg?fit=max&auto=format&n=w7s4yg-
nCRxo-B5U&q=85&s=77d4ed3184d9807d0ea2868c38b04a05)](/)

Search...

Ctrl KAsk AI

Search...

Navigation

Getting Started

Models, Endpoints, and Pricing

##### Getting Started

  * [Quick Start](/get-started/get-started)
  * [Authentication](/get-started/authentication)
  * [Models, Endpoints, and Pricing](/get-started/models)
  * [Rate Limits](/get-started/rate-limits)

##### Capabilities

  * [Chat Completions](/capabilities/chat-completions)
  * [Streaming & Diffusion](/capabilities/streaming)
  * [Instant](/capabilities/instant)
  * [Tool Use](/capabilities/tool-use)
  * [Structured Outputs](/capabilities/structured-outputs)
  * [Autocomplete (FIM)](/capabilities/fim)
  * [Next Edit](/capabilities/next-edit)
  * [Apply Edit](/capabilities/apply-edit)

##### Resources

  * Integrations

  * [Inception Chat](https://chat.inceptionlabs.ai/)
  * [Error Codes](/resources/error-codes)
  * [FAQ](/resources/faq)

##### Support

  * [Contact Support](https://platform.inceptionlabs.ai/support)
  * [Terms of Use](https://www.inceptionlabs.ai/docs/terms-of-use)
  * [Privacy Policy](https://www.inceptionlabs.ai/docs/privacy-policy)

## Start Free with 10M Tokens

Every new account includes 10 million free tokens.

##

​

Production Models

Model| Input Price (1M Tokens)| Cached Input Price (1M Tokens)| Output Price
(1M Tokens)| Supported Endpoints| Context Window| Features| Supported Formats  
---|---|---|---|---|---|---|---  
**Mercury 2**|  $0.25| $0.025| $0.75| `v1/chat/completions`| Chat: 128K| `Tool
Calling` `Structured Outputs`| `Text`  
**Mercury Edit**|  $0.25| $0.025| $0.75| `v1/fim/completions`
`v1/apply/completions` `v1/edit/completions`| FIM: 32K  
ApplyEdit: 32K  
NextEdit: 32K| | `Text`  
  
##

​

API Specs

  * Mercury 2

  * Mercury Edit

The fastest reasoning LLM and our most powerful model.

​

reasoning_effort

string

default:"medium"

Control the amount of reasoning (`instant`, `low`, `medium`, `high`).

​

reasoning_summary

boolean

default:"true"

Whether to return a best-effort summary of the model’s reasoning.

​

reasoning_summary_wait

boolean

default:"false"

Whether to delay the final response until the reasoning summary is ready.

​

max_tokens

number

default:"8192"

Maximum number of tokens to generate. Range: 1-50,000

​

temperature

number

default:"0.75"

Controls randomness. Range: 0.5-1.0

​

stop

string[]

default:"null"

Up to 4 sequences where the model will stop generating further tokens. The
returned text will not contain these sequences.

​

stream

boolean

default:"false"

Whether to stream the response.

​

stream_options

object

default:"null"

Include include_usage=true to get usage information.

​

diffusing

boolean

default:"false"

Streaming should be set to true for diffusing effect.

​

tools

object[]

default:"null"

A list of tools the model may call.

##

​

Example Usage

###

​

Chat Completions

`v1/chat/completions`

cURL

Python

JavaScript

Copy

Ask AI

    
    
    curl https://api.inceptionlabs.ai/v1/chat/completions \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $INCEPTION_API_KEY" \
      -d '{
        "model": "mercury-2",
        "messages": [
          {"role": "user", "content": "What is a diffusion model?"}
        ],
        "max_tokens": 10000
      }'
    

A code editing LLM for autocomplete (FIM), apply edit, and next edit
suggestions.

​

max_tokens

number

Maximum number of tokens to generate. Range: 1–8192. Default: `512` for
autocomplete, `8192` for next-edit, `8192` for apply-edit.

​

presence_penalty

number

Penalizes new tokens based on whether they appear in the generated text so
far. Range: -2.0-2.0. Default: `1.5` for autocomplete, `1.0` for next-edit,
`0.0` for apply-edit.

​

temperature

number

Controls randomness. Range: 0.0-1.0. Default: `0.0` for autocomplete, `0.3`
for next-edit, `0.0` for apply-edit.

​

top_p

number

Controls the cumulative probability of the top tokens to consider. Range:
0.0–1.0. Default: `1.0` for autocomplete, `0.8` for next-edit, `1.0` for
apply-edit.

​

stop

string[]

Up to 4 sequences where the model will stop generating further tokens. The
returned text will not contain these sequences.

​

stream

boolean

default:"false"

Whether to stream the response.

​

stream_options

object

default:"null"

Include include_usage=true to get usage information.

##

​

Example Usage

###

​

Autocomplete

`v1/fim/completions`

cURL

Python

JavaScript

Copy

Ask AI

    
    
    curl https://api.inceptionlabs.ai/v1/fim/completions \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $INCEPTION_API_KEY" \
      -d '{
        "model": "mercury-edit",
        "prompt": "def fibonacci(",
        "suffix": "return a + b",
        "max_tokens": 1000
      }'
    

###

​

Apply-Edit

`v1/apply/completions`

cURL

Python

JavaScript

Copy

Ask AI

    
    
    curl https://api.inceptionlabs.ai/v1/apply/completions \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $INCEPTION_API_KEY" \
      --data-binary @- <<'JSON'
    {
      "model": "mercury-edit",
      "messages": [
        {"role": "user", "content": "<|original_code|>\nclass Calculator:\n    \"\"\"A simple calculator class.\"\"\"\n    def __init__(self):\n        self.history = []\n\n    def add(self, a, b):\n        \"\"\"Adds two numbers.\"\"\"\n        result = a + b\n        return result\n<|/original_code|>\n\n<|update_snippet|>\n// ... existing code ...\ndef multiply(self, a, b):\n    \"\"\"Multiplies two numbers.\"\"\"\n    result = a * b\n    return result\n// ... existing code ...\n<|/update_snippet|>"}
      ],
      "max_tokens": 1000
    }
    JSON
    

###

​

Next-Edit

`v1/edit/completions`

cURL

Python

JavaScript

Copy

Ask AI

    
    
    curl https://api.inceptionlabs.ai/v1/edit/completions \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $INCEPTION_API_KEY" \
      --data-binary @- <<'JSON'
    {
      "model": "mercury-edit",
      "messages": [
        {"role": "user", "content": "<|recently_viewed_code_snippets|>\n\n<|/recently_viewed_code_snippets|>\n\n<|current_file_content|>\ncurrent_file_path: solver.py\n'''\nfunction: flagAllNeighbors\n----------\nThis function marks each of the covered neighbors of the cell at the given row\n<|code_to_edit|>\nand col as flagged.\n'''\ndef flagAllNeighbors(board<|cursor|>, row, col): \n for r, c in b.getNeighbors(row, col):\n if b.isValid(r, c):\n b.flag(r, c)\n\n<|/code_to_edit|>\n<|/current_file_content|>\n\n<|edit_diff_history|>\n--- /c:/Users/test/testing/solver.py\n+++ /c:/Users/test/testing/solver.py\n@@ -6,1 +6,1 @@\n-def flagAllNeighbors(b, row, col): \n+def flagAllNeighbors(board, row, col): \n\n<|/edit_diff_history|>"}
      ],
      "max_tokens": 1000
    }
    JSON
    

Was this page helpful?

YesNo

[Authentication](/get-started/authentication)[Rate Limits](/get-started/rate-
limits)

Ctrl+I

Assistant

Responses are generated using AI and may contain mistakes.

[Contact support](mailto:support@inceptionlabs.ai)

