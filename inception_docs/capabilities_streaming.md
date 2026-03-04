# Source: https://docs.inceptionlabs.ai/capabilities/streaming

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

Streaming & Diffusion

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

Inception API supports streaming output and diffusion effect modes:

  * **Streaming:** Get responses block-by-block for instant feedback—ideal for chat and live applications.
  * **Diffusing:** Optionally visualize how noisy outputs are refined into final text, showcasing the model’s iterative denoising process.

Export your api key as an environment variable in your terminal.

macOS / Linux

Windows

Copy

Ask AI

    
    
    export INCEPTION_API_KEY="your_api_key_here"
    

Streaming

Diffusing

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
          "max_tokens": 1000,
          "stream": true
        }'
    

Here is an example of how to show the diffusing effect in your web app using
JavaScript:

Copy

Ask AI

    
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            if (trimmed === 'data: [DONE]') continue;
            const jsonStr = trimmed.substring(6);
            if (!jsonStr.startsWith('{')) continue;
            try {
                const data = JSON.parse(jsonStr);
                
                for (const choice of data.choices || []) {
                    if (choice.delta && choice.delta.content !== null && choice.delta.content !== undefined) {
                        fullContent = choice.delta.content || '';
                        contentElement.textContent = fullContent;
                    }
                }
            } catch (error) {
                console.error('Parsing error:', error);
            }
        }
    }
    

Was this page helpful?

YesNo

[Chat Completions](/capabilities/chat-
completions)[Instant](/capabilities/instant)

Ctrl+I

Assistant

Responses are generated using AI and may contain mistakes.

[Contact support](mailto:support@inceptionlabs.ai)

