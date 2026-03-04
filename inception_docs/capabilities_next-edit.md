# Source: https://docs.inceptionlabs.ai/capabilities/next-edit

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

Next Edit

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

    
    
    curl https://api.inceptionlabs.ai/v1/edit/completions \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $INCEPTION_API_KEY" \
      -d "{
        \"model\": \"mercury-edit\",
        \"messages\": [
          {
            \"role\": \"user\",
            \"content\": \"<|recently_viewed_code_snippets|>\\n\\n<|/recently_viewed_code_snippets|>\\n\\n<|current_file_content|>\\ncurrent_file_path: solver.py\\n'''''''''\\nfunction: flagAllNeighbors\\n----------\\nThis function marks each of the covered neighbors of the cell at the given row\\n<|code_to_edit|>\\nand col as flagged.\\n'''''''''\\ndef flagAllNeighbors(board<|cursor|>, row, col): \\n for r, c in b.getNeighbors(row, col):\\n if b.isValid(r, c):\\n b.flag(r, c)\\n\\n<|/code_to_edit|>\\n<|/current_file_content|>\\n\\n<|edit_diff_history|>\\n--- /c:/Users/test/testing/solver.py\\n+++ /c:/Users/test/testing/solver.py\\n@@ -6,1 +6,1 @@\\n-def flagAllNeighbors(b, row, col): \\n+def flagAllNeighbors(board, row, col): \\n\\n<|/edit_diff_history|>\"
          }
        ]
      }"
    

**Next Edit Request Format** Mercury Edit expects next-edit requests to
contain 3 sections of code contents: recently viewed snippets, the current
file with the editable region, and a time-ordered edit history. The primary
purpose of the recently viewed snippets and edit history are to provide
context to Mercury Edit so that it can better understand the user’s current
intent in modifying code.

Recently Viewed Snippets

The recently viewed snippets should be formatted as:

Copy

Ask AI

    
    
    <|recently_viewed_code_snippets|>
    <|recently_viewed_code_snippet|>
    code_snippet_file_path: [SNIPPET FILE PATH 1]
    [SNIPPET 1 CODE]
    <|/recently_viewed_code_snippet|>
    
    <|recently_viewed_code_snippet|>
    code_snippet_file_path: [SNIPPET FILE PATH 2]
    [SNIPPET 2 CODE]
    <|/recently_viewed_code_snippet|>
    <|/recently_viewed_code_snippets|>
    

Each snippet should correspond to a piece of code (or entire code files) that
a user has recently viewed. If you do not wish to use recently viewed
snippets, please add
`<|recently_viewed_code_snippets|>\n\n<|/recently_viewed_code_snippets|>` with
no contents inside the tags.

Current File Content

The current file content should be formatted as:

Copy

Ask AI

    
    
    <|current_file_content|>
    current_file_path: [CURRENT FILE PATH]
    [CODE ABOVE EDITABLE REGION]
    <|code_to_edit|>
    [EDITABLE REGION CODE]
    <|/code_to_edit|>
    [CODE BELOW EDITABLE REGION]
    <|/current_file_content|>
    

Mercury Edit will return an updated version of the editable region in its
response (e.g., completing a function) enclosed in triple backticks.

Edit History

The edit history should be formatted as:

Copy

Ask AI

    
    
    <|edit_diff_history|>
    --- [EDITED FILE PATH 1]
    +++ [EDITED FILE PATH 1]
    [DIFF HUNK HEADER 1 WITH @@]
    [DIFF LINES 1]
    
    --- [EDITED FILE PATH 2]
    +++ [EDITED FILE PATH 2]
    [DIFF HUNK HEADER 2 WITH @@]
    [DIFF LINES 2]
    
    <|/edit_diff_history|>
    

As seen above, each edit should follow unidiff formatting. It is important to
make sure that the bottommost edits in the prompt correspond to the most
recent edits made by the user. If you do not wish to use edit history, please
add `<|edit_diff_history|>\n\n<|/edit_diff_history|>` with no contents inside
the tags.

**Next Edit Prompting Best Practices** The following best practices will help
you get the most relevant suggestions out of Mercury Edit while maintaining
low latency.

Recently Viewed Snippets

Include **3–5 snippets** of roughly 20 lines each, centered around the user’s
recent cursor positions. These should be focused code excerpts — not full
files. For more advanced implementations, consider using AST nodes at cursor
locations or code RAG to surface relevant type definitions and method
implementations across the codebase.Always provide the **latest state** of
code at each snippet location, as stale snippets can cause the model to
suggest reverting recent changes. Both full declarations and outlines (e.g.,
type signatures and docstrings) are acceptable snippet formats.

User Edit History

Include at least the **last 3–5 user edits** , ordered chronologically with
the most recent edit last. Edits should be **range-based** — if a user made
multiple modifications in the same area, combine them into a single unidiff
rather than many granular diffs.The edit history is often the strongest signal
for identifying user intent. Ensuring the final entry corresponds to the
user’s most recent edit can significantly improve suggestion quality.

Current File Content

Pass in the **entire current file** so the model can draw on imports, function
signatures, and surrounding code. For extremely large files, trim distant
regions while preserving the area around the editable region.

Editable Region Selection

The editable region directly determines output token count and dominates
latency. We recommend starting with **10–15 lines** (~100–150 tokens) and
tuning from there. At ~1,000 tokens/second decoding speed, an upper bound of
around 25 lines (~250 tokens) is practical depending on network latency.For
selecting which lines to include, a simple approach is to center the region
around the cursor: `[currentLine - 5, currentLine + 10]`.To suggest edits
beyond the cursor vicinity:

  * **Parallel requests** : Fire multiple requests with disjoint editable regions and check which ones produce meaningful diffs.
  * **Linter-guided selection** : Wrap editable regions around locations where the linter identifies errors.

We recommend making the maximum editable region size configurable so you can
tune the tradeoff between suggestion scope and latency.

Was this page helpful?

YesNo

[Autocomplete (FIM)](/capabilities/fim)[Apply Edit](/capabilities/apply-edit)

Ctrl+I

Assistant

Responses are generated using AI and may contain mistakes.

[Contact support](mailto:support@inceptionlabs.ai)

