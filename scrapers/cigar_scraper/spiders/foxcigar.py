
# 106 total cigar pages
# 21 items per page
# https://foxcigar.com/product-category/cigars/page/106

# Scrap packs from the product card - not from product page
# Strength, origin, shape are not available

import scrapy
from cigar_scraper.items import CigarScraperItem, CigarPack
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import undetected_chromedriver as uc
import time
import ssl
from urllib.parse import urlparse, parse_qs

class FamousSmokeSpider(scrapy.Spider):
    name = "foxcigar"
    allowed_domains = ["foxcigar.com"]
    start_urls = ["https://foxcigar.com/product-category/cigars"]
    # start_urls = ["https://foxcigar.com/shop/cigars/foxtail/foxtail-barber-pole/"]
    

    # def __init__(self, *args, **kwargs):
    #     super(FamousSmokeSpider, self).__init__(*args, **kwargs)
    #     chrome_options = uc.ChromeOptions()
    #     chrome_options.add_argument(str("--headless"))
    #     chrome_options.add_argument("--disable-gpu")
    #     chrome_options.add_argument("--no-sandbox")
    #     chrome_options.add_argument("--disable-dev-shm-usage")
    #     chrome_options.add_argument("--log-level=3")
    #     chrome_options.add_argument("--enable-javascript")
    #     chrome_options.add_argument("--disable-images")
    #     driver_path = "chromedriver-mac-x64/chromedriver"
    #     # ssl._create_default_https_context = ssl._create_unverified_context
    #     self.driver = uc.Chrome(driver_executable_path=driver_path, options=chrome_options)

    def parse(self, response):
        # link = 'https://foxcigar.com/shop/cigars/plasencia/plasencia-alma-fuerte-generacion-v-salomon/'
        # data = {'name': 'cigar_name', 'packs': [{'name': 'Box'}]}
        # yield response.follow(link, self.parse_prod_page, cb_kwargs={'cigar_data': dict(data)})

        # cat = response.css('.product-categories > li.cat-item.current-cat.cat-parent > ul.children > li.cat-item')
        # category_urls = cat.css('a ::attr(href)').get()

        # ======================================
        item_cards = response.css('.products.elements-grid.basel-products-holder.grid-columns-3 .product-grid-item')
        print('Products::::::: ', len(item_cards))

        for item in item_cards:
            cigar_name = item.css('h3.product-title > a ::text').get()
            prod_url = item.css('h3.product-title > a ::attr(href)').get()

            cigar_packs = []
            if item.css('ul.variation-options'):
                variations = item.css('ul.variation-options > li')
                for variation in variations:
                    pack_name = variation.css('span:nth-child(1) ::text').get()
                    if variation.css('ins'):
                        price = variation.css('ins > span.woocommerce-Price-amount.amount ::text').getall()
                    else:
                        price = variation.css('span.woocommerce-Price-amount.amount ::text').getall()
                    price = ''.join(price)
                    availability = variation.css('.instock ::text').get()
                    if not availability:
                        availability = variation.css('.outstock ::text').get()

                    new_pack = CigarPack()
                    new_pack['name'] = pack_name
                    new_pack['price'] = price
                    new_pack['availability'] = availability
                    cigar_packs.append(dict(new_pack))

                data = {'name': cigar_name, 'packs': cigar_packs}
                yield response.follow(prod_url, self.parse_prod_page, cb_kwargs={'cigar_data': dict(data)})


        next_page_url = response.css('.products-footer > a.btn.basel-load-more ::attr(href)').get()
        if next_page_url:
            yield response.follow(next_page_url, callback=self.parse)


    def parse_prod_page(self, response, cigar_data):
        attributes = {}
        summary = response.css('.summary-inner')
        if summary.css('div.woocommerce-product-details__short-description'):
            details = summary.css('div.woocommerce-product-details__short-description p:nth-child(1)')
        else:
            details = summary.css('div.woocommerce-variation-description p:nth-child(1)')
        for element in details.css('strong'):
            key = element.xpath('text()').get().strip().rstrip(':').lower().replace(' ', '-')
            value = element.xpath('following-sibling::text()').get().strip()
            attributes[key] = value
        brand = summary.css('.product_meta .posted_in > a ::text').getall()

        product = CigarScraperItem()
        product['name'] = cigar_data['name']
        product['prod_url'] = response.url
        product['brand'] = ', '.join(brand)
        size = attributes.get('size')
        if size:
            size = size.lower().split('x')
            size = [item.strip().replace('\xa0', '') for item in size]
            if len(size) >= 2:
                for item in size: # Order of values could be differnt, find correct ring & len value
                    try:
                        if int(item) > 10:
                            product['ring'] = item
                        else:
                            product['length'] = item
                    except:
                        product['length'] = item
        
        pack_size = ''
        if attributes.get('pack-count'):
            pack_size = attributes.get('pack-count')
        elif attributes.get('box-count'):
            pack_size = attributes.get('box-count')
        elif attributes.get('bundle-count'):
            pack_size = attributes.get('bundle-count')
        
        # ============================================
        # if not len(cigar_data.get('packs')) > 0:

        #     # Not have multiple packs
        #     price = summary.css('p.price ins > span.woocommerce-Price-amount.amount ::text').getall()
        #     price = ''.join(price).strip()
        #     availability = summary.css('.stock ::text').get()

        #     new_pack = CigarPack()
        #     new_pack['name'] = ('Box of ' + pack_size) if pack_size else 'Box'
        #     new_pack['price'] = price
        #     new_pack['availability'] = availability

        #     cigar_data['packs'].append(dict(new_pack))
        # else:
        # ============================================
        for pack in cigar_data['packs']:
            if pack['name'] == 'Box' or pack['name'] == 'Bundle' or pack['name'] == 'Pack':
                pack['name'] = (pack_size + '-' + pack['name']) if pack_size else pack['name']
        product['packs'] = cigar_data['packs']
        yield product


    # >>>>>>>>>>>> KEEPING IT HERE FOR NOW IN CASE NEEDED LATER <<<<<<<<<<<<<<<<
    # def handle_packs_select(self, response):
    #     self.driver.get(response.url)
    #     wait = WebDriverWait(self.driver, 10)

    #     pack_data = []
    #     select2_container_css = "#current-item-dropdown .select2-container"
    #     options_css = 'li.select2-results__option'
    #     price_selector = '#current-item-pricing span.subtitle.oswald.cblack.itemprice'
    #     cart_btn_selector = '#current-item-buy a.cartbtn.yellowblack'
    #     try:
    #         # Locate the Select2 container
    #         select2_container = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, select2_container_css)))
    #         select2_container.click() # Click on the Select2 container to open the dropdown
            
    #         # Locate the options within the opened dropdown
    #         options = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, options_css)))

    #         for index, option in enumerate(options):
    #             options = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, options_css)))
    #             pack_name = options[index].text
    #             options[index].click()
    #             time.sleep(1) # Wait a bit to allow the price to update
    #             price_element = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, price_selector)))
    #             price = price_element.text

    #             availability = True
    #             try:
    #                self.driver.find_element(By.CSS_SELECTOR, cart_btn_selector)
    #             except Exception as e:
    #                 availability = False

    #             new_pack = CigarPack()
    #             new_pack['name'] = pack_name
    #             new_pack['price'] = price
    #             new_pack['availability'] = availability
    #             pack_data.append(dict(new_pack))

    #             # Reopen the Select2 dropdown for the next iteration
    #             select2_container = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, select2_container_css)))
    #             select2_container.click()
    #     except Exception as e:
    #         print(f"Error initializing select2 elements: {str(e)}")

    #     return pack_data

