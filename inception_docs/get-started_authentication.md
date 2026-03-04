# Source: https://docs.inceptionlabs.ai/get-started/authentication

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

Authentication

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

  * Obtaining API Keys
  * Using API Keys

All API requests require authentication using API keys. Your API keys carry
many privileges, so be sure to keep them secure.

####

​

**Obtaining API Keys**

You can generate API keys from your [Inception Platform
Dashboard](https://platform.inceptionlabs.ai/dashboard/api-keys).

####

​

**Using API Keys**

Export your api key as an [environment
variable](https://en.wikipedia.org/wiki/Environment_variable) in your
terminal.

macOS / Linux

Windows

Copy

Ask AI

    
    
    export INCEPTION_API_KEY="your_api_key_here"
    

Include your API key in the Authorization header:

Copy

Ask AI

    
    
    Authorization: Bearer $INCEPTION_API_KEY
    

**Security Note:** Never expose your API keys in client-side code or commit
them to version control. Use environment variables or a secure secrets
management system.

Was this page helpful?

YesNo

[Quick Start](/get-started/get-started)[Models, Endpoints, and Pricing](/get-
started/models)

Ctrl+I

Assistant

Responses are generated using AI and may contain mistakes.

[Contact support](mailto:support@inceptionlabs.ai)

