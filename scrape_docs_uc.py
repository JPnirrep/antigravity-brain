import os
import time
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
import html2text
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

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
    options = uc.ChromeOptions()
    # options.add_argument('--headless') # Headless often triggers CF, keep it visible if possible
    driver = uc.Chrome(options=options, version_main=145)
    
    print(f"Loading {START_URL}...")
    driver.get(START_URL)
    
    # Wait for the page to load and pass CF challenge
    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, 'a'))
        )
    except Exception as e:
        print("Timeout waiting for links on initial page.")
        
    time.sleep(3) # Extra wait for React/JS hydration
    
    html = driver.page_source
    soup = BeautifulSoup(html, "html.parser")
    
    doc_urls = set()
    for a in soup.find_all("a", href=True):
        href = a['href']
        if "support" not in href.lower():
            if href.startswith('/'):
                full_url = urljoin(BASE_URL, href)
                if "#" not in full_url:
                    doc_urls.add(full_url)
            elif href.startswith(BASE_URL):
                if "#" not in href:
                    doc_urls.add(href)

    doc_urls.add(START_URL)
    urls_to_scrape = sorted(list(doc_urls))
    
    print(f"Found {len(urls_to_scrape)} document pages to scrape.")

    h = html2text.HTML2Text()
    h.ignore_links = False
    h.ignore_images = False

    for url in urls_to_scrape:
        print(f"Scraping {url}...")
        try:
            driver.get(url)
            time.sleep(3) # Wait for page rendering
            
            content_html = ""
            try:
                main_element = driver.find_element(By.TAG_NAME, "main")
                content_html = main_element.get_attribute('innerHTML')
            except:
                try:
                    article = driver.find_element(By.TAG_NAME, "article")
                    content_html = article.get_attribute('innerHTML')
                except:
                    content_html = driver.page_source
            
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

    driver.quit()
    print("Scraping completed.")

if __name__ == "__main__":
    run()
