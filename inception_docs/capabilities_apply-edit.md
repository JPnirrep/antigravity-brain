# Source: https://docs.inceptionlabs.ai/capabilities/apply-edit

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

Capabilities

Apply Edit

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

Export your api key as an environment variable in your terminal.

macOS / Linux

Windows

Copy

Ask AI

    
    
    export INCEPTION_API_KEY="your_api_key_here"
    

Copy

Ask AI

    
    
    curl https://api.inceptionlabs.ai/v1/apply/completions \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $INCEPTION_API_KEY" \
      -d '{
        "model": "mercury-edit",
        "messages": [
          {
            "role": "user",
            "content": "<|original_code|>\nclass Calculator:\n    \"\"\"A simple calculator class.\"\"\"\n    def __init__(self):\n        self.history = []\n\n    def add(self, a, b):\n        \"\"\"Adds two numbers.\"\"\"\n        result = a + b\n        return result\n<|/original_code|>\n\n<|update_snippet|>\n// ... existing code ...\ndef multiply(self, a, b):\n    \"\"\"Multiplies two numbers.\"\"\"\n    result = a * b\n    return result\n// ... existing code ...\n<|/update_snippet|>"
          }
        ]
      }'
    

**Apply Edit Request Format** Mercury Edit expects apply-edit requests to
contain 2 sections: the original code and an update snippet. The model will
intelligently merge the update snippet into the original code while preserving
the code’s structure, order, comments, and indentation.

Original Code

The original code should be formatted as:

Copy

Ask AI

    
    
    <|original_code|>
    {original_code}
    <|/original_code|>
    

Update Snippet

The update snippet should be formatted as:

Copy

Ask AI

    
    
    <|update_snippet|>
    // ... existing code ...
    [UPDATED CODE SNIPPET 1]
    // ... existing code ...
    [UPDATED CODE SNIPPET 2]
    // ... existing code ...
    <|/update_snippet|>
    

Was this page helpful?

YesNo

[Next Edit](/capabilities/next-edit)[Cline](/resources/cline)

Ctrl+I

Assistant

Responses are generated using AI and may contain mistakes.

[Contact support](mailto:support@inceptionlabs.ai)

