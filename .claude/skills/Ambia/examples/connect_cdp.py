#!/usr/bin/env python3
"""
Connect to existing browser session via CDP
"""
import asyncio
from playwright.async_api import async_playwright


async def connect_to_cdp(cdp_url: str):
    """Connect to existing browser via CDP"""
    async with async_playwright() as p:
        # Connect to existing browser via CDP
        browser = await p.chromium.connect_over_cdp(f"http://localhost:9222")
        
        # Get all contexts
        contexts = browser.contexts
        if contexts:
            # Use the first context
            context = contexts[0]
            # Get all pages
            pages = context.pages
            if pages:
                # Use the first page
                page = pages[0]
                print(f"Connected to page: {page.url}")
                print(f"Page title: {await page.title()}")
                return page
            else:
                # Create a new page
                page = await context.new_page()
                return page
        else:
            # Create a new context
            context = await browser.new_context()
            page = await context.new_page()
            return page


async def main():
    # Connect to existing browser via CDP
    try:
        async with async_playwright() as p:
            # Connect to existing browser via CDP
            browser = await p.chromium.connect_over_cdp("http://localhost:9222")
            
            # Get all contexts
            contexts = browser.contexts
            if contexts:
                # Use the first context
                context = contexts[0]
                # Get all pages
                pages = context.pages
                
                # Find the Salesforce page
                salesforce_page = None
                for page in pages:
                    title = await page.title()
                    url = page.url
                    print(f"Found page: {title} - {url}")
                    if "Salesforce" in title or "ambia.lightning.force.com" in url or "ambia.my.salesforce.com" in url:
                        salesforce_page = page
                        break
                
                if salesforce_page:
                    print(f"\n✓ Connected to Salesforce page: {await salesforce_page.title()}")
                    print(f"URL: {salesforce_page.url}")
                    
                    # Take a snapshot
                    snapshot = await salesforce_page.accessibility.snapshot()
                    print("\nPage snapshot:")
                    print(snapshot)
                    
                    return salesforce_page
                else:
                    print("No Salesforce page found in existing tabs")
                    # Create a new page
                    page = await context.new_page()
                    await page.goto("https://ambia.lightning.force.com/lightning/page/home")
                    await page.wait_for_load_state("networkidle")
                    return page
            else:
                print("No contexts found, creating new context")
                context = await browser.new_context()
                page = await context.new_page()
                await page.goto("https://ambia.lightning.force.com/lightning/page/home")
                await page.wait_for_load_state("networkidle")
                return page
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    asyncio.run(main())

