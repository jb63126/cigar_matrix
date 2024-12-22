import scrapy
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from cigar_scraper.items import CigarScraperItem, CigarPack
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
# import undetected_chromedriver as uc
import time
from urllib.parse import urlparse, parse_qs
from cigar_scraper.constants import CHROME_DRIVER_PATH

class FamousSmokeSpider(scrapy.Spider):
    name = "famous_smoke"
    allowed_domains = ["famous-smoke.com"]
    start_urls = ["https://www.famous-smoke.com/cigar-brand-list"]

    def __init__(self, *args, **kwargs):
        super(FamousSmokeSpider, self).__init__(*args, **kwargs)
        chrome_options = webdriver.ChromeOptions()
        chrome_options.add_argument(str("--headless"))
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--log-level=3")
        chrome_options.add_argument("--enable-javascript")
        chrome_options.add_argument("--disable-images")
        # driver_path = "chromedriver-mac-x64/chromedriver"
        service = Service(CHROME_DRIVER_PATH)
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        # self.driver = uc.Chrome(driver_executable_path=CHROME_DRIVER_PATH, options=chrome_options)

    def parse(self, response):
        brands = response.css('ul.brandlisting')
        for element in brands.css('li.brandli > a'):
            if element.css('b'):
                brand_name = element.css('b::text').get().strip()
                link = element.css('::attr(href)').get()
                yield response.follow(link, self.parse_brandgrp_page, cb_kwargs={'brand': brand_name})

        
    def parse_brandgrp_page(self, response, brand):
        brand_links = response.css('.brandgroups > a.brandgrouplink')
        for link in brand_links:
            url = link.css('::attr(href)').get()
            sub_brand = link.css('.brandgroupname ::text').get()
            yield response.follow(url, self.parse_brand_products_page, cb_kwargs={'brand': brand, 'sub_brand': sub_brand})


    def parse_brand_products_page(self, response, brand, sub_brand):
        sections = response.css('.full.nopad.section')
        for sec in sections:
            if sec.css('.categorytitle ::text').get().strip().lower() == 'cigars':
                brand_cat = sec.css('.brandcategory.cigars > .brandnewbox')
                for cat in brand_cat:
                    url = cat.css('.stretch-col > a.brandtitle ::attr(href)').get()
                    yield response.follow(url, self.parse_prod_page, cb_kwargs={'brand': brand, 'sub_brand': sub_brand})
                

    def parse_prod_page(self, response, brand, sub_brand):
        cigar_name = response.css('#current-item-header > h1.title.itemname ::text').get().strip()
        
        # Extract cigar attributes
        parsed_url = urlparse(response.url)
        query_params = parse_qs(parsed_url.query)
        pid_value = query_params.get('pid')
        pid_value = pid_value[0] if pid_value else ''
        attributes = response.css(f'#current-item-attributes > #attributes-{pid_value} > div > *')
        details = {}
        for attr in attributes:
            label = attr.css('::text').get().strip().lower()
            value = attr.css('b::text').get()
            if label and value:
                details[label.replace(':', '').replace(' ', '-')] = value.strip()

        product = CigarScraperItem()
        product['name'] = cigar_name
        product['prod_url'] = response.url
        product['brand'] = brand
        product['sub_brand'] = sub_brand
        product['strength'] = details.get('strength')
        product['shape'] = details.get('shape')
        product['origin'] = details.get('wrapper-origin')
        size = details.get('size')
        if size:
            size = size.lower().split('x')
            product['length'] = size[0].strip()
            product['ring'] = size[1].strip()
        
        cigar_packs = self.handle_packs_select(response)
        product['packs'] = cigar_packs
        yield product


    def handle_packs_select(self, response):
        self.driver.get(response.url)
        wait = WebDriverWait(self.driver, 10)
        pack_data = []
        select2_container_css = "#current-item-dropdown .select2-container"
        options_css = 'li.select2-results__option'
        price_selector = '#current-item-pricing span.subtitle.oswald.cblack.itemprice'
        cart_btn_selector = '#current-item-buy a.cartbtn.yellowblack'
        try:
            # Locate the Select2 container
            select2_container = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, select2_container_css)))
            select2_container.click() # Click on the Select2 container to open the dropdown
            
            # Locate the options within the opened dropdown
            options = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, options_css)))
            for index, option in enumerate(options):
                options = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, options_css)))
                pack_name = options[index].text
                options[index].click()
                time.sleep(1) # Wait a bit to allow the price to update
                price_element = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, price_selector)))
                price = price_element.text

                availability = True
                try:
                   self.driver.find_element(By.CSS_SELECTOR, cart_btn_selector)
                except Exception as e:
                    availability = False

                new_pack = CigarPack()
                new_pack['name'] = pack_name
                new_pack['price'] = price
                new_pack['availability'] = availability
                pack_data.append(dict(new_pack))

                # Reopen the Select2 dropdown for the next iteration
                select2_container = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, select2_container_css)))
                select2_container.click()
        except Exception as e:
            print(f"Error initializing select2 elements: {str(e)}")
        return pack_data




# Parse() method. Keeping in cases needed later
# ======================================================
        # brand_list = []
        # current_brand = None
        # brand_name = ''
        # brands = response.css('ul.brandlisting')
        # for element in brands.css('li.brandli'):
        #     if element.css('a > b.cdkgray'): # Main brand
        #         if current_brand:
        #             # Append the previous brand's data to the brand list
        #             brand_list.append(current_brand)
                    
        #         # Start a new current_brand dictionary
        #         brand_name = element.css('a > b.cdkgray ::text').get().strip()
        #         current_brand = {'brand_name': brand_name, 'urls': []}
        #     else:
        #         if current_brand:
        #             link = element.css('a ::attr(href)').get()
        #             # sub_brand = element.css('a ::text').get().strip()
        #             # yield response.follow(link, self.parse_cigar_page, cb_kwargs={'brand': brand_name})
        #             current_brand['urls'].append(link)
        
        # if current_brand:
        #     # Append the last brand's data to the brand list
        #     brand_list.append(current_brand)
                
        # for brand in brand_list:
        #     for link in brand['urls']:
        #         yield response.follow(link, self.parse_cigar_page, cb_kwargs={'brand': brand['brand_name']})
