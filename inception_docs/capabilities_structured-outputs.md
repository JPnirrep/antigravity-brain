# Source: https://docs.inceptionlabs.ai/capabilities/structured-outputs

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

Structured Outputs

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

Use JSON schemas to enforce structured data output with specific properties,
types, and constraints. Export your api key as an environment variable in your
terminal.

macOS / Linux

Windows

Copy

Ask AI

    
    
    export INCEPTION_API_KEY="your_api_key_here"
    

Copy

Ask AI

    
    
    import os
    import requests
    import json
    
    url = "https://api.inceptionlabs.ai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.environ["INCEPTION_API_KEY"]}",
    }
    
    response_schema = {
        "name": "Sentiment",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "sentiment": {
                    "type": "string",
                    "enum": ["positive", "negative", "neutral"]
                },
                "confidence": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                },
                "key_phrases": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "required": ["sentiment", "confidence", "key_phrases"]
        },
    }
    
    data = {
        "model": "mercury-2",
        "messages": [
            {
                "role": "user",
                "content": "Analyze the sentiment of this text: 'I absolutely love this feature! It works perfectly and saves me so much time.'"
            }
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": response_schema
        },
        "stream": False,
    }
    
    res = requests.post(url, headers=headers, data=json.dumps(data))
    print(res.json())
    

Was this page helpful?

YesNo

[Tool Use](/capabilities/tool-use)[Autocomplete (FIM)](/capabilities/fim)

Ctrl+I

Assistant

Responses are generated using AI and may contain mistakes.

[Contact support](mailto:support@inceptionlabs.ai)

