#!/usr/bin/env python3
"""
Connect to existing Salesforce session via CDP and verify evaluation questions
"""
import asyncio
import json
from playwright.async_api import async_playwright


async def connect_and_verify():
    """Connect to existing browser via CDP and verify evaluation questions"""
    try:
        async with async_playwright() as p:
            # Connect to existing browser via CDP
            print("Connecting to browser via CDP...")
            browser = await p.chromium.connect_over_cdp("http://localhost:9222")
            
            # Get all contexts
            contexts = browser.contexts
            if not contexts:
                print("No contexts found")
                return
            
            # Use the first context
            context = contexts[0]
            pages = context.pages
            
            print(f"\nFound {len(pages)} pages:")
            salesforce_page = None
            
            for i, page in enumerate(pages):
                try:
                    title = await page.title()
                    url = page.url
                    print(f"  {i+1}. {title[:60]}... - {url[:80]}...")
                    
                    # Look for Salesforce page
                    if "Salesforce" in title or "ambia.lightning.force.com" in url or "ambia.my.salesforce.com" in url:
                        if salesforce_page is None:
                            salesforce_page = page
                            print(f"    ✓ Using this as Salesforce page")
                except:
                    pass
            
            if salesforce_page:
                print(f"\n✓ Connected to Salesforce page")
                print(f"Title: {await salesforce_page.title()}")
                print(f"URL: {salesforce_page.url}")
                
                # Now we can navigate Salesforce to verify evaluation questions
                # For now, just return the page reference
                return salesforce_page
            else:
                print("\nNo Salesforce page found. Creating new page...")
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
    page = asyncio.run(connect_and_verify())
    if page:
        print("\n✓ Successfully connected to Salesforce session")
        print("Ready to verify evaluation questions...")
    else:
        print("\n✗ Failed to connect to Salesforce session")


