# Source: https://docs.inceptionlabs.ai/capabilities/instant

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

Instant

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

Inception API supports a near-instant mode that enables realtime responses
from Mercury 2 by using `reasoning_effort=instant` . This is ideal for:

  * Voice assistants
  * Customer support chatbots
  * Real-time decision systems
  * Low-latency workflows and automations

Export your api key as an environment variable in your terminal.

macOS / Linux

Windows

Copy

Ask AI

    
    
    export INCEPTION_API_KEY="your_api_key_here"
    

Copy

Ask AI

    
    
    curl https://api.inceptionlabs.ai/v1/chat/completions \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $INCEPTION_API_KEY" \
      -d '{
        "model": "mercury-2",
        "messages": [
          { "role": "system", "content": "You are a helpful assistant." },
          { "role": "user", "content": "What is a diffusion model?" }
        ],
        "reasoning_effort": "instant"
      }'
    

Was this page helpful?

YesNo

[Streaming & Diffusion](/capabilities/streaming)[Tool Use](/capabilities/tool-
use)

Ctrl+I

Assistant

Responses are generated using AI and may contain mistakes.

[Contact support](mailto:support@inceptionlabs.ai)

