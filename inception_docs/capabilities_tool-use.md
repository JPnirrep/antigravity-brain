# Source: https://docs.inceptionlabs.ai/capabilities/tool-use

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

Tool Use

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
    

cURL

Python

Copy

Ask AI

    
    
    curl https://api.inceptionlabs.ai/v1/chat/completions \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $INCEPTION_API_KEY" \
      -d '{
        "model": "mercury-2",
        "messages": [{"role": "user", "content": "What'"'"'s the weather like in San Francisco?"}],
        "tools": [{"type": "function", "function": {"name": "get_weather", "description": "Get the current weather in a given location", "parameters": {"type": "object", "properties": {"location": {"type": "string", "description": "City and state, e.g., '"'"'San Francisco, CA'"'"'"}, "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}}, "required": ["location", "unit"]}}}]
      }'
    

Was this page helpful?

YesNo

[Instant](/capabilities/instant)[Structured Outputs](/capabilities/structured-
outputs)

Ctrl+I

Assistant

Responses are generated using AI and may contain mistakes.

[Contact support](mailto:support@inceptionlabs.ai)

