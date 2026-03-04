import os
import time
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import html2text

BASE_URL = "https://docs.inceptionlabs.ai"
START_URL = "https://docs.inceptionlabs.ai/get-started/get-started"
OUTPUT_DIR = "inception_docs"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def sanitize_filename(url):
    path = urlparse(url).path
    if path == "/" or not path:
        return "index.md"
    name = path.strip("/").replace("/", "_") + ".md"
    return name

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        print(f"Loading {START_URL}...")
        try:
            page.goto(START_URL, wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(5000)
        except Exception as e:
            print(f"Error loading start URL: {e}")
            
        time.sleep(2)  # wait for any dynamic JS to render menus
        
        # Get all links on start page to build the sitemap
        links = page.eval_on_selector_all("a", "elements => elements.map(el => el.href)")
        
        doc_urls = set()
        for link in links:
            if link and link.startswith(BASE_URL) and "support" not in link.lower() and "#" not in link:
                doc_urls.add(link)
                
        # Also try to just pick relative paths in case some JS logic hides them
        html = page.content()
        soup = BeautifulSoup(html, "html.parser")
        for a in soup.find_all("a", href=True):
            href = a['href']
            if href.startswith('/') and "support" not in href.lower():
                full_url = urljoin(BASE_URL, href)
                if "#" not in full_url:
                    doc_urls.add(full_url)

        # Ensure start url is in there
        doc_urls.add(START_URL)

        urls_to_scrape = sorted(list(doc_urls))
        print(f"Found {len(urls_to_scrape)} document pages to scrape.")

        h = html2text.HTML2Text()
        h.ignore_links = False
        h.ignore_images = False

        for url in urls_to_scrape:
            print(f"Scraping {url}...")
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=15000)
                page.wait_for_timeout(3000) # short pause for dynamic content
                
                # Extract main content
                content_html = ""
                # Try to find standard content tags
                main_element = page.query_selector("main") or page.query_selector("article")
                if main_element:
                    content_html = main_element.inner_html()
                else:
                    content_html = page.content() # fallback to whole page
                
                # Extract clean text with bs4 to remove nav/sidebar if fallback
                soup_content = BeautifulSoup(content_html, "html.parser")
                for tag in soup_content(["nav", "aside", "header", "footer", "script", "style"]):
                    tag.decompose()
                clean_html = str(soup_content)
                
                markdown_text = h.handle(clean_html)
                
                filename = sanitize_filename(url)
                filepath = os.path.join(OUTPUT_DIR, filename)
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(f"# Source: {url}\n\n{markdown_text}")
                
            except Exception as e:
                print(f"Failed to scrape {url}: {e}")

        browser.close()
        print("Scraping completed.")

if __name__ == "__main__":
    run()
