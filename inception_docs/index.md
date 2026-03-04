# Source: https://docs.inceptionlabs.ai/

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

Welcome to the Inception Platform

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

On this page

  * Account Setup
  * Quick Start
  * Using Third-Party Libraries

##

​

Account Setup

  1. Create an Inception Platform account or [sign in](https://platform.inceptionlabs.ai/auth/login) directly if you already have one. Each new user is initially assigned **10 million free tokens** to help get started with the API.
  2. Go to [API Keys](https://platform.inceptionlabs.ai/dashboard/api-keys) and create a new API key. You can start using the API immediately with your free tokens!
  3. When your free tokens are running low, navigate to [Billing](https://platform.inceptionlabs.ai/dashboard/billing) to add your payment information for continued usage beyond the free tier.

##

​

Quick Start

Export your api key as an [environment
variable](https://en.wikipedia.org/wiki/Environment_variable) in your
terminal.

macOS / Linux

Windows

Copy

Ask AI

    
    
    export INCEPTION_API_KEY="your_api_key_here"
    

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
        "max_tokens": 1000
      }'
    

All API requests should be made to:

Copy

Ask AI

    
    
    https://api.inceptionlabs.ai/v1
    

All API requests should be sent with the API key in the Authorization header:

Copy

Ask AI

    
    
    Authorization: Bearer $INCEPTION_API_KEY
    

####

​

Using Third-Party Libraries

Inception API is also fully compatible with popular Python libraries:

AISuite

LiteLLM

LangChain

OpenAI Client

VercelAI

Copy

Ask AI

    
    
    import os
    import aisuite as ai
    
    client = ai.Client(
        {
            "inception": {"api_key": os.environ["INCEPTION_API_KEY"], "base_url": "https://api.inceptionlabs.ai/v1"},
        }
    )
    
    response = client.chat.completions.create(
        model="inception:mercury-2",
        messages=[{"role": "user", "content": "What is a diffusion model?"}],
        max_tokens=1000
    )
    print(response.choices[0].message.content)
    

Was this page helpful?

YesNo

[Authentication](/get-started/authentication)

Ctrl+I

Assistant

Responses are generated using AI and may contain mistakes.

[Contact support](mailto:support@inceptionlabs.ai)

